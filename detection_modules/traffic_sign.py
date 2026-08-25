import cv2
import tensorflow as tf
import numpy as np
import os

# Load Traffic Sign Model only when needed
def load_traffic_model():
    model_path = "Models/gtsrb_cnn_model.h5"
    return tf.keras.models.load_model(model_path)

class_labels = {
    0: "Speed limit (20km/h)", 1: "Speed limit (30km/h)", 2: "Speed limit (50km/h)",
    3: "Speed limit (60km/h)", 4: "Speed limit (70km/h)", 5: "Speed limit (80km/h)",
    14: "Stop", 17: "No entry", 25: "Road work", 33: "Turn right ahead"
}

def preprocess_image(image_path):
    img = cv2.imread(image_path)
    img = cv2.resize(img, (30, 30))  # Resize to match the model input shape
    img = np.array(img, dtype=np.float32) / 255.0
    img = np.expand_dims(img, axis=0)
    return img

def predict_traffic_sign(image_path):
    model = load_traffic_model()
    test_image = preprocess_image(image_path)

    print(f"Image shape before prediction: {test_image.shape}")  # Debugging line

    prediction = model.predict(test_image)
    predicted_label = np.argmax(prediction)

    print(f"Predicted class: {predicted_label}, Confidence: {prediction[0][predicted_label]}")  # Debugging line

    return class_labels.get(predicted_label, "Unknown Sign")
