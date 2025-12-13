// AI Suggestion Chips - "People also visit..." section
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, X, Loader2 } from 'lucide-react';
import type { PlaceSuggestion } from '../../services/itinerary/direct-input.types';

interface AISuggestionChipsProps {
  suggestions: PlaceSuggestion[];
  isLoading: boolean;
  onAccept: (suggestion: PlaceSuggestion) => void;
  onDismiss: (suggestionId: string) => void;
}

export function AISuggestionChips({
  suggestions,
  isLoading,
  onAccept,
  onDismiss,
}: AISuggestionChipsProps) {
  if (!isLoading && suggestions.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-dark-700 pt-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary-400" />
        <span className="text-sm font-medium text-dark-300">People also visit</span>
        {isLoading && <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />}
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              layout
              className="group relative"
            >
              <button
                onClick={() => onAccept(suggestion)}
                className="flex items-center gap-2 px-3 py-2 bg-dark-700 hover:bg-dark-600
                           border border-dark-600 hover:border-primary-500/50 rounded-xl
                           transition-all duration-200"
              >
                <Plus className="w-4 h-4 text-primary-400" />
                <span className="text-sm text-dark-200">{suggestion.name}</span>
                {suggestion.confidence >= 85 && (
                  <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400
                                   rounded-full">
                    Popular
                  </span>
                )}
              </button>

              {/* Dismiss button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(suggestion.id);
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-dark-600 border border-dark-500
                           rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100
                           transition-opacity hover:bg-dark-500"
              >
                <X className="w-3 h-3 text-dark-300" />
              </button>

              {/* Tooltip with reason */}
              {suggestion.reason && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2
                                bg-dark-800 border border-dark-600 rounded-lg shadow-xl
                                opacity-0 group-hover:opacity-100 transition-opacity
                                pointer-events-none z-10 w-48">
                  <p className="text-xs text-dark-300">{suggestion.reason}</p>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2
                                  rotate-45 w-2 h-2 bg-dark-800 border-r border-b border-dark-600" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={`skeleton-${i}`}
                className="h-10 w-28 bg-dark-700 rounded-xl animate-pulse"
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
