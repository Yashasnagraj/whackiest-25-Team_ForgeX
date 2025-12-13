// ============================================================
// PLACE DETECTION SERVICE
// Detects place mentions in chat messages for AI recommendations
// ============================================================

// Known Indian destinations for pattern matching
const INDIAN_DESTINATIONS = [
  // States & Regions
  'goa', 'kerala', 'rajasthan', 'himachal', 'uttarakhand', 'kashmir',
  'ladakh', 'sikkim', 'meghalaya', 'assam', 'karnataka', 'tamil nadu',
  'andhra pradesh', 'telangana', 'maharashtra', 'gujarat', 'punjab',
  'west bengal', 'odisha', 'madhya pradesh', 'chhattisgarh',

  // Popular Cities
  'mumbai', 'delhi', 'bangalore', 'bengaluru', 'chennai', 'kolkata',
  'hyderabad', 'pune', 'ahmedabad', 'jaipur', 'lucknow', 'kochi',
  'thiruvananthapuram', 'chandigarh', 'bhopal', 'indore', 'nagpur',
  'visakhapatnam', 'vizag', 'coimbatore', 'madurai', 'mysore', 'mysuru',

  // Hill Stations
  'manali', 'shimla', 'mussoorie', 'nainital', 'darjeeling', 'ooty',
  'kodaikanal', 'munnar', 'coorg', 'lonavala', 'mahabaleshwar',
  'mount abu', 'pahalgam', 'gulmarg', 'dharamshala', 'mcleodganj',
  'kasol', 'bir billing', 'tirthan valley', 'spiti', 'leh',

  // Beaches
  'gokarna', 'varkala', 'kovalam', 'pondicherry', 'puducherry',
  'andaman', 'lakshadweep', 'diu', 'daman', 'alibaug', 'tarkarli',
  'puri', 'digha', 'mandarmani', 'ganpatipule',

  // Goa Specific
  'calangute', 'baga', 'anjuna', 'vagator', 'arambol', 'palolem',
  'agonda', 'candolim', 'morjim', 'ashwem', 'chapora', 'panaji',
  'margao', 'mapusa', 'old goa', 'dudhsagar',

  // Heritage & Pilgrimage
  'varanasi', 'rishikesh', 'haridwar', 'amritsar', 'bodh gaya',
  'ajmer', 'pushkar', 'udaipur', 'jodhpur', 'jaisalmer', 'bikaner',
  'agra', 'fatehpur sikri', 'khajuraho', 'hampi', 'badami', 'pattadakal',
  'mahabalipuram', 'thanjavur', 'madurai', 'rameswaram', 'kanyakumari',
  'tirupati', 'shirdi', 'dwarka', 'somnath', 'mathura', 'vrindavan',

  // Wildlife & Nature
  'jim corbett', 'ranthambore', 'kaziranga', 'sundarbans', 'periyar',
  'bandhavgarh', 'kanha', 'gir', 'bharatpur', 'valley of flowers',
  'coorg', 'wayanad', 'thekkady', 'kabini', 'bandipur', 'nagarhole',

  // Northeast
  'shillong', 'cherrapunji', 'tawang', 'ziro', 'majuli', 'kaziranga',
  'gangtok', 'pelling', 'ravangla', 'lachung', 'yumthang',

  // International (Popular from India)
  'thailand', 'bangkok', 'phuket', 'pattaya', 'krabi', 'chiang mai',
  'bali', 'singapore', 'malaysia', 'kuala lumpur', 'langkawi',
  'dubai', 'abu dhabi', 'maldives', 'sri lanka', 'colombo', 'nepal',
  'kathmandu', 'pokhara', 'bhutan', 'vietnam', 'hanoi', 'ho chi minh',
  'cambodia', 'europe', 'paris', 'london', 'switzerland', 'italy',
  'greece', 'santorini', 'amsterdam', 'barcelona', 'rome', 'venice',
  'new york', 'los angeles', 'san francisco', 'las vegas',
  'australia', 'sydney', 'melbourne', 'new zealand', 'japan', 'tokyo',
];

// Context keywords that indicate place intent
const PLACE_CONTEXT_KEYWORDS = [
  'visit', 'go to', 'travel', 'trip', 'vacation', 'holiday',
  'explore', 'tour', 'weekend', 'getaway', 'plan', 'planning',
  'book', 'booking', 'hotel', 'resort', 'stay', 'accommodation',
  'flight', 'train', 'bus', 'drive', 'road trip',
  'beach', 'mountain', 'hill station', 'temple', 'fort', 'palace',
  'restaurant', 'food', 'eat', 'cafe', 'bar', 'nightlife',
  'activities', 'things to do', 'places', 'sightseeing',
];

// Cache for debouncing recommendations
const recommendationCache = new Map<string, number>();
const DEBOUNCE_TIME = 5 * 60 * 1000; // 5 minutes

export interface DetectedPlace {
  name: string;
  originalText: string;
  confidence: number;
  context?: string;
  type: 'destination' | 'specific_place' | 'activity';
}

export interface PlaceDetectionResult {
  hasPlaces: boolean;
  places: DetectedPlace[];
  shouldRecommend: boolean;
  reason?: string;
}

/**
 * Detect places mentioned in a message
 */
export function detectPlaces(message: string): PlaceDetectionResult {
  const lowerMessage = message.toLowerCase();
  const detectedPlaces: DetectedPlace[] = [];

  // Skip very short messages
  if (message.length < 3) {
    return { hasPlaces: false, places: [], shouldRecommend: false };
  }

  // Skip messages that are just emojis or reactions (basic emoji range check)
  const emojiOnlyRegex = /^[\s\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u;
  if (emojiOnlyRegex.test(message)) {
    return { hasPlaces: false, places: [], shouldRecommend: false };
  }

  // Check for known destinations
  for (const destination of INDIAN_DESTINATIONS) {
    // Create word boundary regex for the destination
    const regex = new RegExp(`\\b${escapeRegex(destination)}\\b`, 'i');
    const match = message.match(regex);

    if (match) {
      // Calculate confidence based on context
      let confidence = 70;

      // Boost confidence if context keywords are present
      const hasContext = PLACE_CONTEXT_KEYWORDS.some(keyword =>
        lowerMessage.includes(keyword)
      );
      if (hasContext) {
        confidence += 20;
      }

      // Boost for question marks (planning questions)
      if (message.includes('?')) {
        confidence += 5;
      }

      // Detect context type
      let context: string | undefined;
      if (lowerMessage.includes('hotel') || lowerMessage.includes('stay') || lowerMessage.includes('resort')) {
        context = 'accommodation';
      } else if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
        context = 'food';
      } else if (lowerMessage.includes('visit') || lowerMessage.includes('see') || lowerMessage.includes('explore')) {
        context = 'sightseeing';
      }

      detectedPlaces.push({
        name: capitalizePlace(destination),
        originalText: match[0],
        confidence: Math.min(confidence, 100),
        context,
        type: isSpecificPlace(destination) ? 'specific_place' : 'destination',
      });
    }
  }

  // Remove duplicates (keep highest confidence)
  const uniquePlaces = deduplicatePlaces(detectedPlaces);

  // Check if we should recommend (debounce)
  let shouldRecommend = uniquePlaces.length > 0;
  let reason: string | undefined;

  if (shouldRecommend) {
    // Check debounce for each place
    const now = Date.now();
    const placesToRecommend = uniquePlaces.filter(place => {
      const cacheKey = place.name.toLowerCase();
      const lastRecommended = recommendationCache.get(cacheKey);

      if (lastRecommended && (now - lastRecommended) < DEBOUNCE_TIME) {
        return false;
      }

      return true;
    });

    if (placesToRecommend.length === 0) {
      shouldRecommend = false;
      reason = 'Recently recommended';
    } else {
      // Update cache for places we'll recommend
      placesToRecommend.forEach(place => {
        recommendationCache.set(place.name.toLowerCase(), now);
      });
    }
  }

  return {
    hasPlaces: uniquePlaces.length > 0,
    places: uniquePlaces,
    shouldRecommend,
    reason,
  };
}

/**
 * Check if a message is asking about a specific type of recommendation
 */
export function detectRecommendationType(message: string): 'all' | 'hotels' | 'restaurants' | 'places' | 'activities' {
  const lower = message.toLowerCase();

  if (lower.includes('hotel') || lower.includes('stay') || lower.includes('resort') || lower.includes('accommodation')) {
    return 'hotels';
  }
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('eat') || lower.includes('cafe')) {
    return 'restaurants';
  }
  if (lower.includes('visit') || lower.includes('see') || lower.includes('attraction') || lower.includes('sightseeing')) {
    return 'places';
  }
  if (lower.includes('activity') || lower.includes('adventure') || lower.includes('things to do') || lower.includes('experience')) {
    return 'activities';
  }

  return 'all';
}

/**
 * Clear the recommendation cache (for testing)
 */
export function clearRecommendationCache(): void {
  recommendationCache.clear();
}

/**
 * Check if a place was recently recommended
 */
export function wasRecentlyRecommended(placeName: string): boolean {
  const cacheKey = placeName.toLowerCase();
  const lastRecommended = recommendationCache.get(cacheKey);

  if (!lastRecommended) return false;

  return (Date.now() - lastRecommended) < DEBOUNCE_TIME;
}

// ==================== Helper Functions ====================

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capitalizePlace(place: string): string {
  return place
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function isSpecificPlace(place: string): boolean {
  // Specific beaches, temples, forts etc.
  const specificPlaces = [
    'calangute', 'baga', 'anjuna', 'vagator', 'arambol', 'palolem',
    'chapora', 'dudhsagar', 'taj mahal', 'qutub minar', 'gateway of india',
    'india gate', 'hawa mahal', 'amber fort', 'red fort',
  ];
  return specificPlaces.includes(place.toLowerCase());
}

function deduplicatePlaces(places: DetectedPlace[]): DetectedPlace[] {
  const seen = new Map<string, DetectedPlace>();

  for (const place of places) {
    const key = place.name.toLowerCase();
    const existing = seen.get(key);

    if (!existing || place.confidence > existing.confidence) {
      seen.set(key, place);
    }
  }

  return Array.from(seen.values());
}
