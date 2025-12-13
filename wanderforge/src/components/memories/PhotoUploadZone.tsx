// ============================================================
// PHOTO UPLOAD ZONE
// Drag & drop photo upload with preview
// ============================================================

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useCinematicMemoriesStore } from '../../stores/cinematic-memories.store';
import type { UploadedPhoto } from '../../services/memories/types';

const MAX_FILES = 20;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export function PhotoUploadZone() {
  const [isDragActive, setIsDragActive] = useState(false);
  const { uploadedPhotos, addPhotos, analysisStage } = useCinematicMemoriesStore();

  const isDisabled = analysisStage !== 'idle' && analysisStage !== 'complete';
  const remainingSlots = MAX_FILES - uploadedPhotos.length;

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || isDisabled) return;

      const validFiles: UploadedPhoto[] = [];

      for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
        const file = files[i];
        if (ACCEPTED_TYPES.includes(file.type) || file.name.match(/\.(heic|heif)$/i)) {
          validFiles.push({
            id: uuidv4(),
            file,
            previewUrl: URL.createObjectURL(file),
            status: 'pending',
          });
        }
      }

      if (validFiles.length > 0) {
        addPhotos(validFiles);
      }
    },
    [addPhotos, isDisabled, remainingSlots]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input
      e.target.value = '';
    },
    [handleFiles]
  );

  return (
    <motion.div
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
        isDragActive
          ? 'border-purple-500 bg-purple-500/10'
          : isDisabled
            ? 'border-gray-700 bg-gray-800/30 cursor-not-allowed'
            : 'border-gray-600 bg-gray-800/50 hover:border-purple-400 hover:bg-purple-500/5'
      }`}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      whileHover={!isDisabled ? { scale: 1.01 } : {}}
      whileTap={!isDisabled ? { scale: 0.99 } : {}}
    >
      <input
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleInputChange}
        disabled={isDisabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />

      <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
        <AnimatePresence mode="wait">
          {isDragActive ? (
            <motion.div
              key="drag-active"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-5xl mb-4"
              >
                📸
              </motion.div>
              <p className="text-lg text-purple-400 font-medium">Drop your photos here!</p>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <motion.span
                  className="text-4xl"
                  animate={{ rotate: [-5, 5, -5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  🖼️
                </motion.span>
                <motion.span
                  className="text-4xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  ✨
                </motion.span>
                <motion.span
                  className="text-4xl"
                  animate={{ rotate: [5, -5, 5] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
                >
                  🎬
                </motion.span>
              </div>

              <p className="text-lg text-gray-300 font-medium mb-2">
                {isDisabled ? 'Processing in progress...' : 'Drop your travel photos here'}
              </p>
              <p className="text-sm text-gray-500">
                {isDisabled
                  ? 'Please wait while we create your story'
                  : `or click to browse • ${remainingSlots} slots remaining`}
              </p>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-600">
                <span className="px-2 py-1 bg-gray-800 rounded">JPG</span>
                <span className="px-2 py-1 bg-gray-800 rounded">PNG</span>
                <span className="px-2 py-1 bg-gray-800 rounded">WEBP</span>
                <span className="px-2 py-1 bg-gray-800 rounded">HEIC</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress indicator for remaining slots */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 rounded-b-2xl overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${(uploadedPhotos.length / MAX_FILES) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}
