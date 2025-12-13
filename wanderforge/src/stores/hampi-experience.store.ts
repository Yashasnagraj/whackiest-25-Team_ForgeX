import { create } from 'zustand';
import type { Monument } from '../data/hampiMonuments';

// Experience modes
export type ExperienceMode = 'gallery' | 'panorama' | '3d' | 'tour' | null;
export type LightingMode = 'day' | 'night' | 'sunset';
export type CategoryFilter = 'all' | 'temple' | 'palace' | 'monument' | 'viewpoint';

interface HampiExperienceState {
  // Current Experience
  currentMode: ExperienceMode;
  selectedMonument: Monument | null;
  categoryFilter: CategoryFilter;

  // Panorama State
  panoramaRotation: { x: number; y: number };
  panoramaZoom: number;
  autoRotate: boolean;
  showHotspots: boolean;
  activeHotspot: string | null;

  // 3D Viewer State
  lightingMode: LightingMode;
  showAnnotations: boolean;
  modelLoading: boolean;

  // Tour State
  tourProgress: number;
  currentTourStop: number;
  isPlaying: boolean;
  isMuted: boolean;
  isNarrating: boolean;

  // UI State
  showInfoPanel: boolean;
  isFullscreen: boolean;
  isLoading: boolean;
}

interface HampiExperienceActions {
  // Mode Actions
  setMode: (mode: ExperienceMode) => void;
  selectMonument: (monument: Monument | null) => void;
  setCategoryFilter: (filter: CategoryFilter) => void;

  // Panorama Actions
  setPanoramaRotation: (rotation: { x: number; y: number }) => void;
  setPanoramaZoom: (zoom: number) => void;
  toggleAutoRotate: () => void;
  toggleHotspots: () => void;
  setActiveHotspot: (id: string | null) => void;

  // 3D Viewer Actions
  setLightingMode: (mode: LightingMode) => void;
  toggleAnnotations: () => void;
  setModelLoading: (loading: boolean) => void;

  // Tour Actions
  startTour: () => void;
  stopTour: () => void;
  playTour: () => void;
  pauseTour: () => void;
  nextTourStop: () => void;
  prevTourStop: () => void;
  setTourProgress: (progress: number) => void;
  toggleMute: () => void;
  setNarrating: (narrating: boolean) => void;

  // UI Actions
  toggleInfoPanel: () => void;
  toggleFullscreen: () => void;
  setLoading: (loading: boolean) => void;

  // Reset
  reset: () => void;
  exitViewer: () => void;
}

const initialState: HampiExperienceState = {
  // Experience
  currentMode: null,
  selectedMonument: null,
  categoryFilter: 'all',

  // Panorama
  panoramaRotation: { x: 0, y: 0 },
  panoramaZoom: 1,
  autoRotate: true,
  showHotspots: true,
  activeHotspot: null,

  // 3D Viewer
  lightingMode: 'day',
  showAnnotations: true,
  modelLoading: false,

  // Tour
  tourProgress: 0,
  currentTourStop: 0,
  isPlaying: false,
  isMuted: false,
  isNarrating: false,

  // UI
  showInfoPanel: true,
  isFullscreen: false,
  isLoading: false,
};

export const useHampiExperienceStore = create<HampiExperienceState & HampiExperienceActions>(
  (set, get) => ({
    ...initialState,

    // Mode Actions
    setMode: (mode) => set({ currentMode: mode }),

    selectMonument: (monument) =>
      set({
        selectedMonument: monument,
        activeHotspot: null,
        panoramaRotation: { x: 0, y: 0 },
        panoramaZoom: 1,
      }),

    setCategoryFilter: (filter) => set({ categoryFilter: filter }),

    // Panorama Actions
    setPanoramaRotation: (rotation) => set({ panoramaRotation: rotation }),

    setPanoramaZoom: (zoom) =>
      set({ panoramaZoom: Math.max(0.5, Math.min(3, zoom)) }),

    toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),

    toggleHotspots: () => set((state) => ({ showHotspots: !state.showHotspots })),

    setActiveHotspot: (id) => set({ activeHotspot: id }),

    // 3D Viewer Actions
    setLightingMode: (mode) => set({ lightingMode: mode }),

    toggleAnnotations: () =>
      set((state) => ({ showAnnotations: !state.showAnnotations })),

    setModelLoading: (loading) => set({ modelLoading: loading }),

    // Tour Actions
    startTour: () =>
      set({
        currentMode: 'tour',
        currentTourStop: 0,
        tourProgress: 0,
        isPlaying: true,
      }),

    stopTour: () =>
      set({
        currentMode: 'gallery',
        currentTourStop: 0,
        tourProgress: 0,
        isPlaying: false,
        isNarrating: false,
      }),

    playTour: () => set({ isPlaying: true }),

    pauseTour: () => set({ isPlaying: false }),

    nextTourStop: () =>
      set((state) => ({
        currentTourStop: state.currentTourStop + 1,
        tourProgress: 0,
      })),

    prevTourStop: () =>
      set((state) => ({
        currentTourStop: Math.max(0, state.currentTourStop - 1),
        tourProgress: 0,
      })),

    setTourProgress: (progress) => set({ tourProgress: progress }),

    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

    setNarrating: (narrating) => set({ isNarrating: narrating }),

    // UI Actions
    toggleInfoPanel: () =>
      set((state) => ({ showInfoPanel: !state.showInfoPanel })),

    toggleFullscreen: () =>
      set((state) => ({ isFullscreen: !state.isFullscreen })),

    setLoading: (loading) => set({ isLoading: loading }),

    // Reset
    reset: () => set(initialState),

    exitViewer: () =>
      set({
        currentMode: 'gallery',
        selectedMonument: null,
        activeHotspot: null,
        isFullscreen: false,
      }),
  })
);

export default useHampiExperienceStore;
