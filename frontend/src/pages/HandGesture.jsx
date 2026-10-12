import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Video,
  StopCircle,
  Camera,
  AlertCircle,
  Hand,
  RefreshCw,
} from 'lucide-react';
import { useWebcam } from '../hooks/useWebcam';
import { useHandTracking } from '../hooks/useHandTracking';
import HandCanvas from '../components/HandCanvas';
import TelemetryHUD from '../components/TelemetryHUD';
import { api } from '../services/api';

const FINGER_NAMES = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
const generateSessionId = () => `session_${Math.random().toString(36).substring(2, 9)}`;

const HandGesture = () => {
  const {
    videoRef,
    isActive,
    error: webcamError,
    startStream,
    stopStream,
  } = useWebcam({ autoStart: true, width: 640, height: 480 });

  const {
    isModelLoading,
    fps,
    latencyMs: detectLatencyMs,
    detectedHands,
    setOnResults,
  } = useHandTracking(videoRef, { isEnabled: isActive, maxHands: 2 });

  const [gestureResult, setGestureResult] = useState('Waiting for hand...');
  const [confidence, setConfidence] = useState(0);
  const [top3, setTop3] = useState([]);
  const [fingersState, setFingersState] = useState([0, 0, 0, 0, 0]);
  const [networkLatency, setNetworkLatency] = useState(0);
  const [handedness, setHandedness] = useState('Right');

  const lastApiCallRef = useRef(0);
  const inFlightAbortRef = useRef(null);
  const sessionIdRef = useRef('');

  useEffect(() => {
    sessionIdRef.current = generateSessionId();
  }, []);

  // Handle detection results and throttle API calls to ~10-12 Hz (every 85ms)
  const handleDetection = useCallback((hands) => {
    if (!hands || hands.length === 0) {
      setGestureResult('No Hand Detected');
      setConfidence(0);
      setTop3([]);
      setFingersState([0, 0, 0, 0, 0]);
      return;
    }

    const primaryHand = hands[0];
    const now = performance.now();

    // Throttle API requests to ~11 Hz
    if (now - lastApiCallRef.current < 90) {
      return;
    }
    lastApiCallRef.current = now;

    // Abort previous in-flight request if still running
    if (inFlightAbortRef.current) {
      inFlightAbortRef.current.abort();
    }
    const abortController = new AbortController();
    inFlightAbortRef.current = abortController;

    const reqStartTime = performance.now();
    setHandedness(primaryHand.handedness);

    api
      .classifyHand(
        primaryHand.landmarks,
        primaryHand.handedness,
        sessionIdRef.current || 'default',
        abortController.signal
      )
      .then((data) => {
        const roundtrip = Math.round(performance.now() - reqStartTime);
        setNetworkLatency(roundtrip);
        setGestureResult(data.label || 'Unknown');
        setConfidence(data.confidence || 0);
        setTop3(data.top3 || []);
        if (data.fingers) {
          setFingersState(data.fingers);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('Gesture API error:', err);
        }
      });
  }, []);

  useEffect(() => {
    setOnResults(handleDetection);
  }, [setOnResults, handleDetection]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] p-4 relative w-full">
      <Link
        to="/"
        className="absolute top-0 left-4 md:left-8 text-gray-400 hover:text-white transition-colors z-20 flex items-center gap-2 font-medium"
      >
        <ArrowLeft size={20} /> Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-6"
      >
        {/* Left Column: Information & Live Gesture Card */}
        <div className="lg:col-span-1 text-left space-y-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black font-display mb-3 tracking-tight leading-none">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                Hand
              </span>
              <br />
              <span className="text-white">Gesture</span>
              <br />
              <span className="text-gray-500 text-3xl font-light">Vision Engine</span>
            </h1>
            <p className="text-sm text-gray-400 font-light leading-relaxed">
              Client-side 21-point landmark mesh with orientation & handedness invariant classification.
            </p>
          </div>

          {/* Active Gesture Display */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/15 via-cyan-500/10 to-transparent border border-blue-500/30 shadow-xl shadow-blue-500/10">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Hand size={16} /> Detected Gesture
            </h3>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-display font-bold text-white capitalize tracking-tight">
                {gestureResult}
              </p>
              {confidence > 0 && (
                <span className="text-xs font-mono px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {Math.round(confidence * 100)}%
                </span>
              )}
            </div>

            {/* Finger Extension Indicators */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
              {FINGER_NAMES.map((name, i) => (
                <div key={name} className="flex flex-col items-center gap-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      fingersState[i] === 1 ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-gray-700'
                    }`}
                  />
                  <span className="text-gray-400 text-[10px]">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Telemetry HUD */}
          <TelemetryHUD
            fps={fps}
            latencyMs={detectLatencyMs}
            networkLatencyMs={networkLatency}
            handsCount={detectedHands.length}
            confidence={confidence}
            top3={top3}
            handedness={handedness}
            accentColor="#38bdf8"
            accentClass="from-blue-500 to-cyan-400"
            isOnline={isActive}
          />

          {/* Camera Toggle Button */}
          <button
            onClick={isActive ? stopStream : startStream}
            className={`w-full py-3.5 rounded-xl font-bold text-base tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
              isActive
                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30'
            }`}
          >
            {isActive ? (
              <>
                <StopCircle size={20} /> Stop Webcam
              </>
            ) : (
              <>
                <Video size={20} /> Start Webcam
              </>
            )}
          </button>
        </div>

        {/* Right Column: Video & HandCanvas Viewport */}
        <div className="lg:col-span-2 w-full space-y-4">
          <div className="glass-panel p-2.5 rounded-3xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10 relative aspect-video group bg-black/60">
            {/* Native Video Element */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover rounded-2xl transform -scale-x-100 ${
                isActive ? 'block' : 'hidden'
              }`}
            />

            {/* Glowing 21-point Hand Skeleton Canvas Overlay */}
            {isActive && (
              <HandCanvas
                hands={detectedHands}
                width={640}
                height={480}
                themeColor="#38bdf8"
                mirror={true}
              />
            )}

            {/* Inactive Camera Placeholder */}
            {!isActive && (
              <div className="w-full h-full rounded-2xl bg-black/50 flex flex-col items-center justify-center text-gray-500 p-6 text-center">
                <Camera size={56} className="mb-4 opacity-40 text-blue-400" />
                <h4 className="text-lg font-bold text-gray-300 mb-1">Webcam Paused</h4>
                <p className="text-xs text-gray-500 max-w-sm mb-4">
                  Click 'Start Webcam' to begin real-time hand gesture tracking.
                </p>
                <button
                  onClick={startStream}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-md shadow-blue-600/30"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {/* Status Pills */}
            <div className="absolute top-5 right-5 flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono text-white flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                  }`}
                />
                {isActive ? 'VISION ACTIVE' : 'STANDBY'}
              </div>
            </div>

            {/* Model Loading Indicator */}
            {isModelLoading && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-white rounded-2xl z-30">
                <RefreshCw size={36} className="animate-spin text-blue-400 mb-3" />
                <p className="text-sm font-medium">Initializing MediaPipe Hand Mesh...</p>
                <p className="text-xs text-gray-400 mt-1">Downloading lightweight WASM runtime</p>
              </div>
            )}

            {/* Camera Error Message */}
            {webcamError && (
              <div className="absolute inset-x-6 bottom-6 p-4 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 backdrop-blur-md flex items-center gap-3 text-xs">
                <AlertCircle size={20} className="flex-shrink-0 text-rose-400" />
                <span>
                  {webcamError === 'PERMISSION_DENIED'
                    ? 'Camera permission denied. Please allow camera access in browser settings.'
                    : webcamError === 'NOT_FOUND'
                    ? 'No camera found. Please connect a webcam.'
                    : 'Unable to start camera. Please verify device permissions.'}
                </span>
              </div>
            )}
          </div>

          {/* Quick Guide Card */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Peace / Victory</span>
              <span className="text-xs font-medium text-gray-300">Index + Middle</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Fist</span>
              <span className="text-xs font-medium text-gray-300">All fingers closed</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Hang Loose</span>
              <span className="text-xs font-medium text-gray-300">Thumb + Pinky</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Rock</span>
              <span className="text-xs font-medium text-gray-300">Index + Pinky</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HandGesture;
