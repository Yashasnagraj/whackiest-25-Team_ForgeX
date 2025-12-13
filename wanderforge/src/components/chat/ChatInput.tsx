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
    <div className="border-t border-white/10 bg-dark-800 p-4">
      {/* Reply preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-2 overflow-hidden"
          >
            <div className="flex items-center gap-2 p-2 bg-dark-700 rounded-lg border-l-2 border-accent-cyan">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-accent-cyan font-medium">
                  Replying to {replyingTo.senderName}
                </p>
                <p className="text-sm text-gray-400 truncate">
                  {replyingTo.content}
                </p>
              </div>
              <button
                onClick={onCancelReply}
                className="p-1 hover:bg-dark-600 rounded transition-colors"
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
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-2 overflow-hidden"
          >
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-20 rounded-lg object-cover"
              />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Image button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="p-3 bg-dark-700 hover:bg-dark-600 rounded-xl transition-colors disabled:opacity-50"
        >
          <Image className="w-5 h-5 text-gray-400" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Text input */}
        <div className="flex-1 relative">
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
            className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan resize-none max-h-32 disabled:opacity-50"
            style={{ minHeight: '48px' }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || isUploading || (!message.trim() && !selectedImage)}
          className="p-3 bg-gradient-to-r from-accent-cyan to-accent-purple rounded-xl transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Send className="w-5 h-5 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
