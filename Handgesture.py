import cv2
import mediapipe as mp
import numpy as np

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.7)

# Function to classify hand gestures
def classify_gesture(landmarks):
    fingers = []
    
    # Thumb (Check x-coordinate since it's sideways)
    if landmarks[4].x < landmarks[3].x:
        fingers.append(1)  # Thumb up
    else:
        fingers.append(0)  # Thumb down
    
    # Other fingers (Check if tip is above lower joint)
    for tip, base in [(8, 6), (12, 10), (16, 14), (20, 18)]:
        fingers.append(1 if landmarks[tip].y < landmarks[base].y else 0)

    # Gesture rules
    if fingers == [1, 1, 1, 1, 1]: 
        return "Hi (Open Palm)"
    elif fingers == [0, 0, 0, 0, 0]: 
        return "Fist"
    elif fingers == [0, 1, 1, 0, 0]: 
        return "Peace "
    elif fingers == [1, 0, 0, 0, 1]:
        return "Hang Loose"
    elif fingers == [1, 1, 0, 0, 0]:
        return "Loser"
    elif fingers == [0, 1, 0, 0, 0]:
        return "You"
    elif fingers == [0, 1, 0, 0, 1]:
        return "Rock"
    else:
        return "Unknown"

# Open webcam
cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    # Flip image for mirror effect
    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb_frame)

    if result.multi_hand_landmarks:
        for hand_landmarks in result.multi_hand_landmarks:
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            gesture = classify_gesture(hand_landmarks.landmark)

            # Display Gesture Text
            cv2.putText(frame, gesture, (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)

    cv2.imshow("Hand Gesture Recognition", frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
