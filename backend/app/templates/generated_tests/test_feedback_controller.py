import unittest
from uuid import UUID

from flask import json

from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server.models.proposal_feedback_request import ProposalFeedbackRequest  # noqa: E501
from openapi_server.models.proposal_feedback_response import ProposalFeedbackResponse  # noqa: E501
from openapi_server.test import BaseTestCase


class TestFeedbackController(BaseTestCase):
    """FeedbackController integration test stubs"""

    def test_submit_proposal_feedback(self):
        """Test case for submit_proposal_feedback

        Submit feedback to improve soft risk profile
        """
        proposal_feedback_request = {"notes":"notes","accepted":True,"override_reason":"too_risky"}
        headers = { 
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
        response = self.client.open(
            '/api/v1/feedback/proposals/{proposal_id}'.format(proposal_id=UUID('38400000-8cf0-11bd-b23e-10b96e4ef00d')),
            method='POST',
            headers=headers,
            data=json.dumps(proposal_feedback_request),
            content_type='application/json')
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))


if __name__ == '__main__':
    unittest.main()
