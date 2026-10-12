import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home, Compass } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel p-10 rounded-3xl border border-white/10 max-w-lg w-full space-y-6"
      >
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center text-purple-400">
          <Compass size={40} />
        </div>

        <div>
          <h1 className="text-6xl font-black font-display tracking-tight text-white mb-2">
            404
          </h1>
          <h2 className="text-xl font-bold text-gray-200">Page Not Found</h2>
          <p className="text-sm text-gray-400 mt-2">
            The page you requested does not exist or has been moved in the latest version.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all"
          >
            <Home size={16} /> Return to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
