// ============================================================
// CINEMATIC MEMORIES PAGE
// AI-powered travel documentary generator
// Full-screen vertical scroll with parallax backgrounds
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import {
  Film,
  ArrowLeft,
  Sparkles,
  Download,
  Share2,
  RefreshCw,
  Zap,
  ChevronDown,
  Upload,
  Wand2,
  Play,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useCinematicMemoriesStore } from '../stores/cinematic-memories.store';
import {
  PhotoUploadZone,
  PhotoPreviewGrid,
  AnalysisProgress,
  CinematicPlayer,
  EmotionJourney,
} from '../components/memories';
import { analyzePhotos, groupPhotosIntoScenes, generateStory } from '../services/memories';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Section configuration with Unsplash images (Film/Cinema theme)
const sections = [
  {
    id: 'hero',
    title: 'Your Story, Cinematically Told',
    subtitle: 'Transform travel photos into Netflix-style documentaries',
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1920&q=80',
    gradient: 'from-purple-500 to-pink-600',
    icon: Film,
  },
  {
    id: 'upload',
    title: 'Upload Your Memories',
    subtitle: 'Drag and drop your travel photos',
    image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1920&q=80',
    gradient: 'from-pink-500 to-rose-600',
    icon: Upload,
  },
  {
    id: 'generate',
    title: 'AI Creates Your Documentary',
    subtitle: 'Watch the magic unfold',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&q=80',
    gradient: 'from-indigo-500 to-purple-600',
    icon: Wand2,
  },
  {
    id: 'results',
    title: 'Your Documentary is Ready',
    subtitle: 'Sit back and enjoy',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80',
    gradient: 'from-rose-500 to-orange-600',
    icon: Play,
  },
];

// CinematicSection Component with Parallax
const CinematicSection = React.forwardRef<
  HTMLDivElement,
  {
    section: (typeof sections)[0];
    index: number;
    children: React.ReactNode;
    showScrollHint?: boolean;
  }
>(({ section, index, children, showScrollHint = true }, ref) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => sectionRef.current as HTMLDivElement);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const bg = bgRef.current;
    const content = contentRef.current;

    if (!sectionEl || !bg || !content) return;

    const ctx = gsap.context(() => {
      // Parallax background movement
      gsap.to(bg, {
        yPercent: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Content fade in with stagger
      gsap.fromTo(
        content.querySelectorAll('.animate-in'),
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionEl);

    return () => ctx.revert();
  }, []);

  const Icon = section.icon;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      id={`section-${section.id}`}
    >
      {/* Parallax Background */}
      <div
        ref={bgRef}
        className="absolute inset-0 scale-125 bg-cover bg-center"
        style={{ backgroundImage: `url('${section.image}')` }}
      />

      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${section.gradient}`}
        style={{ opacity: 0.4 }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-dark-900" style={{ opacity: 0.6 }} />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-dark-900/30" />

      {/* Section Number Badge */}
      <div className="absolute top-24 left-8 md:top-28 md:left-12">
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${section.gradient} flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-lg`}
        >
          {index + 1}
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 w-full max-w-4xl mx-auto px-6 py-20">
        {/* Icon */}
        <div className="animate-in flex justify-center mb-6">
          <div
            className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center border-2 border-white shadow-2xl`}
          >
            <Icon className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="animate-in text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white text-center mb-4">
          {section.title}
        </h2>

        {/* Subtitle */}
        <p className="animate-in text-xl text-gray-300 text-center mb-10">{section.subtitle}</p>

        {/* Section Content */}
        <div className="animate-in">{children}</div>

        {/* Scroll Hint */}
        {showScrollHint && (
          <motion.div
            className="animate-in mt-12 flex flex-col items-center text-gray-400"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="text-sm mb-2">Scroll to continue</span>
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        )}
      </div>
    </section>
  );
});

CinematicSection.displayName = 'CinematicSection';

// Progress Dots Component
function ProgressDots({
  currentSection,
  totalSections,
  onSectionClick,
}: {
  currentSection: number;
  totalSections: number;
  onSectionClick: (index: number) => void;
}) {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3">
      {Array.from({ length: totalSections }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSectionClick(i)}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            i === currentSection
              ? 'bg-white scale-125'
              : i < currentSection
              ? 'bg-purple-500'
              : 'bg-gray-600 hover:bg-gray-500'
          }`}
          aria-label={`Go to section ${i + 1}`}
        />
      ))}
    </div>
  );
}

// Feature card for hero section
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div whileHover={{ y: -5, scale: 1.02 }} className="glass-card p-6 text-center">
      <span className="text-4xl mb-4 block">{icon}</span>
      <h3 className="text-lg font-display font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </motion.div>
  );
}

export default function CinematicMemories() {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const {
    uploadedPhotos,
    processedPhotos,
    analysisStage,
    generatedStory,
    scenes,
    setAnalysisStage,
    setAnalysisProgress,
    setAnalysisMessage,
    setCurrentDetections,
    setProcessedPhotos,
    setScenes,
    setGeneratedStory,
    play,
    reset,
    currentSceneIndex,
    setCurrentScene,
  } = useCinematicMemoriesStore();

  const hasPhotos = uploadedPhotos.length > 0;
  const canGenerate = hasPhotos && analysisStage === 'idle';
  const isAnalyzing = analysisStage === 'analyzing' || analysisStage === 'generating';
  const hasStory = generatedStory !== null && scenes.length > 0;

  // Track current section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 2;
      let newSection = 0;

      sectionRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const sectionTop = window.scrollY + rect.top;
          if (scrollPos >= sectionTop) {
            newSection = index;
          }
        }
      });

      setCurrentSection(newSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to section
  const scrollToSection = (index: number) => {
    const section = sectionRefs.current[index];
    if (section) {
      gsap.to(window, {
        duration: 1,
        scrollTo: { y: section, offsetY: 0 },
        ease: 'power2.inOut',
      });
    }
  };

  // Auto-scroll to upload section when on hero
  const handleGetStarted = () => {
    scrollToSection(1);
  };

  // Start the analysis pipeline
  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;

    // Scroll to generate section
    scrollToSection(2);

    try {
      setAnalysisStage('uploading');
      setAnalysisMessage('Preparing your photos...');
      await new Promise((r) => setTimeout(r, 500));

      setAnalysisStage('analyzing');
      setAnalysisMessage('AI is examining your photos...');

      const processed = await analyzePhotos(
        uploadedPhotos,
        (current, total, photo, detections) => {
          setAnalysisProgress({ current, total });
          if (detections && detections.length > 0) {
            setCurrentDetections(detections);
          }
          if (photo) {
            setAnalysisMessage(`Analyzed: ${photo.analysis.caption}`);
          }
        }
      );

      setProcessedPhotos(processed);

      setAnalysisStage('generating');
      setAnalysisMessage('Creating your documentary...');
      const groupedScenes = await groupPhotosIntoScenes(processed);
      setScenes(groupedScenes);

      const story = await generateStory(groupedScenes, (stage) => {
        setAnalysisMessage(stage);
      });

      setGeneratedStory(story);
      setAnalysisStage('complete');
      setAnalysisMessage('Your documentary is ready!');
      setCurrentDetections([]);

      // Scroll to results section and auto-play
      setTimeout(() => {
        scrollToSection(3);
        play();
      }, 1000);
    } catch (error) {
      console.error('Generation error:', error);
      setAnalysisStage('idle');
      setAnalysisMessage('Something went wrong. Please try again.');
    }
  }, [
    canGenerate,
    uploadedPhotos,
    setAnalysisStage,
    setAnalysisMessage,
    setAnalysisProgress,
    setCurrentDetections,
    setProcessedPhotos,
    setScenes,
    setGeneratedStory,
    play,
  ]);

  // Reset and start over
  const handleReset = useCallback(() => {
    reset();
    scrollToSection(0);
  }, [reset]);

  // Determine visible sections count
  const visibleSections = hasStory ? 4 : 3;

  return (
    <div className="bg-dark-900">
      {/* Navigation - Fixed transparent */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/30 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Film className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-white">Cinematic Memories</h1>
                  <p className="text-dark-400 text-sm">
                    {generatedStory ? generatedStory.title : 'AI Documentary Generator'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasStory && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    New Story
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Progress Dots */}
      <ProgressDots
        currentSection={currentSection}
        totalSections={visibleSections}
        onSectionClick={scrollToSection}
      />

      {/* Section 1: Hero */}
      <CinematicSection
        ref={(el) => (sectionRefs.current[0] = el)}
        section={sections[0]}
        index={0}
      >
        {/* Hero Content */}
        <div className="space-y-8">
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon="🤖"
              title="AI Photo Analysis"
              description="Gemini Vision detects objects, emotions, and landmarks"
            />
            <FeatureCard
              icon="✨"
              title="Smart Doodles"
              description="Fun annotations on detected objects and faces"
            />
            <FeatureCard
              icon="🎬"
              title="Cinematic Playback"
              description="Ken Burns effects with typewriter narration"
            />
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={handleGetStarted}
              className="px-8 py-4 text-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              Get Started
            </Button>
          </div>
        </div>
      </CinematicSection>

      {/* Section 2: Upload */}
      <CinematicSection
        ref={(el) => (sectionRefs.current[1] = el)}
        section={sections[1]}
        index={1}
        showScrollHint={!hasPhotos}
      >
        <div className="space-y-6">
          <PhotoUploadZone />
          {hasPhotos && <PhotoPreviewGrid />}

          {/* Generate Button */}
          {canGenerate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center pt-4"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={handleGenerate}
                className="px-8 py-4 text-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Documentary ({uploadedPhotos.length} photos)
              </Button>
            </motion.div>
          )}
        </div>
      </CinematicSection>

      {/* Section 3: Generate */}
      <CinematicSection
        ref={(el) => (sectionRefs.current[2] = el)}
        section={sections[2]}
        index={2}
        showScrollHint={false}
      >
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnalysisProgress />
            </motion.div>
          ) : hasPhotos ? (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="glass-card p-8 max-w-md mx-auto">
                <Wand2 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-display font-bold text-white mb-2">
                  Ready to Create Magic
                </h3>
                <p className="text-gray-400 mb-6">
                  {uploadedPhotos.length} photos loaded. Click generate to start the AI analysis.
                </p>
                <Button variant="primary" onClick={handleGenerate}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Documentary
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="glass-card p-8 max-w-md mx-auto">
                <Upload className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-display font-bold text-white mb-2">No Photos Yet</h3>
                <p className="text-gray-400 mb-6">
                  Scroll up to upload your photos first, then come back here.
                </p>
                <Button variant="secondary" onClick={() => scrollToSection(1)}>
                  Go to Upload
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CinematicSection>

      {/* Section 4: Results (only shown when hasStory) */}
      {hasStory && (
        <CinematicSection
          ref={(el) => (sectionRefs.current[3] = el)}
          section={sections[3]}
          index={3}
          showScrollHint={false}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Player */}
            <div className="lg:col-span-2 space-y-6">
              <CinematicPlayer />

              {/* Story Info */}
              {generatedStory && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-white">
                        {generatedStory.title}
                      </h3>
                      <p className="text-gray-400 italic">{generatedStory.tagline}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                          {scenes.length} scenes
                        </span>
                        <span className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full">
                          {processedPhotos.length} photos
                        </span>
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                          {Math.round(generatedStory.totalDuration / 60)}+ mins
                        </span>
                        {generatedStory.locations.length > 0 && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                            {generatedStory.locations.length} locations
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Emotion Journey */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-4"
              >
                <EmotionJourney
                  scenes={scenes}
                  currentSceneIndex={currentSceneIndex}
                  onSceneClick={setCurrentScene}
                />
              </motion.div>

              {/* Scene List */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-4"
              >
                <h3 className="font-display font-semibold text-white mb-4">Scenes</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                  {scenes.map((scene, index) => (
                    <button
                      key={scene.id}
                      onClick={() => setCurrentScene(index)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        index === currentSceneIndex
                          ? 'bg-purple-500/20 ring-1 ring-purple-500/50'
                          : 'bg-dark-800/50 hover:bg-dark-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-sm">{scene.title}</span>
                        <span className="text-xs text-gray-500">{scene.photos.length}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{scene.narration}</p>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Locations */}
              {generatedStory && generatedStory.locations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card p-4"
                >
                  <h3 className="font-display font-semibold text-white mb-3">Locations</h3>
                  <div className="flex flex-wrap gap-2">
                    {generatedStory.locations.map((location) => (
                      <span
                        key={location}
                        className="px-3 py-1 bg-dark-800 text-gray-300 text-sm rounded-full"
                      >
                        {location}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </CinematicSection>
      )}
    </div>
  );
}
