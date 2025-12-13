// Phone Setup Modal - Collect phone number and emergency contacts
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  UserPlus,
  X,
  Shield,
  ArrowRight,
  Zap,
  Trash2,
} from 'lucide-react';
import Button from '../ui/Button';
import { isValidPhoneNumber, formatPhoneNumber } from '../../services/safety/sms-service';

interface EmergencyContact {
  name: string;
  phone: string;
}

interface PhoneSetupModalProps {
  isOpen: boolean;
  onComplete: (data: { phone: string; name: string; contacts: EmergencyContact[] }) => void;
  onSkip: () => void;
}

export default function PhoneSetupModal({ isOpen, onComplete, onSkip }: PhoneSetupModalProps) {
  const [step, setStep] = useState<'phone' | 'contacts' | 'confirm'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [error, setError] = useState('');

  const handlePhoneSubmit = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setStep('contacts');
  };

  const handleAddContact = () => {
    if (!newContact.name.trim()) {
      setError('Please enter contact name');
      return;
    }
    if (!isValidPhoneNumber(newContact.phone)) {
      setError('Please enter a valid phone number');
      return;
    }
    if (contacts.length >= 3) {
      setError('Maximum 3 emergency contacts allowed');
      return;
    }

    setContacts([...contacts, newContact]);
    setNewContact({ name: '', phone: '' });
    setError('');
  };

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    onComplete({
      phone: phoneNumber.replace(/\D/g, ''),
      name,
      contacts,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md glass-card p-6 relative"
        >
          {/* Close button */}
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-dark-700/50 text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white">
                Safety Setup
              </h2>
              <p className="text-dark-400 text-sm">
                {step === 'phone' && 'Step 1: Your details'}
                {step === 'contacts' && 'Step 2: Emergency contacts'}
                {step === 'confirm' && 'Ready to go!'}
              </p>
            </div>
          </div>

          {/* Step 1: Phone Number */}
          {step === 'phone' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-dark-800/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full pl-14 pr-4 py-3 bg-dark-800/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <div className="bg-dark-800/30 rounded-xl p-4 border border-dark-700/50">
                <p className="text-dark-300 text-sm">
                  We'll send you periodic check-in reminders via SMS. Reply OK to confirm you're safe.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={onSkip}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Use Demo Mode
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handlePhoneSubmit}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Emergency Contacts */}
          {step === 'contacts' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <p className="text-dark-300 text-sm">
                Add up to 3 emergency contacts who will be notified if you don't respond to check-ins.
              </p>

              {/* Existing contacts */}
              {contacts.length > 0 && (
                <div className="space-y-2">
                  {contacts.map((contact, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg border border-dark-700/50"
                    >
                      <div>
                        <p className="text-dark-100 font-medium">{contact.name}</p>
                        <p className="text-dark-400 text-sm">
                          {formatPhoneNumber(contact.phone)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveContact(index)}
                        className="p-2 text-dark-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new contact form */}
              {contacts.length < 3 && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="Contact name"
                    className="w-full px-4 py-3 bg-dark-800/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition"
                  />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value.replace(/\D/g, '') })}
                      placeholder="Phone number"
                      maxLength={10}
                      className="w-full pl-14 pr-4 py-3 bg-dark-800/50 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={handleAddContact}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              )}

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setStep('phone')}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => setStep('confirm')}
                >
                  {contacts.length > 0 ? 'Continue' : 'Skip'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-display font-semibold text-white mb-2">
                  You're all set!
                </h3>
                <p className="text-dark-400 text-sm">
                  Safety Sentinel will now monitor your location and send check-in reminders.
                </p>
              </div>

              <div className="bg-dark-800/30 rounded-xl p-4 border border-dark-700/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-dark-400" />
                  <span className="text-dark-300">{name}</span>
                  <span className="text-dark-500">|</span>
                  <span className="text-dark-400">
                    +91 {phoneNumber}
                  </span>
                </div>
                {contacts.length > 0 && (
                  <p className="text-dark-400 text-sm">
                    {contacts.length} emergency contact{contacts.length > 1 ? 's' : ''} added
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setStep('contacts')}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleComplete}
                >
                  Start Tracking
                  <Shield className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
