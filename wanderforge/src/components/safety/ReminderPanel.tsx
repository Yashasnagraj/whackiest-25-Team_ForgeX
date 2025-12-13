// Reminder Panel - Shows SMS reminder status and controls
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Bell,
  BellOff,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  Phone,
} from 'lucide-react';
import Button from '../ui/Button';
import { formatPhoneNumber, getEscalationDescription } from '../../services/safety/sms-service';

interface ReminderPanelProps {
  phoneNumber: string | null;
  userName: string;
  isReminderActive: boolean;
  lastCheckIn: Date | null;
  nextCheckIn: Date | null;
  escalationLevel: 0 | 1 | 2 | 3;
  onStartReminder: () => void;
  onStopReminder: () => void;
  onSendNow: () => void;
  onAcknowledge: () => void;
  onSetupPhone: () => void;
}

export default function ReminderPanel({
  phoneNumber,
  userName,
  isReminderActive,
  lastCheckIn,
  nextCheckIn,
  escalationLevel,
  onStartReminder,
  onStopReminder,
  onSendNow,
  onAcknowledge,
  onSetupPhone,
}: ReminderPanelProps) {
  const [countdown, setCountdown] = useState<string>('--:--');

  // Update countdown timer
  useEffect(() => {
    if (!nextCheckIn || !isReminderActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountdown('--:--');
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = nextCheckIn.getTime() - now;

      if (diff <= 0) {
        setCountdown('00:00');
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextCheckIn, isReminderActive]);

  // No phone number setup
  if (!phoneNumber) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-dark-700/50 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-dark-400" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-white">SMS Reminders</h3>
            <p className="text-dark-400 text-sm">Not configured</p>
          </div>
        </div>
        <p className="text-dark-400 text-sm mb-3">
          Set up your phone number to receive safety check-in reminders.
        </p>
        <Button variant="secondary" size="sm" className="w-full" onClick={onSetupPhone}>
          <Phone className="w-4 h-4 mr-2" />
          Setup Phone
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isReminderActive
              ? escalationLevel > 0
                ? 'bg-amber-500/20'
                : 'bg-emerald-500/20'
              : 'bg-dark-700/50'
          }`}>
            {isReminderActive ? (
              <Bell className={`w-5 h-5 ${
                escalationLevel > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`} />
            ) : (
              <BellOff className="w-5 h-5 text-dark-400" />
            )}
          </div>
          <div>
            <h3 className="font-display font-semibold text-white">SMS Reminders</h3>
            <p className={`text-sm ${isReminderActive ? 'text-emerald-400' : 'text-dark-400'}`}>
              {isReminderActive ? 'Active' : 'Paused'}
            </p>
          </div>
        </div>

        {/* Toggle button */}
        <button
          onClick={isReminderActive ? onStopReminder : onStartReminder}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            isReminderActive
              ? 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
          }`}
        >
          {isReminderActive ? 'Pause' : 'Resume'}
        </button>
      </div>

      {/* Phone info */}
      <div className="flex items-center gap-2 text-dark-400 text-sm mb-3">
        <Phone className="w-4 h-4" />
        <span>{userName}</span>
        <span className="text-dark-600">|</span>
        <span>{formatPhoneNumber(phoneNumber)}</span>
      </div>

      {isReminderActive && (
        <>
          {/* Countdown */}
          <div className="bg-dark-800/50 rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-dark-400 text-sm">Next check-in</span>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-dark-400" />
                <span className="font-mono text-lg text-white">{countdown}</span>
              </div>
            </div>

            {lastCheckIn && (
              <p className="text-dark-500 text-xs">
                Last check-in: {lastCheckIn.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Escalation status */}
          {escalationLevel > 0 && (
            <div className={`rounded-xl p-3 mb-3 ${
              escalationLevel >= 3
                ? 'bg-red-500/10 border border-red-500/30'
                : 'bg-amber-500/10 border border-amber-500/30'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className={`w-4 h-4 ${
                  escalationLevel >= 3 ? 'text-red-400' : 'text-amber-400'
                }`} />
                <span className={`font-medium text-sm ${
                  escalationLevel >= 3 ? 'text-red-400' : 'text-amber-400'
                }`}>
                  Escalation Level {escalationLevel}
                </span>
              </div>
              <p className="text-dark-400 text-xs">
                {getEscalationDescription(escalationLevel)}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {escalationLevel > 0 ? (
              <Button
                variant="primary"
                size="sm"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                onClick={onAcknowledge}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                I'm Safe
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={onSendNow}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </Button>
            )}
          </div>
        </>
      )}

      {!isReminderActive && (
        <div className="bg-dark-800/30 rounded-xl p-3 text-center">
          <p className="text-dark-400 text-sm">
            Reminders are paused. Click Resume to start check-ins.
          </p>
        </div>
      )}
    </motion.div>
  );
}
