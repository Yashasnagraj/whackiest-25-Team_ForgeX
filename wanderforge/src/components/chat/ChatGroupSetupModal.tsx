// ============================================================
// CHAT GROUP SETUP MODAL
// Create or join a chat group
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Copy, Check, Loader2, MessageSquare } from 'lucide-react';
import { useChatStore } from '../../stores/chat.store';
import {
  createChatGroup,
  joinChatGroup,
  isValidGroupCode,
  startChatSession,
  getGroupById,
} from '../../services/chat';

interface Props {
  isOpen: boolean;
  mode: 'create' | 'join' | null;
  onClose: () => void;
}

export function ChatGroupSetupModal({ isOpen, mode, onClose }: Props) {
  const { userName, setUserName, startSession, addRecentGroup } = useChatStore();

  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [name, setName] = useState(userName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!groupName.trim() || !name.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createChatGroup(groupName.trim(), name.trim());
      if (!result) {
        setError('Failed to create group. Please try again.');
        return;
      }

      // Show code for sharing
      setCreatedCode(result.groupCode);

      // Save user name
      setUserName(name.trim());

      // Start session
      const session = await startChatSession(
        result.groupId,
        result.memberId,
        result.groupCode,
        groupName.trim(),
        true // isAdmin
      );

      if (session) {
        // Add to recent groups
        const group = await getGroupById(result.groupId);
        if (group) {
          addRecentGroup(group);
        }

        startSession(session);
      }
    } catch (err) {
      setError('Failed to create group');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!groupCode.trim() || !name.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!isValidGroupCode(groupCode)) {
      setError('Invalid group code format');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await joinChatGroup(groupCode.trim().toUpperCase(), name.trim());
      if (!result) {
        setError('Group not found or no longer active');
        return;
      }

      // Save user name
      setUserName(name.trim());

      // Start session
      const session = await startChatSession(
        result.groupId,
        result.memberId,
        groupCode.trim().toUpperCase(),
        result.groupName,
        false // not admin
      );

      if (session) {
        // Add to recent groups
        const group = await getGroupById(result.groupId);
        if (group) {
          addRecentGroup(group);
        }

        startSession(session);
      }
    } catch (err) {
      setError('Failed to join group');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async () => {
    if (createdCode) {
      await navigator.clipboard.writeText(createdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setGroupName('');
    setGroupCode('');
    setName(userName);
    setError(null);
    setCreatedCode(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            resetForm();
            onClose();
          }}
        >
          <motion.div
            className="w-full max-w-md bg-dark-800 rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-white">
                    {mode === 'create' ? 'Create Trip Chat' : 'Join Trip Chat'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {mode === 'create'
                      ? 'Start a new group conversation'
                      : 'Enter the group code to join'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {createdCode ? (
                // Show created code for sharing
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r from-journey-success to-accent-mint flex items-center justify-center">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Group Created!
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Share this code with your travel buddies
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-3xl font-mono font-bold tracking-widest text-white bg-dark-700 px-6 py-3 rounded-xl">
                      {createdCode}
                    </div>
                    <button
                      onClick={copyCode}
                      className="p-3 bg-dark-700 hover:bg-dark-600 rounded-xl transition-colors"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-journey-success" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Tap to copy and share with friends
                  </p>
                </div>
              ) : (
                <>
                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="How should we call you?"
                      className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan/20"
                    />
                  </div>

                  {mode === 'create' ? (
                    // Create group fields
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">
                        Group Name
                      </label>
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="e.g., Hampi Gang, Goa Trip 2024"
                        className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan/20"
                      />
                    </div>
                  ) : (
                    // Join group fields
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">
                        Group Code
                      </label>
                      <input
                        type="text"
                        value={groupCode}
                        onChange={(e) =>
                          setGroupCode(e.target.value.toUpperCase().slice(0, 6))
                        }
                        placeholder="Enter 6-character code"
                        className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan/20 font-mono text-center text-xl tracking-widest"
                        maxLength={6}
                      />
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <p className="text-sm text-red-400 text-center">{error}</p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!createdCode && (
              <div className="p-6 border-t border-white/10">
                <button
                  onClick={mode === 'create' ? handleCreate : handleJoin}
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-accent-cyan to-accent-purple text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {mode === 'create' ? 'Creating...' : 'Joining...'}
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5" />
                      {mode === 'create' ? 'Create Group' : 'Join Group'}
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
