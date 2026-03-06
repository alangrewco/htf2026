import os
import threading
import time
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4

from app.adk.enrichment_agent import GeminiEnrichmentAgent
from app.bootstrap import initialize_database
from app.db import session_scope
from app.models import ArticleEnrichmentJobRecord
from app.repositories.article_repo import ArticleRepository
from app.repositories.enrichment_repo import EnrichmentRepository
from app.repositories.reference_repo import ReferenceRepository


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


class EnrichmentService:
    _initialized = False
    _dispatcher_started = False
    _dispatcher_lock = threading.Lock()
    _quota_lock = threading.Lock()

    def __init__(self):
        self._stop = threading.Event()
        self._active_job_ids: set[str] = set()
        self._active_lock = threading.Lock()
        self._agent = GeminiEnrichmentAgent()

    def ensure_started(self):
        self._ensure_initialized()

    def _ensure_initialized(self):
        if not self.__class__._initialized:
            initialize_database()
            self.__class__._initialized = True
        self._ensure_dispatcher_started()

    def _ensure_dispatcher_started(self):
        if self.__class__._dispatcher_started:
            return
        with self.__class__._dispatcher_lock:
            if self.__class__._dispatcher_started:
                return
            if not _env_bool("ENRICHMENT_WORKER_ENABLED", True):
                self.__class__._dispatcher_started = True
                return
            thread = threading.Thread(target=self._dispatcher_loop, name="enrichment-dispatcher", daemon=True)
            thread.start()
            self.__class__._dispatcher_started = True

    def enqueue_article(self, article_id: str):
        self._ensure_initialized()
        with session_scope() as session:
            repo = EnrichmentRepository(session)
            existing = repo.get_job_by_article_id(article_id)
            now = _utcnow_naive()
            if existing is None:
                repo.create_job(
                    ArticleEnrichmentJobRecord(
                        id=uuid4().hex,
                        article_id=article_id,
                        status="queued",
                        attempt_count=0,
                        last_error=None,
                        next_retry_at=None,
                        created_at=now,
                        updated_at=now,
                    )
                )
            elif existing.status in {"done", "running", "queued"}:
                return
            else:
                existing.status = "queued"
                existing.last_error = None
                existing.next_retry_at = None
                existing.updated_at = now

    def _dispatcher_loop(self):
        interval_sec = int(os.getenv("ENRICHMENT_DISPATCHER_INTERVAL_SEC", "1"))
        while not self._stop.is_set():
            try:
                self._dispatch_ready_jobs()
            except Exception:
                pass
            time.sleep(max(1, interval_sec))

    def _dispatch_ready_jobs(self):
        now = _utcnow_naive()
        with session_scope() as session:
            repo = EnrichmentRepository(session)
            ready_job_ids = repo.list_ready_jobs(now=now, limit=200)

        for job_id in ready_job_ids:
            if self._is_job_active(job_id):
                continue
            if self._is_concurrency_saturated():
                return
            self._spawn_worker(job_id)

    def _is_concurrency_saturated(self) -> bool:
        limit = int(os.getenv("ENRICHMENT_MAX_CONCURRENCY", "0"))
        if limit <= 0:
            return False
        with self._active_lock:
            return len(self._active_job_ids) >= limit

    def _is_job_active(self, job_id: str) -> bool:
        with self._active_lock:
            return job_id in self._active_job_ids

    def _spawn_worker(self, job_id: str):
        with self._active_lock:
            self._active_job_ids.add(job_id)
        thread = threading.Thread(target=self._process_job, args=(job_id,), daemon=True)
        thread.start()

    def _process_job(self, job_id: str):
        article_id = None
        try:
            with session_scope() as session:
                repo = EnrichmentRepository(session)
                job = repo.get_job(job_id)
                if not job:
                    return
                if job.status not in {"queued", "failed"}:
                    return
                job.status = "running"
                job.updated_at = _utcnow_naive()
                article_id = job.article_id

            if not self._consume_quota_slot():
                self._requeue_due_to_cap(job_id)
                return

            with session_scope() as session:
                repo = EnrichmentRepository(session)
                job = repo.get_job(job_id)
                if not job:
                    return
                article = repo.get_article(job.article_id)
                if not article:
                    job.status = "failed"
                    job.last_error = "article_not_found"
                    job.next_retry_at = _utcnow_naive() + timedelta(minutes=5)
                    job.updated_at = _utcnow_naive()
                    return
                article_id = article.id

                article_payload = SimpleNamespace(
                    id=article.id,
                    source=article.source,
                    source_url=article.source_url,
                    headline=article.headline,
                    body=article.body,
                    published_at=article.published_at,
                    external_id=article.external_id,
                    region_tags_json=article.region_tags_json or [],
                )
                context = self._build_context(session)

            try:
                enrichment = self._agent.enrich_article(article_payload, context)
                self._persist_success(job_id=job_id, article_id=article_id, enrichment=enrichment)
            except Exception as err:
                self._persist_failure(job_id=job_id, article_id=article_id, error=str(err))
        except Exception as err:
            if article_id:
                try:
                    self._persist_failure(job_id=job_id, article_id=article_id, error=str(err))
                except Exception:
                    pass
        finally:
            with self._active_lock:
                self._active_job_ids.discard(job_id)

    def _consume_quota_slot(self) -> bool:
        cap = int(os.getenv("ENRICHMENT_MAX_ARTICLES_TOTAL", "0"))
        with self.__class__._quota_lock:
            with session_scope() as session:
                repo = EnrichmentRepository(session)
                quota = repo.get_or_create_quota()
                if cap > 0 and quota.model_calls_count >= cap:
                    return False
                quota.model_calls_count += 1
                quota.updated_at = _utcnow_naive()
                return True

    def _requeue_due_to_cap(self, job_id: str):
        with session_scope() as session:
            repo = EnrichmentRepository(session)
            job = repo.get_job(job_id)
            if not job:
                return
            job.status = "queued"
            job.last_error = "max_enrichment_cap_reached"
            job.next_retry_at = _utcnow_naive() + timedelta(minutes=10)
            job.updated_at = _utcnow_naive()

    def _persist_success(self, job_id: str, article_id: str, enrichment: dict):
        with session_scope() as session:
            enrichment_repo = EnrichmentRepository(session)
            article_repo = ArticleRepository(session)
            job = enrichment_repo.get_job(job_id)
            article = enrichment_repo.get_article(article_id)
            if not job or not article:
                return

            article_repo.upsert_enrichment(article_id, enrichment)
            article.processing_state = "enriched" if enrichment["is_relevant"] else "irrelevant"
            article.enrichment_failed = False
            article.enrichment_failed_at = None
            article.enrichment_error = None
            article.enrichment_attempt_count = (article.enrichment_attempt_count or 0) + 1
            article.updated_at = _utcnow_naive()

            if article.ingestion_run_id:
                run = enrichment_repo.get_run(article.ingestion_run_id)
                if run and enrichment["is_relevant"]:
                    run.articles_relevant = (run.articles_relevant or 0) + 1

            job.status = "done"
            job.last_error = None
            job.next_retry_at = None
            job.updated_at = _utcnow_naive()

    def _persist_failure(self, job_id: str, article_id: str, error: str):
        with session_scope() as session:
            repo = EnrichmentRepository(session)
            job = repo.get_job(job_id)
            article = repo.get_article(article_id)
            if not job or not article:
                return

            attempts = (job.attempt_count or 0) + 1
            job.attempt_count = attempts
            job.last_error = error[:4000]
            max_retries = int(os.getenv("ENRICHMENT_MAX_RETRIES", "4"))
            backoff = int(os.getenv("ENRICHMENT_RETRY_BACKOFF_SECONDS", "60"))
            if attempts >= max_retries:
                job.status = "failed"
                job.next_retry_at = None
            else:
                job.status = "failed"
                job.next_retry_at = _utcnow_naive() + timedelta(seconds=(backoff * (2 ** (attempts - 1))))
            job.updated_at = _utcnow_naive()

            article.enrichment_failed = True
            article.enrichment_failed_at = _utcnow_naive()
            article.enrichment_error = error[:4000]
            article.enrichment_attempt_count = (article.enrichment_attempt_count or 0) + 1
            article.updated_at = _utcnow_naive()

    def _build_context(self, session) -> dict:
        ref = ReferenceRepository(session)
        skus = ref.list_skus()
        suppliers = ref.list_suppliers()
        shipments = ref.list_shipments()
        ports = ref.list_ports()
        routes = ref.list_routes()
        return {
            "skus": [{"id": x.id, "sku_code": x.sku_code, "name": x.name} for x in skus],
            "suppliers": [{"id": x.id, "supplier_code": x.supplier_code, "name": x.name} for x in suppliers],
            "shipments": [{"id": x.id, "shipment_code": x.shipment_code} for x in shipments],
            "ports": [{"id": x.id, "name": x.name} for x in ports],
            "routes": [{"id": x.id, "name": x.name} for x in routes],
        }
