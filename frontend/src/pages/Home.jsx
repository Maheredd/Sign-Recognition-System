import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hand, Type, AlertTriangle, ArrowRight } from 'lucide-react';

const FeatureCard = ({ title, description, icon: Icon, to, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay, ease: "easeOut" }}
        whileHover={{ y: -10, rotateX: 5, rotateY: -5, scale: 1.02 }}
        className="h-full perspective-1000"
    >
        <Link to={to} className="group block h-full">
            <div className="relative h-full p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm overflow-hidden shadow-2xl hover:shadow-purple-500/20">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-15 transition-opacity transform group-hover:scale-110 duration-700">
                    <Icon size={140} />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                    <div className="mb-6 p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl w-fit group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-colors shadow-inner border border-white/5">
                        <Icon size={32} className="text-purple-400 group-hover:text-white transition-colors" />
                    </div>

                    <h3 className="text-3xl font-bold font-display mb-3 text-white group-hover:text-purple-300 transition-colors tracking-tight">
                        {title}
                    </h3>

                    <p className="text-gray-400 mb-8 flex-grow group-hover:text-gray-200 transition-colors leading-relaxed">
                        {description}
                    </p>

                    <div className="flex items-center text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 group-hover:translate-x-2 transition-transform duration-300">
                        EXPLORE MODULE <ArrowRight size={16} className="ml-2 text-pink-400" />
                    </div>
                </div>

                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/0 via-pink-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
            </div>
        </Link>
    </motion.div>
);

const Home = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 pt-24 relative w-full">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center max-w-5xl mx-auto mb-20 relative z-10"
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-purple-500/10 blur-[100px] -z-10 rounded-full pointer-events-none" />

                <h1 className="text-7xl md:text-9xl font-black font-display mb-8 tracking-tighter leading-tight relative">
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                        Identify.
                    </span>
                    <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 animate-gradient-x">
                        Interpret. Interact.
                    </span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                    Unlock the power of <span className="text-white font-medium">Computer Vision</span>. Real-time recognition for gestures, sign language, and traffic safety.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full px-4 perspective-container">
                <FeatureCard
                    title="Hand Gestures"
                    description="Control interfaces touch-free. Real-time tracking of 21 landmark points."
                    icon={Hand}
                    to="/hand-gesture"
                    delay={0.2}
                />
                <FeatureCard
                    title="ISL Detection"
                    description="Bridge the gap. Instant translation of Indian Sign Language to text."
                    icon={Type}
                    to="/isl"
                    delay={0.3}
                />
                <FeatureCard
                    title="Traffic Signs"
                    description="Autonomous future. Detect and classify regulatory road signs instantly."
                    icon={AlertTriangle}
                    to="/traffic-sign"
                    delay={0.4}
                />
            </div>
        </div>
    );
};

export default Home;
