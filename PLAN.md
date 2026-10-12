# Comprehensive Refactor & Upgrade Plan: AI Sign Recognition System

## Overview & Architecture
This project refactors the Sign Recognition System from a legacy monolithic Flask backend (server-side `cv2.VideoCapture(0)`) and basic React UI into a modern, privacy-preserving, production-ready computer vision application:
- **Client-Side Vision:** Web browser captures video via `getUserMedia` and runs `@mediapipe/tasks-vision` HandLandmarker locally. Only 21 normalized landmarks (x, y, z) are sent to the backend over HTTP.
- **Backend Architecture:** Flask Application Factory (`create_app`) with modular Blueprints under `/api`:
  - `/api/health`: Service & model status
  - `/api/hand/classify`: Orientation- and handedness-independent rule engine with majority voting smoothing
  - `/api/isl/predict`: Keras ISL MLP classifier on 42 relative normalized keypoints with top-3 and confidence scoring
  - `/api/traffic/predict`: GTSRB CNN classifier mapping all 43 classes, top-5 predictions, low-confidence flag (< 0.6), in-memory image validation (MIME/size <= 5MB)
- **Frontend Architecture:** React 19 + Vite + Tailwind CSS v4 + Framer Motion + Lucide Icons + Three.js background, complete with telemetry HUD, ISL sentence builder + Web Speech TTS, traffic sign sample gallery & history, Model Insights (`/insights`), ISL Learn & quiz mini-game, accessible responsive navigation, and leak-free custom cursor.

---

## Phase Breakdown

### Phase 1: Backend Restructure
1. **Flask Application Factory & Blueprints**:
   - Create `backend/` directory structure with `create_app()` in `backend/__init__.py`.
   - Blueprints:
     - `backend/routes/health.py` (`/api/health`)
     - `backend/routes/hand.py` (`/api/hand/classify`)
     - `backend/routes/isl.py` (`/api/isl/predict`)
     - `backend/routes/traffic.py` (`/api/traffic/predict`)
2. **Model Management**:
   - `backend/models.py`: Lazy singleton manager that loads `ISLmodel.h5` and `gtsrb_cnn_model.h5` once, performs a dummy warm-up inference at startup, and provides thread-safe prediction helpers.
3. **Labels & Validation**:
   - `backend/labels.py`: Full 43-class GTSRB dictionary and 35-class ISL dictionary (`1-9` + `A-Z`).
   - Traffic upload processing: In-memory stream (`BytesIO`), MIME type verification (JPEG/PNG/WebP), size limit (5MB), top-5 probabilities, `low_confidence` threshold (< 0.6).
4. **Environment & Logging**:
   - `.env` configuration (PORT=5000, CORS_ORIGINS, UPLOAD_MAX_MB=5, LOG_LEVEL=INFO).
   - Structured JSON logging and standardized error handler (`{"error": str, "code": int}`).
5. **Testing**:
   - Pytest suite in `tests/` covering: health check, valid hand landmarks, invalid hand landmarks, ISL landmark array, traffic sign prediction with sample image, oversize image rejection, and bad MIME type rejection.

### Phase 2: Recognition Quality
1. **Orientation & Handedness Independent Hand Gesture Classification**:
   - Eliminate hardcoded `x` coordinate comparisons for thumbs.
   - Vector-based finger curl/extension: compute angle between metacarpal-proximal and proximal-distal segments, or projection of tip relative to MCP along the palm normal/orientation vector.
   - Support both Left and Right hands by normalizing thumb abduction relative to wrist-to-pinky palm direction.
   - Server-side majority-vote smoothing over a rolling buffer of $N=7$ frames with a stability threshold.
2. **ISL Temporal Stability**:
   - Confidence thresholding on model output softmax.
   - Return class distribution and top-3 predictions.
   - Document single-hand (42-feature) limitation clearly.
3. **Latency Benchmarking**:
   - Benchmark model inference latency (Keras vs TFLite/ONNX comparison) and report stats.

### Phase 3: Frontend Client-Side Vision
1. **MediaPipe & Webcam Integration**:
   - Install `@mediapipe/tasks-vision`.
   - Implement `useWebcam` hook: handles camera permissions, device selection, stream lifecycle, unmount cleanup, and fallback states.
   - Implement `useHandTracking` hook: loads `@mediapipe/tasks-vision` HandLandmarker using CDN wasm assets, runs at camera frame rate (30-60 FPS) in `requestVideoFrameCallback` / `requestAnimationFrame`.
2. **Canvas Visualizer Overlay**:
   - Glowing 21-point neon hand skeleton overlay with pulsating fingertips and distinct accent colors (blue for gesture, purple for ISL).
3. **Throttled Network Client**:
   - `src/services/api.js`: Centralized Axios/fetch client using `import.meta.env.VITE_API_URL` and Vite proxy (`/api -> http://localhost:5000`).
   - Throttled API calls (10-15 Hz) with `AbortController` to cancel in-flight stale requests.
   - Privacy banner: explicitly informing users that only 21 landmark coordinate pairs are transmitted, no raw video frames leave the device.

### Phase 4: Dynamic Features & Technical UI
1. **Live Telemetry Panel**:
   - FPS counter, client detection latency, backend inference latency (ms), confidence gauge ring, top-3 animated probability bars.
2. **ISL Sentence Builder & Text-to-Speech**:
   - Hold-to-commit logic (~700ms stability timer with visual progress radial ring).
   - Word buffer with Space, Backspace, Clear, and Copy to clipboard.
   - Web Speech API integration to speak synthesized sentences aloud in English / Hindi.
3. **Traffic Sign Recognition Upgrades**:
   - Drag-and-drop zone with instant image preview.
   - Top-5 animated confidence bars and low-confidence warning card.
   - Curated sample images gallery (Stop, Speed 30, Yield, Road work, No Entry) for one-click testing without user upload.
   - Session history carousel/strip with past predictions and timestamps.
4. **Model Insights Page (`/insights`)**:
   - Interactive dashboard showing training loss/accuracy curves, GTSRB per-class performance, confusion matrix preview, and model architecture specs.
5. **ISL Learn Mode & Quiz Game**:
   - Interactive reference cards for all 35 signs.
   - "Match the Sign" game: challenges the user to perform target letters with a countdown and score counter.
6. **UX, Accessibility & Performance Polish**:
   - Fix `Cursor.jsx`: Replace document mutation observer listeners with single document event delegation; hide on touch/coarse pointers.
   - Responsive mobile navigation with hamburger drawer.
   - English / Hindi UI language switch.
   - Respect `prefers-reduced-motion` and add "Reduce Effects" toggle to pause Three.js background and heavy gradients.
   - React.lazy route code-splitting and 404 route (`NotFound.jsx`).

### Phase 5: Repo Cleanup, Training Code & DevOps
1. **Repo Cleanup**:
   - Delete duplicate root scripts: `Handgesture.py`, `isl_detection.py`, `traffic_detect.py`.
   - Remove committed `__pycache__` and clean `.gitignore`.
   - Convert UTF-16 files (`requirements.txt`, `README.md`) to standard UTF-8.
   - Generate minimal pinned `requirements.txt`.
   - Document or archive `Models/model.h5` in favor of `gtsrb_cnn_model.h5`.
2. **Training Scripts**:
   - Refactor `Model_train_code/traffic.py` to be local-executable without `google.colab`.
   - Add proper train/val/test split, data augmentation, early stopping, and save `metrics.json` and confusion matrix.
3. **DevOps & Documentation**:
   - Multi-stage `Dockerfile` and `docker-compose.yml` for unified deployment.
   - GitHub Actions workflow (`.github/workflows/ci.yml`) for pytest, lint, and frontend build.
   - Cross-platform start script (`npm run dev:all` / `start.ps1`).
   - Comprehensive `README.md` with Mermaid architecture diagram, API documentation, quickstart guide, and privacy notes.
