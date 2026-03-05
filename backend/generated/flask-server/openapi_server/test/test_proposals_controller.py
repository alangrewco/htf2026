import unittest

from flask import json

from openapi_server.models.action_proposal import ActionProposal  # noqa: E501
from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server.models.proposal_decision_request import ProposalDecisionRequest  # noqa: E501
from openapi_server.models.proposal_decision_response import ProposalDecisionResponse  # noqa: E501
from openapi_server.models.proposal_generate_response import ProposalGenerateResponse  # noqa: E501
from openapi_server.models.proposal_list_response import ProposalListResponse  # noqa: E501
from openapi_server.test import BaseTestCase


class TestProposalsController(BaseTestCase):
    """ProposalsController integration test stubs"""

    def test_decide_proposal(self):
        """Test case for decide_proposal

        Submit manager decision for a proposal
        """
        proposal_decision_request = {"approved_step_ids":["046b6c7f-0b8a-43b9-b35d-6489e6daee91","046b6c7f-0b8a-43b9-b35d-6489e6daee91"],"decision":"approve","manager_note":"manager_note"}
        headers = { 
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
        response = self.client.open(
            '/api/v1/proposals/{proposal_id}/decision'.format(proposal_id=UUID('38400000-8cf0-11bd-b23e-10b96e4ef00d')),
            method='POST',
            headers=headers,
            data=json.dumps(proposal_decision_request),
            content_type='application/json')
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))

    def test_generate_proposals(self):
        """Test case for generate_proposals

        Generate proposals for an incident
        """
        headers = { 
            'Accept': 'application/json',
        }
        response = self.client.open(
            '/api/v1/incidents/{incident_id}/proposals:generate'.format(incident_id=UUID('38400000-8cf0-11bd-b23e-10b96e4ef00d')),
            method='POST',
            headers=headers)
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))

    def test_get_proposal(self):
        """Test case for get_proposal

        Get proposal by id
        """
        headers = { 
            'Accept': 'application/json',
        }
        response = self.client.open(
            '/api/v1/proposals/{proposal_id}'.format(proposal_id=UUID('38400000-8cf0-11bd-b23e-10b96e4ef00d')),
            method='GET',
            headers=headers)
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))

    def test_list_incident_proposals(self):
        """Test case for list_incident_proposals

        List proposals for an incident
        """
        headers = { 
            'Accept': 'application/json',
        }
        response = self.client.open(
            '/api/v1/incidents/{incident_id}/proposals'.format(incident_id=UUID('38400000-8cf0-11bd-b23e-10b96e4ef00d')),
            method='GET',
            headers=headers)
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))


if __name__ == '__main__':
    unittest.main()
