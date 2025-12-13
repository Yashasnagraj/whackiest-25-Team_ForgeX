// ============================================================
// CHAT IMAGE PREVIEW
// Display image messages with lightbox
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn } from 'lucide-react';
import type { MediaMetadata } from '../../services/chat/types';

interface Props {
  url: string;
  metadata: MediaMetadata | null;
}

export function ChatImagePreview({ url, metadata }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate aspect ratio for thumbnail
  const aspectRatio = metadata
    ? metadata.width / metadata.height
    : 16 / 9;

  const maxWidth = 250;
  const width = Math.min(maxWidth, metadata?.width || maxWidth);
  const height = width / aspectRatio;

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `image-${Date.now()}.${metadata?.mimeType?.split('/')[1] || 'jpg'}`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <>
      {/* Thumbnail */}
      <div
        className="relative cursor-pointer group mb-2 rounded-lg overflow-hidden"
        style={{ width, height }}
        onClick={() => setIsOpen(true)}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-dark-600 animate-pulse" />
        )}
        <img
          src={url}
          alt="Shared image"
          className="w-full h-full object-cover"
          onLoad={() => setIsLoading(false)}
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Download button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <Download className="w-6 h-6 text-white" />
            </button>

            {/* Full image */}
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={url}
              alt="Full size image"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
