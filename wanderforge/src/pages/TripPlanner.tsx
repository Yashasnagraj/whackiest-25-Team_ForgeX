// ============================================================
// TRIP PLANNER - Befesti.nl Inspired Step-by-Step Flow
// Full-screen sections with parallax backgrounds
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import {
  ArrowLeft,
  Map,
  Sparkles,
  AlertCircle,
  Calendar,
  MapPin,
  Wallet,
  Heart,
  Navigation,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Shield,
  Check,
  Trash2,
  Clock,
} from 'lucide-react';
import Button from '../components/ui/Button';
import {
  RegionInput,
  DateRangePicker,
  BudgetSlider,
  InterestSelector,
  PlaceSearchBox,
  SelectedPlacesList,
  AISuggestionChips,
  RecommendationPanel,
} from '../components/trip-planner';
import { useTripPlannerStore } from '../stores/trip-planner.store';
import { TRAVEL_MODE_CONFIG } from '../services/itinerary/direct-input.types';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Step configuration with Unsplash images
const steps = [
  {
    id: 'destination',
    title: 'Where do you want to go?',
    subtitle: 'Enter your dream destination',
    icon: MapPin,
    image: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=1920&q=80',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'dates',
    title: 'When are you traveling?',
    subtitle: 'Pick your travel dates',
    icon: Calendar,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    id: 'budget',
    title: "What's your budget?",
    subtitle: 'Set your spending limit',
    icon: Wallet,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&q=80',
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    id: 'interests',
    title: 'What are you into?',
    subtitle: 'Select your travel interests',
    icon: Heart,
    image: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1920&q=80',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'places',
    title: 'Must-visit spots?',
    subtitle: 'Add places you want to explore',
    icon: Navigation,
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1920&q=80',
    gradient: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'generate',
    title: 'Ready to explore?',
    subtitle: 'Review and generate your itinerary',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80',
    gradient: 'from-journey-solution to-journey-memory',
  },
];

// ==================== ABSOLUTELY UNHINGED LOADING MESSAGES ====================
const funnyLoadingMessages = [
  { text: "PANIK! Where's my passport?!", emoji: "😱🔥" },
  { text: "Arguing with Google Maps... again", emoji: "🗣️📍💢" },
  { text: "Bank account left the chat", emoji: "💸🚪🏃" },
  { text: "Mom calling to ask if you packed underwear", emoji: "👩📞😤" },
  { text: "Finding spots your ex hasn't been to", emoji: "🕵️💔✅" },
  { text: "Calculating how many samosas = 1 meal", emoji: "🥟🧮♾️" },
  { text: "Your budget said 'LOL nice try'", emoji: "💰😂🪦" },
  { text: "GPS: 'Make a U-turn' YOU: 'NO'", emoji: "🗺️😤🚗" },
  { text: "Manifesting flight upgrades...", emoji: "✨🙏✈️" },
  { text: "Practicing 'I'm not a tourist' face", emoji: "😎🧢🤥" },
  { text: "Wallet crying in the corner", emoji: "👛😭💧" },
  { text: "Convincing yourself this is 'self-care'", emoji: "🧘💸🤡" },
  { text: "Finding WiFi stronger than your will to budget", emoji: "📶💪😅" },
  { text: "Auto driver entered the chat: '₹500 only'", emoji: "🛺💰🙃" },
  { text: "Sunscreen? In this economy?!", emoji: "☀️💸😅" },
  { text: "Calculating chai breaks per kilometer", emoji: "☕📏🧮" },
  { text: "Your sleep schedule left the group", emoji: "😴👋🌙" },
  { text: "Instagram captions loading... (will take 3 hrs)", emoji: "📸✍️😵" },
  { text: "Finding vegetarian options... FOUND 500!", emoji: "🥬🎉🇮🇳" },
  { text: "Stomach practicing for street food marathon", emoji: "🏃🍜🔥" },
  { text: "Relatives asking 'Shaadi kab?' in 3... 2...", emoji: "👨‍👩‍👧💍🏃" },
  { text: "Downloading offline maps... trust issues", emoji: "📱🗺️😰" },
  { text: "Your comfort zone is SHAKING rn", emoji: "😨🫨✨" },
  { text: "Packing 47 outfits for 3 days... normal", emoji: "👗👔🧳💥" },
  { text: "AC vs Window seat debate: ONGOING", emoji: "❄️🪟⚔️" },
];

const funnyFacts = [
  "Plot twist: The 'shortcut' adds 2 hours 💀",
  "Your diet starts after THIS trip... pinky promise 🤞🍕",
  "Auto driver: 'Meter kharab hai bhaiya' 🛺📉",
  "You WILL buy something you don't need. Accept it. 🛍️",
  "Hotel checkout is at 11am. You'll wake up at 10:58 😴⏰",
  "That 'quick bathroom break' = 45 minutes 🚻📱",
  "You packed 3 books. You'll read 0. 📚🙃",
  "The best photo spot has 47 people waiting 📸😤",
  "'Just one more temple' - said 7 temples ago 🛕🏃",
  "Your phone will die at the WORST moment 📱💀",
  "You'll miss your train by exactly 2 minutes 🚂😭",
  "Street food at 2am hits DIFFERENT 🍜✨🌙",
];

// Step Section Component with Parallax
const StepSection = React.forwardRef<HTMLDivElement, {
  step: typeof steps[0];
  index: number;
  children: React.ReactNode;
  isComplete: boolean;
}>(({ step, index, children, isComplete }, ref) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Combine refs
  React.useImperativeHandle(ref, () => sectionRef.current as HTMLDivElement);

  useEffect(() => {
    const section = sectionRef.current;
    const bg = bgRef.current;
    const content = contentRef.current;

    if (!section || !bg || !content) return;

    const ctx = gsap.context(() => {
      // Parallax background movement
      gsap.to(bg, {
        yPercent: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Content fade in
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
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      id={`step-${step.id}`}
    >
      {/* Parallax Background */}
      <div
        ref={bgRef}
        className="absolute inset-0 scale-125 bg-cover bg-center"
        style={{ backgroundImage: `url('${step.image}')` }}
      />

      {/* Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient}`} style={{ opacity: 0.4 }} />
      <div className="absolute inset-0 bg-dark-900" style={{ opacity: 0.6 }} />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-dark-900/30" />

      {/* Step Number */}
      <div className="absolute top-8 left-8 md:top-12 md:left-12">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white font-bold text-lg border-2 border-white`}>
          {isComplete ? <Check className="w-6 h-6" /> : index + 1}
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 w-full max-w-2xl mx-auto px-6 py-20">
        {/* Icon */}
        <div className="animate-in flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center border-2 border-white shadow-2xl`}>
            <step.icon className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="animate-in text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white text-center mb-4">
          {step.title}
        </h2>

        {/* Subtitle */}
        <p className="animate-in text-xl text-gray-300 text-center mb-10">
          {step.subtitle}
        </p>

        {/* Step Content */}
        <div className="animate-in">
          {children}
        </div>

        {/* Scroll hint (except last step) */}
        {index < steps.length - 1 && (
          <motion.div
            className="animate-in mt-12 flex flex-col items-center text-gray-400"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="text-sm mb-2">Press Enter or scroll</span>
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        )}
      </div>
    </section>
  );
});

StepSection.displayName = 'StepSection';

// Progress Dots Component
function ProgressDots({ currentStep, totalSteps, onStepClick }: { currentStep: number; totalSteps: number; onStepClick: (index: number) => void }) {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <button
          key={i}
          onClick={() => onStepClick(i)}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            i === currentStep
              ? 'bg-white scale-125'
              : i < currentStep
              ? 'bg-journey-solution'
              : 'bg-gray-600 hover:bg-gray-500'
          }`}
          aria-label={`Go to step ${i + 1}`}
        />
      ))}
    </div>
  );
}

export default function TripPlanner() {
  const navigate = useNavigate();
  const store = useTripPlannerStore();
  const [currentStep, setCurrentStep] = useState(0);

  // Hilarious loading state
  const [funnyMessageIndex, setFunnyMessageIndex] = useState(0);
  const [funnyFactIndex, setFunnyFactIndex] = useState(0);

  // Rotate funny messages every 2.5 seconds during generation
  useEffect(() => {
    if (store.stage !== 'generating') return;

    const messageInterval = setInterval(() => {
      setFunnyMessageIndex((prev) => (prev + 1) % funnyLoadingMessages.length);
    }, 2500);

    const factInterval = setInterval(() => {
      setFunnyFactIndex((prev) => (prev + 1) % funnyFacts.length);
    }, 5000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(factInterval);
    };
  }, [store.stage]);

  // Refs for each section
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Get specific values for dependency tracking
  const region = useTripPlannerStore((state) => state.region);
  const interests = useTripPlannerStore((state) => state.interests);
  const loadPopularPlaces = useTripPlannerStore((state) => state.loadPopularPlaces);

  // Load popular places when region changes
  useEffect(() => {
    if (region && region.length >= 3) {
      loadPopularPlaces();
    }
  }, [region, interests, loadPopularPlaces]);

  // Scroll to step function
  const scrollToStep = (index: number) => {
    const section = sectionRefs.current[index];
    if (section) {
      gsap.to(window, {
        scrollTo: { y: section, offsetY: 0 },
        duration: 1,
        ease: 'power2.inOut',
      });
      setCurrentStep(index);
    }
  };

  // Handle Enter key to advance
  const _handleKeyDown = (stepIndex: number, isValid: boolean) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && stepIndex < steps.length - 1) {
      e.preventDefault();
      scrollToStep(stepIndex + 1);
    }
  };

  // Update current step based on scroll position
  useEffect(() => {
    if (store.stage !== 'planning') return;

    const handleScroll = () => {
      const _scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      sectionRefs.current.forEach((section, index) => {
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= windowHeight / 2 && rect.bottom >= windowHeight / 2) {
            setCurrentStep(index);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [store.stage]);

  // Step validation
  const isStepComplete = (index: number): boolean => {
    switch (index) {
      case 0: return !!store.region && store.region.length >= 3;
      case 1: return !!store.startDate && !!store.endDate;
      case 2: return true; // Budget always has default
      case 3: return store.interests.length > 0;
      case 4: return store.selectedPlaces.length > 0;
      default: return false;
    }
  };

  // Can generate
  const canGenerate =
    store.region &&
    store.startDate &&
    store.endDate &&
    store.selectedPlaces.length > 0;

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-dark-900/80 backdrop-blur-xl z-50 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-white">Trip Planner</h1>
                  <p className="text-gray-400 text-sm">AI-powered itinerary</p>
                </div>
              </div>
            </div>

            {store.stage !== 'planning' && (
              <Button variant="ghost" size="sm" onClick={store.goToPlanning}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Edit Trip
              </Button>
            )}
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {/* ==================== PLANNING STAGE ==================== */}
        {store.stage === 'planning' && (
          <motion.div
            key="planning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Progress Dots */}
            <ProgressDots
              currentStep={currentStep}
              totalSteps={steps.length}
              onStepClick={scrollToStep}
            />

            {/* Step 1: Destination */}
            <StepSection
              step={steps[0]}
              index={0}
              isComplete={isStepComplete(0)}
              ref={(el) => { sectionRefs.current[0] = el; }}
            >
              <RegionInput
                value={store.region}
                suggestions={store.regionSuggestions}
                isLoading={store.isLoadingRegionSuggestions}
                onChange={store.setRegion}
                onSelectSuggestion={(suggestion) => {
                  store.selectRegionSuggestion(suggestion);
                  setTimeout(() => scrollToStep(1), 300);
                }}
                onEnterPress={() => {
                  if (isStepComplete(0)) {
                    scrollToStep(1);
                  }
                }}
              />
            </StepSection>

            {/* Step 2: Dates */}
            <StepSection
              step={steps[1]}
              index={1}
              isComplete={isStepComplete(1)}
              ref={(el) => { sectionRefs.current[1] = el; }}
            >
              <div className="bg-dark-800 rounded-2xl p-6 border border-dark-600">
                <DateRangePicker
                  startDate={store.startDate}
                  endDate={store.endDate}
                  onChange={(start, end) => {
                    store.setDates(start, end);
                    if (start && end) {
                      setTimeout(() => scrollToStep(2), 300);
                    }
                  }}
                />
              </div>
            </StepSection>

            {/* Step 3: Budget */}
            <StepSection
              step={steps[2]}
              index={2}
              isComplete={isStepComplete(2)}
              ref={(el) => { sectionRefs.current[2] = el; }}
            >
              <div className="bg-dark-800 rounded-2xl p-6 border border-dark-600 space-y-6">
                <BudgetSlider
                  budget={store.budget}
                  onChange={store.setBudget}
                />

                {/* Travel Mode */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-3">
                    Trip Pace
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['relaxed', 'moderate', 'packed'] as const).map((mode) => {
                      const config = TRAVEL_MODE_CONFIG[mode];
                      return (
                        <button
                          key={mode}
                          onClick={() => store.setTravelMode(mode)}
                          className={`p-4 rounded-xl text-center transition-all border-2 ${
                            store.travelMode === mode
                              ? 'bg-primary-500 text-white border-primary-400'
                              : 'bg-dark-700 text-gray-300 border-dark-600 hover:border-dark-500'
                          }`}
                        >
                          <span className="block font-medium">{config.label}</span>
                          <span className="block text-xs opacity-70 mt-1">
                            {config.activitiesPerDay}/day
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => scrollToStep(3)}
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </StepSection>

            {/* Step 4: Interests */}
            <StepSection
              step={steps[3]}
              index={3}
              isComplete={isStepComplete(3)}
              ref={(el) => { sectionRefs.current[3] = el; }}
            >
              <div className="bg-dark-800 rounded-2xl p-6 border border-dark-600">
                <InterestSelector
                  selected={store.interests}
                  customInterests={store.customInterests}
                  onToggle={store.toggleInterest}
                  onAddCustom={store.addCustomInterest}
                  onRemoveCustom={store.removeCustomInterest}
                />

                <Button
                  variant="primary"
                  className="w-full mt-6"
                  onClick={() => scrollToStep(4)}
                  disabled={store.interests.length === 0}
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </StepSection>

            {/* Step 5: Places */}
            <StepSection
              step={steps[4]}
              index={4}
              isComplete={isStepComplete(4)}
              ref={(el) => { sectionRefs.current[4] = el; }}
            >
              <div className="bg-dark-800 rounded-2xl p-6 border border-dark-600 space-y-4">
                <PlaceSearchBox
                  query={store.searchQuery}
                  results={store.searchResults}
                  isSearching={store.isSearching}
                  disabled={!store.region}
                  onSearch={store.searchPlaces}
                  onSelectPlace={store.addPlaceFromSuggestion}
                />

                <AISuggestionChips
                  suggestions={store.aiSuggestedPlaces}
                  isLoading={store.isLoadingAISuggestions}
                  onAccept={store.acceptAISuggestion}
                  onDismiss={store.dismissAISuggestion}
                />

                <SelectedPlacesList
                  places={store.selectedPlaces}
                  onRemove={store.removePlace}
                  onToggleMustVisit={store.toggleMustVisit}
                />

                <Button
                  variant="primary"
                  className="w-full mt-4"
                  onClick={() => scrollToStep(5)}
                  disabled={store.selectedPlaces.length === 0}
                >
                  Continue to Summary
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </StepSection>

            {/* Step 6: Generate */}
            <StepSection
              step={steps[5]}
              index={5}
              isComplete={false}
              ref={(el) => { sectionRefs.current[5] = el; }}
            >
              <div className="bg-dark-800 rounded-2xl p-6 border border-dark-600">
                {/* Summary */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-4 bg-dark-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-amber-400" />
                      <span className="text-gray-300">Destination</span>
                    </div>
                    <span className="text-white font-medium">{store.region || 'Not set'}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300">Dates</span>
                    </div>
                    <span className="text-white font-medium">
                      {store.startDate && store.endDate
                        ? `${new Date(store.startDate).toLocaleDateString()} - ${new Date(store.endDate).toLocaleDateString()}`
                        : 'Not set'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-emerald-400" />
                      <span className="text-gray-300">Budget</span>
                    </div>
                    <span className="text-white font-medium">₹{store.budget.amount.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-pink-400" />
                      <span className="text-gray-300">Interests</span>
                    </div>
                    <span className="text-white font-medium">{store.interests.length} selected</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Navigation className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-300">Places</span>
                    </div>
                    <span className="text-white font-medium">{store.selectedPlaces.length} places</span>
                  </div>
                </div>

                {/* Error Message */}
                {store.generationError && (
                  <div className="p-4 bg-red-900/50 border border-red-500 rounded-xl flex items-start gap-3 mb-6">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400">{store.generationError}</p>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={store.generateItinerary}
                  disabled={!canGenerate}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate My Itinerary
                </Button>

                {!canGenerate && (
                  <p className="text-center text-gray-500 text-sm mt-4">
                    {!store.region
                      ? 'Enter a destination to continue'
                      : !store.startDate || !store.endDate
                      ? 'Select your travel dates'
                      : 'Add at least one place to visit'}
                  </p>
                )}
              </div>
            </StepSection>
          </motion.div>
        )}

        {/* ==================== ABSOLUTELY UNHINGED GENERATING STAGE ==================== */}
        {store.stage === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center pt-20 relative overflow-hidden"
          >
            {/* CHAOTIC Background - emojis flying everywhere */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Flying plane across screen */}
              <motion.div
                className="absolute text-5xl"
                initial={{ x: '-10%', y: '20%' }}
                animate={{ x: '110%', y: '15%', rotate: [0, 10, -5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                ✈️
              </motion.div>

              {/* Spinning compass */}
              <motion.div
                className="absolute top-32 left-[15%] text-4xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                🧭
              </motion.div>

              {/* Bouncing money flying away */}
              <motion.div
                className="absolute top-20 right-[20%] text-3xl"
                animate={{
                  y: [0, -30, 0],
                  x: [0, 20, 40, 60],
                  opacity: [1, 0.8, 0.5, 0],
                  scale: [1, 0.9, 0.8, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                💸
              </motion.div>

              {/* Panicking person */}
              <motion.div
                className="absolute bottom-40 left-[10%] text-4xl"
                animate={{
                  rotate: [-10, 10, -10],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 0.3, repeat: Infinity }}
              >
                😱
              </motion.div>

              {/* Exploding suitcase */}
              <motion.div
                className="absolute bottom-32 right-[15%] text-4xl"
                animate={{
                  rotate: [0, -5, 5, -5, 0],
                  scale: [1, 1.2, 1, 1.2, 1]
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                🧳💥
              </motion.div>

              {/* Floating food */}
              <motion.div
                className="absolute top-[45%] left-[8%] text-3xl"
                animate={{ y: [0, -20, 0], rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                🍜
              </motion.div>

              {/* Camera flash */}
              <motion.div
                className="absolute top-[35%] right-[10%] text-3xl"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                📸✨
              </motion.div>

              {/* Auto rickshaw zooming */}
              <motion.div
                className="absolute bottom-24 text-4xl"
                initial={{ x: '110%' }}
                animate={{ x: '-10%' }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              >
                🛺💨
              </motion.div>

              {/* Random floating elements */}
              <motion.div
                className="absolute top-[60%] right-[25%] text-2xl opacity-40"
                animate={{ y: [0, -30, 0], x: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              >
                🗺️
              </motion.div>
              <motion.div
                className="absolute top-[25%] left-[30%] text-2xl opacity-40"
                animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                🎒
              </motion.div>
            </div>

            <div className="text-center max-w-lg px-6 relative z-10">
              {/* ========== ULTIMATE CHAOTIC LOADING SCENE ========== */}
              <div className="mb-8 h-44 flex items-center justify-center relative">

                {/* SCENE: Person trying to close overstuffed suitcase */}
                <div className="relative w-64 h-40">

                  {/* The suitcase - shaking violently */}
                  <motion.div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2"
                    animate={{
                      rotate: [-3, 3, -3, 3, -3],
                      scale: [1, 1.05, 1, 1.08, 1],
                    }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                  >
                    <span className="text-7xl">🧳</span>

                    {/* Suitcase bulging - items trying to escape */}
                    <motion.span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl"
                      animate={{
                        y: [-5, -15, -5],
                        rotate: [0, 20, -20, 0],
                        opacity: [0.8, 1, 0.8],
                      }}
                      transition={{ duration: 0.4, repeat: Infinity }}
                    >
                      👙
                    </motion.span>
                    <motion.span
                      className="absolute -top-1 -left-3 text-xl"
                      animate={{
                        x: [-5, -15, -5],
                        rotate: [0, -30, 0],
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{ duration: 0.35, repeat: Infinity, delay: 0.1 }}
                    >
                      👕
                    </motion.span>
                    <motion.span
                      className="absolute -top-2 -right-4 text-xl"
                      animate={{
                        x: [5, 18, 5],
                        rotate: [0, 45, 0],
                        opacity: [0.6, 1, 0.6],
                      }}
                      transition={{ duration: 0.45, repeat: Infinity, delay: 0.2 }}
                    >
                      🩴
                    </motion.span>
                    <motion.span
                      className="absolute top-0 left-8 text-lg"
                      animate={{
                        y: [-8, -20, -8],
                        x: [0, 5, 0],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
                    >
                      🧴
                    </motion.span>
                  </motion.div>

                  {/* Person JUMPING on suitcase to close it */}
                  <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                    animate={{
                      y: [0, -40, 0, -35, 0, -45, 0],
                      scale: [1, 0.9, 1.1, 0.9, 1.1, 0.85, 1.1],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <motion.span
                      className="text-6xl block"
                      animate={{
                        rotate: [0, -15, 0, 15, 0, -10, 0],
                      }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      🧍
                    </motion.span>
                  </motion.div>

                  {/* Sweat drops flying */}
                  <motion.span
                    className="absolute top-4 right-12 text-2xl"
                    animate={{
                      y: [0, -20],
                      x: [0, 15],
                      opacity: [1, 0],
                      scale: [1, 0.5],
                    }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  >
                    💦
                  </motion.span>
                  <motion.span
                    className="absolute top-8 left-10 text-xl"
                    animate={{
                      y: [0, -25],
                      x: [0, -12],
                      opacity: [1, 0],
                      scale: [1, 0.4],
                    }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
                  >
                    💦
                  </motion.span>
                  <motion.span
                    className="absolute top-2 left-1/2 text-lg"
                    animate={{
                      y: [0, -30],
                      opacity: [1, 0],
                    }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: 0.5 }}
                  >
                    💦
                  </motion.span>

                  {/* Stress symbols */}
                  <motion.span
                    className="absolute top-0 right-8 text-3xl"
                    animate={{
                      scale: [0.8, 1.3, 0.8],
                      rotate: [0, 180, 360],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    💢
                  </motion.span>

                  {/* Stars from struggle */}
                  <motion.span
                    className="absolute top-6 left-6 text-xl"
                    animate={{
                      scale: [0.5, 1.2, 0.5],
                      rotate: [0, 180, 360],
                      opacity: [0, 1, 0],
                    }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  >
                    ⭐
                  </motion.span>
                  <motion.span
                    className="absolute top-10 right-6 text-lg"
                    animate={{
                      scale: [0.4, 1, 0.4],
                      rotate: [360, 180, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: 0.4 }}
                  >
                    ✨
                  </motion.span>

                  {/* Shockwave effect when landing */}
                  <motion.div
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
                    animate={{
                      scaleX: [0.5, 1.5, 0.5],
                      opacity: [0, 0.5, 0],
                    }}
                    transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 0.8 }}
                  />
                </div>
              </div>

              {/* Shaking title */}
              <motion.h2
                className="text-3xl md:text-4xl font-display font-bold text-white mb-4"
                animate={{
                  x: [0, -2, 2, -2, 0],
                }}
                transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
              >
                Creating Your Adventure
                <motion.span
                  className="inline-block ml-2"
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  🔥
                </motion.span>
              </motion.h2>

              {/* Rotating funny messages with dramatic entrance */}
              <div className="h-20 mb-6 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={funnyMessageIndex}
                    initial={{ opacity: 0, y: 30, scale: 0.8, rotate: -5 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, y: -30, scale: 0.8, rotate: 5 }}
                    transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
                    className="text-xl md:text-2xl text-white font-medium"
                  >
                    {funnyLoadingMessages[funnyMessageIndex].text}
                    <motion.span
                      className="ml-2 inline-block"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      {funnyLoadingMessages[funnyMessageIndex].emoji}
                    </motion.span>
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Progress section */}
              {store.generationProgress && (
                <div className="space-y-4 mb-6">
                  {/* Progress stats with attitude */}
                  <div className="flex items-center justify-between text-sm">
                    <motion.span
                      className="text-gray-400"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Stalking <span className="text-primary-400 font-semibold">{store.generationProgress.currentPlace || 'places'}</span> on the internet... 🕵️
                    </motion.span>
                    <span className="text-primary-400 font-bold text-lg">
                      {store.generationProgress.completed}/{store.generationProgress.total}
                    </span>
                  </div>

                  {/* EPIC progress bar */}
                  <div className="relative pt-8">
                    <div className="w-full h-5 bg-dark-700 rounded-full overflow-hidden border border-white/10">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary-500 via-secondary-500 via-accent-cyan to-primary-500 bg-[length:300%_100%]"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(store.generationProgress.completed / store.generationProgress.total) * 100}%`,
                          backgroundPosition: ['0% 0%', '100% 0%'],
                        }}
                        transition={{
                          width: { duration: 0.5 },
                          backgroundPosition: { duration: 1.5, repeat: Infinity, ease: 'linear' },
                        }}
                      />
                    </div>

                    {/* Traveler on progress bar - changes based on progress */}
                    <motion.div
                      className="absolute -top-1 text-3xl"
                      style={{
                        left: `calc(${Math.min((store.generationProgress.completed / store.generationProgress.total) * 100, 95)}% - 15px)`,
                      }}
                      animate={{ y: [0, -8, 0], rotate: [-5, 5, -5] }}
                      transition={{ duration: 0.3, repeat: Infinity }}
                    >
                      {store.generationProgress.completed / store.generationProgress.total < 0.3 ? '🚶' :
                       store.generationProgress.completed / store.generationProgress.total < 0.6 ? '🏃' :
                       store.generationProgress.completed / store.generationProgress.total < 0.9 ? '🏃💨' : '🎉'}
                    </motion.div>

                    {/* Start and end markers */}
                    <span className="absolute left-0 -bottom-6 text-xs text-gray-500">🏠 Start</span>
                    <span className="absolute right-0 -bottom-6 text-xs text-gray-500">🏝️ Vacation!</span>
                  </div>

                  {/* Percentage with celebration */}
                  <motion.p
                    className="text-gray-400 text-sm pt-4"
                    animate={store.generationProgress.completed / store.generationProgress.total > 0.8 ? {
                      scale: [1, 1.1, 1],
                      color: ['#9ca3af', '#00d9ff', '#9ca3af']
                    } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    {Math.round((store.generationProgress.completed / store.generationProgress.total) * 100)}% there...
                    {store.generationProgress.completed / store.generationProgress.total < 0.3 && " we just started bestie 😅"}
                    {store.generationProgress.completed / store.generationProgress.total >= 0.3 && store.generationProgress.completed / store.generationProgress.total < 0.6 && " halfway to paradise! 🌴"}
                    {store.generationProgress.completed / store.generationProgress.total >= 0.6 && store.generationProgress.completed / store.generationProgress.total < 0.9 && " almost there! 🔥"}
                    {store.generationProgress.completed / store.generationProgress.total >= 0.9 && " GET READY! 🎉🎉🎉"}
                  </motion.p>
                </div>
              )}

              {/* Rotating fun facts with style */}
              <motion.div
                className="mt-6 p-4 bg-gradient-to-r from-dark-800/80 to-dark-700/80 rounded-2xl border border-white/10 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <AnimatePresence mode="wait">
                  <motion.p
                    key={funnyFactIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="text-sm text-gray-300"
                  >
                    <motion.span
                      className="inline-block mr-2"
                      animate={{ rotate: [0, 20, -20, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      💡
                    </motion.span>
                    {funnyFacts[funnyFactIndex]}
                  </motion.p>
                </AnimatePresence>
              </motion.div>

              {/* Tiny disclaimer */}
              <motion.p
                className="mt-6 text-xs text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 2 }}
              >
                * No wallets were harmed in the making of this itinerary... yet 💀
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* ==================== RESULT STAGE ==================== */}
        {store.stage === 'result' && store.generatedItinerary && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pt-24 pb-12 px-6"
          >
            <div className="max-w-5xl mx-auto">
              {/* Trip Summary Header */}
              {store.tripSummary && (
                <div className="text-center mb-8">
                  <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-display font-bold text-white mb-2"
                  >
                    {store.tripSummary.title}
                  </motion.h2>
                  <p className="text-primary-400 font-medium mb-2">
                    {store.tripSummary.tagline}
                  </p>
                  <p className="text-gray-400 max-w-2xl mx-auto">
                    {store.tripSummary.summary}
                  </p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: Calendar, label: 'Duration', value: `${store.generatedItinerary.summary.totalDays} days` },
                  { icon: MapPin, label: 'Places', value: `${store.generatedItinerary.summary.placesVisited} places` },
                  { icon: Wallet, label: 'Est. Cost', value: `₹${store.generatedItinerary.summary.totalCost.toLocaleString()}` },
                  { icon: Map, label: 'Distance', value: `${store.generatedItinerary.summary.distanceTraveled.toFixed(1)} km` },
                ].map(({ icon: Icon, label, value }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-dark-800 rounded-2xl p-4 text-center border border-dark-700"
                  >
                    <Icon className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">{label}</p>
                    <p className="text-white font-semibold">{value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Itinerary Days */}
              <div className="space-y-6">
                {store.generatedItinerary.days.map((day, dayIndex) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dayIndex * 0.1 }}
                    className="bg-dark-800 rounded-2xl overflow-hidden border border-dark-700"
                  >
                    <div className="p-4 bg-dark-700 border-b border-dark-600">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display font-semibold text-white">Day {day.day}</h3>
                          <p className="text-gray-400 text-sm">
                            {new Date(day.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{day.activities.filter((a) => a.type === 'visit').length} activities</span>
                          <span>₹{day.totalCost.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {day.activities
                        .filter((a) => a.type === 'visit')
                        .map((activity) => (
                          <div
                            key={activity.id}
                            className="p-3 bg-dark-700 rounded-xl"
                          >
                            <div className="flex items-start gap-4">
                              <div className="text-center min-w-[60px]">
                                <p className="text-primary-400 font-medium">{activity.startTime}</p>
                                <p className="text-gray-500 text-xs">{activity.duration} min</p>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-white">{activity.place.name}</h4>
                                {activity.bestTimeReason && (
                                  <p className="text-gray-400 text-sm mt-0.5">{activity.bestTimeReason}</p>
                                )}
                              </div>
                              {activity.travelFromPrev && (
                                <div className="text-xs text-gray-500 text-right">
                                  <p>{activity.travelFromPrev.distance.toFixed(1)} km</p>
                                  <p>{activity.travelFromPrev.duration} min</p>
                                </div>
                              )}
                            </div>

                            {/* Action Controls */}
                            <div className="mt-3 pt-3 border-t border-dark-600 flex flex-wrap items-center gap-2">
                              {/* Extend Time */}
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span className="text-gray-500 text-xs">Time:</span>
                                {[15, 30, 60].map((mins) => (
                                  <button
                                    key={`add-${mins}`}
                                    onClick={() => store.updateActivityDuration(activity.id, activity.duration + mins)}
                                    className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors"
                                  >
                                    +{mins}m
                                  </button>
                                ))}
                                {[15, 30].map((mins) => (
                                  <button
                                    key={`sub-${mins}`}
                                    onClick={() => store.updateActivityDuration(activity.id, Math.max(15, activity.duration - mins))}
                                    className="px-2 py-0.5 text-xs bg-dark-600 text-gray-400 rounded hover:bg-dark-500 transition-colors"
                                  >
                                    -{mins}m
                                  </button>
                                ))}
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={() => {
                                  if (confirm(`Remove "${activity.place.name}" from itinerary?`)) {
                                    store.removeActivity(activity.id);
                                  }
                                }}
                                className="ml-auto px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Missed Recommendations */}
              <RecommendationPanel
                recommendations={store.missedRecommendations}
                isLoading={store.isLoadingMissedRecommendations}
                onAccept={store.acceptMissedRecommendation}
                onReject={store.rejectMissedRecommendation}
                onRegenerate={store.regenerateWithAccepted}
              />

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button variant="secondary" onClick={() => navigate('/itinerary')}>
                  <Map className="w-4 h-4 mr-2" />
                  View Full Map
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate('/safety')}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Activate Safety
                </Button>
                <Button variant="ghost" onClick={store.goToPlanning}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Plan Another
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
