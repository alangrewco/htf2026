#!/usr/bin/env python3

import os
import traceback
from connexion.exceptions import ValidationError, ProblemException

import connexion
from flask_cors import CORS

from openapi_server import encoder


def main():
    app = connexion.App(__name__, specification_dir='./openapi/')
    app.app.json_encoder = encoder.JSONEncoder
    app.add_api(
        'openapi.yaml',
        arguments={'title': 'Shipping Disruption Management API'},
        pythonic_params=True,
    )
    CORS(app.app)

    def handle_unprocessable_entity(err):
        """Handler for 422 Unprocessable Entity errors to show stack traces."""
        tb = traceback.format_exc()
        app.app.logger.error(f"422 Unprocessable Entity: {err}\n{tb}")
        return {"detail": str(err.description if hasattr(err, 'description') else err), "stack_trace": tb}, 422

    def handle_generic_exception(err):
        """Handler for all other exceptions to show stack traces."""
        tb = traceback.format_exc()
        app.app.logger.error(f"Unhandled Exception: {err}\n{tb}")
        return {"detail": "Internal Server Error", "stack_trace": tb}, 500

    def handle_connexion_validation(err):
        """Handler for Connexion's internal validation errors."""
        print(f"\n>>> CONNEXION VALIDATION ERROR [422]: {err}")
        traceback.print_stack()
        print("<<<\n")
        return {"detail": str(err)}, 422

    app.add_error_handler(ValidationError, handle_connexion_validation)
    app.add_error_handler(ProblemException, handle_connexion_validation)
    app.add_error_handler(422, handle_unprocessable_entity)
    app.add_error_handler(Exception, handle_generic_exception)

    port = int(os.getenv("PORT", "8080"))
    app.run(host="0.0.0.0", port=port, debug=True)


if __name__ == '__main__':
    main()
