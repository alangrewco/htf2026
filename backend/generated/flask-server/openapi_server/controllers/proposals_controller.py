import connexion
from typing import Dict
from typing import Tuple
from typing import Union

from openapi_server.models.action_proposal import ActionProposal  # noqa: E501
from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server.models.proposal_decision_request import ProposalDecisionRequest  # noqa: E501
from openapi_server.models.proposal_decision_response import ProposalDecisionResponse  # noqa: E501
from openapi_server.models.proposal_generate_response import ProposalGenerateResponse  # noqa: E501
from openapi_server.models.proposal_list_response import ProposalListResponse  # noqa: E501
from openapi_server import util


def decide_proposal(proposal_id, body):  # noqa: E501
    """Submit manager decision for a proposal

     # noqa: E501

    :param proposal_id: 
    :type proposal_id: str
    :param proposal_decision_request: 
    :type proposal_decision_request: dict | bytes

    :rtype: Union[ProposalDecisionResponse, Tuple[ProposalDecisionResponse, int], Tuple[ProposalDecisionResponse, int, Dict[str, str]]
    """
    proposal_decision_request = body
    if connexion.request.is_json:
        proposal_decision_request = ProposalDecisionRequest.from_dict(connexion.request.get_json())  # noqa: E501
    return 'do some magic!'


def generate_proposals(incident_id):  # noqa: E501
    """Generate proposals for an incident

     # noqa: E501

    :param incident_id: 
    :type incident_id: str

    :rtype: Union[ProposalGenerateResponse, Tuple[ProposalGenerateResponse, int], Tuple[ProposalGenerateResponse, int, Dict[str, str]]
    """
    return 'do some magic!'


def get_proposal(proposal_id):  # noqa: E501
    """Get proposal by id

     # noqa: E501

    :param proposal_id: 
    :type proposal_id: str

    :rtype: Union[ActionProposal, Tuple[ActionProposal, int], Tuple[ActionProposal, int, Dict[str, str]]
    """
    return 'do some magic!'


def list_incident_proposals(incident_id):  # noqa: E501
    """List proposals for an incident

     # noqa: E501

    :param incident_id: 
    :type incident_id: str

    :rtype: Union[ProposalListResponse, Tuple[ProposalListResponse, int], Tuple[ProposalListResponse, int, Dict[str, str]]
    """
    return 'do some magic!'
