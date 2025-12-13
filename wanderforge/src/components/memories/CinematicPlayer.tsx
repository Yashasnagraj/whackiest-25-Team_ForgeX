// ============================================================
// CINEMATIC PLAYER - ULTRATHINK EDITION
// Full documentary-style photo player with Ken Burns, doodles, narration
// NOW WITH VOICE NARRATION using Web Speech API!
// ============================================================

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCinematicMemoriesStore } from '../../stores/cinematic-memories.store';
import { KenBurnsImage } from './KenBurnsImage';
import { DoodleCanvas } from './DoodleCanvas';
import { NarrationOverlay, SceneTitleCard } from './NarrationOverlay';
import { EmotionJourneyCompact } from './EmotionJourney';
import type { MemoryScene } from '../../services/memories/types';

export function CinematicPlayer() {
  const {
    generatedStory,
    scenes,
    isPlaying,
    currentSceneIndex,
    currentPhotoIndex,
    showDoodles,
    play,
    pause,
    nextScene,
    prevScene,
    toggleDoodles,
  } = useCinematicMemoriesStore();

  const [showTitleCard, setShowTitleCard] = useState(true);
  // eslint-disable-next-line react-hooks/purity
  const [photoStartTime, setPhotoStartTime] = useState(Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const playerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Speak narration function
  const speakNarration = useCallback((text: string) => {
    if (!voiceEnabled || !text || text.includes('unavailable')) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a good documentary-style voice
    const preferredVoices = [
      'Google UK English Male',
      'Daniel',
      'Google UK English Female',
      'Samantha',
      'Alex',
    ];

    const selectedVoice = availableVoices.find((voice) =>
      preferredVoices.some((pv) => voice.name.includes(pv))
    ) || availableVoices.find((v) => v.lang.startsWith('en')) || availableVoices[0];

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    speechRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [voiceEnabled, availableVoices]);

  // Speak when scene changes
  useEffect(() => {
    if (isPlaying && voiceEnabled && currentSceneIndex >= 0 && scenes[currentSceneIndex]) {
      const scene = scenes[currentSceneIndex];
      // Small delay to let the title card show first
      const timeout = setTimeout(() => {
        speakNarration(scene.narration);
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [currentSceneIndex, isPlaying, voiceEnabled, scenes, speakNarration]);

  // Stop speech when paused
  useEffect(() => {
    if (!isPlaying) {
      speechSynthesis.cancel();
    }
  }, [isPlaying]);

  // Toggle voice narration
  const toggleVoice = useCallback(() => {
    if (voiceEnabled) {
      speechSynthesis.cancel();
    }
    setVoiceEnabled((prev) => !prev);
  }, [voiceEnabled]);

  const currentScene = scenes[currentSceneIndex];
  const currentPhoto = currentScene?.photos[currentPhotoIndex];

  // Auto-advance photos and scenes
  useEffect(() => {
    if (!isPlaying || !currentPhoto) return;

    const duration = currentPhoto.kenBurnsConfig?.duration || 7;

    timerRef.current = setTimeout(() => {
      if (currentPhotoIndex < (currentScene?.photos.length || 0) - 1) {
        // Next photo in scene
        useCinematicMemoriesStore.setState((state) => ({
          currentPhotoIndex: state.currentPhotoIndex + 1,
        }));
        setPhotoStartTime(Date.now());
      } else if (currentSceneIndex < scenes.length - 1) {
        // Next scene
        nextScene();
        setShowTitleCard(true);
        setPhotoStartTime(Date.now());
      } else {
        // End of story
        pause();
      }
    }, duration * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentPhotoIndex, currentSceneIndex, currentPhoto, currentScene, scenes.length, nextScene, pause]);

  // Hide title card after delay
  useEffect(() => {
    if (!showTitleCard) return;

    const timeout = setTimeout(() => setShowTitleCard(false), 2500);
    return () => clearTimeout(timeout);
  }, [showTitleCard, currentSceneIndex]);

  // Reset photo start time when photo changes
  useEffect(() => {
    setPhotoStartTime(Date.now());
  }, [currentPhotoIndex, currentSceneIndex]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!playerRef.current) return;

    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (isPlaying) { pause(); } else { play(); }
          break;
        case 'ArrowRight':
          nextScene();
          break;
        case 'ArrowLeft':
          prevScene();
          break;
        case 'd':
          toggleDoodles();
          break;
        case 'v':
          toggleVoice();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, play, pause, nextScene, prevScene, toggleDoodles, toggleVoice, toggleFullscreen, isFullscreen]);

  if (!generatedStory || scenes.length === 0) {
    return (
      <div className="aspect-video bg-gray-900 rounded-2xl flex items-center justify-center">
        <p className="text-gray-500">No story generated yet</p>
      </div>
    );
  }

  return (
    <div
      ref={playerRef}
      className={`relative rounded-2xl overflow-hidden bg-black ${
        isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'
      }`}
    >
      {/* Main photo with Ken Burns */}
      <AnimatePresence mode="wait">
        {currentPhoto && (
          <motion.div
            key={`${currentSceneIndex}-${currentPhotoIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <KenBurnsImage
              src={currentPhoto.previewUrl}
              alt={currentPhoto.analysis.caption}
              config={currentPhoto.kenBurnsConfig}
              isPlaying={isPlaying && !showTitleCard}
              duration={currentPhoto.kenBurnsConfig?.duration}
            />

            {/* Doodle overlay */}
            {showDoodles && currentPhoto.doodles && (
              <DoodleCanvas
                doodles={currentPhoto.doodles}
                isPlaying={isPlaying && !showTitleCard}
                startTime={photoStartTime}
              />
            )}

            {/* Narration overlay - show scene narration only on first photo, then just captions */}
            <NarrationOverlay
              key={`narration-${currentSceneIndex}-${currentPhotoIndex}`}
              narration={currentPhotoIndex === 0 ? currentScene.narration : ''}
              caption={currentPhoto.analysis.caption}
              isPlaying={isPlaying && !showTitleCard}
              delay={currentPhotoIndex === 0 ? 1500 : 500}
              typingSpeed={35}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene title card */}
      <SceneTitleCard
        title={currentScene?.title || ''}
        subtitle={`Scene ${currentSceneIndex + 1} of ${scenes.length}`}
        isVisible={showTitleCard && isPlaying}
      />

      {/* Story title (first scene only) */}
      {currentSceneIndex === 0 && showTitleCard && isPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20"
        >
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-bold text-white mb-4 text-center px-8"
          >
            {generatedStory.title}
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-lg md:text-xl text-white/70 text-center px-8"
          >
            {generatedStory.tagline}
          </motion.p>
        </motion.div>
      )}

      {/* Controls overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <EmotionJourneyCompact scenes={scenes} currentSceneIndex={currentSceneIndex} />
          </div>
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              style={{
                width: `${((currentSceneIndex * 100 + (currentPhotoIndex / Math.max((currentScene?.photos.length || 1), 1)) * 100) / scenes.length)}%`,
              }}
            />
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Previous */}
            <button
              onClick={prevScene}
              disabled={currentSceneIndex === 0}
              className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={isPlaying ? pause : play}
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextScene}
              disabled={currentSceneIndex === scenes.length - 1}
              className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Voice narration toggle */}
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-full transition-colors ${
                voiceEnabled ? 'bg-blue-500/50' : 'hover:bg-white/10'
              }`}
              title="Toggle voice narration (V)"
            >
              {voiceEnabled ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              )}
            </button>

            {/* Doodle toggle */}
            <button
              onClick={toggleDoodles}
              className={`p-2 rounded-full transition-colors ${
                showDoodles ? 'bg-purple-500/50' : 'hover:bg-white/10'
              }`}
              title="Toggle doodles (D)"
            >
              <span className="text-xl">✨</span>
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              title="Fullscreen (F)"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isFullscreen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Scene info */}
        <div className="flex items-center justify-between mt-3 text-sm text-white/60">
          <span>{currentScene?.title}</span>
          <span>
            {currentSceneIndex + 1} / {scenes.length} scenes
          </span>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="absolute top-4 right-4 opacity-0 hover:opacity-100 transition-opacity">
        <div className="bg-black/60 rounded-lg px-3 py-2 text-xs text-white/60 space-y-1">
          <p>Space: Play/Pause</p>
          <p>←/→: Navigate</p>
          <p>V: Voice</p>
          <p>D: Doodles</p>
          <p>F: Fullscreen</p>
        </div>
      </div>
    </div>
  );
}

// Compact player for preview
export function CinematicPlayerCompact({ scene }: { scene: MemoryScene }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photo = scene.photos[currentPhotoIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % scene.photos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [scene.photos.length]);

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.img
          key={photo.id}
          src={photo.previewUrl}
          alt={photo.analysis.caption}
          className="w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      </AnimatePresence>
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-sm text-white font-medium">{scene.title}</p>
        <p className="text-xs text-white/70">{scene.photos.length} photos</p>
      </div>
    </div>
  );
}
