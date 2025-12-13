import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  MapPin,
  Battery,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Phone,
  MessageSquare,
  Bell,
  Navigation,
  Zap,
  Share2,
  Users,
  LogOut,
  Loader2,
  MapPinOff,
  RefreshCw,
} from 'lucide-react';
import Button from '../components/ui/Button';
import {
  LiveMapView,
  ViewToggle,
  PhoneSetupModal,
  ReminderPanel,
  GroupSetupModal,
  QRCodeDisplay,
  EmergencyPanel,
  SafetyBriefingPanel,
} from '../components/safety';
import { useSafetyStore } from '../stores/safety.store';
import { useAuthStore } from '../stores/auth.store';
import { useTripSafetyContext } from '../hooks/useTripSafetyContext';
import {
  startLiveMapSimulation,
  type DemoMember,
} from '../services/safety/demo-simulator';
import { HAMPI_CENTER } from '../services/safety/geo-utils';
import {
  scheduleReminder,
  cancelReminder,
  acknowledgeCheckIn,
  setReminderCallback,
} from '../services/safety/sms-service';
import {
  createGroup,
  joinGroup,
  startRealtimeSession,
  stopRealtimeSession,
  updateLocationFix,
  startLocationBroadcast,
  stopLocationBroadcast,
  leaveGroup,
} from '../services/safety/realtime-tracker';
import { startContinuousTracking, requestLocationPermission, isGeolocationSupported } from '../services/safety/location-tracker';
import { isSupabaseConfigured } from '../lib/supabase';

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  status: 'safe' | 'warning' | 'danger';
  battery: number;
  lastSeen: string;
  location: string;
  isMoving: boolean;
  signal: number;
  angle: number;
  distance: number;
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  member?: string;
  time: string;
  isNew: boolean;
}

const initialMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Yashas',
    avatar: 'YN',
    status: 'safe',
    battery: 85,
    lastSeen: 'Now',
    location: 'Virupaksha Temple',
    isMoving: false,
    signal: 4,
    angle: 45,
    distance: 0.3,
  },
  {
    id: '2',
    name: 'Naveen',
    avatar: 'NP',
    status: 'safe',
    battery: 67,
    lastSeen: '2 min ago',
    location: 'Virupaksha Temple',
    isMoving: true,
    signal: 3,
    angle: 120,
    distance: 0.35,
  },
  {
    id: '3',
    name: 'Jeeth',
    avatar: 'JK',
    status: 'safe',
    battery: 45,
    lastSeen: '5 min ago',
    location: 'Near Temple',
    isMoving: false,
    signal: 4,
    angle: 200,
    distance: 0.4,
  },
  {
    id: '4',
    name: 'Shrajan',
    avatar: 'SP',
    status: 'safe',
    battery: 92,
    lastSeen: 'Now',
    location: 'Virupaksha Temple',
    isMoving: true,
    signal: 4,
    angle: 300,
    distance: 0.25,
  },
];

const initialAlerts: Alert[] = [
  {
    id: '1',
    type: 'info',
    title: 'Group Check',
    message: 'All 4 members are within 200m radius',
    time: 'Just now',
    isNew: true,
  },
];

export default function SafetySentinel() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [isScanning] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [simulationStep, setSimulationStep] = useState(0);

  // Trip context - integrates with Trip Planner and Itinerary
  const tripContext = useTripSafetyContext();

  // Auth context - get user email for SOS notifications
  const { user } = useAuthStore();

  // Store state
  const {
    viewMode,
    setViewMode,
    myPhoneNumber,
    myName,
    setPhoneNumber,
    setMyName,
    addEmergencyContact,
    completeSetup,
    isReminderActive,
    lastCheckIn,
    nextCheckIn,
    escalationLevel,
    setReminderActive,
    updateReminderState,
    // Live tracking state
    trackingMode,
    groupId,
    groupCode,
    groupName,
    myMemberId,
    liveMembers,
    setGroupSession,
    setLiveMembers,
    clearGroupSession,
  } = useSafetyStore();

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showGroupSetupModal, setShowGroupSetupModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [initialJoinCode, setInitialJoinCode] = useState<string | null>(null);

  // GPS Status tracking
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'acquiring' | 'active' | 'denied' | 'error'>('idle');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastGpsUpdate, setLastGpsUpdate] = useState<Date | null>(null);

  // Map members for LiveMapView
  const [mapMembers, setMapMembers] = useState<DemoMember[]>([]);

  // Check for join code in URL
  useEffect(() => {
    const joinCode = searchParams.get('join');
    if (joinCode && /^[A-Z0-9]{6}$/i.test(joinCode)) {
      setInitialJoinCode(joinCode.toUpperCase());
      setShowGroupSetupModal(true);
      // Clear the URL param
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Initialize map simulation when switching to map view (demo mode)
  useEffect(() => {
    if (viewMode === 'map' && trackingMode === 'demo') {
      const cleanup = startLiveMapSimulation((updatedMembers) => {
        setMapMembers(updatedMembers);
      }, 2000);

      return cleanup;
    }
  }, [viewMode, trackingMode]);

  // Handle live tracking session
  useEffect(() => {
    if (viewMode === 'live' && groupId && myMemberId && groupCode && groupName) {
      console.log('[SafetySentinel] Starting live tracking session...');

      // Start the realtime session
      startRealtimeSession(
        groupId,
        myMemberId,
        groupCode,
        groupName,
        (members) => {
          console.log('[SafetySentinel] Members updated:', members.length);
          setLiveMembers(members);
        },
        // Callback when a new member joins
        (newMember) => {
          console.log('[SafetySentinel] New member joined:', newMember.name);
          setAlerts((prev) => [
            {
              id: `join-${newMember.id}-${Date.now()}`,
              type: 'info',
              title: 'Member Joined',
              message: `${newMember.name} has joined the group`,
              member: newMember.name,
              time: 'Just now',
              isNew: true,
            },
            ...prev,
          ]);
        }
      );

      // Check GPS support and permissions first
      if (!isGeolocationSupported()) {
        setGpsStatus('error');
        setGpsError('Geolocation is not supported by your browser');
        return;
      }

      // Start GPS tracking
      setGpsStatus('acquiring');
      setGpsError(null);
      console.log('[SafetySentinel] Starting GPS tracking...');

      const gpsCleanup = startContinuousTracking(
        (fix) => {
          console.log('[SafetySentinel] GPS fix received:', fix.lat.toFixed(6), fix.lng.toFixed(6), 'accuracy:', fix.accuracy_m);
          setGpsStatus('active');
          setLastGpsUpdate(new Date());
          updateLocationFix(fix);
        },
        {
          onError: (error) => {
            console.error('[SafetySentinel] GPS error:', error);
            if (error.includes('denied')) {
              setGpsStatus('denied');
            } else {
              setGpsStatus('error');
            }
            setGpsError(error);
          }
        }
      );

      startLocationBroadcast();

      // Set timeout to detect GPS failure
      const gpsTimeout = setTimeout(() => {
        if (gpsStatus === 'acquiring') {
          console.warn('[SafetySentinel] GPS acquisition timeout');
          // Don't set error yet, GPS might still be trying
        }
      }, 15000);

      return () => {
        console.log('[SafetySentinel] Cleaning up live tracking...');
        clearTimeout(gpsTimeout);
        gpsCleanup();
        stopLocationBroadcast();
        stopRealtimeSession();
        setGpsStatus('idle');
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, groupId, myMemberId, groupCode, groupName, setLiveMembers]);

  // Sync reminder state from service
  useEffect(() => {
    setReminderCallback((state) => {
      updateReminderState({
        lastCheckIn: state.lastCheckIn ?? undefined,
        nextCheckIn: state.nextCheckIn ?? undefined,
        escalationLevel: state.escalationLevel,
      });
      setReminderActive(state.isActive);
    });
  }, [updateReminderState, setReminderActive]);

  // Radar demo simulation
  const runSimulation = () => {
    setSimulationStep(1);

    setTimeout(() => {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === '3'
            ? { ...m, distance: 0.6, status: 'safe', location: 'Moving away from group' }
            : m
        )
      );
    }, 2000);

    setTimeout(() => {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === '3'
            ? { ...m, distance: 0.75, status: 'warning', location: 'Hemakuta Hill', lastSeen: '10 min ago' }
            : m
        )
      );
      setAlerts((prev) => [
        {
          id: '2',
          type: 'warning',
          title: 'Distance Alert',
          message: 'Jeeth is 800m away from the group',
          member: 'Jeeth',
          time: 'Just now',
          isNew: true,
        },
        ...prev,
      ]);
    }, 4000);

    setTimeout(() => {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === '3'
            ? {
                ...m,
                distance: 0.9,
                status: 'warning',
                location: 'Remote area - Hemakuta',
                lastSeen: '25 min ago',
                battery: 23,
                isMoving: false,
                signal: 1,
              }
            : m
        )
      );
      setAlerts((prev) => [
        {
          id: '3',
          type: 'warning',
          title: 'Stationary Alert',
          message: 'Jeeth has been stationary for 15 minutes in a remote area',
          member: 'Jeeth',
          time: 'Just now',
          isNew: true,
        },
        ...prev,
      ]);
    }, 6000);

    setTimeout(() => {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === '3'
            ? {
                ...m,
                status: 'danger',
                lastSeen: '45 min ago',
                battery: 12,
                signal: 0,
              }
            : m
        )
      );
      setAlerts((prev) => [
        {
          id: '4',
          type: 'danger',
          title: 'CRITICAL: Member Unreachable',
          message:
            'Jeeth has been stationary for 45 minutes with no signal. Last known location: Hemakuta Hill ruins. Immediate check recommended.',
          member: 'Jeeth',
          time: 'Just now',
          isNew: true,
        },
        ...prev,
      ]);
      setSimulationStep(2);
    }, 8000);
  };

  const resetSimulation = () => {
    setMembers(initialMembers);
    setAlerts(initialAlerts);
    setSimulationStep(0);
  };

  const handleSetupComplete = (data: { phone: string; name: string; contacts: Array<{ name: string; phone: string }> }) => {
    setPhoneNumber(data.phone);
    setMyName(data.name);
    data.contacts.forEach((contact) => addEmergencyContact(contact));
    completeSetup();
    setShowSetupModal(false);

    // Start reminder loop
    scheduleReminder(data.phone, data.name, 30);
  };

  const handleStartReminder = () => {
    if (myPhoneNumber && myName) {
      scheduleReminder(myPhoneNumber, myName, 30);
    }
  };

  const handleStopReminder = () => {
    cancelReminder();
  };

  const handleAcknowledge = () => {
    acknowledgeCheckIn();
  };

  // Live tracking handlers
  const handleCreateGroup = async (name: string, userName: string, userEmail?: string) => {
    console.log('[SafetySentinel] Creating group:', name, 'user:', userName, 'email:', userEmail);
    const result = await createGroup(name, userName, userEmail);
    if (result) {
      console.log('[SafetySentinel] Group created successfully:', result.groupCode);
      setGroupSession({
        groupId: result.groupId,
        groupCode: result.groupCode,
        groupName: name,
        myMemberId: result.memberId,
      });
    } else {
      console.error('[SafetySentinel] Failed to create group');
    }
    return result;
  };

  const handleJoinGroup = async (code: string, userName: string, userEmail?: string) => {
    console.log('[SafetySentinel] Joining group:', code, 'user:', userName, 'email:', userEmail);
    const result = await joinGroup(code, userName, userEmail);
    if (result) {
      console.log('[SafetySentinel] Joined group successfully:', result.groupName);
      setGroupSession({
        groupId: result.groupId,
        groupCode: code,
        groupName: result.groupName,
        myMemberId: result.memberId,
      });
    } else {
      console.error('[SafetySentinel] Failed to join group');
    }
    return result;
  };

  const handleLiveSessionSuccess = () => {
    console.log('[SafetySentinel] Live session success - switching to live view');
    setViewMode('live');
  };

  const handleLeaveGroup = async () => {
    await leaveGroup();
    clearGroupSession();
    setViewMode('radar');
  };

  const handleViewToggle = (view: 'radar' | 'map' | 'live') => {
    if (view === 'live') {
      if (!groupId) {
        // Need to create/join a group first
        setShowGroupSetupModal(true);
        return;
      }
    }
    setViewMode(view);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'danger':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusRing = (status: string) => {
    switch (status) {
      case 'safe':
        return 'ring-emerald-500/50';
      case 'warning':
        return 'ring-amber-500/50 animate-pulse';
      case 'danger':
        return 'ring-red-500/50 animate-pulse';
      default:
        return 'ring-gray-500/50';
    }
  };

  // Format lastSeen Date to human-readable string
  const formatLastSeen = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    if (diffSec < 30) return 'Now';
    if (diffMin < 1) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin} min ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Navigation */}
      <nav className="border-b border-dark-800 bg-dark-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-white">
                    Safety Sentinel
                    {tripContext.hasActiveTrip && (
                      <span className="text-emerald-400 ml-2">• {tripContext.destination}</span>
                    )}
                  </h1>
                  <p className="text-dark-400 text-sm">
                    {tripContext.hasActiveTrip
                      ? `Monitoring ${tripContext.tripName}`
                      : 'Guardian Mode Active'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <ViewToggle
                currentView={viewMode}
                onToggle={handleViewToggle}
                isLiveActive={!!groupId}
                showLiveOption={isSupabaseConfigured()}
              />

              {/* Live Mode: Share & Leave buttons */}
              {viewMode === 'live' && groupId && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowShareModal(true)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLeaveGroup}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave
                  </Button>
                </>
              )}

              {/* Demo Button (radar view only) */}
              {viewMode === 'radar' && simulationStep === 0 && (
                <Button variant="secondary" size="sm" onClick={runSimulation}>
                  <Zap className="w-4 h-4 mr-2" />
                  Run Demo
                </Button>
              )}
              {viewMode === 'radar' && simulationStep > 0 && (
                <Button variant="ghost" size="sm" onClick={resetSimulation}>
                  Reset Demo
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main View Area */}
          <div className="lg:col-span-2">
            {/* Live Group Header */}
            {viewMode === 'live' && groupId && groupName && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{groupName}</p>
                    <p className="text-emerald-400 text-sm">
                      {liveMembers.length} member{liveMembers.length !== 1 ? 's' : ''} tracking
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-medium">LIVE</span>
                </div>
              </motion.div>
            )}

            {viewMode === 'radar' ? (
              /* Radar View (Original Demo) */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 aspect-square relative overflow-hidden"
              >
                {/* Radar Background */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full border border-primary-500/20"
                      style={{
                        width: `${scale * 90}%`,
                        height: `${scale * 90}%`,
                      }}
                    />
                  ))}

                  <div className="absolute w-full h-[1px] bg-primary-500/10" />
                  <div className="absolute h-full w-[1px] bg-primary-500/10" />

                  {isScanning && (
                    <motion.div
                      className="absolute w-1/2 h-[2px] origin-left"
                      style={{
                        background:
                          'linear-gradient(90deg, rgba(16, 185, 129, 0.8) 0%, transparent 100%)',
                        left: '50%',
                        top: '50%',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    />
                  )}

                  <AnimatePresence>
                    {isScanning && (
                      <>
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute rounded-full border-2 border-emerald-500/30"
                            initial={{ width: '10%', height: '10%', opacity: 0.8 }}
                            animate={{ width: '100%', height: '100%', opacity: 0 }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              delay: i * 1,
                              ease: 'easeOut',
                            }}
                          />
                        ))}
                      </>
                    )}
                  </AnimatePresence>

                  <div className="absolute w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />

                  {members.map((member) => {
                    const x =
                      Math.cos((member.angle * Math.PI) / 180) * member.distance * 45;
                    const y =
                      Math.sin((member.angle * Math.PI) / 180) * member.distance * 45;

                    return (
                      <motion.div
                        key={member.id}
                        className="absolute cursor-pointer"
                        style={{
                          left: `calc(50% + ${x}%)`,
                          top: `calc(50% + ${y}%)`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        animate={{
                          left: `calc(50% + ${x}%)`,
                          top: `calc(50% + ${y}%)`,
                        }}
                        transition={{ duration: 1 }}
                        onClick={() => setSelectedMember(member)}
                      >
                        <div
                          className={`
                          w-12 h-12 rounded-full flex items-center justify-center
                          ${getStatusColor(member.status)} ring-4 ${getStatusRing(member.status)}
                          text-white font-bold text-sm shadow-lg
                          hover:scale-110 transition-transform
                        `}
                        >
                          {member.avatar}
                        </div>
                        <p className="text-center text-xs text-dark-300 mt-1">{member.name}</p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-dark-400 text-xs">Safe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-dark-400 text-xs">Warning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-dark-400 text-xs">Danger</span>
                  </div>
                </div>

                {/* Status badge */}
                <div className="absolute top-4 right-4">
                  <div
                    className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${
                      members.some((m) => m.status === 'danger')
                        ? 'bg-red-500/20 text-red-400'
                        : members.some((m) => m.status === 'warning')
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        members.some((m) => m.status === 'danger')
                          ? 'bg-red-500 animate-pulse'
                          : members.some((m) => m.status === 'warning')
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-sm font-medium">
                      {members.some((m) => m.status === 'danger')
                        ? 'ALERT'
                        : members.some((m) => m.status === 'warning')
                        ? 'WARNING'
                        : 'ALL CLEAR'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : viewMode === 'live' && groupId ? (
              /* Live Real-Time Map View */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card overflow-hidden relative"
                style={{ height: '500px' }}
              >
                <LiveMapView
                  members={liveMembers
                    .filter((m) => m.location !== null) // Only show members with GPS
                    .map((m) => ({
                      id: m.id,
                      name: m.name,
                      avatar: m.avatar,
                      location: m.location!, // Safe because we filtered
                      status: m.status,
                      accuracy: m.accuracy,
                      battery: m.battery,
                      lastSeen: m.lastSeen.toLocaleTimeString(),
                      isMoving: m.isMoving,
                    }))}
                  showConnections={true}
                  customCenter={tripContext.hasActiveTrip ? tripContext.mapCenter : undefined}
                  itineraryPlaces={tripContext.hasActiveTrip ? tripContext.places : []}
                  showItineraryRoute={tripContext.hasActiveTrip}
                />

                {/* GPS Status Indicator */}
                <div className="absolute top-4 right-4 z-[1000]">
                  {gpsStatus === 'acquiring' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 bg-amber-500/20 text-amber-400 px-3 py-2 rounded-lg backdrop-blur-sm border border-amber-500/30"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium">Acquiring GPS...</span>
                    </motion.div>
                  )}
                  {gpsStatus === 'active' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-2 rounded-lg backdrop-blur-sm border border-emerald-500/30"
                    >
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">GPS Active</span>
                      {lastGpsUpdate && (
                        <span className="text-xs text-emerald-400/70">
                          {Math.floor((Date.now() - lastGpsUpdate.getTime()) / 1000)}s ago
                        </span>
                      )}
                    </motion.div>
                  )}
                  {(gpsStatus === 'denied' || gpsStatus === 'error') && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col gap-2 bg-red-500/20 text-red-400 px-3 py-2 rounded-lg backdrop-blur-sm border border-red-500/30"
                    >
                      <div className="flex items-center gap-2">
                        <MapPinOff className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {gpsStatus === 'denied' ? 'Location Denied' : 'GPS Error'}
                        </span>
                      </div>
                      {gpsError && (
                        <span className="text-xs text-red-400/70">{gpsError}</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setGpsStatus('acquiring');
                          setGpsError(null);
                          const granted = await requestLocationPermission();
                          if (!granted) {
                            setGpsStatus('denied');
                            setGpsError('Please enable location in browser settings');
                          }
                        }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Retry
                      </Button>
                    </motion.div>
                  )}
                </div>

                {/* Show count of members without GPS */}
                {liveMembers.filter((m) => m.location === null).length > 0 && (
                  <div className="absolute bottom-4 left-4 bg-dark-800/90 backdrop-blur px-3 py-2 rounded-lg text-sm z-[1000]">
                    <span className="text-amber-400">
                      {liveMembers.filter((m) => m.location === null).length} member(s) waiting for GPS...
                    </span>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Demo Map View */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card overflow-hidden"
                style={{ height: '500px' }}
              >
                <LiveMapView
                  members={mapMembers.map((m) => ({
                    id: m.id,
                    name: m.name,
                    avatar: m.avatar,
                    location: m.location,
                    status: m.status,
                    accuracy: m.accuracy,
                    battery: m.battery,
                    lastSeen:
                      m.lastSeen instanceof Date
                        ? m.lastSeen.toLocaleTimeString()
                        : 'Now',
                    isMoving: m.isMoving,
                  }))}
                  showConnections={true}
                  customCenter={tripContext.hasActiveTrip ? tripContext.mapCenter : undefined}
                  itineraryPlaces={tripContext.hasActiveTrip ? tripContext.places : []}
                  showItineraryRoute={tripContext.hasActiveTrip}
                />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trip Safety Briefing - AI Generated */}
            {tripContext.hasActiveTrip && (
              <SafetyBriefingPanel
                destination={tripContext.destination}
                coordinates={tripContext.mapCenter}
                dates={
                  tripContext.startDate && tripContext.endDate
                    ? { start: tripContext.startDate, end: tripContext.endDate }
                    : undefined
                }
              />
            )}

            {/* Emergency Services Panel */}
            <EmergencyPanel
              coordinates={tripContext.hasActiveTrip ? tripContext.mapCenter : HAMPI_CENTER}
              destinationName={tripContext.hasActiveTrip ? tripContext.destination : 'Hampi'}
            />

            {/* SMS Reminder Panel */}
            <ReminderPanel
              phoneNumber={myPhoneNumber}
              userName={myName}
              isReminderActive={isReminderActive}
              lastCheckIn={lastCheckIn}
              nextCheckIn={nextCheckIn}
              escalationLevel={escalationLevel}
              onStartReminder={handleStartReminder}
              onStopReminder={handleStopReminder}
              onSendNow={handleStartReminder}
              onAcknowledge={handleAcknowledge}
              onSetupPhone={() => setShowSetupModal(true)}
            />

            {/* Team Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-white">Team Status</h3>
                {viewMode === 'live' && groupId && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-1.5"
                  >
                    <Users className="w-4 h-4" />
                    Invite
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {(viewMode === 'live' && groupId
                  ? liveMembers
                  : viewMode === 'radar'
                  ? members
                  : mapMembers
                ).map((member) => {
                  // Format lastSeen for display
                  const lastSeenText = 'lastSeen' in member
                    ? member.lastSeen instanceof Date
                      ? formatLastSeen(member.lastSeen)
                      : typeof member.lastSeen === 'string'
                      ? member.lastSeen
                      : 'Now'
                    : 'Now';

                  // Get location text and status
                  const hasLocation = viewMode === 'live' && 'location' in member && member.location !== null;
                  const locationText = hasLocation
                    ? `${(member.location as { lat: number; lng: number }).lat.toFixed(4)}, ${(member.location as { lat: number; lng: number }).lng.toFixed(4)}`
                    : viewMode === 'radar' && 'location' in member && typeof member.location === 'string'
                    ? member.location
                    : viewMode === 'live'
                    ? 'Acquiring GPS...'
                    : 'Tracking...';

                  return (
                    <div
                      key={member.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedMember?.id === member.id
                          ? 'bg-dark-700'
                          : 'bg-dark-800/50 hover:bg-dark-700/50'
                      } ${member.status === 'danger' ? 'ring-1 ring-red-500/50' : ''}`}
                      onClick={() =>
                        setSelectedMember(member as unknown as TeamMember)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          ${getStatusColor(member.status)} text-white font-bold text-xs
                        `}
                        >
                          {member.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-dark-100">{member.name}</p>
                            <span className="text-dark-500 text-xs">
                              {lastSeenText}
                            </span>
                          </div>
                          <p className={`text-sm truncate flex items-center gap-1 ${hasLocation ? 'text-dark-400' : 'text-amber-400'}`}>
                            {!hasLocation && viewMode === 'live' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            )}
                            {locationText}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <div className="flex items-center gap-1 text-dark-400">
                          <Battery
                            className={`w-3 h-3 ${member.battery < 20 ? 'text-red-400' : ''}`}
                          />
                          <span className={member.battery < 20 ? 'text-red-400' : ''}>
                            {member.battery}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-dark-400">
                          <Wifi
                            className={`w-3 h-3 ${member.signal === 0 ? 'text-red-400' : ''}`}
                          />
                          <span>{member.signal}/4</span>
                        </div>
                        {member.isMoving && (
                          <div className="flex items-center gap-1 text-emerald-400">
                            <Navigation className="w-3 h-3" />
                            <span>Moving</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Alerts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-white">Alerts</h3>
                <Bell className="w-5 h-5 text-dark-400" />
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg ${
                        alert.type === 'danger'
                          ? 'bg-red-500/10 border border-red-500/30'
                          : alert.type === 'warning'
                          ? 'bg-amber-500/10 border border-amber-500/30'
                          : 'bg-dark-800/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {alert.type === 'danger' ? (
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        ) : alert.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p
                            className={`font-medium text-sm ${
                              alert.type === 'danger'
                                ? 'text-red-400'
                                : alert.type === 'warning'
                                ? 'text-amber-400'
                                : 'text-dark-200'
                            }`}
                          >
                            {alert.title}
                          </p>
                          <p className="text-dark-400 text-xs mt-1">{alert.message}</p>
                          <p className="text-dark-500 text-xs mt-1">{alert.time}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Emergency Actions */}
            {members.some((m) => m.status === 'danger') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-4 border border-red-500/30"
              >
                <h3 className="font-display font-semibold text-red-400 mb-3">
                  Emergency Actions
                </h3>
                <div className="space-y-2">
                  <Button variant="danger" className="w-full" size="sm">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Jeeth
                  </Button>
                  <Button variant="ghost" className="w-full" size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Group Alert
                  </Button>
                  <Button variant="ghost" className="w-full" size="sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    Share Last Location
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 glass-card p-6 bg-gradient-to-r from-emerald-500/10 to-primary-500/10"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white mb-2">
                How Safety Sentinel Works
              </h3>
              <p className="text-dark-300 text-sm leading-relaxed">
                The AI continuously monitors your group's location, movement patterns,
                battery levels, and signal strength. It detects anomalies like:{' '}
                <span className="text-amber-400">prolonged inactivity in remote areas</span>,
                <span className="text-amber-400"> unusual route deviations</span>,
                <span className="text-amber-400">
                  {' '}
                  group separation beyond safe distances
                </span>
                , and
                <span className="text-amber-400"> low battery in isolated zones</span>.
                Alerts trigger automatically so no one gets lost.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Phone Setup Modal */}
      <PhoneSetupModal
        isOpen={showSetupModal}
        onComplete={handleSetupComplete}
        onSkip={() => setShowSetupModal(false)}
      />

      {/* Group Setup Modal (Create/Join) */}
      <GroupSetupModal
        isOpen={showGroupSetupModal}
        initialJoinCode={initialJoinCode}
        userEmail={user?.email}
        onCreateGroup={handleCreateGroup}
        onJoinGroup={handleJoinGroup}
        onClose={() => {
          setShowGroupSetupModal(false);
          setInitialJoinCode(null);
        }}
        onSuccess={handleLiveSessionSuccess}
      />

      {/* Share QR Modal */}
      <AnimatePresence>
        {showShareModal && groupCode && groupName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <QRCodeDisplay
                groupCode={groupCode}
                groupName={groupName}
                memberCount={liveMembers.length}
              />
              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => setShowShareModal(false)}
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
