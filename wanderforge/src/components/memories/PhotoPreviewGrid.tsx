// ============================================================
// PHOTO PREVIEW GRID
// Displays uploaded photos with status indicators
// ============================================================

import { motion, AnimatePresence } from 'framer-motion';
import { useCinematicMemoriesStore } from '../../stores/cinematic-memories.store';
import type { UploadedPhoto, ProcessedPhoto } from '../../services/memories/types';

export function PhotoPreviewGrid() {
  const { uploadedPhotos, processedPhotos, removePhoto, analysisStage } = useCinematicMemoriesStore();

  // Combine uploaded and processed photos
  const photos: (UploadedPhoto | ProcessedPhoto)[] = processedPhotos.length > 0
    ? processedPhotos
    : uploadedPhotos;

  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-200">
          Your Photos ({photos.length})
        </h3>
        {processedPhotos.length > 0 && (
          <span className="text-sm text-green-400">
            AI Analysis Complete
          </span>
        )}
      </div>

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        layout
      >
        <AnimatePresence mode="popLayout">
          {photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              onRemove={() => removePhoto(photo.id)}
              canRemove={analysisStage === 'idle'}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

interface PhotoCardProps {
  photo: UploadedPhoto | ProcessedPhoto;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

function PhotoCard({ photo, index, onRemove, canRemove }: PhotoCardProps) {
  const isProcessed = 'analysis' in photo;
  const analysis = isProcessed ? (photo as ProcessedPhoto).analysis : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative aspect-square rounded-xl overflow-hidden group"
    >
      {/* Photo */}
      <img
        src={photo.previewUrl}
        alt={`Upload ${index + 1}`}
        className="w-full h-full object-cover"
      />

      {/* Status overlay */}
      <AnimatePresence>
        {photo.status === 'analyzing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"
              />
              <p className="text-xs text-purple-400">Analyzing...</p>
            </div>
          </motion.div>
        )}

        {photo.status === 'analyzed' && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3"
          >
            {/* Emotion badge */}
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs">{getEmotionEmoji(analysis.dominantEmotion)}</span>
              <span className="text-xs text-white/80 capitalize">{analysis.dominantEmotion}</span>
            </div>

            {/* Caption */}
            <p className="text-xs text-white/90 line-clamp-2">{analysis.caption}</p>

            {/* Landmark badge */}
            {analysis.identifiedLandmark && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute top-2 left-2 bg-yellow-500/90 text-black text-xs px-2 py-0.5 rounded-full font-medium"
              >
                {analysis.identifiedLandmark}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene type badge */}
      {isProcessed && analysis && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full"
        >
          {getSceneIcon(analysis.sceneType)} {analysis.sceneType}
        </motion.div>
      )}

      {/* Remove button */}
      {canRemove && (
        <motion.button
          initial={{ opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <span className="text-white text-xs">×</span>
        </motion.button>
      )}

      {/* Index number */}
      <div className="absolute bottom-2 left-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
        <span className="text-xs text-white font-medium">{index + 1}</span>
      </div>
    </motion.div>
  );
}

function getEmotionEmoji(emotion: string): string {
  const emojis: Record<string, string> = {
    joy: '😊',
    excitement: '🎉',
    awe: '😮',
    love: '❤️',
    peace: '😌',
    adventure: '🚀',
    nostalgia: '🥹',
    contemplative: '🤔',
    tired: '😴',
    neutral: '😐',
  };
  return emojis[emotion] || '📷';
}

function getSceneIcon(sceneType: string): string {
  const icons: Record<string, string> = {
    landmark: '🏛️',
    nature: '🌿',
    food: '🍽️',
    activity: '🎯',
    portrait: '👤',
    group: '👥',
    transport: '🚗',
    accommodation: '🏨',
    shopping: '🛍️',
    nightlife: '🌙',
    culture: '🎭',
    candid: '📸',
    scenic: '🌅',
  };
  return icons[sceneType] || '📷';
}
