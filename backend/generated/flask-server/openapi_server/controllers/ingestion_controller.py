import sys
from pathlib import Path

import connexion

from openapi_server.models.create_ingestion_run_request import CreateIngestionRunRequest  # noqa: E501
from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server.models.error_object import ErrorObject

BACKEND_ROOT = Path(__file__).resolve().parents[4]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.errors import AppError  # noqa: E402
from app.services.ingestion_service import IngestionService  # noqa: E402

service = IngestionService()


def _error_response(err: AppError):
    envelope = ErrorEnvelope(
        error=ErrorObject(
            code=err.code,
            message=err.message,
            details=err.details,
        )
    )
    return envelope, err.status_code


def _unknown_error(err: Exception):
    envelope = ErrorEnvelope(
        error=ErrorObject(
            code="INTERNAL_ERROR",
            message="Unexpected server error",
            details={"error": str(err)},
        )
    )
    return envelope, 500


def create_ingestion_run(body):  # noqa: E501
    payload = body
    if connexion.request.is_json:
        payload = CreateIngestionRunRequest.from_dict(connexion.request.get_json())
    try:
        return service.create_ingestion_run(max_articles=payload.max_articles), 202
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def list_ingestion_runs(page=None, page_size=None):  # noqa: E501
    try:
        page_value = page if page is not None else 1
        page_size_value = page_size if page_size is not None else 20
        return service.list_ingestion_runs(page=page_value, page_size=page_size_value), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def get_ingestion_run(run_id):  # noqa: E501
    try:
        return service.get_ingestion_run(run_id), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def get_ingestion_status():  # noqa: E501
    try:
        return service.get_ingestion_status(), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)
