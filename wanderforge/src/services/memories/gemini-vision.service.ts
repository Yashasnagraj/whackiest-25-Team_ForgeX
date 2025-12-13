// ============================================================
// AI VISION SERVICE - ULTRATHINK EDITION
// 100% AI-Generated Content - Zero Templates
// Supports: OpenRouter (recommended) or Gemini Direct
// ============================================================

import type { PhotoAnalysis, DetectedObject, SceneType, EmotionType, TimeOfDay, LightingType, DoodleText } from './types';

// ============================================================
// API CONFIGURATION - Groq (recommended), OpenRouter, or Gemini
// ============================================================

// GROQ - Best option! Free tier with vision, high rate limits
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_VISION_MODEL = 'llama-3.2-11b-vision-preview'; // or llama-3.2-90b-vision-preview
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// OpenRouter fallback
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Gemini fallback
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash-exp';
const GEMINI_VISION_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Priority: Groq > OpenRouter > Gemini
const USE_GROQ = !!GROQ_API_KEY;
const USE_OPENROUTER = !USE_GROQ && !!OPENROUTER_API_KEY;

// ============================================================
// ULTRATHINK PROMPT - Forces SPECIFIC, UNIQUE content
// NO GENERIC PHRASES ALLOWED
// ============================================================
const PHOTO_ANALYSIS_PROMPT = `You are a world-class travel documentary narrator and photo analyst.
Analyze this travel photo and return UNIQUE, SPECIFIC content.

**CRITICAL RULES - MUST FOLLOW:**
1. Caption MUST reference something SPECIFIC visible in this exact photo (landmark name, food type, activity, location)
2. Story snippet MUST be poetic but SPECIFIC to what's visible - mention actual objects/places
3. BANNED PHRASES (NEVER USE): "moment to remember", "journey vibes", "making memories", "adventure awaits", "beautiful moment", "captured in time", "every journey", "wanderlust"
4. If you see a temple, NAME it (or describe its style). If you see food, NAME the dish. If you see a place, DESCRIBE it specifically.
5. doodleTexts MUST be funny/witty comments about SPECIFIC objects you detect - not generic "Yum!" or "WOW!"

Return ONLY valid JSON (no markdown, no code blocks):
{
  "sceneDescription": "2-3 vivid sentences describing EXACTLY what's in this photo. Mention specific items, colors, expressions, architecture styles.",
  "sceneType": "one of: landmark|nature|food|activity|portrait|group|transport|accommodation|shopping|nightlife|culture|candid|scenic",
  "detectedObjects": [
    {
      "label": "specific object name (e.g., 'masala dosa' not 'food', 'stone gopuram' not 'temple')",
      "confidence": 0.0-1.0,
      "boundingBox": { "yMin": 0-1000, "xMin": 0-1000, "yMax": 0-1000, "xMax": 0-1000 },
      "doodleEligible": true/false
    }
  ],
  "peopleCount": number,
  "dominantEmotion": "joy|awe|peace|excitement|love|nostalgia|adventure|tired|contemplative|neutral",
  "emotionConfidence": 0.0-1.0,
  "identifiedLandmark": "specific landmark name or null",
  "landmarkConfidence": 0.0-1.0 or null,
  "timeOfDay": "dawn|morning|afternoon|evening|night",
  "lighting": "natural|artificial|golden-hour|blue-hour|mixed",
  "caption": "8 words MAX - MUST mention a specific thing visible (e.g., 'First chai at the temple steps')",
  "storySnippet": "2-3 poetic sentences in present tense. Reference SPECIFIC visible elements. Evoke the atmosphere.",
  "doodleTexts": [
    { "forObject": "detected object label", "text": "Witty, contextual comment about THIS specific item (e.g., 'That dosa is calling my name!')" }
  ],
  "tags": ["specific", "relevant", "tags"]
}

Example of GOOD vs BAD:
- BAD caption: "A beautiful moment"
- GOOD caption: "Morning chai at Virupaksha's shadow"
- BAD snippet: "The journey continues with new discoveries"
- GOOD snippet: "Steam rises from clay cups as the 7th-century gopuram catches the first rays of dawn"
- BAD doodleText: "Yum!"
- GOOD doodleText: "That crispy dosa is whispering my name!"

Return ONLY the JSON.`;

// ============================================================
// SCENE NARRATION PROMPT - Context-aware, cross-photo narrative
// ============================================================
const SCENE_NARRATION_PROMPT = `You are a Netflix documentary narrator creating a travel story.

PREVIOUS SCENE CONTEXT:
{PREV_CONTEXT}

CURRENT SCENE PHOTOS:
{PHOTOS}

NEXT SCENE PREVIEW:
{NEXT_CONTEXT}

Write 3-4 sentences of UNIQUE narration that:
- References SPECIFIC elements from the photos (landmark names, food items, expressions)
- Creates narrative flow from the previous scene (if exists)
- Uses present tense and immersive, poetic language
- NEVER uses generic phrases like "the journey continues" or "memories are made"
- Sounds like David Attenborough narrating a travel documentary

Write ONLY the narration text. Make it SPECIFIC to these exact photos.`;

// ============================================================
// SCENE TITLE PROMPT - Uses actual content, not templates
// ============================================================
const SCENE_TITLE_PROMPT = `Create a short, evocative scene title (3-5 words) for these travel photos.

Photo descriptions:
{DESCRIPTIONS}

Detected landmarks: {LANDMARKS}
Time of day: {TIME}
Dominant emotion: {EMOTION}

Rules:
- If there's a landmark, USE ITS NAME (e.g., "Virupaksha at Dawn")
- Must be SPECIFIC to the content, not generic
- BANNED: "Beautiful Moments", "Golden Hours", "Memory Lane", "Journey's Chapter"

Return ONLY the title text, nothing else.`;

// Retry configuration for rate limiting
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 10000; // 10 seconds - Gemini free tier needs patience

export class GeminiVisionService {
  private groqKey: string;
  private openRouterKey: string;
  private apiKey: string;
  private useGroq: boolean;
  private useOpenRouter: boolean;
  private requestQueue: Promise<void> = Promise.resolve();
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 2000; // Default 2 seconds

  constructor() {
    this.groqKey = GROQ_API_KEY || '';
    this.openRouterKey = OPENROUTER_API_KEY || '';
    this.apiKey = GEMINI_API_KEY || '';
    this.useGroq = USE_GROQ;
    this.useOpenRouter = USE_OPENROUTER;

    if (this.useGroq) {
      console.log(`[AI Vision] Using GROQ with model: ${GROQ_VISION_MODEL} (high rate limits!)`);
      this.minRequestInterval = 2000; // Groq has 30 RPM for vision
    } else if (this.useOpenRouter) {
      console.log(`[AI Vision] Using OpenRouter with model: ${OPENROUTER_MODEL}`);
      this.minRequestInterval = 1000;
    } else if (this.apiKey) {
      console.log(`[AI Vision] Using Gemini Direct API - Model: ${GEMINI_MODEL}`);
      this.minRequestInterval = 8000;
    } else {
      console.warn('[AI Vision] No API key found. Photo analysis will be unavailable.');
    }
  }

  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    return !!(this.useGroq ? this.groqKey : this.useOpenRouter ? this.openRouterKey : this.apiKey);
  }

  /**
   * Rate-limited fetch with exponential backoff retry
   */
  private async rateLimitedFetch(url: string, options: RequestInit, retryCount = 0): Promise<Response> {
    // Queue requests to avoid rate limiting
    return new Promise((resolve, reject) => {
      this.requestQueue = this.requestQueue.then(async () => {
        // Ensure minimum interval between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
          await this.delay(this.minRequestInterval - timeSinceLastRequest);
        }
        this.lastRequestTime = Date.now();

        try {
          const response = await fetch(url, options);

          // Handle rate limiting with retry
          if (response.status === 429 && retryCount < MAX_RETRIES) {
            const retryAfter = this.parseRetryAfter(response) || INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
            console.warn(`[Gemini Vision] Rate limited. Retrying in ${retryAfter}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await this.delay(retryAfter);
            const retryResponse = await this.rateLimitedFetch(url, options, retryCount + 1);
            resolve(retryResponse);
            return;
          }

          resolve(response);
        } catch (error) {
          if (retryCount < MAX_RETRIES) {
            const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
            console.warn(`[Gemini Vision] Request failed. Retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await this.delay(retryDelay);
            const retryResponse = await this.rateLimitedFetch(url, options, retryCount + 1);
            resolve(retryResponse);
            return;
          }
          reject(error);
        }
      });
    });
  }

  private parseRetryAfter(response: Response): number | null {
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return seconds * 1000;
      }
    }
    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Analyze a single photo using Groq, OpenRouter, or Gemini Vision
   */
  async analyzePhoto(base64Image: string, mimeType: string, photoId: string): Promise<PhotoAnalysis> {
    if (!this.isConfigured()) {
      console.warn('[AI Vision] No API key - analysis unavailable');
      return this.generateUnavailableAnalysis(photoId);
    }

    const provider = this.useGroq ? 'Groq' : this.useOpenRouter ? 'OpenRouter' : 'Gemini';
    console.log(`[AI Vision] Analyzing photo ${photoId} via ${provider}...`);

    try {
      let text: string | undefined;

      if (this.useGroq) {
        // GROQ API - OpenAI-compatible format with vision
        const response = await this.rateLimitedFetch(GROQ_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.groqKey}`,
          },
          body: JSON.stringify({
            model: GROQ_VISION_MODEL,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: PHOTO_ANALYSIS_PROMPT },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${mimeType};base64,${base64Image}`,
                    },
                  },
                ],
              },
            ],
            temperature: 0.4,
            max_tokens: 2048,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Groq API error:', errorText);
          throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        text = data.choices?.[0]?.message?.content;
      } else if (this.useOpenRouter) {
        // OpenRouter API (OpenAI-compatible format)
        const response = await this.rateLimitedFetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openRouterKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'WanderForge Cinematic Memories',
          },
          body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: PHOTO_ANALYSIS_PROMPT },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${mimeType};base64,${base64Image}`,
                    },
                  },
                ],
              },
            ],
            temperature: 0.4,
            max_tokens: 2048,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenRouter API error:', errorText);
          throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        text = data.choices?.[0]?.message?.content;
      } else {
        // Gemini Direct API
        const response = await this.rateLimitedFetch(`${GEMINI_VISION_URL}?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: PHOTO_ANALYSIS_PROMPT },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 2048,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Gemini API error:', errorText);
          throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      }

      if (!text) {
        throw new Error('No response from Gemini');
      }

      // Parse JSON response (handle potential markdown code blocks)
      let jsonStr = text.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      const analysis = JSON.parse(jsonStr);

      console.log(`[Gemini Vision] Photo ${photoId} analysis complete:`, {
        sceneType: analysis.sceneType,
        emotion: analysis.dominantEmotion,
        objectsDetected: analysis.detectedObjects?.length || 0,
        landmark: analysis.identifiedLandmark || 'None',
        caption: analysis.caption,
        doodleTexts: analysis.doodleTexts?.length || 0,
      });

      return {
        photoId,
        sceneDescription: analysis.sceneDescription || 'Photo analysis in progress...',
        sceneType: this.validateSceneType(analysis.sceneType),
        detectedObjects: this.validateObjects(analysis.detectedObjects || []),
        peopleCount: analysis.peopleCount || 0,
        dominantEmotion: this.validateEmotion(analysis.dominantEmotion),
        emotionConfidence: analysis.emotionConfidence || 0.5,
        identifiedLandmark: analysis.identifiedLandmark || undefined,
        landmarkConfidence: analysis.landmarkConfidence || undefined,
        timeOfDay: this.validateTimeOfDay(analysis.timeOfDay),
        lighting: this.validateLighting(analysis.lighting),
        caption: analysis.caption || 'Analyzing...',
        storySnippet: analysis.storySnippet || 'Story being generated...',
        doodleTexts: this.validateDoodleTexts(analysis.doodleTexts || []),
        doodleSuggestions: [], // Will be filled by doodle placer
        tags: analysis.tags || [],
      };
    } catch (error) {
      console.error('Photo analysis error:', error);
      return this.generateUnavailableAnalysis(photoId);
    }
  }

  /**
   * Unified text generation (non-vision) - supports Groq, OpenRouter, Gemini
   */
  private async generateTextInternal(prompt: string, temperature = 0.7, maxTokens = 500): Promise<string | null> {
    if (!this.isConfigured()) return null;

    try {
      if (this.useGroq) {
        // Groq text generation (use llama model for text-only)
        const response = await this.rateLimitedFetch(GROQ_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant', // Fast text model
            messages: [{ role: 'user', content: prompt }],
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || null;
      } else if (this.useOpenRouter) {
        const response = await this.rateLimitedFetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openRouterKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'WanderForge Cinematic Memories',
          },
          body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || null;
      } else {
        const response = await this.rateLimitedFetch(`${GEMINI_VISION_URL}?key=${this.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature, maxOutputTokens: maxTokens },
          }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
      }
    } catch (error) {
      console.error('Text generation error:', error);
      return null;
    }
  }

  /**
   * Generate scene narration for grouped photos - CONTEXT AWARE
   */
  async generateSceneNarration(
    photoAnalyses: PhotoAnalysis[],
    _sceneTitle: string,
    prevScenePhotos?: PhotoAnalysis[],
    nextScenePhotos?: PhotoAnalysis[]
  ): Promise<string> {
    if (!this.isConfigured()) {
      return 'AI narration unavailable. Please configure your API key.';
    }

    try {
      // Build context-rich prompt
      const photosDescription = photoAnalyses
        .map((p, i) => {
          const landmark = p.identifiedLandmark ? ` [Landmark: ${p.identifiedLandmark}]` : '';
          const objects = p.detectedObjects.slice(0, 3).map(o => o.label).join(', ');
          return `Photo ${i + 1}: ${p.sceneDescription}${landmark} (Objects: ${objects || 'various'}, Emotion: ${p.dominantEmotion})`;
        })
        .join('\n');

      const prevContext = prevScenePhotos?.length
        ? prevScenePhotos.map(p => p.sceneDescription).join('. ')
        : 'This is the opening scene of the story.';

      const nextContext = nextScenePhotos?.length
        ? 'More adventures await in the next scene.'
        : 'This is the final scene of the story.';

      const prompt = SCENE_NARRATION_PROMPT
        .replace('{PHOTOS}', photosDescription)
        .replace('{PREV_CONTEXT}', prevContext)
        .replace('{NEXT_CONTEXT}', nextContext);

      const narration = await this.generateTextInternal(prompt, 0.7, 500);

      if (!narration) {
        return 'Narration generation failed. The story continues...';
      }

      return narration;
    } catch (error) {
      console.error('Narration generation error:', error);
      return 'Narration unavailable for this scene.';
    }
  }

  /**
   * Generate scene title from actual photo content - NO TEMPLATES
   */
  async generateSceneTitle(photoAnalyses: PhotoAnalysis[]): Promise<string> {
    if (!this.isConfigured() || photoAnalyses.length === 0) {
      // Try to use detected landmark as fallback
      const landmark = photoAnalyses.find(p => p.identifiedLandmark)?.identifiedLandmark;
      const timeOfDay = photoAnalyses[0]?.timeOfDay || 'day';
      if (landmark) {
        return `${landmark} at ${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}`;
      }
      return 'Untitled Scene';
    }

    try {
      const descriptions = photoAnalyses.map(p => p.sceneDescription).join('. ');
      const landmarks = photoAnalyses
        .filter(p => p.identifiedLandmark)
        .map(p => p.identifiedLandmark)
        .join(', ') || 'None detected';
      const timeOfDay = photoAnalyses[0]?.timeOfDay || 'day';
      const emotion = photoAnalyses[0]?.dominantEmotion || 'neutral';

      const prompt = SCENE_TITLE_PROMPT
        .replace('{DESCRIPTIONS}', descriptions)
        .replace('{LANDMARKS}', landmarks)
        .replace('{TIME}', timeOfDay)
        .replace('{EMOTION}', emotion);

      const title = await this.generateTextInternal(prompt, 0.7, 50);

      // Clean up any quotes or extra formatting
      return title?.replace(/^["']|["']$/g, '') || 'Scene';
    } catch (error) {
      console.error('Scene title generation error:', error);
      // Fallback to landmark if available
      const landmark = photoAnalyses.find(p => p.identifiedLandmark)?.identifiedLandmark;
      return landmark || 'Scene';
    }
  }

  /**
   * Generate raw text - utility method (public wrapper)
   */
  async generateText(prompt: string): Promise<string | null> {
    return this.generateTextInternal(prompt);
  }

  /**
   * Generate story title and tagline
   */
  async generateStoryTitle(photoAnalyses: PhotoAnalysis[]): Promise<{ title: string; tagline: string }> {
    if (!this.isConfigured() || photoAnalyses.length === 0) {
      return { title: 'My Travel Story', tagline: 'Moments worth remembering' };
    }

    try {
      // Extract location hints from landmarks and tags
      const landmarks = photoAnalyses
        .filter((p) => p.identifiedLandmark)
        .map((p) => p.identifiedLandmark);
      const allTags = photoAnalyses.flatMap((p) => p.tags);

      const prompt = `Based on these travel photo elements, generate a compelling documentary title and tagline.

Landmarks: ${landmarks.join(', ') || 'Various locations'}
Tags: ${allTags.slice(0, 20).join(', ')}
Dominant emotions: ${photoAnalyses.map((p) => p.dominantEmotion).join(', ')}
Number of photos: ${photoAnalyses.length}

Return ONLY JSON in this format (no markdown):
{
  "title": "A short, evocative title (3-6 words)",
  "tagline": "A poetic tagline (5-10 words)"
}`;

      let text = await this.generateTextInternal(prompt, 0.8, 200);

      if (!text) {
        throw new Error('No response');
      }

      // Parse JSON
      if (text.startsWith('```')) {
        text = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }

      const result = JSON.parse(text);
      return {
        title: result.title || 'My Travel Story',
        tagline: result.tagline || 'Moments worth remembering',
      };
    } catch (error) {
      console.error('Title generation error:', error);
      return { title: 'My Travel Story', tagline: 'Moments worth remembering' };
    }
  }

  // ========== VALIDATION HELPERS ==========

  private validateSceneType(type: string): SceneType {
    const validTypes: SceneType[] = [
      'landmark', 'nature', 'food', 'activity', 'portrait', 'group',
      'transport', 'accommodation', 'shopping', 'nightlife', 'culture', 'candid', 'scenic',
    ];
    return validTypes.includes(type as SceneType) ? (type as SceneType) : 'scenic';
  }

  private validateEmotion(emotion: string): EmotionType {
    const validEmotions: EmotionType[] = [
      'joy', 'awe', 'peace', 'excitement', 'love', 'nostalgia',
      'adventure', 'tired', 'contemplative', 'neutral',
    ];
    return validEmotions.includes(emotion as EmotionType) ? (emotion as EmotionType) : 'neutral';
  }

  private validateTimeOfDay(time: string): TimeOfDay {
    const validTimes: TimeOfDay[] = ['dawn', 'morning', 'afternoon', 'evening', 'night'];
    return validTimes.includes(time as TimeOfDay) ? (time as TimeOfDay) : 'afternoon';
  }

  private validateLighting(lighting: string): LightingType {
    const validLighting: LightingType[] = ['natural', 'artificial', 'golden-hour', 'blue-hour', 'mixed'];
    return validLighting.includes(lighting as LightingType) ? (lighting as LightingType) : 'natural';
  }

  private validateObjects(objects: unknown[]): DetectedObject[] {
    if (!Array.isArray(objects)) return [];

    return objects
      .filter((obj): obj is Record<string, unknown> => typeof obj === 'object' && obj !== null)
      .map((obj) => ({
        label: String(obj.label || 'object'),
        confidence: Number(obj.confidence) || 0.5,
        boundingBox: {
          yMin: Number((obj.boundingBox as Record<string, number>)?.yMin) || 0,
          xMin: Number((obj.boundingBox as Record<string, number>)?.xMin) || 0,
          yMax: Number((obj.boundingBox as Record<string, number>)?.yMax) || 500,
          xMax: Number((obj.boundingBox as Record<string, number>)?.xMax) || 500,
        },
        doodleEligible: Boolean(obj.doodleEligible),
        suggestedDoodle: obj.suggestedDoodle as string | undefined,
      }))
      .slice(0, 10); // Limit to 10 objects
  }

  // ========== VALIDATION HELPERS FOR NEW FIELDS ==========

  private validateDoodleTexts(doodleTexts: unknown[]): DoodleText[] {
    if (!Array.isArray(doodleTexts)) return [];

    return doodleTexts
      .filter((dt): dt is Record<string, unknown> => typeof dt === 'object' && dt !== null)
      .map((dt) => ({
        forObject: String(dt.forObject || 'object'),
        text: String(dt.text || ''),
        position: dt.position as { x: number; y: number } | undefined,
      }))
      .filter((dt) => dt.text.length > 0) // Only keep doodles with actual text
      .slice(0, 5); // Limit to 5 doodle texts
  }

  // ========== UNAVAILABLE STATE GENERATORS (No Fake Content!) ==========

  private generateUnavailableAnalysis(photoId: string): PhotoAnalysis {
    // NO FAKE CONTENT - just clear "unavailable" messages
    return {
      photoId,
      sceneDescription: 'Photo analysis unavailable. Please check your API key.',
      sceneType: 'scenic',
      detectedObjects: [],
      peopleCount: 0,
      dominantEmotion: 'neutral',
      emotionConfidence: 0,
      timeOfDay: 'afternoon',
      lighting: 'natural',
      caption: 'Analysis unavailable',
      storySnippet: 'AI analysis could not be completed for this photo.',
      doodleTexts: [],
      doodleSuggestions: [],
      tags: [],
    };
  }
}

// Export singleton instance
export const geminiVision = new GeminiVisionService();
