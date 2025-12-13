// Signal-Cleanse Zustand Store
import { create } from 'zustand';
import type { ChatExtractionResult, LLMProviderName } from '../services/ai/types';

interface SignalCleanseState {
  // Input
  chatInput: string;
  setChatInput: (input: string) => void;

  // Processing state
  isProcessing: boolean;
  processingStage: string;
  processingProgress: number;

  // Results
  extractionResult: ChatExtractionResult | null;

  // Provider info
  activeProvider: LLMProviderName | null;
  fallbacksUsed: LLMProviderName[];

  // Actions
  startProcessing: () => void;
  updateProgress: (stage: string, progress: number) => void;
  setResult: (result: ChatExtractionResult) => void;
  setActiveProvider: (provider: LLMProviderName) => void;
  addFallback: (provider: LLMProviderName) => void;
  reset: () => void;
}

export const useSignalCleanseStore = create<SignalCleanseState>((set) => ({
  // Initial state
  chatInput: '',
  setChatInput: (input) => set({ chatInput: input }),

  isProcessing: false,
  processingStage: '',
  processingProgress: 0,

  extractionResult: null,

  activeProvider: null,
  fallbacksUsed: [],

  // Actions
  startProcessing: () => set({
    isProcessing: true,
    processingStage: 'Initializing...',
    processingProgress: 0,
    fallbacksUsed: [],
    extractionResult: null,
  }),

  updateProgress: (stage, progress) => set({
    processingStage: stage,
    processingProgress: progress,
  }),

  setResult: (result) => set({
    extractionResult: result,
    isProcessing: false,
    processingProgress: 100,
  }),

  setActiveProvider: (provider) => set({ activeProvider: provider }),

  addFallback: (provider) => set((state) => ({
    fallbacksUsed: [...state.fallbacksUsed, provider],
  })),

  reset: () => set({
    chatInput: '',
    isProcessing: false,
    processingStage: '',
    processingProgress: 0,
    extractionResult: null,
    activeProvider: null,
    fallbacksUsed: [],
  }),
}));
