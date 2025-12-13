// Group Setup Modal - Create or Join a tracking group
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  X,
  ArrowRight,
  QrCode,
  UserPlus,
  Loader2,
  MapPin,
  Shield,
} from 'lucide-react';
import Button from '../ui/Button';
import QRCodeScanner from './QRCodeScanner';
import QRCodeDisplay from './QRCodeDisplay';

interface GroupSetupModalProps {
  isOpen: boolean;
  initialJoinCode?: string | null;
  userEmail?: string | null;  // User email for SOS notifications
  onCreateGroup: (groupName: string, userName: string, userEmail?: string) => Promise<{ groupCode: string; groupId: string; memberId: string } | null>;
  onJoinGroup: (code: string, userName: string, userEmail?: string) => Promise<{ groupId: string; memberId: string; groupName: string } | null>;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalStep = 'choose' | 'create' | 'join' | 'scan' | 'created';

export default function GroupSetupModal({
  isOpen,
  initialJoinCode,
  userEmail,
  onCreateGroup,
  onJoinGroup,
  onClose,
  onSuccess,
}: GroupSetupModalProps) {
  const [step, setStep] = useState<ModalStep>('choose');
  const [userName, setUserName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createdGroup, setCreatedGroup] = useState<{ code: string; name: string } | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle initial join code from URL
  useEffect(() => {
    if (initialJoinCode && isOpen) {
      setJoinCode(initialJoinCode.toUpperCase());
      setStep('join');
    }
  }, [initialJoinCode, isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset after animation completes
      const timer = setTimeout(() => {
        setStep('choose');
        setUserName('');
        setGroupName('');
        setJoinCode('');
        setCreatedGroup(null);
        setError('');
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await onCreateGroup(groupName.trim(), userName.trim(), userEmail || undefined);

      if (result) {
        setCreatedGroup({ code: result.groupCode, name: groupName });
        setStep('created');
      } else {
        setError('Failed to create group. Please check your connection and try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (code?: string) => {
    const codeToUse = code || joinCode;

    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!codeToUse || codeToUse.length !== 6) {
      setError('Please enter a valid 6-character code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await onJoinGroup(codeToUse.toUpperCase(), userName.trim(), userEmail || undefined);

      if (result) {
        onSuccess();
        onClose();
      } else {
        setError('Group not found or has expired. Please check the code and try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanResult = (code: string) => {
    setJoinCode(code);
    setStep('join');
  };

  const handleStartTracking = () => {
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && step !== 'scan') {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md glass-card p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          {step !== 'scan' && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-dark-700/50 text-dark-400 hover:text-dark-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Step: Choose */}
          {step === 'choose' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-white">
                    Live Tracking
                  </h2>
                  <p className="text-dark-400 text-sm">
                    Track your group in real-time
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full justify-between h-auto py-4"
                  onClick={() => setStep('create')}
                >
                  <span className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mr-3">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Create New Group</div>
                      <div className="text-xs text-white/70">Start a tracking session</div>
                    </div>
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </Button>

                <Button
                  variant="secondary"
                  className="w-full justify-between h-auto py-4"
                  onClick={() => setStep('scan')}
                >
                  <span className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-dark-700/50 flex items-center justify-center mr-3">
                      <QrCode className="w-5 h-5 text-dark-300" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-dark-100">Scan QR Code</div>
                      <div className="text-xs text-dark-400">Join with camera</div>
                    </div>
                  </span>
                  <ArrowRight className="w-5 h-5 text-dark-400" />
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-between h-auto py-4"
                  onClick={() => setStep('join')}
                >
                  <span className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-dark-800/50 flex items-center justify-center mr-3">
                      <Users className="w-5 h-5 text-dark-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-dark-200">Enter Code</div>
                      <div className="text-xs text-dark-500">Join with 6-digit code</div>
                    </div>
                  </span>
                  <ArrowRight className="w-5 h-5 text-dark-500" />
                </Button>
              </div>

              {/* Info */}
              <div className="mt-6 p-3 bg-dark-800/30 rounded-xl border border-dark-700/50">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-dark-400 mt-0.5" />
                  <p className="text-dark-400 text-xs">
                    Your location is shared only with your group members and is automatically deleted after 1 hour.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: Create Group */}
          {step === 'create' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg font-display font-semibold text-white mb-4">
                Create Group
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    autoFocus
                    className="w-full px-4 py-3 bg-dark-800/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., Hampi Trip 2024"
                    className="w-full px-4 py-3 bg-dark-800/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => {
                      setStep('choose');
                      setError('');
                    }}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleCreate}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Group'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: Join Group */}
          {step === 'join' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg font-display font-semibold text-white mb-4">
                Join Group
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    autoFocus={!joinCode}
                    className="w-full px-4 py-3 bg-dark-800/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Group Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    placeholder="ABC123"
                    maxLength={6}
                    autoFocus={!!joinCode}
                    className="w-full px-4 py-4 bg-dark-800/50 border border-dark-700 rounded-xl text-white font-mono text-2xl text-center tracking-[0.3em] placeholder-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition uppercase"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && joinCode.length === 6 && userName.trim()) {
                        handleJoin();
                      }
                    }}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => {
                      setStep('choose');
                      setError('');
                      setJoinCode('');
                    }}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => handleJoin()}
                    disabled={isLoading || joinCode.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      'Join Group'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: Group Created */}
          {step === 'created' && createdGroup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <QRCodeDisplay
                groupCode={createdGroup.code}
                groupName={createdGroup.name}
                memberCount={1}
              />

              <Button
                variant="primary"
                onClick={handleStartTracking}
                className="w-full mt-6"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Start Tracking
              </Button>

              <p className="text-dark-500 text-xs text-center mt-3">
                You can share the code anytime from the map view
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* QR Scanner Overlay */}
        {step === 'scan' && (
          <QRCodeScanner
            onScan={handleScanResult}
            onClose={() => setStep('choose')}
            isLoading={isLoading}
            error={error}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
