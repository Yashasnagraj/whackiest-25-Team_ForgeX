// ============================================================
// CHAT INPUT
// Text input with image upload and reply preview
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image, X, Loader2 } from 'lucide-react';
import type { ChatMessage } from '../../services/chat/types';
import { sendTypingIndicator, isValidImageFile, compressImage } from '../../services/chat';

interface Props {
  onSend: (content: string, imageFile?: File) => void;
  onImageSelect: (file: File) => Promise<void>;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onImageSelect,
  replyingTo,
  onCancelReply,
  disabled = false,
}: Props) {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus on reply
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    sendTypingIndicator(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);
  }, []);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage && !selectedImage) return;
    if (disabled || isUploading) return;

    // Stop typing indicator
    sendTypingIndicator(false);

    // Handle image upload
    if (selectedImage) {
      setIsUploading(true);
      try {
        const compressed = await compressImage(selectedImage);
        await onImageSelect(compressed);
      } finally {
        setIsUploading(false);
        clearImage();
      }
    }

    // Send text message
    if (trimmedMessage) {
      onSend(trimmedMessage);
      setMessage('');
    }

    // Focus back on input
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WebP) under 10MB');
      return;
    }

    setSelectedImage(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  };

  const clearImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle paste
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file && isValidImageFile(file)) {
          setSelectedImage(file);
          const preview = URL.createObjectURL(file);
          setImagePreview(preview);
        }
        break;
      }
    }
  };

  return (
    <div className="border-t border-white/10 bg-dark-800/80 backdrop-blur-xl p-4">
      {/* Reply preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-accent-cyan/10 to-transparent rounded-xl border-l-2 border-accent-cyan">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-accent-cyan font-semibold">
                  Replying to {replyingTo.senderName}
                </p>
                <p className="text-sm text-gray-400 truncate mt-0.5">
                  {replyingTo.content}
                </p>
              </div>
              <button
                onClick={onCancelReply}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ height: 0, opacity: 0, scale: 0.9 }}
            animate={{ height: 'auto', opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.9 }}
            className="mb-3 overflow-hidden"
          >
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-24 rounded-xl object-cover border border-white/10 shadow-lg"
              />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-lg"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Attachment buttons */}
        <div className="flex gap-1">
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="p-3 bg-dark-700/50 hover:bg-dark-600 rounded-xl transition-all disabled:opacity-50 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image className="w-5 h-5 text-gray-400 group-hover:text-accent-cyan transition-colors" />
          </motion.button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Text input */}
        <div className="flex-1 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/20 to-accent-purple/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="relative w-full px-4 py-3 bg-dark-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan/50 focus:bg-dark-700/70 resize-none max-h-32 disabled:opacity-50 transition-all"
            style={{ minHeight: '48px' }}
          />
        </div>

        {/* Send button */}
        <motion.button
          onClick={handleSubmit}
          disabled={disabled || isUploading || (!message.trim() && !selectedImage)}
          className="p-3 bg-gradient-to-r from-accent-cyan to-accent-purple rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-accent-purple/20 hover:shadow-accent-purple/40"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Send className="w-5 h-5 text-white" />
          )}
        </motion.button>
      </div>

      {/* Quick tip */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-gray-500 mt-2 text-center"
      >
        Press <kbd className="px-1.5 py-0.5 bg-dark-700 rounded text-gray-400 font-mono text-[10px]">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 bg-dark-700 rounded text-gray-400 font-mono text-[10px]">Shift+Enter</kbd> for new line
      </motion.p>
    </div>
  );
}
