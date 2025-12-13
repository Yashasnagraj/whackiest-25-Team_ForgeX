// ============================================================
// DREAM SECTION - "What Travel Should Feel Like"
// Transition from chaos to dream with stats counters
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useInView } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: 73, suffix: '%', label: 'of travelers feel stressed planning trips' },
  { value: 4.2, suffix: 'hrs', label: 'average time spent coordinating' },
  { value: 89, suffix: '%', label: 'of trip photos never get organized' },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current * 10) / 10);
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

export function DreamSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Ken Burns zoom effect on image
      gsap.fromTo(
        imageRef.current,
        { scale: 1.2 },
        {
          scale: 1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        }
      );

      // Parallax text
      gsap.fromTo(
        '.dream-text',
        { y: 100 },
        {
          y: 0,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end: 'top 20%',
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
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background image with Ken Burns */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          ref={imageRef}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1920&q=80')`,
          }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-900/50 to-dark-900" />
        <div className="absolute inset-0 bg-gradient-to-r from-journey-dream/20 to-journey-dreamGold/20 mix-blend-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text */}
          <div className="dream-text">
            <motion.span
              className="inline-block px-4 py-2 bg-journey-dream/20 text-journey-dream rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              The Dream
            </motion.span>

            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Travel should feel like{' '}
              <span className="text-journey-dreamGold">THIS.</span>
            </motion.h2>

            <motion.p
              className="text-xl text-gray-300 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              Synchronized plans. Safe journeys. Memories that last forever.
              <br />
              <span className="text-white font-medium">
                No chaos. Just adventure.
              </span>
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              {['AI-Powered', 'Real-time Sync', 'Group Safety', 'Smart Memories'].map(
                (tag, i) => (
                  <span
                    key={tag}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm border border-white/10"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {tag}
                  </span>
                )
              )}
            </motion.div>
          </div>

          {/* Right side - Stats */}
          <div className="grid gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="relative p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden group"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Gradient accent */}
                <div
                  className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${
                    index === 0
                      ? 'from-accent-coral to-accent-orange'
                      : index === 1
                      ? 'from-accent-cyan to-accent-purple'
                      : 'from-journey-memory to-journey-memoryLight'
                  }`}
                />

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-display font-bold text-white">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </span>
                </div>
                <p className="text-gray-400">{stat.label}</p>

                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-journey-solution/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom message */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-2xl md:text-3xl text-white/60 font-light">
            Ready to transform your travel experience?
          </p>
          <motion.div
            className="mt-4 text-journey-solution"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="text-3xl">↓</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
