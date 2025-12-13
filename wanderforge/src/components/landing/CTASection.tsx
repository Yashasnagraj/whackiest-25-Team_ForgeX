// ============================================================
// CTA SECTION - "Start Your Journey"
// Compelling final call-to-action with parallax background
// ============================================================

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Star, Compass } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Floating particles for magic effect
const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  size: Math.random() * 4 + 2,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: Math.random() * 3 + 4,
  delay: Math.random() * 2,
}));

export function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax background
      gsap.fromTo(
        bgRef.current,
        { y: 0 },
        {
          y: -100,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Parallax background */}
      <div className="absolute inset-0">
        <div
          ref={bgRef}
          className="absolute inset-0 scale-110 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80')`,
          }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-900/70 to-dark-900" />
        <div className="absolute inset-0 bg-gradient-to-r from-journey-solution/20 to-journey-memory/20 mix-blend-overlay" />
      </div>

      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 mb-8"
        >
          <Compass className="w-4 h-4 text-journey-solution" />
          <span className="text-white text-sm font-medium">
            Your Adventure Awaits
          </span>
          <Sparkles className="w-4 h-4 text-journey-dreamGold" />
        </motion.div>

        {/* Main headline */}
        <motion.h2
          className="text-5xl md:text-7xl font-display font-bold text-white mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Your next{' '}
          <span className="relative">
            <span className="text-journey-dreamGold">adventure</span>
            {/* Underline decoration */}
            <motion.svg
              className="absolute -bottom-2 left-0 w-full h-4"
              viewBox="0 0 200 20"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: 1 }}
            >
              <motion.path
                d="M0 10 Q50 0 100 10 T200 10"
                fill="none"
                stroke="url(#ctaGradient)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="ctaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f7931e" />
                  <stop offset="100%" stopColor="#ff6b35" />
                </linearGradient>
              </defs>
            </motion.svg>
          </span>
          <br />
          is waiting.
        </motion.h2>

        {/* Subtext */}
        <motion.p
          className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          Join thousands of travelers who&apos;ve escaped the chaos.
          <br />
          <span className="text-white font-medium">
            From 847 messages to one perfect trip.
          </span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          {/* Primary CTA */}
          <motion.a
            href="/signup"
            className="group relative px-10 py-5 bg-gradient-to-r from-journey-solution to-accent-purple text-white font-bold text-lg rounded-full overflow-hidden shadow-2xl shadow-journey-solution/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10 flex items-center gap-3">
              Start Your Trail — Free
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.span>
            </span>
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            {/* Hover gradient swap */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-journey-solution opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.a>

          {/* Secondary CTA */}
          <motion.a
            href="/login"
            className="group px-10 py-5 border-2 border-white/30 text-white font-semibold text-lg rounded-full hover:bg-white/10 hover:border-white/50 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="flex items-center gap-2">
              Already a traveler? Login
            </span>
          </motion.a>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className="mt-16 flex flex-wrap justify-center gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
        >
          {[
            { icon: Star, text: 'Free Forever Plan' },
            { icon: Sparkles, text: 'No Credit Card Required' },
            { icon: Compass, text: 'Setup in 2 Minutes' },
          ].map((badge) => (
            <div
              key={badge.text}
              className="flex items-center gap-2 text-white/60"
            >
              <badge.icon className="w-5 h-5 text-journey-dreamGold" />
              <span className="text-sm">{badge.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Decorative quote */}
        <motion.div
          className="mt-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
        >
          <p className="text-white/60 text-lg italic">
            &quot;The world is a book, and those who do not travel read only one page.&quot;
          </p>
          <p className="text-white/50 text-sm mt-2">— Saint Augustine</p>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-900 to-transparent" />
    </section>
  );
}
