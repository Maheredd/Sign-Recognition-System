import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  Flame,
  RotateCcw,
  Video,
  StopCircle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useWebcam } from '../hooks/useWebcam';
import { useHandTracking } from '../hooks/useHandTracking';
import HandCanvas from '../components/HandCanvas';
import { api } from '../services/api';

const ALL_SIGNS = [
  ...Array.from({ length: 9 }, (_, i) => String(i + 1)),
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
];

const SIGN_DESCRIPTIONS = {
  '1': 'Index finger pointing straight up, thumb resting on curled fingers.',
  '2': 'Index and middle fingers extended (V-shape), others folded.',
  '3': 'Thumb, index, and middle fingers extended.',
  '4': 'Four fingers extended upward, thumb tucked into palm.',
  '5': 'All 5 fingers fully extended and spread open.',
  'A': 'Closed fist with thumb resting vertically along the side of index finger.',
  'B': 'Four fingers straight up, thumb folded flat across palm.',
  'C': 'Curved hand forming a C-shape with fingers and thumb.',
  'D': 'Index finger pointed up, other fingers curled with thumb touching middle finger.',
  'L': 'Index finger straight up, thumb extended sideways forming an L-shape.',
  'V': 'Victory sign: index and middle fingers open in a V-shape.',
  'Y': 'Thumb and pinky extended outwards, middle three fingers folded.',
};

const Learn = () => {
  const [activeTab, setActiveTab] = useState('game'); // 'game' | 'cards'
  const [selectedCard, setSelectedCard] = useState('A');

  // Mini-Game State
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [targetSign, setTargetSign] = useState('A');
  const [activeDetected, setActiveDetected] = useState('...');
  const [matchProgress, setMatchProgress] = useState(0); // 0 to 1
  const [isSuccess, setIsSuccess] = useState(false);

  const { videoRef, isActive, startStream, stopStream } = useWebcam({
    autoStart: true,
    width: 640,
    height: 480,
  });

  const { detectedHands, setOnResults } = useHandTracking(videoRef, {
    isEnabled: isActive,
    maxHands: 1,
  });

  const matchStartRef = useRef(0);
  const lastApiCallRef = useRef(0);
  const inFlightAbortRef = useRef(null);

  // Pick random next sign
  const nextTarget = useCallback(() => {
    const available = ALL_SIGNS.filter((s) => s !== targetSign);
    const chosen = available[Math.floor(Math.random() * available.length)];
    setTargetSign(chosen);
    setMatchProgress(0);
    setIsSuccess(false);
  }, [targetSign]);

  // Frame result callback
  const handleDetection = useCallback(
    (hands) => {
      if (!hands || hands.length === 0) {
        setActiveDetected('No Hand');
        setMatchProgress(0);
        return;
      }

      const primary = hands[0];
      const now = performance.now();

      if (now - lastApiCallRef.current < 90) return;
      lastApiCallRef.current = now;

      if (inFlightAbortRef.current) inFlightAbortRef.current.abort();
      const abort = new AbortController();
      inFlightAbortRef.current = abort;

      api
        .predictISL(primary.landmarks, 640, 480, abort.signal)
        .then((data) => {
          const detected = data.label || 'Unknown';
          const conf = data.confidence || 0;
          setActiveDetected(detected);

          if (detected === targetSign && conf >= 0.45 && !isSuccess) {
            if (matchStartRef.current === 0) {
              matchStartRef.current = performance.now();
            }
            const heldDuration = performance.now() - matchStartRef.current;
            const progress = Math.min(1.0, heldDuration / 1200); // 1.2s hold
            setMatchProgress(progress);

            if (progress >= 1.0) {
              // Match completed!
              setIsSuccess(true);
              setScore((s) => s + 100);
              setStreak((st) => st + 1);

              try {
                confetti({
                  particleCount: 60,
                  spread: 60,
                  origin: { y: 0.6 },
                });
              } catch {
                // Ignore if confetti unavailable
              }

              setTimeout(() => {
                nextTarget();
              }, 1200);
            }
          } else {
            matchStartRef.current = 0;
            setMatchProgress(0);
          }
        })
        .catch(() => {});
    },
    [targetSign, isSuccess, nextTarget]
  );

  useEffect(() => {
    if (activeTab === 'game') {
      setOnResults(handleDetection);
    }
  }, [setOnResults, handleDetection, activeTab]);

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
        className="w-full max-w-6xl text-left space-y-6 mt-6"
      >
        {/* Header & Mode Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
                ISL Learn & Play
              </span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Master Indian Sign Language with interactive flashcards and a real-time vision scoring game.
            </p>
          </div>

          <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
            <button
              onClick={() => setActiveTab('game')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'game'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Trophy size={14} /> Match The Sign Game
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'cards'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen size={14} /> Reference Cards
            </button>
          </div>
        </div>

        {/* Tab 1: Interactive Match Game */}
        {activeTab === 'game' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Target Card, Score & Hold Gauge */}
            <div className="lg:col-span-1 space-y-6">
              {/* Game Stats Card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Score</span>
                    <span className="text-2xl font-bold font-mono text-white">{score}</span>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                    <Flame size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Streak</span>
                    <span className="text-2xl font-bold font-mono text-white">{streak}x</span>
                  </div>
                </div>
              </div>

              {/* Target Sign Challenge Card */}
              <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 text-center space-y-4 relative overflow-hidden bg-gradient-to-br from-purple-900/20 to-transparent">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block">
                  Show This Sign
                </span>

                <motion.div
                  key={targetSign}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-6xl font-black font-display text-white shadow-xl shadow-purple-500/25"
                >
                  {targetSign}
                </motion.div>

                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  {SIGN_DESCRIPTIONS[targetSign] || `Perform the Indian Sign Language gesture for '${targetSign}'.`}
                </p>

                {/* Hold to Match Radial Progress */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Current Sign: <span className="text-white font-bold">{activeDetected}</span></span>
                    <span className="text-purple-300 font-bold">{Math.round(matchProgress * 100)}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${
                        isSuccess
                          ? 'bg-emerald-400'
                          : 'bg-gradient-to-r from-purple-500 to-pink-400'
                      }`}
                      style={{ width: `${matchProgress * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={nextTarget}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 transition-all flex items-center gap-1.5 mx-auto"
                >
                  <RotateCcw size={14} /> Skip Sign
                </button>
              </div>

              {/* Camera Button */}
              <button
                onClick={isActive ? stopStream : startStream}
                className={`w-full py-3.5 rounded-xl font-bold text-base tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/30'
                }`}
              >
                {isActive ? <><StopCircle size={18} /> Pause Camera</> : <><Video size={18} /> Resume Camera</>}
              </button>
            </div>

            {/* Right Column: Live Viewport with Hand Skeleton */}
            <div className="lg:col-span-2 w-full">
              <div className="glass-panel p-2.5 rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative aspect-video bg-black/60">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover rounded-2xl transform -scale-x-100 ${
                    isActive ? 'block' : 'hidden'
                  }`}
                />

                {isActive && (
                  <HandCanvas
                    hands={detectedHands}
                    width={640}
                    height={480}
                    themeColor="#c084fc"
                    mirror={true}
                  />
                )}

                {/* Match Banner on Success */}
                <AnimatePresence>
                  {isSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white z-30"
                    >
                      <div className="p-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-2">
                        <CheckCircle2 size={48} />
                      </div>
                      <h3 className="text-2xl font-black font-display text-white">Sign Matched!</h3>
                      <p className="text-sm text-emerald-300 font-mono mt-1">+100 Points</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Alphabet Reference Flashcards */}
        {activeTab === 'cards' && (
          <div className="space-y-6">
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-12 gap-2.5">
              {ALL_SIGNS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedCard(s)}
                  className={`p-3 rounded-2xl font-bold font-display text-lg transition-all border ${
                    selectedCard === s
                      ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white border-pink-400 scale-105 shadow-lg shadow-purple-500/30'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-purple-500/40'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Selected Card Details */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-5xl font-black font-display text-white shadow-xl flex-shrink-0">
                {selectedCard}
              </div>
              <div className="space-y-2 text-left">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                  Sign Details & Technique
                </span>
                <h3 className="text-2xl font-bold font-display text-white">
                  Symbol: '{selectedCard}'
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {SIGN_DESCRIPTIONS[selectedCard] ||
                    `Hold your dominant hand clearly facing the camera and form standard ISL sign for '${selectedCard}'. Keep hand within the frame.`}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Learn;
