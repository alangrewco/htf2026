import unittest
from uuid import UUID

from flask import json

from openapi_server.models.article import Article  # noqa: E501
from openapi_server.models.article_list_response import ArticleListResponse  # noqa: E501
from openapi_server.models.article_processing_state import ArticleProcessingState  # noqa: E501
from openapi_server.models.enrichment import Enrichment  # noqa: E501
from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server.test import BaseTestCase


class TestArticlesController(BaseTestCase):
    """ArticlesController integration test stubs"""

    def test_get_article(self):
        """Test case for get_article

        Get article by id
        """
        headers = { 
            'Accept': 'application/json',
        }
        response = self.client.open(
            '/api/v1/articles/{article_id}'.format(article_id=UUID('38400000-8cf0-11bd-b23e-10b96e4ef00d')),
            method='GET',
            headers=headers)
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))

    def test_get_article_enrichment(self):
        """Test case for get_article_enrichment

        Get enrichment for an article
        """
        headers = { 
            'Accept': 'application/json',
        }
        response = self.client.open(
            '/api/v1/articles/{article_id}/enrichment'.format(article_id=UUID('38400000-8cf0-11bd-b23e-10b96e4ef00d')),
            method='GET',
            headers=headers)
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))

    def test_list_articles(self):
        """Test case for list_articles

        List articles
        """
        query_string = [('state', 'raw'),
                        ('relevant', True),
                        ('page', 1),
                        ('page_size', 20)]
        headers = { 
            'Accept': 'application/json',
        }
        response = self.client.open(
            '/api/v1/articles',
            method='GET',
            headers=headers,
            query_string=query_string)
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))


if __name__ == '__main__':
    unittest.main()
