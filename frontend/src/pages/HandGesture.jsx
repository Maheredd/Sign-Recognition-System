import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, Hand, Video, StopCircle } from 'lucide-react';

const HandGesture = () => {
    const [result, setResult] = useState("Waiting for gesture...");
    const [isStreaming, setIsStreaming] = useState(true);
    const videoRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            if (isStreaming) {
                fetch('http://localhost:5000/get_hand_gesture')
                    .then(response => response.json())
                    .then(data => setResult(data.gesture || "No gesture detected"))
                    .catch(error => console.error("Error fetching gesture:", error));
            }
        }, 500);

        return () => clearInterval(interval);
    }, [isStreaming]);

    const toggleStream = () => {
        setIsStreaming(!isStreaming);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] p-4 relative w-full">
            <Link to="/" className="absolute top-0 left-4 md:left-8 text-gray-400 hover:text-white transition-colors z-20 flex items-center gap-2 font-medium">
                <ArrowLeft size={20} /> Back to Home
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
            >
                <div className="lg:col-span-1 text-left space-y-6">
                    <div>
                        <h1 className="text-5xl md:text-6xl font-black font-display mb-4 tracking-tight leading-none">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                                Hand
                            </span>
                            <br />
                            <span className="text-white">Gesture</span>
                            <br />
                            <span className="text-gray-500 text-4xl">Control</span>
                        </h1>
                        <p className="text-gray-400 font-light leading-relaxed">
                            Interact with your device using intuitive hand movements. Our AI tracks landmark points in real-time.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Hand size={16} /> Live Detection
                        </h3>
                        <p className="text-3xl font-display font-bold text-white capitalize">{result}</p>
                    </div>

                    <button
                        onClick={toggleStream}
                        className={`w-full py-4 rounded-xl font-bold text-lg tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${isStreaming ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'}`}
                    >
                        {isStreaming ? <><StopCircle /> Stop Camera</> : <><Video /> Start Camera</>}
                    </button>
                </div>

                <div className="lg:col-span-2 w-full">
                    <div className="glass-panel p-2 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 relative aspect-video group">
                        {isStreaming ? (
                            <img
                                src="http://localhost:5000/hand_gesture_feed"
                                alt="Hand Gesture Feed"
                                className="w-full h-full object-cover rounded-2xl"
                            />
                        ) : (
                            <div className="w-full h-full rounded-2xl bg-black/40 flex flex-col items-center justify-center text-gray-500">
                                <Camera size={64} className="mb-4 opacity-50" />
                                <p>Camera Paused</p>
                            </div>
                        )}

                        <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-medium text-white">
                            <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                            {isStreaming ? 'LIVE' : 'OFFLINE'}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default HandGesture;
