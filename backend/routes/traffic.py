import io
from PIL import Image
import numpy as np
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from backend.models import model_manager
from backend.config import Config

traffic_bp = Blueprint("traffic", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
ALLOWED_MIMETYPES = {"image/png", "image/jpeg", "image/webp"}

def allowed_file(filename, content_type):
    has_ext = "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    is_mime = content_type in ALLOWED_MIMETYPES or content_type.startswith("image/")
    return has_ext and is_mime

def preprocess_traffic_image(image_bytes):
    """Read image bytes in memory, resize to 30x30, RGB, normalize to float32 [0, 1]."""
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((30, 30), Image.Resampling.BILINEAR)
        arr = np.asarray(img, dtype=np.float32) / 255.0
        return np.expand_dims(arr, axis=0)
    except Exception as e:
        raise ValueError(f"Failed to decode image data: {str(e)}")

@traffic_bp.route("/predict", methods=["POST"])
def predict_traffic():
    # Check if multipart file or JSON with base64
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Expected 'file' multipart field."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename provided."}), 400

    safe_name = secure_filename(file.filename)
    content_type = file.content_type or ""

    if not allowed_file(safe_name, content_type):
        return jsonify({
            "error": f"Invalid file type '{content_type}'. Supported formats: PNG, JPG, JPEG, WebP."
        }), 400

    # Read bytes and check size (<= 5MB)
    image_bytes = file.read()
    if len(image_bytes) > Config.MAX_CONTENT_LENGTH:
        return jsonify({
            "error": f"File size exceeds maximum limit of {Config.MAX_CONTENT_LENGTH // (1024*1024)}MB."
        }), 413

    if len(image_bytes) == 0:
        return jsonify({"error": "Uploaded file is empty."}), 400

    try:
        processed_img = preprocess_traffic_image(image_bytes)
        result = model_manager.predict_traffic(processed_img)
        result["filename"] = safe_name
        return jsonify(result), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Internal prediction failure: {str(e)}"}), 500
