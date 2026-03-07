from sqlalchemy import select

from app.models import CompanyProfileRecord, RiskProfileRecord


class CompanyConfigRepository:
    def __init__(self, session):
        self.session = session

    def get_company_profile(self):
        return self.session.execute(select(CompanyProfileRecord).limit(1)).scalar_one()

    def get_risk_profile(self):
        return self.session.execute(select(RiskProfileRecord).limit(1)).scalar_one()
