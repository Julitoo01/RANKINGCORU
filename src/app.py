"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""

import os
from flask import Flask, jsonify, send_from_directory
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from api.utils import APIException
from api.models import db
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands


static_file_dir = os.path.join(
    os.path.dirname(os.path.realpath(__file__)),
    "../dist/"
)

app = Flask(__name__)
app.url_map.strict_slashes = False

# JWT
app.config["JWT_SECRET_KEY"] = os.getenv("FLASK_APP_KEY", "super-secret-key")
jwt = JWTManager(app)

# CORS
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    },
)

# Database configuration
db_url = os.getenv("DATABASE_URL")

if db_url is not None:
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url.replace(
        "postgres://",
        "postgresql://"
    )
else:
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:////tmp/test.db"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

# Admin
setup_admin(app)

# Commands
setup_commands(app)

# API routes
app.register_blueprint(api, url_prefix="/api")


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code


@app.errorhandler(404)
def handle_404(error):
    """
    If the missing route is an API route, return JSON.
    If it is a frontend route, return React index.html.
    """
    path = getattr(error, "description", "")

    return serve_react_app("")


@app.route("/health")
def health_check():
    return jsonify({"status": "ok"}), 200


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>", methods=["GET"])
def serve_react_app(path):
    """
    Serves React in production.

    This fixes refresh problems on routes like:
    /profile
    /admin
    /ranking
    /login
    /register
    /matches
    """

    # If someone calls an unknown API route, return JSON instead of index.html
    if path.startswith("api/"):
        return jsonify({"msg": "API route not found"}), 404

    # If the requested file exists in dist, serve it.
    # Example: bundle.js, assets, images, favicon, etc.
    file_path = os.path.join(static_file_dir, path)

    if path and os.path.isfile(file_path):
        response = send_from_directory(static_file_dir, path)
        response.cache_control.max_age = 0
        return response

    # Otherwise always serve React index.html.
    # This is what fixes page refresh on Render.
    index_path = os.path.join(static_file_dir, "index.html")

    if os.path.isfile(index_path):
        response = send_from_directory(static_file_dir, "index.html")
        response.cache_control.max_age = 0
        return response

    return jsonify({
        "msg": "Frontend index.html not found. Backend API is running."
    }), 200


if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 3001))
    app.run(host="0.0.0.0", port=PORT, debug=True)