// Place/Location Types

export interface EnrichedPlaceData {
  placeId: string;
  name: string;
  formattedAddress: string;
  coordinates: { lat: number; lng: number };
  rating?: number;
  totalRatings?: number;
  priceLevel?: number;
  types?: string[];
  website?: string;
  source: 'nominatim' | 'photon' | 'foursquare' | 'cached';
}

export interface PlaceSearchOptions {
  query: string;
  near?: { lat: number; lng: number };
  radius?: number;
  types?: string[];
  limit?: number;
}

export interface PlaceSearchResult {
  places: EnrichedPlaceData[];
  source: 'nominatim' | 'photon' | 'foursquare' | 'cached';
  cached: boolean;
}
