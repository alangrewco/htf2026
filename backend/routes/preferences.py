from flask.views import MethodView
from flask_smorest import Blueprint

from schemas import PreferenceSchema, PreferenceUpdateSchema
from services.preferences import get_or_create_preferences, update_preferences

blp = Blueprint(
    "preferences",
    __name__,
    url_prefix="/api/preferences",
    description="Preference learning",
)


@blp.route("")
class PreferenceResource(MethodView):
    @blp.response(200, PreferenceSchema)
    @blp.doc(tags=["preferences"])
    def get(self):
        return get_or_create_preferences()

    @blp.arguments(PreferenceUpdateSchema)
    @blp.response(200, PreferenceSchema)
    @blp.doc(tags=["preferences"])
    def put(self, payload):
        return update_preferences(payload)
