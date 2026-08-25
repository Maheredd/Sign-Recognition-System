import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Video, Type } from 'lucide-react';

const ISL = () => {
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
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
                                ISL
                            </span>
                            <br />
                            <span className="text-white">Detection</span>
                        </h1>
                        <p className="text-gray-400 font-light leading-relaxed">
                            Real-time Indian Sign Language translation. Bridge communication gaps with accurate gesture recognition.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                        <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Type size={16} /> Instructions
                        </h3>
                        <p className="text-gray-300">
                            Position yourself clearly in front of the camera and perform standard ISL gestures.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-2 w-full">
                    <div className="glass-panel p-2 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20 border border-white/10 relative aspect-video group">
                        <img
                            src="http://localhost:5000/isl_feed"
                            alt="ISL Video Feed"
                            className="w-full h-full object-cover rounded-2xl"
                        />

                        <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-medium text-white">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            LIVE FEED
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ISL;
