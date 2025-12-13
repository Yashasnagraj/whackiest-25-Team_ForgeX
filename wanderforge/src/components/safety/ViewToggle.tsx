// View Toggle Component - Switch between Radar, Map, and Live views
import { motion } from 'framer-motion';
import { Radar, Map, Radio, Wifi } from 'lucide-react';

interface ViewToggleProps {
  currentView: 'radar' | 'map' | 'live';
  onToggle: (view: 'radar' | 'map' | 'live') => void;
  isLiveActive?: boolean;
  showLiveOption?: boolean;
}

export default function ViewToggle({
  currentView,
  onToggle,
  isLiveActive = false,
  showLiveOption = true,
}: ViewToggleProps) {
  return (
    <div className="inline-flex items-center bg-dark-800/80 backdrop-blur-sm rounded-full p-1 border border-dark-700/50">
      <ToggleButton
        active={currentView === 'radar'}
        onClick={() => onToggle('radar')}
        icon={<Radar className="w-4 h-4" />}
        label="Radar"
      />
      <ToggleButton
        active={currentView === 'map'}
        onClick={() => onToggle('map')}
        icon={<Map className="w-4 h-4" />}
        label="Map"
      />
      {showLiveOption && (
        <ToggleButton
          active={currentView === 'live'}
          onClick={() => onToggle('live')}
          icon={
            isLiveActive ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <Radio className="w-4 h-4" />
            )
          }
          label="Live"
          highlight={isLiveActive}
        />
      )}
    </div>
  );
}

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
}

function ToggleButton({ active, onClick, icon, label, highlight = false }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-full
        text-sm font-medium transition-colors duration-200
        ${active
          ? 'text-white'
          : highlight
            ? 'text-emerald-400 hover:text-emerald-300'
            : 'text-dark-400 hover:text-dark-200'
        }
      `}
    >
      {active && (
        <motion.div
          layoutId="viewToggleIndicator"
          className={`absolute inset-0 rounded-full ${
            highlight ? 'bg-emerald-500' : 'bg-primary-500'
          }`}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}
      <span className="relative flex items-center gap-2">
        {icon}
        {label}
        {highlight && !active && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        )}
      </span>
    </button>
  );
}
