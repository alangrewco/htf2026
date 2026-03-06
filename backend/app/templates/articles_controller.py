import sys
from pathlib import Path

from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server.models.error_object import ErrorObject

BACKEND_ROOT = Path(__file__).resolve().parents[4]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.errors import AppError  # noqa: E402
from app.services.article_service import ArticleService  # noqa: E402

service = ArticleService()


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


def get_article(article_id):  # noqa: E501
    try:
        return service.get_article(article_id), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def get_article_enrichment(article_id):  # noqa: E501
    try:
        return service.get_article_enrichment(article_id), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)


def list_articles(state=None, relevant=None, page=None, page_size=None):  # noqa: E501
    try:
        page_value = page if page is not None else 1
        page_size_value = page_size if page_size is not None else 20
        state_value = str(state) if state is not None else None
        return service.list_articles(state=state_value, relevant=relevant, page=page_value, page_size=page_size_value), 200
    except AppError as err:
        return _error_response(err)
    except Exception as err:
        return _unknown_error(err)
