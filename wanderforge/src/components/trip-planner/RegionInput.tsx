// Region Input with AI Autocomplete
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, Check, Sparkles } from 'lucide-react';
import type { RegionSuggestion } from '../../services/itinerary/direct-input.types';

interface RegionInputProps {
  value: string;
  suggestions: RegionSuggestion[];
  isLoading: boolean;
  onChange: (value: string) => void;
  onSelectSuggestion: (suggestion: RegionSuggestion) => void;
  onEnterPress?: () => void;
}

export function RegionInput({
  value,
  suggestions,
  isLoading,
  onChange,
  onSelectSuggestion,
  onEnterPress,
}: RegionInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const showDropdown = isFocused && (suggestions.length > 0 || isLoading);

  // Debounced onChange
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new debounce timer (handled in store, but extra safety)
    const timer = setTimeout(() => {
      // Parent handles the actual API call
    }, 300);
    setDebounceTimer(timer);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <label className="block text-dark-300 text-sm font-medium mb-2">
        Where are you going?
      </label>

      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value && value.length >= 3 && !showDropdown) {
              e.preventDefault();
              onEnterPress?.();
            }
          }}
          placeholder="Enter destination (e.g., Goa, Hampi, Jaipur)"
          className="w-full pl-12 pr-12 py-3 bg-dark-800 border border-dark-700 rounded-xl
                     text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1
                     focus:ring-primary-500 transition-colors"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400 animate-spin" />
        )}
        {value && !isLoading && suggestions.length === 0 && (
          <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-dark-800 border border-dark-700 rounded-xl
                       shadow-xl overflow-hidden"
          >
            {isLoading ? (
              <div className="p-4 flex items-center gap-3 text-dark-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Finding destinations...</span>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={`${suggestion.name}-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      onSelectSuggestion(suggestion);
                      setIsFocused(false);
                    }}
                    className="w-full p-4 text-left hover:bg-dark-700 transition-colors
                               border-b border-dark-700 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center
                                      justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-5 h-5 text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white">{suggestion.name}</h4>
                          {suggestion.state && (
                            <span className="text-dark-400 text-sm">{suggestion.state}</span>
                          )}
                        </div>
                        <p className="text-dark-400 text-sm mt-0.5 line-clamp-1">
                          {suggestion.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          {suggestion.typicalDuration && (
                            <span className="text-xs text-dark-500">
                              {suggestion.typicalDuration}
                            </span>
                          )}
                          {suggestion.bestSeasons && suggestion.bestSeasons.length > 0 && (
                            <span className="text-xs text-emerald-400">
                              Best: {suggestion.bestSeasons[0]}
                            </span>
                          )}
                        </div>
                        {suggestion.popularPlaces && suggestion.popularPlaces.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            {suggestion.popularPlaces.slice(0, 3).map((place, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 bg-dark-700 rounded-full text-dark-300"
                              >
                                {place}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
