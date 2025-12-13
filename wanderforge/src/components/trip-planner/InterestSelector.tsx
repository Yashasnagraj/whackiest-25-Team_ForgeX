// Interest Selector for Trip Planning
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Waves,
  Mountain,
  Landmark,
  UtensilsCrossed,
  PartyPopper,
  TreePine,
  History,
  ShoppingBag,
  Heart,
  Camera,
  Plus,
  X,
} from 'lucide-react';
import { INTEREST_CATEGORIES, type InterestCategory } from '../../services/itinerary/direct-input.types';

// Icon mapping for interests
const INTEREST_ICONS: Record<InterestCategory, React.ReactNode> = {
  Beach: <Waves className="w-4 h-4" />,
  Adventure: <Mountain className="w-4 h-4" />,
  Culture: <Landmark className="w-4 h-4" />,
  Food: <UtensilsCrossed className="w-4 h-4" />,
  Nightlife: <PartyPopper className="w-4 h-4" />,
  Nature: <TreePine className="w-4 h-4" />,
  History: <History className="w-4 h-4" />,
  Shopping: <ShoppingBag className="w-4 h-4" />,
  Wellness: <Heart className="w-4 h-4" />,
  Photography: <Camera className="w-4 h-4" />,
};

interface InterestSelectorProps {
  selected: InterestCategory[];
  customInterests: string[];
  onToggle: (interest: InterestCategory) => void;
  onAddCustom: (interest: string) => void;
  onRemoveCustom: (interest: string) => void;
}

export function InterestSelector({
  selected,
  customInterests,
  onToggle,
  onAddCustom,
  onRemoveCustom,
}: InterestSelectorProps) {
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleAddCustom = () => {
    if (customInput.trim()) {
      onAddCustom(customInput.trim());
      setCustomInput('');
      setShowCustomInput(false);
    }
  };

  return (
    <div>
      <label className="block text-dark-300 text-sm font-medium mb-2">
        What are you interested in?
      </label>

      <div className="flex flex-wrap gap-2">
        {/* Predefined interests */}
        {INTEREST_CATEGORIES.map((interest) => {
          const isSelected = selected.includes(interest);
          return (
            <motion.button
              key={interest}
              onClick={() => onToggle(interest)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                         transition-all duration-200 ${
                           isSelected
                             ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                             : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                         }`}
            >
              {INTEREST_ICONS[interest]}
              {interest}
            </motion.button>
          );
        })}

        {/* Custom interests */}
        <AnimatePresence>
          {customInterests.map((interest) => (
            <motion.div
              key={interest}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium
                         bg-amber-500/20 text-amber-400 border border-amber-500/30"
            >
              {interest}
              <button
                onClick={() => onRemoveCustom(interest)}
                className="ml-1 p-0.5 rounded-full hover:bg-amber-500/30 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add custom button/input */}
        <AnimatePresence mode="wait">
          {showCustomInput ? (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-1"
            >
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCustom();
                  if (e.key === 'Escape') setShowCustomInput(false);
                }}
                placeholder="Type interest..."
                autoFocus
                className="w-32 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg
                           text-sm text-white placeholder-dark-500 focus:border-primary-500
                           focus:outline-none"
              />
              <button
                onClick={handleAddCustom}
                className="p-2 bg-primary-500 rounded-lg text-white hover:bg-primary-600
                           transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowCustomInput(false)}
                className="p-2 bg-dark-700 rounded-lg text-dark-400 hover:bg-dark-600
                           transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomInput(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                         border-2 border-dashed border-dark-600 text-dark-400
                         hover:border-primary-500 hover:text-primary-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Custom
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {selected.length === 0 && customInterests.length === 0 && (
        <p className="text-dark-500 text-sm mt-2">
          Select your interests to get better recommendations
        </p>
      )}
    </div>
  );
}
