// Selected Places List for Trip Planning
import { AnimatePresence, Reorder } from 'framer-motion';
import { MapPin, Star, Sparkles, X, GripVertical } from 'lucide-react';
import type { PlaceInput } from '../../services/itinerary/direct-input.types';

interface SelectedPlacesListProps {
  places: PlaceInput[];
  onRemove: (placeId: string) => void;
  onToggleMustVisit: (placeId: string) => void;
  onReorder?: (places: PlaceInput[]) => void;
}

export function SelectedPlacesList({
  places,
  onRemove,
  onToggleMustVisit,
  onReorder,
}: SelectedPlacesListProps) {
  // Get place type color
  const getTypeColor = (type?: string) => {
    const colors: Record<string, string> = {
      beach: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      landmark: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      restaurant: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      activity: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      temple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      fort: 'bg-red-500/20 text-red-400 border-red-500/30',
      nature: 'bg-green-500/20 text-green-400 border-green-500/30',
      nightlife: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      market: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      accommodation: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return colors[type || ''] || 'bg-dark-600 text-dark-300 border-dark-500/30';
  };

  if (places.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-dark-700 rounded-xl">
        <MapPin className="w-8 h-8 text-dark-600 mx-auto mb-2" />
        <p className="text-dark-400">No places added yet</p>
        <p className="text-dark-500 text-sm mt-1">
          Search for places or accept AI suggestions above
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-dark-300 text-sm font-medium">
          Your Places ({places.length})
        </label>
        <div className="flex items-center gap-2 text-xs text-dark-500">
          <Star className="w-3 h-3 text-amber-400" />
          <span>= Must Visit</span>
        </div>
      </div>

      <Reorder.Group
        axis="y"
        values={places}
        onReorder={onReorder || (() => {})}
        className="space-y-2"
      >
        <AnimatePresence>
          {places.map((place) => (
            <Reorder.Item
              key={place.id}
              value={place}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden"
            >
              <div className="p-3 flex items-center gap-3">
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-dark-500 hover:text-dark-300">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Must Visit Star */}
                <button
                  onClick={() => onToggleMustVisit(place.id)}
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                             transition-colors ${
                               place.mustVisit
                                 ? 'bg-amber-500/20 text-amber-400'
                                 : 'bg-dark-700 text-dark-500 hover:text-dark-300'
                             }`}
                >
                  <Star className={`w-4 h-4 ${place.mustVisit ? 'fill-current' : ''}`} />
                </button>

                {/* Place Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white truncate">{place.name}</span>
                    {place.type && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${getTypeColor(
                          place.type
                        )}`}
                      >
                        {place.type}
                      </span>
                    )}
                    {place.suggestedByAI && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20
                                       text-primary-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI
                      </span>
                    )}
                  </div>
                  {place.description && (
                    <p className="text-dark-400 text-sm mt-0.5 line-clamp-1">
                      {place.description}
                    </p>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => onRemove(place.id)}
                  className="flex-shrink-0 p-2 text-dark-500 hover:text-red-400
                             hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Stats */}
      <div className="mt-3 flex items-center gap-4 text-sm">
        <span className="text-dark-500">
          {places.filter((p) => p.mustVisit).length} must-visit
        </span>
        <span className="text-dark-500">
          {places.filter((p) => p.suggestedByAI).length} AI suggested
        </span>
        {places.filter((p) => p.coordinates).length < places.length && (
          <span className="text-amber-400 text-xs">
            {places.length - places.filter((p) => p.coordinates).length} pending location
          </span>
        )}
      </div>
    </div>
  );
}
