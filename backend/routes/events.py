from datetime import datetime

from flask import abort
from flask.views import MethodView
from flask_smorest import Blueprint
from marshmallow import Schema, fields
from sqlalchemy import func

from models import RiskEvent
from schemas import EventSummarySchema, RiskEventSchema

blp = Blueprint("events", __name__, url_prefix="/api/events", description="Risk events")


class EventQuerySchema(Schema):
    since = fields.DateTime(required=False)
    type = fields.String(required=False)
    min_severity = fields.Integer(required=False, load_default=0)
    limit = fields.Integer(required=False, load_default=200)


@blp.route("")
class EventsListResource(MethodView):
    @blp.arguments(EventQuerySchema, location="query")
    @blp.response(200, RiskEventSchema(many=True))
    @blp.doc(tags=["events"])
    def get(self, args):
        query = RiskEvent.query
        if args.get("since"):
            query = query.filter(RiskEvent.created_at >= args["since"])
        if args.get("type"):
            query = query.filter(RiskEvent.event_type == args["type"])
        query = query.filter(RiskEvent.severity >= args.get("min_severity", 0))
        limit = min(args.get("limit", 200), 500)
        return query.order_by(RiskEvent.created_at.desc()).limit(limit).all()


@blp.route("/<int:event_id>")
class EventsDetailResource(MethodView):
    @blp.response(200, RiskEventSchema)
    @blp.doc(tags=["events"])
    def get(self, event_id: int):
        event = RiskEvent.query.get(event_id)
        if not event:
            abort(404, "Event not found")
        return event


@blp.route("/summary")
class EventsSummaryResource(MethodView):
    @blp.response(200, EventSummarySchema)
    @blp.doc(tags=["events"])
    def get(self):
        events = RiskEvent.query.all()
        total = len(events)
        by_type = {}
        by_bucket = {"0-29": 0, "30-59": 0, "60-79": 0, "80-100": 0}
        port_counts = {}
        country_counts = {}

        for event in events:
            by_type[event.event_type] = by_type.get(event.event_type, 0) + 1
            if event.severity < 30:
                by_bucket["0-29"] += 1
            elif event.severity < 60:
                by_bucket["30-59"] += 1
            elif event.severity < 80:
                by_bucket["60-79"] += 1
            else:
                by_bucket["80-100"] += 1

            for port in event.impacted_ports or []:
                port_counts[port] = port_counts.get(port, 0) + 1
            for country in event.impacted_countries or []:
                country_counts[country] = country_counts.get(country, 0) + 1

        top_ports = [
            {"key": key, "count": count}
            for key, count in sorted(port_counts.items(), key=lambda item: item[1], reverse=True)[:5]
        ]
        top_countries = [
            {"key": key, "count": count}
            for key, count in sorted(country_counts.items(), key=lambda item: item[1], reverse=True)[:5]
        ]

        return {
            "total": total,
            "by_type": by_type,
            "by_severity_bucket": by_bucket,
            "top_ports": top_ports,
            "top_countries": top_countries,
        }
