import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PORT = int(os.getenv("PORT", 5000))
    HOST = os.getenv("HOST", "0.0.0.0")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 5 * 1024 * 1024))  # 5 MB
    CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", 0.6))
    ISL_MODEL_PATH = os.getenv("ISL_MODEL_PATH", os.path.join("Models", "ISLmodel.h5"))
    TRAFFIC_MODEL_PATH = os.getenv("TRAFFIC_MODEL_PATH", os.path.join("Models", "gtsrb_cnn_model.h5"))
    DEBUG = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")
    LEGACY_STREAM = os.getenv("LEGACY_STREAM", "0") in ("true", "1", "yes")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
