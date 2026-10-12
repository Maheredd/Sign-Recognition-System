# Multi-Stage Dockerfile for Sign Recognition System

# ── Stage 1: Build React Frontend ─────────────────────────
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python Backend & Unified Runtime ─────────────
FROM python:3.12-slim AS runner

WORKDIR /app

# Install system dependencies for OpenCV and MediaPipe
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy backend code, models, and configs
COPY backend/ ./backend/
COPY Models/ ./Models/
COPY main.py .env ./
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV PORT=5000 \
    HOST=0.0.0.0 \
    DEBUG=false \
    LOG_LEVEL=INFO

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "4", "--timeout", "120", "main:app"]
