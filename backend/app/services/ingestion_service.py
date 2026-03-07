import os
import threading
import time
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.bootstrap import initialize_database
from app.db import session_scope
from app.errors import NotFoundError
from app.ingestion.base import IngestionSource
from app.ingestion.dedupe import content_hash, dedupe_candidates
from app.ingestion.sources.gdelt import GdeltSource
from app.ingestion.sources.guardian import GuardianSource
from app.ingestion.sources.mock import MockSource
from app.ingestion.sources.noaa_alerts import NoaaAlertsSource
from app.ingestion.sources.usgs_quakes import UsgsQuakesSource
from app.models import ArticleRecord, IngestionRunRecord
from app.repositories.article_repo import ArticleRepository
from app.repositories.ingestion_repo import IngestionRepository
from app.services.enrichment_service import EnrichmentService

from openapi_server.models.ingestion_run import IngestionRun
from openapi_server.models.ingestion_run_list_response import IngestionRunListResponse
from openapi_server.models.ingestion_run_queued_response import IngestionRunQueuedResponse
from openapi_server.models.ingestion_stats import IngestionStats
from openapi_server.models.ingestion_status import IngestionStatus

RUN_STATUS_QUEUED = "queued"
RUN_STATUS_RUNNING = "running"
RUN_STATUS_COMPLETED = "completed"
RUN_STATUS_FAILED = "failed"


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


class IngestionService:
    _initialized = False
    _run_lock = threading.Lock()

    def __init__(self):
        self._scheduler_thread = None
        self._stop_scheduler = threading.Event()
        self._next_scheduled_run_at = None
        self._scheduler_started = False
        self._enrichment_service = EnrichmentService()

    def _ensure_initialized(self):
        if not self.__class__._initialized:
            initialize_database()
            self.__class__._initialized = True
        # Ensure enrichment dispatcher bootstraps with the app.
        self._enrichment_service.ensure_started()
        self._ensure_scheduler_started()

    def _ensure_scheduler_started(self):
        if self._scheduler_started:
            return
        polling_disabled = _env_bool("INGESTION_POLLING_DISABLED", False)
        if polling_disabled:
            self._scheduler_started = True
            self._next_scheduled_run_at = None
            return

        self._scheduler_started = True
        self._scheduler_thread = threading.Thread(target=self._scheduler_loop, name="ingestion-scheduler", daemon=True)
        self._scheduler_thread.start()

    def _scheduler_loop(self):
        interval_min = int(os.getenv("INGESTION_SCHEDULER_INTERVAL_MIN", "10"))
        while not self._stop_scheduler.is_set():
            now = _utcnow_naive()
            self._next_scheduled_run_at = now + timedelta(minutes=interval_min)

            if not self.__class__._run_lock.locked():
                self.create_ingestion_run(max_articles=int(os.getenv("INGESTION_SCHEDULED_MAX_ARTICLES", "100")))

            # responsive sleep for shutdown
            for _ in range(interval_min * 60):
                if self._stop_scheduler.is_set():
                    return
                time.sleep(1)

    def _build_sources(self) -> list[IngestionSource]:
        mode = os.getenv("INGESTION_SOURCE_MODE", "live").strip().lower()
        if mode == "mock":
            return [MockSource()]

        sources: list[IngestionSource] = []
        query = os.getenv(
            "INGESTION_NEWS_QUERY",
            "shipping OR port OR logistics OR supply chain OR freight disruption",
        )
        region = os.getenv("INGESTION_REGION_FOCUS", "US,CA")
        region_countries = [s.strip().upper() for s in region.split(",") if s.strip()]
        noaa_areas_env = os.getenv("INGESTION_NOAA_AREAS", "").strip()
        if noaa_areas_env:
            area_codes = [c.strip().upper() for c in noaa_areas_env.split(",") if c.strip()]
        else:
            area_codes = [c for c in region_countries if len(c) == 2] or ["CA", "WA", "TX", "NY", "FL"]

        if _env_bool("INGESTION_ENABLE_GDELT", True):
            sources.append(GdeltSource(query=query, region_countries=region_countries))

        guardian_key = os.getenv("GUARDIAN_API_KEY", "").strip()
        if _env_bool("INGESTION_ENABLE_GUARDIAN", True) and guardian_key:
            sources.append(GuardianSource(api_key=guardian_key, query=query))

        if _env_bool("INGESTION_ENABLE_NOAA", True):
            sources.append(NoaaAlertsSource(area_codes=area_codes))

        if _env_bool("INGESTION_ENABLE_USGS", True):
            sources.append(UsgsQuakesSource())

        return sources

    def create_ingestion_run(self, max_articles: int) -> IngestionRunQueuedResponse:
        self._ensure_initialized()
        run_id = uuid4().hex
        now = _utcnow_naive()
        with session_scope() as session:
            repo = IngestionRepository(session)
            repo.create_run(
                IngestionRunRecord(
                    id=run_id,
                    status=RUN_STATUS_QUEUED,
                    started_at=now,
                    finished_at=None,
                    created_at=now,
                    articles_ingested=0,
                    articles_relevant=0,
                    incidents_created=0,
                    proposals_generated=0,
                    error=None,
                )
            )

        worker = threading.Thread(target=self._execute_run, args=(run_id, max_articles), daemon=True)
        worker.start()
        return IngestionRunQueuedResponse(run_id=run_id, status=RUN_STATUS_QUEUED)

    def _execute_run(self, run_id: str, max_articles: int):
        with self.__class__._run_lock:
            with session_scope() as session:
                repo = IngestionRepository(session)
                run = repo.get_run(run_id)
                if not run:
                    return
                run.status = RUN_STATUS_RUNNING
                run.started_at = _utcnow_naive()

            total_inserted = 0
            errors = []
            max_per_source = max(1, int(max_articles / 4)) if max_articles > 1 else 1

            sources = self._build_sources()
            for source in sources:
                if total_inserted >= max_articles:
                    break
                try:
                    remaining = min(max_per_source, max_articles - total_inserted)
                    candidates = source.fetch(remaining)
                    deduped = dedupe_candidates(candidates)
                    inserted = self._persist_candidates(run_id, deduped, max_articles - total_inserted)
                    total_inserted += inserted
                except Exception as err:
                    errors.append(f"{source.source_name}: {err}")
                finally:
                    with session_scope() as session:
                        repo = IngestionRepository(session)
                        repo.upsert_checkpoint(source.source_name, cursor=None, polled_at=_utcnow_naive())

            with session_scope() as session:
                repo = IngestionRepository(session)
                run = repo.get_run(run_id)
                if not run:
                    return
                run.articles_ingested = total_inserted
                run.articles_relevant = 0
                run.incidents_created = 0
                run.proposals_generated = 0
                run.finished_at = _utcnow_naive()
                # Source-level errors are non-fatal when at least one source ingested data.
                run.status = RUN_STATUS_COMPLETED if (total_inserted > 0 or not errors) else RUN_STATUS_FAILED
                run.error = "; ".join(errors) if errors else None

    def _persist_candidates(self, run_id: str, candidates, remaining_capacity: int) -> int:
        inserted = 0
        inserted_article_ids = []
        with session_scope() as session:
            article_repo = ArticleRepository(session)
            for candidate in candidates:
                if inserted >= remaining_capacity:
                    break
                if article_repo.get_article_by_source_url(candidate.source, candidate.source_url):
                    continue
                chash = content_hash(candidate)
                if article_repo.get_article_by_content_hash(chash):
                    continue

                now = _utcnow_naive()
                article = ArticleRecord(
                    id=uuid4().hex,
                    source=candidate.source,
                    source_url=candidate.source_url,
                    headline=candidate.headline[:2000],
                    title=candidate.headline[:2000],
                    summary="",
                    preview_text=(candidate.body or candidate.headline)[:500],
                    analysis="",
                    keywords_json=[],
                    tags_json=[],
                    source_name=candidate.source,
                    body=(candidate.body or candidate.headline)[:10000],
                    published_at=candidate.published_at,
                    publish_datetime=candidate.published_at,
                    preview_image_url=None,
                    ingestion_run_id=run_id,
                    processing_state="raw",
                    external_id=candidate.external_id,
                    content_hash=chash,
                    region_tags_json=candidate.region_tags or [],
                    created_at=now,
                    updated_at=now,
                )
                row = article_repo.create_article(article)
                inserted_article_ids.append(row.id)
                inserted += 1

        for article_id in inserted_article_ids:
            self._enrichment_service.enqueue_article(article_id)

        return inserted

    def get_ingestion_run(self, run_id: str) -> IngestionRun:
        self._ensure_initialized()
        with session_scope() as session:
            repo = IngestionRepository(session)
            row = repo.get_run(run_id)
            if not row:
                raise NotFoundError("Ingestion run not found.", {"run_id": run_id})
            return self._to_model(row)

    def get_ingestion_status(self) -> IngestionStatus:
        self._ensure_initialized()
        with session_scope() as session:
            repo = IngestionRepository(session)
            last = repo.get_last_run()
            return IngestionStatus(
                last_run=self._to_model(last) if last else None,
                next_scheduled_run_at=self._next_scheduled_run_at,
            )

    def list_ingestion_runs(self, page: int, page_size: int) -> IngestionRunListResponse:
        self._ensure_initialized()
        with session_scope() as session:
            repo = IngestionRepository(session)
            rows, total = repo.list_runs(page=page, page_size=page_size)
            return IngestionRunListResponse(
                items=[self._to_model(r) for r in rows],
                total=total,
                page=page,
                page_size=page_size,
            )

    def _to_model(self, row: IngestionRunRecord) -> IngestionRun:
        return IngestionRun(
            id=row.id,
            status=row.status,
            started_at=row.started_at,
            finished_at=row.finished_at,
            created_at=row.created_at,
            stats=IngestionStats(
                articles_ingested=row.articles_ingested,
                articles_relevant=row.articles_relevant,
                incidents_created=row.incidents_created,
                proposals_generated=row.proposals_generated,
            ),
            error=row.error,
        )
