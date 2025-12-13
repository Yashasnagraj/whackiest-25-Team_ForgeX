// ============================================================
// LOGIN PAGE - "Continue Your Story"
// Storytelling login with split layout and Ken Burns background
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Compass, ArrowRight, Plane } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import { toast, ToastContainer } from '../components/auth/Toast';

const travelQuotes = [
  {
    quote: "The best journeys start with a single step.",
    author: "Lao Tzu",
  },
  {
    quote: "Travel is the only thing you buy that makes you richer.",
    author: "Anonymous",
  },
  {
    quote: "Life is either a daring adventure or nothing at all.",
    author: "Helen Keller",
  },
  {
    quote: "Adventure is worthwhile in itself.",
    author: "Amelia Earhart",
  },
  {
    quote: "The world is a book, and those who do not travel read only one page.",
    author: "Saint Augustine",
  },
];

const backgroundImages = [
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80',
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [currentBg, setCurrentBg] = useState(0);
  const navigate = useNavigate();

  const { login, isLoading } = useAuthStore();

  // Quote carousel
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % travelQuotes.length);
    }, 5000);
    return () => clearInterval(quoteInterval);
  }, []);

  // Background carousel
  useEffect(() => {
    const bgInterval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgroundImages.length);
    }, 8000);
    return () => clearInterval(bgInterval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const result = await login(email, password);

      if (result.requiresVerification) {
        toast.warning('Email not verified. Redirecting to verification...');
        setTimeout(() => {
          navigate('/verify-otp', { state: { email: result.email } });
        }, 2000);
        return;
      }

      toast.success('Login successful! Welcome back.');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Left Side - Image with Quotes */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Ken Burns animated backgrounds */}
        {backgroundImages.map((img, index) => (
          <motion.div
            key={img}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${img}')` }}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{
              opacity: currentBg === index ? 1 : 0,
              scale: currentBg === index ? 1 : 1.1,
            }}
            transition={{ duration: 2 }}
          />
        ))}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900/80 via-dark-900/50 to-dark-900" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-dark-900/30" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 h-full">
          {/* Logo */}
          <motion.a
            href="/"
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-journey-solution to-accent-purple flex items-center justify-center">
              <Compass className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-white">
              Wander<span className="text-journey-solution">Forge</span>
            </span>
          </motion.a>

          {/* Quote carousel */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuote}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <blockquote className="text-4xl font-display font-bold text-white leading-tight mb-6">
                  &quot;{travelQuotes[currentQuote].quote}&quot;
                </blockquote>
                <p className="text-gray-400 text-lg">
                  — {travelQuotes[currentQuote].author}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Quote indicators */}
            <div className="flex gap-2 mt-8">
              {travelQuotes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuote(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentQuote === index
                      ? 'w-8 bg-journey-solution'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Bottom decoration */}
          <motion.div
            className="flex items-center gap-3 text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Plane className="w-5 h-5" />
            <span className="text-sm">Your next adventure awaits</span>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <a href="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-journey-solution to-accent-purple flex items-center justify-center">
                <Compass className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-display font-bold text-white">
                Wander<span className="text-journey-solution">Forge</span>
              </span>
            </a>
          </div>

          {/* Form card */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <motion.h1
                className="text-3xl font-display font-bold text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Welcome Back,{' '}
                <span className="text-journey-solution">Traveler</span>
              </motion.h1>
              <p className="text-gray-400">
                Continue where you left off on your journey
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-journey-solution" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-journey-solution focus:ring-2 focus:ring-journey-solution/20 transition-all"
                  required
                />
              </motion.div>

              {/* Password */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-journey-solution" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-journey-solution focus:ring-2 focus:ring-journey-solution/20 transition-all pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="group w-full py-4 bg-gradient-to-r from-journey-solution to-accent-purple text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-journey-solution/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden relative"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="relative z-10">Continue Your Journey</span>
                    <motion.span
                      className="relative z-10"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.span>
                  </>
                )}
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-400 text-sm">New to WanderForge?</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Sign Up Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
              >
                <span>Start your journey</span>
                <motion.span
                  className="text-journey-solution"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.span>
              </Link>
            </motion.div>

            {/* Back to Home */}
            <div className="text-center">
              <Link
                to="/"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <ToastContainer />
    </div>
  );
}
