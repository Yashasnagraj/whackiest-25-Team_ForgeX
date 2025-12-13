// Web Search Service for Place Research
// Uses multiple search APIs with fallback to LLM knowledge
// NO CORS proxy dependencies - all APIs support direct browser access

import type { WebSearchResult, PlaceSearchResults } from './place-research.types';
import { LLMProviderManager } from '../ai/providers';
import { retryWithBackoff } from '../ai/utils/retry-utils';

// Rate limiting configuration
let lastSearchTime = 0;
const SEARCH_DELAY_MS = 500; // 500ms between searches

// Results cache with TTL
interface CacheEntry {
  results: PlaceSearchResults;
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Retry configuration for search APIs
const SEARCH_RETRY_CONFIG = {
  maxRetries: 2,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffFactor: 2,
  jitterMs: 200,
};

/**
 * Wait to respect rate limits
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastSearchTime;
  if (elapsed < SEARCH_DELAY_MS) {
    await new Promise(r => setTimeout(r, SEARCH_DELAY_MS - elapsed));
  }
  lastSearchTime = Date.now();
}

/**
 * Get cached search results if valid
 */
function getCachedResults(query: string): PlaceSearchResults | null {
  const entry = searchCache.get(query.toLowerCase());
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    searchCache.delete(query.toLowerCase());
    return null;
  }

  return entry.results;
}

/**
 * Cache search results
 */
function cacheResults(query: string, results: PlaceSearchResults): void {
  searchCache.set(query.toLowerCase(), {
    results,
    timestamp: Date.now(),
  });

  // Limit cache size
  if (searchCache.size > 200) {
    const entries = Array.from(searchCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 50; i++) {
      searchCache.delete(entries[i][0]);
    }
  }
}

/**
 * Search using Serper.dev (Google Search API)
 * Free tier: 2,500 queries/month
 * CORS-friendly - direct browser access
 */
async function searchSerper(query: string): Promise<WebSearchResult[]> {
  const apiKey = import.meta.env.VITE_SERPER_API_KEY;

  if (!apiKey) {
    return [];
  }

  await waitForRateLimit();

  try {
    const response = await retryWithBackoff(
      async () => {
        const res = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: query,
            num: 5,
          }),
        });

        if (!res.ok) {
          const error = new Error(`Serper API error: ${res.status}`);
          (error as any).status = res.status;
          if (res.status === 429) {
            (error as any).isRetryable = true;
          }
          throw error;
        }

        return res;
      },
      {
        ...SEARCH_RETRY_CONFIG,
        onRetry: (attempt, error) => {
          console.warn(`[Serper] Retry ${attempt}: ${error.message}`);
        },
      }
    );

    const data = await response.json();

    const results: WebSearchResult[] = [];

    // Add knowledge graph if available (highest quality)
    if (data.knowledgeGraph) {
      const kg = data.knowledgeGraph;
      if (kg.description) {
        results.push({
          title: kg.title || query,
          url: kg.website || '',
          snippet: kg.description,
          displayUrl: 'Knowledge Graph',
        });
      }
    }

    // Add organic results
    if (data.organic) {
      for (const item of data.organic.slice(0, 5)) {
        results.push({
          title: item.title,
          url: item.link,
          snippet: item.snippet,
          displayUrl: item.displayLink,
        });
      }
    }

    return results;
  } catch (error) {
    console.warn('[WebSearch] Serper search failed:', error);
    return [];
  }
}

/**
 * Search using Tavily API (AI-optimized search)
 * Free tier: 1,000 queries/month
 * CORS-friendly - direct browser access
 */
async function searchTavily(query: string): Promise<WebSearchResult[]> {
  const apiKey = import.meta.env.VITE_TAVILY_API_KEY;

  if (!apiKey) {
    return [];
  }

  await waitForRateLimit();

  try {
    const response = await retryWithBackoff(
      async () => {
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: apiKey,
            query: query,
            search_depth: 'basic',
            max_results: 5,
            include_answer: true,
          }),
        });

        if (!res.ok) {
          const error = new Error(`Tavily API error: ${res.status}`);
          (error as any).status = res.status;
          if (res.status === 429) {
            (error as any).isRetryable = true;
          }
          throw error;
        }

        return res;
      },
      {
        ...SEARCH_RETRY_CONFIG,
        onRetry: (attempt, error) => {
          console.warn(`[Tavily] Retry ${attempt}: ${error.message}`);
        },
      }
    );

    const data = await response.json();

    const results: WebSearchResult[] = [];

    // Add AI-generated answer if available (highest quality)
    if (data.answer) {
      results.push({
        title: `About: ${query}`,
        url: '',
        snippet: data.answer,
        displayUrl: 'Tavily AI',
      });
    }

    // Add search results
    if (data.results) {
      for (const item of data.results.slice(0, 4)) {
        results.push({
          title: item.title,
          url: item.url,
          snippet: item.content,
        });
      }
    }

    return results;
  } catch (error) {
    console.warn('[WebSearch] Tavily search failed:', error);
    return [];
  }
}

/**
 * Search using Google Custom Search (if API key available)
 * CORS-friendly - direct browser access
 */
async function searchGoogle(query: string): Promise<WebSearchResult[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY;
  const searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    return [];
  }

  await waitForRateLimit();

  try {
    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(
          `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=5`
        );

        if (!res.ok) {
          const error = new Error(`Google Search API error: ${res.status}`);
          (error as any).status = res.status;
          if (res.status === 429) {
            (error as any).isRetryable = true;
          }
          throw error;
        }

        return res;
      },
      {
        ...SEARCH_RETRY_CONFIG,
        onRetry: (attempt, error) => {
          console.warn(`[Google] Retry ${attempt}: ${error.message}`);
        },
      }
    );

    const data = await response.json();

    return (data.items || []).map((item: { title: string; link: string; snippet: string; displayLink?: string }) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      displayUrl: item.displayLink,
    }));
  } catch (error) {
    console.warn('[WebSearch] Google search failed:', error);
    return [];
  }
}

/**
 * Use LLM to generate knowledge about a place from its training data
 * This is the main fallback when web search APIs are not available or fail
 */
async function getLLMKnowledge(placeName: string, region: string): Promise<WebSearchResult[]> {
  const llmManager = new LLMProviderManager();

  const prompt = {
    system: `You are a knowledgeable travel guide with extensive information about tourist destinations worldwide.
Provide accurate, factual information about places. If you're not certain about specific details, indicate that.
Return your response as a JSON object.`,
    user: `Provide detailed travel information about "${placeName}" in ${region}.

Return JSON with these exact fields:
{
  "description": "2-3 sentence description of the place",
  "bestTimeToVisit": "Best time of day/season to visit and why",
  "typicalDuration": "How long visitors typically spend (in minutes as number)",
  "openingHours": "Typical opening hours like '09:00-18:00' or 'Open 24 hours' or 'Varies'",
  "entryFee": "Entry fee in INR (number) or null if free",
  "highlights": "Top 3 things to see/do there",
  "nearbyAttractions": "2-3 nearby places worth visiting",
  "nearbyRestaurants": "2-3 popular restaurants nearby",
  "crowdInfo": "When it gets crowded vs quiet times",
  "tips": "1-2 practical tips for visitors"
}`
  };

  try {
    const response = await llmManager.executeWithFallback<{
      description: string;
      bestTimeToVisit: string;
      typicalDuration: number;
      openingHours: string;
      entryFee: number | null;
      highlights: string;
      nearbyAttractions: string;
      nearbyRestaurants: string;
      crowdInfo: string;
      tips: string;
    }>(prompt);

    if (response.success && response.data) {
      const data = response.data;

      // Convert LLM response to search results format
      return [
        {
          title: placeName,
          url: `https://www.google.com/search?q=${encodeURIComponent(placeName + ' ' + region)}`,
          snippet: data.description || `${placeName} is a popular destination in ${region}.`,
        },
        {
          title: `${placeName} - Visitor Information`,
          url: '',
          snippet: `Best time: ${data.bestTimeToVisit || 'Morning or evening'}. Duration: ${data.typicalDuration || 60} minutes. Hours: ${data.openingHours || 'Varies'}. ${data.entryFee ? `Entry: ₹${data.entryFee}` : 'Free entry'}.`,
        },
        {
          title: `${placeName} - Highlights & Tips`,
          url: '',
          snippet: `Highlights: ${data.highlights || 'Various attractions'}. Tips: ${data.tips || 'Carry water and comfortable shoes'}.`,
        },
        {
          title: `Near ${placeName} - Food & Attractions`,
          url: '',
          snippet: `Nearby restaurants: ${data.nearbyRestaurants || 'Local eateries available'}. Nearby attractions: ${data.nearbyAttractions || 'Other tourist spots in the area'}.`,
        },
        {
          title: `${placeName} - Crowd Information`,
          url: '',
          snippet: data.crowdInfo || 'Can get busy during peak tourist season and weekends.',
        },
      ];
    }
  } catch (error) {
    console.warn('[WebSearch] LLM knowledge extraction failed:', error);
  }

  return [];
}

/**
 * Main search function - combines multiple sources with smart fallback
 * Priority: Serper → Tavily → Google → LLM Knowledge
 *
 * Note: Works WITHOUT any API keys using LLM fallback
 * NO CORS proxies needed - all APIs support direct browser access
 */
export async function searchPlace(
  placeName: string,
  region: string,
  additionalTerms: string[] = []
): Promise<PlaceSearchResults> {
  const baseQuery = `${placeName} ${region}`;
  const travelQuery = `${baseQuery} travel guide ${additionalTerms.join(' ')}`.trim();

  // Check cache first
  const cached = getCachedResults(travelQuery);
  if (cached) {
    console.log(`[WebSearch] Cache hit for: ${travelQuery}`);
    return cached;
  }

  console.log(`[WebSearch] Searching for: ${travelQuery}`);

  let results: WebSearchResult[] = [];
  let searchEngine: 'duckduckgo' | 'brave' | 'serper' = 'serper';

  // Try Serper first (best quality, if API key available)
  results = await searchSerper(travelQuery);
  if (results.length >= 3) {
    searchEngine = 'serper';
    console.log(`[WebSearch] Using Serper (${results.length} results)`);
  }

  // Try Tavily (AI-optimized, good for travel info)
  if (results.length < 3) {
    const tavilyResults = await searchTavily(travelQuery);
    results = [...results, ...tavilyResults];
    if (tavilyResults.length > 0) {
      console.log(`[WebSearch] Added Tavily results (${tavilyResults.length})`);
    }
  }

  // Try Google Custom Search (if configured)
  if (results.length < 3) {
    const googleResults = await searchGoogle(travelQuery);
    results = [...results, ...googleResults];
    if (googleResults.length > 0) {
      console.log(`[WebSearch] Added Google results (${googleResults.length})`);
    }
  }

  // Final fallback: LLM knowledge extraction (always available)
  if (results.length < 3) {
    console.log('[WebSearch] Using LLM knowledge fallback');
    const llmResults = await getLLMKnowledge(placeName, region);
    results = [...results, ...llmResults];
  }

  // Deduplicate by URL/title
  const seen = new Set<string>();
  results = results.filter(r => {
    const key = r.url || r.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[WebSearch] Found ${results.length} results for ${placeName}`);

  const searchResults: PlaceSearchResults = {
    query: travelQuery,
    results: results.slice(0, 10), // Max 10 results
    totalResults: results.length,
    searchEngine,
  };

  // Cache the results
  cacheResults(travelQuery, searchResults);

  return searchResults;
}

/**
 * Search for nearby restaurants/cafes around a location
 */
export async function searchNearbyFood(
  mainPlaceName: string,
  region: string
): Promise<WebSearchResult[]> {
  const query = `best restaurants cafes near ${mainPlaceName} ${region}`;

  console.log(`[WebSearch] Searching nearby food: ${query}`);

  // Try search APIs first
  let results = await searchSerper(query);

  if (results.length < 2) {
    const tavilyResults = await searchTavily(query);
    results = [...results, ...tavilyResults];
  }

  // Supplement with LLM if needed
  if (results.length < 2) {
    const llmResults = await getLLMKnowledge(`restaurants near ${mainPlaceName}`, region);
    results = [...results, ...llmResults];
  }

  return results.slice(0, 5);
}

/**
 * Search for nearby attractions around a location
 */
export async function searchNearbyAttractions(
  mainPlaceName: string,
  region: string
): Promise<WebSearchResult[]> {
  const query = `tourist attractions places to visit near ${mainPlaceName} ${region}`;

  console.log(`[WebSearch] Searching nearby attractions: ${query}`);

  // Try search APIs first
  let results = await searchSerper(query);

  if (results.length < 2) {
    const tavilyResults = await searchTavily(query);
    results = [...results, ...tavilyResults];
  }

  if (results.length < 2) {
    const llmResults = await getLLMKnowledge(`attractions near ${mainPlaceName}`, region);
    results = [...results, ...llmResults];
  }

  return results.slice(0, 5);
}

/**
 * Clear search cache
 */
export function clearSearchCache(): void {
  searchCache.clear();
}
