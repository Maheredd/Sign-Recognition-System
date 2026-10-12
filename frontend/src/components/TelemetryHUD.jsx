import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Gauge, Eye, ShieldCheck, Cpu } from 'lucide-react';

const TelemetryHUD = ({
  fps = 0,
  latencyMs = 0,
  networkLatencyMs = 0,
  handsCount = 0,
  confidence = 0,
  top3 = [],
  handedness = 'Right',
  accentColor = '#38bdf8', // Neon blue or purple
  accentClass = 'from-blue-500 to-cyan-400',
  isOnline = true,
}) => {
  // SVG confidence circle calculation
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence || 0) * circumference;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-5 text-left">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Activity size={18} style={{ color: accentColor }} />
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300">
            Live Telemetry HUD
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="text-[11px] font-mono text-gray-400">
            {isOnline ? 'STREAMING' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
          <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider flex items-center gap-1">
            <Gauge size={12} /> Camera FPS
          </span>
          <span className="text-2xl font-bold font-mono text-white mt-1">
            {fps > 0 ? fps : '--'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
          <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider flex items-center gap-1">
            <Cpu size={12} /> Latency
          </span>
          <span className="text-2xl font-bold font-mono text-white mt-1">
            {networkLatencyMs > 0 ? `${networkLatencyMs}ms` : latencyMs > 0 ? `${latencyMs}ms` : '--'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
          <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider flex items-center gap-1">
            <Eye size={12} /> Hands
          </span>
          <span className="text-2xl font-bold font-mono text-white mt-1">
            {handsCount}
            {handsCount > 0 && (
              <span className="text-[10px] text-gray-400 ml-1 font-sans">
                ({handedness})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Confidence Gauge Ring */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
          <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="6"
              fill="transparent"
            />
            <motion.circle
              cx="40"
              cy="40"
              r={radius}
              stroke={accentColor}
              strokeWidth="6"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold font-mono text-white">
              {Math.round((confidence || 0) * 100)}%
            </span>
            <span className="text-[9px] uppercase tracking-wider text-gray-400">Match</span>
          </div>
        </div>

        <div className="flex-1 space-y-1">
          <h4 className="text-xs font-bold text-gray-300">Confidence Score</h4>
          <p className="text-[11px] text-gray-400 leading-snug">
            {confidence >= 0.75
              ? 'High-confidence detection verified across geometric landmarks.'
              : confidence >= 0.5
              ? 'Moderate confidence. Hold your hand steady for stabilization.'
              : 'Low confidence. Ensure full hand is in the frame.'}
          </p>
        </div>
      </div>

      {/* Top 3 Predictions Bar Chart */}
      {top3 && top3.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Top Predictions
          </span>
          <div className="space-y-2">
            {top3.map((item, idx) => {
              const pct = Math.round((item.confidence || 0) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-300 font-medium truncate max-w-[140px]">
                      {item.label}
                    </span>
                    <span className="text-gray-400">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${accentClass} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.25 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] text-gray-400">
        <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" />
        <span>Privacy-First: Video never leaves device. Only 21 coordinate points sent to API.</span>
      </div>
    </div>
  );
};

export default TelemetryHUD;
