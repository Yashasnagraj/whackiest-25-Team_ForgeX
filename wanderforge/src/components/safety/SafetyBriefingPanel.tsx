// Safety Briefing Panel - AI-generated safety tips and emergency info
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Heart,
  Car,
  AlertCircle,
  Cloud,
  Users,
  Phone,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  Info,
  Sparkles,
  CheckCircle,
  Copy,
  Check,
} from 'lucide-react';
import Button from '../ui/Button';
import {
  generateSafetyBriefing,
  type TripSafetyBriefing,
  type SafetyTip,
} from '../../services/safety/trip-safety-intel';
import type { Coords } from '../../services/itinerary/types';

interface SafetyBriefingPanelProps {
  destination: string;
  coordinates?: Coords;
  dates?: { start: string; end: string };
}

const TIP_ICONS = {
  general: Shield,
  health: Heart,
  transport: Car,
  scam: AlertTriangle,
  weather: Cloud,
  local: Users,
};

const TIP_COLORS = {
  general: 'text-accent-purple bg-accent-purple/20',
  health: 'text-pink-400 bg-pink-500/20',
  transport: 'text-blue-400 bg-blue-500/20',
  scam: 'text-amber-400 bg-amber-500/20',
  weather: 'text-cyan-400 bg-cyan-500/20',
  local: 'text-green-400 bg-green-500/20',
};

const PRIORITY_BADGES = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const RISK_COLORS = {
  low: 'text-green-400 bg-green-500/20',
  medium: 'text-amber-400 bg-amber-500/20',
  high: 'text-red-400 bg-red-500/20',
};

function TipCard({ tip }: { tip: SafetyTip }) {
  const Icon = TIP_ICONS[tip.category] || Shield;
  const colorClass = TIP_COLORS[tip.category] || TIP_COLORS.general;
  const priorityClass = PRIORITY_BADGES[tip.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg bg-dark-800/50 hover:bg-dark-700/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-white">{tip.title}</h4>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityClass}`}>
              {tip.priority}
            </span>
          </div>
          <p className="text-xs text-dark-400 leading-relaxed">{tip.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function EmergencyNumberCard({
  service,
  number,
  description,
}: {
  service: string;
  number: string;
  description?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
          <Phone className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{service}</p>
          {description && <p className="text-xs text-dark-500">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={`tel:${number}`}
          className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-bold transition-colors"
        >
          {number}
        </a>
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg bg-dark-700/50 hover:bg-dark-600/50 transition-colors"
          title="Copy number"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-dark-400" />
          )}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-dark-700/50 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-dark-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-dark-400" />
          <span className="font-medium text-white">{title}</span>
          {badge}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-dark-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-dark-400" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SafetyBriefingPanel({
  destination,
  coordinates,
  dates,
}: SafetyBriefingPanelProps) {
  const [briefing, setBriefing] = useState<TripSafetyBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate safety briefing
  useEffect(() => {
    async function fetchBriefing() {
      if (!destination) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await generateSafetyBriefing(destination, {
          coordinates,
          dates,
        });
        setBriefing(data);
      } catch (err) {
        setError('Failed to generate safety briefing');
        console.error('[SafetyBriefingPanel] Error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBriefing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, coordinates?.lat, coordinates?.lng]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await generateSafetyBriefing(destination, {
        coordinates,
        dates,
        forceRefresh: true,
      });
      setBriefing(data);
    } catch (_err) {
      setError('Failed to refresh');
    } finally {
      setIsLoading(false);
    }
  };

  if (!destination) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-700/50 bg-gradient-to-r from-accent-purple/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent-purple" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Safety Briefing</h3>
            <p className="text-xs text-dark-400">{destination} • AI-generated</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-dark-700/50 hover:bg-dark-600/50 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-dark-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {isLoading && !briefing ? (
        <div className="p-8 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent-purple animate-spin mb-3" />
          <p className="text-sm text-dark-400">Generating safety briefing...</p>
          <p className="text-xs text-dark-500 mt-1">Using AI to analyze destination safety</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center">
          <p className="text-dark-400 text-sm mb-3">{error}</p>
          <Button variant="secondary" size="sm" onClick={handleRefresh}>
            Try Again
          </Button>
        </div>
      ) : briefing ? (
        <div>
          {/* Risk Summary */}
          <div className="p-4 border-b border-dark-700/50">
            <div className="flex items-center gap-3 mb-3">
              <div className={`px-3 py-1 rounded-full ${RISK_COLORS[briefing.riskLevel]} text-sm font-medium flex items-center gap-2`}>
                {briefing.riskLevel === 'low' && <CheckCircle className="w-4 h-4" />}
                {briefing.riskLevel === 'medium' && <AlertCircle className="w-4 h-4" />}
                {briefing.riskLevel === 'high' && <AlertTriangle className="w-4 h-4" />}
                <span className="capitalize">{briefing.riskLevel} Risk</span>
              </div>
            </div>
            <p className="text-sm text-dark-300 leading-relaxed">{briefing.riskSummary}</p>
          </div>

          {/* Emergency Numbers */}
          <Section
            title="Emergency Numbers"
            icon={Phone}
            defaultOpen={true}
            badge={
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                {briefing.emergencyNumbers.length}
              </span>
            }
          >
            <div className="space-y-2">
              {briefing.emergencyNumbers.map((num, idx) => (
                <EmergencyNumberCard
                  key={idx}
                  service={num.service}
                  number={num.number}
                  description={num.description}
                />
              ))}
            </div>
          </Section>

          {/* Safety Tips */}
          <Section
            title="Safety Tips"
            icon={Shield}
            defaultOpen={true}
            badge={
              <span className="text-xs bg-accent-purple/20 text-accent-purple px-2 py-0.5 rounded">
                {briefing.safetyTips.length}
              </span>
            }
          >
            <div className="space-y-2">
              {briefing.safetyTips.map((tip, idx) => (
                <TipCard key={idx} tip={tip} />
              ))}
            </div>
          </Section>

          {/* Common Scams */}
          {briefing.commonScams.length > 0 && (
            <Section
              title="Common Scams"
              icon={AlertTriangle}
              badge={
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                  {briefing.commonScams.length}
                </span>
              }
            >
              <ul className="space-y-2">
                {briefing.commonScams.map((scam, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-dark-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{scam}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Health Advisories */}
          {briefing.healthAdvisories.length > 0 && (
            <Section
              title="Health Advisories"
              icon={Heart}
              badge={
                <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded">
                  {briefing.healthAdvisories.length}
                </span>
              }
            >
              <ul className="space-y-2">
                {briefing.healthAdvisories.map((advisory, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-dark-300">
                    <Info className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                    <span>{advisory}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Weather */}
          {briefing.weatherConsiderations.length > 0 && (
            <Section
              title="Weather & Climate"
              icon={Cloud}
              badge={
                <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">
                  {briefing.weatherConsiderations.length}
                </span>
              }
            >
              <ul className="space-y-2">
                {briefing.weatherConsiderations.map((weather, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-dark-300">
                    <Cloud className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>{weather}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Footer */}
          <div className="p-3 bg-dark-800/30 border-t border-dark-700/50">
            <p className="text-xs text-dark-500 text-center">
              Generated {briefing.generatedAt.toLocaleString()} • AI-powered safety intelligence
            </p>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
