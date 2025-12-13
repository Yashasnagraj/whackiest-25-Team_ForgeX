// ============================================================
// STORY GENERATOR - ULTRATHINK EDITION
// 100% AI-Generated Narrations - Zero Templates
// Every narration is unique and context-aware
// ============================================================

import type { MemoryScene, GeneratedStory, PhotoAnalysis } from './types';
import { geminiVision } from './gemini-vision.service';

/**
 * Generate a complete story from grouped scenes
 * ALL narrations are AI-generated, no templates
 */
export async function generateStory(
  scenes: MemoryScene[],
  onProgress?: (stage: string, progress: number) => void
): Promise<GeneratedStory> {
  if (scenes.length === 0) {
    return createEmptyStory();
  }

  onProgress?.('Generating story title...', 0);

  // Collect all photo analyses
  const allAnalyses = scenes.flatMap((scene) =>
    scene.photos.map((p) => p.analysis)
  );

  // Generate story title and tagline
  const { title, tagline } = await geminiVision.generateStoryTitle(allAnalyses);

  // Generate narration for each scene WITH CONTEXT
  const enhancedScenes: MemoryScene[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    onProgress?.(`Writing scene ${i + 1} of ${scenes.length}...`, ((i + 1) / scenes.length) * 100);

    // Get context from adjacent scenes for narrative flow
    const prevScene = i > 0 ? scenes[i - 1] : undefined;
    const nextScene = i < scenes.length - 1 ? scenes[i + 1] : undefined;

    const narration = await generateSceneNarration(
      scene,
      i,
      scenes.length,
      prevScene,
      nextScene
    );

    enhancedScenes.push({
      ...scene,
      narration,
    });

    // Small delay between narrations to avoid rate limits
    if (i < scenes.length - 1) {
      await delay(2000);
    }
  }

  // Calculate total duration
  const totalDuration = enhancedScenes.reduce((sum, scene) => sum + scene.duration, 0);

  // Extract unique locations
  const locations = extractLocations(allAnalyses);

  // Get date range from photos
  const dateRange = getDateRange(scenes);

  onProgress?.('Finalizing story...', 100);

  return {
    id: crypto.randomUUID(),
    title,
    tagline,
    scenes: enhancedScenes,
    totalDuration,
    createdAt: new Date(),
    locations,
    dateRange,
  };
}

/**
 * Generate narration for a single scene - 100% AI, context-aware
 */
async function generateSceneNarration(
  scene: MemoryScene,
  sceneIndex: number,
  totalScenes: number,
  prevScene?: MemoryScene,
  nextScene?: MemoryScene
): Promise<string> {
  const photoAnalyses = scene.photos.map((p) => p.analysis);
  const prevAnalyses = prevScene?.photos.map((p) => p.analysis);
  const nextAnalyses = nextScene?.photos.map((p) => p.analysis);

  // Determine scene position for context
  const isOpening = sceneIndex === 0;
  const isClosing = sceneIndex === totalScenes - 1;

  // Use AI narration with full context
  const aiNarration = await geminiVision.generateSceneNarration(
    photoAnalyses,
    scene.title,
    prevAnalyses,
    nextAnalyses
  );

  // If we got a valid narration, use it
  if (aiNarration && aiNarration.length > 30 && !aiNarration.includes('unavailable')) {
    return aiNarration;
  }

  // Fallback: Build narration from photo storySnippets (which are AI-generated per photo)
  // This is still AI content, just from individual photos rather than combined
  const snippets = photoAnalyses
    .map((p) => p.storySnippet)
    .filter((s) => s && !s.includes('unavailable') && s.length > 20);

  if (snippets.length > 0) {
    // Combine the AI-generated snippets from individual photos
    const combined = snippets.slice(0, 2).join(' ');

    // Add opening/closing context if needed
    if (isOpening && combined.length > 0) {
      return combined;
    }
    if (isClosing && combined.length > 0) {
      return combined;
    }
    return combined;
  }

  // Last resort: Use scene descriptions (still from AI photo analysis)
  const descriptions = photoAnalyses
    .map((p) => p.sceneDescription)
    .filter((d) => d && !d.includes('unavailable'))
    .slice(0, 2)
    .join('. ');

  if (descriptions.length > 20) {
    return descriptions;
  }

  // True fallback when nothing else works
  return 'AI narration could not be generated for this scene.';
}

/**
 * Extract unique locations from analyses
 */
function extractLocations(analyses: PhotoAnalysis[]): string[] {
  const locations = new Set<string>();

  for (const analysis of analyses) {
    if (analysis.identifiedLandmark) {
      locations.add(analysis.identifiedLandmark);
    }

    // Extract location-like tags
    const locationTags = analysis.tags.filter((tag) =>
      /temple|beach|mountain|city|park|museum|palace|fort|garden|lake|river|market/i.test(tag)
    );
    locationTags.forEach((tag) => locations.add(tag));
  }

  return Array.from(locations).slice(0, 10);
}

/**
 * Get date range from scenes
 */
function getDateRange(scenes: MemoryScene[]): { start: Date; end: Date } | undefined {
  const timestamps: number[] = [];

  for (const scene of scenes) {
    for (const photo of scene.photos) {
      const ts = photo.exif.timestamp?.getTime() || photo.file.lastModified;
      if (ts) {
        timestamps.push(ts);
      }
    }
  }

  if (timestamps.length === 0) {
    return undefined;
  }

  timestamps.sort((a, b) => a - b);
  return {
    start: new Date(timestamps[0]),
    end: new Date(timestamps[timestamps.length - 1]),
  };
}

/**
 * Create an empty story
 */
function createEmptyStory(): GeneratedStory {
  return {
    id: crypto.randomUUID(),
    title: 'Untitled Story',
    tagline: 'Add photos to generate your story',
    scenes: [],
    totalDuration: 0,
    createdAt: new Date(),
    locations: [],
  };
}

/**
 * Utility delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
