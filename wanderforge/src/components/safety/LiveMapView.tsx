// Live Map View Component - Real-time tracking with Leaflet
import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { HAMPI_CENTER, haversineDistance } from '../../services/safety/geo-utils';

// Fix Leaflet default marker icons issue with bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapMember {
  id: string;
  name: string;
  avatar: string;
  location: { lat: number; lng: number };
  status: 'safe' | 'warning' | 'danger';
  accuracy: number;
  battery: number;
  lastSeen: string;
  isMoving: boolean;
}

interface ItineraryPlace {
  id: string;
  name: string;
  type: string;
  coordinates: { lat: number; lng: number } | null;
  scheduledDay?: number;
  scheduledTime?: string;
}

interface LiveMapViewProps {
  members: MapMember[];
  myLocation?: { lat: number; lng: number } | null;
  onMemberClick?: (member: MapMember) => void;
  showConnections?: boolean;
  className?: string;
  // Trip integration props
  customCenter?: { lat: number; lng: number };
  itineraryPlaces?: ItineraryPlace[];
  showItineraryRoute?: boolean;
}

// Custom marker icons based on status
function createMarkerIcon(status: 'safe' | 'warning' | 'danger', avatar: string): L.DivIcon {
  const colors = {
    safe: { bg: '#10b981', ring: 'rgba(16, 185, 129, 0.3)' },
    warning: { bg: '#f59e0b', ring: 'rgba(245, 158, 11, 0.3)' },
    danger: { bg: '#ef4444', ring: 'rgba(239, 68, 68, 0.3)' },
  };

  const color = colors[status];
  const pulse = status !== 'safe' ? 'animation: pulse 2s infinite;' : '';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        position: relative;
        width: 44px;
        height: 44px;
      ">
        <div style="
          position: absolute;
          inset: 0;
          background: ${color.ring};
          border-radius: 50%;
          ${pulse}
        "></div>
        <div style="
          position: absolute;
          top: 6px;
          left: 6px;
          width: 32px;
          height: 32px;
          background: ${color.bg};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 11px;
          font-family: system-ui, sans-serif;
        ">${avatar}</div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

// Component to handle map center updates
function MapCenterUpdater({ members }: { members: MapMember[] }) {
  const map = useMap();

  useEffect(() => {
    if (members.length === 0) return;

    // Calculate bounds to fit all members
    const bounds = L.latLngBounds(
      members.map((m) => [m.location.lat, m.location.lng] as [number, number])
    );

    // Add padding
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length]); // Only recenter when member count changes

  return null;
}

// Create marker icon for itinerary places
function createPlaceMarkerIcon(type: string, index: number): L.DivIcon {
  const typeColors: Record<string, string> = {
    beach: '#06b6d4',
    landmark: '#8b5cf6',
    fort: '#f59e0b',
    temple: '#ef4444',
    restaurant: '#22c55e',
    activity: '#ec4899',
    nature: '#10b981',
    nightlife: '#a855f7',
    default: '#6366f1',
  };

  const color = typeColors[type] || typeColors.default;

  return L.divIcon({
    className: 'place-marker',
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
      ">
        <div style="
          position: absolute;
          inset: 0;
          background: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute;
          top: 4px;
          left: 8px;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${color};
          font-weight: bold;
          font-size: 10px;
        ">${index + 1}</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

export default function LiveMapView({
  members,
  myLocation,
  onMemberClick,
  showConnections = true,
  className = '',
  customCenter,
  itineraryPlaces = [],
  showItineraryRoute = true,
}: LiveMapViewProps) {
  // Calculate center: custom > members > Hampi default
  const center = useMemo(() => {
    if (customCenter) return customCenter;
    if (members.length === 0) return HAMPI_CENTER;

    const sum = members.reduce(
      (acc, m) => ({
        lat: acc.lat + m.location.lat,
        lng: acc.lng + m.location.lng,
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: sum.lat / members.length,
      lng: sum.lng / members.length,
    };
  }, [members, customCenter]);

  // Filter places with valid coordinates
  const validPlaces = useMemo(() => {
    return itineraryPlaces.filter(p => p.coordinates !== null) as Array<
      ItineraryPlace & { coordinates: { lat: number; lng: number } }
    >;
  }, [itineraryPlaces]);

  // Create itinerary route line
  const itineraryRoute = useMemo(() => {
    if (!showItineraryRoute || validPlaces.length < 2) return null;

    return validPlaces.map(p => [p.coordinates.lat, p.coordinates.lng] as [number, number]);
  }, [validPlaces, showItineraryRoute]);

  // Connection lines between members
  const connectionLines = useMemo(() => {
    if (!showConnections || members.length < 2) return [];

    const lines: Array<{ positions: [number, number][]; color: string }> = [];

    // Connect each member to all others (creates mesh)
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const m1 = members[i];
        const m2 = members[j];
        const distance = haversineDistance(
          m1.location.lat,
          m1.location.lng,
          m2.location.lat,
          m2.location.lng
        );

        // Color based on distance
        let color = 'rgba(16, 185, 129, 0.4)'; // green
        if (distance > 500) {
          color = 'rgba(239, 68, 68, 0.6)'; // red
        } else if (distance > 200) {
          color = 'rgba(245, 158, 11, 0.5)'; // amber
        }

        lines.push({
          positions: [
            [m1.location.lat, m1.location.lng],
            [m2.location.lat, m2.location.lng],
          ],
          color,
        });
      }
    }

    return lines;
  }, [members, showConnections]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={17}
      className={`h-full w-full rounded-xl ${className}`}
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      <MapCenterUpdater members={members} />

      {/* Itinerary route line */}
      {itineraryRoute && (
        <Polyline
          positions={itineraryRoute}
          color="#8b5cf6"
          weight={3}
          opacity={0.7}
          dashArray="10, 10"
        />
      )}

      {/* Itinerary place markers */}
      {validPlaces.map((place, index) => (
        <Marker
          key={`place-${place.id}`}
          position={[place.coordinates.lat, place.coordinates.lng]}
          icon={createPlaceMarkerIcon(place.type, index)}
        >
          <Popup>
            <div className="text-sm min-w-[150px]">
              <p className="font-bold text-gray-900">{place.name}</p>
              <p className="text-gray-500 capitalize">{place.type}</p>
              {place.scheduledDay && (
                <p className="text-purple-600 mt-1">
                  Day {place.scheduledDay}
                  {place.scheduledTime && ` • ${place.scheduledTime}`}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Connection lines */}
      {connectionLines.map((line, index) => (
        <Polyline
          key={`line-${index}`}
          positions={line.positions}
          color={line.color}
          weight={2}
          dashArray="5, 10"
        />
      ))}

      {/* Member markers */}
      {members.map((member) => (
        <Marker
          key={member.id}
          position={[member.location.lat, member.location.lng]}
          icon={createMarkerIcon(member.status, member.avatar)}
          eventHandlers={{
            click: () => onMemberClick?.(member),
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold text-gray-900">{member.name}</p>
              <p className="text-gray-600">
                Status:{' '}
                <span
                  className={
                    member.status === 'safe'
                      ? 'text-emerald-600'
                      : member.status === 'warning'
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }
                >
                  {member.status.toUpperCase()}
                </span>
              </p>
              <p className="text-gray-500">Battery: {member.battery}%</p>
              <p className="text-gray-500">Last seen: {member.lastSeen}</p>
              {member.isMoving && (
                <p className="text-emerald-600">Moving</p>
              )}
            </div>
          </Popup>

          {/* Accuracy circle */}
          {member.accuracy > 20 && (
            <Circle
              center={[member.location.lat, member.location.lng]}
              radius={member.accuracy}
              pathOptions={{
                color:
                  member.status === 'safe'
                    ? '#10b981'
                    : member.status === 'warning'
                    ? '#f59e0b'
                    : '#ef4444',
                fillColor:
                  member.status === 'safe'
                    ? '#10b981'
                    : member.status === 'warning'
                    ? '#f59e0b'
                    : '#ef4444',
                fillOpacity: 0.1,
                weight: 1,
              }}
            />
          )}
        </Marker>
      ))}

      {/* My location marker */}
      {myLocation && (
        <Marker
          position={[myLocation.lat, myLocation.lng]}
          icon={L.divIcon({
            className: 'my-location-marker',
            html: `
              <div style="
                width: 20px;
                height: 20px;
                background: #3b82f6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3);
              "></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold text-blue-600">You are here</p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

// Add pulse animation to index.css
export const mapStyles = `
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.5;
  }
}
`;
