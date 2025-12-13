import { create } from 'zustand';
import type {
  UploadedPhoto,
  ProcessedPhoto,
  MemoryScene,
  GeneratedStory,
  AnalysisProgress,
  AnalysisStage,
} from '../services/memories/types';

interface CinematicMemoriesState {
  // Upload State
  uploadedPhotos: UploadedPhoto[];

  // Analysis State
  analysisStage: AnalysisStage;
  analysisProgress: AnalysisProgress;
  analysisMessage: string;
  currentDetections: string[];
  processedPhotos: ProcessedPhoto[];

  // Story State
  generatedStory: GeneratedStory | null;
  scenes: MemoryScene[];

  // Playback State
  isPlaying: boolean;
  currentSceneIndex: number;
  currentPhotoIndex: number;
  showDoodles: boolean;
}

interface CinematicMemoriesActions {
  // Upload Actions
  addPhotos: (photos: UploadedPhoto[]) => void;
  removePhoto: (id: string) => void;
  clearPhotos: () => void;

  // Analysis Actions
  setAnalysisStage: (stage: AnalysisStage) => void;
  setAnalysisProgress: (progress: AnalysisProgress) => void;
  setAnalysisMessage: (message: string) => void;
  setCurrentDetections: (detections: string[]) => void;
  setProcessedPhotos: (photos: ProcessedPhoto[]) => void;

  // Story Actions
  setGeneratedStory: (story: GeneratedStory) => void;
  setScenes: (scenes: MemoryScene[]) => void;

  // Playback Actions
  play: () => void;
  pause: () => void;
  nextScene: () => void;
  prevScene: () => void;
  setCurrentScene: (index: number) => void;
  toggleDoodles: () => void;

  // Reset
  reset: () => void;
}

const initialState: CinematicMemoriesState = {
  // Upload
  uploadedPhotos: [],

  // Analysis
  analysisStage: 'idle',
  analysisProgress: { current: 0, total: 0 },
  analysisMessage: '',
  currentDetections: [],
  processedPhotos: [],

  // Story
  generatedStory: null,
  scenes: [],

  // Playback
  isPlaying: false,
  currentSceneIndex: 0,
  currentPhotoIndex: 0,
  showDoodles: true,
};

export const useCinematicMemoriesStore = create<CinematicMemoriesState & CinematicMemoriesActions>(
  (set, get) => ({
    ...initialState,

    // ========== UPLOAD ACTIONS ==========

    addPhotos: (photos: UploadedPhoto[]) => {
      set((state) => ({
        uploadedPhotos: [...state.uploadedPhotos, ...photos],
      }));
    },

    removePhoto: (id: string) => {
      set((state) => {
        const photo = state.uploadedPhotos.find((p) => p.id === id);
        if (photo?.previewUrl) {
          URL.revokeObjectURL(photo.previewUrl);
        }
        return {
          uploadedPhotos: state.uploadedPhotos.filter((p) => p.id !== id),
          processedPhotos: state.processedPhotos.filter((p) => p.id !== id),
        };
      });
    },

    clearPhotos: () => {
      const { uploadedPhotos } = get();
      uploadedPhotos.forEach((photo) => {
        if (photo.previewUrl) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      });
      set({
        uploadedPhotos: [],
        processedPhotos: [],
        scenes: [],
        generatedStory: null,
        analysisStage: 'idle',
        analysisProgress: { current: 0, total: 0 },
      });
    },

    // ========== ANALYSIS ACTIONS ==========

    setAnalysisStage: (stage: AnalysisStage) => {
      set({ analysisStage: stage });
    },

    setAnalysisProgress: (progress: AnalysisProgress) => {
      set({ analysisProgress: progress });
    },

    setAnalysisMessage: (message: string) => {
      set({ analysisMessage: message });
    },

    setCurrentDetections: (detections: string[]) => {
      set({ currentDetections: detections });
    },

    setProcessedPhotos: (photos: ProcessedPhoto[]) => {
      set({ processedPhotos: photos });
    },

    // ========== STORY ACTIONS ==========

    setGeneratedStory: (story: GeneratedStory) => {
      set({ generatedStory: story });
    },

    setScenes: (scenes: MemoryScene[]) => {
      set({ scenes });
    },

    // ========== PLAYBACK ACTIONS ==========

    play: () => set({ isPlaying: true }),

    pause: () => set({ isPlaying: false }),

    nextScene: () => {
      set((state) => {
        const nextIndex = state.currentSceneIndex + 1;
        if (nextIndex < state.scenes.length) {
          return {
            currentSceneIndex: nextIndex,
            currentPhotoIndex: 0,
          };
        }
        // End of documentary
        return { isPlaying: false };
      });
    },

    prevScene: () => {
      set((state) => {
        const prevIndex = Math.max(0, state.currentSceneIndex - 1);
        return {
          currentSceneIndex: prevIndex,
          currentPhotoIndex: 0,
        };
      });
    },

    setCurrentScene: (index: number) => {
      set({
        currentSceneIndex: index,
        currentPhotoIndex: 0,
      });
    },

    toggleDoodles: () => set((state) => ({ showDoodles: !state.showDoodles })),

    // ========== RESET ==========

    reset: () => {
      const { uploadedPhotos } = get();
      uploadedPhotos.forEach((photo) => {
        if (photo.previewUrl) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      });
      set(initialState);
    },
  })
);

// Selectors for common derived state
export const selectCurrentScene = (state: CinematicMemoriesState) =>
  state.scenes[state.currentSceneIndex] || null;

export const selectCurrentPhoto = (state: CinematicMemoriesState) => {
  const scene = state.scenes[state.currentSceneIndex];
  return scene?.photos[state.currentPhotoIndex] || null;
};

export const selectIsAnalyzing = (state: CinematicMemoriesState) =>
  state.analysisStage === 'analyzing' || state.analysisStage === 'generating';

export const selectHasContent = (state: CinematicMemoriesState) =>
  state.scenes.length > 0 && state.generatedStory !== null;
