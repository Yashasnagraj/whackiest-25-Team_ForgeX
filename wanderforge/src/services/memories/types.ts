// ============================================================
// CINEMATIC MEMORIES - TYPE DEFINITIONS
// Netflix-style documentary generator from travel photos
// ============================================================

// ============ PHOTO TYPES ============

export interface UploadedPhoto {
  id: string;
  file: File;
  previewUrl: string;              // Object URL for preview
  base64?: string;                 // Base64 for Gemini API
  status: 'pending' | 'analyzing' | 'analyzed' | 'error';
  error?: string;
}

export interface PhotoExifData {
  timestamp?: Date;
  latitude?: number;
  longitude?: number;
  locationName?: string;           // Reverse geocoded
  camera?: string;
  orientation?: number;
}

export interface PhotoAnalysis {
  photoId: string;

  // Scene Understanding
  sceneDescription: string;        // "A group of friends laughing at a rooftop restaurant"
  sceneType: SceneType;

  // Object Detection (normalized 0-1000 grid from Gemini)
  detectedObjects: DetectedObject[];

  // People & Emotions
  peopleCount: number;
  dominantEmotion: EmotionType;
  emotionConfidence: number;

  // Location/Landmark
  identifiedLandmark?: string;
  landmarkConfidence?: number;

  // Time of Day inference
  timeOfDay: TimeOfDay;
  lighting: LightingType;

  // AI Caption
  caption: string;                 // Short, punchy caption
  storySnippet: string;            // Longer narrative snippet

  // AI-Generated Doodle Texts (contextual humor for speech bubbles)
  doodleTexts: DoodleText[];

  // Doodle Suggestions
  doodleSuggestions: DoodleSuggestion[];

  // Tags for grouping
  tags: string[];
}

export interface DetectedObject {
  label: string;                   // "coffee cup", "dog", "temple"
  confidence: number;              // 0-1
  boundingBox: BoundingBox;
  doodleEligible: boolean;         // Is this good for a doodle?
  suggestedDoodle?: string;        // Doodle ID if eligible
}

export interface BoundingBox {
  // Normalized 0-1000 grid (Gemini format)
  yMin: number;
  xMin: number;
  yMax: number;
  xMax: number;
}

export type EmotionType =
  | 'joy'
  | 'awe'
  | 'peace'
  | 'excitement'
  | 'love'
  | 'nostalgia'
  | 'adventure'
  | 'tired'
  | 'contemplative'
  | 'neutral';

export type SceneType =
  | 'landmark'      // Famous place
  | 'nature'        // Outdoor scenery
  | 'food'          // Restaurant/food shot
  | 'activity'      // Sports, adventure
  | 'portrait'      // People-focused
  | 'group'         // Group photo
  | 'transport'     // Travel (train, plane, car)
  | 'accommodation' // Hotel, camping
  | 'shopping'      // Markets, shops
  | 'nightlife'     // Evening activities
  | 'culture'       // Museum, art
  | 'candid'        // Unposed moment
  | 'scenic';       // General scenic view

export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
export type LightingType = 'natural' | 'artificial' | 'golden-hour' | 'blue-hour' | 'mixed';

// ============ DOODLE TYPES ============

// AI-generated contextual text for doodles (not hardcoded!)
export interface DoodleText {
  forObject: string;               // "coffee", "temple", "person"
  text: string;                    // AI-generated: "That chai looks heavenly!"
  position?: { x: number; y: number }; // Optional position hint
}

export interface DoodleSuggestion {
  doodleId: string;
  targetObject: string;            // Object label to attach to
  position: { x: number; y: number };
  animation: AnimationType;
  text?: string;                   // Optional text for speech bubbles
}

export type AnimationType =
  | 'pop-in'        // Scale from 0
  | 'draw'          // SVG stroke animation
  | 'bounce'        // Bouncy entrance
  | 'wiggle'        // Continuous wiggle
  | 'sparkle'       // Sparkle effect
  | 'fade-in';      // Simple fade

export interface DoodleAsset {
  id: string;
  name: string;
  svgPath: string;                 // SVG path data
  category: string;                // 'love', 'sparkle', 'speech', etc.
  color: string;                   // Default fill color
  defaultScale: number;
  animation: AnimationType;
  keywords: string[];              // Objects/emotions this doodle matches
  text?: string;                   // Text for speech bubbles
}

export interface PlacedDoodle {
  id: string;
  doodleId: string;                // Reference to DoodleAsset
  x: number;                       // Position X (percentage 0-100)
  y: number;                       // Position Y (percentage 0-100)
  scale: number;
  rotation: number;                // Degrees
  animation: AnimationType;
  delay: number;                   // Delay in seconds before appearing
  text?: string;                   // Text for speech bubbles
}

// ============ SCENE & STORY TYPES ============

export interface ProcessedPhoto extends UploadedPhoto {
  exif: PhotoExifData;
  analysis: PhotoAnalysis;
  doodles: PlacedDoodle[];
  kenBurnsConfig?: KenBurnsConfig;
}

export interface MemoryScene {
  id: string;
  title: string;                   // "Dawn Awakening"
  photos: ProcessedPhoto[];
  narration: string;               // Netflix-style narration
  duration: number;                // Seconds
  emotionalArc: EmotionalArcPoint;
  transition: TransitionType;
}

export interface KenBurnsConfig {
  startScale: number;              // e.g., 1.0
  endScale: number;                // e.g., 1.2
  startX: number;                  // Pan start X (percentage 0-100)
  startY: number;                  // Pan start Y (percentage 0-100)
  endX: number;                    // Pan end X
  endY: number;                    // Pan end Y
  duration: number;                // Seconds
  easing: string;                  // CSS easing function
  focusPoint?: { x: number; y: number }; // Detected focus point
}

export interface EmotionalArcPoint {
  position: number;                // 0-1 position in story
  intensity: number;               // 0-1 emotional intensity
  emotion: EmotionType;
}

export type TransitionType =
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'zoom'
  | 'dissolve'
  | 'wipe';

// ============ STORY GENERATION TYPES ============

export interface GeneratedStory {
  id: string;
  title: string;                   // "A Weekend in Hampi"
  tagline: string;                 // "Where ancient stones whispered stories"
  scenes: MemoryScene[];
  totalDuration: number;
  createdAt: Date;
  locations: string[];
  dateRange?: { start: Date; end: Date };
}

// ============ ANALYSIS PROGRESS ============

export interface AnalysisProgress {
  current: number;
  total: number;
}

export type AnalysisStage =
  | 'idle'
  | 'uploading'
  | 'analyzing'
  | 'generating'
  | 'complete'
  | 'error';

// ============ STORE STATE ============

export interface CinematicMemoriesState {
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

  // Actions
  addPhotos: (photos: UploadedPhoto[]) => void;
  removePhoto: (id: string) => void;
  setAnalysisStage: (stage: AnalysisStage) => void;
  setAnalysisProgress: (progress: AnalysisProgress) => void;
  setAnalysisMessage: (message: string) => void;
  setCurrentDetections: (detections: string[]) => void;
  setProcessedPhotos: (photos: ProcessedPhoto[]) => void;
  setScenes: (scenes: MemoryScene[]) => void;
  setGeneratedStory: (story: GeneratedStory) => void;
  play: () => void;
  pause: () => void;
  nextScene: () => void;
  prevScene: () => void;
  setCurrentScene: (index: number) => void;
  toggleDoodles: () => void;
  reset: () => void;
}

// ============ EMOTION CONFIG ============

export const EMOTION_CONFIG: Record<EmotionType, { color: string; icon: string; label: string }> = {
  joy: { color: '#fbbf24', icon: '😊', label: 'Joy' },
  awe: { color: '#8b5cf6', icon: '🤩', label: 'Awe' },
  peace: { color: '#60a5fa', icon: '😌', label: 'Peace' },
  excitement: { color: '#f472b6', icon: '🎉', label: 'Excitement' },
  love: { color: '#ef4444', icon: '❤️', label: 'Love' },
  nostalgia: { color: '#a78bfa', icon: '🥹', label: 'Nostalgia' },
  adventure: { color: '#f97316', icon: '🏔️', label: 'Adventure' },
  tired: { color: '#94a3b8', icon: '😴', label: 'Tired' },
  contemplative: { color: '#6366f1', icon: '🤔', label: 'Contemplative' },
  neutral: { color: '#9ca3af', icon: '😐', label: 'Neutral' },
};

// ============ SCENE TYPE CONFIG ============

export const SCENE_TYPE_CONFIG: Record<SceneType, { color: string; icon: string; label: string }> = {
  landmark: { color: '#8b5cf6', icon: '🏛️', label: 'Landmark' },
  nature: { color: '#10b981', icon: '🌿', label: 'Nature' },
  food: { color: '#f59e0b', icon: '🍜', label: 'Food' },
  activity: { color: '#ec4899', icon: '🎯', label: 'Activity' },
  portrait: { color: '#3b82f6', icon: '👤', label: 'Portrait' },
  group: { color: '#06b6d4', icon: '👥', label: 'Group' },
  transport: { color: '#64748b', icon: '🚂', label: 'Transport' },
  accommodation: { color: '#a855f7', icon: '🏨', label: 'Accommodation' },
  shopping: { color: '#f472b6', icon: '🛍️', label: 'Shopping' },
  nightlife: { color: '#7c3aed', icon: '🌙', label: 'Nightlife' },
  culture: { color: '#be185d', icon: '🎭', label: 'Culture' },
  candid: { color: '#14b8a6', icon: '📸', label: 'Candid' },
  scenic: { color: '#22c55e', icon: '🌅', label: 'Scenic' },
};
