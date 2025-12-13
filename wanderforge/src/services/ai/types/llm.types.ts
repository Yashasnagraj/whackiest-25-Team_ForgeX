// LLM Provider Types

export type LLMProviderName = 'gemini' | 'groq' | 'openrouter' | 'huggingface' | 'offline';

export interface LLMConfig {
  name: LLMProviderName;
  apiKey?: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface LLMResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  provider: LLMProviderName;
  latencyMs: number;
}

export interface LLMPrompt {
  system: string;
  user: string;
}

export interface ProviderHealth {
  name: LLMProviderName;
  available: boolean;
  lastChecked: Date;
  consecutiveFailures: number;
}
