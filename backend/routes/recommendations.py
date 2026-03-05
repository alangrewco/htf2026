from flask import abort
from flask.views import MethodView
from flask_smorest import Blueprint

from extensions import limiter
from models import Recommendation, RecommendationFeedback, db
from schemas import (
    FeedbackSchema,
    GenerateRecommendationsRequestSchema,
    GenerateRecommendationsResponseSchema,
)
from services.preferences import apply_feedback_update, get_or_create_preferences
from services.recommender import generate_recommendations

blp = Blueprint(
    "recommendations",
    __name__,
    url_prefix="/api/recommendations",
    description="Recommendations",
)


@blp.route("/generate")
class RecommendationGenerateResource(MethodView):
    decorators = [limiter.limit("5/minute")]
    @blp.arguments(GenerateRecommendationsRequestSchema)
    @blp.response(200, GenerateRecommendationsResponseSchema)
    @blp.doc(tags=["recommendations"])
    def post(self, payload):
        return generate_recommendations(
            profile=payload["profile"],
            sku_ids=payload["sku_ids"],
            horizon_days=payload["horizon_days"],
        )


@blp.route("/<int:recommendation_id>")
class RecommendationDetailResource(MethodView):
    @blp.doc(tags=["recommendations"])
    def get(self, recommendation_id: int):
        rec = Recommendation.query.get(recommendation_id)
        if not rec:
            abort(404, "Recommendation not found")
        return {
            "id": rec.id,
            "profile": rec.profile,
            "sku_id": rec.sku_id,
            "horizon_days": rec.horizon_days,
            "score": rec.score,
            "recommendation": rec.recommendation_json,
            "explanation": rec.explanation_json,
            "weights": rec.weights_json,
        }


@blp.route("/<int:recommendation_id>/feedback")
class RecommendationFeedbackResource(MethodView):
    @blp.arguments(FeedbackSchema)
    @blp.doc(tags=["recommendations", "preferences"])
    def post(self, payload, recommendation_id: int):
        rec = Recommendation.query.get(recommendation_id)
        if not rec:
            abort(404, "Recommendation not found")

        row = RecommendationFeedback(
            recommendation_id=rec.id,
            accepted=payload["accepted"],
            reason_code=payload["reason_code"],
        )
        db.session.add(row)
        db.session.commit()

        pref = get_or_create_preferences()
        pref = apply_feedback_update(pref, payload["reason_code"])
        return {
            "feedback_id": row.id,
            "preferences": {
                "w_cost": pref.w_cost,
                "w_speed": pref.w_speed,
                "w_risk": pref.w_risk,
            },
        }
