import logging
from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import Config
from backend.models import model_manager
from backend.routes.health import health_bp
from backend.routes.hand import hand_bp
from backend.routes.isl import isl_bp
from backend.routes.traffic import traffic_bp

def create_app(config_class=Config):
    # Configure logging
    log_level = getattr(logging, config_class.LOG_LEVEL.upper(), logging.INFO)
    logging.basicConfig(
        level=log_level,
        format="[%(asctime)s] %(levelname)s in %(name)s: %(message)s"
    )
    logger = logging.getLogger("sign_rec.app")

    app = Flask(__name__)
    app.config.from_object(config_class)

    # CORS configuration
    CORS(
        app,
        resources={r"/api/*": {"origins": config_class.CORS_ORIGINS}, r"/*": {"origins": "*"}},
        supports_credentials=True
    )

    # Load & warm up ML models once at startup
    logger.info("Initializing ML models...")
    model_manager.load_models()

    # Register blueprints under /api
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(hand_bp, url_prefix="/api/hand")
    app.register_blueprint(isl_bp, url_prefix="/api/isl")
    app.register_blueprint(traffic_bp, url_prefix="/api/traffic")

    # Legacy routes compatibility for /traffic_sign
    @app.route("/traffic_sign", methods=["POST"])
    def legacy_traffic_sign():
        # Delegate directly to traffic prediction blueprint
        from backend.routes.traffic import predict_traffic
        return predict_traffic()

    # Legacy /get_hand_gesture route
    @app.route("/get_hand_gesture", methods=["GET"])
    def legacy_hand_gesture():
        return jsonify({"gesture": "Waiting for client-side webcam landmarks..."})

    # Error Handlers with consistent JSON structure
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": getattr(error, "description", "Bad Request"), "code": 400}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Endpoint not found", "code": 404}), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({"error": "Method Not Allowed", "code": 405}), 405

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({"error": "File size exceeds the 5MB limit", "code": 413}), 413

    @app.errorhandler(500)
    def internal_error(error):
        logger.error("Internal Server Error: %s", error)
        return jsonify({"error": "Internal server error occurred", "code": 500}), 500

    logger.info("Application initialized successfully.")
    return app
