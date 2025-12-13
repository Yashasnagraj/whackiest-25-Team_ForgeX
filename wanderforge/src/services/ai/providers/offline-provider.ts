// Offline Provider - Heuristic-based fallback (always works)
import type { LLMProviderName, LLMPrompt, LLMResponse, ChatExtractionResult, RawChatMessage } from '../types';
import {
  extractDatesHeuristic,
  extractBudgetHeuristic,
  extractPlacesHeuristic,
  extractTasksHeuristic,
  extractDecisionsHeuristic,
  extractQuestionsHeuristic,
  extractConsensusDecisions,
  // V3.3: New decision extractor with voter normalization
  extractConsensusDecisionsV2,
  normalizeVoters,
  // V3.3: Dates aggregator with proposals/exceptions
  extractDatesWithProposals,
} from '../heuristics';

export class OfflineProvider {
  get name(): LLMProviderName {
    return 'offline';
  }

  async sendRequest<T>(prompt: LLMPrompt): Promise<LLMResponse<T>> {
    const startTime = Date.now();

    try {
      // Extract chat text from the prompt
      const chatMatch = prompt.user.match(/---CHAT START---\s*([\s\S]*?)\s*---CHAT END---/);
      const chatText = chatMatch ? chatMatch[1] : prompt.user;

      // Parse into messages
      const messages = this.parseMessages(chatText);

      // Run all heuristic extractors
      const patternDecisions = extractDecisionsHeuristic(chatText);
      // V3.3: Use improved consensus decision extractor with voter normalization
      const consensusDecisions = extractConsensusDecisionsV2(messages);

      // Merge decisions (dedupe by similar text)
      const allDecisions = [...patternDecisions];
      for (const cd of consensusDecisions) {
        const isDupe = allDecisions.some(d =>
          d.decision.toLowerCase().includes(cd.decision.toLowerCase().substring(0, 20)) ||
          cd.decision.toLowerCase().includes(d.decision.toLowerCase().substring(0, 20))
        );
        if (!isDupe) {
          allDecisions.push(cd);
        }
      }

      // V3.3: Extract dates with proposals and exceptions
      const datesAggregated = extractDatesWithProposals(messages);

      const result: ChatExtractionResult = {
        dates: extractDatesHeuristic(chatText, messages),  // V3.2: Pass messages for proposer tracking
        budget: extractBudgetHeuristic(chatText, messages),  // V3.2: Pass messages for consensus
        places: extractPlacesHeuristic(chatText, messages),
        tasks: extractTasksHeuristic(chatText, messages),
        decisions: allDecisions.slice(0, 8),
        openQuestions: extractQuestionsHeuristic(chatText),
        stats: {
          totalMessages: messages.length,
          relevantMessages: messages.filter(m => !m.isMedia).length,
          mediaFiltered: messages.filter(m => m.isMedia).length,
          extractedItems: 0,
          processingTimeMs: 0,
          providersUsed: ['offline'],
        },
      };

      // Calculate total extracted items
      result.stats.extractedItems =
        result.dates.length +
        (result.budget ? result.budget.breakdown.length + 1 : 0) +
        result.places.length +
        result.tasks.length +
        result.decisions.length;

      result.stats.processingTimeMs = Date.now() - startTime;

      return {
        success: true,
        data: result as T,
        provider: 'offline',
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Offline processing failed',
        provider: 'offline',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  private parseMessages(text: string): RawChatMessage[] {
    const lines = text.split('\n');
    const messages: RawChatMessage[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // WhatsApp format: "[timestamp] Name: message" or "Name: message"
      const match = trimmed.match(/^(?:\[.*?\]\s*)?([^:]+):\s*(.+)$/);

      if (match) {
        const sender = match[1].trim();
        const content = match[2].trim();

        // Detect media messages
        const isMedia =
          /(?:image|video|gif|sticker|audio|document|meme)\s*(?:omitted|sent)/i.test(content) ||
          /^\*.*sent.*\*$/i.test(content) ||
          this.isEmojiOnly(content);

        messages.push({
          sender,
          content,
          isMedia,
        });
      } else if (trimmed.length > 0) {
        // Line without sender (continuation or system message)
        messages.push({
          content: trimmed,
          isMedia: /meme|gif/i.test(trimmed),
        });
      }
    }

    return messages;
  }

  private isEmojiOnly(text: string): boolean {
    // Remove all emoji characters and see if anything remains
    const withoutEmoji = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{FE0F}]|\s/gu, '');
    return text.length > 0 && withoutEmoji.length === 0;
  }
}
