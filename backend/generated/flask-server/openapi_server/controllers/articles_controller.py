import connexion
from typing import Dict
from typing import Tuple
from typing import Union

from openapi_server.models.article import Article  # noqa: E501
from openapi_server.models.article_list_response import ArticleListResponse  # noqa: E501
from openapi_server.models.article_processing_state import ArticleProcessingState  # noqa: E501
from openapi_server.models.enrichment import Enrichment  # noqa: E501
from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server import util


def get_article(article_id):  # noqa: E501
    """Get article by id

     # noqa: E501

    :param article_id: 
    :type article_id: str

    :rtype: Union[Article, Tuple[Article, int], Tuple[Article, int, Dict[str, str]]
    """
    return 'do some magic!'


def get_article_enrichment(article_id):  # noqa: E501
    """Get enrichment for an article

     # noqa: E501

    :param article_id: 
    :type article_id: str

    :rtype: Union[Enrichment, Tuple[Enrichment, int], Tuple[Enrichment, int, Dict[str, str]]
    """
    return 'do some magic!'


def list_articles(state=None, relevant=None, page=None, page_size=None):  # noqa: E501
    """List articles

     # noqa: E501

    :param state: 
    :type state: dict | bytes
    :param relevant: 
    :type relevant: bool
    :param page: 
    :type page: int
    :param page_size: 
    :type page_size: int

    :rtype: Union[ArticleListResponse, Tuple[ArticleListResponse, int], Tuple[ArticleListResponse, int, Dict[str, str]]
    """
    if connexion.request.is_json:
        state =  ArticleProcessingState.from_dict(connexion.request.get_json())  # noqa: E501
    return 'do some magic!'
