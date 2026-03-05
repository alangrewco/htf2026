import connexion
from typing import Dict
from typing import Tuple
from typing import Union

from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server.models.incident import Incident  # noqa: E501
from openapi_server.models.incident_classification import IncidentClassification  # noqa: E501
from openapi_server.models.incident_list_response import IncidentListResponse  # noqa: E501
from openapi_server.models.incident_status import IncidentStatus  # noqa: E501
from openapi_server.models.risk_level import RiskLevel  # noqa: E501
from openapi_server import util


def get_incident(incident_id):  # noqa: E501
    """Get incident by id

     # noqa: E501

    :param incident_id: 
    :type incident_id: str

    :rtype: Union[Incident, Tuple[Incident, int], Tuple[Incident, int, Dict[str, str]]
    """
    return 'do some magic!'


def list_incidents(status=None, classification=None, risk_level=None, page=None, page_size=None):  # noqa: E501
    """List incidents

     # noqa: E501

    :param status: 
    :type status: dict | bytes
    :param classification: 
    :type classification: dict | bytes
    :param risk_level: 
    :type risk_level: dict | bytes
    :param page: 
    :type page: int
    :param page_size: 
    :type page_size: int

    :rtype: Union[IncidentListResponse, Tuple[IncidentListResponse, int], Tuple[IncidentListResponse, int, Dict[str, str]]
    """
    if connexion.request.is_json:
        status =  IncidentStatus.from_dict(connexion.request.get_json())  # noqa: E501
    if connexion.request.is_json:
        classification =  IncidentClassification.from_dict(connexion.request.get_json())  # noqa: E501
    if connexion.request.is_json:
        risk_level =  RiskLevel.from_dict(connexion.request.get_json())  # noqa: E501
    return 'do some magic!'
