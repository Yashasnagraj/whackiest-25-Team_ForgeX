// Gemini Provider - Primary LLM with retry logic
import type { LLMProviderName, LLMPrompt, LLMResponse } from '../types';
import { retryWithBackoff } from '../utils/retry-utils';

// Updated to gemini-2.0-flash (gemini-1.5-flash is deprecated)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Retry configuration for Gemini
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffFactor: 2,
  jitterMs: 500,
};

export class GeminiProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  get name(): LLMProviderName {
    return 'gemini';
  }

  async sendRequest<T>(prompt: LLMPrompt): Promise<LLMResponse<T>> {
    const startTime = Date.now();

    try {
      const result = await retryWithBackoff(
        async () => {
          const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: `${prompt.system}\n\n${prompt.user}` }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 4096,
              }
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            const error = new Error(`Gemini API error: ${response.status} - ${errorText}`);
            (error as any).status = response.status;

            // Check for rate limit or quota errors
            if (response.status === 429 || /quota|rate.?limit|resource.?exhausted/i.test(errorText)) {
              (error as any).isRetryable = true;
              // Try to extract retry delay from Google's error format
              const retryMatch = errorText.match(/retryDelay["\s:]+(\d+)/i);
              if (retryMatch) {
                (error as any).retryAfter = parseInt(retryMatch[1], 10);
              }
            }

            throw error;
          }

          return response;
        },
        {
          ...RETRY_CONFIG,
          onRetry: (attempt, error, delayMs) => {
            console.warn(`[Gemini] Retry ${attempt} after ${Math.round(delayMs)}ms: ${error.message}`);
          },
        }
      );

      const data = await result.json();
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textContent) {
        throw new Error('No content in Gemini response');
      }

      // Parse JSON from response (handle markdown code blocks)
      const parsed = this.parseJSONResponse<T>(textContent);

      if (!parsed) {
        throw new Error('Failed to parse JSON from Gemini response');
      }

      return {
        success: true,
        data: parsed,
        provider: 'gemini',
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Gemini] Request failed after retries: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        provider: 'gemini',
        latencyMs: Date.now() - startTime,
      };
    }
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
}
