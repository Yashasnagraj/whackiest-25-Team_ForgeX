// ============================================================
// CHAT RECOMMENDATIONS SERVICE
// Generates AI-powered travel recommendations for detected places
// ============================================================

import { LLMProviderManager } from '../ai/providers';
import { detectPlaces, detectRecommendationType } from './place-detection.service';

// Create a singleton instance for recommendations
const llmManager = new LLMProviderManager();

// ==================== Types ====================

export interface PlaceRecommendation {
  name: string;
  description: string;
  rating?: number;
  type: 'beach' | 'temple' | 'fort' | 'nature' | 'market' | 'viewpoint' | 'museum' | 'other';
  mustVisit?: boolean;
}

export interface StayRecommendation {
  name: string;
  description: string;
  priceRange: 'budget' | 'mid' | 'luxury';
  priceEstimate?: string;
  rating?: number;
  amenities?: string[];
}

export interface RestaurantRecommendation {
  name: string;
  description: string;
  cuisine: string;
  priceRange: 'budget' | 'mid' | 'premium';
  rating?: number;
  mustTry?: string;
}

export interface ActivityRecommendation {
  name: string;
  description: string;
  duration?: string;
  bestTime?: string;
  type: 'adventure' | 'cultural' | 'relaxation' | 'nightlife' | 'shopping' | 'food_tour';
}

export interface TravelRecommendations {
  destination: string;
  places: PlaceRecommendation[];
  stays: StayRecommendation[];
  restaurants: RestaurantRecommendation[];
  activities: ActivityRecommendation[];
  bestTimeToVisit?: string;
  weatherTip?: string;
  quickTip?: string;
  generatedAt: Date;
}

// ==================== Cache ====================

const recommendationCache = new Map<string, { data: TravelRecommendations; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// ==================== Prompts ====================

const RECOMMENDATION_PROMPT = `You are a travel expert assistant for Indian travelers. Given a destination, provide helpful travel recommendations.

DESTINATION: {destination}
FOCUS: {focus}

Provide recommendations in the following JSON format:
{
  "places": [
    { "name": "Place Name", "description": "Brief 1-line description", "rating": 4.5, "type": "beach|temple|fort|nature|market|viewpoint|museum|other", "mustVisit": true|false }
  ],
  "stays": [
    { "name": "Hotel Name", "description": "Brief description", "priceRange": "budget|mid|luxury", "priceEstimate": "₹2k-4k/night", "rating": 4.2, "amenities": ["Pool", "WiFi"] }
  ],
  "restaurants": [
    { "name": "Restaurant Name", "description": "Brief description", "cuisine": "Cuisine Type", "priceRange": "budget|mid|premium", "rating": 4.3, "mustTry": "Signature dish" }
  ],
  "activities": [
    { "name": "Activity Name", "description": "Brief description", "duration": "2-3 hours", "bestTime": "Morning", "type": "adventure|cultural|relaxation|nightlife|shopping|food_tour" }
  ],
  "bestTimeToVisit": "October to March",
  "weatherTip": "Current season tip",
  "quickTip": "One useful insider tip for travelers"
}

RULES:
- Provide 3-5 items per category
- Use realistic price estimates in INR (₹)
- Ratings should be between 3.5-5.0
- Keep descriptions concise (under 100 characters)
- Focus on popular and well-reviewed places
- Include mix of budget and premium options for stays/restaurants
- Make quickTip genuinely useful (not generic)

RESPOND ONLY WITH VALID JSON. No markdown, no explanations.`;

// ==================== Main Functions ====================

/**
 * Process a message and generate recommendations if places detected
 */
export async function processMessageForRecommendations(
  message: string,
  _groupId: string
): Promise<{ shouldRespond: boolean; recommendations?: TravelRecommendations; detectedPlace?: string }> {
  // Detect places in message
  const detection = detectPlaces(message);

  if (!detection.shouldRecommend || detection.places.length === 0) {
    return { shouldRespond: false };
  }

  // Get the primary place (highest confidence)
  const primaryPlace = detection.places.reduce((a, b) =>
    a.confidence > b.confidence ? a : b
  );

  // Detect what type of recommendations user wants
  const focus = detectRecommendationType(message);

  // Get recommendations (cached or fresh)
  const recommendations = await getRecommendations(primaryPlace.name, focus);

  if (!recommendations) {
    return { shouldRespond: false };
  }

  return {
    shouldRespond: true,
    recommendations,
    detectedPlace: primaryPlace.name,
  };
}

/**
 * Get recommendations for a destination
 */
export async function getRecommendations(
  destination: string,
  focus: 'all' | 'hotels' | 'restaurants' | 'places' | 'activities' = 'all'
): Promise<TravelRecommendations | null> {
  const cacheKey = `${destination.toLowerCase()}_${focus}`;

  // Check cache
  const cached = recommendationCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log('[ChatRecommendations] Returning cached recommendations for:', destination);
    return cached.data;
  }

  console.log('[ChatRecommendations] Generating recommendations for:', destination);

  try {
    // Build prompt with proper LLMPrompt format
    const userPrompt = RECOMMENDATION_PROMPT
      .replace('{destination}', destination)
      .replace('{focus}', focus === 'all' ? 'All categories' : focus);

    // Call LLM with executeWithFallback
    const response = await llmManager.executeWithFallback<TravelRecommendations>({
      system: 'You are a travel expert assistant for Indian travelers. Always respond with valid JSON only.',
      user: userPrompt,
    });

    if (!response.success || !response.data) {
      console.error('[ChatRecommendations] No response from LLM:', response.error);
      return getFallbackRecommendations(destination);
    }

    const data = response.data;

    // Validate and enhance response
    const recommendations: TravelRecommendations = {
      destination,
      places: Array.isArray(data.places) ? data.places.slice(0, 5) : [],
      stays: Array.isArray(data.stays) ? data.stays.slice(0, 3) : [],
      restaurants: Array.isArray(data.restaurants) ? data.restaurants.slice(0, 3) : [],
      activities: Array.isArray(data.activities) ? data.activities.slice(0, 3) : [],
      bestTimeToVisit: data.bestTimeToVisit || 'Year-round',
      weatherTip: data.weatherTip,
      quickTip: data.quickTip,
      generatedAt: new Date(),
    };

    // Cache the result
    recommendationCache.set(cacheKey, {
      data: recommendations,
      timestamp: Date.now(),
    });

    return recommendations;
  } catch (error) {
    console.error('[ChatRecommendations] Error generating recommendations:', error);
    return getFallbackRecommendations(destination);
  }
}

/**
 * Get a quick tip for a specific place
 */
export async function getQuickTip(placeName: string): Promise<string | null> {
  try {
    const response = await llmManager.executeWithFallback<{ tip: string }>({
      system: 'You are a travel expert. Respond with JSON only: {"tip": "your tip here"}',
      user: `Give me ONE useful insider tip for visiting "${placeName}" in India. Keep it under 100 characters. Just the tip, no introduction.`,
    });
    return response.success && response.data?.tip ? response.data.tip : null;
  } catch (error) {
    console.error('[ChatRecommendations] Error getting quick tip:', error);
    return null;
  }
}

/**
 * Clear recommendation cache
 */
export function clearRecommendationCache(): void {
  recommendationCache.clear();
}

// ==================== Fallback Recommendations ====================

const FALLBACK_DATA: Record<string, Partial<TravelRecommendations>> = {
  goa: {
    places: [
      { name: 'Calangute Beach', description: 'Popular beach with water sports', rating: 4.2, type: 'beach', mustVisit: true },
      { name: 'Chapora Fort', description: 'Iconic fort with sunset views', rating: 4.5, type: 'fort', mustVisit: true },
      { name: 'Dudhsagar Falls', description: 'Spectacular 4-tiered waterfall', rating: 4.7, type: 'nature', mustVisit: true },
    ],
    stays: [
      { name: 'Zostel Goa', description: 'Popular backpacker hostel', priceRange: 'budget', priceEstimate: '₹500-1k/night', rating: 4.3 },
      { name: 'Novotel Goa', description: 'Comfortable mid-range resort', priceRange: 'mid', priceEstimate: '₹5-8k/night', rating: 4.4 },
    ],
    restaurants: [
      { name: 'Curlies', description: 'Iconic beach shack', cuisine: 'Multi-cuisine', priceRange: 'mid', rating: 4.1 },
      { name: 'Gunpowder', description: 'South Indian coastal cuisine', cuisine: 'South Indian', priceRange: 'mid', rating: 4.5 },
    ],
    bestTimeToVisit: 'November to February',
    quickTip: 'Rent a scooter to explore - it\'s the best way to get around!',
  },
  manali: {
    places: [
      { name: 'Solang Valley', description: 'Adventure sports hub', rating: 4.5, type: 'nature', mustVisit: true },
      { name: 'Rohtang Pass', description: 'High altitude mountain pass', rating: 4.6, type: 'viewpoint', mustVisit: true },
      { name: 'Old Manali', description: 'Charming hippie village', rating: 4.3, type: 'market', mustVisit: true },
    ],
    stays: [
      { name: 'Zostel Manali', description: 'Backpacker favorite', priceRange: 'budget', priceEstimate: '₹600-1.2k/night', rating: 4.2 },
      { name: 'The Manali Inn', description: 'Cozy boutique hotel', priceRange: 'mid', priceEstimate: '₹3-5k/night', rating: 4.4 },
    ],
    restaurants: [
      { name: 'Drifters Inn', description: 'Traveler hangout spot', cuisine: 'Multi-cuisine', priceRange: 'budget', rating: 4.2 },
      { name: 'Cafe 1947', description: 'Live music and vibes', cuisine: 'Continental', priceRange: 'mid', rating: 4.4 },
    ],
    bestTimeToVisit: 'March to June, October to February',
    quickTip: 'Book Rohtang permits online at least 1 day in advance!',
  },
  kerala: {
    places: [
      { name: 'Alleppey Backwaters', description: 'Iconic houseboat experience', rating: 4.7, type: 'nature', mustVisit: true },
      { name: 'Munnar Tea Gardens', description: 'Scenic hill station', rating: 4.6, type: 'nature', mustVisit: true },
      { name: 'Fort Kochi', description: 'Historic Portuguese quarter', rating: 4.4, type: 'museum', mustVisit: true },
    ],
    stays: [
      { name: 'Vedanta Wake Up', description: 'Clean budget chain', priceRange: 'budget', priceEstimate: '₹1-2k/night', rating: 4.1 },
      { name: 'Kumarakom Lake Resort', description: 'Luxury backwater resort', priceRange: 'luxury', priceEstimate: '₹15-25k/night', rating: 4.8 },
    ],
    restaurants: [
      { name: 'Paragon Restaurant', description: 'Legendary Malabar food', cuisine: 'Kerala', priceRange: 'mid', rating: 4.5, mustTry: 'Malabar Biryani' },
      { name: 'Kayees Rahmathulla', description: 'Authentic Kerala meals', cuisine: 'Kerala', priceRange: 'budget', rating: 4.4 },
    ],
    bestTimeToVisit: 'September to March',
    quickTip: 'Try a Kerala Sadhya (feast) on a banana leaf - unforgettable!',
  },
};

function getFallbackRecommendations(destination: string): TravelRecommendations {
  const lowerDest = destination.toLowerCase();
  const fallback = FALLBACK_DATA[lowerDest];

  if (fallback) {
    return {
      destination,
      places: fallback.places || [],
      stays: fallback.stays || [],
      restaurants: fallback.restaurants || [],
      activities: [],
      bestTimeToVisit: fallback.bestTimeToVisit || 'Year-round',
      quickTip: fallback.quickTip,
      generatedAt: new Date(),
    };
  }

  // Generic fallback
  return {
    destination,
    places: [
      { name: `Top attractions in ${destination}`, description: 'Explore the local highlights', rating: 4.0, type: 'other' },
    ],
    stays: [
      { name: 'Local hotels', description: 'Check booking.com for options', priceRange: 'mid', rating: 4.0 },
    ],
    restaurants: [
      { name: 'Local cuisine', description: 'Ask locals for recommendations', priceRange: 'mid', cuisine: 'Local', rating: 4.0 },
    ],
    activities: [],
    bestTimeToVisit: 'Check local weather',
    quickTip: `Research ${destination} on travel blogs for insider tips!`,
    generatedAt: new Date(),
  };
}
