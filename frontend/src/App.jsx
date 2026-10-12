import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Sparkles, EyeOff, Globe, Loader2 } from 'lucide-react';
import ThreeBackground from './components/ThreeBackground';
import Cursor from './components/Cursor';
import ErrorBoundary from './components/ErrorBoundary';

// Code-split routes with React.lazy
const Home = lazy(() => import('./pages/Home'));
const HandGesture = lazy(() => import('./pages/HandGesture'));
const ISL = lazy(() => import('./pages/ISL'));
const TrafficSign = lazy(() => import('./pages/TrafficSign'));
const Insights = lazy(() => import('./pages/Insights'));
const Learn = lazy(() => import('./pages/Learn'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Bilingual Navigation labels (EN / Hindi)
const NAV_LABELS = {
  EN: {
    hand: 'Hand Gesture',
    isl: 'ISL Detection',
    traffic: 'Traffic Sign',
    insights: 'Insights',
    learn: 'Learn ISL',
    reduceEffects: 'Effects',
  },
  HI: {
    hand: 'हाथ के इशारे',
    isl: 'सांकेतिक भाषा (ISL)',
    traffic: 'यातायात संकेत',
    insights: 'मॉडल विवरण',
    learn: 'सीखें',
    reduceEffects: 'एनिमेशन',
  },
};

const PageFallback = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-400 gap-3">
    <Loader2 size={36} className="animate-spin text-purple-400" />
    <span className="text-xs font-mono uppercase tracking-widest">Loading Module...</span>
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageFallback />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/hand-gesture" element={<HandGesture />} />
          <Route path="/isl" element={<ISL />} />
          <Route path="/traffic-sign" element={<TrafficSign />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const App = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reduceEffects, setReduceEffects] = useState(false);
  const [lang, setLang] = useState('EN'); // 'EN' | 'HI'

  const labels = NAV_LABELS[lang];

  const navItems = [
    { name: labels.hand, path: '/hand-gesture' },
    { name: labels.isl, path: '/isl' },
    { name: labels.traffic, path: '/traffic-sign' },
    { name: labels.learn, path: '/learn' },
    { name: labels.insights, path: '/insights' },
  ];

  return (
    <Router>
      <div
        className={`relative min-h-screen bg-[#050511] text-white selection:bg-purple-500/30 ${
          reduceEffects ? 'reduce-effects' : ''
        }`}
      >
        <Cursor />
        {!reduceEffects && <div className="aurora-bg" aria-hidden="true" />}
        <ThreeBackground reduceEffects={reduceEffects} />

        {/* Top Navbar */}
        <nav
          className="fixed top-0 left-0 w-full p-4 z-50 flex justify-between items-center"
          role="navigation"
          aria-label="Main Navigation"
        >
          <div className="absolute inset-0 bg-[#050511]/70 backdrop-blur-md border-b border-white/5" />
          <div className="relative z-10 w-full max-w-7xl mx-auto flex justify-between items-center px-4">
            {/* Logo */}
            <Link
              to="/"
              className="text-xl md:text-2xl font-bold font-display tracking-tight hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-purple-400 rounded-lg outline-none"
            >
              AI <span className="text-purple-400">Sign</span> Recognition
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-7">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative text-xs font-semibold text-gray-300 hover:text-white transition-colors group focus-visible:ring-2 focus-visible:ring-purple-400 rounded-md outline-none py-1"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>

            {/* Right Controls: Reduce Effects, Language Toggle, Mobile Hamburger */}
            <div className="flex items-center gap-3">
              {/* Reduce Effects Toggle */}
              <button
                onClick={() => setReduceEffects((prev) => !prev)}
                className={`p-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-purple-400 outline-none ${
                  reduceEffects
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
                title={reduceEffects ? 'Enable 3D background & heavy animations' : 'Reduce animations & pause 3D'}
                aria-label="Toggle reduced effects"
              >
                {reduceEffects ? <EyeOff size={14} /> : <Sparkles size={14} />}
                <span className="hidden sm:inline text-[11px]">
                  {reduceEffects ? 'Effects: Off' : 'Effects: On'}
                </span>
              </button>

              {/* Language Switcher */}
              <button
                onClick={() => setLang((prev) => (prev === 'EN' ? 'HI' : 'EN'))}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-gray-300 transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-purple-400 outline-none"
                title="Switch Language (English / हिन्दी)"
                aria-label="Toggle language between English and Hindi"
              >
                <Globe size={14} className="text-purple-400" />
                <span>{lang}</span>
              </button>

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white focus-visible:ring-2 focus-visible:ring-purple-400 outline-none"
                aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden fixed inset-x-0 top-16 bg-[#050511]/95 backdrop-blur-xl border-b border-white/10 z-40 p-6 shadow-2xl"
            >
              <div className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-bold text-gray-200 hover:text-purple-400 transition-colors py-2 border-b border-white/5"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="relative z-10 pt-20 min-h-screen flex flex-col">
          <ErrorBoundary>
            <AnimatedRoutes />
          </ErrorBoundary>
        </main>
      </div>
    </Router>
  );
};

export default App;
