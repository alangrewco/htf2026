import json
import time

from flask import Response, request, stream_with_context
from flask.views import MethodView
from flask_smorest import Blueprint

from extensions import limiter
from models import RiskEvent

SSE_TIMEOUT_SECONDS = 30 * 60  # 30 minutes max per SSE connection

blp = Blueprint("stream", __name__, url_prefix="/api/stream", description="SSE stream")


def _event_to_dict(event: RiskEvent) -> dict:
    return {
        "id": event.id,
        "event_type": event.event_type,
        "title": event.title,
        "summary": event.summary,
        "severity": event.severity,
        "source": event.source,
        "source_url": event.source_url,
        "impacted_ports": event.impacted_ports,
        "impacted_countries": event.impacted_countries,
        "created_at": event.created_at.isoformat(),
    }


@blp.route("/events")
class EventStreamResource(MethodView):
    decorators = [limiter.limit("2/minute")]

    @blp.doc(tags=["stream"])
    def get(self):
        min_severity = int(request.args.get("min_severity", 0))
        event_type = request.args.get("type")
        backfill = max(0, min(int(request.args.get("backfill", 50)), 200))
        backfill_order = request.args.get("backfill_order", "desc")

        def generate():
            last_id = 0
            start_time = time.time()

            # Send recent events first so clients can render an initial terminal snapshot.
            if backfill > 0:
                backfill_query = RiskEvent.query.filter(RiskEvent.severity >= min_severity)
                if event_type:
                    backfill_query = backfill_query.filter(RiskEvent.event_type == event_type)

                backfill_events = backfill_query.order_by(RiskEvent.id.desc()).limit(backfill).all()
                if backfill_order == "asc":
                    backfill_events = list(reversed(backfill_events))

                for event in backfill_events:
                    payload_dict = _event_to_dict(event)
                    payload_dict["stream_phase"] = "backfill"
                    payload = json.dumps(payload_dict, ensure_ascii=False)
                    yield f"event: risk_event\ndata: {payload}\n\n"
                    last_id = max(last_id, event.id)

            while time.time() - start_time < SSE_TIMEOUT_SECONDS:
                query = RiskEvent.query.filter(
                    RiskEvent.id > last_id, RiskEvent.severity >= min_severity
                ).order_by(RiskEvent.id.asc())
                if event_type:
                    query = query.filter(RiskEvent.event_type == event_type)
                events = query.limit(50).all()
                if events:
                    for event in events:
                        payload_dict = _event_to_dict(event)
                        payload_dict["stream_phase"] = "live"
                        payload = json.dumps(payload_dict, ensure_ascii=False)
                        yield f"event: risk_event\ndata: {payload}\n\n"
                        last_id = max(last_id, event.id)
                else:
                    yield ": heartbeat\n\n"
                time.sleep(1)

        return Response(stream_with_context(generate()), mimetype="text/event-stream")
