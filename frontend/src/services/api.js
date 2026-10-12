/**
 * Centralized API client module with Vite proxy and error handling
 */
const API_BASE = import.meta.env.VITE_API_URL || '';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg = (isJson && data.error) ? data.error : `HTTP error ${response.status}: ${response.statusText}`;
      throw new ApiError(errorMsg, response.status, data);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err; // Allow caller to ignore aborted requests
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      `Unable to reach backend server. Please check if Flask backend is running on ${API_BASE || 'localhost:5000'}.`,
      0,
      { originalError: err.message }
    );
  }
}

export const api = {
  getHealth: (signal) => request('/api/health', { signal }),

  classifyHand: (landmarks, handedness = 'Right', sessionId = 'default', signal) =>
    request('/api/hand/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ landmarks, handedness, session_id: sessionId }),
      signal,
    }),

  predictISL: (landmarks, width = 640, height = 480, signal) =>
    request('/api/isl/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ landmarks, width, height }),
      signal,
    }),

  predictTraffic: (file, signal) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/api/traffic/predict', {
      method: 'POST',
      body: formData,
      signal,
    });
  },
};
