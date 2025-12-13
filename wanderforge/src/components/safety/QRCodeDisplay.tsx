// QR Code Display Component - Shows QR code for sharing group
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Copy, Check, Share2, Users } from 'lucide-react';
import Button from '../ui/Button';

interface QRCodeDisplayProps {
  groupCode: string;
  groupName: string;
  memberCount?: number;
  className?: string;
}

export default function QRCodeDisplay({
  groupCode,
  groupName,
  memberCount = 1,
  className = '',
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  // Generate shareable URL with join code
  const shareUrl = `${window.location.origin}/safety?join=${groupCode}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(groupCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName} on WanderForge`,
          text: `Join my Safety Sentinel group! Code: ${groupCode}`,
          url: shareUrl,
        });
        return;
      } catch (error) {
        // User cancelled or share failed, fall back to clipboard
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }

    // Fall back to copying link
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`text-center ${className}`}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-display font-semibold text-white mb-1">
          Share Group
        </h3>
        <p className="text-dark-400 text-sm">
          Others can scan this QR code to join "{groupName}"
        </p>
      </div>

      {/* QR Code */}
      <div className="bg-white p-4 rounded-2xl inline-block mb-4 shadow-lg">
        <QRCodeSVG
          value={shareUrl}
          size={180}
          level="M"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>

      {/* Group Code Display */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="bg-dark-800/50 px-4 py-2 rounded-xl border border-dark-700">
          <span className="text-2xl font-mono font-bold text-primary-400 tracking-[0.3em]">
            {groupCode}
          </span>
        </div>
        <button
          onClick={handleCopyCode}
          className="p-3 rounded-xl bg-dark-800/50 border border-dark-700 hover:bg-dark-700/50 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-5 h-5 text-emerald-400" />
          ) : (
            <Copy className="w-5 h-5 text-dark-400" />
          )}
        </button>
      </div>

      {/* Member Count */}
      <div className="flex items-center justify-center gap-2 text-dark-400 text-sm mb-4">
        <Users className="w-4 h-4" />
        <span>{memberCount} member{memberCount !== 1 ? 's' : ''} in group</span>
      </div>

      {/* Share Button */}
      <Button variant="secondary" onClick={handleShare} className="w-full">
        <Share2 className="w-4 h-4 mr-2" />
        {navigator.share ? 'Share Link' : 'Copy Link'}
      </Button>

      {/* Instructions */}
      <p className="text-dark-500 text-xs mt-3">
        Share the QR code or 6-digit code with your group members
      </p>
    </motion.div>
  );
}
