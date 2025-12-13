// ============================================================
// PHOTO ANALYZER
// Orchestrates photo analysis pipeline with Gemini Vision
// ============================================================

import type { UploadedPhoto, ProcessedPhoto, PhotoAnalysis, PhotoExifData, KenBurnsConfig } from './types';
import { geminiVision } from './gemini-vision.service';
import { extractExif, resizeImageForApi, getImageMimeType } from './exif-extractor';
import { placeDoodles } from './doodle-placer';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 4000; // 4 seconds between API calls (safe for 15 req/min)

/**
 * Analyze a batch of photos with progress callback
 */
export async function analyzePhotos(
  photos: UploadedPhoto[],
  onProgress: (current: number, total: number, photo?: ProcessedPhoto, detectedItems?: string[]) => void
): Promise<ProcessedPhoto[]> {
  const processedPhotos: ProcessedPhoto[] = [];
  const total = photos.length;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];

    try {
      // Update progress
      onProgress(i + 1, total, undefined, []);

      // Process single photo
      const processed = await processPhoto(photo, (items) => {
        onProgress(i + 1, total, undefined, items);
      });

      processedPhotos.push(processed);
      onProgress(i + 1, total, processed, []);

      // Rate limit delay (skip on last photo)
      if (i < photos.length - 1) {
        await delay(RATE_LIMIT_DELAY);
      }
    } catch (error) {
      console.error(`Error processing photo ${photo.id}:`, error);

      // Add failed photo with fallback data
      const fallbackProcessed = createFallbackProcessedPhoto(photo);
      processedPhotos.push(fallbackProcessed);
      onProgress(i + 1, total, fallbackProcessed, []);
    }
  }

  return processedPhotos;
}

/**
 * Process a single photo through the analysis pipeline
 */
async function processPhoto(
  photo: UploadedPhoto,
  onDetectedItems: (items: string[]) => void
): Promise<ProcessedPhoto> {
  // Step 1: Extract EXIF data
  const exif = await extractExif(photo.file);

  // Step 2: Resize and convert to base64 for API
  const base64 = await resizeImageForApi(photo.file, 1024);
  const mimeType = getImageMimeType(photo.file);

  // Step 3: Analyze with Gemini Vision
  const analysis = await geminiVision.analyzePhoto(base64, mimeType, photo.id);

  // Notify about detected items for UI animation
  const detectedItems = [
    ...analysis.detectedObjects.slice(0, 3).map((o) => o.label),
    analysis.identifiedLandmark,
    analysis.dominantEmotion,
  ].filter(Boolean) as string[];
  onDetectedItems(detectedItems);

  // Step 4: Generate Ken Burns config based on analysis
  const kenBurnsConfig = generateKenBurnsConfig(analysis);

  // Step 5: Place doodles based on detected objects
  const doodles = placeDoodles(analysis);

  return {
    ...photo,
    base64,
    status: 'analyzed',
    exif,
    analysis,
    doodles,
    kenBurnsConfig,
  };
}

/**
 * Generate Ken Burns (pan/zoom) configuration based on photo analysis
 */
function generateKenBurnsConfig(analysis: PhotoAnalysis): KenBurnsConfig {
  const { detectedObjects, sceneType } = analysis;

  // Find focus point (face > landmark > center)
  let focusX = 50;
  let focusY = 50;

  // Look for faces/people
  const personObjects = detectedObjects.filter((o) =>
    ['person', 'face', 'people', 'man', 'woman', 'child'].includes(o.label.toLowerCase())
  );

  if (personObjects.length > 0) {
    // Focus on the first person
    const person = personObjects[0];
    focusX = (person.boundingBox.xMin + person.boundingBox.xMax) / 2 / 10;
    focusY = (person.boundingBox.yMin + person.boundingBox.yMax) / 2 / 10;
  } else if (analysis.identifiedLandmark) {
    // Look for landmark objects
    const landmarkObj = detectedObjects.find((o) =>
      o.label.toLowerCase().includes('temple') ||
      o.label.toLowerCase().includes('monument') ||
      o.label.toLowerCase().includes('building')
    );
    if (landmarkObj) {
      focusX = (landmarkObj.boundingBox.xMin + landmarkObj.boundingBox.xMax) / 2 / 10;
      focusY = (landmarkObj.boundingBox.yMin + landmarkObj.boundingBox.yMax) / 2 / 10;
    }
  }

  // Determine movement style based on scene type
  let startScale = 1.0;
  let endScale = 1.15;
  let duration = 7;

  switch (sceneType) {
    case 'portrait':
    case 'group':
      // Zoom into faces
      startScale = 1.0;
      endScale = 1.2;
      duration = 8;
      break;

    case 'landmark':
    case 'scenic':
      // Start zoomed out, zoom into detail
      startScale = 1.15;
      endScale = 1.0;
      duration = 9;
      break;

    case 'food':
      // Slow pan across the dish
      startScale = 1.1;
      endScale = 1.1;
      duration = 6;
      break;

    case 'activity':
    case 'nightlife':
      // Dynamic zoom
      startScale = 1.0;
      endScale = 1.25;
      duration = 6;
      break;

    default:
      // Gentle diagonal pan
      startScale = 1.05;
      endScale = 1.1;
      duration = 7;
  }

  // Calculate pan start/end based on focus point
  const panRange = 15; // Max pan percentage
  const startX = Math.max(0, Math.min(100, focusX - panRange + Math.random() * panRange));
  const startY = Math.max(0, Math.min(100, focusY - panRange + Math.random() * panRange));
  const endX = Math.max(0, Math.min(100, focusX + Math.random() * panRange));
  const endY = Math.max(0, Math.min(100, focusY + Math.random() * panRange));

  return {
    startScale,
    endScale,
    startX,
    startY,
    endX,
    endY,
    duration,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    focusPoint: { x: focusX, y: focusY },
  };
}

/**
 * Create a fallback processed photo when analysis fails
 */
function createFallbackProcessedPhoto(photo: UploadedPhoto): ProcessedPhoto {
  const fallbackAnalysis: PhotoAnalysis = {
    photoId: photo.id,
    sceneDescription: 'A moment from the journey.',
    sceneType: 'scenic',
    detectedObjects: [],
    peopleCount: 0,
    dominantEmotion: 'neutral',
    emotionConfidence: 0.5,
    timeOfDay: 'afternoon',
    lighting: 'natural',
    caption: 'Travel moment',
    storySnippet: 'Every photograph tells a story, even when the words escape us.',
    doodleSuggestions: [],
    tags: ['travel'],
  };

  const fallbackExif: PhotoExifData = {
    timestamp: photo.file.lastModified ? new Date(photo.file.lastModified) : undefined,
  };

  return {
    ...photo,
    status: 'analyzed',
    exif: fallbackExif,
    analysis: fallbackAnalysis,
    doodles: [],
    kenBurnsConfig: {
      startScale: 1.0,
      endScale: 1.1,
      startX: 50,
      startY: 50,
      endX: 55,
      endY: 45,
      duration: 7,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  };
}

/**
 * Utility delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
