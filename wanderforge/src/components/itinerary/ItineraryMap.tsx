// Leaflet Map Component for Itinerary Visualization
import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { GeneratedItinerary, DayItinerary, Coords } from '../../services/itinerary/types';
import { getRouteBounds } from '../../services/itinerary/route-optimizer';
import { getFatigueLevel } from '../../services/itinerary/fatigue-scheduler';

// Fix Leaflet default marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Day colors for polylines and markers
const DAY_COLORS = [
  '#6366f1', // Indigo (Day 1)
  '#f59e0b', // Amber (Day 2)
  '#10b981', // Emerald (Day 3)
  '#ec4899', // Pink (Day 4)
  '#8b5cf6', // Purple (Day 5)
  '#06b6d4', // Cyan (Day 6)
  '#f97316', // Orange (Day 7)
];

// Custom numbered marker icon
function createNumberedIcon(number: number, color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">
        ${number}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

// Map bounds fitter component
function MapBoundsFitter({ coords }: { coords: Coords[] }) {
  const map = useMap();

  useEffect(() => {
    if (coords.length > 0) {
      const { sw, ne } = getRouteBounds(coords);
      const bounds = L.latLngBounds(
        [sw.lat, sw.lng],
        [ne.lat, ne.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map]);

  return null;
}

interface ItineraryMapProps {
  itinerary: GeneratedItinerary;
  selectedDay?: number;
  onMarkerClick?: (activityId: string) => void;
  className?: string;
}

export function ItineraryMap({
  itinerary,
  selectedDay,
  onMarkerClick,
  className = 'h-96',
}: ItineraryMapProps) {
  // Calculate center and bounds
  const { center, allCoords } = useMemo(() => {
    const coords = itinerary.route;
    if (coords.length === 0) {
      return {
        center: { lat: 15.4909, lng: 73.8278 } as Coords, // Default Goa
        allCoords: [] as Coords[],
      };
    }

    const bounds = getRouteBounds(coords);
    return {
      center: bounds.center,
      allCoords: coords,
    };
  }, [itinerary.route]);

  // Get activities to display (filtered by day if selected)
  const daysToShow = useMemo(() => {
    if (selectedDay) {
      return itinerary.days.filter(d => d.day === selectedDay);
    }
    return itinerary.days;
  }, [itinerary.days, selectedDay]);

  // Build polylines for each day
  const polylines = useMemo(() => {
    return daysToShow.map(day => {
      const dayCoords = day.activities
        .filter(a => a.type === 'visit' && a.place.coordinates)
        .map(a => ({
          lat: a.place.coordinates!.lat,
          lng: a.place.coordinates!.lng,
        }));

      return {
        day: day.day,
        coords: dayCoords,
        color: DAY_COLORS[(day.day - 1) % DAY_COLORS.length],
      };
    });
  }, [daysToShow]);

  // Build markers with day-specific styling
  const markers = useMemo(() => {
    const result: {
      id: string;
      position: [number, number];
      day: number;
      name: string;
      time: string;
      reason?: string;
      activityNumber: number;
      color: string;
    }[] = [];

    daysToShow.forEach(day => {
      let activityCount = 0;

      day.activities
        .filter(a => a.type === 'visit' && a.place.coordinates)
        .forEach(activity => {
          activityCount++;
          result.push({
            id: activity.id,
            position: [
              activity.place.coordinates!.lat,
              activity.place.coordinates!.lng,
            ],
            day: day.day,
            name: activity.place.name,
            time: `${activity.startTime} - ${activity.endTime}`,
            reason: activity.bestTimeReason,
            activityNumber: activityCount,
            color: DAY_COLORS[(day.day - 1) % DAY_COLORS.length],
          });
        });
    });

    return result;
  }, [daysToShow]);

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        {/* Dark-themed map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Fit bounds to route */}
        <MapBoundsFitter coords={allCoords} />

        {/* Route polylines per day */}
        {polylines.map(line => (
          <Polyline
            key={`route-day-${line.day}`}
            positions={line.coords.map(c => [c.lat, c.lng])}
            color={line.color}
            weight={3}
            opacity={0.8}
            dashArray={line.day > 1 ? '10, 5' : undefined}
          />
        ))}

        {/* Place markers */}
        {markers.map(marker => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={createNumberedIcon(marker.activityNumber, marker.color)}
            eventHandlers={{
              click: () => onMarkerClick?.(marker.id),
            }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="font-bold text-gray-900">{marker.name}</div>
                <div className="text-sm text-gray-600">
                  Day {marker.day} | {marker.time}
                </div>
                {marker.reason && (
                  <div className="text-xs text-indigo-600 mt-1">
                    {marker.reason}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// Day legend component
interface DayLegendProps {
  days: DayItinerary[];
  selectedDay?: number;
  onDaySelect: (day: number | undefined) => void;
}

export function DayLegend({ days, selectedDay, onDaySelect }: DayLegendProps) {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-800/50 rounded-lg">
      <button
        onClick={() => onDaySelect(undefined)}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          !selectedDay
            ? 'bg-white text-gray-900'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        All Days
      </button>
      {days.map(day => {
        const color = DAY_COLORS[(day.day - 1) % DAY_COLORS.length];
        const fatigue = getFatigueLevel(day.totalFatigue);

        return (
          <button
            key={day.day}
            onClick={() => onDaySelect(day.day)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedDay === day.day
                ? 'text-white'
                : 'text-gray-300 hover:opacity-80'
            }`}
            style={{
              backgroundColor: selectedDay === day.day ? color : `${color}33`,
              borderColor: color,
              borderWidth: '2px',
            }}
          >
            <span>Day {day.day}</span>
            <span className="text-xs opacity-75">{fatigue.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}

// Mini stats display
interface MapStatsProps {
  itinerary: GeneratedItinerary;
}

export function MapStats({ itinerary }: MapStatsProps) {
  const { summary } = itinerary;

  return (
    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-800/50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{summary.totalDays}</div>
        <div className="text-xs text-gray-400">Days</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{summary.placesVisited}</div>
        <div className="text-xs text-gray-400">Places</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{summary.distanceTraveled} km</div>
        <div className="text-xs text-gray-400">Distance</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{summary.averageFatiguePerDay}</div>
        <div className="text-xs text-gray-400">Avg Fatigue</div>
      </div>
    </div>
  );
}

export default ItineraryMap;
