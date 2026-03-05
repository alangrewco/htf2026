import unittest

from flask import json

from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server.models.reference_list_response import ReferenceListResponse  # noqa: E501
from openapi_server.test import BaseTestCase


class TestReferenceController(BaseTestCase):
    """ReferenceController integration test stubs"""

    def test_list_ports(self):
        """Test case for list_ports

        List port reference data
        """
        headers = { 
            'Accept': 'application/json',
        }
        response = self.client.open(
            '/api/v1/reference/ports',
            method='GET',
            headers=headers)
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))

    def test_list_routes(self):
        """Test case for list_routes

        List route reference data
        """
        headers = { 
            'Accept': 'application/json',
        }
        response = self.client.open(
            '/api/v1/reference/routes',
            method='GET',
            headers=headers)
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))

    def test_list_skus(self):
        """Test case for list_skus

        List SKU reference data
        """
        headers = { 
            'Accept': 'application/json',
        }
        response = self.client.open(
            '/api/v1/reference/skus',
            method='GET',
            headers=headers)
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))

    def test_list_suppliers(self):
        """Test case for list_suppliers

        List supplier reference data
        """
        headers = { 
            'Accept': 'application/json',
        }
        response = self.client.open(
            '/api/v1/reference/suppliers',
            method='GET',
            headers=headers)
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))


if __name__ == '__main__':
    unittest.main()
