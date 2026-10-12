import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Video,
  StopCircle,
  Camera,
  Volume2,
  Copy,
  Delete,
  Space,
  Trash2,
  Check,
  RefreshCw,
  Info,
  Sparkles,
} from 'lucide-react';
import { useWebcam } from '../hooks/useWebcam';
import { useHandTracking } from '../hooks/useHandTracking';
import HandCanvas from '../components/HandCanvas';
import TelemetryHUD from '../components/TelemetryHUD';
import { api } from '../services/api';

const COMMIT_HOLD_TIME_MS = 750; // Stable letter duration required to commit

const ISL = () => {
  const { videoRef, isActive, startStream, stopStream } = useWebcam({
    autoStart: true,
    width: 640,
    height: 480,
  });

  const {
    isModelLoading,
    fps,
    latencyMs: detectLatencyMs,
    detectedHands,
    setOnResults,
  } = useHandTracking(videoRef, { isEnabled: isActive, maxHands: 2 });

  const [activeLetter, setActiveLetter] = useState('...');
  const [confidence, setConfidence] = useState(0);
  const [top3, setTop3] = useState([]);
  const [networkLatency, setNetworkLatency] = useState(0);
  const [handedness, setHandedness] = useState('Right');

  // Sentence Builder State
  const [sentence, setSentence] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Hold-to-commit tracking
  const [commitProgress, setCommitProgress] = useState(0); // 0 to 1
  const candidateLetterRef = useRef('');
  const candidateStartTimeRef = useRef(0);

  const lastApiCallRef = useRef(0);
  const inFlightAbortRef = useRef(null);

  // Commit letter function with feedback
  const commitLetter = useCallback((char) => {
    if (!char || char === '...' || char === 'Unknown') return;
    setSentence((prev) => prev + char);

    // Visual feedback reset
    setCommitProgress(0);
    candidateStartTimeRef.current = performance.now();
  }, []);

  // Frame processing and throttled prediction
  const handleResults = useCallback(
    (hands) => {
      if (!hands || hands.length === 0) {
        setActiveLetter('No Hand');
        setConfidence(0);
        setTop3([]);
        setCommitProgress(0);
        candidateLetterRef.current = '';
        return;
      }

      const primaryHand = hands[0];
      const now = performance.now();

      // Throttle API call to ~11 Hz
      if (now - lastApiCallRef.current < 90) {
        return;
      }
      lastApiCallRef.current = now;

      if (inFlightAbortRef.current) {
        inFlightAbortRef.current.abort();
      }
      const abortController = new AbortController();
      inFlightAbortRef.current = abortController;

      const reqStart = performance.now();
      setHandedness(primaryHand.handedness);

      api
        .predictISL(primaryHand.landmarks, 640, 480, abortController.signal)
        .then((data) => {
          const roundtrip = Math.round(performance.now() - reqStart);
          setNetworkLatency(roundtrip);

          const currentLetter = data.label || 'Unknown';
          const currentConf = data.confidence || 0;

          setActiveLetter(currentLetter);
          setConfidence(currentConf);
          setTop3(data.top3 || []);

          // Hold to commit logic: check stability
          if (currentConf >= 0.50 && currentLetter !== 'Unknown') {
            if (candidateLetterRef.current === currentLetter) {
              const holdDuration = performance.now() - candidateStartTimeRef.current;
              const progress = Math.min(1.0, holdDuration / COMMIT_HOLD_TIME_MS);
              setCommitProgress(progress);

              if (progress >= 1.0) {
                commitLetter(currentLetter);
              }
            } else {
              // New candidate letter started
              candidateLetterRef.current = currentLetter;
              candidateStartTimeRef.current = performance.now();
              setCommitProgress(0);
            }
          } else {
            // Low confidence resets candidate progress
            candidateLetterRef.current = '';
            setCommitProgress(0);
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.warn('ISL API Error:', err);
          }
        });
    },
    [commitLetter]
  );

  useEffect(() => {
    setOnResults(handleResults);
  }, [setOnResults, handleResults]);

  // Text-To-Speech
  const handleSpeak = () => {
    if (!sentence.trim()) return;
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = () => {
    if (!sentence) return;
    navigator.clipboard.writeText(sentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        {/* Left Column: Information & Active Sign with Hold Ring */}
        <div className="lg:col-span-1 text-left space-y-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black font-display mb-3 tracking-tight leading-none">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
                ISL
              </span>
              <br />
              <span className="text-white">Detection</span>
              <br />
              <span className="text-gray-500 text-3xl font-light">& Speech</span>
            </h1>
            <p className="text-sm text-gray-400 font-light leading-relaxed">
              Real-time Indian Sign Language recognition. Hold steady to commit letters into fluent sentences.
            </p>
          </div>

          {/* Active Letter & Commit Gauge Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-transparent border border-purple-500/30 shadow-xl shadow-purple-500/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                Active Sign
              </h3>
              <span className="text-[10px] text-gray-400 font-mono">
                Hold {Math.round(COMMIT_HOLD_TIME_MS)}ms
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black font-display text-white tracking-tight">
                  {activeLetter}
                </span>
                {confidence > 0 && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {Math.round(confidence * 100)}%
                  </span>
                )}
              </div>

              {/* Hold-to-commit circular radial gauge */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 50 50">
                  <circle
                    cx="25"
                    cy="25"
                    r="20"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="25"
                    cy="25"
                    r="20"
                    stroke="#c084fc"
                    strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 20}
                    animate={{
                      strokeDashoffset: 2 * Math.PI * 20 * (1 - commitProgress),
                    }}
                    transition={{ duration: 0.1 }}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-purple-200">
                    {Math.round(commitProgress * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Commit Progress Bar */}
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-400"
                style={{ width: `${commitProgress * 100}%` }}
              />
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
            accentColor="#c084fc"
            accentClass="from-purple-500 to-pink-400"
            isOnline={isActive}
          />

          {/* Camera Button */}
          <button
            onClick={isActive ? stopStream : startStream}
            className={`w-full py-3.5 rounded-xl font-bold text-base tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
              isActive
                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/30'
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

        {/* Right Column: Video Viewport & Sentence Builder */}
        <div className="lg:col-span-2 w-full space-y-5">
          <div className="glass-panel p-2.5 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/10 border border-white/10 relative aspect-video group bg-black/60">
            {/* Native Video Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover rounded-2xl transform -scale-x-100 ${
                isActive ? 'block' : 'hidden'
              }`}
            />

            {/* Glowing Hand Skeleton Canvas Overlay */}
            {isActive && (
              <HandCanvas
                hands={detectedHands}
                width={640}
                height={480}
                themeColor="#c084fc"
                mirror={true}
              />
            )}

            {/* Offline Placeholder */}
            {!isActive && (
              <div className="w-full h-full rounded-2xl bg-black/50 flex flex-col items-center justify-center text-gray-500 p-6 text-center">
                <Camera size={56} className="mb-4 opacity-40 text-purple-400" />
                <h4 className="text-lg font-bold text-gray-300 mb-1">Webcam Inactive</h4>
                <p className="text-xs text-gray-500 max-w-sm mb-4">
                  Enable your camera to begin translating Indian Sign Language into text.
                </p>
                <button
                  onClick={startStream}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all shadow-md shadow-purple-600/30"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {/* Status Indicator */}
            <div className="absolute top-5 right-5 flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono text-white flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-purple-400 animate-pulse' : 'bg-gray-500'
                  }`}
                />
                {isActive ? 'ISL DETECTOR LIVE' : 'STANDBY'}
              </div>
            </div>

            {/* Model Loading State */}
            {isModelLoading && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-white rounded-2xl z-30">
                <RefreshCw size={36} className="animate-spin text-purple-400 mb-3" />
                <p className="text-sm font-medium">Loading Vision Models...</p>
              </div>
            )}
          </div>

          {/* Sentence Builder Component */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Sentence Builder
                </h3>
              </div>
              <span className="text-[11px] font-mono text-gray-400">
                {sentence.length} character{sentence.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Output Display Box */}
            <div className="min-h-[72px] p-4 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between">
              <p className="text-xl md:text-2xl font-mono text-white tracking-wide break-all">
                {sentence || (
                  <span className="text-gray-600 text-base italic font-sans">
                    Committed letters will form words here...
                  </span>
                )}
                <span className="animate-pulse ml-1 inline-block w-2 h-5 bg-purple-400 align-middle" />
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSentence((prev) => prev + ' ')}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-200 transition-all flex items-center gap-1.5"
                >
                  <Space size={14} /> Space
                </button>
                <button
                  onClick={() => setSentence((prev) => prev.slice(0, -1))}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-200 transition-all flex items-center gap-1.5"
                >
                  <Delete size={14} /> Backspace
                </button>
                <button
                  onClick={() => setSentence('')}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-rose-300 hover:text-rose-200 transition-all flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> Clear
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!sentence}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-200 disabled:opacity-40 transition-all flex items-center gap-1.5"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleSpeak}
                  disabled={!sentence || isSpeaking}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-40 transition-all flex items-center gap-1.5"
                >
                  <Volume2 size={14} className={isSpeaking ? 'animate-bounce' : ''} />
                  {isSpeaking ? 'Speaking...' : 'Speak (TTS)'}
                </button>
              </div>
            </div>
          </div>

          {/* Model Architecture & Limitation Note */}
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3 text-left">
            <Info size={16} className="text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-300 leading-relaxed">
              <span className="font-semibold text-purple-300">Model Architecture & Scope: </span>
              The ISL classifier uses a 42-feature normalized landmark MLP trained on standard single-hand signs (digits 1-9 and letters A-Z). Two-handed sign combinations are not currently classified by this model.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ISL;
