// ============================================================
// CHAT HEADER
// Group name, members, and actions
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Copy, Check, Share2, MoreVertical, LogOut, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../stores/chat.store';

interface Props {
  onToggleExtraction: () => void;
  showExtractionPanel: boolean;
}

export function ChatHeader({ onToggleExtraction, showExtractionPanel }: Props) {
  const navigate = useNavigate();

  // Select primitives directly to avoid infinite loops
  const session = useChatStore((state) => state.session);
  const endSession = useChatStore((state) => state.endSession);

  // Use primitive selectors - NOT array/object selectors
  const memberCount = useChatStore((state) => state.members.length);
  const onlineCount = useChatStore((state) => state.members.filter((m) => m.isOnline).length);

  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!session) return null;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(session.groupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${session.groupName} on WanderForge`,
          text: `Join our trip chat! Code: ${session.groupCode}`,
          url: window.location.href,
        });
      } catch (_error) {
        // User cancelled or share failed
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave this chat?')) {
      endSession();
      navigate('/dashboard');
    }
  };

  return (
    <div className="bg-dark-800 border-b border-white/10 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Back and group info */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeave}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            title="Exit Chat"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>

          <div>
            <h1 className="text-lg font-display font-bold text-white">
              {session.groupName}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {memberCount} members
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-journey-success flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-journey-success animate-pulse" />
                {onlineCount} online
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Group code */}
          <button
            onClick={handleCopyCode}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
          >
            <span className="text-sm font-mono text-gray-300">{session.groupCode}</span>
            {copied ? (
              <Check className="w-4 h-4 text-journey-success" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            title="Share"
          >
            <Share2 className="w-5 h-5 text-gray-400" />
          </button>

          {/* Exit Chat Button */}
          <button
            onClick={handleLeave}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors text-red-400"
            title="Exit Chat"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Exit</span>
          </button>

          {/* Extraction toggle */}
          <button
            onClick={onToggleExtraction}
            className={`p-2 rounded-lg transition-colors ${
              showExtractionPanel
                ? 'bg-accent-purple/20 text-accent-purple'
                : 'hover:bg-dark-700 text-gray-400'
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-dark-700 rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        handleCopyCode();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-600 transition-colors text-left"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-white">Copy Group Code</span>
                    </button>
                    <button
                      onClick={() => {
                        handleLeave();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-600 transition-colors text-left text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Leave Group</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
