import connexion
from typing import Dict
from typing import Tuple
from typing import Union

from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server.models.proposal_feedback_request import ProposalFeedbackRequest  # noqa: E501
from openapi_server.models.proposal_feedback_response import ProposalFeedbackResponse  # noqa: E501
from openapi_server import util


def submit_proposal_feedback(proposal_id, body):  # noqa: E501
    """Submit feedback to improve soft risk profile

     # noqa: E501

    :param proposal_id: 
    :type proposal_id: str
    :param proposal_feedback_request: 
    :type proposal_feedback_request: dict | bytes

    :rtype: Union[ProposalFeedbackResponse, Tuple[ProposalFeedbackResponse, int], Tuple[ProposalFeedbackResponse, int, Dict[str, str]]
    """
    proposal_feedback_request = body
    if connexion.request.is_json:
        proposal_feedback_request = ProposalFeedbackRequest.from_dict(connexion.request.get_json())  # noqa: E501
    return 'do some magic!'
