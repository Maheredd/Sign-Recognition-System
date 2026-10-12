import math
from collections import deque, Counter
from flask import Blueprint, request, jsonify

hand_bp = Blueprint("hand", __name__)

# Session-based rolling smoothing buffer: {session_id: deque(maxlen=7)}
_SESSION_BUFFERS = {}
_MAX_BUFFER_SIZE = 7

def euclidean_dist(p1, p2):
    return math.sqrt(
        (p1[0] - p2[0]) ** 2 +
        (p1[1] - p2[1]) ** 2 +
        (p1[2] - p2[2]) ** 2
    )

def parse_landmarks(raw_landmarks):
    """Normalize raw landmark format into a list of 21 [x, y, z] points."""
    if not isinstance(raw_landmarks, (list, tuple)) or len(raw_landmarks) != 21:
        return None

    parsed = []
    for lm in raw_landmarks:
        if isinstance(lm, dict):
            parsed.append([
                float(lm.get("x", 0.0)),
                float(lm.get("y", 0.0)),
                float(lm.get("z", 0.0))
            ])
        elif isinstance(lm, (list, tuple)):
            if len(lm) >= 3:
                parsed.append([float(lm[0]), float(lm[1]), float(lm[2])])
            elif len(lm) == 2:
                parsed.append([float(lm[0]), float(lm[1]), 0.0])
            else:
                return None
        else:
            return None
    return parsed

def classify_fingers(points, handedness="Right"):
    """
    Orientation- and handedness-independent finger state detector.
    Returns: list of 5 ints [thumb, index, middle, ring, pinky] (1 = extended, 0 = curled)
             and finger margin scores.
    """
    p0 = points[0]   # Wrist
    p17 = points[17] # Pinky MCP

    # Palm reference scale (wrist to middle MCP)
    p9 = points[9]   # Middle MCP
    palm_scale = euclidean_dist(p0, p9)
    if palm_scale < 1e-4:
        palm_scale = 1.0

    # 1. Four fingers (Index, Middle, Ring, Pinky)
    # Using relative distance to wrist & MCP joint angles
    finger_indices = [
        (8, 6, 5),   # Index: (tip, pip, mcp)
        (12, 10, 9), # Middle
        (16, 14, 13),# Ring
        (20, 18, 17) # Pinky
    ]

    finger_states = []
    confidence_factors = []

    for tip_idx, pip_idx, mcp_idx in finger_indices:
        tip = points[tip_idx]
        pip = points[pip_idx]
        mcp = points[mcp_idx]

        d_wrist_tip = euclidean_dist(p0, tip)
        d_wrist_pip = euclidean_dist(p0, pip)
        d_mcp_tip = euclidean_dist(mcp, tip)
        d_mcp_pip = euclidean_dist(mcp, pip)

        # Extended if tip is farther from wrist than PIP and MCP-to-tip is extended
        is_extended = (d_wrist_tip > d_wrist_pip * 1.05) and (d_mcp_tip > d_mcp_pip * 1.15)
        finger_states.append(1 if is_extended else 0)

        # Measure margin for confidence
        margin = abs(d_wrist_tip - d_wrist_pip) / palm_scale
        confidence_factors.append(min(1.0, margin * 2.0))

    # 2. Thumb: Invariant calculation
    # Thumb Tip (4) vs Thumb MCP (2), compared to Pinky MCP (17)
    p4 = points[4] # Thumb TIP
    p2 = points[2] # Thumb MCP
    p3 = points[3] # Thumb IP

    d_thumb_pinky = euclidean_dist(p4, p17)
    d_mcp_pinky = euclidean_dist(p2, p17)
    d_wrist_thumb = euclidean_dist(p0, p4)
    d_wrist_thumb_mcp = euclidean_dist(p0, p2)

    # When thumb is open/extended: tip extends away from pinky base and wrist
    thumb_extended = (d_thumb_pinky > d_mcp_pinky * 1.12) and (d_wrist_thumb > d_wrist_thumb_mcp * 1.08)
    thumb_state = 1 if thumb_extended else 0
    thumb_margin = abs(d_thumb_pinky - d_mcp_pinky) / palm_scale
    confidence_factors.insert(0, min(1.0, thumb_margin * 2.0))

    fingers = [thumb_state] + finger_states
    avg_conf = sum(confidence_factors) / len(confidence_factors)
    return fingers, avg_conf

def match_gesture(fingers, points):
    """Match finger patterns to gesture labels."""
    f = tuple(fingers)
    p0 = points[0]
    p4 = points[4]
    p8 = points[8]

    # Special check: OK sign (Thumb tip touches Index tip, other 3 extended)
    d_thumb_index = euclidean_dist(p4, p8)
    p9 = points[9]
    palm_scale = max(1e-4, euclidean_dist(p0, p9))
    if d_thumb_index < 0.35 * palm_scale and fingers[2] == 1 and fingers[3] == 1 and fingers[4] == 1:
        return "OK"

    # Standard gestures
    gestures_map = {
        (1, 1, 1, 1, 1): "Hi (Open Palm)",
        (0, 0, 0, 0, 0): "Fist",
        (0, 1, 1, 0, 0): "Peace",
        (1, 0, 0, 0, 1): "Hang Loose",
        (1, 1, 0, 0, 0): "Loser",
        (0, 1, 0, 0, 0): "You",
        (0, 1, 0, 0, 1): "Rock",
        (0, 1, 1, 1, 1): "Four Fingers",
        (0, 1, 1, 1, 0): "Three Fingers",
    }

    if f in gestures_map:
        return gestures_map[f]

    # Thumbs up / down
    if f == (1, 0, 0, 0, 0):
        if p4[1] < p0[1]:
            return "Thumbs Up"
        else:
            return "Thumbs Down"

    return "Unknown"

@hand_bp.route("/classify", methods=["POST"])
def classify_hand_gesture():
    data = request.get_json(silent=True)
    if not data or "landmarks" not in data:
        return jsonify({"error": "Invalid request body: 'landmarks' array of 21 points required"}), 400

    points = parse_landmarks(data["landmarks"])
    if points is None:
        return jsonify({"error": "Landmarks must contain exactly 21 valid coordinate points"}), 400

    handedness = data.get("handedness", "Right")
    session_id = str(data.get("session_id", "default"))

    fingers, base_conf = classify_fingers(points, handedness=handedness)
    raw_gesture = match_gesture(fingers, points)

    # Rolling buffer majority-vote smoothing
    if session_id not in _SESSION_BUFFERS:
        _SESSION_BUFFERS[session_id] = deque(maxlen=_MAX_BUFFER_SIZE)
    buffer = _SESSION_BUFFERS[session_id]
    buffer.append(raw_gesture)

    # Majority vote
    counts = Counter(buffer)
    majority_label, majority_count = counts.most_common(1)[0]
    stability = round(majority_count / len(buffer), 2)

    # Final confidence combines geometric margin and temporal stability
    confidence = round(min(0.99, max(0.40, (base_conf * 0.4) + (stability * 0.6))), 2)

    # Top-3 candidates based on history or standard list
    top_candidates = []
    for lbl, count in counts.most_common(3):
        top_candidates.append({
            "label": lbl,
            "confidence": round(count / len(buffer), 2)
        })

    # Cleanup buffer if too many sessions
    if len(_SESSION_BUFFERS) > 500:
        _SESSION_BUFFERS.clear()

    return jsonify({
        "label": majority_label,
        "raw_label": raw_gesture,
        "confidence": confidence,
        "stability": stability,
        "fingers": fingers,
        "top3": top_candidates,
        "handedness": handedness
    }), 200
