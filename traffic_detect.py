import cv2
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt

# 🔹 Load the saved model
model_path = "Models\gtsrb_cnn_model.h5"  # Ensure the correct model path
# model_path = "model.h5"  # Ensure the correct model path
model = tf.keras.models.load_model(model_path)
print("✅ Model loaded successfully!")

# 🔹 Define All Class Labels
class_labels = {
    0: "Speed limit (20km/h)", 1: "Speed limit (30km/h)", 2: "Speed limit (50km/h)",
    3: "Speed limit (60km/h)", 4: "Speed limit (70km/h)", 5: "Speed limit (80km/h)",
    6: "End of speed limit (80km/h)", 7: "Speed limit (100km/h)", 8: "Speed limit (120km/h)",
    9: "No overtaking", 10: "No overtaking (trucks)", 11: "Right-of-way at next intersection",
    12: "Priority road", 13: "Yield", 14: "Stop", 15: "No vehicles",
    16: "Vehicles > 3.5 tons prohibited", 17: "No entry", 18: "General caution",
    19: "Dangerous curve left", 20: "Dangerous curve right", 21: "Double curve",
    22: "Bumpy road", 23: "Slippery road", 24: "Road narrows on right",
    25: "Road work", 26: "Traffic signals", 27: "Pedestrians",
    28: "Children crossing", 29: "Bicycles crossing", 30: "Beware of ice/snow",
    31: "Wild animals crossing", 32: "End of speed limit and overtaking restrictions",
    33: "Turn right ahead", 34: "Turn left ahead", 35: "Ahead only",
    36: "Go straight or right", 37: "Go straight or left", 38: "Keep right",
    39: "Keep left", 40: "Roundabout mandatory", 41: "End of no overtaking",
    42: "End of no overtaking (trucks)"
}

# 🔹 Preprocess the Image
def preprocess_image(image_path):
    img = cv2.imread(image_path)
    img = cv2.resize(img, (30, 30))  # Resize to match model input
    img = np.array(img, dtype=np.float32) / 255.0  # Normalize pixel values
    img = np.expand_dims(img, axis=0)  
    return img

# 🔹 Load and Preprocess the Image
image_path = "all/42.png"  # Change this to your test image path
img = cv2.imread(image_path)
plt.imshow(img[..., ::-1])  # Convert BGR to RGB for display
plt.axis('off')
plt.show()

test_image = preprocess_image(image_path)

# 🔹 Make Prediction
prediction = model.predict(test_image)
predicted_class = np.argmax(prediction)

# 🔹 Display the Predicted Class
predicted_label = class_labels.get(predicted_class, "Unknown Sign")
print(f"🚦 Predicted Traffic Sign: {predicted_label} (Class {predicted_class})")