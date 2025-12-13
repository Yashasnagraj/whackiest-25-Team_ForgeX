// ============================================================
// JOURNEY STAGES - Horizontal Scroll Section
// TripAdvisor-style horizontal scrolling journey
// MAXIMUM WOW FACTOR with GSAP ScrollTrigger
// ============================================================

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Compass, MessageSquare, Shield, Film } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const journeyStages = [
  {
    id: 'dreaming',
    title: 'Dreaming',
    question: '"Where should we go?"',
    solution: 'AI Trip Planner suggests perfect destinations based on your group\'s preferences',
    feature: 'Trip Planner',
    icon: Compass,
    color: 'from-accent-orange to-journey-dreamGold',
    image: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=1200&q=80',
  },
  {
    id: 'planning',
    title: 'Planning',
    question: '"Who\'s bringing what? When do we leave?"',
    solution: 'Signal-Cleanse AI filters 500 messages into 5 clear action items',
    feature: 'Signal-Cleanse',
    icon: MessageSquare,
    color: 'from-accent-cyan to-journey-progress',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80',
  },
  {
    id: 'traveling',
    title: 'Traveling',
    question: '"Is everyone safe? Where\'s the group?"',
    solution: 'Safety Sentinel provides live tracking, SOS alerts, and group check-ins',
    feature: 'Safety Sentinel',
    icon: Shield,
    color: 'from-journey-success to-accent-mint',
    image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=1200&q=80',
  },
  {
    id: 'remembering',
    title: 'Remembering',
    question: '"Those photos deserve a story"',
    solution: 'Cinematic Memories turns your photos into Netflix-style documentaries',
    feature: 'Cinematic Memories',
    icon: Film,
    color: 'from-journey-memory to-accent-purple',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
  },
];

export function JourneyStages() {
  const containerRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const horizontal = horizontalRef.current;
    const progress = progressRef.current;
    if (!container || !horizontal || !progress) return;

    const ctx = gsap.context(() => {
      // Calculate scroll distance
      const scrollWidth = horizontal.scrollWidth - window.innerWidth;

      // Horizontal scroll animation
      const scrollTween = gsap.to(horizontal, {
        x: -scrollWidth,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          pin: true,
          scrub: 1,
          end: () => `+=${scrollWidth}`,
          // markers: true, // Uncomment for debugging
        },
      });

      // Progress bar animation
      gsap.to(progress, {
        width: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: () => `+=${scrollWidth}`,
          scrub: 1,
        },
      });

      // Animate each stage as it comes into view
      journeyStages.forEach((_, index) => {
        const stageElement = horizontal.querySelector(`[data-stage="${index}"]`);
        if (stageElement) {
          gsap.fromTo(
            stageElement.querySelectorAll('.stage-content'),
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              stagger: 0.1,
              scrollTrigger: {
                trigger: stageElement,
                containerAnimation: scrollTween,
                start: 'left 80%',
                end: 'left 20%',
                scrub: 1,
              },
            }
          );
        }
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative bg-dark-900 overflow-hidden">
      {/* Section header */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-8 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between"
          >
            <div>
              <span className="text-journey-solution text-sm font-medium uppercase tracking-wider">
                Your Journey
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mt-1">
                Four Stages to{' '}
                <span className="text-journey-solution">Perfect Travel</span>
              </h2>
            </div>

            {/* Stage indicators */}
            <div className="hidden md:flex items-center gap-4">
              {journeyStages.map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full bg-gradient-to-r ${stage.color}`}
                  />
                  <span className="text-sm text-gray-400">{stage.title}</span>
                  {index < journeyStages.length - 1 && (
                    <span className="text-gray-400 mx-2">→</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Progress bar */}
          <div className="mt-6 h-1 bg-dark-700 rounded-full overflow-hidden">
            <div
              ref={progressRef}
              className="h-full w-0 bg-gradient-to-r from-accent-orange via-accent-cyan via-journey-success to-journey-memory rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={horizontalRef}
        className="flex pt-32"
        style={{ width: `${journeyStages.length * 100}vw` }}
      >
        {journeyStages.map((stage, index) => (
          <div
            key={stage.id}
            data-stage={index}
            className="relative w-screen h-screen flex items-center justify-center px-8 md:px-16"
          >
            {/* Background image with gradient overlay */}
            <div className="absolute inset-0">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{ backgroundImage: `url('${stage.image}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-dark-900 via-dark-900/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-dark-900/50" />
            </div>

            {/* Stage number */}
            <div className="absolute top-40 left-8 md:left-16">
              <span
                className={`text-[150px] md:text-[200px] font-display font-bold bg-gradient-to-r ${stage.color} bg-clip-text text-transparent opacity-20`}
              >
                0{index + 1}
              </span>
            </div>

            {/* Content */}
            <div className="relative z-10 grid md:grid-cols-2 gap-8 md:gap-16 items-center max-w-6xl mx-auto w-full">
              {/* Left - Text */}
              <div className="space-y-6">
                <div className="stage-content">
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${stage.color} bg-opacity-20 text-white text-sm font-medium`}
                  >
                    <stage.icon className="w-4 h-4" />
                    {stage.feature}
                  </span>
                </div>

                <h3 className="stage-content text-5xl md:text-7xl font-display font-bold text-white">
                  {stage.title}
                </h3>

                <p className="stage-content text-2xl md:text-3xl text-white/70 italic">
                  {stage.question}
                </p>

                <p className="stage-content text-lg text-gray-400 max-w-md">
                  {stage.solution}
                </p>

                <motion.button
                  className={`stage-content inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r ${stage.color} text-white font-semibold`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Learn More
                  <span>→</span>
                </motion.button>
              </div>

              {/* Right - Visual */}
              <div className="stage-content relative">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={stage.image}
                    alt={stage.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-tr ${stage.color} opacity-30 mix-blend-overlay`}
                  />

                  {/* Feature preview card */}
                  <div className="absolute bottom-4 left-4 right-4 p-4 bg-dark-900/90 backdrop-blur-xl rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-r ${stage.color} flex items-center justify-center`}
                      >
                        <stage.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{stage.feature}</p>
                        <p className="text-gray-400 text-sm">Powered by AI</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative elements */}
                <div
                  className={`absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r ${stage.color} rounded-full blur-3xl opacity-30`}
                />
                <div
                  className={`absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r ${stage.color} rounded-full blur-3xl opacity-20`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <motion.div
          className="flex items-center gap-2 text-white/70 text-sm"
          animate={{ x: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span>Scroll to explore</span>
          <span className="text-xl">→</span>
        </motion.div>
      </div>
    </section>
  );
}
