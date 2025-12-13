// Emergency Panel - Shows nearby emergency services
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hospital,
  Shield,
  Pill,
  Flame,
  Navigation,
  Phone,
  MapPin,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import Button from '../ui/Button';
import {
  findEmergencyServices,
  getDirectionsUrl,
  type EmergencyService,
  type EmergencyResources,
} from '../../services/safety/emergency-locator';
import type { Coords } from '../../services/itinerary/types';

interface EmergencyPanelProps {
  coordinates: Coords;
  destinationName?: string;
}

const SERVICE_ICONS = {
  hospital: Hospital,
  police: Shield,
  pharmacy: Pill,
  fire_station: Flame,
};

const SERVICE_COLORS = {
  hospital: 'text-red-400 bg-red-500/20',
  police: 'text-blue-400 bg-blue-500/20',
  pharmacy: 'text-green-400 bg-green-500/20',
  fire_station: 'text-orange-400 bg-orange-500/20',
};

const SERVICE_LABELS = {
  hospital: 'Hospitals',
  police: 'Police Stations',
  pharmacy: 'Pharmacies',
  fire_station: 'Fire Stations',
};

function ServiceCard({ service, onNavigate }: { service: EmergencyService; onNavigate: () => void }) {
  const Icon = SERVICE_ICONS[service.type] || Hospital;
  const colorClass = SERVICE_COLORS[service.type] || SERVICE_COLORS.hospital;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-dark-800/50 hover:bg-dark-700/50 transition-colors group"
    >
      <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{service.name}</p>
        <div className="flex items-center gap-2 text-xs text-dark-400">
          <MapPin className="w-3 h-3" />
          <span>{service.distance} km away</span>
        </div>
        {service.address && (
          <p className="text-xs text-dark-500 truncate mt-0.5">{service.address}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {service.phone && (
          <a
            href={`tel:${service.phone}`}
            className="p-2 rounded-lg bg-dark-700/50 hover:bg-accent-purple/20 transition-colors"
            title="Call"
          >
            <Phone className="w-4 h-4 text-dark-400 hover:text-accent-purple" />
          </a>
        )}
        <button
          onClick={onNavigate}
          className="p-2 rounded-lg bg-dark-700/50 hover:bg-accent-cyan/20 transition-colors"
          title="Get Directions"
        >
          <Navigation className="w-4 h-4 text-dark-400 hover:text-accent-cyan" />
        </button>
      </div>
    </motion.div>
  );
}

function ServiceSection({
  type,
  services,
  expanded,
  onToggle,
}: {
  type: EmergencyService['type'];
  services: EmergencyService[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = SERVICE_ICONS[type];
  const colorClass = SERVICE_COLORS[type];
  const label = SERVICE_LABELS[type];

  if (services.length === 0) return null;

  const nearest = services[0];

  return (
    <div className="border-b border-dark-700/50 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-dark-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">{label}</p>
            <p className="text-xs text-dark-400">
              Nearest: {nearest.name} ({nearest.distance} km)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-500 bg-dark-700/50 px-2 py-1 rounded">
            {services.length} found
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-dark-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-dark-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {services.slice(0, 5).map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onNavigate={() => {
                    window.open(getDirectionsUrl(service.coordinates, service.name), '_blank');
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EmergencyPanel({ coordinates, destinationName }: EmergencyPanelProps) {
  const [resources, setResources] = useState<EmergencyResources | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<EmergencyService['type'] | null>('hospital');

  // Fetch emergency resources
  useEffect(() => {
    async function fetchResources() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await findEmergencyServices(coordinates, 15); // 15km radius
        setResources(data);

        // Auto-expand first section with results
        if (data.hospitals.length > 0) setExpandedSection('hospital');
        else if (data.police.length > 0) setExpandedSection('police');
        else if (data.pharmacies.length > 0) setExpandedSection('pharmacy');
      } catch (err) {
        setError('Failed to load emergency services');
        console.error('[EmergencyPanel] Error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchResources();
  }, [coordinates.lat, coordinates.lng]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await findEmergencyServices(coordinates, 15);
      setResources(data);
    } catch (err) {
      setError('Failed to refresh');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (type: EmergencyService['type']) => {
    setExpandedSection(expandedSection === type ? null : type);
  };

  const totalCount = resources
    ? resources.hospitals.length +
      resources.police.length +
      resources.pharmacies.length +
      resources.fireStations.length
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Hospital className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Emergency Services</h3>
            <p className="text-xs text-dark-400">
              {destinationName ? `Near ${destinationName}` : 'Nearby locations'}
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-dark-700/50 hover:bg-dark-600/50 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-dark-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {isLoading && !resources ? (
        <div className="p-8 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent-purple animate-spin mb-3" />
          <p className="text-sm text-dark-400">Searching nearby emergency services...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center">
          <p className="text-dark-400 text-sm mb-3">{error}</p>
          <Button variant="secondary" size="sm" onClick={handleRefresh}>
            Try Again
          </Button>
        </div>
      ) : resources && totalCount === 0 ? (
        <div className="p-6 text-center">
          <p className="text-dark-400 text-sm">No emergency services found nearby.</p>
          <p className="text-dark-500 text-xs mt-1">Try expanding the search radius.</p>
        </div>
      ) : resources ? (
        <div>
          <ServiceSection
            type="hospital"
            services={resources.hospitals}
            expanded={expandedSection === 'hospital'}
            onToggle={() => toggleSection('hospital')}
          />
          <ServiceSection
            type="police"
            services={resources.police}
            expanded={expandedSection === 'police'}
            onToggle={() => toggleSection('police')}
          />
          <ServiceSection
            type="pharmacy"
            services={resources.pharmacies}
            expanded={expandedSection === 'pharmacy'}
            onToggle={() => toggleSection('pharmacy')}
          />
          <ServiceSection
            type="fire_station"
            services={resources.fireStations}
            expanded={expandedSection === 'fire_station'}
            onToggle={() => toggleSection('fire_station')}
          />
        </div>
      ) : null}

      {/* Quick Actions */}
      {resources && totalCount > 0 && (
        <div className="p-3 bg-dark-800/30 border-t border-dark-700/50">
          <div className="flex gap-2">
            {resources.hospitals[0] && (
              <a
                href={getDirectionsUrl(resources.hospitals[0].coordinates, resources.hospitals[0].name)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors"
              >
                <Hospital className="w-4 h-4" />
                <span>Nearest Hospital</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {resources.police[0] && (
              <a
                href={getDirectionsUrl(resources.police[0].coordinates, resources.police[0].name)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-medium transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Nearest Police</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
