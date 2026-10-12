import copy
import numpy as np
from flask import Blueprint, request, jsonify
from backend.models import model_manager

isl_bp = Blueprint("isl", __name__)

def preprocess_isl_landmarks(raw_landmarks, width=640, height=480):
    """
    Convert raw landmarks (21 points or 42 numbers) into the exact 42 normalized
    wrist-relative features expected by ISLmodel.h5.
    """
    if not isinstance(raw_landmarks, (list, tuple)):
        return None

    # Case 1: Already flat 42 numbers
    if len(raw_landmarks) == 42 and all(isinstance(v, (int, float)) for v in raw_landmarks):
        features = list(raw_landmarks)
        max_val = max(map(abs, features)) or 1.0
        return np.array([v / max_val for v in features], dtype=np.float32).reshape(1, 42)

    # Case 2: 21 landmark points
    if len(raw_landmarks) != 21:
        return None

    points = []
    for lm in raw_landmarks:
        if isinstance(lm, dict):
            # Coordinates in range [0, 1]
            x_norm = float(lm.get("x", 0.0))
            y_norm = float(lm.get("y", 0.0))
            px = min(int(x_norm * width), width - 1)
            py = min(int(y_norm * height), height - 1)
            points.append([px, py])
        elif isinstance(lm, (list, tuple)) and len(lm) >= 2:
            x_val = float(lm[0])
            y_val = float(lm[1])
            # If normalized in [0, 1], scale to pixel space
            if 0.0 <= x_val <= 1.0 and 0.0 <= y_val <= 1.0:
                px = min(int(x_val * width), width - 1)
                py = min(int(y_val * height), height - 1)
                points.append([px, py])
            else:
                points.append([int(x_val), int(y_val)])
        else:
            return None

    # Convert to wrist-relative coordinates
    base_x, base_y = points[0][0], points[0][1]
    relative_coords = []
    for px, py in points:
        relative_coords.append(px - base_x)
        relative_coords.append(py - base_y)

    # Normalize by max absolute value
    max_value = max(map(abs, relative_coords))
    if max_value == 0:
        max_value = 1.0

    normalized_features = [v / max_value for v in relative_coords]
    return np.array(normalized_features, dtype=np.float32).reshape(1, 42)

@isl_bp.route("/predict", methods=["POST"])
def predict_isl():
    data = request.get_json(silent=True)
    if not data or "landmarks" not in data:
        return jsonify({
            "error": "Invalid request body: 'landmarks' containing 21 points or 42 coordinates is required"
        }), 400

    width = int(data.get("width", 640))
    height = int(data.get("height", 480))

    features = preprocess_isl_landmarks(data["landmarks"], width=width, height=height)
    if features is None:
        return jsonify({
            "error": "Could not parse landmarks: expected 21 points (x, y) or flat array of 42 floats"
        }), 400

    try:
        prediction = model_manager.predict_isl(features)
        # Add metadata explaining model constraints
        prediction["model_info"] = {
            "feature_count": 42,
            "architecture": "MLP (42 landmarks -> 35 classes)",
            "limitation": "Trained on single dominant hand. Two-handed signs are not supported by this model."
        }
        return jsonify(prediction), 200
    except Exception as e:
        return jsonify({"error": f"Inference failure: {str(e)}"}), 500
