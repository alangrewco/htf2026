from datetime import datetime, timezone

from app.bootstrap import initialize_database
from app.db import session_scope
from app.errors import ValidationError
from app.repositories.company_config_repo import CompanyConfigRepository

from openapi_server.models.company_profile import CompanyProfile
from openapi_server.models.risk_profile import RiskProfile

RISK_LEVELS = {"low", "medium", "high"}


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class CompanyConfigService:
    _initialized = False

    def _ensure_initialized(self):
        if not self.__class__._initialized:
            initialize_database()
            self.__class__._initialized = True

    def get_company_profile(self) -> CompanyProfile:
        self._ensure_initialized()
        with session_scope() as session:
            repo = CompanyConfigRepository(session)
            row = repo.get_company_profile()
            return CompanyProfile(
                autonomy_enabled=row.autonomy_enabled,
                max_auto_risk_level=row.max_auto_risk_level,
                disallowed_categories=list(row.disallowed_categories_json or []),
            )

    def update_company_profile(self, payload) -> CompanyProfile:
        self._ensure_initialized()
        self._validate_payload(payload)
        with session_scope() as session:
            repo = CompanyConfigRepository(session)
            row = repo.get_company_profile()

            row.autonomy_enabled = payload.autonomy_enabled
            row.max_auto_risk_level = payload.max_auto_risk_level
            row.disallowed_categories_json = payload.disallowed_categories
            row.updated_at = _utcnow_naive()

            return CompanyProfile(
                autonomy_enabled=row.autonomy_enabled,
                max_auto_risk_level=row.max_auto_risk_level,
                disallowed_categories=list(row.disallowed_categories_json or []),
            )

    def get_risk_profile(self) -> RiskProfile:
        self._ensure_initialized()
        with session_scope() as session:
            repo = CompanyConfigRepository(session)
            row = repo.get_risk_profile()
            return RiskProfile(
                manager_risk_tolerance_score=row.manager_risk_tolerance_score,
                last_updated_at=row.last_updated_at,
            )

    def _validate_payload(self, payload):
        if payload.max_auto_risk_level not in RISK_LEVELS:
            raise ValidationError(
                "Invalid max_auto_risk_level.",
                {"field": "max_auto_risk_level", "allowed_values": sorted(RISK_LEVELS)},
            )

        if not isinstance(payload.disallowed_categories, list):
            raise ValidationError(
                "disallowed_categories must be an array of strings.",
                {"field": "disallowed_categories"},
            )

        cleaned = []
        for index, raw in enumerate(payload.disallowed_categories):
            if not isinstance(raw, str):
                raise ValidationError(
                    "disallowed_categories must contain only strings.",
                    {"field": "disallowed_categories", "index": index},
                )
            value = raw.strip()
            if not value:
                raise ValidationError(
                    "disallowed_categories entries cannot be empty.",
                    {"field": "disallowed_categories", "index": index},
                )
            cleaned.append(value)

        # Persist a normalized unique list while preserving order.
        payload.disallowed_categories = list(dict.fromkeys(cleaned))
