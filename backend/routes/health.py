import time
from flask import Blueprint, jsonify
from backend.models import model_manager

health_bp = Blueprint("health", __name__)
_START_TIME = time.time()

@health_bp.route("/health", methods=["GET"])
def health_check():
    status = model_manager.get_status()
    uptime_sec = round(time.time() - _START_TIME, 1)
    is_healthy = status.get("isl_loaded", False) and status.get("traffic_loaded", False)

    return jsonify({
        "status": "healthy" if is_healthy else "degraded",
        "service": "sign_recognition_api",
        "uptime_seconds": uptime_sec,
        "models": status
    }), 200
