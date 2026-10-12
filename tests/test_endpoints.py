import io
from PIL import Image
import pytest

def generate_test_image(size=(30, 30), color=(255, 0, 0), format="PNG"):
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    buf.seek(0)
    return buf

def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["service"] == "sign_recognition_api"
    assert "models" in data
    assert data["models"]["isl_loaded"] is True
    assert data["models"]["traffic_loaded"] is True

def test_hand_classify_valid(client):
    # Construct 21 landmarks representing an open palm
    landmarks = [
        {"x": 0.5, "y": 0.8, "z": 0.0}, # 0: Wrist
        {"x": 0.45, "y": 0.75, "z": 0.0}, # 1
        {"x": 0.40, "y": 0.70, "z": 0.0}, # 2: Thumb MCP
        {"x": 0.35, "y": 0.65, "z": 0.0}, # 3
        {"x": 0.30, "y": 0.60, "z": 0.0}, # 4: Thumb TIP (extended away)
        {"x": 0.45, "y": 0.55, "z": 0.0}, # 5: Index MCP
        {"x": 0.45, "y": 0.45, "z": 0.0}, # 6: Index PIP
        {"x": 0.45, "y": 0.35, "z": 0.0}, # 7
        {"x": 0.45, "y": 0.25, "z": 0.0}, # 8: Index TIP (extended)
        {"x": 0.50, "y": 0.55, "z": 0.0}, # 9: Middle MCP
        {"x": 0.50, "y": 0.45, "z": 0.0}, # 10: Middle PIP
        {"x": 0.50, "y": 0.35, "z": 0.0}, # 11
        {"x": 0.50, "y": 0.20, "z": 0.0}, # 12: Middle TIP (extended)
        {"x": 0.55, "y": 0.55, "z": 0.0}, # 13: Ring MCP
        {"x": 0.55, "y": 0.45, "z": 0.0}, # 14: Ring PIP
        {"x": 0.55, "y": 0.35, "z": 0.0}, # 15
        {"x": 0.55, "y": 0.25, "z": 0.0}, # 16: Ring TIP (extended)
        {"x": 0.60, "y": 0.60, "z": 0.0}, # 17: Pinky MCP
        {"x": 0.60, "y": 0.50, "z": 0.0}, # 18: Pinky PIP
        {"x": 0.60, "y": 0.40, "z": 0.0}, # 19
        {"x": 0.60, "y": 0.30, "z": 0.0}, # 20: Pinky TIP (extended)
    ]

    res = client.post("/api/hand/classify", json={
        "landmarks": landmarks,
        "handedness": "Right"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "label" in data
    assert "confidence" in data
    assert "top3" in data
    assert len(data["fingers"]) == 5

def test_hand_classify_invalid(client):
    # Incomplete landmarks (less than 21)
    res = client.post("/api/hand/classify", json={"landmarks": [{"x": 0.1, "y": 0.2}]})
    assert res.status_code == 400

    # No body
    res = client.post("/api/hand/classify", json={})
    assert res.status_code == 400

def test_isl_predict_valid(client):
    # Dummy 21 landmarks
    landmarks = [{"x": 0.5, "y": 0.5} for _ in range(21)]
    res = client.post("/api/isl/predict", json={"landmarks": landmarks})
    assert res.status_code == 200
    data = res.get_json()
    assert "label" in data
    assert "confidence" in data
    assert "top3" in data
    assert len(data["top3"]) == 3
    assert "probabilities" in data
    assert len(data["probabilities"]) == 35

def test_isl_predict_flat_array(client):
    # 42 float values
    flat = [0.1 * (i % 5) for i in range(42)]
    res = client.post("/api/isl/predict", json={"landmarks": flat})
    assert res.status_code == 200
    data = res.get_json()
    assert "label" in data

def test_isl_predict_invalid(client):
    res = client.post("/api/isl/predict", json={"landmarks": [0.1, 0.2, 0.3]})
    assert res.status_code == 400

def test_traffic_predict_valid(client):
    img_buf = generate_test_image()
    res = client.post(
        "/api/traffic/predict",
        data={"file": (img_buf, "test_sign.png")},
        content_type="multipart/form-data"
    )
    assert res.status_code == 200
    data = res.get_json()
    assert "result" in data
    assert "class_id" in data
    assert "confidence" in data
    assert "top5" in data
    assert len(data["top5"]) == 5
    assert "low_confidence" in data
    assert isinstance(data["low_confidence"], bool)

def test_traffic_predict_bad_mimetype(client):
    text_buf = io.BytesIO(b"this is not an image")
    res = client.post(
        "/api/traffic/predict",
        data={"file": (text_buf, "fake.txt")},
        content_type="multipart/form-data"
    )
    assert res.status_code == 400
    data = res.get_json()
    assert "error" in data

def test_traffic_predict_oversize(client):
    # Create 6MB payload (over 5MB limit)
    large_buf = io.BytesIO(b"A" * (6 * 1024 * 1024))
    res = client.post(
        "/api/traffic/predict",
        data={"file": (large_buf, "oversized.png")},
        content_type="multipart/form-data"
    )
    assert res.status_code in (400, 413)
