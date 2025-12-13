// Itinerary Zustand Store (V3 with Research Pipeline)
import { create } from 'zustand';
import type { ChatExtractionResult } from '../services/ai/types';
import type {
  GeneratedItinerary,
  ItineraryInput,
  DayItinerary,
  ScheduledActivity,
} from '../services/itinerary/types';
import type { PlaceKnowledge, ResearchProgress } from '../services/itinerary/place-research.types';
import {
  generateItinerary,
  estimateItinerary,
  regenerateDay,
  generateItineraryWithResearch,
  shouldUseResearchPipeline,
} from '../services/itinerary/builder';

interface ItineraryState {
  // Source data from Signal-Cleanse
  extractionSource: ChatExtractionResult | null;
  setExtractionSource: (extraction: ChatExtractionResult | null) => void;

  // Generated itinerary
  generatedItinerary: GeneratedItinerary | null;

  // Research state (NEW - V3)
  researchedPlaces: PlaceKnowledge[];
  isResearching: boolean;
  researchProgress: ResearchProgress | null;
  useResearchPipeline: boolean; // Toggle for research mode

  // Generation state
  isGenerating: boolean;
  generationStage: string;
  generationProgress: number;

  // UI state
  selectedDay: number | undefined;
  selectedActivityId: string | null;
  mapView: 'route' | 'cluster';

  // Estimate (quick preview before generation)
  estimate: {
    numDays: number;
    numPlaces: number;
    hasAccommodation: boolean;
    estimatedDistance: number;
  } | null;

  // Actions
  generateFromExtraction: () => Promise<void>;
  generateWithResearch: () => Promise<void>; // NEW - V3
  updateEstimate: () => void;
  selectDay: (day: number | undefined) => void;
  selectActivity: (activityId: string | null) => void;
  setMapView: (view: 'route' | 'cluster') => void;
  setUseResearchPipeline: (use: boolean) => void; // NEW - V3

  // Editing actions
  moveActivity: (activityId: string, toDay: number) => void;
  removeActivity: (activityId: string) => void;
  regenerateDayItinerary: (dayNumber: number) => void;

  // Reset
  reset: () => void;
}

export const useItineraryStore = create<ItineraryState>((set, get) => ({
  // Initial state
  extractionSource: null,
  setExtractionSource: (extraction) => {
    set({ extractionSource: extraction });
    // Auto-update estimate when source changes
    if (extraction) {
      get().updateEstimate();
    }
  },

  generatedItinerary: null,

  // Research state (NEW - V3)
  researchedPlaces: [],
  isResearching: false,
  researchProgress: null,
  useResearchPipeline: true, // Default to research pipeline

  isGenerating: false,
  generationStage: '',
  generationProgress: 0,

  selectedDay: undefined,
  selectedActivityId: null,
  mapView: 'route',

  estimate: null,

  // Toggle research pipeline
  setUseResearchPipeline: (use) => set({ useResearchPipeline: use }),

  // Actions - Legacy generation (fast, no research)
  generateFromExtraction: async () => {
    const { extractionSource, useResearchPipeline } = get();
    if (!extractionSource) return;

    // If research pipeline is enabled, use that instead
    if (useResearchPipeline) {
      return get().generateWithResearch();
    }

    set({
      isGenerating: true,
      generationStage: 'Preparing data...',
      generationProgress: 10,
    });

    try {
      // Build input from extraction
      const input: ItineraryInput = {
        places: extractionSource.places,
        dates: {
          start: extractionSource.dates[0]?.value || new Date().toISOString().split('T')[0],
          end: extractionSource.dates[1]?.value ||
            extractionSource.dates[0]?.value ||
            new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        budget: extractionSource.budget
          ? {
              total: extractionSource.budget.amount,
              currency: extractionSource.budget.currency,
              perPerson: extractionSource.budget.perPerson,
            }
          : null,
        members: extractionSource.members,
      };

      set({
        generationStage: 'Clustering places...',
        generationProgress: 30,
      });

      await new Promise(r => setTimeout(r, 300));

      set({
        generationStage: 'Optimizing routes...',
        generationProgress: 50,
      });

      await new Promise(r => setTimeout(r, 300));

      set({
        generationStage: 'Scheduling activities...',
        generationProgress: 70,
      });

      // Generate the itinerary
      const itinerary = await generateItinerary(input);

      set({
        generationStage: 'Finalizing...',
        generationProgress: 90,
      });

      await new Promise(r => setTimeout(r, 200));

      set({
        generatedItinerary: itinerary,
        isGenerating: false,
        generationStage: 'Complete',
        generationProgress: 100,
      });
    } catch (error) {
      console.error('Failed to generate itinerary:', error);
      set({
        isGenerating: false,
        generationStage: 'Error generating itinerary',
        generationProgress: 0,
      });
    }
  },

  // NEW V3: Generate with research pipeline
  generateWithResearch: async () => {
    const { extractionSource } = get();
    if (!extractionSource) return;

    set({
      isGenerating: true,
      isResearching: true,
      generationStage: 'Starting research...',
      generationProgress: 5,
      researchProgress: null,
    });

    try {
      // Build input from extraction
      const input: ItineraryInput = {
        places: extractionSource.places,
        dates: {
          start: extractionSource.dates[0]?.value || new Date().toISOString().split('T')[0],
          end: extractionSource.dates[1]?.value ||
            extractionSource.dates[0]?.value ||
            new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        budget: extractionSource.budget
          ? {
              total: extractionSource.budget.amount,
              currency: extractionSource.budget.currency,
              perPerson: extractionSource.budget.perPerson,
            }
          : null,
        members: extractionSource.members,
      };

      // Generate with research pipeline - provides progress callbacks
      const { itinerary, knowledge } = await generateItineraryWithResearch(
        input,
        (progress: ResearchProgress) => {
          // Update UI with research progress
          set({
            researchProgress: progress,
            generationStage: progress.message,
            generationProgress: Math.min(80, 5 + progress.percent * 0.75), // 5-80% for research
          });
        }
      );

      set({
        isResearching: false,
        generationStage: 'Building itinerary...',
        generationProgress: 85,
      });

      await new Promise(r => setTimeout(r, 200));

      set({
        generationStage: 'Finalizing...',
        generationProgress: 95,
      });

      await new Promise(r => setTimeout(r, 200));

      set({
        generatedItinerary: itinerary,
        researchedPlaces: knowledge,
        isGenerating: false,
        isResearching: false,
        generationStage: 'Complete',
        generationProgress: 100,
        researchProgress: null,
      });

      console.log(`[Store] Itinerary generated with ${knowledge.length} researched places`);
    } catch (error) {
      console.error('Failed to generate itinerary with research:', error);
      set({
        isGenerating: false,
        isResearching: false,
        generationStage: 'Error during research',
        generationProgress: 0,
        researchProgress: null,
      });
    }
  },

  updateEstimate: () => {
    const { extractionSource } = get();
    if (!extractionSource) {
      set({ estimate: null });
      return;
    }

    const input: ItineraryInput = {
      places: extractionSource.places,
      dates: {
        start: extractionSource.dates[0]?.value || new Date().toISOString().split('T')[0],
        end: extractionSource.dates[1]?.value ||
          extractionSource.dates[0]?.value ||
          new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      budget: extractionSource.budget
        ? {
            total: extractionSource.budget.amount,
            currency: extractionSource.budget.currency,
            perPerson: extractionSource.budget.perPerson,
          }
        : null,
      members: extractionSource.members,
    };

    const estimate = estimateItinerary(input);
    set({ estimate });
  },

  selectDay: (day) => set({ selectedDay: day }),
  selectActivity: (activityId) => set({ selectedActivityId: activityId }),
  setMapView: (view) => set({ mapView: view }),

  // Editing actions
  moveActivity: (activityId, toDay) => {
    const { generatedItinerary } = get();
    if (!generatedItinerary) return;

    const newDays = generatedItinerary.days.map(day => ({
      ...day,
      activities: [...day.activities],
    }));

    // Find and remove activity from source day
    let movedActivity: ScheduledActivity | null = null;
    for (const day of newDays) {
      const idx = day.activities.findIndex(a => a.id === activityId);
      if (idx !== -1) {
        movedActivity = day.activities.splice(idx, 1)[0];
        break;
      }
    }

    if (movedActivity) {
      // Add to target day
      const targetDay = newDays.find(d => d.day === toDay);
      if (targetDay) {
        movedActivity.day = toDay;
        targetDay.activities.push(movedActivity);

        // Re-sort by time
        targetDay.activities.sort((a, b) => {
          const timeA = parseInt(a.startTime.replace(':', ''));
          const timeB = parseInt(b.startTime.replace(':', ''));
          return timeA - timeB;
        });
      }
    }

    set({
      generatedItinerary: {
        ...generatedItinerary,
        days: newDays,
      },
    });
  },

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

  regenerateDayItinerary: (dayNumber) => {
    const { generatedItinerary } = get();
    if (!generatedItinerary) return;

    const day = generatedItinerary.days.find(d => d.day === dayNumber);
    if (!day) return;

    // Get places from this day's visits
    const places = day.activities
      .filter(a => a.type === 'visit')
      .map(a => a.place);

    // Regenerate just this day
    const newDay = regenerateDay(generatedItinerary, dayNumber, places);

    const newDays = generatedItinerary.days.map(d =>
      d.day === dayNumber ? newDay : d
    );

    set({
      generatedItinerary: {
        ...generatedItinerary,
        days: newDays,
      },
    });
  },

  reset: () => set({
    extractionSource: null,
    generatedItinerary: null,
    researchedPlaces: [],
    isResearching: false,
    researchProgress: null,
    isGenerating: false,
    generationStage: '',
    generationProgress: 0,
    selectedDay: undefined,
    selectedActivityId: null,
    mapView: 'route',
    estimate: null,
  }),
}));
