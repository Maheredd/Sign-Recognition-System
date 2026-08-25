import cv2
import mediapipe as mp
import copy
import itertools
from tensorflow import keras
import numpy as np
import pandas as pd
import string

# Load ISL model
model = keras.models.load_model("Models/ISLmodel.h5")

mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_hands = mp.solutions.hands

alphabet = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] + list(string.ascii_uppercase)

def calc_landmark_list(image, landmarks):
    image_width, image_height = image.shape[1], image.shape[0]
    landmark_point = []

    for _, landmark in enumerate(landmarks.landmark):
        landmark_x = min(int(landmark.x * image_width), image_width - 1)
        landmark_y = min(int(landmark.y * image_height), image_height - 1)
        landmark_point.append([landmark_x, landmark_y])

    return landmark_point

def pre_process_landmark(landmark_list):
    if len(landmark_list) == 0:
        return np.zeros(42)  # Return 42 zeros if no hand is detected

    temp_landmark_list = copy.deepcopy(landmark_list)

    base_x, base_y = temp_landmark_list[0]
    for index, (x, y) in enumerate(temp_landmark_list):
        temp_landmark_list[index][0] = x - base_x
        temp_landmark_list[index][1] = y - base_y

    # Flatten the list
    temp_landmark_list = list(itertools.chain.from_iterable(temp_landmark_list))

    # Ensure exactly 42 values
    if len(temp_landmark_list) < 42:
        temp_landmark_list += [0] * (42 - len(temp_landmark_list))  # Pad with zeros if needed
    elif len(temp_landmark_list) > 42:
        temp_landmark_list = temp_landmark_list[:42]  # Trim if excess

    max_value = max(map(abs, temp_landmark_list), default=1)
    temp_landmark_list = [n / max_value for n in temp_landmark_list]

    return np.array(temp_landmark_list).reshape(1, 42)  # Reshape to (1, 42) for model input

def generate_isl_frames():
    cap = cv2.VideoCapture(0)
    with mp_hands.Hands(
        model_complexity=0,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    ) as hands:
        while cap.isOpened():
            success, image = cap.read()
            if not success:
                break

            image = cv2.flip(image, 1)
            image.flags.writeable = False
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = hands.process(image)

            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    landmark_list = calc_landmark_list(image, hand_landmarks)
                    pre_processed_landmark_list = pre_process_landmark(landmark_list)

                    # Model Prediction
                    prediction = model.predict(pre_processed_landmark_list, verbose=0)
                    predicted_class = np.argmax(prediction, axis=1)[0]
                    label = alphabet[predicted_class]

                    # Draw and display label
                    cv2.putText(image, label, (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 2)
                    mp_drawing.draw_landmarks(
                        image, hand_landmarks, mp_hands.HAND_CONNECTIONS,
                        mp_drawing_styles.get_default_hand_landmarks_style(),
                        mp_drawing_styles.get_default_hand_connections_style()
                    )

            ret, buffer = cv2.imencode('.jpg', image)
            frame = buffer.tobytes()
            yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    cap.release()
