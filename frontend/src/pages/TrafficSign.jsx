import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { animate } from 'animejs';

const TrafficSign = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const buttonRef = useRef(null);
    const resultRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            setResult(null); // Reset result

            // Animate button
            animate(buttonRef.current, {
                scale: [1, 1.05, 1],
                duration: 400,
                ease: 'outElastic(1, .5)'
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        setLoading(true);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('http://localhost:5000/traffic_sign', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            setResult(data);
            setLoading(false);

        } catch (error) {
            console.error("Error uploading file:", error);
            setLoading(false);
        }
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
                className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
                <div className="text-left">
                    <h1 className="text-5xl md:text-6xl font-black font-display mb-6 tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-orange-400">
                            Traffic Sign
                        </span>
                        <br />
                        <span className="text-white">Recognition</span>
                    </h1>
                    <p className="text-xl text-gray-400 mb-8 font-light leading-relaxed max-w-md">
                        Upload an image of a traffic sign to instantly classify it using our deep learning model.
                    </p>

                    {result && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="hidden md:block p-6 rounded-2xl bg-gradient-to-br from-pink-500/10 to-orange-500/10 border border-pink-500/20"
                        >
                            <h3 className="text-sm font-bold text-pink-400 uppercase tracking-widest mb-2">Detected Sign</h3>
                            <p className="text-3xl font-display font-bold text-white">{result.result}</p>
                        </motion.div>
                    )}
                </div>

                <div className="glass-panel rounded-3xl p-8 w-full">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="w-full relative group">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 overflow-hidden ${preview ? 'border-pink-500 bg-pink-500/5' : 'border-gray-700 hover:border-pink-500/50 hover:bg-white/5'}`}>
                                {preview ? (
                                    <motion.img
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        src={preview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center text-gray-500 group-hover:text-pink-400 transition-colors">
                                        <div className="p-4 rounded-full bg-white/5 mb-4 group-hover:bg-pink-500/20 transition-colors">
                                            <Upload size={32} />
                                        </div>
                                        <p className="font-medium">Click or Drag to Upload Image</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            ref={buttonRef}
                            type="submit"
                            disabled={loading || !selectedFile}
                            className={`w-full py-4 rounded-xl font-bold text-lg tracking-wide transition-all ${loading || !selectedFile ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 text-white shadow-lg shadow-pink-500/25'}`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin" /> Analyzing...
                                </span>
                            ) : 'Analyze Traffic Sign'}
                        </button>
                    </form>

                    <AnimatePresence>
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:hidden mt-6 pt-6 border-t border-white/10"
                            >
                                <h3 className="text-sm font-bold text-pink-400 uppercase tracking-widest mb-2">Detected Sign</h3>
                                <p className="text-2xl font-display font-bold text-white">{result.result}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default TrafficSign;
