from datetime import datetime, timezone
from uuid import uuid4

from app.bootstrap import initialize_database
from app.db import session_scope
from app.errors import BadRequestError, ConflictError, NotFoundError, ValidationError
from app.models import ShipmentRecord, SkuRecord, SupplierRecord
from app.repositories.reference_repo import ReferenceRepository

from openapi_server.models.reference_item import ReferenceItem
from openapi_server.models.reference_list_response import ReferenceListResponse
from openapi_server.models.shipment import Shipment
from openapi_server.models.shipment_list_response import ShipmentListResponse
from openapi_server.models.sku import Sku
from openapi_server.models.sku_list_response import SkuListResponse
from openapi_server.models.supplier import Supplier
from openapi_server.models.supplier_list_response import SupplierListResponse

MASTER_STATUSES = {"active", "inactive"}
SHIPMENT_STATUSES = {"planned", "in_transit", "delayed", "delivered", "cancelled"}
SKU_RISK_LEVELS = {"critical", "high", "medium", "low"}


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ReferenceService:
    _initialized = False

    def _ensure_initialized(self):
        if not self.__class__._initialized:
            initialize_database()
            self.__class__._initialized = True

    def list_skus(self) -> SkuListResponse:
        self._ensure_initialized()
        with session_scope() as session:
            repo = ReferenceRepository(session)
            rows = repo.list_skus()
            return SkuListResponse(items=[self._to_sku(r) for r in rows], total=len(rows))

    def create_sku(self, payload) -> Sku:
        self._ensure_initialized()
        self._require(
            payload,
            ["sku_code", "name", "description", "unit_of_measure", "status", "risk_score", "risk_level", "required_qty", "category", "supplier_ids"],
        )
        status = self._validate_master_status(payload.status)
        risk_score = self._validate_risk_score(payload.risk_score)
        risk_level = self._validate_sku_risk_level(payload.risk_level)

        with session_scope() as session:
            repo = ReferenceRepository(session)
            if repo.get_sku_by_code(payload.sku_code):
                raise ConflictError("SKU code already exists.", {"sku_code": payload.sku_code})
            self._validate_supplier_ids(repo, payload.supplier_ids)

            now = _utcnow_naive()
            row = SkuRecord(
                id=uuid4().hex,
                sku_code=payload.sku_code,
                name=payload.name,
                description=payload.description,
                unit_of_measure=payload.unit_of_measure,
                status=status,
                risk_score=risk_score,
                risk_level=risk_level,
                required_qty=payload.required_qty,
                category=payload.category,
                supplier_ids_json=payload.supplier_ids,
                created_at=now,
                updated_at=now,
            )
            return self._to_sku(repo.create_sku(row))

    def update_sku(self, sku_id: str, payload) -> Sku:
        self._ensure_initialized()
        with session_scope() as session:
            repo = ReferenceRepository(session)
            row = repo.get_sku(sku_id)
            if not row:
                raise NotFoundError("SKU not found.", {"sku_id": sku_id})

            changed = False
            if payload.sku_code is not None and payload.sku_code != row.sku_code:
                existing = repo.get_sku_by_code(payload.sku_code)
                if existing and existing.id != sku_id:
                    raise ConflictError("SKU code already exists.", {"sku_code": payload.sku_code})
                row.sku_code = payload.sku_code
                changed = True
            if payload.name is not None:
                row.name = payload.name
                changed = True
            if payload.description is not None:
                row.description = payload.description
                changed = True
            if payload.unit_of_measure is not None:
                row.unit_of_measure = payload.unit_of_measure
                changed = True
            if payload.status is not None:
                row.status = self._validate_master_status(payload.status)
                changed = True
            if payload.risk_score is not None:
                row.risk_score = self._validate_risk_score(payload.risk_score)
                changed = True
            if payload.risk_level is not None:
                row.risk_level = self._validate_sku_risk_level(payload.risk_level)
                changed = True
            if payload.required_qty is not None:
                row.required_qty = payload.required_qty
                changed = True
            if payload.category is not None:
                row.category = payload.category
                changed = True
            if payload.supplier_ids is not None:
                self._validate_supplier_ids(repo, payload.supplier_ids)
                row.supplier_ids_json = payload.supplier_ids
                changed = True

            if not changed:
                raise BadRequestError("At least one field must be provided for update.")

            row.updated_at = _utcnow_naive()
            return self._to_sku(row)

    def list_suppliers(self) -> SupplierListResponse:
        self._ensure_initialized()
        with session_scope() as session:
            repo = ReferenceRepository(session)
            rows = repo.list_suppliers()
            return SupplierListResponse(items=[self._to_supplier(r) for r in rows], total=len(rows))

    def create_supplier(self, payload) -> Supplier:
        self._ensure_initialized()
        self._require(payload, ["supplier_code", "name", "country", "contact_email", "status", "region", "risk_rating"])
        status = self._validate_master_status(payload.status)

        with session_scope() as session:
            repo = ReferenceRepository(session)
            if repo.get_supplier_by_code(payload.supplier_code):
                raise ConflictError("Supplier code already exists.", {"supplier_code": payload.supplier_code})

            now = _utcnow_naive()
            row = SupplierRecord(
                id=uuid4().hex,
                supplier_code=payload.supplier_code,
                name=payload.name,
                country=payload.country,
                contact_email=payload.contact_email,
                status=status,
                region=payload.region,
                risk_rating=payload.risk_rating,
                created_at=now,
                updated_at=now,
            )
            return self._to_supplier(repo.create_supplier(row))

    def update_supplier(self, supplier_id: str, payload) -> Supplier:
        self._ensure_initialized()
        with session_scope() as session:
            repo = ReferenceRepository(session)
            row = repo.get_supplier(supplier_id)
            if not row:
                raise NotFoundError("Supplier not found.", {"supplier_id": supplier_id})

            changed = False
            if payload.supplier_code is not None and payload.supplier_code != row.supplier_code:
                existing = repo.get_supplier_by_code(payload.supplier_code)
                if existing and existing.id != supplier_id:
                    raise ConflictError("Supplier code already exists.", {"supplier_code": payload.supplier_code})
                row.supplier_code = payload.supplier_code
                changed = True
            if payload.name is not None:
                row.name = payload.name
                changed = True
            if payload.country is not None:
                row.country = payload.country
                changed = True
            if payload.contact_email is not None:
                row.contact_email = payload.contact_email
                changed = True
            if payload.status is not None:
                row.status = self._validate_master_status(payload.status)
                changed = True
            if payload.region is not None:
                row.region = payload.region
                changed = True
            if payload.risk_rating is not None:
                row.risk_rating = payload.risk_rating
                changed = True

            if not changed:
                raise BadRequestError("At least one field must be provided for update.")

            row.updated_at = _utcnow_naive()
            return self._to_supplier(row)

    def list_shipments(self) -> ShipmentListResponse:
        self._ensure_initialized()
        with session_scope() as session:
            repo = ReferenceRepository(session)
            rows = repo.list_shipments()
            return ShipmentListResponse(items=[self._to_shipment(r) for r in rows], total=len(rows))

    def create_shipment(self, payload) -> Shipment:
        self._ensure_initialized()
        self._require(
            payload,
            [
                "shipment_code",
                "status",
                "origin_port_id",
                "destination_port_id",
                "route_id",
                "supplier_id",
                "skus",
                "carrier",
                "order_date",
                "expected_delivery_date",
                "events",
            ],
        )
        status = self._validate_shipment_status(payload.status)
        order_date = self._coerce_datetime(payload.order_date)
        expected_delivery_date = self._coerce_datetime(payload.expected_delivery_date)
        events = self._normalize_events(payload.events)

        with session_scope() as session:
            repo = ReferenceRepository(session)
            if repo.get_shipment_by_code(payload.shipment_code):
                raise ConflictError("Shipment code already exists.", {"shipment_code": payload.shipment_code})

            self._validate_shipment_refs(repo, payload)
            now = _utcnow_naive()
            row = ShipmentRecord(
                id=uuid4().hex,
                shipment_code=payload.shipment_code,
                status=status,
                origin_port_id=payload.origin_port_id,
                destination_port_id=payload.destination_port_id,
                route_id=payload.route_id,
                supplier_id=payload.supplier_id,
                skus_json=payload.skus,
                carrier=payload.carrier,
                order_date=order_date,
                expected_delivery_date=expected_delivery_date,
                events_json=events,
                created_at=now,
                updated_at=now,
            )
            return self._to_shipment(repo.create_shipment(row))

    def update_shipment(self, shipment_id: str, payload) -> Shipment:
        self._ensure_initialized()
        with session_scope() as session:
            repo = ReferenceRepository(session)
            row = repo.get_shipment(shipment_id)
            if not row:
                raise NotFoundError("Shipment not found.", {"shipment_id": shipment_id})

            changed = False
            if payload.shipment_code is not None and payload.shipment_code != row.shipment_code:
                existing = repo.get_shipment_by_code(payload.shipment_code)
                if existing and existing.id != shipment_id:
                    raise ConflictError("Shipment code already exists.", {"shipment_code": payload.shipment_code})
                row.shipment_code = payload.shipment_code
                changed = True
            if payload.status is not None:
                row.status = self._validate_shipment_status(payload.status)
                changed = True
            if payload.origin_port_id is not None:
                row.origin_port_id = payload.origin_port_id
                changed = True
            if payload.destination_port_id is not None:
                row.destination_port_id = payload.destination_port_id
                changed = True
            if payload.route_id is not None:
                row.route_id = payload.route_id
                changed = True
            if payload.supplier_id is not None:
                row.supplier_id = payload.supplier_id
                changed = True
            if payload.skus is not None:
                row.skus_json = payload.skus
                changed = True
            if payload.carrier is not None:
                row.carrier = payload.carrier
                changed = True
            if payload.order_date is not None:
                row.order_date = self._coerce_datetime(payload.order_date)
                changed = True
            if payload.expected_delivery_date is not None:
                row.expected_delivery_date = self._coerce_datetime(payload.expected_delivery_date)
                changed = True
            if payload.events is not None:
                row.events_json = self._normalize_events(payload.events)
                changed = True

            if not changed:
                raise BadRequestError("At least one field must be provided for update.")

            self._validate_shipment_refs(
                repo,
                type(
                    "TmpShipmentPayload",
                    (),
                    {
                        "origin_port_id": row.origin_port_id,
                        "destination_port_id": row.destination_port_id,
                        "route_id": row.route_id,
                        "supplier_id": row.supplier_id,
                        "skus": row.skus_json,
                    },
                )(),
            )

            row.updated_at = _utcnow_naive()
            return self._to_shipment(row)

    def list_ports(self) -> ReferenceListResponse:
        self._ensure_initialized()
        with session_scope() as session:
            repo = ReferenceRepository(session)
            rows = repo.list_ports()
            items = [ReferenceItem(id=r.id, name=r.name, code=None, metadata={}) for r in rows]
            return ReferenceListResponse(items=items, total=len(items))

    def list_routes(self) -> ReferenceListResponse:
        self._ensure_initialized()
        with session_scope() as session:
            repo = ReferenceRepository(session)
            rows = repo.list_routes()
            items = [ReferenceItem(id=r.id, name=r.name, code=None, metadata={}) for r in rows]
            return ReferenceListResponse(items=items, total=len(items))

    def _validate_shipment_refs(self, repo: ReferenceRepository, payload):
        errors = {}

        if not repo.supplier_exists(payload.supplier_id):
            errors["supplier_id"] = payload.supplier_id
        if not repo.port_exists(payload.origin_port_id):
            errors["origin_port_id"] = payload.origin_port_id
        if not repo.port_exists(payload.destination_port_id):
            errors["destination_port_id"] = payload.destination_port_id
        if not repo.route_exists(payload.route_id):
            errors["route_id"] = payload.route_id

        missing_skus = repo.sku_ids_exist(list(payload.skus.keys()))
        if missing_skus:
            errors["missing_skus"] = missing_skus

        if errors:
            raise ValidationError("Invalid shipment references.", errors)

    @staticmethod
    def _require(payload, fields: list[str]):
        missing = [field for field in fields if getattr(payload, field, None) is None]
        if missing:
            raise ValidationError("Missing required fields.", {"missing_fields": missing})

    @staticmethod
    def _validate_master_status(status: str) -> str:
        status = str(status)
        if status not in MASTER_STATUSES:
            raise ValidationError("Invalid master status.", {"allowed": sorted(MASTER_STATUSES), "received": status})
        return status

    @staticmethod
    def _validate_shipment_status(status: str) -> str:
        status = str(status)
        if status not in SHIPMENT_STATUSES:
            raise ValidationError(
                "Invalid shipment status.", {"allowed": sorted(SHIPMENT_STATUSES), "received": status}
            )
        return status

    @staticmethod
    def _validate_sku_risk_level(level: str) -> str:
        level = str(level)
        if level not in SKU_RISK_LEVELS:
            raise ValidationError("Invalid SKU risk level.", {"allowed": sorted(SKU_RISK_LEVELS), "received": level})
        return level

    @staticmethod
    def _validate_risk_score(value) -> int:
        score = int(value)
        if score < -1 or score > 100:
            raise ValidationError("Invalid risk score.", {"min": -1, "max": 100, "received": score})
        return score

    @staticmethod
    def _normalize_events(events) -> list[dict]:
        normalized = []
        for event in events or []:
            if isinstance(event, dict):
                e = event
            else:
                e = {
                    "id": getattr(event, "id", None),
                    "type": getattr(event, "type", None),
                    "description": getattr(event, "description", None),
                    "event_time": getattr(event, "event_time", None),
                    "location": getattr(event, "location", None),
                    "status": getattr(event, "status", None),
                    "metadata": getattr(event, "metadata", None),
                }
            required = [k for k in ["id", "type", "description", "event_time"] if e.get(k) in {None, ""}]
            if required:
                raise ValidationError("Invalid shipment event.", {"missing_fields": required})
            normalized.append(
                {
                    "id": str(e.get("id")),
                    "type": str(e.get("type")),
                    "description": str(e.get("description")),
                    "event_time": str(e.get("event_time")),
                    "location": e.get("location"),
                    "status": e.get("status"),
                    "metadata": e.get("metadata"),
                }
            )
        return normalized

    @staticmethod
    def _validate_supplier_ids(repo: ReferenceRepository, supplier_ids: list[str]):
        missing = [x for x in supplier_ids or [] if not repo.supplier_exists(x)]
        if missing:
            raise ValidationError("Invalid supplier references for SKU.", {"missing_supplier_ids": missing})

    @staticmethod
    def _coerce_datetime(value):
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
            except ValueError as exc:
                raise ValidationError("Invalid datetime format.", {"value": value}) from exc
        raise ValidationError("Invalid datetime type.", {"type": type(value).__name__})

    @staticmethod
    def _to_sku(row: SkuRecord) -> Sku:
        return Sku(
            id=row.id,
            sku_code=row.sku_code,
            name=row.name,
            description=row.description,
            unit_of_measure=row.unit_of_measure,
            status=row.status,
            risk_score=row.risk_score,
            risk_level=row.risk_level,
            required_qty=row.required_qty,
            category=row.category,
            supplier_ids=row.supplier_ids_json or [],
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @staticmethod
    def _to_supplier(row: SupplierRecord) -> Supplier:
        return Supplier(
            id=row.id,
            supplier_code=row.supplier_code,
            name=row.name,
            country=row.country,
            contact_email=row.contact_email,
            status=row.status,
            region=row.region,
            risk_rating=row.risk_rating,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @staticmethod
    def _to_shipment(row: ShipmentRecord) -> Shipment:
        return Shipment(
            id=row.id,
            shipment_code=row.shipment_code,
            status=row.status,
            origin_port_id=row.origin_port_id,
            destination_port_id=row.destination_port_id,
            route_id=row.route_id,
            supplier_id=row.supplier_id,
            skus=row.skus_json,
            carrier=row.carrier,
            order_date=row.order_date,
            expected_delivery_date=row.expected_delivery_date,
            events=row.events_json or [],
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
