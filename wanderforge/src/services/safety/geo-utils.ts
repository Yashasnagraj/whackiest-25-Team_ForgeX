// Geographic Utilities for Safety Sentinel
// Haversine distance and coordinate helpers

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a point is within a given radius from center
 */
export function isWithinRadius(
  center: { lat: number; lng: number },
  point: { lat: number; lng: number },
  radiusMeters: number
): boolean {
  const distance = haversineDistance(center.lat, center.lng, point.lat, point.lng);
  return distance <= radiusMeters;
}

/**
 * Calculate centroid of multiple coordinates
 */
export function getCentroid(
  locations: Array<{ lat: number; lng: number }>
): { lat: number; lng: number } {
  if (locations.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sum = locations.reduce(
    (acc, loc) => ({
      lat: acc.lat + loc.lat,
      lng: acc.lng + loc.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / locations.length,
    lng: sum.lng / locations.length,
  };
}

/**
 * Calculate distance from a member to the group centroid
 */
export function getDistanceFromGroup(
  memberLocation: { lat: number; lng: number },
  groupLocations: Array<{ lat: number; lng: number }>
): number {
  if (groupLocations.length === 0) return 0;

  // Exclude the member's own location if present
  const othersLocations = groupLocations.filter(
    (loc) => loc.lat !== memberLocation.lat || loc.lng !== memberLocation.lng
  );

  if (othersLocations.length === 0) return 0;

  const centroid = getCentroid(othersLocations);
  return haversineDistance(
    memberLocation.lat,
    memberLocation.lng,
    centroid.lat,
    centroid.lng
  );
}

/**
 * Generate Google Maps link for a location
 */
export function generateGoogleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/**
 * Generate shareable location message
 */
export function generateLocationMessage(
  userName: string,
  lat: number,
  lng: number
): string {
  const mapsLink = generateGoogleMapsLink(lat, lng);
  return `${userName}'s location: ${mapsLink}`;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Offset a coordinate by a small amount (for demo purposes)
 */
export function offsetCoordinate(
  base: { lat: number; lng: number },
  latOffset: number,
  lngOffset: number
): { lat: number; lng: number } {
  return {
    lat: base.lat + latOffset,
    lng: base.lng + lngOffset,
  };
}

/**
 * Generate random offset within a radius (for demo simulation)
 */
export function randomOffsetWithinRadius(
  center: { lat: number; lng: number },
  radiusMeters: number
): { lat: number; lng: number } {
  // Approximate: 1 degree latitude ≈ 111km
  // 1 degree longitude ≈ 111km * cos(latitude)
  const latDegreePerMeter = 1 / 111000;
  const lngDegreePerMeter = 1 / (111000 * Math.cos((center.lat * Math.PI) / 180));

  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusMeters;

  return {
    lat: center.lat + Math.sin(angle) * distance * latDegreePerMeter,
    lng: center.lng + Math.cos(angle) * distance * lngDegreePerMeter,
  };
}

// Hampi, Karnataka - Default center for demo
export const HAMPI_CENTER = { lat: 15.335, lng: 76.462 };

// Distance thresholds for safety status
export const DISTANCE_THRESHOLDS = {
  SAFE: 200, // Within 200m = safe
  WARNING: 500, // 200-500m = warning
  DANGER: 500, // Beyond 500m = danger
} as const;
