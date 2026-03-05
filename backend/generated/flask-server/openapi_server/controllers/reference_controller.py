import connexion
from typing import Dict
from typing import Tuple
from typing import Union

from openapi_server.models.create_shipment_request import CreateShipmentRequest  # noqa: E501
from openapi_server.models.create_sku_request import CreateSkuRequest  # noqa: E501
from openapi_server.models.create_supplier_request import CreateSupplierRequest  # noqa: E501
from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
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
from openapi_server import util


def create_shipment(body):  # noqa: E501
    """Create shipment reference record

     # noqa: E501

    :param create_shipment_request: 
    :type create_shipment_request: dict | bytes

    :rtype: Union[Shipment, Tuple[Shipment, int], Tuple[Shipment, int, Dict[str, str]]
    """
    create_shipment_request = body
    if connexion.request.is_json:
        create_shipment_request = CreateShipmentRequest.from_dict(connexion.request.get_json())  # noqa: E501
    return 'do some magic!'


def create_sku(body):  # noqa: E501
    """Create SKU reference record

     # noqa: E501

    :param create_sku_request: 
    :type create_sku_request: dict | bytes

    :rtype: Union[Sku, Tuple[Sku, int], Tuple[Sku, int, Dict[str, str]]
    """
    create_sku_request = body
    if connexion.request.is_json:
        create_sku_request = CreateSkuRequest.from_dict(connexion.request.get_json())  # noqa: E501
    return 'do some magic!'


def create_supplier(body):  # noqa: E501
    """Create supplier reference record

     # noqa: E501

    :param create_supplier_request: 
    :type create_supplier_request: dict | bytes

    :rtype: Union[Supplier, Tuple[Supplier, int], Tuple[Supplier, int, Dict[str, str]]
    """
    create_supplier_request = body
    if connexion.request.is_json:
        create_supplier_request = CreateSupplierRequest.from_dict(connexion.request.get_json())  # noqa: E501
    return 'do some magic!'


def list_ports():  # noqa: E501
    """List port reference data

     # noqa: E501


    :rtype: Union[ReferenceListResponse, Tuple[ReferenceListResponse, int], Tuple[ReferenceListResponse, int, Dict[str, str]]
    """
    return 'do some magic!'


def list_routes():  # noqa: E501
    """List route reference data

     # noqa: E501


    :rtype: Union[ReferenceListResponse, Tuple[ReferenceListResponse, int], Tuple[ReferenceListResponse, int, Dict[str, str]]
    """
    return 'do some magic!'


def list_shipments():  # noqa: E501
    """List shipment reference data

     # noqa: E501


    :rtype: Union[ShipmentListResponse, Tuple[ShipmentListResponse, int], Tuple[ShipmentListResponse, int, Dict[str, str]]
    """
    return 'do some magic!'


def list_skus():  # noqa: E501
    """List SKU reference data

     # noqa: E501


    :rtype: Union[SkuListResponse, Tuple[SkuListResponse, int], Tuple[SkuListResponse, int, Dict[str, str]]
    """
    return 'do some magic!'


def list_suppliers():  # noqa: E501
    """List supplier reference data

     # noqa: E501


    :rtype: Union[SupplierListResponse, Tuple[SupplierListResponse, int], Tuple[SupplierListResponse, int, Dict[str, str]]
    """
    return 'do some magic!'


def update_shipment(shipment_id, body):  # noqa: E501
    """Update shipment reference record

     # noqa: E501

    :param shipment_id: 
    :type shipment_id: str
    :param update_shipment_request: 
    :type update_shipment_request: dict | bytes

    :rtype: Union[Shipment, Tuple[Shipment, int], Tuple[Shipment, int, Dict[str, str]]
    """
    update_shipment_request = body
    if connexion.request.is_json:
        update_shipment_request = UpdateShipmentRequest.from_dict(connexion.request.get_json())  # noqa: E501
    return 'do some magic!'


def update_sku(sku_id, body):  # noqa: E501
    """Update SKU reference record

     # noqa: E501

    :param sku_id: 
    :type sku_id: str
    :param update_sku_request: 
    :type update_sku_request: dict | bytes

    :rtype: Union[Sku, Tuple[Sku, int], Tuple[Sku, int, Dict[str, str]]
    """
    update_sku_request = body
    if connexion.request.is_json:
        update_sku_request = UpdateSkuRequest.from_dict(connexion.request.get_json())  # noqa: E501
    return 'do some magic!'


def update_supplier(supplier_id, body):  # noqa: E501
    """Update supplier reference record

     # noqa: E501

    :param supplier_id: 
    :type supplier_id: str
    :param update_supplier_request: 
    :type update_supplier_request: dict | bytes

    :rtype: Union[Supplier, Tuple[Supplier, int], Tuple[Supplier, int, Dict[str, str]]
    """
    update_supplier_request = body
    if connexion.request.is_json:
        update_supplier_request = UpdateSupplierRequest.from_dict(connexion.request.get_json())  # noqa: E501
    return 'do some magic!'
