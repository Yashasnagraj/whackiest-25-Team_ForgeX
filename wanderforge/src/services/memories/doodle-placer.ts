// ============================================================
// DOODLE PLACER - ULTRATHINK EDITION
// Places fun doodles/annotations on photos based on detected objects
// Now uses AI-GENERATED TEXT instead of hardcoded "YUM!" and "WOW!"
// ============================================================

import type { PhotoAnalysis, PlacedDoodle, DoodleAsset, DetectedObject, DoodleText } from './types';

// ============================================================
// DOODLE LIBRARY - Hand-drawn style SVG doodles
// ============================================================

export const DOODLE_LIBRARY: DoodleAsset[] = [
  // Hearts
  {
    id: 'heart-1',
    name: 'Heart',
    svgPath: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    category: 'love',
    color: '#FF6B6B',
    defaultScale: 1,
    animation: 'pop-in',
    keywords: ['person', 'couple', 'love', 'smile', 'happy', 'face'],
  },
  {
    id: 'heart-eyes',
    name: 'Heart Eyes',
    svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-6.5l-1.5-1.5c-.39-.39-.39-1.02 0-1.41s1.02-.39 1.41 0l.79.79 2.79-2.79c.39-.39 1.02-.39 1.41 0s.39 1.02 0 1.41l-3.5 3.5c-.39.39-1.02.39-1.4 0z',
    category: 'love',
    color: '#FF69B4',
    defaultScale: 1.2,
    animation: 'bounce',
    keywords: ['beautiful', 'scenic', 'sunset', 'view', 'landscape'],
  },
  // Stars
  {
    id: 'star-1',
    name: 'Star',
    svgPath: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    category: 'sparkle',
    color: '#FFD700',
    defaultScale: 1,
    animation: 'sparkle',
    keywords: ['food', 'dish', 'restaurant', 'coffee', 'drink', 'delicious', 'amazing'],
  },
  {
    id: 'sparkle',
    name: 'Sparkle',
    svgPath: 'M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5L12 0z',
    category: 'sparkle',
    color: '#FFE66D',
    defaultScale: 0.8,
    animation: 'sparkle',
    keywords: ['light', 'sunset', 'sunrise', 'golden', 'sparkle', 'shine'],
  },
  // Speech bubbles
  {
    id: 'wow-bubble',
    name: 'WOW Bubble',
    svgPath: 'M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z',
    category: 'speech',
    color: '#4ECDC4',
    defaultScale: 1.5,
    animation: 'pop-in',
    keywords: ['temple', 'monument', 'landmark', 'building', 'tower', 'statue', 'architecture'],
    text: 'WOW!',
  },
  {
    id: 'yum-bubble',
    name: 'YUM Bubble',
    svgPath: 'M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z',
    category: 'speech',
    color: '#FF6B6B',
    defaultScale: 1.5,
    animation: 'bounce',
    keywords: ['food', 'dish', 'meal', 'pizza', 'burger', 'cake', 'dessert', 'ice cream', 'coffee', 'tea'],
    text: 'YUM!',
  },
  {
    id: 'goals-bubble',
    name: 'Goals Bubble',
    svgPath: 'M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z',
    category: 'speech',
    color: '#9B59B6',
    defaultScale: 1.5,
    animation: 'pop-in',
    keywords: ['group', 'friends', 'people', 'team', 'crowd', 'family'],
    text: 'SQUAD!',
  },
  // Arrows and pointers
  {
    id: 'arrow-curly',
    name: 'Curly Arrow',
    svgPath: 'M5 12c0-1.5.5-3 1.5-4.2.4-.5.9-.9 1.5-1.3l-1.3-1.3C5.6 6 4.7 7.2 4 8.6 3.4 10 3 11.5 3 13s.4 3 1 4.4c.7 1.4 1.6 2.6 2.7 3.4l1.3-1.3c-.6-.4-1.1-.8-1.5-1.3C5.5 17 5 15.5 5 14v-2zm14 0c0 1.5-.5 3-1.5 4.2-.4.5-.9.9-1.5 1.3l1.3 1.3c1.1-.8 2-2 2.7-3.4.6-1.4 1-2.9 1-4.4s-.4-3-1-4.4c-.7-1.4-1.6-2.6-2.7-3.4l-1.3 1.3c.6.4 1.1.8 1.5 1.3 1 1.2 1.5 2.7 1.5 4.2v2z',
    category: 'pointer',
    color: '#E74C3C',
    defaultScale: 1.2,
    animation: 'draw',
    keywords: ['look', 'see', 'check', 'this', 'here', 'important'],
  },
  {
    id: 'arrow-down',
    name: 'Arrow Down',
    svgPath: 'M7 10l5 5 5-5z',
    category: 'pointer',
    color: '#3498DB',
    defaultScale: 1.5,
    animation: 'bounce',
    keywords: ['pointing', 'below', 'down'],
  },
  // Fun expressions
  {
    id: 'fire',
    name: 'Fire',
    svgPath: 'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z',
    category: 'expression',
    color: '#FF6B35',
    defaultScale: 1,
    animation: 'wiggle',
    keywords: ['hot', 'spicy', 'amazing', 'fire', 'cool', 'awesome', 'lit'],
  },
  {
    id: 'party',
    name: 'Party Popper',
    svgPath: 'M14.4 4.8l-1.4 1.4c-1-.7-2.2-.7-3.2 0L8.4 4.8c.6-.5 1.3-.8 2.1-.8h1.8c.8 0 1.5.3 2.1.8zm-8 8c-.7-1-.7-2.2 0-3.2l1.4 1.4c-.7 1-.7 2.2 0 3.2l-1.4 1.4c-.5-.6-.8-1.3-.8-2.1v-1.8c0-.8.3-1.5.8-2.1v2.2zm8 8c.7-1 .7-2.2 0-3.2l-1.4 1.4c.7 1 .7 2.2 0 3.2l1.4 1.4c.5-.6.8-1.3.8-2.1v-1.8c0-.8-.3-1.5-.8-2.1v2.2z',
    category: 'expression',
    color: '#9B59B6',
    defaultScale: 1.2,
    animation: 'pop-in',
    keywords: ['party', 'celebration', 'fun', 'birthday', 'event', 'festival'],
  },
  {
    id: 'sun',
    name: 'Sun',
    svgPath: 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z',
    category: 'nature',
    color: '#F39C12',
    defaultScale: 1,
    animation: 'sparkle',
    keywords: ['sun', 'sunny', 'beach', 'day', 'morning', 'bright'],
  },
  {
    id: 'moon',
    name: 'Moon',
    svgPath: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z',
    category: 'nature',
    color: '#34495E',
    defaultScale: 1,
    animation: 'fade-in',
    keywords: ['night', 'moon', 'evening', 'dark', 'nightlife'],
  },
  {
    id: 'camera',
    name: 'Camera',
    svgPath: 'M9.4 10.5l4.77-8.26C13.47 2.09 12.75 2 12 2c-2.4 0-4.6.85-6.32 2.25l3.66 6.35.06-.1zM21.54 9c-.92-2.92-3.15-5.26-6-6.34L11.88 9h9.66zm.26 1h-7.49l.29.5 4.76 8.25C21 16.97 22 14.61 22 12c0-.69-.07-1.35-.2-2zM8.54 12l-3.9-6.75C3.01 7.03 2 9.39 2 12c0 .69.07 1.35.2 2h7.49l-1.15-2zm-6.08 3c.92 2.92 3.15 5.26 6 6.34L12.12 15H2.46zm11.27 0l-3.9 6.76c.7.15 1.42.24 2.17.24 2.4 0 4.6-.85 6.32-2.25l-3.66-6.35-.93 1.6z',
    category: 'travel',
    color: '#2ECC71',
    defaultScale: 1,
    animation: 'pop-in',
    keywords: ['photo', 'camera', 'picture', 'photography', 'selfie'],
  },
  {
    id: 'plane',
    name: 'Airplane',
    svgPath: 'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z',
    category: 'travel',
    color: '#3498DB',
    defaultScale: 1.2,
    animation: 'draw',
    keywords: ['airplane', 'flight', 'airport', 'travel', 'plane', 'flying'],
  },
  {
    id: 'mountain',
    name: 'Mountain',
    svgPath: 'M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z',
    category: 'nature',
    color: '#27AE60',
    defaultScale: 1.2,
    animation: 'fade-in',
    keywords: ['mountain', 'hill', 'hiking', 'trek', 'nature', 'landscape'],
  },
  {
    id: 'waves',
    name: 'Waves',
    svgPath: 'M17 16.99c-1.35 0-2.2.42-2.95.8-.65.33-1.18.6-2.05.6-.9 0-1.4-.25-2.05-.6-.75-.38-1.57-.8-2.95-.8s-2.2.42-2.95.8c-.65.33-1.17.6-2.05.6v1.95c1.35 0 2.2-.42 2.95-.8.65-.33 1.17-.6 2.05-.6s1.4.25 2.05.6c.75.38 1.57.8 2.95.8s2.2-.42 2.95-.8c.65-.33 1.18-.6 2.05-.6.9 0 1.4.25 2.05.6.75.38 1.58.8 2.95.8v-1.95c-.9 0-1.4-.25-2.05-.6-.75-.38-1.6-.8-2.95-.8zm0-4.45c-1.35 0-2.2.43-2.95.8-.65.32-1.18.6-2.05.6-.9 0-1.4-.25-2.05-.6-.75-.38-1.57-.8-2.95-.8s-2.2.43-2.95.8c-.65.32-1.17.6-2.05.6v1.95c1.35 0 2.2-.43 2.95-.8.65-.32 1.17-.6 2.05-.6s1.4.25 2.05.6c.75.38 1.57.8 2.95.8s2.2-.43 2.95-.8c.65-.32 1.18-.6 2.05-.6.9 0 1.4.25 2.05.6.75.38 1.58.8 2.95.8v-1.95c-.9 0-1.4-.25-2.05-.6-.75-.38-1.6-.8-2.95-.8z',
    category: 'nature',
    color: '#3498DB',
    defaultScale: 1.5,
    animation: 'wiggle',
    keywords: ['beach', 'ocean', 'sea', 'water', 'waves', 'swimming', 'pool'],
  },
  {
    id: 'music-note',
    name: 'Music Note',
    svgPath: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
    category: 'activity',
    color: '#E91E63',
    defaultScale: 1,
    animation: 'bounce',
    keywords: ['music', 'concert', 'band', 'singing', 'dance', 'party', 'festival'],
  },
  {
    id: 'trophy',
    name: 'Trophy',
    svgPath: 'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z',
    category: 'achievement',
    color: '#F1C40F',
    defaultScale: 1,
    animation: 'sparkle',
    keywords: ['win', 'trophy', 'achievement', 'success', 'champion', 'best'],
  },
  // Food specific
  {
    id: 'utensils',
    name: 'Fork & Knife',
    svgPath: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z',
    category: 'food',
    color: '#95A5A6',
    defaultScale: 1,
    animation: 'pop-in',
    keywords: ['food', 'restaurant', 'eating', 'lunch', 'dinner', 'breakfast', 'meal'],
  },
  {
    id: 'coffee',
    name: 'Coffee Cup',
    svgPath: 'M2 21h18v-2H2v2zm16-10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H2v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4v-1h-2v1c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V5h12v4h2V9z',
    category: 'food',
    color: '#8B4513',
    defaultScale: 1,
    animation: 'pop-in',
    keywords: ['coffee', 'cafe', 'tea', 'drink', 'latte', 'cappuccino', 'espresso'],
  },
  // Animals
  {
    id: 'paw',
    name: 'Paw Print',
    svgPath: 'M4.5 9.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M9 5.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M15 5.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M19.5 9.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M17 14c0-3.31-2.69-6-6-6s-6 2.69-6 6c0 2 1 3 2.5 4s2.5 2 3.5 2 2-1 3.5-2 2.5-2 2.5-4z',
    category: 'animals',
    color: '#D2691E',
    defaultScale: 1,
    animation: 'bounce',
    keywords: ['dog', 'cat', 'pet', 'animal', 'puppy', 'kitten', 'paw'],
  },
  {
    id: 'bird',
    name: 'Bird',
    svgPath: 'M21.5 4c-1.38 0-2.5 1.12-2.5 2.5V9l-4-4-1.29 1.29 1.79 1.79V15l-8-8-1.5 1.5 10 10V22h2v-5l3.79-3.79L22 14l-4-4h2.5c1.38 0 2.5-1.12 2.5-2.5S22.88 4 21.5 4z',
    category: 'animals',
    color: '#5DADE2',
    defaultScale: 1,
    animation: 'bounce',
    keywords: ['bird', 'flying', 'sky', 'nature', 'pigeon', 'sparrow'],
  },
];

// ============================================================
// DOODLE PLACEMENT LOGIC
// ============================================================

/**
 * Place doodles on a photo based on its analysis
 * NOW USES AI-GENERATED TEXT from analysis.doodleTexts instead of hardcoded text!
 */
export function placeDoodles(analysis: PhotoAnalysis): PlacedDoodle[] {
  const placedDoodles: PlacedDoodle[] = [];
  const usedPositions: { x: number; y: number; width: number; height: number }[] = [];

  // Get AI-generated doodle texts (these are contextual, not generic!)
  const aiDoodleTexts = analysis.doodleTexts || [];

  console.log(`[Doodle Placer] Processing ${analysis.detectedObjects.length} detected objects with ${aiDoodleTexts.length} AI texts for photo ${analysis.photoId}`);

  // Process detected objects
  for (const obj of analysis.detectedObjects) {
    if (!obj.doodleEligible) continue;

    const matchingDoodle = findMatchingDoodle(obj.label, analysis.dominantEmotion);
    if (!matchingDoodle) continue;

    // Calculate position near the object
    const position = calculateDoodlePosition(obj, usedPositions);
    if (!position) continue;

    // Find AI-generated text for this object (if available)
    const aiText = findAiTextForObject(obj.label, aiDoodleTexts);

    const placed: PlacedDoodle = {
      id: `${matchingDoodle.id}-${obj.label}-${Math.random().toString(36).slice(2, 8)}`,
      doodleId: matchingDoodle.id,
      x: position.x,
      y: position.y,
      scale: matchingDoodle.defaultScale * (0.8 + Math.random() * 0.4),
      rotation: (Math.random() - 0.5) * 20, // -10 to +10 degrees
      animation: matchingDoodle.animation,
      delay: 1 + Math.random() * 2, // 1-3 second delay
      // Use AI-generated text if available, otherwise no text (not hardcoded fallback!)
      text: aiText || undefined,
    };

    placedDoodles.push(placed);
    usedPositions.push({
      x: position.x,
      y: position.y,
      width: 100,
      height: 100,
    });

    console.log(`[Doodle Placer] Placed "${matchingDoodle.name}" doodle for detected "${obj.label}" at (${position.x}%, ${position.y}%)${aiText ? ` with AI text: "${aiText}"` : ''}`);

    // Limit doodles per photo
    if (placedDoodles.length >= 3) break;
  }

  // Add emotion-based doodle if few objects detected
  if (placedDoodles.length < 2) {
    const emotionDoodle = getEmotionDoodle(analysis.dominantEmotion);
    if (emotionDoodle) {
      const position = findEmptyCorner(usedPositions);
      placedDoodles.push({
        id: `emotion-${emotionDoodle.id}-${Math.random().toString(36).slice(2, 8)}`,
        doodleId: emotionDoodle.id,
        x: position.x,
        y: position.y,
        scale: emotionDoodle.defaultScale,
        rotation: (Math.random() - 0.5) * 15,
        animation: emotionDoodle.animation,
        delay: 2.5,
        // No hardcoded text for emotion doodles
      });
    }
  }

  // Add landmark indicator if identified - use AI text if available
  if (analysis.identifiedLandmark && placedDoodles.length < 4) {
    const wowBubble = DOODLE_LIBRARY.find((d) => d.id === 'wow-bubble');
    if (wowBubble) {
      const position = findEmptyCorner(usedPositions);
      // Look for AI text about the landmark
      const landmarkText = findAiTextForObject(analysis.identifiedLandmark, aiDoodleTexts) ||
                          findAiTextForObject('landmark', aiDoodleTexts) ||
                          findAiTextForObject('temple', aiDoodleTexts);

      placedDoodles.push({
        id: `landmark-wow-${Math.random().toString(36).slice(2, 8)}`,
        doodleId: wowBubble.id,
        x: position.x,
        y: position.y,
        scale: 1.5,
        rotation: -5,
        animation: 'pop-in',
        delay: 1.5,
        // Use AI-generated text, NOT hardcoded "WOW!"
        text: landmarkText || undefined,
      });
    }
  }

  console.log(`[Doodle Placer] Total doodles placed: ${placedDoodles.length}`);
  return placedDoodles;
}

/**
 * Find AI-generated text for a detected object
 */
function findAiTextForObject(objectLabel: string, aiDoodleTexts: DoodleText[]): string | undefined {
  if (!aiDoodleTexts || aiDoodleTexts.length === 0) return undefined;

  const normalizedLabel = objectLabel.toLowerCase();

  // Direct match
  const directMatch = aiDoodleTexts.find(
    (dt) => dt.forObject.toLowerCase() === normalizedLabel
  );
  if (directMatch) return directMatch.text;

  // Partial match
  const partialMatch = aiDoodleTexts.find(
    (dt) =>
      dt.forObject.toLowerCase().includes(normalizedLabel) ||
      normalizedLabel.includes(dt.forObject.toLowerCase())
  );
  if (partialMatch) return partialMatch.text;

  // No match - return undefined (not a hardcoded fallback!)
  return undefined;
}

/**
 * Find a matching doodle for a detected object
 */
function findMatchingDoodle(label: string, _emotion: string): DoodleAsset | undefined {
  const normalizedLabel = label.toLowerCase();

  // Direct keyword match
  for (const doodle of DOODLE_LIBRARY) {
    if (doodle.keywords.some((keyword) => normalizedLabel.includes(keyword) || keyword.includes(normalizedLabel))) {
      return doodle;
    }
  }

  // Category-based fallbacks
  const categoryMap: Record<string, string> = {
    // Food items
    pizza: 'food',
    burger: 'food',
    sandwich: 'food',
    cake: 'food',
    dessert: 'food',
    fruit: 'food',
    vegetable: 'food',
    meal: 'food',
    plate: 'food',
    bowl: 'food',
    // Nature
    tree: 'nature',
    flower: 'nature',
    plant: 'nature',
    grass: 'nature',
    sky: 'nature',
    cloud: 'nature',
    // Animals
    dog: 'animals',
    cat: 'animals',
    bird: 'animals',
    animal: 'animals',
    pet: 'animals',
    // People
    person: 'love',
    people: 'love',
    face: 'love',
    smile: 'love',
    man: 'love',
    woman: 'love',
    child: 'love',
    // Travel
    car: 'travel',
    bus: 'travel',
    train: 'travel',
    boat: 'travel',
    vehicle: 'travel',
  };

  for (const [key, category] of Object.entries(categoryMap)) {
    if (normalizedLabel.includes(key)) {
      const categoryDoodle = DOODLE_LIBRARY.find((d) => d.category === category);
      if (categoryDoodle) return categoryDoodle;
    }
  }

  return undefined;
}

/**
 * Get a doodle based on emotion
 */
function getEmotionDoodle(emotion: string): DoodleAsset | undefined {
  const emotionDoodles: Record<string, string[]> = {
    joy: ['heart-1', 'star-1', 'party'],
    excitement: ['fire', 'star-1', 'party'],
    awe: ['sparkle', 'star-1', 'wow-bubble'],
    love: ['heart-1', 'heart-eyes'],
    peace: ['sun', 'sparkle'],
    adventure: ['plane', 'mountain', 'camera'],
    nostalgia: ['camera', 'heart-1'],
    tired: ['coffee', 'moon'],
    contemplative: ['moon', 'mountain'],
    neutral: ['star-1', 'sparkle'],
  };

  const doodleIds = emotionDoodles[emotion] || emotionDoodles.neutral;
  const randomId = doodleIds[Math.floor(Math.random() * doodleIds.length)];
  return DOODLE_LIBRARY.find((d) => d.id === randomId);
}

/**
 * Calculate position for doodle near detected object
 */
function calculateDoodlePosition(
  obj: DetectedObject,
  usedPositions: { x: number; y: number; width: number; height: number }[]
): { x: number; y: number } | null {
  const { boundingBox } = obj;

  // Convert from 0-1000 to percentage
  const objCenterX = (boundingBox.xMin + boundingBox.xMax) / 2 / 10;
  const objCenterY = (boundingBox.yMin + boundingBox.yMax) / 2 / 10;
  const objWidth = (boundingBox.xMax - boundingBox.xMin) / 10;
  const objHeight = (boundingBox.yMax - boundingBox.yMin) / 10;

  // Try positions around the object
  const offsets = [
    { dx: objWidth / 2 + 5, dy: -objHeight / 2 - 5 }, // Top-right
    { dx: -objWidth / 2 - 5, dy: -objHeight / 2 - 5 }, // Top-left
    { dx: objWidth / 2 + 5, dy: objHeight / 2 + 5 }, // Bottom-right
    { dx: -objWidth / 2 - 5, dy: objHeight / 2 + 5 }, // Bottom-left
    { dx: 0, dy: -objHeight / 2 - 10 }, // Top center
  ];

  for (const offset of offsets) {
    const x = Math.max(5, Math.min(85, objCenterX + offset.dx));
    const y = Math.max(5, Math.min(85, objCenterY + offset.dy));

    // Check overlap
    const overlaps = usedPositions.some(
      (pos) => Math.abs(pos.x - x) < 15 && Math.abs(pos.y - y) < 15
    );

    if (!overlaps) {
      return { x, y };
    }
  }

  return null;
}

/**
 * Find an empty corner for additional doodles
 */
function findEmptyCorner(
  usedPositions: { x: number; y: number; width: number; height: number }[]
): { x: number; y: number } {
  const corners = [
    { x: 85, y: 15 }, // Top-right
    { x: 15, y: 15 }, // Top-left
    { x: 85, y: 85 }, // Bottom-right
    { x: 15, y: 85 }, // Bottom-left
  ];

  for (const corner of corners) {
    const overlaps = usedPositions.some(
      (pos) => Math.abs(pos.x - corner.x) < 20 && Math.abs(pos.y - corner.y) < 20
    );
    if (!overlaps) {
      return corner;
    }
  }

  // Default to top-right with slight randomness
  return {
    x: 80 + Math.random() * 10,
    y: 10 + Math.random() * 10,
  };
}

/**
 * Get doodle asset by ID
 */
export function getDoodleById(id: string): DoodleAsset | undefined {
  return DOODLE_LIBRARY.find((d) => d.id === id);
}

/**
 * Get all doodles in a category
 */
export function getDoodlesByCategory(category: string): DoodleAsset[] {
  return DOODLE_LIBRARY.filter((d) => d.category === category);
}
