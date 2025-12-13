// ============================================================
// WANDERFORGE LANDING PAGE
// Cinematic, scroll-driven story with maximum wow factor
// Journey: CHAOS → DREAM → JOURNEY → FEATURES → TEAM → CTA
// ============================================================

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Navbar,
  HeroSection,
  DreamSection,
  JourneyStages,
  FeatureCards,
  CTASection,
} from '../components/landing';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  useEffect(() => {
    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // Refresh ScrollTrigger on load to ensure proper calculations
    ScrollTrigger.refresh();

    return () => {
      // Cleanup all ScrollTrigger instances on unmount
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="relative bg-dark-900 overflow-x-hidden">
      {/* Sticky Navigation */}
      <Navbar />

      {/* Section 1: THE CHAOS - Hero */}
      <HeroSection />

      {/* Section 2: THE DREAM - What Travel Should Feel Like */}
      <DreamSection />

      {/* Section 3: THE JOURNEY - Horizontal Scroll Stages */}
      <div id="journey">
        <JourneyStages />
      </div>

      {/* Section 4: FEATURES - Deep Dive Cards */}
      <div id="features">
        <FeatureCards />
      </div>

      {/* Section 5: CTA - Final Call to Action */}
      <CTASection />

      {/* Footer */}
      <footer className="relative bg-dark-900 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left - Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-journey-solution to-accent-purple flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </div>
              <span className="text-lg font-display font-bold text-white">
                WanderForge
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-300 text-sm">
                Whackiest&apos;25
              </span>
            </div>

            {/* Center - Team */}
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <span className="text-gray-400">Built by</span>
              <span className="text-white">Team ForgeX</span>
              <span className="text-gray-400">—</span>
              <span>Yashas N</span>
              <span className="text-gray-400">·</span>
              <span>Naveen G P</span>
              <span className="text-gray-400">·</span>
              <span>Jeeth K</span>
              <span className="text-gray-400">·</span>
              <span>Shrajan Prabhu</span>
            </div>

            {/* Right - Copyright */}
            <p className="text-gray-400 text-sm">
              &copy; 2025 WanderForge
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
