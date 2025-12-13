import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Map,
  ArrowLeft,
  Clock,
  Users,
  Zap,
  Coffee,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  Plus,
  Battery,
  Route,
  Calendar,
  DollarSign,
  Loader2,
  Navigation,
  Shield,
  Trash2,
  TimerReset,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useItineraryStore } from '../stores/itinerary.store';
import { useSignalCleanseStore } from '../stores/signal-cleanse.store';
import { ItineraryMap, DayLegend, MapStats } from '../components/itinerary/ItineraryMap';
import { getFatigueLevel } from '../services/itinerary/fatigue-scheduler';
import type { ScheduledActivity } from '../services/itinerary/types';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

export default function ElasticItinerary() {
  const navigate = useNavigate();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  // Itinerary store
  const {
    generatedItinerary,
    isGenerating,
    generationStage,
    generationProgress,
    selectedDay,
    selectDay,
    extractionSource,
    setExtractionSource,
    generateFromExtraction,
    isResearching,
    researchProgress,
    researchedPlaces,
    removeActivity,
    updateActivityDuration,
  } = useItineraryStore();

  // Get extraction from Signal-Cleanse if not already set
  const { extractionResult } = useSignalCleanseStore();

  // Auto-load extraction result if available
  useEffect(() => {
    if (extractionResult && !extractionSource) {
      setExtractionSource(extractionResult);
    }
  }, [extractionResult, extractionSource, setExtractionSource]);

  // Auto-generate when extraction is set
  useEffect(() => {
    if (extractionSource && !generatedItinerary && !isGenerating) {
      generateFromExtraction();
    }
  }, [extractionSource, generatedItinerary, isGenerating, generateFromExtraction]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'visit': return <MapPin className="w-4 h-4" />;
      case 'meal': return <Coffee className="w-4 h-4" />;
      case 'rest': return <Battery className="w-4 h-4" />;
      case 'travel': return <Navigation className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (activity: ScheduledActivity) => {
    switch (activity.type) {
      case 'visit': return 'border-primary-500/50 bg-primary-500/10';
      case 'meal': return 'border-secondary-500/30 bg-secondary-500/10';
      case 'rest': return 'border-emerald-500/30 bg-emerald-500/10';
      case 'travel': return 'border-dark-600 bg-dark-800/30';
      default: return 'border-dark-700 bg-dark-800/50';
    }
  };

  const getCrowdBadge = (level?: string) => {
    if (!level) return null;
    const colors = {
      low: 'bg-emerald-500/20 text-emerald-400',
      medium: 'bg-amber-500/20 text-amber-400',
      high: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs ${colors[level as keyof typeof colors]}`}>
        <Users className="w-3 h-3 inline mr-1" />
        {level} crowd
      </span>
    );
  };

  // Get days to display
  const daysToShow = generatedItinerary
    ? selectedDay
      ? generatedItinerary.days.filter(d => d.day === selectedDay)
      : generatedItinerary.days
    : [];

  // Loading state with research progress
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="w-20 h-20 rounded-full border-4 border-primary-500 border-t-transparent mx-auto mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <h2 className="text-xl font-display font-semibold text-white mb-2">
              {isResearching ? 'Researching Your Trip' : generationStage}
            </h2>
            <p className="text-dark-400 text-sm">
              {isResearching
                ? 'Finding best times, nearby restaurants, and travel tips...'
                : 'Building your perfect itinerary...'}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-dark-400">{generationStage}</span>
              <span className="text-primary-400">{Math.round(generationProgress)}%</span>
            </div>
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                animate={{ width: `${generationProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Research progress - place by place */}
          {isResearching && researchProgress && extractionSource && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 rounded-xl space-y-3"
            >
              <div className="flex items-center gap-2 text-sm text-dark-300">
                <Sparkles className="w-4 h-4 text-primary-400" />
                <span>Researching {researchProgress.placeIndex + 1} of {researchProgress.totalPlaces} places</span>
              </div>

              {/* Place list with status */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {extractionSource.places.map((place, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      i < researchProgress.placeIndex
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : i === researchProgress.placeIndex
                        ? 'bg-primary-500/10 border border-primary-500/30'
                        : 'bg-dark-800/30 border border-dark-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      i < researchProgress.placeIndex
                        ? 'bg-emerald-500 text-white'
                        : i === researchProgress.placeIndex
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-700 text-dark-500'
                    }`}>
                      {i < researchProgress.placeIndex ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : i === researchProgress.placeIndex ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span className="text-xs">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${
                        i <= researchProgress.placeIndex ? 'text-white' : 'text-dark-400'
                      }`}>
                        {place.name}
                      </p>
                      {i === researchProgress.placeIndex && (
                        <p className="text-xs text-primary-400 truncate">
                          {researchProgress.stage === 'searching' && 'Searching web...'}
                          {researchProgress.stage === 'extracting' && 'Extracting info...'}
                          {researchProgress.stage === 'geocoding' && 'Getting location...'}
                          {researchProgress.stage === 'findingNearby' && 'Finding nearby places...'}
                        </p>
                      )}
                    </div>
                    {i < researchProgress.placeIndex && researchedPlaces[i] && (
                      <span className="text-xs text-emerald-400">
                        {researchedPlaces[i].typicalDuration}min
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // No data state
  if (!generatedItinerary) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-6">
            <Map className="w-10 h-10 text-dark-500" />
          </div>
          <h2 className="text-xl font-display font-semibold text-white mb-2">
            No Itinerary Data
          </h2>
          <p className="text-dark-400 mb-6">
            Extract places from your chat first, then generate an itinerary.
          </p>
          <Button variant="primary" onClick={() => navigate('/signal-cleanse')}>
            Go to Signal-Cleanse
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Navigation */}
      <nav className="border-b border-dark-800 bg-dark-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center">
                  <Route className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-white">Smart Itinerary</h1>
                  <p className="text-dark-400 text-sm">
                    {generatedItinerary.summary.totalDays} days | {generatedItinerary.summary.placesVisited} places
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMap(!showMap)}
              >
                <Map className="w-4 h-4 mr-2" />
                {showMap ? 'Hide Map' : 'Show Map'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/safety')}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                <Shield className="w-4 h-4 mr-2" />
                Activate Safety
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/signal-cleanse')}>
                <Zap className="w-4 h-4 mr-2" />
                New Extraction
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Map Section */}
        {showMap && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 space-y-4"
          >
            <ItineraryMap
              itinerary={generatedItinerary}
              selectedDay={selectedDay}
              className="h-80 rounded-xl"
            />
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <DayLegend
                days={generatedItinerary.days}
                selectedDay={selectedDay}
                onDaySelect={selectDay}
              />
              <MapStats itinerary={generatedItinerary} />
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline */}
          <div className="lg:col-span-2">
            {daysToShow.map((day) => (
              <div key={day.day} className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      day.day === 1 ? 'bg-primary-500/20 text-primary-400' :
                      day.day === 2 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-semibold text-white">
                        Day {day.day}
                      </h2>
                      <p className="text-dark-400 text-sm">{day.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-dark-400 text-sm">
                      {day.activities.filter(a => a.type === 'visit').length} activities
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      getFatigueLevel(day.totalFatigue).level === 'light' ? 'bg-emerald-500/20 text-emerald-400' :
                      getFatigueLevel(day.totalFatigue).level === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {getFatigueLevel(day.totalFatigue).emoji} {getFatigueLevel(day.totalFatigue).level}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500 via-secondary-500 to-dark-700" />

                  {/* Timeline items */}
                  <div className="space-y-4">
                    <AnimatePresence>
                      {day.activities.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="relative pl-14"
                        >
                          {/* Timeline node */}
                          <div className={`
                            absolute left-4 w-4 h-4 rounded-full -translate-x-1/2
                            ${activity.type === 'visit' ? 'bg-primary-500' :
                              activity.type === 'meal' ? 'bg-secondary-500' :
                              activity.type === 'rest' ? 'bg-emerald-500' :
                              'bg-dark-600'}
                          `} />

                          {/* Card */}
                          <div
                            className={`
                              glass-card p-4 border-l-4 cursor-pointer transition-all
                              ${getTypeColor(activity)}
                              hover:scale-[1.01]
                            `}
                            onClick={() => setExpandedItem(expandedItem === activity.id ? null : activity.id)}
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className={`
                                  w-10 h-10 rounded-lg flex items-center justify-center
                                  ${activity.type === 'visit' ? 'bg-primary-500/20 text-primary-400' :
                                    activity.type === 'meal' ? 'bg-secondary-500/20 text-secondary-400' :
                                    activity.type === 'rest' ? 'bg-emerald-500/20 text-emerald-400' :
                                    'bg-dark-700 text-dark-300'}
                                `}>
                                  {getTypeIcon(activity.type)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-mono text-sm">
                                      {activity.startTime}
                                    </span>
                                    <span className="text-dark-500">-</span>
                                    <span className="text-dark-400 font-mono text-sm">
                                      {activity.endTime}
                                    </span>
                                  </div>
                                  <h3 className="font-display font-semibold text-white mt-1">
                                    {activity.place.name}
                                  </h3>
                                  {activity.type === 'travel' && activity.travelFromPrev && (
                                    <p className="text-dark-400 text-sm">
                                      {activity.travelFromPrev.distance.toFixed(1)} km via {activity.travelFromPrev.mode}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <span className="text-dark-400 text-sm">{activity.duration} min</span>
                                {expandedItem === activity.id ? (
                                  <ChevronUp className="w-4 h-4 text-dark-500" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-dark-500" />
                                )}
                              </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              {getCrowdBadge(activity.crowdLevel)}
                              {activity.fatigueImpact !== 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  activity.fatigueImpact < 0 ? 'bg-emerald-500/20 text-emerald-400' :
                                  activity.fatigueImpact > 30 ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-dark-700 text-dark-300'
                                }`}>
                                  <Battery className="w-3 h-3 inline mr-1" />
                                  {activity.fatigueImpact > 0 ? '+' : ''}{activity.fatigueImpact}
                                </span>
                              )}
                              {typeof activity.estimatedCost === 'number' && activity.estimatedCost > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-dark-700 text-dark-300">
                                  <DollarSign className="w-3 h-3 inline mr-1" />
                                  {activity.estimatedCost}
                                </span>
                              )}
                            </div>

                            {/* Best time reason */}
                            {activity.bestTimeReason && (
                              <div className="mt-3 flex items-start gap-2 text-sm">
                                <Sparkles className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                                <span className="text-dark-300">{activity.bestTimeReason}</span>
                              </div>
                            )}

                            {/* Expanded content */}
                            <AnimatePresence>
                              {expandedItem === activity.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-4 pt-4 border-t border-dark-700"
                                >
                                  {activity.place.enrichedData && (
                                    <div className="space-y-2 mb-4">
                                      {activity.place.enrichedData.rating && (
                                        <p className="text-dark-300 text-sm">
                                          Rating: {activity.place.enrichedData.rating}
                                        </p>
                                      )}
                                      {activity.place.enrichedData.description && (
                                        <p className="text-dark-400 text-sm">
                                          {activity.place.enrichedData.description}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  {/* Action Buttons */}
                                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dark-700">
                                    {/* Extend Time Options */}
                                    <div className="flex items-center gap-1">
                                      <span className="text-dark-400 text-xs mr-1">
                                        <TimerReset className="w-3 h-3 inline" /> Extend:
                                      </span>
                                      {[15, 30, 60].map((mins) => (
                                        <button
                                          key={mins}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateActivityDuration(activity.id, activity.duration + mins);
                                          }}
                                          className="px-2 py-1 text-xs bg-primary-500/20 text-primary-400 rounded hover:bg-primary-500/30 transition-colors"
                                        >
                                          +{mins}m
                                        </button>
                                      ))}
                                    </div>

                                    {/* Reduce Time Options */}
                                    <div className="flex items-center gap-1">
                                      <span className="text-dark-400 text-xs mr-1">Reduce:</span>
                                      {[15, 30].map((mins) => (
                                        <button
                                          key={mins}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newDuration = Math.max(15, activity.duration - mins);
                                            updateActivityDuration(activity.id, newDuration);
                                          }}
                                          className="px-2 py-1 text-xs bg-dark-600 text-dark-300 rounded hover:bg-dark-500 transition-colors"
                                        >
                                          -{mins}m
                                        </button>
                                      ))}
                                    </div>

                                    {/* Remove Activity */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Remove "${activity.place.name}" from itinerary?`)) {
                                          removeActivity(activity.id);
                                        }
                                      }}
                                      className="ml-auto px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Remove
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Day recommendations */}
                {day.recommendations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-xl bg-primary-500/10 border border-primary-500/30"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-primary-400" />
                      <h4 className="font-display font-semibold text-white">Suggestions</h4>
                    </div>
                    <div className="space-y-3">
                      {day.recommendations.slice(0, 3).map((rec, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-dark-800/30">
                          <div className="flex items-start gap-2">
                            <Plus className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="text-white font-medium">{rec.name}</span>
                              {rec.distance > 0 && (
                                <span className="text-dark-500 text-xs ml-2">({rec.distance.toFixed(1)} km away)</span>
                              )}
                              <p className="text-dark-400 text-xs mt-0.5">{rec.reason}</p>
                            </div>
                          </div>
                          {rec.googleMapsUrl && (
                            <a
                              href={rec.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 p-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
                              title="Open in Google Maps"
                            >
                              <MapPin className="w-4 h-4 text-primary-400" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trip Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-4"
            >
              <h3 className="font-display font-semibold text-white mb-4">Trip Summary</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-400" />
                    <span className="text-dark-200">Duration</span>
                  </div>
                  <span className="text-white font-medium">
                    {generatedItinerary.summary.totalDays} days
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-secondary-400" />
                    <span className="text-dark-200">Places</span>
                  </div>
                  <span className="text-white font-medium">
                    {generatedItinerary.summary.placesVisited} visits
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50">
                  <div className="flex items-center gap-2">
                    <Route className="w-5 h-5 text-emerald-400" />
                    <span className="text-dark-200">Distance</span>
                  </div>
                  <span className="text-white font-medium">
                    {generatedItinerary.summary.distanceTraveled} km
                  </span>
                </div>

                {typeof generatedItinerary.summary.totalCost === 'number' && generatedItinerary.summary.totalCost > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-amber-400" />
                      <span className="text-dark-200">Est. Cost</span>
                    </div>
                    <span className="text-white font-medium">
                      {generatedItinerary.summary.totalCost.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Missing Categories */}
            {generatedItinerary.summary.missingCategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-4 border border-amber-500/30"
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <h3 className="font-display font-semibold text-white">Missing</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  {generatedItinerary.summary.missingCategories.map((cat, i) => (
                    <li key={i} className="flex items-center gap-2 text-dark-300">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="capitalize">{cat}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Legend */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-4"
            >
              <h3 className="font-display font-semibold text-white mb-4">Activity Types</h3>
              <ul className="space-y-3 text-sm text-dark-400">
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                  <span>Place visits</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary-500" />
                  <span>Meals</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Rest breaks</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-dark-600" />
                  <span>Travel</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
