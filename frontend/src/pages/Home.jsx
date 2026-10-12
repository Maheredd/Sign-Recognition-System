import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Hand,
  Type,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';

const FeatureCard = ({ title, description, icon: IconComponent, to, delay, accent, badge }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    whileHover={{ y: -8, scale: 1.02 }}
    className="h-full"
  >
    <Link to={to} className="group block h-full">
      <div className="relative h-full p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/40 hover:bg-white/10 transition-all duration-300 backdrop-blur-md overflow-hidden shadow-2xl flex flex-col justify-between">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-15 transition-opacity transform group-hover:scale-110 duration-700 pointer-events-none">
          <IconComponent size={140} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div
              className={`p-4 rounded-2xl w-fit transition-colors shadow-inner border border-white/10 ${accent}`}
            >
              <IconComponent size={28} className="text-white" />
            </div>
            {badge && (
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/10 text-gray-300 border border-white/10 uppercase tracking-wider font-semibold">
                {badge}
              </span>
            )}
          </div>

          <h3 className="text-2xl font-bold font-display mb-2 text-white group-hover:text-purple-300 transition-colors tracking-tight">
            {title}
          </h3>

          <p className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors leading-relaxed">
            {description}
          </p>
        </div>

        <div className="relative z-10 mt-8 pt-4 border-t border-white/5 flex items-center text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 group-hover:translate-x-1 transition-transform">
          LAUNCH MODULE <ArrowRight size={14} className="ml-1 text-pink-400" />
        </div>
      </div>
    </Link>
  </motion.div>
);

const Home = () => {
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    api
      .getHealth()
      .then((data) => setHealthStatus(data))
      .catch(() => setHealthStatus({ status: 'offline' }));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 pt-16 pb-20 relative w-full">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="text-center max-w-4xl mx-auto mb-16 relative z-10"
      >
        {/* Backend Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-mono text-gray-300 mb-6">
          <span
            className={`w-2 h-2 rounded-full ${
              healthStatus?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span>
            {healthStatus?.status === 'healthy'
              ? 'BACKEND CONNECTED & MODELS WARM'
              : 'CLIENT VISION ENGINE READY'}
          </span>
        </div>

        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black font-display mb-6 tracking-tight leading-[0.95] relative">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Perceive.
          </span>
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient-x">
            Translate. Interact.
          </span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
          Advanced Computer Vision suite for real-time <span className="text-white font-medium">Hand Gesture</span> tracking, <span className="text-white font-medium">Indian Sign Language</span> translation, and <span className="text-white font-medium">Traffic Safety</span> recognition.
        </p>

        {/* Privacy Highlight */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span>Local client-side MediaPipe landmark extraction — raw video frames never leave your browser.</span>
        </div>
      </motion.div>

      {/* Feature Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full px-2 mb-6">
        <FeatureCard
          title="Hand Gestures"
          description="Touch-free interface control with 21 landmark points. Invariant to orientation, rotation, and handedness."
          icon={Hand}
          to="/hand-gesture"
          delay={0.1}
          accent="bg-gradient-to-br from-blue-600/30 to-cyan-500/20"
          badge="Live Camera"
        />
        <FeatureCard
          title="ISL Detection & Speech"
          description="Translate Indian Sign Language in real-time. Features hold-to-commit letter stabilization and Text-to-Speech synthesis."
          icon={Type}
          to="/isl"
          delay={0.2}
          accent="bg-gradient-to-br from-purple-600/30 to-pink-500/20"
          badge="NLP & TTS"
        />
        <FeatureCard
          title="Traffic Sign Vision"
          description="Instant classification across all 43 GTSRB regulatory road signs with drag-and-drop, sample gallery, and top-5 probability distribution."
          icon={AlertTriangle}
          to="/traffic-sign"
          delay={0.3}
          accent="bg-gradient-to-br from-pink-600/30 to-orange-500/20"
          badge="43 Classes"
        />
      </div>

      {/* Secondary Modules: Insights & Learn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full px-2">
        <FeatureCard
          title="Model Insights & Benchmarks"
          description="Interactive dashboard with empirical training accuracy curves, categorical loss graphs, latency benchmarks, and architecture summaries."
          icon={BarChart3}
          to="/insights"
          delay={0.4}
          accent="bg-gradient-to-br from-indigo-600/30 to-blue-500/20"
          badge="Telemetry"
        />
        <FeatureCard
          title="ISL Learn Mode & Mini-Game"
          description="Alphabet reference flashcards and an interactive 'Match The Sign' live vision challenge that scores user accuracy in real-time."
          icon={BookOpen}
          to="/learn"
          delay={0.5}
          accent="bg-gradient-to-br from-amber-600/30 to-purple-500/20"
          badge="Interactive"
        />
      </div>
    </div>
  );
};

export default Home;
