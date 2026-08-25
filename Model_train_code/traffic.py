import cv2
import numpy as np
import os
import tensorflow as tf
from sklearn.model_selection import train_test_split
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from google.colab import drive

# Mount Google Drive
drive.mount('/content/drive')

def load_data(data_dir):
    """
    Load image data from `data_dir`.
    Assumes `data_dir` has 43 folders named 0 to 42, each containing images.
    Returns images as numpy arrays and corresponding labels.
    """
    print(f'Loading images from "{data_dir}"...')
    images, labels = [], []

    for foldername in os.listdir(data_dir):
        folder_path = os.path.join(data_dir, foldername)
        if not os.path.isdir(folder_path) or not foldername.isdigit():
            print(f"Skipping non-integer folder: {foldername}")
            continue

        label = int(foldername)
        for filename in os.listdir(folder_path):
            img_path = os.path.join(folder_path, filename)
            img = cv2.imread(img_path)
            if img is None:
                print(f"Warning: Could not read image {img_path}")
                continue

            img = cv2.resize(img, (30, 30))
            img = np.array(img, dtype=np.float32) / 255.0

            images.append(img)
            labels.append(label)

    print(f"Successfully loaded {len(images)} images.")
    return images, labels

# Define Constants
EPOCHS = 25
IMG_WIDTH = 30
IMG_HEIGHT = 30
NUM_CATEGORIES = 43
TEST_SIZE = 0.4

# Set dataset path in Google Drive
data_dir = "/content/dataset/gtsrb"  # Change this to your dataset path

# Load Data
images, labels = load_data(data_dir)
labels = tf.keras.utils.to_categorical(labels, NUM_CATEGORIES)

# Split into train/test sets
x_train, x_test, y_train, y_test = train_test_split(
    np.array(images, dtype=np.float32),
    np.array(labels),
    test_size=TEST_SIZE,
    shuffle=True
)

# Define CNN Model
def get_model():
    model = tf.keras.models.Sequential([
        tf.keras.layers.Conv2D(64, (3, 3), activation="relu", input_shape=(IMG_WIDTH, IMG_HEIGHT, 3)),
        tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),

        tf.keras.layers.Conv2D(128, (3, 3), activation="relu"),
        tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),

        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(512, activation="relu"),
        tf.keras.layers.Dropout(0.5),

        tf.keras.layers.Dense(NUM_CATEGORIES, activation="softmax")
    ])

    model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
    return model

# Get model
model = get_model()

# Data Augmentation
datagen = ImageDataGenerator(
    rotation_range=10,
    zoom_range=0.1,
    width_shift_range=0.1,
    height_shift_range=0.1
)

# Train Model
model.fit(datagen.flow(x_train, y_train, batch_size=32),
          epochs=EPOCHS,
          validation_data=(x_test, y_test))

# Evaluate Model
model.evaluate(x_test, y_test, verbose=2)

# Save Model to Google Drive
model_path = "/content/model/model.h5"
model.save(model_path)
print(f"Model saved to {model_path}")
