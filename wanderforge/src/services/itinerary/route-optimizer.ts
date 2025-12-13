// Route Optimization - Haversine, Clustering, TSP
import type { ExtractedPlace } from '../ai/types';
import type { Coords, TravelMode, PlaceCluster, OptimizedRoute } from './types';

// Earth radius in km
const EARTH_RADIUS_KM = 6371;

// Travel speeds in km/h for different modes
export const TRAVEL_SPEEDS: Record<TravelMode, number> = {
  bike: 25,    // Goa standard - scooty/bike
  car: 40,     // With traffic
  walk: 5,     // Leisurely walk
  auto: 30,    // Auto-rickshaw
};

// Default travel mode based on distance
export function getDefaultTravelMode(distanceKm: number): TravelMode {
  if (distanceKm <= 1) return 'walk';
  if (distanceKm <= 10) return 'bike';
  return 'car';
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Get coordinates from an extracted place
 */
export function getPlaceCoords(place: ExtractedPlace): Coords | null {
  if (place.coordinates) {
    return { lat: place.coordinates.lat, lng: place.coordinates.lng };
  }
  if (place.enrichedData?.coordinates) {
    return {
      lat: place.enrichedData.coordinates.lat,
      lng: place.enrichedData.coordinates.lng,
    };
  }
  return null;
}

/**
 * Calculate centroid of a group of places
 */
export function calculateCentroid(places: ExtractedPlace[]): Coords {
  const coordsList = places
    .map(getPlaceCoords)
    .filter((c): c is Coords => c !== null);

  if (coordsList.length === 0) {
    // Default to Goa if no coordinates
    return { lat: 15.4909, lng: 73.8278 };
  }

  const sumLat = coordsList.reduce((sum, c) => sum + c.lat, 0);
  const sumLng = coordsList.reduce((sum, c) => sum + c.lng, 0);

  return {
    lat: sumLat / coordsList.length,
    lng: sumLng / coordsList.length,
  };
}

/**
 * Estimate travel time between two places
 * @returns Duration in minutes
 */
export function estimateTravelTime(
  from: Coords,
  to: Coords,
  mode?: TravelMode
): { distance: number; duration: number; mode: TravelMode } {
  const distance = haversineDistance(from.lat, from.lng, to.lat, to.lng);
  const travelMode = mode || getDefaultTravelMode(distance);
  const duration = Math.ceil((distance / TRAVEL_SPEEDS[travelMode]) * 60);

  return { distance, duration, mode: travelMode };
}

/**
 * Cluster places by proximity for multi-day trips
 * Uses simple greedy nearest-neighbor clustering
 */
export function clusterPlacesByProximity(
  places: ExtractedPlace[],
  numDays: number
): PlaceCluster[] {
  // Filter places with coordinates
  const geoPlaces = places.filter(p => getPlaceCoords(p) !== null);

  if (geoPlaces.length === 0) {
    return [];
  }

  // If fewer places than days, put all in first cluster
  if (geoPlaces.length <= numDays) {
    return [{
      places: geoPlaces,
      centroid: calculateCentroid(geoPlaces),
      totalDistance: 0,
    }];
  }

  // Find accommodation to use as anchor
  const accommodation = geoPlaces.find(p =>
    p.type === 'hotel' ||
    p.name.toLowerCase().includes('hotel') ||
    p.name.toLowerCase().includes('hostel') ||
    p.name.toLowerCase().includes('resort') ||
    p.name.toLowerCase().includes('stay')
  );

  // Places to cluster (excluding accommodation - it goes in every day)
  const toCluster = accommodation
    ? geoPlaces.filter(p => p !== accommodation)
    : geoPlaces;

  // Simple k-means-like clustering
  const clusters: PlaceCluster[] = [];
  const placesPerDay = Math.ceil(toCluster.length / numDays);
  const remaining = [...toCluster];

  for (let i = 0; i < numDays && remaining.length > 0; i++) {
    const cluster: ExtractedPlace[] = [];

    // Pick first place (or nearest to centroid of remaining)
    const startIdx = 0;
    cluster.push(remaining.splice(startIdx, 1)[0]);

    // Add nearest neighbors until we reach placesPerDay
    while (cluster.length < placesPerDay && remaining.length > 0) {
      const lastPlace = cluster[cluster.length - 1];
      const lastCoords = getPlaceCoords(lastPlace)!;

      // Find nearest remaining place
      let nearestIdx = 0;
      let nearestDist = Infinity;

      for (let j = 0; j < remaining.length; j++) {
        const coords = getPlaceCoords(remaining[j]);
        if (coords) {
          const dist = haversineDistance(
            lastCoords.lat,
            lastCoords.lng,
            coords.lat,
            coords.lng
          );
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestIdx = j;
          }
        }
      }

      cluster.push(remaining.splice(nearestIdx, 1)[0]);
    }

    // Add accommodation to each cluster if exists
    if (accommodation) {
      cluster.unshift(accommodation);
    }

    clusters.push({
      places: cluster,
      centroid: calculateCentroid(cluster),
      totalDistance: calculateClusterDistance(cluster),
    });
  }

  return clusters;
}

/**
 * Calculate total distance within a cluster
 */
function calculateClusterDistance(places: ExtractedPlace[]): number {
  let total = 0;

  for (let i = 1; i < places.length; i++) {
    const from = getPlaceCoords(places[i - 1]);
    const to = getPlaceCoords(places[i]);

    if (from && to) {
      total += haversineDistance(from.lat, from.lng, to.lat, to.lng);
    }
  }

  return total;
}

/**
 * Optimize visit order using Nearest Neighbor TSP heuristic
 * Simple but effective for small number of places
 */
export function optimizeVisitOrder(
  places: ExtractedPlace[],
  _startPoint?: Coords
): OptimizedRoute {
  if (places.length <= 1) {
    return {
      places,
      totalDistance: 0,
      segments: [],
    };
  }

  const geoPlaces = places.filter(p => getPlaceCoords(p) !== null);
  if (geoPlaces.length === 0) {
    return { places, totalDistance: 0, segments: [] };
  }

  // Start from accommodation or provided start point
  const accommodation = geoPlaces.find(p =>
    p.type === 'hotel' ||
    p.name.toLowerCase().includes('hotel') ||
    p.name.toLowerCase().includes('hostel')
  );

  const ordered: ExtractedPlace[] = [];
  const remaining = [...geoPlaces];
  const segments: OptimizedRoute['segments'] = [];

  // Start with accommodation if exists, otherwise first place
  let currentIdx = accommodation
    ? remaining.indexOf(accommodation)
    : 0;

  if (currentIdx === -1) currentIdx = 0;
  ordered.push(remaining.splice(currentIdx, 1)[0]);

  // Greedy nearest neighbor
  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    const currentCoords = getPlaceCoords(current)!;

    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const coords = getPlaceCoords(remaining[i]);
      if (coords) {
        const dist = haversineDistance(
          currentCoords.lat,
          currentCoords.lng,
          coords.lat,
          coords.lng
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }
    }

    const next = remaining.splice(nearestIdx, 1)[0];
    ordered.push(next);

    segments.push({
      from: current,
      to: next,
      distance: nearestDist,
      duration: Math.ceil((nearestDist / TRAVEL_SPEEDS.bike) * 60),
    });
  }

  const totalDistance = segments.reduce((sum, s) => sum + s.distance, 0);

  return { places: ordered, totalDistance, segments };
}

/**
 * Build route polyline coordinates for map visualization
 */
export function buildRoutePolyline(places: ExtractedPlace[]): Coords[] {
  return places
    .map(getPlaceCoords)
    .filter((c): c is Coords => c !== null);
}

/**
 * Get bounds for map view (southwest, northeast corners)
 */
export function getRouteBounds(coords: Coords[]): {
  sw: Coords;
  ne: Coords;
  center: Coords;
} {
  if (coords.length === 0) {
    // Default to Goa
    return {
      sw: { lat: 15.0, lng: 73.5 },
      ne: { lat: 16.0, lng: 74.5 },
      center: { lat: 15.4909, lng: 73.8278 },
    };
  }

  const lats = coords.map(c => c.lat);
  const lngs = coords.map(c => c.lng);

  const sw = { lat: Math.min(...lats), lng: Math.min(...lngs) };
  const ne = { lat: Math.max(...lats), lng: Math.max(...lngs) };
  const center = {
    lat: (sw.lat + ne.lat) / 2,
    lng: (sw.lng + ne.lng) / 2,
  };

  return { sw, ne, center };
}
