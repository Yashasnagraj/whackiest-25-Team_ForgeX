// Chat Parser Pipeline - Main Orchestrator
import type { ChatExtractionResult, LLMProviderName, ChatParsingOptions } from '../types';
import { LLMProviderManager } from '../providers';
import { CHAT_EXTRACTION_SYSTEM_PROMPT, createChatExtractionPrompt } from '../prompts/chat-parsing.prompts';
import { enrichPlaces } from '../search';

interface PipelineCallbacks {
  onProgress?: (stage: string, progress: number) => void;
  onProviderChange?: (provider: LLMProviderName) => void;
  onFallback?: (provider: LLMProviderName) => void;
}

export class ChatParserPipeline {
  private providerManager: LLMProviderManager;
  private callbacks: PipelineCallbacks;

  constructor(callbacks?: PipelineCallbacks) {
    this.callbacks = callbacks || {};
    this.providerManager = new LLMProviderManager({
      onProviderChange: callbacks?.onProviderChange,
      onFallback: callbacks?.onFallback,
    });
  }

  async process(
    chatText: string,
    options?: ChatParsingOptions
  ): Promise<ChatExtractionResult> {
    const startTime = Date.now();

    // Stage 1: Pre-processing
    this.callbacks.onProgress?.('Analyzing chat messages...', 10);

    // Stage 2: AI Extraction
    this.callbacks.onProgress?.('Extracting information with AI...', 30);

    const prompt = {
      system: CHAT_EXTRACTION_SYSTEM_PROMPT,
      user: createChatExtractionPrompt(chatText),
    };

    const response = await this.providerManager.executeWithFallback<ChatExtractionResult>(prompt);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to extract data from chat');
    }

    let result = response.data;

    // Ensure stats are populated
    result.stats = {
      ...result.stats,
      processingTimeMs: Date.now() - startTime,
      providersUsed: [response.provider],
    };

    // Add source to all items if not present
    result = this.addSourceAttribution(result, response.provider);

    // Stage 3: Place Enrichment (optional)
    if (options?.enrichPlaces !== false && result.places.length > 0) {
      this.callbacks.onProgress?.('Enriching place data...', 70);

      try {
        result.places = await enrichPlaces(
          result.places,
          options?.maxPlacesToEnrich || 5
        );
      } catch (error) {
        console.warn('Place enrichment failed:', error);
        // Continue without enrichment
      }
    }

    // Stage 4: Finalization
    this.callbacks.onProgress?.('Finalizing results...', 90);

    // Calculate extracted items
    result.stats.extractedItems =
      result.dates.length +
      (result.budget ? result.budget.breakdown.length + 1 : 0) +
      result.places.length +
      result.tasks.length +
      result.decisions.length;

    result.stats.processingTimeMs = Date.now() - startTime;

    this.callbacks.onProgress?.('Complete!', 100);

    return result;
  }

  private addSourceAttribution(
    result: ChatExtractionResult,
    provider: LLMProviderName
  ): ChatExtractionResult {
    const source = provider === 'offline' ? 'heuristic' : 'ai';

    return {
      ...result,
      dates: result.dates.map(d => ({ ...d, source: d.source || source })),
      budget: result.budget ? { ...result.budget, source: result.budget.source || source } : null,
      places: result.places.map(p => ({
        ...p,
        source: p.source || source,
        confidence: p.confidence || (source === 'ai' ? 80 : 60),
      })),
      tasks: result.tasks.map(t => ({ ...t, source: t.source || source })),
      decisions: result.decisions.map(d => ({
        ...d,
        source: d.source || source,
        confidence: d.confidence || (source === 'ai' ? 80 : 60),
      })),
    };
  }

  getAvailableProviders(): LLMProviderName[] {
    return this.providerManager.getAvailableProviders();
  }
}
