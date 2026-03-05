import unittest
from uuid import UUID

from flask import json

from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server.models.incident import Incident  # noqa: E501
from openapi_server.models.incident_classification import IncidentClassification  # noqa: E501
from openapi_server.models.incident_list_response import IncidentListResponse  # noqa: E501
from openapi_server.models.incident_status import IncidentStatus  # noqa: E501
from openapi_server.models.risk_level import RiskLevel  # noqa: E501
from openapi_server.test import BaseTestCase


class TestIncidentsController(BaseTestCase):
    """IncidentsController integration test stubs"""

    def test_get_incident(self):
        """Test case for get_incident

        Get incident by id
        """
        headers = { 
            'Accept': 'application/json',
        }
        response = self.client.open(
            '/api/v1/incidents/{incident_id}'.format(incident_id=UUID('38400000-8cf0-11bd-b23e-10b96e4ef00d')),
            method='GET',
            headers=headers)
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))

    def test_list_incidents(self):
        """Test case for list_incidents

        List incidents
        """
        query_string = [('status', 'open'),
                        ('classification', 'risk_exposure'),
                        ('risk_level', 'high'),
                        ('page', 1),
                        ('page_size', 20)]
        headers = { 
            'Accept': 'application/json',
        }
        response = self.client.open(
            '/api/v1/incidents',
            method='GET',
            headers=headers,
            query_string=query_string)
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))


if __name__ == '__main__':
    unittest.main()
