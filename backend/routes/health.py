from flask.views import MethodView
from flask_smorest import Blueprint

from schemas import HealthSchema

blp = Blueprint("health", __name__, url_prefix="/api", description="Health endpoints")


@blp.route("/health")
class HealthResource(MethodView):
    @blp.response(200, HealthSchema)
    @blp.doc(tags=["health"])
    def get(self):
        return {"status": "ok"}
