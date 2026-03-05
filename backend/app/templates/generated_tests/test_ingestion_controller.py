import unittest
from uuid import UUID

from flask import json

from openapi_server.models.create_ingestion_run_request import CreateIngestionRunRequest  # noqa: E501
from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server.models.ingestion_run import IngestionRun  # noqa: E501
from openapi_server.models.ingestion_run_queued_response import IngestionRunQueuedResponse  # noqa: E501
from openapi_server.models.ingestion_status import IngestionStatus  # noqa: E501
from openapi_server.test import BaseTestCase


class TestIngestionController(BaseTestCase):
    """IngestionController integration test stubs"""

    def test_create_ingestion_run(self):
        """Test case for create_ingestion_run

        Queue an ingestion run
        """
        create_ingestion_run_request = {"max_articles":100}
        headers = { 
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
        response = self.client.open(
            '/api/v1/ingestion/runs',
            method='POST',
            headers=headers,
            data=json.dumps(create_ingestion_run_request),
            content_type='application/json')
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))

    def test_get_ingestion_run(self):
        """Test case for get_ingestion_run

        Get ingestion run status
        """
        headers = { 
            'Accept': 'application/json',
        }
        response = self.client.open(
            '/api/v1/ingestion/runs/{run_id}'.format(run_id=UUID('38400000-8cf0-11bd-b23e-10b96e4ef00d')),
            method='GET',
            headers=headers)
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))

    def test_get_ingestion_status(self):
        """Test case for get_ingestion_status

        Get ingestion scheduler status
        """
        headers = { 
            'Accept': 'application/json',
        }
        response = self.client.open(
            '/api/v1/ingestion/status',
            method='GET',
            headers=headers)
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))


if __name__ == '__main__':
    unittest.main()
