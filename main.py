from flask import Flask, render_template, Response, request
import os
from detection_modules.hand_gesture import generate_hand_frames, get_latest_gesture
from detection_modules.isl_detection import generate_isl_frames
from detection_modules.traffic_sign import predict_traffic_sign

from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Ensure the uploads directory exists
UPLOAD_FOLDER = "static/uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def index():
    return render_template('index.html')

# Hand Gesture Detection Route
@app.route('/hand_gesture')
def hand_gesture():
    return render_template('hand_gesture.html')

@app.route('/hand_gesture_feed')
def hand_gesture_feed():
    return Response(generate_hand_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/get_hand_gesture')
def get_hand_gesture_route():
    return {"gesture": get_latest_gesture()}

# Indian Sign Language (ISL) Detection Route
@app.route('/isl')
def isl():
    return render_template('isl.html')

@app.route('/isl_feed')
def isl_feed():
    return Response(generate_isl_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# Traffic Sign Recognition Route
@app.route('/traffic_sign', methods=['GET', 'POST'])
def traffic_sign():
    if request.method == 'POST':
        if 'file' not in request.files:
            return {"error": "No file uploaded"}, 400
        
        file = request.files['file']
        if file.filename == '':
            return {"error": "No selected file"}, 400

        image_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(image_path)

        predicted_label = predict_traffic_sign(image_path)
        # Return JSON for React frontend
        return {
            "result": predicted_label,
            "image_path": f"/static/uploads/{file.filename}"
        }

    return render_template('traffic_sign.html', result=None)  # Handles GET requests

if __name__ == '__main__':
    app.run(debug=True)
