// ============================================================
// SIGNUP PAGE - "Start Your Journey"
// Matching storytelling design with split layout
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Compass,
  ArrowRight,
  MapPin,
  Camera,
  Shield,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import { toast, ToastContainer } from '../components/auth/Toast';

const features = [
  {
    icon: MessageSquare,
    title: 'Signal-Cleanse',
    description: '500 messages → 5 action items',
    color: 'from-accent-cyan to-accent-purple',
  },
  {
    icon: Shield,
    title: 'Safety Sentinel',
    description: '24/7 live tracking & SOS alerts',
    color: 'from-journey-success to-accent-mint',
  },
  {
    icon: MapPin,
    title: 'Elastic Itinerary',
    description: 'Plans that adapt when life happens',
    color: 'from-accent-orange to-journey-dreamGold',
  },
  {
    icon: Camera,
    title: 'Cinematic Memories',
    description: 'AI-powered trip documentaries',
    color: 'from-journey-memory to-accent-purple',
  },
];

const backgroundImages = [
  'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=1920&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80',
  'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=1920&q=80',
];

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentBg, setCurrentBg] = useState(0);
  const [currentFeature, setCurrentFeature] = useState(0);
  const navigate = useNavigate();

  const { signup, isLoading } = useAuthStore();

  // Background carousel
  useEffect(() => {
    const bgInterval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgroundImages.length);
    }, 8000);
    return () => clearInterval(bgInterval);
  }, []);

  // Feature highlight carousel
  useEffect(() => {
    const featureInterval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(featureInterval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const result = await signup(name, email, password);

      if (result.requiresVerification) {
        toast.success('OTP sent to your email!');
        setTimeout(() => {
          navigate('/verify-otp', { state: { email: result.email } });
        }, 2000);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Left Side - Image with Features */}
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
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900/90 via-dark-900/60 to-dark-900" />
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

          {/* Feature showcase */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.h2
              className="text-4xl font-display font-bold text-white mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Everything you need for
              <br />
              <span className="text-journey-dreamGold">perfect group travel</span>
            </motion.h2>

            {/* Feature cards */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                    currentFeature === index
                      ? 'bg-white/10 backdrop-blur-xl border border-white/20'
                      : 'bg-transparent'
                  }`}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center flex-shrink-0`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </div>
                  {currentFeature === index && (
                    <motion.div
                      className="ml-auto"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <div className="w-2 h-2 rounded-full bg-journey-solution" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <motion.div
            className="flex gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {[
              { value: '10K+', label: 'Travelers' },
              { value: '500+', label: 'Trips' },
              { value: '4.9', label: 'Rating' },
            ].map((stat) => (
              <div key={stat.label}>
                <span className="text-2xl font-display font-bold text-white">
                  {stat.value}
                </span>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
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
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <motion.h1
                className="text-3xl font-display font-bold text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Start Your <span className="text-journey-dreamGold">Journey</span>
              </motion.h1>
              <p className="text-gray-400">
                Create your account and join thousands of travelers
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-journey-dreamGold" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-journey-dreamGold focus:ring-2 focus:ring-journey-dreamGold/20 transition-all"
                  required
                />
              </motion.div>

              {/* Email */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-journey-dreamGold" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-journey-dreamGold focus:ring-2 focus:ring-journey-dreamGold/20 transition-all"
                  required
                />
              </motion.div>

              {/* Password */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-journey-dreamGold" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-journey-dreamGold focus:ring-2 focus:ring-journey-dreamGold/20 transition-all pr-12"
                    required
                    minLength={6}
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
                <p className="text-xs text-gray-400">Minimum 6 characters required</p>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="group w-full py-4 bg-gradient-to-r from-journey-dreamGold to-accent-orange text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-journey-dreamGold/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden relative"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="relative z-10">Begin Your Adventure</span>
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
              <span className="text-gray-400 text-sm">Already a traveler?</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Login Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
              >
                <span>Continue your journey</span>
                <motion.span
                  className="text-journey-dreamGold"
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
