// Heuristic Date Extraction using Regex - V3.2 with Consensus Detection
import type { ExtractedDate, RawChatMessage } from '../types';

const DATE_PATTERNS = [
  // "December 15-18, 2024" or "Dec 15-18" or "Jan 24-26"
  {
    pattern: /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:\s*[-–to]+\s*(\d{1,2}))?,?\s*(\d{4})?\b/gi,
    confidence: 80,
  },
  // "15/12/2024" or "15-12-2024"
  {
    pattern: /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/g,
    confidence: 75,
  },
  // "15th December" or "December 15th"
  {
    pattern: /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/gi,
    confidence: 75,
  },
  // "24th night" or "25th morning" (Indian informal)
  {
    pattern: /\b(\d{1,2})(?:st|nd|rd|th)\s*(?:night|morning|evening)?\b/gi,
    confidence: 70,
  },
  // "next weekend", "this friday"
  {
    pattern: /\b(this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week(?:end)?)\b/gi,
    confidence: 60,
  },
];

function getContext(text: string, matchIndex: number, radius: number = 50): string {
  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(text.length, matchIndex + radius);
  return text.slice(start, end).replace(/\n/g, ' ').trim();
}

// V3.2: Normalize date range for comparison
function normalizeDateRange(dateStr: string): string {
  // Extract just the numbers for comparison: "Jan 24-26" → "24-26"
  const numbers = dateStr.match(/\d+/g);
  if (!numbers) return dateStr.toLowerCase();
  return numbers.join('-');
}

// V3.2: Find who proposed each date from messages
function findProposer(text: string, dateStr: string, messages: RawChatMessage[]): string | undefined {
  for (const msg of messages) {
    if (msg.content.includes(dateStr) && msg.sender) {
      return msg.sender;
    }
    // Also check for partial matches (just the numbers)
    const numbers = dateStr.match(/\d+/g);
    if (numbers && numbers.some(n => msg.content.includes(n)) && msg.sender) {
      // Make sure the date context is in this message
      const hasDateContext = /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}[-–]\d{1,2}/i.test(msg.content);
      if (hasDateContext) {
        return msg.sender;
      }
    }
  }
  return undefined;
}

export function extractDatesHeuristic(text: string, messages: RawChatMessage[] = []): ExtractedDate[] {
  const dates: ExtractedDate[] = [];
  const seenDates = new Set<string>();
  const dateProposals = new Map<string, Set<string>>(); // normalized range → proposers

  for (const { pattern, confidence } of DATE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      const dateStr = match[0].trim();
      const normalized = dateStr.toLowerCase();

      // Skip if we've already found this exact date
      if (seenDates.has(normalized)) continue;
      seenDates.add(normalized);

      const context = getContext(text, match.index);
      const proposedBy = findProposer(text, dateStr, messages);

      // V3.2: Track proposals by normalized range
      const rangeKey = normalizeDateRange(dateStr);
      if (!dateProposals.has(rangeKey)) {
        dateProposals.set(rangeKey, new Set());
      }
      if (proposedBy) {
        dateProposals.get(rangeKey)!.add(proposedBy);
      }

      dates.push({
        date: dateStr,
        context,
        confidence,
        source: 'heuristic',
        proposedBy,
        status: 'open', // Default to open, will update below
      });
    }
  }

  // V3.2: Check for consensus - mark as finalized only if 2+ DIFFERENT people proposed EXACT same range
  for (const date of dates) {
    const rangeKey = normalizeDateRange(date.date);
    const proposers = dateProposals.get(rangeKey);

    // Only mark as finalized if 2+ different people agree on exact same range
    if (proposers && proposers.size >= 2) {
      date.status = 'finalized';
      date.confidence = Math.min(date.confidence + 15, 95);
    } else {
      date.status = 'open';
    }
  }

  // Sort by confidence
  return dates.sort((a, b) => b.confidence - a.confidence);
}
