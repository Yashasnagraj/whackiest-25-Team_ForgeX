// ============================================================
// SCENE GROUPER - ULTRATHINK EDITION
// Groups photos into narrative scenes
// Uses AI for titles - NO TEMPLATES
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import type { ProcessedPhoto, MemoryScene, EmotionalArcPoint, TransitionType, EmotionType } from './types';
import { geminiVision } from './gemini-vision.service';

// Configuration
const MAX_TIME_GAP_MINUTES = 120; // Photos more than 2 hours apart = new scene
const MAX_PHOTOS_PER_SCENE = 4;
const MIN_PHOTOS_PER_SCENE = 1;

/**
 * Group processed photos into narrative scenes
 * Scene titles are AI-generated from actual content
 */
export async function groupPhotosIntoScenes(photos: ProcessedPhoto[]): Promise<MemoryScene[]> {
  if (photos.length === 0) return [];

  // Sort by timestamp (EXIF or file modified time)
  const sortedPhotos = [...photos].sort((a, b) => {
    const timeA = a.exif.timestamp?.getTime() || a.file.lastModified || 0;
    const timeB = b.exif.timestamp?.getTime() || b.file.lastModified || 0;
    return timeA - timeB;
  });

  // Group by time proximity
  const timeGroups = groupByTimestamp(sortedPhotos);

  // Further split large groups by content/location
  const scenes: MemoryScene[] = [];

  for (const group of timeGroups) {
    const subGroups = splitByContent(group);

    for (const subGroup of subGroups) {
      const scene = await createScene(subGroup, scenes.length);
      scenes.push(scene);
    }
  }

  // Calculate emotional arc for each scene
  scenes.forEach((scene, index) => {
    scene.emotionalArc = calculateEmotionalArcPoint(scene, index, scenes.length);
    scene.transition = selectTransition(scene, scenes[index + 1]);
  });

  return scenes;
}

/**
 * Group photos by time proximity
 */
function groupByTimestamp(photos: ProcessedPhoto[]): ProcessedPhoto[][] {
  if (photos.length === 0) return [];

  const groups: ProcessedPhoto[][] = [];
  let currentGroup: ProcessedPhoto[] = [photos[0]];

  for (let i = 1; i < photos.length; i++) {
    const prevPhoto = photos[i - 1];
    const currPhoto = photos[i];

    const prevTime = prevPhoto.exif.timestamp?.getTime() || prevPhoto.file.lastModified || 0;
    const currTime = currPhoto.exif.timestamp?.getTime() || currPhoto.file.lastModified || 0;

    const gapMinutes = (currTime - prevTime) / (1000 * 60);

    if (gapMinutes > MAX_TIME_GAP_MINUTES) {
      // New group
      groups.push(currentGroup);
      currentGroup = [currPhoto];
    } else {
      currentGroup.push(currPhoto);
    }
  }

  // Don't forget the last group
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Split a group further by content type or location
 */
function splitByContent(photos: ProcessedPhoto[]): ProcessedPhoto[][] {
  if (photos.length <= MAX_PHOTOS_PER_SCENE) {
    return [photos];
  }

  const subGroups: ProcessedPhoto[][] = [];
  let currentSubGroup: ProcessedPhoto[] = [];
  let lastSceneType = photos[0].analysis.sceneType;

  for (const photo of photos) {
    const sceneTypeChanged = photo.analysis.sceneType !== lastSceneType;
    const groupFull = currentSubGroup.length >= MAX_PHOTOS_PER_SCENE;

    if ((sceneTypeChanged || groupFull) && currentSubGroup.length >= MIN_PHOTOS_PER_SCENE) {
      subGroups.push(currentSubGroup);
      currentSubGroup = [];
    }

    currentSubGroup.push(photo);
    lastSceneType = photo.analysis.sceneType;
  }

  // Don't forget the last subgroup
  if (currentSubGroup.length > 0) {
    subGroups.push(currentSubGroup);
  }

  return subGroups;
}

/**
 * Create a scene from a group of photos
 * Title is generated from ACTUAL CONTENT - no templates!
 */
async function createScene(
  photos: ProcessedPhoto[],
  totalScenesSoFar: number
): Promise<MemoryScene> {
  const sceneNumber = totalScenesSoFar + 1;

  // Generate scene title from ACTUAL content (AI or landmark-based)
  const title = await generateSceneTitle(photos, sceneNumber);

  // Calculate duration based on photo count and content
  const duration = calculateSceneDuration(photos);

  // Generate placeholder narration from AI photo analysis (not templates)
  const narration = generateInitialNarration(photos);

  // Calculate dominant emotion
  const dominantEmotion = getDominantEmotion(photos);

  return {
    id: uuidv4(),
    title,
    photos,
    narration,
    duration,
    emotionalArc: {
      position: 0,
      intensity: 0.5,
      emotion: dominantEmotion,
    },
    transition: 'fade',
  };
}

/**
 * Generate scene title from ACTUAL CONTENT
 * Priority: 1. Detected landmark 2. AI-generated 3. Descriptive fallback
 */
async function generateSceneTitle(photos: ProcessedPhoto[], sceneNumber: number): Promise<string> {
  const analyses = photos.map((p) => p.analysis);

  // Priority 1: Use actual detected landmark if available
  const landmark = photos.find((p) => p.analysis.identifiedLandmark)?.analysis.identifiedLandmark;
  if (landmark) {
    const timeOfDay = photos[0]?.analysis.timeOfDay || 'day';
    const capitalizedTime = timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);
    return `${landmark} at ${capitalizedTime}`;
  }

  // Priority 2: Try AI-generated title
  try {
    const aiTitle = await geminiVision.generateSceneTitle(analyses);
    if (aiTitle && aiTitle.length > 2 && aiTitle !== 'Scene' && aiTitle !== 'Untitled Scene') {
      return aiTitle;
    }
  } catch (error) {
    console.warn('AI title generation failed, using fallback');
  }

  // Priority 3: Build descriptive title from detected content
  const sceneTypes = photos.map((p) => p.analysis.sceneType);
  const dominantType = getMostCommon(sceneTypes);
  const timeOfDay = photos[0]?.analysis.timeOfDay || 'day';

  // Build title from actual scene type + time
  const typeLabels: Record<string, string> = {
    food: 'Culinary Discovery',
    landmark: 'Heritage Exploration',
    nature: 'Nature Encounter',
    group: 'Friends Together',
    activity: 'Adventure Time',
    portrait: 'Portrait Moment',
    scenic: 'Scenic View',
    transport: 'On the Move',
    accommodation: 'Rest Stop',
    shopping: 'Market Finds',
    nightlife: 'Night Out',
    culture: 'Cultural Immersion',
    candid: 'Candid Capture',
  };

  const typeLabel = typeLabels[dominantType] || 'Scene';
  return `${typeLabel} ${sceneNumber}`;
}

/**
 * Calculate scene duration based on content
 */
function calculateSceneDuration(photos: ProcessedPhoto[]): number {
  const basePerPhoto = 7; // 7 seconds per photo
  const photoCount = photos.length;

  // Adjust for content type
  const hasLandmark = photos.some((p) => p.analysis.identifiedLandmark);
  const hasGroup = photos.some((p) => p.analysis.sceneType === 'group');

  let multiplier = 1.0;
  if (hasLandmark) multiplier += 0.2; // Landmarks deserve more time
  if (hasGroup) multiplier += 0.1; // Group photos too

  return Math.round(photoCount * basePerPhoto * multiplier);
}

/**
 * Generate initial narration from AI photo analysis (not templates)
 */
function generateInitialNarration(photos: ProcessedPhoto[]): string {
  // Use the AI-generated story snippets from individual photos
  const snippets = photos
    .map((p) => p.analysis.storySnippet)
    .filter((s) => s && s.length > 20 && !s.includes('unavailable'));

  if (snippets.length > 0) {
    // Combine top snippets (these are AI-generated per photo)
    return snippets.slice(0, 2).join(' ');
  }

  // Use scene descriptions as fallback (also AI-generated)
  const descriptions = photos
    .map((p) => p.analysis.sceneDescription)
    .filter((d) => d && d.length > 20 && !d.includes('unavailable'));

  if (descriptions.length > 0) {
    return descriptions.slice(0, 2).join('. ');
  }

  return 'Narration will be generated...';
}

/**
 * Get the dominant emotion from photos
 */
function getDominantEmotion(photos: ProcessedPhoto[]): EmotionType {
  const emotions = photos.map((p) => p.analysis.dominantEmotion);
  return getMostCommon(emotions) as EmotionType;
}

/**
 * Calculate emotional arc point for a scene
 */
function calculateEmotionalArcPoint(
  scene: MemoryScene,
  sceneIndex: number,
  totalScenes: number
): EmotionalArcPoint {
  const position = totalScenes > 1 ? sceneIndex / (totalScenes - 1) : 0.5;

  // Calculate intensity based on emotions
  const emotionIntensity: Record<EmotionType, number> = {
    joy: 0.9,
    excitement: 0.95,
    awe: 0.85,
    love: 0.8,
    adventure: 0.9,
    peace: 0.5,
    nostalgia: 0.6,
    contemplative: 0.4,
    tired: 0.2,
    neutral: 0.5,
  };

  const emotions = scene.photos.map((p) => p.analysis.dominantEmotion);
  const dominantEmotion = getMostCommon(emotions) as EmotionType;
  const intensity = emotionIntensity[dominantEmotion] || 0.5;

  return {
    position,
    intensity,
    emotion: dominantEmotion,
  };
}

/**
 * Select transition type between scenes
 */
function selectTransition(currentScene: MemoryScene, nextScene?: MemoryScene): TransitionType {
  if (!nextScene) return 'fade';

  const currentEmotion = currentScene.emotionalArc.emotion;
  const nextEmotion = nextScene.emotionalArc.emotion;

  // Dramatic emotion shift = zoom transition
  if (
    (currentEmotion === 'peace' && nextEmotion === 'excitement') ||
    (currentEmotion === 'tired' && nextEmotion === 'joy')
  ) {
    return 'zoom';
  }

  // Time progression = slide
  const currentTime = currentScene.photos[0]?.analysis.timeOfDay;
  const nextTime = nextScene.photos[0]?.analysis.timeOfDay;
  if (currentTime !== nextTime) {
    return 'slide-left';
  }

  // Default to dissolve for smooth continuity
  return 'dissolve';
}

/**
 * Get most common element in array
 */
function getMostCommon<T>(arr: T[]): T {
  const counts = new Map<T, number>();
  let maxCount = 0;
  let maxElement = arr[0];

  for (const item of arr) {
    const count = (counts.get(item) || 0) + 1;
    counts.set(item, count);
    if (count > maxCount) {
      maxCount = count;
      maxElement = item;
    }
  }

  return maxElement;
}
