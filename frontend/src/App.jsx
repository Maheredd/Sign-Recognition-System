import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import HandGesture from './pages/HandGesture';
import ISL from './pages/ISL';
import TrafficSign from './pages/TrafficSign';
import ThreeBackground from './components/ThreeBackground';
import Cursor from './components/Cursor';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/hand-gesture" element={<HandGesture />} />
        <Route path="/isl" element={<ISL />} />
        <Route path="/traffic-sign" element={<TrafficSign />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <Router>
      <div className="relative min-h-screen bg-dark text-white overflow-hidden selection:bg-purple-500/30">
        <Cursor />
        <div className="aurora-bg" />
        <ThreeBackground />

        <nav className="fixed top-0 left-0 w-full p-6 z-50 flex justify-between items-center">
          <div className="absolute inset-0 bg-dark/10 backdrop-blur-md border-b border-white/5" />
          <div className="relative z-10 w-full max-w-7xl mx-auto flex justify-between items-center px-4">
            <Link to="/" className="text-2xl font-bold font-display tracking-tighter hover:opacity-80 transition-opacity">
              AI <span className="text-purple-500">Sign</span> Recognition
            </Link>
            <div className="flex gap-8">
              {['Hand Gesture', 'ISL', 'Traffic Sign'].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase().replace(' ', '-')}`}
                  className="relative text-sm font-medium text-gray-300 hover:text-white transition-colors group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all group-hover:w-full" />
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <main className="relative z-10 pt-24 min-h-screen flex flex-col">
          <AnimatedRoutes />
        </main>
      </div>
    </Router>
  );
};

export default App;
