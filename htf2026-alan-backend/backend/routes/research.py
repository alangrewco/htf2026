import json
import os
import time

from flask import Response, abort, request, stream_with_context
from flask.views import MethodView
from flask_smorest import Blueprint
from sqlalchemy import func

from extensions import limiter
from models import ResearchFinding, ResearchTask, RiskEvent, db
from schemas import (
    ResearchBulkTaskCreateResponseSchema,
    ResearchBulkTaskCreateSchema,
    ResearchFindingSchema,
    ResearchProgressSchema,
    ResearchTaskCreateSchema,
    ResearchTaskSchema,
)

SSE_PROGRESS_TIMEOUT = 10 * 60  # 10 minutes

blp = Blueprint("research", __name__, url_prefix="/api/research", description="Research")


@blp.route("/tasks/bulk")
class ResearchTaskBulkCreateResource(MethodView):
    decorators = [limiter.limit("5/minute")]
    @blp.arguments(ResearchBulkTaskCreateSchema)
    @blp.response(200, ResearchBulkTaskCreateResponseSchema)
    @blp.doc(tags=["research"])
    def post(self, payload):
        mode = payload["mode"]
        requested_ids = payload.get("event_ids", [])
        filter_payload = payload.get("filter")

        apply_filter = filter_payload is not None or not requested_ids
        if not filter_payload:
            filter_payload = {
                "event_type": "NEWS",
                "min_severity": 0,
                "limit": 1000,
                "only_unenriched": True,
            }

        requested_count = len(requested_ids)
        invalid_event_ids = []
        candidate_ids = set()

        if requested_ids:
            existing_ids = {
                row[0]
                for row in db.session.query(RiskEvent.id)
                .filter(RiskEvent.id.in_(requested_ids))
                .all()
            }
            invalid_event_ids = sorted(set(requested_ids) - existing_ids)
            candidate_ids.update(existing_ids)

        if apply_filter:
            filtered_query = db.session.query(RiskEvent.id).filter(
                RiskEvent.severity >= filter_payload["min_severity"]
            )
            if filter_payload["event_type"]:
                filtered_query = filtered_query.filter(
                    RiskEvent.event_type == filter_payload["event_type"]
                )
            if filter_payload["only_unenriched"]:
                filtered_query = filtered_query.filter(
                    ~RiskEvent.id.in_(db.session.query(ResearchFinding.event_id))
                )
            filtered_ids = [row[0] for row in filtered_query.limit(filter_payload["limit"]).all()]
            candidate_ids.update(filtered_ids)

        candidate_count = len(candidate_ids)
        if candidate_count == 0:
            return {
                "requested_count": requested_count,
                "candidate_count": 0,
                "created_count": 0,
                "skipped_already_enriched": 0,
                "skipped_duplicate_task": 0,
                "invalid_event_ids": invalid_event_ids,
                "created_task_ids": [],
            }

        enriched_ids = set()
        if filter_payload["only_unenriched"]:
            enriched_ids = {
                row[0]
                for row in db.session.query(ResearchFinding.event_id)
                .filter(ResearchFinding.event_id.in_(candidate_ids))
                .distinct()
                .all()
            }

        remaining_after_enriched = candidate_ids - enriched_ids
        duplicate_task_ids = {
            row[0]
            for row in db.session.query(ResearchTask.event_id)
            .filter(
                ResearchTask.event_id.in_(remaining_after_enriched),
                ResearchTask.status.in_(["queued", "running"]),
            )
            .distinct()
            .all()
        }

        final_event_ids = sorted(remaining_after_enriched - duplicate_task_ids)
        created_tasks = [
            ResearchTask(event_id=event_id, mode=mode, status="queued")
            for event_id in final_event_ids
        ]
        db.session.add_all(created_tasks)
        db.session.commit()

        return {
            "requested_count": requested_count,
            "candidate_count": candidate_count,
            "created_count": len(created_tasks),
            "skipped_already_enriched": len(enriched_ids),
            "skipped_duplicate_task": len(duplicate_task_ids),
            "invalid_event_ids": invalid_event_ids,
            "created_task_ids": [task.id for task in created_tasks],
        }


@blp.route("/tasks")
class ResearchTaskCreateResource(MethodView):
    decorators = [limiter.limit("5/minute")]
    @blp.arguments(ResearchTaskCreateSchema)
    @blp.response(201, ResearchTaskSchema)
    @blp.doc(tags=["research"])
    def post(self, payload):
        event = RiskEvent.query.get(payload["event_id"])
        if not event:
            abort(404, "Event not found")

        task = ResearchTask(event_id=payload["event_id"], mode=payload["mode"], status="queued")
        db.session.add(task)
        db.session.commit()
        return task


@blp.route("/tasks/<int:task_id>")
class ResearchTaskDetailResource(MethodView):
    @blp.response(200, ResearchTaskSchema)
    @blp.doc(tags=["research"])
    def get(self, task_id: int):
        task = ResearchTask.query.get(task_id)
        if not task:
            abort(404, "Task not found")
        return task


@blp.route("/findings")
class ResearchFindingsResource(MethodView):
    @blp.response(200, ResearchFindingSchema(many=True))
    @blp.doc(tags=["research"])
    def get(self):
        event_id = request.args.get("event_id", type=int)
        query = ResearchFinding.query
        if event_id is not None:
            query = query.filter_by(event_id=event_id)
        return query.order_by(ResearchFinding.id.asc()).all()


def _research_progress_snapshot() -> dict:
    counts = dict(
        db.session.query(ResearchTask.status, func.count(ResearchTask.id))
        .group_by(ResearchTask.status)
        .all()
    )
    queued = int(counts.get("queued", 0))
    running = int(counts.get("running", 0))
    done = int(counts.get("done", 0))
    failed = int(counts.get("failed", 0))
    total = queued + running + done + failed

    last_processed_at = (
        db.session.query(func.max(ResearchTask.updated_at))
        .filter(ResearchTask.status.in_(["done", "failed"]))
        .scalar()
    )

    failure_rows = (
        ResearchTask.query.filter_by(status="failed")
        .order_by(ResearchTask.updated_at.desc())
        .limit(5)
        .all()
    )
    recent_failures = [
        {"task_id": row.id, "error": row.error, "updated_at": row.updated_at}
        for row in failure_rows
    ]

    return {
        "queued": queued,
        "running": running,
        "done": done,
        "failed": failed,
        "total": total,
        "last_processed_at": last_processed_at,
        "recent_failures": recent_failures,
        "worker_config": {
            "max_workers": int(os.getenv("ENRICHMENT_MAX_WORKERS", "1")),
            "batch_size": int(os.getenv("ENRICHMENT_BATCH_SIZE", "200")),
        },
    }


@blp.route("/progress")
class ResearchProgressResource(MethodView):
    @blp.response(200, ResearchProgressSchema)
    @blp.doc(tags=["research"])
    def get(self):
        return _research_progress_snapshot()


@blp.route("/stream/progress")
class ResearchProgressStreamResource(MethodView):
    @blp.doc(tags=["research"])
    def get(self):
        interval_seconds = max(1, int(request.args.get("interval_seconds", 1)))

        def generate():
            _stream_start = time.time()
            while time.time() - _stream_start < SSE_PROGRESS_TIMEOUT:
                snapshot = _research_progress_snapshot()
                payload = json.dumps(snapshot, default=str, ensure_ascii=False)
                yield f"event: progress_snapshot\ndata: {payload}\n\n"
                time.sleep(interval_seconds)

        return Response(stream_with_context(generate()), mimetype="text/event-stream")
