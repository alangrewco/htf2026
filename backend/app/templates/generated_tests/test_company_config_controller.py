import unittest
import json
import os

from openapi_server.test import BaseTestCase

TEST_DB_PATH = "/tmp/generated_controller_integration_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"


class TestCompanyConfigController(BaseTestCase):
    """CompanyConfigController integration tests."""

    def _json(self, response):
        return json.loads(response.data.decode("utf-8"))

    def test_get_company_profile(self):
        response = self.client.open(
            "/api/v1/company/profile",
            method="GET",
            headers={"Accept": "application/json"},
        )
        self.assertEqual(response.status_code, 200, response.data.decode("utf-8"))
        payload = self._json(response)
        self.assertIn(payload["max_auto_risk_level"], ["low", "medium", "high"])
        self.assertIsInstance(payload["autonomy_enabled"], bool)
        self.assertIsInstance(payload["disallowed_categories"], list)

    def test_get_risk_profile(self):
        response = self.client.open(
            "/api/v1/config/risk-profile",
            method="GET",
            headers={"Accept": "application/json"},
        )
        self.assertEqual(response.status_code, 200, response.data.decode("utf-8"))
        payload = self._json(response)
        self.assertGreaterEqual(payload["manager_risk_tolerance_score"], 0.0)
        self.assertLessEqual(payload["manager_risk_tolerance_score"], 1.0)
        self.assertTrue(payload["last_updated_at"])

    def test_update_company_profile(self):
        update_company_profile_request = {
            "max_auto_risk_level": "medium",
            "autonomy_enabled": False,
            "disallowed_categories": ["legal_commitment", "legal_commitment", "termination"],
        }
        response = self.client.open(
            "/api/v1/company/profile",
            method="PUT",
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            data=json.dumps(update_company_profile_request),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200, response.data.decode("utf-8"))
        payload = self._json(response)
        self.assertEqual(payload["max_auto_risk_level"], "medium")
        self.assertFalse(payload["autonomy_enabled"])
        self.assertEqual(payload["disallowed_categories"], ["legal_commitment", "termination"])

        refreshed = self.client.open("/api/v1/company/profile", method="GET")
        self.assertEqual(refreshed.status_code, 200)
        refreshed_payload = self._json(refreshed)
        self.assertEqual(refreshed_payload["max_auto_risk_level"], "medium")
        self.assertFalse(refreshed_payload["autonomy_enabled"])
        self.assertEqual(refreshed_payload["disallowed_categories"], ["legal_commitment", "termination"])

    def test_update_company_profile_validation_error(self):
        bad_payload = {
            "max_auto_risk_level": "critical",
            "autonomy_enabled": True,
            "disallowed_categories": ["ops"],
        }
        response = self.client.open(
            "/api/v1/company/profile",
            method="PUT",
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            data=json.dumps(bad_payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400, response.data.decode("utf-8"))


if __name__ == "__main__":
    unittest.main()
