import sys
from pathlib import Path

import connexion

from openapi_server.models.company_profile import CompanyProfile  # noqa: E501
from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server.models.error_object import ErrorObject
from openapi_server.models.risk_profile import RiskProfile  # noqa: E501
from openapi_server.models.update_company_profile_request import UpdateCompanyProfileRequest  # noqa: E501

BACKEND_ROOT = Path(__file__).resolve().parents[4]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.errors import AppError  # noqa: E402
from app.services.company_config_service import CompanyConfigService  # noqa: E402

service = CompanyConfigService()


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


def get_company_profile():  # noqa: E501
    """Get company policy settings"""
    try:
        return service.get_company_profile(), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def get_risk_profile():  # noqa: E501
    """Get learned manager risk profile"""
    try:
        return service.get_risk_profile(), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def update_company_profile(body):  # noqa: E501
    """Update company policy settings"""
    payload = body
    if connexion.request.is_json:
        payload = UpdateCompanyProfileRequest.from_dict(connexion.request.get_json())
    try:
        return service.update_company_profile(payload), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)
