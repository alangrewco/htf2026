from sqlalchemy import select

from app.models import PortRecord, RouteRecord, ShipmentRecord, SkuRecord, SupplierRecord


class ReferenceRepository:
    def __init__(self, session):
        self.session = session

    def list_skus(self):
        return self.session.execute(select(SkuRecord).order_by(SkuRecord.created_at.asc())).scalars().all()

    def get_sku(self, sku_id: str):
        return self.session.get(SkuRecord, sku_id)

    def get_sku_by_code(self, sku_code: str):
        return self.session.execute(select(SkuRecord).where(SkuRecord.sku_code == sku_code)).scalar_one_or_none()

    def create_sku(self, record: SkuRecord):
        self.session.add(record)
        self.session.flush()
        return record

    def list_suppliers(self):
        return self.session.execute(select(SupplierRecord).order_by(SupplierRecord.created_at.asc())).scalars().all()

    def get_supplier(self, supplier_id: str):
        return self.session.get(SupplierRecord, supplier_id)

    def get_supplier_by_code(self, supplier_code: str):
        return self.session.execute(select(SupplierRecord).where(SupplierRecord.supplier_code == supplier_code)).scalar_one_or_none()

    def create_supplier(self, record: SupplierRecord):
        self.session.add(record)
        self.session.flush()
        return record

    def list_shipments(self):
        return self.session.execute(select(ShipmentRecord).order_by(ShipmentRecord.created_at.asc())).scalars().all()

    def get_shipment(self, shipment_id: str):
        return self.session.get(ShipmentRecord, shipment_id)

    def get_shipment_by_code(self, shipment_code: str):
        return self.session.execute(select(ShipmentRecord).where(ShipmentRecord.shipment_code == shipment_code)).scalar_one_or_none()

    def create_shipment(self, record: ShipmentRecord):
        self.session.add(record)
        self.session.flush()
        return record

    def list_ports(self):
        return self.session.execute(select(PortRecord).order_by(PortRecord.id.asc())).scalars().all()

    def list_routes(self):
        return self.session.execute(select(RouteRecord).order_by(RouteRecord.id.asc())).scalars().all()

    def port_exists(self, port_id: str) -> bool:
        return self.session.get(PortRecord, port_id) is not None

    def route_exists(self, route_id: str) -> bool:
        return self.session.get(RouteRecord, route_id) is not None

    def supplier_exists(self, supplier_id: str) -> bool:
        return self.session.get(SupplierRecord, supplier_id) is not None

    def sku_ids_exist(self, sku_ids: list[str]) -> list[str]:
        if not sku_ids:
            return []
        rows = self.session.execute(select(SkuRecord.id).where(SkuRecord.id.in_(sku_ids))).scalars().all()
        existing = set(rows)
        return [sku_id for sku_id in sku_ids if sku_id not in existing]
