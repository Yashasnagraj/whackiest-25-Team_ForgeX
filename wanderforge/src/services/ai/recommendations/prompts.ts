// AI Recommendation Prompts for Trip Planner
// Prompts for region suggestions, place recommendations, and gap analysis

/**
 * Prompt for suggesting regions based on partial input
 */
export function getRegionSuggestionsPrompt(partialInput: string): { system: string; user: string } {
  return {
    system: `You are a travel expert specializing in Indian destinations.
Given a partial region name, suggest matching travel destinations in India.
Return ONLY valid JSON with no additional text.`,
    user: `User typed: "${partialInput}"

Suggest up to 5 popular travel destinations in India that match this input.
Consider:
- Popular tourist destinations
- Cities, hill stations, beaches, heritage sites
- Common spelling variations

Return JSON format:
{
  "suggestions": [
    {
      "name": "Destination Name",
      "state": "State Name",
      "country": "India",
      "description": "Brief 1-line description",
      "popularPlaces": ["Place 1", "Place 2", "Place 3"],
      "bestSeasons": ["Oct-Feb", "Winter"],
      "typicalDuration": "3-5 days"
    }
  ]
}`,
  };
}

/**
 * Prompt for getting popular places in a region based on interests
 */
export function getPopularPlacesPrompt(
  region: string,
  interests: string[],
  webSearchResults?: string
): { system: string; user: string } {
  const interestsList = interests.length > 0 ? interests.join(', ') : 'general sightseeing';

  return {
    system: `You are a travel expert with deep knowledge of Indian destinations.
Suggest popular places to visit in a region based on traveler interests.
Return ONLY valid JSON with no additional text.`,
    user: `Region: ${region}
Traveler Interests: ${interestsList}
${webSearchResults ? `\nWeb Search Results:\n${webSearchResults}` : ''}

Suggest 8-10 popular places that match these interests.
For each place, explain WHY it matches the traveler's interests.

Return JSON format:
{
  "places": [
    {
      "name": "Place Name",
      "type": "beach|landmark|restaurant|activity|temple|fort|nature|nightlife|market",
      "reason": "Why this place matches their interests (1 sentence)",
      "description": "Brief description (1-2 sentences)",
      "confidence": 85
    }
  ]
}

Confidence scores:
- 90-100: Must-visit, very popular
- 70-89: Highly recommended
- 50-69: Good option
- Below 50: Nice to have`,
  };
}

/**
 * Prompt for real-time place search suggestions
 */
export function getPlaceSearchPrompt(
  query: string,
  region: string,
  webSearchResults?: string
): { system: string; user: string } {
  return {
    system: `You are a travel search assistant. Help users find specific places in a region.
Return ONLY valid JSON with no additional text.`,
    user: `Search query: "${query}"
Region: ${region}
${webSearchResults ? `\nWeb Search Results:\n${webSearchResults}` : ''}

Find places matching this search query in ${region}.
Return up to 6 relevant results.

Return JSON format:
{
  "results": [
    {
      "name": "Full Place Name",
      "type": "beach|landmark|restaurant|activity|temple|fort|nature|nightlife|market|hotel",
      "description": "Brief description",
      "matchReason": "Why this matches the search"
    }
  ]
}`,
  };
}

/**
 * Prompt for analyzing missed places (post-generation recommendations)
 */
export function getMissedRecommendationsPrompt(
  region: string,
  selectedPlaces: string[],
  interests: string[],
  webSearchResults?: string
): { system: string; user: string } {
  return {
    system: `You are a travel advisor helping travelers discover places they might have missed.
Analyze their selected places and suggest hidden gems or must-visit spots they overlooked.
Return ONLY valid JSON with no additional text.`,
    user: `Region: ${region}
Selected Places: ${selectedPlaces.join(', ')}
Interests: ${interests.join(', ') || 'general sightseeing'}
${webSearchResults ? `\nWeb Search Results (hidden gems, local favorites):\n${webSearchResults}` : ''}

Analyze what's MISSING from their trip:
1. Check if they're missing any iconic/must-visit places
2. Look for hidden gems that match their interests
3. Consider variety (do they only have beaches? suggest a fort!)
4. Think about nearby places that complement their route

Suggest 3-5 places they might have missed, with compelling reasons.

Return JSON format:
{
  "recommendations": [
    {
      "name": "Place Name",
      "type": "beach|landmark|restaurant|activity|temple|fort|nature|nightlife|market",
      "reason": "Compelling reason why they should visit (2-3 sentences, personalized to their interests)",
      "description": "What makes this place special",
      "bestTimeToVisit": "Morning/Afternoon/Evening/Sunset",
      "estimatedDuration": "2-3 hours",
      "source": "gap_analysis"
    }
  ],
  "analysis": "Brief analysis of what categories/areas they're missing"
}`,
  };
}

/**
 * Prompt for enriching place data with details
 */
export function getPlaceDetailsPrompt(
  placeName: string,
  region: string,
  webSearchResults?: string
): { system: string; user: string } {
  return {
    system: `You are a travel information assistant. Extract detailed information about a place.
Return ONLY valid JSON with no additional text.`,
    user: `Place: ${placeName}
Region: ${region}
${webSearchResults ? `\nWeb Search Results:\n${webSearchResults}` : ''}

Extract details about this place:

Return JSON format:
{
  "name": "Full official name",
  "type": "beach|landmark|restaurant|activity|temple|fort|nature|nightlife|market",
  "description": "2-3 sentence description",
  "highlights": ["Highlight 1", "Highlight 2"],
  "bestTimeToVisit": "Best time of day or season",
  "estimatedDuration": "Time to spend here",
  "entryFee": "Free or approximate cost",
  "tips": ["Tip 1", "Tip 2"]
}`,
  };
}

/**
 * Prompt for generating a trip summary/tagline
 */
export function getTripSummaryPrompt(
  region: string,
  days: number,
  interests: string[],
  places: string[]
): { system: string; user: string } {
  return {
    system: `You are a creative travel writer. Generate an engaging trip summary.
Return ONLY valid JSON with no additional text.`,
    user: `Region: ${region}
Duration: ${days} days
Interests: ${interests.join(', ')}
Places: ${places.slice(0, 10).join(', ')}

Generate a catchy title and brief summary for this trip.

Return JSON format:
{
  "title": "Catchy trip title (e.g., '5-Day Goa Beach Adventure')",
  "tagline": "One-line tagline",
  "summary": "2-3 sentence trip summary highlighting the best parts"
}`,
  };
}
