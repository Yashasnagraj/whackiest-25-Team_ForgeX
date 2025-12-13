// Trip Planner Zustand Store
// Manages state for the direct trip planning feature

import { create } from 'zustand';
import type {
  DirectTripInput,
  PlaceInput,
  RegionSuggestion,
  PlaceSuggestion,
  MissedRecommendation,
  TripPlannerStage,
  InterestCategory,
  TravelMode,
  TripBudget,
  TripTimings,
} from '../services/itinerary/direct-input.types';
import {
  DEFAULT_TRIP_INPUT,
  generatePlaceId,
  calculateTripDays,
} from '../services/itinerary/direct-input.types';
import type { GeneratedItinerary } from '../services/itinerary/types';
import type { ResearchProgress } from '../services/itinerary/place-research.types';
import {
  getRegionSuggestions,
  getPopularPlacesInRegion,
  searchPlacesInRegion,
  getMissedRecommendations,
  generateTripSummary,
} from '../services/ai/recommendations';
import {
  adaptDirectInputToItinerary,
  enrichPlacesWithCoordinates,
  validateDirectInput,
} from '../services/itinerary/direct-input.adapter';
import { generateItineraryWithResearch } from '../services/itinerary/builder';

interface TripPlannerState {
  // Stage
  stage: TripPlannerStage;

  // Trip Input
  region: string;
  regionCoordinates: { lat: number; lng: number } | null;
  startDate: string;
  endDate: string;
  budget: TripBudget;
  timings: TripTimings;
  travelMode: TravelMode;
  interests: InterestCategory[];
  customInterests: string[];

  // Region suggestions (autocomplete)
  regionSuggestions: RegionSuggestion[];
  isLoadingRegionSuggestions: boolean;

  // Selected places
  selectedPlaces: PlaceInput[];

  // Place search
  searchQuery: string;
  searchResults: PlaceSuggestion[];
  isSearching: boolean;

  // AI suggestions ("People also visit...")
  aiSuggestedPlaces: PlaceSuggestion[];
  isLoadingAISuggestions: boolean;

  // Generation
  generatedItinerary: GeneratedItinerary | null;
  isGenerating: boolean;
  generationProgress: ResearchProgress | null;
  generationError: string | null;

  // Trip summary
  tripSummary: { title: string; tagline: string; summary: string } | null;

  // Missed recommendations (post-generation)
  missedRecommendations: MissedRecommendation[];
  isLoadingMissedRecommendations: boolean;

  // Computed
  tripDays: number;
  placeCoverage: { sufficient: boolean; recommended: number; current: number; message: string };

  // Actions - Input
  setRegion: (region: string) => void;
  selectRegionSuggestion: (suggestion: RegionSuggestion) => void;
  setDates: (start: string, end: string) => void;
  setBudget: (budget: Partial<TripBudget>) => void;
  setTimings: (timings: Partial<TripTimings>) => void;
  setTravelMode: (mode: TravelMode) => void;
  toggleInterest: (interest: InterestCategory) => void;
  addCustomInterest: (interest: string) => void;
  removeCustomInterest: (interest: string) => void;

  // Actions - Places
  searchPlaces: (query: string) => Promise<void>;
  addPlace: (place: PlaceInput) => void;
  addPlaceFromSuggestion: (suggestion: PlaceSuggestion) => void;
  removePlace: (placeId: string) => void;
  toggleMustVisit: (placeId: string) => void;

  // Actions - AI Suggestions
  loadPopularPlaces: () => Promise<void>;
  acceptAISuggestion: (suggestion: PlaceSuggestion) => void;
  dismissAISuggestion: (suggestionId: string) => void;

  // Actions - Generation
  generateItinerary: () => Promise<void>;
  loadMissedRecommendations: () => Promise<void>;
  acceptMissedRecommendation: (id: string) => void;
  rejectMissedRecommendation: (id: string) => void;
  regenerateWithAccepted: () => Promise<void>;

  // Actions - Navigation
  goToPlanning: () => void;
  goToResult: () => void;

  // Actions - Edit Itinerary
  removeActivity: (activityId: string) => void;
  updateActivityDuration: (activityId: string, newDuration: number) => void;

  // Actions - Reset
  reset: () => void;
}

export const useTripPlannerStore = create<TripPlannerState>((set, get) => ({
  // Initial state
  stage: 'planning',

  region: '',
  regionCoordinates: null,
  startDate: '',
  endDate: '',
  budget: { ...DEFAULT_TRIP_INPUT.budget },
  timings: { ...DEFAULT_TRIP_INPUT.timings },
  travelMode: 'moderate',
  interests: [],
  customInterests: [],

  regionSuggestions: [],
  isLoadingRegionSuggestions: false,

  selectedPlaces: [],

  searchQuery: '',
  searchResults: [],
  isSearching: false,

  aiSuggestedPlaces: [],
  isLoadingAISuggestions: false,

  generatedItinerary: null,
  isGenerating: false,
  generationProgress: null,
  generationError: null,

  tripSummary: null,

  missedRecommendations: [],
  isLoadingMissedRecommendations: false,

  // Computed values - these are now functions that must be called
  tripDays: 0, // Will be updated reactively
  placeCoverage: { sufficient: true, recommended: 0, current: 0, message: '' }, // Will be updated reactively

  // ==================== Input Actions ====================

  setRegion: async (region) => {
    set({ region });

    // Load region suggestions (debounced in component)
    if (region.length >= 2) {
      set({ isLoadingRegionSuggestions: true });
      try {
        const suggestions = await getRegionSuggestions(region);
        set({ regionSuggestions: suggestions, isLoadingRegionSuggestions: false });
      } catch {
        set({ isLoadingRegionSuggestions: false });
      }
    } else {
      set({ regionSuggestions: [] });
    }
  },

  selectRegionSuggestion: (suggestion) => {
    set({
      region: suggestion.name,
      regionCoordinates: suggestion.coordinates || null,
      regionSuggestions: [],
    });

    // Load popular places for this region
    get().loadPopularPlaces();
  },

  setDates: (start, end) => {
    const tripDays = calculateTripDays(start, end);
    set({ startDate: start, endDate: end, tripDays });
  },

  setBudget: (budget) => {
    set((state) => ({
      budget: { ...state.budget, ...budget },
    }));
  },

  setTimings: (timings) => {
    set((state) => ({
      timings: { ...state.timings, ...timings },
    }));
  },

  setTravelMode: (mode) => {
    set({ travelMode: mode });
  },

  toggleInterest: (interest) => {
    set((state) => {
      const interests = state.interests.includes(interest)
        ? state.interests.filter((i) => i !== interest)
        : [...state.interests, interest];

      // Reload popular places when interests change
      if (state.region) {
        setTimeout(() => get().loadPopularPlaces(), 100);
      }

      return { interests };
    });
  },

  addCustomInterest: (interest) => {
    const trimmed = interest.trim();
    if (trimmed && !get().customInterests.includes(trimmed)) {
      set((state) => ({
        customInterests: [...state.customInterests, trimmed],
      }));
    }
  },

  removeCustomInterest: (interest) => {
    set((state) => ({
      customInterests: state.customInterests.filter((i) => i !== interest),
    }));
  },

  // ==================== Place Actions ====================

  searchPlaces: async (query) => {
    set({ searchQuery: query, isSearching: true });

    if (query.length < 2) {
      set({ searchResults: [], isSearching: false });
      return;
    }

    try {
      const results = await searchPlacesInRegion(query, get().region);
      set({ searchResults: results, isSearching: false });
    } catch {
      set({ searchResults: [], isSearching: false });
    }
  },

  addPlace: (place) => {
    set((state) => {
      // Check if already added
      if (state.selectedPlaces.some((p) => p.name.toLowerCase() === place.name.toLowerCase())) {
        return state;
      }
      return {
        selectedPlaces: [...state.selectedPlaces, place],
        searchQuery: '',
        searchResults: [],
      };
    });
  },

  addPlaceFromSuggestion: (suggestion) => {
    const place: PlaceInput = {
      id: suggestion.id || generatePlaceId(),
      name: suggestion.name,
      type: suggestion.type,
      coordinates: suggestion.coordinates,
      description: suggestion.description,
      mustVisit: false,
      suggestedByAI: true,
      confidence: suggestion.confidence,
    };
    get().addPlace(place);
  },

  removePlace: (placeId) => {
    set((state) => ({
      selectedPlaces: state.selectedPlaces.filter((p) => p.id !== placeId),
    }));
  },

  toggleMustVisit: (placeId) => {
    set((state) => ({
      selectedPlaces: state.selectedPlaces.map((p) =>
        p.id === placeId ? { ...p, mustVisit: !p.mustVisit } : p
      ),
    }));
  },

  // ==================== AI Suggestion Actions ====================

  loadPopularPlaces: async () => {
    const { region, interests } = get();
    if (!region) return;

    set({ isLoadingAISuggestions: true });
    try {
      const places = await getPopularPlacesInRegion(region, interests);

      // Filter out already selected places
      const selectedNames = get().selectedPlaces.map((p) => p.name.toLowerCase());
      const filtered = places.filter(
        (p) => !selectedNames.includes(p.name.toLowerCase())
      );

      set({ aiSuggestedPlaces: filtered, isLoadingAISuggestions: false });
    } catch {
      set({ isLoadingAISuggestions: false });
    }
  },

  acceptAISuggestion: (suggestion) => {
    get().addPlaceFromSuggestion(suggestion);

    // Remove from suggestions
    set((state) => ({
      aiSuggestedPlaces: state.aiSuggestedPlaces.filter((s) => s.id !== suggestion.id),
    }));
  },

  dismissAISuggestion: (suggestionId) => {
    set((state) => ({
      aiSuggestedPlaces: state.aiSuggestedPlaces.filter((s) => s.id !== suggestionId),
    }));
  },

  // ==================== Generation Actions ====================

  generateItinerary: async () => {
    const state = get();

    // Validate input
    const validation = validateDirectInput({
      region: state.region,
      regionCoordinates: state.regionCoordinates || undefined,
      startDate: state.startDate,
      endDate: state.endDate,
      budget: state.budget,
      timings: state.timings,
      travelMode: state.travelMode,
      interests: state.interests,
      customInterests: state.customInterests,
      selectedPlaces: state.selectedPlaces,
    });

    if (!validation.valid) {
      set({ generationError: validation.errors.join('. ') });
      return;
    }

    set({
      stage: 'generating',
      isGenerating: true,
      generationError: null,
      generationProgress: null,
    });

    try {
      // Enrich places with coordinates
      const directInput: DirectTripInput = {
        region: state.region,
        regionCoordinates: state.regionCoordinates || undefined,
        startDate: state.startDate,
        endDate: state.endDate,
        budget: state.budget,
        timings: state.timings,
        travelMode: state.travelMode,
        interests: state.interests,
        customInterests: state.customInterests,
        selectedPlaces: state.selectedPlaces,
      };

      const enrichedInput = await enrichPlacesWithCoordinates(directInput);

      // Convert to itinerary input
      const itineraryInput = adaptDirectInputToItinerary(enrichedInput);

      // Generate itinerary with research
      const result = await generateItineraryWithResearch(
        itineraryInput,
        (progress) => {
          set({ generationProgress: progress });
        }
      );

      // Generate trip summary
      const summary = await generateTripSummary(
        state.region,
        calculateTripDays(state.startDate, state.endDate),
        state.interests,
        state.selectedPlaces.map((p) => p.name)
      );

      set({
        generatedItinerary: result.itinerary,
        tripSummary: summary,
        isGenerating: false,
        stage: 'result',
      });

      // Load missed recommendations in background
      get().loadMissedRecommendations();
    } catch (error) {
      console.error('Failed to generate itinerary:', error);
      set({
        isGenerating: false,
        generationError: 'Failed to generate itinerary. Please try again.',
        stage: 'planning',
      });
    }
  },

  loadMissedRecommendations: async () => {
    const state = get();
    if (!state.region || state.selectedPlaces.length === 0) return;

    set({ isLoadingMissedRecommendations: true });

    try {
      const recommendations = await getMissedRecommendations(
        state.region,
        state.selectedPlaces.map((p) => p.name),
        state.interests
      );

      set({
        missedRecommendations: recommendations,
        isLoadingMissedRecommendations: false,
      });
    } catch {
      set({ isLoadingMissedRecommendations: false });
    }
  },

  acceptMissedRecommendation: (id) => {
    set((state) => {
      const rec = state.missedRecommendations.find((r) => r.id === id);
      if (!rec) return state;

      // Add to selected places
      const newPlace: PlaceInput = {
        id: generatePlaceId(),
        name: rec.name,
        type: rec.type,
        coordinates: rec.coordinates,
        description: rec.description,
        mustVisit: false,
        suggestedByAI: true,
      };

      return {
        selectedPlaces: [...state.selectedPlaces, newPlace],
        missedRecommendations: state.missedRecommendations.map((r) =>
          r.id === id ? { ...r, status: 'accepted' as const } : r
        ),
      };
    });
  },

  rejectMissedRecommendation: (id) => {
    set((state) => ({
      missedRecommendations: state.missedRecommendations.map((r) =>
        r.id === id ? { ...r, status: 'rejected' as const } : r
      ),
    }));
  },

  regenerateWithAccepted: async () => {
    // Just regenerate - accepted places are already in selectedPlaces
    await get().generateItinerary();
  },

  // ==================== Navigation Actions ====================

  goToPlanning: () => {
    set({ stage: 'planning' });
  },

  goToResult: () => {
    if (get().generatedItinerary) {
      set({ stage: 'result' });
    }
  },

  // ==================== Edit Itinerary ====================

  removeActivity: (activityId) => {
    const { generatedItinerary } = get();
    if (!generatedItinerary) return;

    const newDays = generatedItinerary.days.map(day => ({
      ...day,
      activities: day.activities.filter(a => a.id !== activityId),
    }));

    set({
      generatedItinerary: {
        ...generatedItinerary,
        days: newDays,
      },
    });
  },

  updateActivityDuration: (activityId, newDuration) => {
    const { generatedItinerary } = get();
    if (!generatedItinerary) return;

    const newDays = generatedItinerary.days.map(day => ({
      ...day,
      activities: day.activities.map(activity => {
        if (activity.id === activityId) {
          // Calculate new end time
          const startMinutes = parseInt(activity.startTime.split(':')[0]) * 60 +
                               parseInt(activity.startTime.split(':')[1]);
          const endMinutes = startMinutes + newDuration;
          const endHours = Math.floor(endMinutes / 60) % 24;
          const endMins = endMinutes % 60;
          const newEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

          return {
            ...activity,
            duration: newDuration,
            endTime: newEndTime,
          };
        }
        return activity;
      }),
    }));

    set({
      generatedItinerary: {
        ...generatedItinerary,
        days: newDays,
      },
    });
  },

  // ==================== Reset ====================

  reset: () => {
    set({
      stage: 'planning',
      region: '',
      regionCoordinates: null,
      startDate: '',
      endDate: '',
      budget: { ...DEFAULT_TRIP_INPUT.budget },
      timings: { ...DEFAULT_TRIP_INPUT.timings },
      travelMode: 'moderate',
      interests: [],
      customInterests: [],
      regionSuggestions: [],
      isLoadingRegionSuggestions: false,
      selectedPlaces: [],
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      aiSuggestedPlaces: [],
      isLoadingAISuggestions: false,
      generatedItinerary: null,
      isGenerating: false,
      generationProgress: null,
      generationError: null,
      tripSummary: null,
      missedRecommendations: [],
      isLoadingMissedRecommendations: false,
    });
  },
}));
