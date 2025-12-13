// ============================================================
// FEATURE CARDS - Your Travel Toolkit
// 3D hover effects and interactive previews
// ============================================================

import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { MessageSquare, Shield, Calendar, Film, Sparkles, Zap, Lock, Brain } from 'lucide-react';

const features = [
  {
    title: 'Signal-Cleanse',
    description: 'AI filters 500 chaotic messages into 5 clear action items. No more endless scrolling.',
    icon: MessageSquare,
    color: 'from-accent-cyan to-accent-purple',
    stats: '500 → 5',
    highlights: ['Smart Filtering', 'Priority Detection', 'Auto-Summarize'],
  },
  {
    title: 'Safety Sentinel',
    description: 'Live location sharing, SOS alerts, and group check-ins. Everyone stays connected, everyone stays safe.',
    icon: Shield,
    color: 'from-journey-success to-accent-mint',
    stats: '24/7',
    highlights: ['Live Tracking', 'SOS Alerts', 'Check-ins'],
  },
  {
    title: 'Elastic Itinerary',
    description: 'Plans that adapt when life happens. Delayed flight? Rain forecast? Your itinerary adjusts automatically.',
    icon: Calendar,
    color: 'from-accent-orange to-journey-dreamGold',
    stats: 'Auto-Adapt',
    highlights: ['Weather Aware', 'Delay Detection', 'Smart Reschedule'],
  },
  {
    title: 'Cinematic Memories',
    description: 'Upload your photos, get a Netflix-style documentary. AI detects faces, landmarks, and emotions.',
    icon: Film,
    color: 'from-journey-memory to-accent-purple',
    stats: 'AI Magic',
    highlights: ['Face Detection', 'Auto-Captions', 'Voice Narration'],
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg']);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      className="relative group"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15 }}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative p-8 rounded-3xl bg-dark-800/50 backdrop-blur-xl border border-white/10 overflow-hidden h-full"
        style={{ transform: 'translateZ(50px)' }}
      >
        {/* Gradient border on hover */}
        <div
          className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`}
          style={{ padding: '1px', margin: '-1px' }}
        />

        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
        >
          <feature.icon className="w-7 h-7 text-white" />
        </div>

        {/* Stats badge */}
        <div className="absolute top-8 right-8">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${feature.color} text-white`}
          >
            {feature.stats}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-display font-bold text-white mb-3">
          {feature.title}
        </h3>

        {/* Description */}
        <p className="text-gray-400 mb-6 leading-relaxed">
          {feature.description}
        </p>

        {/* Highlights */}
        <div className="flex flex-wrap gap-2">
          {feature.highlights.map((highlight) => (
            <span
              key={highlight}
              className="px-3 py-1 text-xs rounded-full bg-white/5 text-gray-300 border border-white/10"
            >
              {highlight}
            </span>
          ))}
        </div>

        {/* Hover glow */}
        <div
          className={`absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-r ${feature.color} rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`}
        />
      </div>
    </motion.div>
  );
}

export function FeatureCards() {
  return (
    <section className="relative py-32 bg-dark-900 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-journey-solution/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-journey-memory/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-journey-solution/20 text-journey-solution rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Your Travel Toolkit
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Everything you need,{' '}
            <span className="text-journey-solution">nothing you don&apos;t</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Four powerful features that work together to make every trip unforgettable.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div
          className="grid md:grid-cols-2 gap-6"
          style={{ perspective: '1000px' }}
        >
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        {/* Bottom features strip */}
        <motion.div
          className="mt-16 flex flex-wrap justify-center gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          {[
            { icon: Zap, text: 'Lightning Fast' },
            { icon: Lock, text: 'Privacy First' },
            { icon: Brain, text: 'AI Powered' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-gray-400">
              <item.icon className="w-5 h-5 text-journey-solution" />
              <span>{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
