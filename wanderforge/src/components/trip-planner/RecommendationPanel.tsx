// Recommendation Panel - "You might have missed..." section
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Loader2, RefreshCw, Check } from 'lucide-react';
import type { MissedRecommendation } from '../../services/itinerary/direct-input.types';
import { RecommendationCard } from './RecommendationCard';

interface RecommendationPanelProps {
  recommendations: MissedRecommendation[];
  isLoading: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRegenerate: () => void;
}

export function RecommendationPanel({
  recommendations,
  isLoading,
  onAccept,
  onReject,
  onRegenerate,
}: RecommendationPanelProps) {
  const pendingRecommendations = recommendations.filter((r) => r.status === 'pending');
  const acceptedRecommendations = recommendations.filter((r) => r.status === 'accepted');

  // Don't show if no recommendations and not loading
  if (!isLoading && recommendations.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-white">
              You Might Have Missed...
            </h3>
            <p className="text-dark-400 text-sm">
              AI-powered suggestions based on your interests
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-primary-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Finding recommendations...</span>
          </div>
        )}
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {pendingRecommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onAccept={() => onAccept(rec.id)}
              onReject={() => onReject(rec.id)}
            />
          ))}
        </AnimatePresence>

        {/* Loading skeletons */}
        {isLoading && recommendations.length === 0 && (
          <>
            {[1, 2].map((i) => (
              <div
                key={`skeleton-${i}`}
                className="bg-dark-800 border border-dark-700 rounded-xl p-4 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-dark-700" />
                  <div className="flex-1">
                    <div className="h-5 bg-dark-700 rounded w-32 mb-2" />
                    <div className="h-4 bg-dark-700 rounded w-20" />
                  </div>
                </div>
                <div className="h-16 bg-dark-700 rounded mb-3" />
                <div className="h-10 bg-dark-700 rounded" />
              </div>
            ))}
          </>
        )}
      </div>

      {/* Accepted summary */}
      {acceptedRecommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-emerald-400 font-medium">
                  {acceptedRecommendations.length} place{acceptedRecommendations.length > 1 ? 's' : ''} added
                </p>
                <p className="text-dark-400 text-sm">
                  {acceptedRecommendations.map((r) => r.name).join(', ')}
                </p>
              </div>
            </div>

            <button
              onClick={onRegenerate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600
                         text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Update Itinerary
            </button>
          </div>
        </motion.div>
      )}

      {/* Empty state after all dismissed */}
      {!isLoading && pendingRecommendations.length === 0 && acceptedRecommendations.length === 0 && recommendations.length > 0 && (
        <div className="text-center py-6 text-dark-400">
          <p>All recommendations reviewed</p>
        </div>
      )}
    </motion.div>
  );
}
