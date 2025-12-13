// Environment Configuration for AI Services
import type { LLMProviderName } from '../types';

export interface AIServiceConfig {
  gemini: {
    apiKey: string | null;
    available: boolean;
  };
  groq: {
    apiKey: string | null;
    available: boolean;
  };
  openrouter: {
    apiKey: string | null;
    available: boolean;
  };
  huggingface: {
    apiKey: string | null;
    available: boolean;
  };
  foursquare: {
    apiKey: string | null;
    available: boolean;
  };
}

export function getAIServiceConfig(): AIServiceConfig {
  return {
    gemini: {
      apiKey: import.meta.env.VITE_GEMINI_API_KEY || null,
      available: !!import.meta.env.VITE_GEMINI_API_KEY,
    },
    groq: {
      apiKey: import.meta.env.VITE_GROQ_API_KEY || null,
      available: !!import.meta.env.VITE_GROQ_API_KEY,
    },
    openrouter: {
      apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || null,
      available: !!import.meta.env.VITE_OPENROUTER_API_KEY,
    },
    huggingface: {
      apiKey: import.meta.env.VITE_HUGGINGFACE_API_KEY || null,
      available: !!import.meta.env.VITE_HUGGINGFACE_API_KEY,
    },
    foursquare: {
      apiKey: import.meta.env.VITE_FOURSQUARE_API_KEY || null,
      available: !!import.meta.env.VITE_FOURSQUARE_API_KEY,
    },
  };
}

export function getAvailableProviders(): LLMProviderName[] {
  const config = getAIServiceConfig();
  const providers: LLMProviderName[] = [];

  if (config.gemini.available) providers.push('gemini');
  if (config.groq.available) providers.push('groq');
  if (config.openrouter.available) providers.push('openrouter');
  if (config.huggingface.available) providers.push('huggingface');
  providers.push('offline'); // Always available

  return providers;
}
