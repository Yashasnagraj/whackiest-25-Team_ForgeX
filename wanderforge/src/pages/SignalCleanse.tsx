import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import {
  MessageSquare,
  Sparkles,
  Calendar,
  DollarSign,
  MapPin,
  Users,
  CheckCircle,
  HelpCircle,
  ArrowLeft,
  Zap,
  Cpu,
  AlertCircle,
  Upload,
  Download,
  FileText,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useSignalCleanse } from '../hooks/useSignalCleanse';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Section configuration with Unsplash images
const sections = [
  {
    id: 'hero',
    title: 'From Chaos to Clarity',
    subtitle: 'AI filters 500 chaotic messages into 5 clear action items',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1920&q=80',
    gradient: 'from-cyan-500 to-blue-600',
    icon: MessageSquare,
  },
  {
    id: 'export',
    title: 'Export Your Chat',
    subtitle: 'Quick guide to export WhatsApp conversations',
    image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1920&q=80',
    gradient: 'from-green-500 to-emerald-600',
    icon: Download,
  },
  {
    id: 'paste',
    title: 'Paste Your Messages',
    subtitle: 'Drop your exported chat here',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1920&q=80',
    gradient: 'from-blue-500 to-indigo-600',
    icon: FileText,
  },
  {
    id: 'extract',
    title: 'AI Extracts the Signal',
    subtitle: 'Watch chaos become clarity',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
    gradient: 'from-purple-500 to-pink-600',
    icon: Sparkles,
  },
  {
    id: 'results',
    title: 'Your Trip Summary',
    subtitle: 'Dates, budget, places, and tasks extracted',
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1920&q=80',
    gradient: 'from-emerald-500 to-teal-600',
    icon: CheckCircle,
  },
];

// Sample chaotic chat for demo
const sampleChat = `Yashas: Guys hampi trip pakka na? 🎉
Naveen: Yesss been waiting!!!
Jeeth: Same 😍😍
Shrajan: Dates fix madi
Yashas: December 15-18?
Naveen: 14th night I reach actually
Jeeth: works for me
*Naveen sent a meme*
*Shrajan sent a meme*
Yashas: 😂😂😂
Naveen: Budget discuss madi
Yashas: 15k per head max?
Jeeth: Can do 12-15k
Shrajan: 15k is fine
*Jeeth sent a GIF*
Naveen: Found this hostel - Gowri Resort ₹2k/night
Yashas: Looks good! 4 beds?
Naveen: Ya 4 bed dorm
Shrajan: Book it
Yashas: I'll book train tickets tomorrow
*Naveen sent a meme*
Jeeth: 😂😂😂😂
Yashas: Focus guys 😅
Jeeth: What all places?
Shrajan: Hampi ruins obviously
Yashas: Virupaksha temple
Naveen: Lotus mahal
Jeeth: Hippie island!!
Shrajan: Tungabhadra dam?
Naveen: Maybe if time
*Yashas sent a meme*
Jeeth: 🤣🤣
Shrajan: Train or bus?
Yashas: Train - overnight = saves hotel
Naveen: Smart 👍
Jeeth: I'll make packing list
Shrajan: I'll research guides
Yashas: Rent bikes there for local travel
Naveen: Ya that's cheapest
*12 memes exchanged*
Jeeth: Morning temple visits better - less hot
Yashas: True, afternoon = 40 degrees
Naveen: Guide needed for ruins?
Shrajan: Researching...
Jeeth: Veg or non-veg restaurants?
Yashas: Both options keep
*GIF*
Shrajan: Coracle ride costs ₹500 - worth it?
Naveen: Looks fun but expensive
*More memes*`;

interface FloatingMessage {
  id: number;
  text: string;
  x: number;
  y: number;
  isMeme: boolean;
}

// WhatsApp Watermark Component
function WhatsAppWatermark() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <svg
        viewBox="0 0 175.216 175.552"
        className="w-[600px] h-[600px] text-white/[0.03]"
        fill="currentColor"
      >
        <path d="M87.882 14.185c-40.453 0-73.368 32.916-73.368 73.368 0 12.932 3.366 25.466 9.754 36.531L14.185 161.367l38.39-10.069c10.552 5.748 22.439 8.774 34.507 8.774h.033c40.419 0 73.335-32.916 73.335-73.368.016-19.594-7.617-38.022-21.5-51.889-13.883-13.867-32.327-21.497-51.905-21.497l-.163-.133zm-.033 134.464h-.033c-11.006 0-21.797-2.959-31.213-8.543l-2.24-1.329-23.204 6.084 6.193-22.621-1.461-2.323c-6.133-9.747-9.372-21.014-9.372-32.582 0-33.743 27.461-61.204 61.237-61.204 16.352 0 31.729 6.37 43.292 17.933 11.563 11.564 17.934 26.94 17.934 43.292-.017 33.76-27.478 61.293-61.133 61.293z"/>
        <path d="M120.625 98.522c-1.811-.906-10.707-5.283-12.369-5.888-1.662-.605-2.869-.906-4.075.906-1.211 1.811-4.677 5.888-5.732 7.1-1.055 1.211-2.11 1.361-3.921.453-1.811-.906-7.642-2.817-14.559-8.983-5.382-4.8-9.013-10.729-10.068-12.54-.89-1.538-.089-2.427.753-3.233.755-.755 1.778-1.961 2.668-2.933.889-.972 1.178-1.661 1.767-2.767.589-1.106.295-2.078-.147-2.917-.442-.839-4.075-9.813-5.586-13.44-1.406-3.327-2.835-2.884-4.125-2.917-1.289-.033-2.517-.033-3.844-.033-1.328 0-3.481.498-5.308 2.476-1.828 1.978-6.984 6.829-6.984 16.656 0 9.828 7.15 19.323 8.15 20.661 1 1.339 14.1 21.525 34.15 30.187 4.767 2.061 8.483 3.294 11.383 4.217 4.783 1.522 9.139 1.306 12.583.792 3.839-.574 11.817-4.833 13.483-9.5 1.667-4.667 1.667-8.667 1.167-9.5-.5-.833-1.833-1.333-3.833-2.333z"/>
      </svg>
    </div>
  );
}

// Export Step Component
interface ExportStepProps {
  step: number;
  title: string;
  description: string;
  icon: string;
  delay?: number;
}

function ExportStep({ step, title, description, icon, delay = 0 }: ExportStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="glass-card p-6 text-center group hover:border-green-500/30 transition-all duration-300"
    >
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl">
        {icon}
      </div>
      <div className="w-8 h-8 mx-auto mb-3 rounded-full bg-dark-800 border border-dark-600 flex items-center justify-center">
        <span className="text-white font-bold text-sm">{step}</span>
      </div>
      <h4 className="text-lg font-display font-semibold text-white mb-2">{title}</h4>
      <p className="text-dark-400 text-sm">{description}</p>
    </motion.div>
  );
}

// Signal Section Component with Parallax
interface SignalSectionProps {
  section: typeof sections[0];
  index: number;
  children: React.ReactNode;
  showScrollHint?: boolean;
}

const SignalSection = React.forwardRef<HTMLDivElement, SignalSectionProps>(
  ({ section, index, children, showScrollHint = true }, ref) => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
      const sectionEl = sectionRef.current;
      const bg = bgRef.current;
      const content = contentRef.current;

      if (!sectionEl || !bg || !content) return;

      const ctx = gsap.context(() => {
        // Parallax effect for background
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

        // Content fade in
        gsap.from(content.children, {
          y: 60,
          opacity: 0,
          stagger: 0.15,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        });
      }, sectionRef);

      return () => ctx.revert();
    }, []);

    const SectionIcon = section.icon;

    return (
      <div
        ref={(el) => {
          sectionRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
        }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        data-section={section.id}
      >
        {/* Parallax Background */}
        <div
          ref={bgRef}
          className="absolute inset-0 scale-125"
          style={{
            backgroundImage: `url(${section.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-b ${section.gradient} opacity-60`} />
        <div className="absolute inset-0 bg-dark-900/50" />

        {/* Content */}
        <div ref={contentRef} className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20">
          {/* Section Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              viewport={{ once: true }}
              className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${section.gradient} p-0.5`}
            >
              <div className="w-full h-full rounded-2xl bg-dark-900/80 flex items-center justify-center">
                <SectionIcon className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              {section.title}
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              {section.subtitle}
            </p>
          </div>

          {/* Section Content */}
          {children}
        </div>

        {/* Scroll Hint */}
        {showScrollHint && index < sections.length - 1 && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-8 h-8" />
          </motion.div>
        )}
      </div>
    );
  }
);

SignalSection.displayName = 'SignalSection';

// Progress Dots Component
interface ProgressDotsProps {
  currentSection: number;
  totalSections: number;
  onDotClick: (index: number) => void;
}

function ProgressDots({ currentSection, totalSections, onDotClick }: ProgressDotsProps) {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
      {Array.from({ length: totalSections }).map((_, i) => (
        <button
          key={i}
          onClick={() => onDotClick(i)}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            i === currentSection
              ? 'bg-white scale-125'
              : 'bg-white/30 hover:bg-white/50'
          }`}
          aria-label={`Go to section ${i + 1}`}
        />
      ))}
    </div>
  );
}

export default function SignalCleanse() {
  const navigate = useNavigate();
  const {
    chatInput,
    setChatInput,
    isProcessing,
    processingStage,
    processingProgress,
    extractionResult,
    activeProvider,
    fallbacksUsed,
    processChat,
    reset,
  } = useSignalCleanse();

  const [floatingMessages, setFloatingMessages] = useState<FloatingMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const showResults = extractionResult !== null && !isProcessing;

  // Track current section on scroll
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

  // Scroll to section
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

  // Create floating messages for chaos visualization
  useEffect(() => {
    if (chatInput && !isProcessing && !showResults) {
      const messages = chatInput.split('\n').filter(m => m.trim()).slice(0, 30);
      const floating = messages.map((text, i) => ({
        id: i,
        text: text.substring(0, 50),
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        isMeme: text.includes('meme') || text.includes('GIF') || text.includes('😂'),
      }));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFloatingMessages(floating);
    }
  }, [chatInput, isProcessing, showResults]);

  const handleProcess = async () => {
    setError(null);
    const result = await processChat(chatInput);
    if (!result) {
      setError('Failed to process chat. Please check your API key or try again.');
    } else {
      // Scroll to results section
      setTimeout(() => scrollToSection(4), 500);
    }
  };

  const handleLoadSample = () => {
    setChatInput(sampleChat);
    setError(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt') && !file.name.endsWith('.chat')) {
      setError('Please upload a .txt or .chat file');
      return;
    }

    if (file.size > 1024 * 1024) {
      setError('File too large. Maximum size is 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setChatInput(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    reset();
    setFloatingMessages([]);
    setError(null);
    scrollToSection(0);
  };

  const getProviderDisplayName = (provider: string | null) => {
    switch (provider) {
      case 'openrouter': return 'Grok AI';
      case 'groq': return 'Groq Llama';
      case 'huggingface': return 'HuggingFace';
      case 'offline': return 'Offline Heuristics';
      default: return 'AI';
    }
  };

  // Calculate visible sections based on state
  const visibleSections = showResults ? sections : sections.slice(0, 4);

  return (
    <div className="bg-dark-900">
      {/* Navigation - Transparent with blur */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/30 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-white">Signal-Cleanse</h1>
                  <p className="text-dark-400 text-sm">Extract decisions from chaos</p>
                </div>
              </div>
            </div>
            {activeProvider && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800/50 border border-dark-700/50">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-dark-300 text-sm">
                  Powered by <span className="text-cyan-400">{getProviderDisplayName(activeProvider)}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Progress Dots */}
      <ProgressDots
        currentSection={currentSection}
        totalSections={visibleSections.length}
        onDotClick={scrollToSection}
      />

      {/* Section 1: Hero */}
      <SignalSection
        ref={(el) => { sectionRefs.current[0] = el; }}
        section={sections[0]}
        index={0}
      >
        <WhatsAppWatermark />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="glass-card p-6 text-center"
          >
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-xl font-display font-semibold text-white mb-2">500+ Messages</h3>
            <p className="text-dark-400">Drowning in group chat chaos</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
            className="glass-card p-6 text-center"
          >
            <div className="text-4xl mb-3">🧠</div>
            <h3 className="text-xl font-display font-semibold text-white mb-2">AI Processing</h3>
            <p className="text-dark-400">Smart extraction in seconds</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            viewport={{ once: true }}
            className="glass-card p-6 text-center"
          >
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-xl font-display font-semibold text-white mb-2">5 Action Items</h3>
            <p className="text-dark-400">Clear decisions extracted</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => scrollToSection(1)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </SignalSection>

      {/* Section 2: Export Instructions */}
      <SignalSection
        ref={(el) => { sectionRefs.current[1] = el; }}
        section={sections[1]}
        index={1}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ExportStep
            step={1}
            title="Open WhatsApp Chat"
            description="Go to the group chat you want to analyze"
            icon="📱"
            delay={0.1}
          />
          <ExportStep
            step={2}
            title="Tap Menu → Export"
            description="Select 'Export Chat' from the menu options"
            icon="📤"
            delay={0.2}
          />
          <ExportStep
            step={3}
            title="Choose Without Media"
            description="Select 'Without Media' for faster processing"
            icon="📄"
            delay={0.3}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-white/70 mb-6">Already have your chat exported?</p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => scrollToSection(2)}
            className="bg-gradient-to-r from-green-500 to-emerald-600"
          >
            Continue to Paste
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </SignalSection>

      {/* Section 3: Paste/Upload */}
      <SignalSection
        ref={(el) => { sectionRefs.current[2] = el; }}
        section={sections[2]}
        index={2}
      >
        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold text-white">
                Paste Your Group Chat
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.chat"
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<Upload className="w-4 h-4" />}
                  iconPosition="left"
                >
                  Upload File
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLoadSample}>
                  Load Sample
                </Button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Paste your WhatsApp/Telegram chat export here..."
                className="w-full h-64 bg-dark-800/50 border border-dark-700 rounded-xl text-dark-200 p-4 resize-none focus:outline-none focus:border-blue-500/50 font-mono text-sm"
              />
              {!chatInput && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-dark-800/30 transition-colors rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-dark-500 mb-3" />
                  <p className="text-dark-400 text-sm">Click to upload or drag & drop</p>
                  <p className="text-dark-500 text-xs mt-1">.txt or .chat files</p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 mt-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {chatInput && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
              >
                <p className="text-blue-400 text-sm">
                  {chatInput.split('\n').filter(m => m.trim()).length} messages detected
                </p>
              </motion.div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: chatInput ? 1 : 0.3 }}
            className="text-center mt-8"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                scrollToSection(3);
                if (chatInput) {
                  setTimeout(() => handleProcess(), 500);
                }
              }}
              disabled={!chatInput.trim()}
              className="bg-gradient-to-r from-blue-500 to-indigo-600"
            >
              Extract Signal
              <Zap className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </SignalSection>

      {/* Section 4: Extraction/Processing */}
      <SignalSection
        ref={(el) => { sectionRefs.current[3] = el; }}
        section={sections[3]}
        index={3}
        showScrollHint={!isProcessing && !showResults}
      >
        <div className="max-w-2xl mx-auto">
          {isProcessing ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8"
            >
              {/* Processing Animation */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <motion.div
                    className="w-32 h-32 rounded-full border-4 border-purple-500/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.div
                    className="absolute inset-2 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-purple-400" />
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-dark-300">{processingStage}</span>
                  <span className="text-purple-400 font-mono">{processingProgress}%</span>
                </div>
                <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${processingProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Floating Messages Converging */}
              <div className="relative h-48 overflow-hidden rounded-xl bg-dark-800/30">
                <AnimatePresence>
                  {floatingMessages.slice(0, 15).map((msg) => (
                    <motion.div
                      key={msg.id}
                      className={`absolute px-3 py-2 rounded-lg text-xs max-w-[180px] truncate ${
                        msg.isMeme
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}
                      initial={{
                        x: `${msg.x}%`,
                        y: `${msg.y}%`,
                        opacity: 0.8,
                        scale: 1
                      }}
                      animate={{
                        x: '50%',
                        y: '50%',
                        opacity: 0,
                        scale: 0,
                      }}
                      transition={{
                        duration: 2,
                        delay: msg.id * 0.1,
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                    >
                      {msg.text}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {fallbacksUsed.length > 0 && (
                <p className="text-dark-400 text-xs text-center mt-4">
                  Fallbacks used: {fallbacksUsed.map(p => getProviderDisplayName(p)).join(' → ')}
                </p>
              )}
            </motion.div>
          ) : !showResults ? (
            <div className="text-center">
              <div className="glass-card p-8 inline-block mb-8">
                <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <p className="text-dark-300">Paste your chat in the previous section to start extraction</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => scrollToSection(2)}
              >
                Go Back to Paste
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="glass-card p-8 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-2xl font-display font-bold text-white mb-2">
                  Extraction Complete!
                </h3>
                <p className="text-dark-300 mb-6">
                  {extractionResult.stats.totalMessages} messages → {extractionResult.stats.extractedItems || 0} actionable items
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => scrollToSection(4)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600"
                >
                  View Results
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </SignalSection>

      {/* Section 5: Results (Only shown when extraction is complete) */}
      {showResults && (
        <SignalSection
          ref={(el) => { sectionRefs.current[4] = el; }}
          section={sections[4]}
          index={4}
          showScrollHint={false}
        >
          <div className="space-y-8">
            {/* Stats Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white">
                      Chaos Cleansed!
                    </h2>
                    <p className="text-dark-300">
                      {extractionResult.stats.totalMessages} messages → {extractionResult.stats.extractedItems || 0} actionable items
                    </p>
                  </div>
                </div>
                <div className="flex gap-8">
                  <div className="text-center">
                    <p className="text-3xl font-display font-bold text-emerald-400">{extractionResult.stats.totalMessages}</p>
                    <p className="text-dark-400 text-sm">Total Messages</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-display font-bold text-pink-400">{extractionResult.stats.mediaFiltered}</p>
                    <p className="text-dark-400 text-sm">Memes Filtered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-display font-bold text-teal-400">{extractionResult.stats.extractedItems || 0}</p>
                    <p className="text-dark-400 text-sm">Items Extracted</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dates */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-white">Dates</h3>
                </div>
                <div className="space-y-3">
                  {extractionResult.dates.length > 0 ? (
                    extractionResult.dates.map((d, i) => (
                      <div key={i} className="p-3 rounded-lg bg-dark-800/50">
                        <p className="text-white font-medium">{d.date}</p>
                        <p className="text-dark-400 text-sm mt-1">{d.context}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-dark-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-500 rounded-full"
                              style={{ width: `${d.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-dark-400">{d.confidence}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-dark-400 text-sm">No dates detected</p>
                  )}
                </div>
              </motion.div>

              {/* Budget */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-white">Budget</h3>
                </div>
                {extractionResult.budget ? (
                  <>
                    <div className="text-3xl font-display font-bold text-white mb-4">
                      {extractionResult.budget.total}
                      {extractionResult.budget.perPerson && (
                        <span className="text-lg text-dark-400 font-normal"> per person</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {extractionResult.budget.breakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-dark-800/50">
                          <div>
                            <p className="text-dark-200">{item.item}</p>
                            {item.notes && <p className="text-dark-500 text-xs">{item.notes}</p>}
                          </div>
                          <p className="text-emerald-400 font-mono">{item.amount}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-dark-400 text-sm">No budget information detected</p>
                )}
              </motion.div>

              {/* Places */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-white">Places</h3>
                </div>
                <div className="space-y-2">
                  {extractionResult.places.length > 0 ? (
                    extractionResult.places.map((place, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-dark-800/50">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            place.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} />
                          <div>
                            <p className="text-dark-200">{place.name}</p>
                            {place.type && (
                              <p className="text-dark-500 text-xs capitalize">{place.type}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {place.votes > 0 && (
                            <div className="flex items-center gap-1 text-dark-400 text-sm">
                              <Users className="w-3 h-3" />
                              {place.votes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-dark-400 text-sm">No places detected</p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Tasks & Decisions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tasks */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-white">Tasks Extracted</h3>
                </div>
                <div className="space-y-3">
                  {extractionResult.tasks.length > 0 ? (
                    extractionResult.tasks.map((task, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            task.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                            task.status === 'in-progress' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-dark-600 text-dark-300'
                          }`}>
                            {task.assignee?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-dark-200">{task.task}</p>
                            <p className="text-dark-500 text-xs">
                              {task.assignee || 'Unassigned'}
                              {task.deadline && ` • Due: ${task.deadline}`}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          task.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                          task.status === 'in-progress' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-dark-600 text-dark-300'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-dark-400 text-sm">No tasks detected</p>
                  )}
                </div>
              </motion.div>

              {/* Decisions & Open Questions */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  viewport={{ once: true }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-teal-400" />
                    </div>
                    <h3 className="text-lg font-display font-semibold text-white">Decisions Made</h3>
                  </div>
                  <div className="space-y-2">
                    {extractionResult.decisions.length > 0 ? (
                      extractionResult.decisions.map((d, i) => (
                        <div key={i} className="flex items-start gap-3 p-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-dark-200">{d.decision}</p>
                            {d.madeBy && (
                              <p className="text-dark-500 text-xs">by {d.madeBy}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-dark-400 text-sm">No decisions detected</p>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  viewport={{ once: true }}
                  className="glass-card p-6 border-amber-500/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-display font-semibold text-white">Still Undecided</h3>
                  </div>
                  <div className="space-y-2">
                    {extractionResult.openQuestions.length > 0 ? (
                      extractionResult.openQuestions.map((q, i) => (
                        <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-amber-500/5">
                          <span className="text-amber-400">?</span>
                          <p className="text-dark-300">{q.question}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-dark-400 text-sm">All questions resolved!</p>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              viewport={{ once: true }}
              className="flex justify-center gap-4 pt-8"
            >
              <Button variant="ghost" size="lg" onClick={handleReset}>
                Process Another Chat
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/itinerary')}
                className="bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                Generate Itinerary from This
              </Button>
            </motion.div>
          </div>
        </SignalSection>
      )}
    </div>
  );
}
