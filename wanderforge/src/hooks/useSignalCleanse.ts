// Signal-Cleanse React Hook
import { useCallback } from 'react';
import { useSignalCleanseStore } from '../stores/signal-cleanse.store';
import { ChatParserPipeline } from '../services/ai/pipelines';
import type { ChatExtractionResult } from '../services/ai/types';

export function useSignalCleanse() {
  const store = useSignalCleanseStore();

  const processChat = useCallback(async (chatText: string): Promise<ChatExtractionResult | null> => {
    store.startProcessing();

    const pipeline = new ChatParserPipeline({
      onProgress: (stage, progress) => {
        store.updateProgress(stage, progress);
      },
      onProviderChange: (provider) => {
        store.setActiveProvider(provider);
      },
      onFallback: (provider) => {
        store.addFallback(provider);
      },
    });

    try {
      const result = await pipeline.process(chatText, {
        enrichPlaces: true,
        maxPlacesToEnrich: 5,
      });

      store.setResult(result);
      return result;
    } catch (error) {
      console.error('Signal-Cleanse processing failed:', error);
      store.updateProgress('Error: ' + (error instanceof Error ? error.message : 'Processing failed'), 0);
      return null;
    }
  }, [store]);

  return {
    // State
    chatInput: store.chatInput,
    setChatInput: store.setChatInput,
    isProcessing: store.isProcessing,
    processingStage: store.processingStage,
    processingProgress: store.processingProgress,
    extractionResult: store.extractionResult,
    activeProvider: store.activeProvider,
    fallbacksUsed: store.fallbacksUsed,

    // Actions
    processChat,
    reset: store.reset,
  };
}
