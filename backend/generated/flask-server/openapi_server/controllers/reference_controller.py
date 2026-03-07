import sys
import traceback
from pathlib import Path
from typing import Dict, Tuple, Union

import connexion

from openapi_server.models.create_shipment_request import CreateShipmentRequest  # noqa: E501
from openapi_server.models.create_sku_request import CreateSkuRequest  # noqa: E501
from openapi_server.models.create_supplier_request import CreateSupplierRequest  # noqa: E501
from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server.models.error_object import ErrorObject
from openapi_server.models.reference_list_response import ReferenceListResponse  # noqa: E501
from openapi_server.models.shipment import Shipment  # noqa: E501
from openapi_server.models.shipment_list_response import ShipmentListResponse  # noqa: E501
from openapi_server.models.sku import Sku  # noqa: E501
from openapi_server.models.sku_list_response import SkuListResponse  # noqa: E501
from openapi_server.models.supplier import Supplier  # noqa: E501
from openapi_server.models.supplier_list_response import SupplierListResponse  # noqa: E501
from openapi_server.models.update_shipment_request import UpdateShipmentRequest  # noqa: E501
from openapi_server.models.update_sku_request import UpdateSkuRequest  # noqa: E501
from openapi_server.models.update_supplier_request import UpdateSupplierRequest  # noqa: E501

BACKEND_ROOT = Path(__file__).resolve().parents[4]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.errors import AppError  # noqa: E402
from app.services.reference_service import ReferenceService  # noqa: E402

service = ReferenceService()


def _error_response(err: AppError):
    # Note: AppError constructor handles its own traceback print when in DEV mode
    envelope = ErrorEnvelope(
        error=ErrorObject(
            code=err.code,
            message=err.message,
            details=err.details,
        )
    )
    return envelope, err.status_code


def _unknown_error(err: Exception):
    print(f"\n>>> UNEXPECTED ERROR: {err}")
    traceback.print_exc()
    print("<<<\n")
    envelope = ErrorEnvelope(
        error=ErrorObject(
            code="INTERNAL_ERROR",
            message="Unexpected server error",
            details={"error": str(err)},
        )
    )
    return envelope, 500


def create_shipment(body):  # noqa: E501
    """Create shipment reference record"""
    payload = body
    if connexion.request.is_json:
        payload = CreateShipmentRequest.from_dict(connexion.request.get_json())
    try:
        return service.create_shipment(payload), 201
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def create_sku(body):  # noqa: E501
    """Create SKU reference record"""
    payload = body
    if connexion.request.is_json:
        payload = CreateSkuRequest.from_dict(connexion.request.get_json())
    try:
        return service.create_sku(payload), 201
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def create_supplier(body):  # noqa: E501
    """Create supplier reference record"""
    payload = body
    if connexion.request.is_json:
        payload = CreateSupplierRequest.from_dict(connexion.request.get_json())
    try:
        return service.create_supplier(payload), 201
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def list_ports():  # noqa: E501
    """List port reference data"""
    try:
        return service.list_ports(), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def list_routes():  # noqa: E501
    """List route reference data"""
    try:
        return service.list_routes(), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def list_shipments():  # noqa: E501
    """List shipment reference data"""
    try:
        return service.list_shipments(), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def list_skus():  # noqa: E501
    """List SKU reference data"""
    try:
        return service.list_skus(), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def list_suppliers():  # noqa: E501
    """List supplier reference data"""
    try:
        return service.list_suppliers(), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def update_shipment(shipment_id, body):  # noqa: E501
    """Update shipment reference record"""
    payload = body
    if connexion.request.is_json:
        payload = UpdateShipmentRequest.from_dict(connexion.request.get_json())
    try:
        return service.update_shipment(shipment_id, payload), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def update_sku(sku_id, body):  # noqa: E501
    """Update SKU reference record"""
    payload = body
    if connexion.request.is_json:
        payload = UpdateSkuRequest.from_dict(connexion.request.get_json())
    try:
        return service.update_sku(sku_id, payload), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def update_supplier(supplier_id, body):  # noqa: E501
    """Update supplier reference record"""
    payload = body
    if connexion.request.is_json:
        payload = UpdateSupplierRequest.from_dict(connexion.request.get_json())
    try:
        return service.update_supplier(supplier_id, payload), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)
