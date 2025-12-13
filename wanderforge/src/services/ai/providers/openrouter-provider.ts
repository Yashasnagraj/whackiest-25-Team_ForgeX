// OpenRouter Provider - Access to Grok and other models via OpenRouter with retry logic
import type { LLMProviderName, LLMPrompt, LLMResponse } from '../types';
import { retryWithBackoff } from '../utils/retry-utils';

// OpenRouter API endpoint (OpenAI-compatible)
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Retry configuration for OpenRouter
const RETRY_CONFIG = {
  maxRetries: 4,
  initialDelayMs: 1000,
  maxDelayMs: 45000,
  backoffFactor: 2,
  jitterMs: 500,
};

// Model fallback chain for OpenRouter - Grok primary, no Gemini
const MODEL_FALLBACK = [
  'x-ai/grok-3-mini-beta',             // Primary: Grok 3 Mini - fast and capable
  'x-ai/grok-2-1212',                  // Fallback 1: Grok 2 - more powerful
  'meta-llama/llama-3.3-70b-instruct', // Fallback 2: Llama 3.3 70B
  'anthropic/claude-3-5-haiku',        // Fallback 3: Claude Haiku
];

export class OpenRouterProvider {
  private apiKey: string;
  private currentModelIndex: number = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  get name(): LLMProviderName {
    return 'openrouter';
  }

  async sendRequest<T>(prompt: LLMPrompt): Promise<LLMResponse<T>> {
    const startTime = Date.now();

    // Try models in fallback order
    for (let modelIdx = this.currentModelIndex; modelIdx < MODEL_FALLBACK.length; modelIdx++) {
      const model = MODEL_FALLBACK[modelIdx];

      try {
        const result = await retryWithBackoff(
          async () => {
            const response = await fetch(OPENROUTER_API_URL, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://wanderforge.app',
                'X-Title': 'WanderForge',
              },
              body: JSON.stringify({
                model: model,
                messages: [
                  { role: 'system', content: prompt.system },
                  { role: 'user', content: prompt.user }
                ],
                temperature: 0.3,
                max_tokens: 4096,
                response_format: { type: 'json_object' },
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              const error = new Error(`OpenRouter API error (${model}): ${response.status} - ${errorText}`);
              (error as any).status = response.status;

              // Check for rate limit or model-specific errors
              if (response.status === 429 || /rate.?limit|quota|too.?many|capacity/i.test(errorText)) {
                (error as any).isRetryable = true;
                const retryAfter = response.headers.get('Retry-After');
                if (retryAfter) {
                  (error as any).retryAfter = parseInt(retryAfter, 10) * 1000;
                }
              }

              // Model not available - try next model
              if (response.status === 404 || /model.?not.?found|not.?available/i.test(errorText)) {
                (error as any).modelUnavailable = true;
              }

              throw error;
            }

            return response;
          },
          {
            ...RETRY_CONFIG,
            onRetry: (attempt, error, delayMs) => {
              console.warn(`[OpenRouter/${model}] Retry ${attempt} after ${Math.round(delayMs)}ms: ${error.message}`);
            },
          }
        );

        const data = await result.json();
        const textContent = data.choices?.[0]?.message?.content;

        if (!textContent) {
          throw new Error('No content in OpenRouter response');
        }

        // Parse JSON from response
        const parsed = this.parseJSONResponse<T>(textContent);

        if (!parsed) {
          throw new Error('Failed to parse JSON from OpenRouter response');
        }

        // Success - remember this model worked
        this.currentModelIndex = modelIdx;

        console.log(`[OpenRouter] Success with model: ${model}`);

        return {
          success: true,
          data: parsed,
          provider: 'openrouter',
          latencyMs: Date.now() - startTime,
        };
      } catch (error) {
        const err = error as any;
        console.warn(`[OpenRouter] Model ${model} failed: ${err.message}`);

        // If model is unavailable, try next model
        if (err.modelUnavailable || modelIdx < MODEL_FALLBACK.length - 1) {
          console.log(`[OpenRouter] Trying next model in fallback chain...`);
          continue;
        }

        // All models exhausted
        return {
          success: false,
          error: err.message || 'Unknown error',
          provider: 'openrouter',
          latencyMs: Date.now() - startTime,
        };
      }
    }

    // Should not reach here, but handle edge case
    return {
      success: false,
      error: 'All OpenRouter models exhausted',
      provider: 'openrouter',
      latencyMs: Date.now() - startTime,
    };
  }

  private parseJSONResponse<T>(text: string): T | null {
    // Remove markdown code blocks if present
    let jsonStr = text.trim();

    // Handle ```json ... ``` or ``` ... ```
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    try {
      return JSON.parse(jsonStr);
    } catch {
      // Try to find JSON object in the text
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  /**
   * Reset model fallback to start from first model
   */
  resetModelFallback(): void {
    this.currentModelIndex = 0;
  }
}
