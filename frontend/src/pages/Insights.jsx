import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Layers,
  Database,
  CheckCircle,
  TrendingUp,
  Cpu,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import insightsData from '../data/modelInsights.json';

const Insights = () => {
  const [activeTab, setActiveTab] = useState('traffic'); // 'traffic' | 'isl'
  const data = insightsData[activeTab];

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
        className="w-full max-w-6xl text-left space-y-8 mt-6"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
                Model Insights
              </span>
              <br />
              <span className="text-white">& Benchmark Suite</span>
            </h1>
            <p className="text-sm text-gray-400 mt-2 max-w-xl">
              Inspect empirical training convergence curves, validation losses, per-class accuracies, and model architecture profiles.
            </p>
          </div>

          {/* Model Switcher Tabs */}
          <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
            <button
              onClick={() => setActiveTab('traffic')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'traffic'
                  ? 'bg-gradient-to-r from-pink-600 to-orange-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              GTSRB Traffic CNN (43 Classes)
            </button>
            <button
              onClick={() => setActiveTab('isl')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'isl'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ISL Landmark MLP (35 Classes)
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-mono mb-1">
              <CheckCircle size={14} className="text-emerald-400" /> Test Accuracy
            </div>
            <div className="text-3xl font-black font-display text-white">
              {(data.test_accuracy * 100).toFixed(1)}%
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-mono mb-1">
              <TrendingUp size={14} className="text-purple-400" /> Test Loss
            </div>
            <div className="text-3xl font-black font-display text-white">
              {data.test_loss}
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-mono mb-1">
              <Database size={14} className="text-blue-400" /> Dataset Samples
            </div>
            <div className="text-3xl font-black font-display text-white">
              {data.total_samples.toLocaleString()}
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-mono mb-1">
              <Cpu size={14} className="text-pink-400" /> Median Latency
            </div>
            <div className="text-3xl font-black font-display text-white">
              {activeTab === 'traffic' ? '17.5ms' : '11.1ms'}
            </div>
          </div>
        </div>

        {/* Training Curves Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accuracy Convergence Curve */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} className="text-pink-400" /> Accuracy Convergence Curve
              </h3>
              <span className="text-[11px] font-mono text-gray-400">Train vs Val</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="epoch" stroke="#666" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0.4, 1.0]} stroke="#666" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b0c1e', borderColor: '#333', borderRadius: '8px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="train_acc"
                    name="Train Acc"
                    stroke="#ec4899"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="val_acc"
                    name="Val Acc"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Loss Curve */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={16} className="text-purple-400" /> Categorical Cross-Entropy Loss
              </h3>
              <span className="text-[11px] font-mono text-gray-400">Train vs Val</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="epoch" stroke="#666" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#666" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b0c1e', borderColor: '#333', borderRadius: '8px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="train_loss"
                    name="Train Loss"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="val_loss"
                    name="Val Loss"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Architecture & Per-Class Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Architecture Card */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-blue-400" /> Architecture Summary
            </h3>
            <p className="text-xs text-gray-300 font-mono leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
              {data.architecture}
            </p>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Input Shape:</span>
                <span className="font-mono text-gray-200">{data.input_shape}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Output Classes:</span>
                <span className="font-mono text-gray-200">{data.classes}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Train / Val / Test Split:</span>
                <span className="font-mono text-gray-200">60% / 20% / 20%</span>
              </div>
            </div>
          </div>

          {/* Per Class Accuracy Bar Chart */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 size={16} className="text-amber-400" /> Sample Per-Class Accuracy
              </h3>
              <span className="text-[11px] font-mono text-gray-400">Class breakdown</span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeTab === 'traffic' ? data.top_classes : data.sample_classes}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis
                    dataKey={activeTab === 'traffic' ? 'name' : 'symbol'}
                    stroke="#666"
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis domain={[0.9, 1.0]} stroke="#666" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b0c1e', borderColor: '#333', borderRadius: '8px' }}
                  />
                  <Bar dataKey="accuracy" name="Accuracy" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Insights;
