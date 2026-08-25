import cv2
import mediapipe as mp
from flask import Response

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.7)

# Global variable to store the latest detected gesture
latest_gesture = "Waiting..."

def classify_gesture(landmarks):
    fingers = []
    if landmarks[4].x < landmarks[3].x:
        fingers.append(1)
    else:
        fingers.append(0)

    for tip, base in [(8, 6), (12, 10), (16, 14), (20, 18)]:
        fingers.append(1 if landmarks[tip].y < landmarks[base].y else 0)

    gestures = {
        (1, 1, 1, 1, 1): "Hi (Open Palm)",
        (0, 0, 0, 0, 0): "Fist",
        (0, 1, 1, 0, 0): "Peace",
        (1, 0, 0, 0, 1): "Hang Loose",
        (1, 1, 0, 0, 0): "Loser",
        (0, 1, 0, 0, 0): "You",
        (0, 1, 0, 0, 1): "Rock"
    }
    return gestures.get(tuple(fingers), "Unknown")

def get_latest_gesture():
    global latest_gesture
    return latest_gesture

def generate_hand_frames():
    global latest_gesture
    cap = cv2.VideoCapture(0)
    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break

        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = hands.process(rgb_frame)

        if result.multi_hand_landmarks:
            for hand_landmarks in result.multi_hand_landmarks:
                mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
                gesture = classify_gesture(hand_landmarks.landmark)
                latest_gesture = gesture  # Update global variable
                cv2.putText(frame, gesture, (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
        else:
             latest_gesture = "No Hand Detected"

        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    cap.release()
