// Recommendation Card - Individual missed place recommendation
import { motion } from 'framer-motion';
import { MapPin, Clock, Sunrise, Plus, X, Check, Sparkles } from 'lucide-react';
import type { MissedRecommendation } from '../../services/itinerary/direct-input.types';

interface RecommendationCardProps {
  recommendation: MissedRecommendation;
  onAccept: () => void;
  onReject: () => void;
}

export function RecommendationCard({
  recommendation,
  onAccept,
  onReject,
}: RecommendationCardProps) {
  const { name, type, reason, description, bestTimeToVisit, estimatedDuration, status, distance } =
    recommendation;

  // Get type color
  const getTypeColor = (t: string) => {
    const colors: Record<string, string> = {
      beach: 'bg-cyan-500/20 text-cyan-400',
      landmark: 'bg-amber-500/20 text-amber-400',
      restaurant: 'bg-orange-500/20 text-orange-400',
      activity: 'bg-emerald-500/20 text-emerald-400',
      temple: 'bg-purple-500/20 text-purple-400',
      fort: 'bg-red-500/20 text-red-400',
      nature: 'bg-green-500/20 text-green-400',
      nightlife: 'bg-pink-500/20 text-pink-400',
      market: 'bg-yellow-500/20 text-yellow-400',
    };
    return colors[t] || 'bg-dark-600 text-dark-300';
  };

  if (status === 'rejected') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`bg-dark-800 border rounded-xl overflow-hidden ${
        status === 'accepted'
          ? 'border-emerald-500/50'
          : 'border-dark-700 hover:border-primary-500/30'
      } transition-colors`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white flex items-center gap-2">
                {name}
                {status === 'accepted' && (
                  <Check className="w-4 h-4 text-emerald-400" />
                )}
              </h4>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(type)}`}>
                {type}
              </span>
            </div>
          </div>

          {/* Distance badge */}
          {distance && (
            <div className="text-xs text-dark-400 bg-dark-700 px-2 py-1 rounded-full">
              {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`} away
            </div>
          )}
        </div>

        {/* Reason */}
        <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-dark-200">{reason}</p>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-dark-400 mb-3">{description}</p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-dark-500 mb-4">
          {bestTimeToVisit && (
            <div className="flex items-center gap-1">
              <Sunrise className="w-3 h-3" />
              <span>{bestTimeToVisit}</span>
            </div>
          )}
          {estimatedDuration && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{estimatedDuration}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {status === 'pending' ? (
          <div className="flex gap-2">
            <button
              onClick={onAccept}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-500
                         hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add to Trip
            </button>
            <button
              onClick={onReject}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-700
                         hover:bg-dark-600 text-dark-300 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Dismiss
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-400 py-2">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Added to your trip</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
