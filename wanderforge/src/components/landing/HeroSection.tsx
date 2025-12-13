// ============================================================
// HERO SECTION - "The Chaos"
// Maximum wow factor landing with GSAP animations
// ============================================================

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';
import { MessageSquare, MapPin, Camera, Users, HelpCircle, Clock } from 'lucide-react';

// Floating chaos icons that represent travel planning hell
const chaosIcons = [
  { Icon: MessageSquare, delay: 0, x: '10%', y: '20%' },
  { Icon: MapPin, delay: 0.5, x: '80%', y: '15%' },
  { Icon: Camera, delay: 1, x: '15%', y: '70%' },
  { Icon: Users, delay: 1.5, x: '85%', y: '65%' },
  { Icon: HelpCircle, delay: 2, x: '50%', y: '10%' },
  { Icon: Clock, delay: 2.5, x: '70%', y: '80%' },
  { Icon: MessageSquare, delay: 0.3, x: '25%', y: '40%' },
  { Icon: HelpCircle, delay: 0.8, x: '60%', y: '30%' },
];

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const line3Ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial state
      gsap.set([line1Ref.current, line2Ref.current, line3Ref.current], {
        opacity: 0,
        y: 50,
      });

      // Staggered text reveal with glitch effect
      const tl = gsap.timeline({ delay: 0.5 });

      tl.to(line1Ref.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
      })
        .to(
          line2Ref.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
          },
          '-=0.4'
        )
        .to(
          line3Ref.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
          },
          '-=0.4'
        );

      // Parallax effect on scroll
      gsap.to('.chaos-icon', {
        y: () => Math.random() * 100 - 50,
        x: () => Math.random() * 50 - 25,
        rotation: () => Math.random() * 30 - 15,
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const scrollToNext = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-journey-chaos via-journey-chaosLight to-dark-900"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-journey-solution/20 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating chaos icons */}
      {chaosIcons.map((item, index) => (
        <motion.div
          key={index}
          className="chaos-icon absolute opacity-20 text-white/40"
          style={{ left: item.x, top: item.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.2, scale: 1 }}
          transition={{ delay: item.delay, duration: 0.5 }}
        >
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <item.Icon className="w-8 h-8 md:w-12 md:h-12" />
          </motion.div>
        </motion.div>
      ))}

      {/* Animated lines/connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
        <motion.path
          d="M0,100 Q400,50 800,100 T1600,100"
          stroke="url(#gradient1)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
        <motion.path
          d="M0,300 Q400,250 800,300 T1600,300"
          stroke="url(#gradient2)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, ease: 'easeInOut', delay: 0.5 }}
        />
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#ff6b35" />
          </linearGradient>
        </defs>
      </svg>

      {/* Main content */}
      <div ref={textRef} className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Chaos text with glitch effect */}
        <div className="space-y-2 md:space-y-4 mb-8">
          <span
            ref={line1Ref}
            className="block text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white"
          >
            <span className="text-accent-coral">Plot twist:</span> Nobody knows the plan.
          </span>
          <span
            ref={line2Ref}
            className="block text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white"
          >
            The vibe: <span className="text-accent-orange">immaculate confusion.</span>
          </span>
          <span
            ref={line3Ref}
            className="block text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white"
          >
            The trip: <span className="text-accent-gold">hanging by a thread.</span>
          </span>
        </div>

        {/* Subtext */}
        <motion.p
          className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          Main character energy starts here.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.8 }}
        >
          <motion.button
            onClick={scrollToNext}
            className="group relative px-8 py-4 bg-gradient-to-r from-journey-solution to-accent-purple text-white font-semibold rounded-full overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Escape the Chaos
              <motion.span
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                ↓
              </motion.span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-journey-solution opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.button>

          <motion.a
            href="/login"
            className="px-8 py-4 border border-white/20 text-white font-semibold rounded-full hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign In
          </motion.a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <motion.div
            className="w-1.5 h-1.5 bg-white rounded-full"
            animate={{ y: [0, 16, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
