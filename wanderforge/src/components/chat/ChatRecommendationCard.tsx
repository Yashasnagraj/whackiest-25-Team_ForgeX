// ============================================================
// CHAT RECOMMENDATION CARD
// Displays AI-powered travel recommendations in chat
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Hotel,
  UtensilsCrossed,
  Compass,
  Star,
  ChevronDown,
  ChevronUp,
  Plus,
  Sparkles,
  Sun,
} from 'lucide-react';
import type { TravelRecommendations, PlaceRecommendation, StayRecommendation, RestaurantRecommendation, ActivityRecommendation } from '../../services/chat/types';

interface Props {
  destination: string;
  recommendations: TravelRecommendations;
  onAddToTrip?: (item: { name: string; type: string }) => void;
}

type Tab = 'places' | 'stays' | 'restaurants' | 'activities';

export function ChatRecommendationCard({ destination, recommendations, onAddToTrip }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('places');

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'places', label: 'Places', icon: MapPin, count: recommendations.places.length },
    { id: 'stays', label: 'Stays', icon: Hotel, count: recommendations.stays.length },
    { id: 'restaurants', label: 'Food', icon: UtensilsCrossed, count: recommendations.restaurants.length },
    { id: 'activities', label: 'Activities', icon: Compass, count: recommendations.activities.length },
  ];

  const handleAddToTrip = (name: string, type: string) => {
    onAddToTrip?.({ name, type });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 my-2"
    >
      <div className="bg-gradient-to-br from-accent-purple/10 to-accent-cyan/10 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-accent-purple to-accent-cyan flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-accent-cyan font-medium">WanderForge Assistant</span>
              </div>
              <h3 className="text-white font-semibold">
                {destination} Recommendations
              </h3>
            </div>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Quick Info */}
              {(recommendations.bestTimeToVisit || recommendations.quickTip) && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                  {recommendations.bestTimeToVisit && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-journey-dreamGold/20 rounded-full text-xs text-journey-dreamGold">
                      <Sun className="w-3 h-3" />
                      <span>Best: {recommendations.bestTimeToVisit}</span>
                    </div>
                  )}
                  {recommendations.quickTip && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-cyan/20 rounded-full text-xs text-accent-cyan">
                      <Sparkles className="w-3 h-3" />
                      <span>{recommendations.quickTip}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 px-4 pb-2 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="text-xs opacity-60">({tab.count})</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-4 pt-2 space-y-2 max-h-80 overflow-y-auto">
                {activeTab === 'places' && (
                  <PlacesList places={recommendations.places} onAdd={handleAddToTrip} />
                )}
                {activeTab === 'stays' && (
                  <StaysList stays={recommendations.stays} onAdd={handleAddToTrip} />
                )}
                {activeTab === 'restaurants' && (
                  <RestaurantsList restaurants={recommendations.restaurants} onAdd={handleAddToTrip} />
                )}
                {activeTab === 'activities' && (
                  <ActivitiesList activities={recommendations.activities} onAdd={handleAddToTrip} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ==================== Sub-Components ====================

function PlacesList({ places, onAdd }: { places: PlaceRecommendation[]; onAdd: (name: string, type: string) => void }) {
  if (places.length === 0) {
    return <EmptyState message="No places found" />;
  }

  return (
    <div className="space-y-2">
      {places.map((place, index) => (
        <RecommendationItem
          key={index}
          name={place.name}
          description={place.description}
          rating={place.rating}
          badge={place.mustVisit ? 'Must Visit' : undefined}
          badgeColor="bg-journey-success/20 text-journey-success"
          onAdd={() => onAdd(place.name, 'place')}
        />
      ))}
    </div>
  );
}

function StaysList({ stays, onAdd }: { stays: StayRecommendation[]; onAdd: (name: string, type: string) => void }) {
  if (stays.length === 0) {
    return <EmptyState message="No stays found" />;
  }

  const priceColors = {
    budget: 'text-journey-success',
    mid: 'text-journey-dreamGold',
    luxury: 'text-accent-purple',
  };

  return (
    <div className="space-y-2">
      {stays.map((stay, index) => (
        <RecommendationItem
          key={index}
          name={stay.name}
          description={stay.description}
          rating={stay.rating}
          badge={stay.priceEstimate}
          badgeColor={`bg-dark-700/50 ${priceColors[stay.priceRange]}`}
          subBadge={stay.priceRange.charAt(0).toUpperCase() + stay.priceRange.slice(1)}
          onAdd={() => onAdd(stay.name, 'hotel')}
        />
      ))}
    </div>
  );
}

function RestaurantsList({ restaurants, onAdd }: { restaurants: RestaurantRecommendation[]; onAdd: (name: string, type: string) => void }) {
  if (restaurants.length === 0) {
    return <EmptyState message="No restaurants found" />;
  }

  return (
    <div className="space-y-2">
      {restaurants.map((restaurant, index) => (
        <RecommendationItem
          key={index}
          name={restaurant.name}
          description={restaurant.description}
          rating={restaurant.rating}
          badge={restaurant.cuisine}
          badgeColor="bg-accent-orange/20 text-accent-orange"
          subBadge={restaurant.mustTry ? `Try: ${restaurant.mustTry}` : undefined}
          onAdd={() => onAdd(restaurant.name, 'restaurant')}
        />
      ))}
    </div>
  );
}

function ActivitiesList({ activities, onAdd }: { activities: ActivityRecommendation[]; onAdd: (name: string, type: string) => void }) {
  if (activities.length === 0) {
    return <EmptyState message="No activities found" />;
  }

  return (
    <div className="space-y-2">
      {activities.map((activity, index) => (
        <RecommendationItem
          key={index}
          name={activity.name}
          description={activity.description}
          badge={activity.duration}
          badgeColor="bg-accent-cyan/20 text-accent-cyan"
          subBadge={activity.bestTime ? `Best: ${activity.bestTime}` : undefined}
          onAdd={() => onAdd(activity.name, 'activity')}
        />
      ))}
    </div>
  );
}

function RecommendationItem({
  name,
  description,
  rating,
  badge,
  badgeColor,
  subBadge,
  onAdd,
}: {
  name: string;
  description: string;
  rating?: number;
  badge?: string;
  badgeColor?: string;
  subBadge?: string;
  onAdd: () => void;
}) {
  return (
    <div className="group flex items-start justify-between p-3 bg-dark-700/30 hover:bg-dark-700/50 rounded-xl transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-medium text-sm">{name}</span>
          {rating && (
            <span className="flex items-center gap-0.5 text-xs text-journey-dreamGold">
              <Star className="w-3 h-3 fill-current" />
              {rating.toFixed(1)}
            </span>
          )}
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{description}</p>
        {subBadge && (
          <p className="text-gray-500 text-xs mt-0.5">{subBadge}</p>
        )}
      </div>
      <button
        onClick={onAdd}
        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg transition-all"
        title="Add to trip"
      >
        <Plus className="w-4 h-4 text-accent-cyan" />
      </button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-6 text-gray-500 text-sm">
      {message}
    </div>
  );
}

// ==================== Quick Tip Card ====================

export function QuickTipCard({
  placeName,
  tip,
  onAddToTrip,
}: {
  placeName: string;
  tip: string;
  onAddToTrip?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 my-2"
    >
      <div className="bg-gradient-to-r from-accent-cyan/10 to-accent-purple/10 backdrop-blur-xl rounded-xl border border-white/10 p-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-accent-cyan to-accent-purple flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-accent-cyan font-medium">Quick Tip</span>
              <span className="text-white font-medium text-sm">{placeName}</span>
            </div>
            <p className="text-gray-300 text-sm">{tip}</p>
          </div>
          {onAddToTrip && (
            <button
              onClick={onAddToTrip}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="Add to places"
            >
              <Plus className="w-4 h-4 text-accent-cyan" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
