// Place Search Box with Live Suggestions
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, MapPin, Plus, Sparkles } from 'lucide-react';
import type { PlaceSuggestion } from '../../services/itinerary/direct-input.types';

interface PlaceSearchBoxProps {
  query: string;
  results: PlaceSuggestion[];
  isSearching: boolean;
  disabled?: boolean;
  onSearch: (query: string) => void;
  onSelectPlace: (place: PlaceSuggestion) => void;
}

export function PlaceSearchBox({
  query,
  results,
  isSearching,
  disabled,
  onSearch,
  onSelectPlace,
}: PlaceSearchBoxProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const showDropdown = isFocused && (results.length > 0 || isSearching) && query.length >= 2;

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

  // Debounced search
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearch(value);

    // Debounce the actual API call
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      // Parent handles the search
    }, 300);
    setDebounceTimer(timer);
  };

  // Get place type color
  const getTypeColor = (type: string) => {
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
      accommodation: 'bg-blue-500/20 text-blue-400',
    };
    return colors[type] || 'bg-dark-600 text-dark-300';
  };

  return (
    <div className="relative">
      <label className="block text-dark-300 text-sm font-medium mb-2">
        Search places to add
      </label>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          disabled={disabled}
          placeholder="Search for beaches, temples, restaurants..."
          className="w-full pl-12 pr-12 py-3 bg-dark-800 border border-dark-700 rounded-xl
                     text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1
                     focus:ring-primary-500 transition-colors disabled:opacity-50
                     disabled:cursor-not-allowed"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400 animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
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
            {isSearching ? (
              <div className="p-4 flex items-center gap-3 text-dark-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching places...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="max-h-72 overflow-y-auto">
                {results.map((place, index) => (
                  <motion.button
                    key={place.id || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => {
                      onSelectPlace(place);
                      setIsFocused(false);
                    }}
                    className="w-full p-3 text-left hover:bg-dark-700 transition-colors
                               border-b border-dark-700 last:border-b-0 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center
                                    justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{place.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(place.type)}`}>
                          {place.type}
                        </span>
                      </div>
                      {place.description && (
                        <p className="text-dark-400 text-sm mt-0.5 line-clamp-1">
                          {place.description}
                        </p>
                      )}
                      {place.reason && (
                        <p className="text-dark-500 text-xs mt-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {place.reason}
                        </p>
                      )}
                    </div>
                    <Plus className="w-5 h-5 text-primary-400 flex-shrink-0" />
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-dark-400 text-center">
                No places found. Try a different search.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {disabled && (
        <p className="text-dark-500 text-sm mt-2">
          Enter a destination first to search for places
        </p>
      )}
    </div>
  );
}
