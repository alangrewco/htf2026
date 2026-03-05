import connexion
from typing import Dict
from typing import Tuple
from typing import Union

from openapi_server.models.create_ingestion_run_request import CreateIngestionRunRequest  # noqa: E501
from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server.models.ingestion_run import IngestionRun  # noqa: E501
from openapi_server.models.ingestion_run_queued_response import IngestionRunQueuedResponse  # noqa: E501
from openapi_server.models.ingestion_status import IngestionStatus  # noqa: E501
from openapi_server import util


def create_ingestion_run(body):  # noqa: E501
    """Queue an ingestion run

     # noqa: E501

    :param create_ingestion_run_request: 
    :type create_ingestion_run_request: dict | bytes

    :rtype: Union[IngestionRunQueuedResponse, Tuple[IngestionRunQueuedResponse, int], Tuple[IngestionRunQueuedResponse, int, Dict[str, str]]
    """
    create_ingestion_run_request = body
    if connexion.request.is_json:
        create_ingestion_run_request = CreateIngestionRunRequest.from_dict(connexion.request.get_json())  # noqa: E501
    return 'do some magic!'


def get_ingestion_run(run_id):  # noqa: E501
    """Get ingestion run status

     # noqa: E501

    :param run_id: 
    :type run_id: str

    :rtype: Union[IngestionRun, Tuple[IngestionRun, int], Tuple[IngestionRun, int, Dict[str, str]]
    """
    return 'do some magic!'


def get_ingestion_status():  # noqa: E501
    """Get ingestion scheduler status

     # noqa: E501


    :rtype: Union[IngestionStatus, Tuple[IngestionStatus, int], Tuple[IngestionStatus, int, Dict[str, str]]
    """
    return 'do some magic!'
