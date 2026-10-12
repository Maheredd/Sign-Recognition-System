import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Loader2,
  AlertTriangle,
  History,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';

// Curated sample traffic sign images created as high-quality SVGs converted to data URIs
const SAMPLE_SIGNS = [
  {
    name: 'Stop Sign',
    classId: 14,
    color: '#ef4444',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30" fill="#dc2626" stroke="#ffffff" stroke-width="4"/><text x="50" y="58" font-family="Arial,sans-serif" font-weight="900" font-size="24" fill="#ffffff" text-anchor="middle">STOP</text></svg>`,
  },
  {
    name: 'Speed Limit (30)',
    classId: 1,
    color: '#dc2626',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#ffffff" stroke="#dc2626" stroke-width="10"/><text x="50" y="60" font-family="Arial,sans-serif" font-weight="900" font-size="36" fill="#000000" text-anchor="middle">30</text></svg>`,
  },
  {
    name: 'Yield',
    classId: 13,
    color: '#ea580c',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,92 8,18 92,18" fill="#ffffff" stroke="#dc2626" stroke-width="8"/></svg>`,
  },
  {
    name: 'No Entry',
    classId: 17,
    color: '#dc2626',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#dc2626"/><rect x="18" y="42" width="64" height="16" fill="#ffffff" rx="2"/></svg>`,
  },
  {
    name: 'Road Work',
    classId: 25,
    color: '#f59e0b',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,10 92,85 8,85" fill="#ffffff" stroke="#dc2626" stroke-width="8"/><circle cx="50" cy="40" r="6" fill="#000000"/><rect x="46" y="50" width="8" height="24" fill="#000000"/></svg>`,
  },
];

const svgToFile = (svgStr, filename) => {
  const blob = new Blob([svgStr], { type: 'image/svg+xml' });
  return new File([blob], filename, { type: 'image/svg+xml' });
};

const TrafficSign = () => {
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState([]);
  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;

    // Check size <= 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File exceeds 5MB size limit.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setResult(null);
    setErrorMsg(null);
    setLoading(true);

    try {
      // If SVG sample, draw to offscreen canvas to convert to PNG
      let fileToUpload = file;
      if (file.type.includes('svg')) {
        fileToUpload = await convertSvgToPngFile(file);
      }

      const data = await api.predictTraffic(fileToUpload);
      setResult(data);

      // Add to session history
      setHistory((prev) => [
        {
          id: Date.now(),
          preview: objectUrl,
          label: data.result,
          confidence: data.confidence,
          lowConfidence: data.low_confidence,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev.slice(0, 9), // Keep latest 10
      ]);
    } catch (err) {
      console.error('Traffic prediction error:', err);
      setErrorMsg(err.message || 'Failed to classify traffic sign');
    } finally {
      setLoading(false);
    }
  };

  const convertSvgToPngFile = (svgFile) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(svgFile);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 64, 64);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          resolve(new File([blob], 'sample.png', { type: 'image/png' }));
        }, 'image/png');
      };
      img.src = url;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const loadSample = (sample) => {
    const file = svgToFile(sample.svg, `${sample.name.toLowerCase().replace(/ /g, '_')}.svg`);
    processFile(file);
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
        className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-6"
      >
        {/* Left Column: Heading, Sample Gallery, and Prediction Card */}
        <div className="text-left space-y-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black font-display mb-3 tracking-tight leading-none">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-orange-400 to-amber-300">
                Traffic Sign
              </span>
              <br />
              <span className="text-white">Recognition</span>
            </h1>
            <p className="text-sm text-gray-400 font-light leading-relaxed">
              Autonomous vehicle vision classifier trained on all 43 GTSRB regulatory road signs. Drag-and-drop or select from curated test samples below.
            </p>
          </div>

          {/* Sample Signs Quick-Test Gallery */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-pink-400" /> Test with Curated Samples:
            </span>
            <div className="grid grid-cols-5 gap-2">
              {SAMPLE_SIGNS.map((s) => (
                <button
                  key={s.name}
                  onClick={() => loadSample(s)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/40 transition-all flex flex-col items-center group text-center"
                  title={`Classify ${s.name}`}
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform"
                    dangerouslySetInnerHTML={{ __html: s.svg }}
                  />
                  <span className="text-[10px] text-gray-400 mt-1 truncate max-w-full font-medium">
                    {s.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Result Card */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-pink-500/15 via-orange-500/10 to-transparent border border-pink-500/30 space-y-4 shadow-xl shadow-pink-500/10"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">
                  Classified Sign
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Class #{result.class_id}
                </span>
              </div>

              <div>
                <h3 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                  {result.result}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Confidence: {(result.confidence * 100).toFixed(1)}%
                </p>
              </div>

              {/* Low Confidence Warning */}
              {result.low_confidence && (
                <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 flex items-center gap-2.5 text-xs">
                  <AlertTriangle size={18} className="flex-shrink-0 text-amber-400" />
                  <span>
                    Low confidence prediction (&lt; 60%). The sign may be partially occluded, rotated, or outside GTSRB distribution.
                  </span>
                </div>
              )}

              {/* Top-5 Animated Predictions Bar */}
              {result.top5 && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Top-5 Model Distribution
                  </span>
                  <div className="space-y-2">
                    {result.top5.map((c) => {
                      const pct = Math.round(c.confidence * 100);
                      return (
                        <div key={c.class_id} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-gray-300 truncate max-w-[240px]">
                              {c.label}
                            </span>
                            <span className="text-pink-400 font-bold">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-pink-500 to-orange-400 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.35 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Session History Strip */}
          {history.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <History size={14} className="text-orange-400" /> Recent Session History:
              </span>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex-shrink-0 p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 min-w-[160px]"
                  >
                    <img
                      src={h.preview}
                      alt="Thumbnail"
                      className="w-8 h-8 rounded-lg object-cover bg-black/40"
                    />
                    <div className="truncate text-left">
                      <span className="text-xs font-medium text-white block truncate">
                        {h.label}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {(h.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Drop Zone & Image Preview */}
        <div className="glass-panel rounded-3xl p-6 w-full space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden relative group ${
              isDragging
                ? 'border-pink-400 bg-pink-500/15 scale-[1.01]'
                : preview
                ? 'border-pink-500/50 bg-black/40'
                : 'border-gray-700 hover:border-pink-500/60 hover:bg-white/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />

            {preview ? (
              <div className="w-full h-full relative group">
                <img
                  src={preview}
                  alt="Upload Preview"
                  className="w-full h-full object-contain p-4"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs">
                  <Upload size={24} className="mb-2 text-pink-400" />
                  <span>Click or drop a different image to re-classify</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500 group-hover:text-pink-400 transition-colors p-6 text-center">
                <div className="p-4 rounded-full bg-white/5 mb-4 group-hover:bg-pink-500/20 group-hover:scale-110 transition-all">
                  <Upload size={32} />
                </div>
                <p className="text-base font-bold text-gray-200 mb-1">
                  Drag & Drop Traffic Sign Image
                </p>
                <p className="text-xs text-gray-400 max-w-xs">
                  Supports PNG, JPG, JPEG, WebP up to 5MB. In-memory processing.
                </p>
              </div>
            )}

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                <Loader2 size={36} className="animate-spin text-pink-500 mb-2" />
                <span className="text-sm font-semibold">Running GTSRB Neural Network...</span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-base tracking-wide transition-all shadow-lg shadow-pink-500/20 bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 text-white flex items-center justify-center gap-2"
          >
            <Upload size={18} /> Choose Image from Device
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TrafficSign;
