import os
import threading
import logging
import numpy as np
import tensorflow as tf
from backend.config import Config
from backend.labels import GTSRB_LABELS, ISL_LABELS

logger = logging.getLogger("sign_rec.models")

class ModelManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ModelManager, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.isl_model = None
        self.traffic_model = None
        self.isl_loaded = False
        self.traffic_loaded = False
        self._init_lock = threading.Lock()
        self._initialized = True

    def load_models(self):
        with self._init_lock:
            # 1. Load ISL Model
            isl_path = Config.ISL_MODEL_PATH
            if os.path.exists(isl_path):
                try:
                    logger.info("Loading ISL model from %s...", isl_path)
                    self.isl_model = tf.keras.models.load_model(isl_path, compile=False)
                    # Warm up
                    dummy_isl = np.zeros((1, 42), dtype=np.float32)
                    _ = self.isl_model(dummy_isl, training=False)
                    self.isl_loaded = True
                    logger.info("ISL model loaded and warmed up successfully.")
                except Exception as e:
                    logger.error("Failed to load ISL model from %s: %s", isl_path, e)
            else:
                logger.warning("ISL model file not found at %s", isl_path)

            # 2. Load Traffic Model
            traffic_path = Config.TRAFFIC_MODEL_PATH
            if os.path.exists(traffic_path):
                try:
                    logger.info("Loading Traffic Sign model from %s...", traffic_path)
                    self.traffic_model = tf.keras.models.load_model(traffic_path, compile=False)
                    # Warm up
                    dummy_traffic = np.zeros((1, 30, 30, 3), dtype=np.float32)
                    _ = self.traffic_model(dummy_traffic, training=False)
                    self.traffic_loaded = True
                    logger.info("Traffic Sign model loaded and warmed up successfully.")
                except Exception as e:
                    logger.error("Failed to load Traffic model from %s: %s", traffic_path, e)
            else:
                logger.warning("Traffic model file not found at %s", traffic_path)

    def predict_isl(self, input_features):
        """
        Predict ISL sign from 42 normalized landmark features.
        input_features: np.ndarray of shape (1, 42) or (42,)
        """
        if not self.isl_loaded or self.isl_model is None:
            raise RuntimeError("ISL model is not loaded")

        features = np.asarray(input_features, dtype=np.float32)
        if features.ndim == 1:
            features = np.expand_dims(features, axis=0)

        raw_pred = self.isl_model(features, training=False).numpy()[0]
        # Softmax if not already normalized
        probs = np.clip(raw_pred, 0.0, 1.0)
        total = float(np.sum(probs))
        if total > 0:
            probs = probs / total

        predicted_idx = int(np.argmax(probs))
        top_indices = np.argsort(probs)[::-1][:3]

        top3 = [
            {
                "label": ISL_LABELS[i] if i < len(ISL_LABELS) else f"Unknown ({i})",
                "confidence": round(float(probs[i]), 4)
            }
            for i in top_indices
        ]

        all_probs = {
            ISL_LABELS[i]: round(float(probs[i]), 4)
            for i in range(min(len(ISL_LABELS), len(probs)))
        }

        label = ISL_LABELS[predicted_idx] if predicted_idx < len(ISL_LABELS) else "Unknown"
        confidence = round(float(probs[predicted_idx]), 4)

        return {
            "label": label,
            "confidence": confidence,
            "top3": top3,
            "probabilities": all_probs,
            "is_reliable": confidence >= 0.45
        }

    def predict_traffic(self, image_batch):
        """
        Predict traffic sign from normalized image array.
        image_batch: np.ndarray of shape (1, 30, 30, 3) with values in [0, 1]
        """
        if not self.traffic_loaded or self.traffic_model is None:
            raise RuntimeError("Traffic Sign model is not loaded")

        batch = np.asarray(image_batch, dtype=np.float32)
        if batch.ndim == 3:
            batch = np.expand_dims(batch, axis=0)

        raw_pred = self.traffic_model(batch, training=False).numpy()[0]
        probs = np.clip(raw_pred, 0.0, 1.0)
        total = float(np.sum(probs))
        if total > 0:
            probs = probs / total

        predicted_class = int(np.argmax(probs))
        confidence = round(float(probs[predicted_class]), 4)
        top5_indices = np.argsort(probs)[::-1][:5]

        top5 = [
            {
                "class_id": int(i),
                "label": GTSRB_LABELS.get(int(i), f"Class {i}"),
                "confidence": round(float(probs[i]), 4)
            }
            for i in top5_indices
        ]

        label = GTSRB_LABELS.get(predicted_class, f"Class {predicted_class}")

        return {
            "result": label,
            "class_id": predicted_class,
            "confidence": confidence,
            "top5": top5,
            "low_confidence": bool(confidence < Config.CONFIDENCE_THRESHOLD)
        }

    def get_status(self):
        return {
            "isl_loaded": self.isl_loaded,
            "traffic_loaded": self.traffic_loaded,
            "tensorflow_version": tf.__version__
        }

# Global singleton
model_manager = ModelManager()
