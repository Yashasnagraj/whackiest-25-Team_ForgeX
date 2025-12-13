import { useState, useEffect, useRef, Suspense } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import {
  ArrowLeft,
  Globe,
  Landmark,
  Church,
  Crown,
  Mountain,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Info,
  X,
  Eye,
  Sun,
  Moon,
  Sunset,
  MapPin,
  Map,
  Castle,
  Camera,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { indiaMonuments, monumentCategories, monumentRegions, virtualTourStops, type Monument } from '../data/hampiMonuments';
import { useHampiExperienceStore } from '../stores/hampi-experience.store';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Hero Section Configuration
const heroConfig = {
  title: 'India Heritage VR',
  subtitle: 'Experience India\'s iconic monuments in immersive 360° views and 3D',
  backgroundImage: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1920&q=80',
  gradient: 'from-orange-600 to-amber-700',
};

// Category Icon Map
const categoryIcons: Record<string, React.ElementType> = {
  all: Globe,
  temple: Church,
  palace: Crown,
  monument: Landmark,
  fort: Castle,
  Camera,
  cave: Mountain,
  viewpoint: Eye,
};

// Region Icon Map
const regionIcons: Record<string, React.ElementType> = {
  all: Map,
  north: MapPin,
  south: MapPin,
  west: MapPin,
  east: MapPin,
  central: MapPin,
};

// =====================================================
// PANORAMA 360 VIEWER COMPONENT - GOOGLE STREET VIEW IFRAME
// =====================================================
interface Panorama360ViewerProps {
  monument: Monument;
  onClose: () => void;
}

function Panorama360Viewer({ monument, onClose }: Panorama360ViewerProps) {
  const { showInfoPanel, toggleInfoPanel } = useHampiExperienceStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-dark-900"
    >
      {/* Google Street View Iframe */}
      <iframe
        src={monument.panoramaUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0"
      />

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-dark-900/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-dark-800/80 backdrop-blur-sm hover:bg-dark-700 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div>
            <h2 className="text-xl font-display font-bold text-white">{monument.name}</h2>
            <p className="text-amber-400 text-sm">360° Street View</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleInfoPanel}
            className={`p-2 rounded-lg ${showInfoPanel ? 'bg-amber-500' : 'bg-dark-800/80'} backdrop-blur-sm transition-colors`}
            title="Info Panel"
          >
            <Info className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Info Panel */}
      <AnimatePresence>
        {showInfoPanel && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute right-0 top-20 bottom-0 w-80 bg-dark-900/95 backdrop-blur-xl border-l border-dark-700 p-6 overflow-y-auto pointer-events-auto"
          >
            <h3 className="text-lg font-display font-semibold text-white mb-4">About This Site</h3>
            <p className="text-dark-300 text-sm leading-relaxed mb-6">{monument.longDescription}</p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-dark-400 text-xs">Region</p>
                  <p className="text-white text-sm capitalize">{monument.region} India</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-dark-400 text-xs">Entry Fee</p>
                  <p className="text-white text-sm">{monument.entryFee}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Sun className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-dark-400 text-xs">Timing</p>
                  <p className="text-white text-sm">{monument.timing}</p>
                </div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-white mb-3">Historical Facts</h4>
            <ul className="space-y-2">
              {monument.historicalFacts.map((fact, i) => (
                <li key={i} className="flex items-start gap-2 text-dark-300 text-sm">
                  <span className="text-amber-400 mt-1">•</span>
                  {fact}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-dark-400 text-sm flex items-center gap-2 pointer-events-none bg-dark-900/60 px-4 py-2 rounded-full backdrop-blur-sm">
        <span>Drag to look around 360°</span>
        <span>•</span>
        <span>Scroll to zoom</span>
      </div>
    </motion.div>
  );
}

// =====================================================
// 3D MODEL VIEWER COMPONENT
// =====================================================
interface Model3DViewerProps {
  monument: Monument;
  onClose: () => void;
}

function Model3DScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <mesh rotation={[0, 0, 0]}>
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial color="#d97706" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <coneGeometry args={[1.5, 2, 4]} />
        <meshStandardMaterial color="#92400e" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[0, -1.5, 0]}>
        <boxGeometry args={[3, 0.5, 3]} />
        <meshStandardMaterial color="#78350f" metalness={0.2} roughness={0.8} />
      </mesh>
    </>
  );
}

function Model3DViewer({ monument, onClose }: Model3DViewerProps) {
  const { lightingMode, showAnnotations, setLightingMode, toggleAnnotations } = useHampiExperienceStore();

  const lightingPresets = {
    day: { intensity: 1, color: '#ffffff' },
    sunset: { intensity: 0.8, color: '#ff9500' },
    night: { intensity: 0.3, color: '#4a5568' },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-dark-900"
    >
      <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
        <color attach="background" args={['#0a0a0f']} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <ambientLight intensity={lightingPresets[lightingMode].intensity * 0.3} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={lightingPresets[lightingMode].intensity}
          color={lightingPresets[lightingMode].color}
          castShadow
        />

        <Suspense fallback={null}>
          <Model3DScene />
        </Suspense>

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={20}
          autoRotate
          autoRotateSpeed={0.5}
        />

        {showAnnotations && monument.hotspots.map((hotspot, i) => (
          <Html
            key={hotspot.id}
            position={[(i - 1) * 2, 2, 0]}
            center
            distanceFactor={10}
          >
            <div className="bg-dark-800/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-amber-500/30 whitespace-nowrap">
              <p className="text-amber-400 text-xs font-semibold">{hotspot.label}</p>
            </div>
          </Html>
        ))}
      </Canvas>

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-dark-900/80 to-transparent">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-dark-800/80 backdrop-blur-sm hover:bg-dark-700 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div>
            <h2 className="text-xl font-display font-bold text-white">{monument.name}</h2>
            <p className="text-purple-400 text-sm">3D Model Explorer</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-dark-800/80 backdrop-blur-sm rounded-lg p-1">
            <button
              onClick={() => setLightingMode('day')}
              className={`p-2 rounded-lg ${lightingMode === 'day' ? 'bg-amber-500' : ''} transition-colors`}
            >
              <Sun className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setLightingMode('sunset')}
              className={`p-2 rounded-lg ${lightingMode === 'sunset' ? 'bg-orange-500' : ''} transition-colors`}
            >
              <Sunset className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setLightingMode('night')}
              className={`p-2 rounded-lg ${lightingMode === 'night' ? 'bg-indigo-500' : ''} transition-colors`}
            >
              <Moon className="w-4 h-4 text-white" />
            </button>
          </div>

          <button
            onClick={toggleAnnotations}
            className={`p-2 rounded-lg ${showAnnotations ? 'bg-purple-500' : 'bg-dark-800/80'} backdrop-blur-sm transition-colors`}
          >
            <Eye className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 px-4">
        <div className="max-w-2xl mx-auto glass-card p-4 bg-dark-800/80">
          <p className="text-dark-300 text-sm text-center">{monument.description}</p>
        </div>
      </div>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-dark-400 text-sm flex items-center gap-2">
        <span>Drag to rotate</span>
        <span>•</span>
        <span>Scroll to zoom</span>
        <span>•</span>
        <span>Right-click to pan</span>
      </div>
    </motion.div>
  );
}

// =====================================================
// VIRTUAL TOUR MODE COMPONENT
// =====================================================
interface VirtualTourProps {
  onClose: () => void;
}

function VirtualTour({ onClose }: VirtualTourProps) {
  const {
    currentTourStop,
    tourProgress,
    isPlaying,
    isMuted,
    isNarrating,
    playTour,
    pauseTour,
    nextTourStop,
    prevTourStop,
    setTourProgress,
    toggleMute,
    setNarrating,
  } = useHampiExperienceStore();

  const currentStop = virtualTourStops[currentTourStop];
  const currentMonument = indiaMonuments.find(m => m.id === currentStop?.monumentId);

  useEffect(() => {
    if (!isPlaying || !currentStop) return;

    const interval = setInterval(() => {
      setTourProgress(tourProgress + 1);

      if (tourProgress >= currentStop.duration) {
        if (currentTourStop < virtualTourStops.length - 1) {
          nextTourStop();
        } else {
          pauseTour();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, tourProgress, currentTourStop, currentStop]);

  useEffect(() => {
    if (!currentStop || isMuted) return;

    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(currentStop.narration);
      utterance.rate = 0.9;
      utterance.onstart = () => setNarrating(true);
      utterance.onend = () => setNarrating(false);
      window.speechSynthesis.speak(utterance);
    };

    speak();

    return () => {
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTourStop, isMuted]);

  if (!currentMonument) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-dark-900"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${currentMonument.thumbnailUrl})` }}
      />
      <div className="absolute inset-0 bg-dark-900/60" />

      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-dark-900/80 to-transparent">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-dark-800/80 backdrop-blur-sm hover:bg-dark-700 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div>
            <h2 className="text-xl font-display font-bold text-white">India Heritage Tour</h2>
            <p className="text-emerald-400 text-sm">
              Stop {currentTourStop + 1} of {virtualTourStops.length}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          key={currentTourStop}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="max-w-2xl mx-4 glass-card p-8 text-center"
        >
          <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${currentMonument.gradient} p-0.5`}>
            <div className="w-full h-full rounded-2xl bg-dark-900/80 flex items-center justify-center">
              <Landmark className="w-10 h-10 text-white" />
            </div>
          </div>

          <h3 className="text-3xl font-display font-bold text-white mb-4">
            {currentMonument.name}
          </h3>

          <p className="text-dark-300 text-lg leading-relaxed mb-6">
            {currentStop.narration}
          </p>

          {isNarrating && (
            <div className="flex items-center justify-center gap-2 text-emerald-400 mb-4">
              <Volume2 className="w-5 h-5 animate-pulse" />
              <span className="text-sm">Narrating...</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-6">
            {currentMonument.historicalFacts.slice(0, 2).map((fact, i) => (
              <div key={i} className="p-3 rounded-xl bg-dark-800/50 text-left">
                <p className="text-dark-300 text-sm">{fact}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-900/80 to-transparent">
        <div className="max-w-2xl mx-auto mb-4">
          <div className="flex items-center gap-2 mb-2">
            {virtualTourStops.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  i < currentTourStop ? 'bg-emerald-500' :
                  i === currentTourStop ? 'bg-emerald-400' : 'bg-dark-700'
                }`}
              >
                {i === currentTourStop && (
                  <div
                    className="h-full bg-emerald-300 rounded-full transition-all"
                    style={{ width: `${(tourProgress / currentStop.duration) * 100}%` }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={prevTourStop}
            disabled={currentTourStop === 0}
            className="p-3 rounded-full bg-dark-800/80 backdrop-blur-sm hover:bg-dark-700 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={isPlaying ? pauseTour : playTour}
            className="p-4 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white" />
            )}
          </button>

          <button
            onClick={nextTourStop}
            disabled={currentTourStop === virtualTourStops.length - 1}
            className="p-3 rounded-full bg-dark-800/80 backdrop-blur-sm hover:bg-dark-700 disabled:opacity-50 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={toggleMute}
            className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-dark-800/80'} backdrop-blur-sm transition-colors`}
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// =====================================================
// MONUMENT CARD COMPONENT
// =====================================================
interface MonumentCardProps {
  monument: Monument;
  onView360: () => void;
  onView3D: () => void;
}

function MonumentCard({ monument, onView360, onView3D }: MonumentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const CategoryIcon = categoryIcons[monument.category] || Landmark;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-2xl glass-card"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={monument.thumbnailUrl}
          alt={monument.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${monument.gradient} opacity-40 group-hover:opacity-60 transition-opacity`} />
      </div>

      {/* Category & Region Badges */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${monument.gradient} flex items-center gap-2`}>
          <CategoryIcon className="w-4 h-4 text-white" />
          <span className="text-white text-xs font-medium capitalize">{monument.category}</span>
        </div>
        <div className="px-3 py-1 rounded-full bg-dark-900/80 backdrop-blur-sm flex items-center gap-2">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span className="text-white text-xs capitalize">{monument.region}</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-900 via-dark-900/80 to-transparent">
        <h3 className="text-lg font-display font-semibold text-white mb-1">{monument.name}</h3>
        <p className="text-dark-300 text-sm line-clamp-2">{monument.description}</p>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex gap-2 mt-4"
            >
              <Button
                variant="primary"
                size="sm"
                onClick={onView360}
                className={`flex-1 bg-gradient-to-r ${monument.gradient}`}
              >
                <Globe className="w-4 h-4 mr-1" />
                360° View
              </Button>
              {monument.modelUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onView3D}
                  className="flex-1"
                >
                  <Landmark className="w-4 h-4 mr-1" />
                  3D Model
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// =====================================================
// MAIN PAGE COMPONENT
// =====================================================
export default function HampiExperience() {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const {
    currentMode,
    selectedMonument,
    categoryFilter,
    setMode,
    selectMonument,
    setCategoryFilter,
    startTour,
    exitViewer,
    reset,
  } = useHampiExperienceStore();

  // Filter monuments by category and region
  const filteredMonuments = indiaMonuments.filter(m => {
    const categoryMatch = categoryFilter === 'all' || m.category === categoryFilter;
    const regionMatch = regionFilter === 'all' || m.region === regionFilter;
    return categoryMatch && regionMatch;
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      sectionRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const sectionTop = rect.top + window.scrollY;
          const sectionBottom = sectionTop + rect.height;

          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            setCurrentSection(index);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (index: number) => {
    const section = sectionRefs.current[index];
    if (section) {
      gsap.to(window, {
        duration: 1,
        scrollTo: { y: section, offsetY: 0 },
        ease: 'power3.inOut',
      });
    }
  };

  const handleView360 = (monument: Monument) => {
    selectMonument(monument);
    setMode('panorama');
  };

  const handleView3D = (monument: Monument) => {
    selectMonument(monument);
    setMode('3d');
  };

  const handleStartTour = () => {
    startTour();
  };

  const handleCloseViewer = () => {
    exitViewer();
  };

  useEffect(() => {
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-dark-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-dark-900/30 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-white">India Heritage VR</h1>
                  <p className="text-dark-400 text-sm">Virtual Reality Experience</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/taj-mahal-ar')}
                className="bg-gradient-to-r from-purple-500 to-indigo-600"
              >
                <Camera className="w-4 h-4 mr-2" />
                Taj Mahal AR
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartTour}
                className="bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Virtual Tour
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Progress Dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
        {[0, 1].map((i) => (
          <button
            key={i}
            onClick={() => scrollToSection(i)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i === currentSection
                ? 'bg-orange-500 scale-125'
                : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to section ${i + 1}`}
          />
        ))}
      </div>

      {/* Section 1: Hero */}
      <div
        ref={(el) => { sectionRefs.current[0] = el; }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroConfig.backgroundImage})` }}
        />
        <div className={`absolute inset-0 bg-gradient-to-b ${heroConfig.gradient} opacity-60`} />
        <div className="absolute inset-0 bg-dark-900/40" />

        <div className="relative z-10 text-center px-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-0.5"
          >
            <div className="w-full h-full rounded-2xl bg-dark-900/80 flex items-center justify-center">
              <Globe className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-display font-bold text-white mb-6"
          >
            {heroConfig.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-white/80 max-w-2xl mx-auto mb-12"
          >
            {heroConfig.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => scrollToSection(1)}
              className="bg-gradient-to-r from-orange-500 to-amber-600"
            >
              <Globe className="w-5 h-5 mr-2" />
              Explore Monuments
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleStartTour}
            >
              <Play className="w-5 h-5 mr-2" />
              Virtual Tour
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center gap-12 mt-16"
          >
            <div className="text-center">
              <p className="text-4xl font-display font-bold text-white">19</p>
              <p className="text-dark-300 text-sm">Heritage Sites</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-display font-bold text-white">360°</p>
              <p className="text-dark-300 text-sm">Panoramic Views</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-display font-bold text-white">5</p>
              <p className="text-dark-300 text-sm">Regions of India</p>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8" />
        </motion.div>
      </div>

      {/* Section 2: Monument Gallery */}
      <div
        ref={(el) => { sectionRefs.current[1] = el; }}
        className="min-h-screen py-20 px-6 bg-dark-900"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold text-white mb-4">
              Explore India's Heritage
            </h2>
            <p className="text-dark-300 text-lg max-w-2xl mx-auto">
              Choose a monument to explore in immersive 360° panorama or interactive 3D
            </p>
          </div>

          {/* Region Filters */}
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {monumentRegions.map((region) => {
              const Icon = regionIcons[region.id];
              return (
                <button
                  key={region.id}
                  onClick={() => setRegionFilter(region.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    regionFilter === region.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{region.label}</span>
                </button>
              );
            })}
          </div>

          {/* Category Filters */}
          <div className="flex justify-center gap-2 mb-12 flex-wrap">
            {monumentCategories.map((category) => {
              const Icon = categoryIcons[category.id];
              return (
                <button
                  key={category.id}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={() => setCategoryFilter(category.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    categoryFilter === category.id
                      ? 'bg-amber-500 text-white'
                      : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{category.label}</span>
                </button>
              );
            })}
          </div>

          {/* Monument Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMonuments.map((monument) => (
              <MonumentCard
                key={monument.id}
                monument={monument}
                onView360={() => handleView360(monument)}
                onView3D={() => handleView3D(monument)}
              />
            ))}
          </div>

          {filteredMonuments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-dark-400 text-lg">No monuments found with selected filters.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setRegionFilter('all'); setCategoryFilter('all' as any); }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <p className="text-dark-400 mb-4">Want a guided experience?</p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartTour}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Virtual Tour
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Viewers (Modal Overlays) */}
      <AnimatePresence>
        {currentMode === 'panorama' && selectedMonument && (
          <Panorama360Viewer monument={selectedMonument} onClose={handleCloseViewer} />
        )}

        {currentMode === '3d' && selectedMonument && (
          <Model3DViewer monument={selectedMonument} onClose={handleCloseViewer} />
        )}

        {currentMode === 'tour' && (
          <VirtualTour onClose={handleCloseViewer} />
        )}
      </AnimatePresence>
    </div>
  );
}
