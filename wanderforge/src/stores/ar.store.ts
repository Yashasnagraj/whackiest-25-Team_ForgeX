import { create } from 'zustand';

// AR tracking states
export type ARTrackingState = 'initializing' | 'scanning' | 'tracking' | 'lost';

// Hotspot data for Taj Mahal
export interface ARHotspot {
  id: string;
  label: string;
  description: string;
  position: [number, number, number];
}

interface ARState {
  // Tracking State
  trackingState: ARTrackingState;
  isARSupported: boolean;
  cameraPermission: 'pending' | 'granted' | 'denied';

  // Model State
  modelScale: number;
  modelRotation: number;
  isModelLoaded: boolean;

  // Interaction State
  selectedHotspot: ARHotspot | null;
  showHotspots: boolean;
  showInfoPanel: boolean;
  showMarkerModal: boolean;

  // UI State
  showInstructions: boolean;
  errorMessage: string | null;
}

interface ARActions {
  // Tracking Actions
  setTrackingState: (state: ARTrackingState) => void;
  setARSupported: (supported: boolean) => void;
  setCameraPermission: (permission: 'pending' | 'granted' | 'denied') => void;

  // Model Actions
  setModelScale: (scale: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  rotateModel: (angle: number) => void;
  setModelLoaded: (loaded: boolean) => void;

  // Interaction Actions
  selectHotspot: (hotspot: ARHotspot | null) => void;
  toggleHotspots: () => void;
  toggleInfoPanel: () => void;
  toggleMarkerModal: () => void;

  // UI Actions
  dismissInstructions: () => void;
  setError: (message: string | null) => void;

  // Reset
  reset: () => void;
}

// Taj Mahal hotspots data
export const tajMahalHotspots: ARHotspot[] = [
  {
    id: 'dome',
    label: 'Main Dome',
    description: 'The iconic 73-meter high white marble dome, often called the "onion dome" due to its shape. It symbolizes heaven and is crowned by a gilded finial.',
    position: [0, 2.5, 0],
  },
  {
    id: 'minarets',
    label: 'Four Minarets',
    description: 'Four 40-meter tall minarets frame the tomb. They are slightly tilted outward so that if they fell, they would fall away from the tomb.',
    position: [1.5, 1.5, 0],
  },
  {
    id: 'entrance',
    label: 'Main Gateway',
    description: 'The grand red sandstone gateway (Darwaza-i-Rauza) features intricate Quranic calligraphy and serves as a frame for the first view of the Taj Mahal.',
    position: [0, 0.5, 2],
  },
  {
    id: 'garden',
    label: 'Charbagh Garden',
    description: 'The Persian-style garden is divided into four parts by waterways, symbolizing the four rivers of Paradise described in the Quran.',
    position: [0, 0, 1.5],
  },
  {
    id: 'pietra-dura',
    label: 'Pietra Dura',
    description: 'Intricate inlay work using semi-precious stones like lapis lazuli, jade, crystal, and turquoise creating floral and calligraphic patterns.',
    position: [-1, 1, 0],
  },
];

const initialState: ARState = {
  // Tracking
  trackingState: 'initializing',
  isARSupported: true,
  cameraPermission: 'pending',

  // Model
  modelScale: 1,
  modelRotation: 0,
  isModelLoaded: false,

  // Interaction
  selectedHotspot: null,
  showHotspots: true,
  showInfoPanel: false,
  showMarkerModal: false,

  // UI
  showInstructions: true,
  errorMessage: null,
};

export const useARStore = create<ARState & ARActions>((set, get) => ({
  ...initialState,

  // Tracking Actions
  setTrackingState: (trackingState) => set({ trackingState }),
  setARSupported: (isARSupported) => set({ isARSupported }),
  setCameraPermission: (cameraPermission) => set({ cameraPermission }),

  // Model Actions
  setModelScale: (scale) => set({ modelScale: Math.max(0.3, Math.min(3, scale)) }),

  zoomIn: () => set((state) => ({
    modelScale: Math.min(3, state.modelScale + 0.2)
  })),

  zoomOut: () => set((state) => ({
    modelScale: Math.max(0.3, state.modelScale - 0.2)
  })),

  rotateModel: (angle) => set((state) => ({
    modelRotation: (state.modelRotation + angle) % 360
  })),

  setModelLoaded: (isModelLoaded) => set({ isModelLoaded }),

  // Interaction Actions
  selectHotspot: (hotspot) => set({
    selectedHotspot: hotspot,
    showInfoPanel: hotspot !== null
  }),

  toggleHotspots: () => set((state) => ({ showHotspots: !state.showHotspots })),
  toggleInfoPanel: () => set((state) => ({ showInfoPanel: !state.showInfoPanel })),
  toggleMarkerModal: () => set((state) => ({ showMarkerModal: !state.showMarkerModal })),

  // UI Actions
  dismissInstructions: () => set({ showInstructions: false }),
  setError: (errorMessage) => set({ errorMessage }),

  // Reset
  reset: () => set(initialState),
}));

export default useARStore;
