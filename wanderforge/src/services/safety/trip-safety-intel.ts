// Trip Safety Intelligence Service
// Generates AI-powered safety briefings for travel destinations

import { LLMProviderManager } from '../ai/providers';
import { getEmergencyNumbers, findEmergencyServices, type EmergencyResources } from './emergency-locator';
import type { Coords } from '../itinerary/types';

export interface SafetyTip {
  category: 'general' | 'health' | 'transport' | 'scam' | 'weather' | 'local';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface EmergencyNumber {
  service: string;
  number: string;
  description?: string;
}

export interface TripSafetyBriefing {
  destination: string;
  generatedAt: Date;

  // Emergency contacts
  emergencyNumbers: EmergencyNumber[];

  // AI-generated safety tips
  safetyTips: SafetyTip[];

  // Common scams to watch out for
  commonScams: string[];

  // Health advisories
  healthAdvisories: string[];

  // Weather/climate considerations
  weatherConsiderations: string[];

  // Overall risk assessment
  riskLevel: 'low' | 'medium' | 'high';
  riskSummary: string;

  // Nearby resources (from emergency locator)
  nearbyResources?: EmergencyResources;
}

// Cache for safety briefings
const briefingCache = new Map<string, { data: TripSafetyBriefing; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// LLM Manager instance
const llmManager = new LLMProviderManager();

/**
 * Generate safety briefing prompt for LLM
 */
function getSafetyBriefingPrompt(destination: string, dates?: { start: string; end: string }) {
  const dateContext = dates
    ? `Travel dates: ${dates.start} to ${dates.end}.`
    : 'Travel dates not specified.';

  return {
    system: `You are a travel safety expert. Generate comprehensive safety information for travelers.
Your response must be valid JSON with this exact structure:
{
  "safetyTips": [
    { "category": "general|health|transport|scam|weather|local", "title": "Short title", "description": "Detailed tip", "priority": "high|medium|low" }
  ],
  "commonScams": ["Description of scam 1", "Description of scam 2"],
  "healthAdvisories": ["Health tip 1", "Health tip 2"],
  "weatherConsiderations": ["Weather consideration 1"],
  "riskLevel": "low|medium|high",
  "riskSummary": "Brief overall safety assessment"
}

Provide practical, actionable advice specific to the destination. Include 5-7 safety tips covering different categories.`,

    user: `Generate a safety briefing for traveling to ${destination}. ${dateContext}

Focus on:
1. General safety tips specific to this region
2. Common tourist scams to watch out for
3. Health considerations (food, water, vaccinations)
4. Transportation safety
5. Local customs and laws to be aware of
6. Weather-related precautions

Respond with JSON only, no additional text.`,
  };
}

/**
 * Parse LLM response into structured safety briefing data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSafetyResponse(response: any): Partial<TripSafetyBriefing> {
  try {
    const data = typeof response === 'string' ? JSON.parse(response) : response;

    return {
      safetyTips: Array.isArray(data.safetyTips)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? data.safetyTips.map((tip: any) => ({
            category: tip.category || 'general',
            title: tip.title || 'Safety Tip',
            description: tip.description || '',
            priority: tip.priority || 'medium',
          }))
        : [],
      commonScams: Array.isArray(data.commonScams) ? data.commonScams : [],
      healthAdvisories: Array.isArray(data.healthAdvisories) ? data.healthAdvisories : [],
      weatherConsiderations: Array.isArray(data.weatherConsiderations) ? data.weatherConsiderations : [],
      riskLevel: data.riskLevel || 'medium',
      riskSummary: data.riskSummary || 'Exercise normal precautions while traveling.',
    };
  } catch (error) {
    console.error('[SafetyIntel] Failed to parse LLM response:', error);
    return {};
  }
}

/**
 * Get default safety tips when LLM fails
 */
function getDefaultSafetyTips(destination: string): SafetyTip[] {
  return [
    {
      category: 'general',
      title: 'Keep Documents Safe',
      description: `Keep copies of your passport, ID, and important documents. Store digital copies in cloud storage accessible from ${destination}.`,
      priority: 'high',
    },
    {
      category: 'health',
      title: 'Stay Hydrated',
      description: 'Drink plenty of bottled water, especially in warm climates. Avoid tap water and ice from unknown sources.',
      priority: 'high',
    },
    {
      category: 'transport',
      title: 'Use Verified Transport',
      description: 'Use registered taxis, ride-sharing apps, or pre-booked transport. Avoid unmarked vehicles.',
      priority: 'medium',
    },
    {
      category: 'scam',
      title: 'Be Aware of Scams',
      description: 'Be cautious of overly friendly strangers, "free" offers, and deals that seem too good to be true.',
      priority: 'medium',
    },
    {
      category: 'local',
      title: 'Respect Local Customs',
      description: 'Research local customs, dress codes, and cultural norms before visiting religious or traditional sites.',
      priority: 'medium',
    },
    {
      category: 'general',
      title: 'Share Your Itinerary',
      description: 'Share your travel plans with family or friends. Check in regularly and keep your phone charged.',
      priority: 'high',
    },
  ];
}

/**
 * Detect country from destination name for emergency numbers
 */
function detectCountry(destination: string): string {
  const lower = destination.toLowerCase();

  // India detection
  if (
    lower.includes('india') ||
    lower.includes('goa') ||
    lower.includes('delhi') ||
    lower.includes('mumbai') ||
    lower.includes('bangalore') ||
    lower.includes('chennai') ||
    lower.includes('kolkata') ||
    lower.includes('hyderabad') ||
    lower.includes('jaipur') ||
    lower.includes('kerala') ||
    lower.includes('rajasthan') ||
    lower.includes('hampi') ||
    lower.includes('agra')
  ) {
    return 'India';
  }

  // USA detection
  if (
    lower.includes('usa') ||
    lower.includes('united states') ||
    lower.includes('america') ||
    lower.includes('new york') ||
    lower.includes('california') ||
    lower.includes('florida')
  ) {
    return 'USA';
  }

  // UK detection
  if (
    lower.includes('uk') ||
    lower.includes('united kingdom') ||
    lower.includes('england') ||
    lower.includes('london')
  ) {
    return 'UK';
  }

  // Default to India for Indian travel app
  return 'India';
}

/**
 * Generate comprehensive safety briefing for a destination
 */
export async function generateSafetyBriefing(
  destination: string,
  options?: {
    coordinates?: Coords;
    dates?: { start: string; end: string };
    forceRefresh?: boolean;
  }
): Promise<TripSafetyBriefing> {
  const cacheKey = destination.toLowerCase().trim();

  // Check cache unless force refresh
  if (!options?.forceRefresh) {
    const cached = briefingCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[SafetyIntel] Returning cached briefing');
      return cached.data;
    }
  }

  console.log(`[SafetyIntel] Generating safety briefing for ${destination}`);

  // Detect country for emergency numbers
  const country = detectCountry(destination);
  const emergencyNums = getEmergencyNumbers(country);

  // Format emergency numbers
  const emergencyNumbers: EmergencyNumber[] = [
    { service: 'Police', number: emergencyNums.police, description: 'Emergency police helpline' },
    { service: 'Ambulance', number: emergencyNums.ambulance, description: 'Medical emergency' },
    { service: 'Fire', number: emergencyNums.fire, description: 'Fire emergency' },
    { service: 'Tourist Helpline', number: emergencyNums.tourist, description: 'Tourist assistance' },
  ];

  // Add India-specific numbers
  if (country === 'India') {
    emergencyNumbers.push(
      { service: 'Women Helpline', number: '1091', description: '24/7 women safety helpline' },
      { service: 'Road Accident', number: '1073', description: 'National highway accident helpline' }
    );
  }

  // Try to generate AI safety tips
  let aiResponse: Partial<TripSafetyBriefing> = {};

  try {
    const prompt = getSafetyBriefingPrompt(destination, options?.dates);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await llmManager.executeWithFallback<any>({
      system: prompt.system,
      user: prompt.user,
    });

    if (response.success && response.data) {
      aiResponse = parseSafetyResponse(response.data);
      console.log('[SafetyIntel] AI briefing generated successfully');
    }
  } catch (error) {
    console.warn('[SafetyIntel] AI generation failed, using defaults:', error);
  }

  // Find nearby emergency resources if coordinates provided
  let nearbyResources: EmergencyResources | undefined;
  if (options?.coordinates) {
    try {
      nearbyResources = await findEmergencyServices(options.coordinates);
    } catch (error) {
      console.warn('[SafetyIntel] Failed to find nearby resources:', error);
    }
  }

  // Build final briefing
  const briefing: TripSafetyBriefing = {
    destination,
    generatedAt: new Date(),
    emergencyNumbers,
    safetyTips: aiResponse.safetyTips?.length
      ? aiResponse.safetyTips
      : getDefaultSafetyTips(destination),
    commonScams: aiResponse.commonScams?.length
      ? aiResponse.commonScams
      : [
          'Overcharging by taxi/auto drivers - always agree on fare beforehand or use meter',
          'Fake tour guides offering "special deals" - book through verified agencies',
          'Gem/carpet shop scams where tourists are pressured into overpriced purchases',
        ],
    healthAdvisories: aiResponse.healthAdvisories?.length
      ? aiResponse.healthAdvisories
      : [
          'Drink only bottled or purified water',
          'Carry basic medications and a first-aid kit',
          'Be cautious with street food - choose busy stalls with high turnover',
        ],
    weatherConsiderations: aiResponse.weatherConsiderations?.length
      ? aiResponse.weatherConsiderations
      : [
          'Check weather forecast before outdoor activities',
          'Carry sunscreen and stay hydrated in hot weather',
          'Be prepared for sudden weather changes in hilly areas',
        ],
    riskLevel: aiResponse.riskLevel || 'medium',
    riskSummary:
      aiResponse.riskSummary ||
      `${destination} is generally safe for tourists. Exercise normal precautions, stay aware of your surroundings, and follow local guidelines.`,
    nearbyResources,
  };

  // Cache the briefing
  briefingCache.set(cacheKey, { data: briefing, timestamp: Date.now() });

  return briefing;
}

/**
 * Clear briefing cache (useful for testing)
 */
export function clearSafetyBriefingCache(): void {
  briefingCache.clear();
}
