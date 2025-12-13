// ============================================================
// DASHBOARD - Cinematic Feature Showcase
// Inspired by Culinary Odyssey - scroll-triggered expansions
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  MessageSquare,
  Shield,
  Map,
  Film,
  Compass,
  Bell,
  Sparkles,
  LogOut,
  User,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  Plane,
  Landmark,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuthStore } from '../stores/auth.store';

gsap.registerPlugin(ScrollTrigger);

// Floating particles for hero
const heroParticles = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  size: Math.random() * 6 + 3,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: Math.random() * 4 + 3,
  delay: Math.random() * 2,
}));

// Feature data with Unsplash backgrounds
const features = [
  {
    id: 'trip-chat',
    icon: Users,
    title: 'Trip Chat',
    tagline: 'Chat, extract, plan.',
    description: 'Real-time group chat with AI extraction. Discuss your trip and let AI capture dates, budget, and places.',
    gradient: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-900',
    glowColor: '#8b5cf6',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80',
    path: '/trip-chat',
    isNew: true,
  },
  {
    id: 'trip-planner',
    icon: Compass,
    title: 'Trip Planner',
    tagline: 'Dream it. Plan it. Live it.',
    description: 'AI-powered trip planning that turns your wildest travel dreams into actionable itineraries.',
    gradient: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-900',
    glowColor: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=1920&q=80',
    path: '/trip-planner',
    isNew: true,
  },
  {
    id: 'signal-cleanse',
    icon: MessageSquare,
    title: 'Signal-Cleanse',
    tagline: 'From chaos to clarity.',
    description: 'AI filters 500 chaotic messages into 5 clear action items. No more endless scrolling.',
    gradient: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-cyan-900',
    glowColor: '#06b6d4',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1920&q=80',
    path: '/signal-cleanse',
  },
  {
    id: 'safety-sentinel',
    icon: Shield,
    title: 'Safety Sentinel',
    tagline: 'Adventure with peace of mind.',
    description: 'Live location sharing, SOS alerts, and group check-ins. Everyone stays safe.',
    gradient: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-900',
    glowColor: '#10b981',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920&q=80',
    path: '/safety',
  },
  {
    id: 'elastic-itinerary',
    icon: Map,
    title: 'Elastic Itinerary',
    tagline: 'Plans that flow with you.',
    description: 'Delayed flight? Rain forecast? Your itinerary adjusts automatically.',
    gradient: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-900',
    glowColor: '#8b5cf6',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80',
    path: '/itinerary',
  },
  {
    id: 'cinematic-memories',
    icon: Film,
    title: 'Cinematic Memories',
    tagline: 'Your story, beautifully told.',
    description: 'Upload photos, get a Netflix-style documentary with AI narration.',
    gradient: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-900',
    glowColor: '#ec4899',
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1920&q=80',
    path: '/memories',
  },
  {
    id: 'hampi-vr',
    icon: Landmark,
    title: 'Hampi Heritage VR',
    tagline: 'Step into history.',
    description: 'Explore UNESCO World Heritage Site in immersive 360° VR and 3D. Virtual tours of ancient temples.',
    gradient: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-900',
    glowColor: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1920&q=80',
    path: '/hampi-vr',
    isNew: true,
  },
];

// Quick stats for hero
const quickStats = [
  { icon: MapPin, value: '50+', label: 'Destinations' },
  { icon: Users, value: '10K+', label: 'Travelers' },
  { icon: Calendar, value: '5K+', label: 'Trips Planned' },
];

// Feature Card Component with GSAP animations
function FeatureCard({ feature }: { feature: typeof features[0] }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const card = cardRef.current;
    const bg = bgRef.current;
    const content = contentRef.current;

    if (!card || !bg || !content) return;

    const ctx = gsap.context(() => {
      // Card height expansion on scroll
      gsap.fromTo(
        card,
        { height: '160px' },
        {
          height: '340px',
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            end: 'top 35%',
            scrub: 0.5,
          },
        }
      );

      // Background scale
      gsap.fromTo(
        bg,
        { scale: 1.3 },
        {
          scale: 1.05,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            end: 'top 35%',
            scrub: 0.5,
          },
        }
      );

      // Parallax background movement
      gsap.to(bg, {
        yPercent: -20,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Content fade in with stagger
      gsap.fromTo(
        content.querySelectorAll('.animate-item'),
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, card);

    return () => ctx.revert();
  }, []);

  return (
    <motion.div
      ref={cardRef}
      className="relative w-full overflow-hidden rounded-3xl cursor-pointer group"
      style={{ height: '160px' }}
      onClick={() => navigate(feature.path)}
      whileHover={{ scale: 1.015, y: -4 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Background Image with Parallax */}
      <div
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('${feature.image}')`,
          transform: 'scale(1.3)',
        }}
      />

      {/* Gradient Overlay - lighter to show image */}
      <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient}`} style={{ opacity: 0.4 }} />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent" />

      {/* Hover glow border */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500"
        style={{
          boxShadow: `inset 0 0 0 3px ${feature.glowColor}, 0 0 50px ${feature.glowColor}`,
        }}
      />

      {/* Content */}
      <div ref={contentRef} className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8">
        {/* NEW Badge */}
        {feature.isNew && (
          <div className="animate-item absolute top-4 right-4 md:top-6 md:right-6">
            <motion.span
              className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-dark-900 text-xs font-bold rounded-full shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              NEW
            </motion.span>
          </div>
        )}

        {/* Icon with glow */}
        <div className="animate-item mb-4">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-all duration-300 border-2 border-white`}
            style={{
              boxShadow: `0 0 25px ${feature.glowColor}`,
            }}
          >
            <feature.icon className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="animate-item">
          <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-1 drop-shadow-lg">
            {feature.title}
          </h3>
          <p className="text-lg md:text-xl text-gray-200 font-medium">
            {feature.tagline}
          </p>
        </div>

        {/* Description */}
        <p className="animate-item text-gray-300 mt-3 max-w-xl leading-relaxed text-sm md:text-base">
          {feature.description}
        </p>

        {/* CTA Arrow */}
        <div className="animate-item mt-5 flex items-center gap-3">
          <span className={`px-5 py-2 bg-gradient-to-r ${feature.gradient} rounded-full text-white font-medium text-sm border-2 border-white group-hover:scale-105 transition-transform`}>
            Explore Feature
          </span>
          <motion.div
            className={`w-10 h-10 rounded-full bg-gradient-to-r ${feature.gradient} flex items-center justify-center border-2 border-white`}
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${feature.gradient}`} />
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Hero parallax effect
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.hero-content', {
        yPercent: 50,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 border-b border-dark-700 bg-dark-900 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-white">
                Wander<span className="text-journey-solution">Forge</span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold hover:ring-2 hover:ring-primary-400 transition-all hover:scale-105"
                >
                  {user ? getInitials(user.name) : 'U'}
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-64 bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-dark-600 bg-gradient-to-r from-primary-900 to-secondary-900">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-lg">
                            {user ? getInitials(user.name) : 'U'}
                          </div>
                          <div>
                            <p className="text-white font-semibold">
                              {user?.name || 'User'}
                            </p>
                            <p className="text-gray-400 text-sm truncate">
                              {user?.email || ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 bg-dark-800">
                        <button
                          onClick={() => setShowUserMenu(false)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-dark-700 rounded-xl transition-colors"
                        >
                          <User className="w-5 h-5" />
                          Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900 rounded-xl transition-colors"
                        >
                          <LogOut className="w-5 h-5" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div
        ref={heroRef}
        className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
      >
        {/* Hero Background */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=80')`,
            }}
          />
          <div className="absolute inset-0 bg-dark-900" style={{ opacity: 0.6 }} />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-900/80 via-dark-900/40 to-dark-900" />
        </div>

        {/* Floating particles */}
        {heroParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-journey-solution"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -40, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-journey-solution rounded-full blur-3xl animate-pulse-slow" style={{ opacity: 0.25 }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-journey-memory rounded-full blur-3xl animate-pulse-slow" style={{ opacity: 0.25, animationDelay: '1s' }} />

        {/* Hero Content */}
        <div className="hero-content relative z-10 text-center px-6 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Greeting badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-5 py-2 bg-dark-800 rounded-full border border-dark-600 mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Plane className="w-4 h-4 text-journey-dreamGold" />
              <span className="text-gray-300 text-sm">Ready for your next adventure?</span>
              <Sparkles className="w-4 h-4 text-journey-solution" />
            </motion.div>

            {/* Main headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6">
              Welcome back,{' '}
              <span className="relative">
                <span className="text-journey-solution">
                  {user?.name?.split(' ')[0] || 'Traveler'}
                </span>
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-journey-solution to-journey-memory rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10">
              Your adventure toolkit awaits.{' '}
              <span className="text-white">Scroll to explore.</span>
            </p>

            {/* Quick stats */}
            <motion.div
              className="flex flex-wrap justify-center gap-6 md:gap-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {quickStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="flex items-center gap-3 px-5 py-3 bg-dark-800 rounded-2xl border border-dark-600"
                  whileHover={{ scale: 1.05, backgroundColor: '#1e293b' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <stat.icon className="w-5 h-5 text-journey-solution" />
                  <div className="text-left">
                    <p className="text-white font-bold text-lg">{stat.value}</p>
                    <p className="text-gray-500 text-xs">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="mt-16"
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <span className="text-xs uppercase tracking-widest">Scroll</span>
              <div className="w-6 h-10 rounded-full border-2 border-gray-500 flex items-start justify-center p-1">
                <motion.div
                  className="w-1.5 h-3 bg-journey-solution rounded-full"
                  animate={{ y: [0, 12, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Section divider */}
      <div className="relative h-24 bg-dark-900">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-dark-900 to-journey-solution rounded-full" />
      </div>

      {/* Feature Showcase Header */}
      <div className="max-w-6xl mx-auto px-6 mb-8 bg-dark-900">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-journey-solution text-white rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Your Toolkit
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
            Six features, <span className="text-journey-solution">infinite possibilities</span>
          </h2>
        </motion.div>
      </div>

      {/* Feature Showcase */}
      <div className="max-w-6xl mx-auto px-6 pb-24 space-y-8 bg-dark-900">
        {features.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-dark-700 py-10 px-6 bg-dark-950">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-display font-bold text-white">
              Wander<span className="text-journey-solution">Forge</span>
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            Built with love by Team ForgeX — Yashas N · Naveen G P · Jeeth K · Shrajan Prabhu
          </p>
        </div>
      </footer>
    </div>
  );
}
