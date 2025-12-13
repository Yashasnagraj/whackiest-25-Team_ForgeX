// Emergency Locator Service
// Finds nearby hospitals, police stations, pharmacies using OpenStreetMap data
// Uses Photon (Komoot) API for fast, reliable geocoding

import type { Coords } from '../itinerary/types';

export interface EmergencyService {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'pharmacy' | 'fire_station';
  coordinates: Coords;
  distance: number; // in km
  address?: string;
  phone?: string;
  openNow?: boolean;
}

export interface EmergencyResources {
  hospitals: EmergencyService[];
  police: EmergencyService[];
  pharmacies: EmergencyService[];
  fireStations: EmergencyService[];
  lastUpdated: Date;
  searchCenter: Coords;
}

// Overpass API for OSM data queries
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

// Cache for emergency resources
const emergencyCache = new Map<string, { data: EmergencyResources; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Calculate haversine distance between two coordinates (in km)
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate cache key from coordinates
 */
function getCacheKey(coords: Coords): string {
  // Round to 2 decimal places (~1km precision) for cache efficiency
  return `${coords.lat.toFixed(2)}_${coords.lng.toFixed(2)}`;
}

/**
 * Build Overpass query for emergency services
 */
function buildOverpassQuery(center: Coords, radiusMeters: number = 10000): string {
  const { lat, lng } = center;

  return `
    [out:json][timeout:25];
    (
      // Hospitals
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});

      // Police stations
      node["amenity"="police"](around:${radiusMeters},${lat},${lng});
      way["amenity"="police"](around:${radiusMeters},${lat},${lng});

      // Pharmacies
      node["amenity"="pharmacy"](around:${radiusMeters},${lat},${lng});
      way["amenity"="pharmacy"](around:${radiusMeters},${lat},${lng});

      // Fire stations
      node["amenity"="fire_station"](around:${radiusMeters},${lat},${lng});
      way["amenity"="fire_station"](around:${radiusMeters},${lat},${lng});
    );
    out center body;
  `.trim();
}

/**
 * Parse Overpass API response into EmergencyService objects
 */
function parseOverpassResponse(
  elements: any[],
  center: Coords
): {
  hospitals: EmergencyService[];
  police: EmergencyService[];
  pharmacies: EmergencyService[];
  fireStations: EmergencyService[];
} {
  const hospitals: EmergencyService[] = [];
  const police: EmergencyService[] = [];
  const pharmacies: EmergencyService[] = [];
  const fireStations: EmergencyService[] = [];

  for (const el of elements) {
    // Get coordinates (either direct or from center for ways)
    const lat = el.lat || el.center?.lat;
    const lng = el.lon || el.center?.lon;

    if (!lat || !lng) continue;

    const tags = el.tags || {};
    const amenity = tags.amenity;

    if (!amenity) continue;

    const distance = haversineDistance(center.lat, center.lng, lat, lng);

    const service: EmergencyService = {
      id: `${el.type}-${el.id}`,
      name: tags.name || tags['name:en'] || getDefaultName(amenity),
      type: amenity as EmergencyService['type'],
      coordinates: { lat, lng },
      distance: Math.round(distance * 10) / 10,
      address: formatAddress(tags),
      phone: tags.phone || tags['contact:phone'],
    };

    switch (amenity) {
      case 'hospital':
        hospitals.push(service);
        break;
      case 'police':
        police.push(service);
        break;
      case 'pharmacy':
        pharmacies.push(service);
        break;
      case 'fire_station':
        fireStations.push(service);
        break;
    }
  }

  // Sort by distance
  hospitals.sort((a, b) => a.distance - b.distance);
  police.sort((a, b) => a.distance - b.distance);
  pharmacies.sort((a, b) => a.distance - b.distance);
  fireStations.sort((a, b) => a.distance - b.distance);

  return { hospitals, police, pharmacies, fireStations };
}

/**
 * Get default name for service type
 */
function getDefaultName(type: string): string {
  const names: Record<string, string> = {
    hospital: 'Hospital',
    police: 'Police Station',
    pharmacy: 'Pharmacy',
    fire_station: 'Fire Station',
  };
  return names[type] || 'Emergency Service';
}

/**
 * Format address from OSM tags
 */
function formatAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    tags['addr:street'],
    tags['addr:housenumber'],
    tags['addr:city'],
    tags['addr:postcode'],
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : undefined;
}

/**
 * Find emergency services near a location
 * Uses Overpass API to query OpenStreetMap data
 */
export async function findEmergencyServices(
  center: Coords,
  radiusKm: number = 10
): Promise<EmergencyResources> {
  const cacheKey = getCacheKey(center);

  // Check cache
  const cached = emergencyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[EmergencyLocator] Returning cached results');
    return cached.data;
  }

  console.log(`[EmergencyLocator] Searching near ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`);

  try {
    const query = buildOverpassQuery(center, radiusKm * 1000);

    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    const parsed = parseOverpassResponse(data.elements || [], center);

    const result: EmergencyResources = {
      ...parsed,
      lastUpdated: new Date(),
      searchCenter: center,
    };

    // Cache the result
    emergencyCache.set(cacheKey, { data: result, timestamp: Date.now() });

    console.log(
      `[EmergencyLocator] Found: ${parsed.hospitals.length} hospitals, ` +
      `${parsed.police.length} police, ${parsed.pharmacies.length} pharmacies`
    );

    return result;
  } catch (error) {
    console.error('[EmergencyLocator] Error:', error);

    // Return empty result on error
    return {
      hospitals: [],
      police: [],
      pharmacies: [],
      fireStations: [],
      lastUpdated: new Date(),
      searchCenter: center,
    };
  }
}

/**
 * Find the single nearest service of each type
 */
export async function findNearestEmergencyServices(
  center: Coords
): Promise<{
  nearestHospital: EmergencyService | null;
  nearestPolice: EmergencyService | null;
  nearestPharmacy: EmergencyService | null;
}> {
  const resources = await findEmergencyServices(center);

  return {
    nearestHospital: resources.hospitals[0] || null,
    nearestPolice: resources.police[0] || null,
    nearestPharmacy: resources.pharmacies[0] || null,
  };
}

/**
 * Get Google Maps directions URL
 */
export function getDirectionsUrl(destination: Coords, destinationName?: string): string {
  const query = destinationName
    ? encodeURIComponent(destinationName)
    : `${destination.lat},${destination.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

/**
 * Get emergency numbers for India (default)
 * Can be extended to support other countries based on destination
 */
export function getEmergencyNumbers(country: string = 'India'): {
  police: string;
  ambulance: string;
  fire: string;
  tourist: string;
} {
  const numbers: Record<string, { police: string; ambulance: string; fire: string; tourist: string }> = {
    India: {
      police: '100',
      ambulance: '102',
      fire: '101',
      tourist: '1363',
    },
    USA: {
      police: '911',
      ambulance: '911',
      fire: '911',
      tourist: '911',
    },
    UK: {
      police: '999',
      ambulance: '999',
      fire: '999',
      tourist: '999',
    },
    // Add more countries as needed
  };

  return numbers[country] || numbers['India'];
}

/**
 * Clear emergency cache (useful for testing)
 */
export function clearEmergencyCache(): void {
  emergencyCache.clear();
}
