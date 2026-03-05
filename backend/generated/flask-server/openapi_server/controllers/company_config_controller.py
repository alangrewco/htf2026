import connexion
from typing import Dict
from typing import Tuple
from typing import Union

from openapi_server.models.company_profile import CompanyProfile  # noqa: E501
from openapi_server.models.error_envelope import ErrorEnvelope  # noqa: E501
from openapi_server.models.risk_profile import RiskProfile  # noqa: E501
from openapi_server.models.update_company_profile_request import UpdateCompanyProfileRequest  # noqa: E501
from openapi_server import util


def get_company_profile():  # noqa: E501
    """Get company policy settings

     # noqa: E501


    :rtype: Union[CompanyProfile, Tuple[CompanyProfile, int], Tuple[CompanyProfile, int, Dict[str, str]]
    """
    return 'do some magic!'


def get_risk_profile():  # noqa: E501
    """Get learned manager risk profile

     # noqa: E501


    :rtype: Union[RiskProfile, Tuple[RiskProfile, int], Tuple[RiskProfile, int, Dict[str, str]]
    """
    return 'do some magic!'


def update_company_profile(body):  # noqa: E501
    """Update company policy settings

     # noqa: E501

    :param update_company_profile_request: 
    :type update_company_profile_request: dict | bytes

    :rtype: Union[CompanyProfile, Tuple[CompanyProfile, int], Tuple[CompanyProfile, int, Dict[str, str]]
    """
    update_company_profile_request = body
    if connexion.request.is_json:
        update_company_profile_request = UpdateCompanyProfileRequest.from_dict(connexion.request.get_json())  # noqa: E501
    return 'do some magic!'
