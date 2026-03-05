from flask import abort
from flask.views import MethodView
from flask_smorest import Blueprint

from models import Shipment
from schemas import RiskEventSchema, ShipmentSchema
from services.event_matcher import matched_events_for_shipment

blp = Blueprint("shipments", __name__, url_prefix="/api/shipments", description="Shipments")


@blp.route("")
class ShipmentListResource(MethodView):
    @blp.response(200, ShipmentSchema(many=True))
    @blp.doc(tags=["shipments"])
    def get(self):
        return Shipment.query.order_by(Shipment.id.asc()).all()


@blp.route("/<int:shipment_id>")
class ShipmentDetailResource(MethodView):
    @blp.response(200, ShipmentSchema)
    @blp.doc(tags=["shipments"])
    def get(self, shipment_id: int):
        shipment = Shipment.query.get(shipment_id)
        if not shipment:
            abort(404, "Shipment not found")
        return shipment


@blp.route("/<int:shipment_id>/risks")
class ShipmentRisksResource(MethodView):
    @blp.response(200, RiskEventSchema(many=True))
    @blp.doc(tags=["shipments"])
    def get(self, shipment_id: int):
        shipment = Shipment.query.get(shipment_id)
        if not shipment:
            abort(404, "Shipment not found")
        return matched_events_for_shipment(shipment)
