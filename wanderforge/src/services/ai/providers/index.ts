// LLM Provider Manager with Fallback Chain
// Primary: Gemini | Fallback: OpenRouter, Groq, Offline
import type { LLMProviderName, LLMPrompt, LLMResponse, ProviderHealth, ChatExtractionResult } from '../types';
import { GeminiProvider } from './gemini-provider';
import { GroqProvider } from './groq-provider';
import { OpenRouterProvider } from './openrouter-provider';
import { OfflineProvider } from './offline-provider';
import { getAIServiceConfig } from '../utils/env-config';

// Fallback order: Gemini → OpenRouter → Groq → Offline
// Using Gemini as primary LLM (free tier available)
const FALLBACK_ORDER: LLMProviderName[] = ['gemini', 'openrouter', 'groq', 'offline'];

interface Provider {
  name: LLMProviderName;
  sendRequest<T>(prompt: LLMPrompt): Promise<LLMResponse<T>>;
}

export class LLMProviderManager {
  private providers: Map<LLMProviderName, Provider> = new Map();
  private healthStatus: Map<LLMProviderName, ProviderHealth> = new Map();
  private onProviderChange?: (provider: LLMProviderName) => void;
  private onFallback?: (provider: LLMProviderName) => void;

  constructor(options?: {
    onProviderChange?: (provider: LLMProviderName) => void;
    onFallback?: (provider: LLMProviderName) => void;
  }) {
    this.onProviderChange = options?.onProviderChange;
    this.onFallback = options?.onFallback;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const config = getAIServiceConfig();

    // Initialize Gemini - PRIMARY PROVIDER (free tier available)
    if (config.gemini.apiKey) {
      this.providers.set('gemini', new GeminiProvider(config.gemini.apiKey));
      this.healthStatus.set('gemini', {
        name: 'gemini',
        available: true,
        lastChecked: new Date(),
        consecutiveFailures: 0,
      });
      console.log('[LLM] Gemini initialized as primary provider');
    }

    // Initialize OpenRouter as first fallback
    if (config.openrouter.apiKey) {
      this.providers.set('openrouter', new OpenRouterProvider(config.openrouter.apiKey));
      this.healthStatus.set('openrouter', {
        name: 'openrouter',
        available: true,
        lastChecked: new Date(),
        consecutiveFailures: 0,
      });
      console.log('[LLM] OpenRouter initialized as fallback provider');
    }

    // Initialize Groq as second fallback
    if (config.groq.apiKey) {
      this.providers.set('groq', new GroqProvider(config.groq.apiKey));
      this.healthStatus.set('groq', {
        name: 'groq',
        available: true,
        lastChecked: new Date(),
        consecutiveFailures: 0,
      });
      console.log('[LLM] Groq initialized as fallback provider');
    }

    // Offline provider is always available as final fallback
    this.providers.set('offline', new OfflineProvider());
    this.healthStatus.set('offline', {
      name: 'offline',
      available: true,
      lastChecked: new Date(),
      consecutiveFailures: 0,
    });
  }

  async executeWithFallback<T = ChatExtractionResult>(
    prompt: LLMPrompt,
    preferredProvider?: LLMProviderName
  ): Promise<LLMResponse<T>> {
    // Build provider order
    const providerOrder = preferredProvider
      ? [preferredProvider, ...FALLBACK_ORDER.filter(p => p !== preferredProvider)]
      : FALLBACK_ORDER;

    const errors: string[] = [];
    let isFirstAttempt = true;

    for (const providerName of providerOrder) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      // Skip providers with too many recent failures (except offline)
      const health = this.healthStatus.get(providerName);
      if (health && health.consecutiveFailures >= 3 && providerName !== 'offline') {
        continue;
      }

      // Notify about provider change
      if (this.onProviderChange) {
        this.onProviderChange(providerName);
      }

      // Notify about fallback (not for first attempt)
      if (!isFirstAttempt && this.onFallback) {
        this.onFallback(providerName);
      }

      try {
        console.log(`[LLM] Trying provider: ${providerName}`);
        const response = await provider.sendRequest<T>(prompt);

        if (response.success) {
          this.recordSuccess(providerName);
          console.log(`[LLM] Success with ${providerName} in ${response.latencyMs}ms`);
          return response;
        }

        errors.push(`${providerName}: ${response.error}`);
        this.recordFailure(providerName);
        console.warn(`[LLM] ${providerName} failed: ${response.error}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${providerName}: ${errorMsg}`);
        this.recordFailure(providerName);
        console.error(`[LLM] ${providerName} threw error:`, error);
      }

      isFirstAttempt = false;
    }

    // All providers failed - this should never happen since offline always works
    return {
      success: false,
      error: `All providers failed: ${errors.join('; ')}`,
      provider: 'offline',
      latencyMs: 0,
    };
  }

  private recordSuccess(provider: LLMProviderName): void {
    const health = this.healthStatus.get(provider);
    if (health) {
      health.consecutiveFailures = 0;
      health.lastChecked = new Date();
    }
  }

  private recordFailure(provider: LLMProviderName): void {
    const health = this.healthStatus.get(provider);
    if (health) {
      health.consecutiveFailures++;
      health.lastChecked = new Date();
    }
  }

  getAvailableProviders(): LLMProviderName[] {
    return Array.from(this.providers.keys());
  }

  getProviderHealth(): ProviderHealth[] {
    return Array.from(this.healthStatus.values());
  }
}

// Export providers
export { GeminiProvider } from './gemini-provider';
export { GroqProvider } from './groq-provider';
export { OpenRouterProvider } from './openrouter-provider';
export { OfflineProvider } from './offline-provider';
