from pathlib import Path
import sys

import pytest

BACKEND_ROOT = Path(__file__).resolve().parents[2]
GENERATED_ROOT = BACKEND_ROOT / "generated" / "flask-server"

sys.path.insert(0, str(GENERATED_ROOT))
sys.path.insert(0, str(BACKEND_ROOT))

from app.errors import ValidationError
from app.services.company_config_service import CompanyConfigService
from openapi_server.models.update_company_profile_request import UpdateCompanyProfileRequest


@pytest.fixture()
def service(tmp_path, monkeypatch):
    db_path = tmp_path / "company_config_service.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    CompanyConfigService._initialized = False
    return CompanyConfigService()


def test_company_config_defaults_and_update(service):
    profile = service.get_company_profile()
    assert profile.max_auto_risk_level in ["low", "medium", "high"]
    assert isinstance(profile.autonomy_enabled, bool)
    assert isinstance(profile.disallowed_categories, list)

    risk = service.get_risk_profile()
    assert 0.0 <= risk.manager_risk_tolerance_score <= 1.0
    assert risk.last_updated_at is not None

    updated = service.update_company_profile(
        UpdateCompanyProfileRequest(
            autonomy_enabled=False,
            max_auto_risk_level="medium",
            disallowed_categories=["legal_commitment", "legal_commitment", "termination"],
        )
    )
    assert updated.autonomy_enabled is False
    assert updated.max_auto_risk_level == "medium"
    assert updated.disallowed_categories == ["legal_commitment", "termination"]

    refreshed = service.get_company_profile()
    assert refreshed.autonomy_enabled is False
    assert refreshed.max_auto_risk_level == "medium"
    assert refreshed.disallowed_categories == ["legal_commitment", "termination"]


def test_company_config_validation(service):
    with pytest.raises(ValidationError):
        service.update_company_profile(
            UpdateCompanyProfileRequest(
                autonomy_enabled=True,
                max_auto_risk_level="critical",
                disallowed_categories=["ops"],
            )
        )
