#!/usr/bin/env python3

import connexion
from openapi_server import encoder
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

def main():
    app = connexion.App(__name__, specification_dir='./openapi/')
    
    # Initialize CORS
    CORS(app.app, resources={r"/api/v1/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize Rate Limiter
    limiter = Limiter(
        get_remote_address,
        app=app.app,
        default_limits=["200 per day", "50 per hour"],
        storage_uri="memory://"
    )

    app.app.json_encoder = encoder.JSONEncoder
    app.add_api('openapi.yaml',
                arguments={'title': 'Shipping Disruption Management API'},
                pythonic_params=True)

    app.run(port=8080)

if __name__ == '__main__':
    main()
