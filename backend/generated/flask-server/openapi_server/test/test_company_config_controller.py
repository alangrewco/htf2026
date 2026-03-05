import unittest

from flask import json

from openapi_server.models.company_profile import CompanyProfile  # noqa: E501
from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server.models.risk_profile import RiskProfile  # noqa: E501
from openapi_server.models.update_company_profile_request import UpdateCompanyProfileRequest  # noqa: E501
from openapi_server.test import BaseTestCase


class TestCompanyConfigController(BaseTestCase):
    """CompanyConfigController integration test stubs"""

    def test_get_company_profile(self):
        """Test case for get_company_profile

        Get company policy settings
        """
        headers = { 
            'Accept': 'application/json',
        }
        response = self.client.open(
            '/api/v1/company/profile',
            method='GET',
            headers=headers)
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))

    def test_get_risk_profile(self):
        """Test case for get_risk_profile

        Get learned manager risk profile
        """
        headers = { 
            'Accept': 'application/json',
        }
        response = self.client.open(
            '/api/v1/config/risk-profile',
            method='GET',
            headers=headers)
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))

    def test_update_company_profile(self):
        """Test case for update_company_profile

        Update company policy settings
        """
        update_company_profile_request = {"max_auto_risk_level":"low","autonomy_enabled":True,"disallowed_categories":["disallowed_categories","disallowed_categories"]}
        headers = { 
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
        response = self.client.open(
            '/api/v1/company/profile',
            method='PUT',
            headers=headers,
            data=json.dumps(update_company_profile_request),
            content_type='application/json')
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))


if __name__ == '__main__':
    unittest.main()
