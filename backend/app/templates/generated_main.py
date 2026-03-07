#!/usr/bin/env python3

import os

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

    port = int(os.getenv("PORT", "8080"))
    app.run(host="0.0.0.0", port=port)


if __name__ == '__main__':
    main()
