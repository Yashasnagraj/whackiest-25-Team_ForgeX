// Dates Aggregator - Collect proposals, exceptions, and determine status
import type { ExtractedDate, RawChatMessage } from '../types';
import { normalizeVoters } from './decision-extractor';

export interface DateProposal {
  range: string;
  proposedBy: string[];
  context?: string;
}

export interface AggregatedDates {
  status: 'open' | 'finalized';
  proposals: DateProposal[];
  exceptions: string[];
  finalDate?: ExtractedDate;
}

// Collect date proposals and determine status
export function aggregateDates(
  proposalsRaw: Array<{ range: string; by: string | string[]; context?: string }>,
  exceptionsRaw: string[] = []
): AggregatedDates {
  // Normalize proposals
  const proposals: DateProposal[] = proposalsRaw.map(p => ({
    range: p.range,
    proposedBy: normalizeVoters(p.by),
    context: p.context,
  }));

  const exceptions = exceptionsRaw || [];

  // Check if any proposal has 2+ distinct proposers (consensus)
  const anyFinal = proposals.some(p => (p.proposedBy || []).length >= 2);
  const status = anyFinal ? 'finalized' : 'open';

  // If finalized, find the winning proposal
  let finalDate: ExtractedDate | undefined;
  if (anyFinal) {
    const winningProposal = proposals.find(p => p.proposedBy.length >= 2);
    if (winningProposal) {
      finalDate = {
        date: winningProposal.range,
        context: winningProposal.context || 'Agreed by group',
        confidence: 85,
        source: 'heuristic',
        proposedBy: winningProposal.proposedBy.join(', '),
        status: 'finalized',
      };
    }
  }

  return { status, proposals, exceptions, finalDate };
}

// Extract date proposals from messages
export function extractDateProposals(messages: RawChatMessage[]): Array<{ range: string; by: string | string[]; context?: string }> {
  const proposals: Array<{ range: string; by: string | string[]; context?: string }> = [];
  const seenRanges = new Set<string>();

  // Date range patterns
  const datePatterns = [
    // "Jan 24-26", "24-26 Jan", "Dec 15-18"
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d{1,2})\s*[-–]\s*(\d{1,2})\b/gi,
    /\b(\d{1,2})\s*[-–]\s*(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/gi,
    // "24th to 26th"
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:to|-)\s+(\d{1,2})(?:st|nd|rd|th)?\b/gi,
    // Specific dates like "Jan 24"
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d{1,2})(?:st|nd|rd|th)?\b/gi,
  ];

  for (const msg of messages) {
    if (msg.isMedia || !msg.content) continue;

    for (const pattern of datePatterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(msg.content)) !== null) {
        const range = match[0].trim();
        const normalizedRange = range.toLowerCase();

        if (!seenRanges.has(normalizedRange)) {
          seenRanges.add(normalizedRange);
          proposals.push({
            range,
            by: msg.sender || 'Unknown',
            context: msg.content.substring(0, 100),
          });
        } else {
          // Add voter to existing proposal
          const existing = proposals.find(p => p.range.toLowerCase() === normalizedRange);
          if (existing && msg.sender) {
            const voters = normalizeVoters(existing.by);
            if (!voters.includes(msg.sender)) {
              existing.by = [...voters, msg.sender];
            }
          }
        }
      }
    }
  }

  return proposals;
}

// Extract date exceptions (people who can't make certain dates)
export function extractDateExceptions(messages: RawChatMessage[]): string[] {
  const exceptions: string[] = [];
  const exceptionPatterns = [
    /(?:i\s+)?(?:can'?t|cannot|won'?t|not\s+available|busy)\s+(?:on\s+)?(?:the\s+)?(\d{1,2}(?:st|nd|rd|th)?|\w+day)/gi,
    /(\d{1,2}(?:st|nd|rd|th)?)\s+(?:doesn'?t|won'?t|not)\s+work/gi,
    /(?:except|not)\s+(\d{1,2}(?:st|nd|rd|th)?)/gi,
  ];

  for (const msg of messages) {
    if (msg.isMedia || !msg.content) continue;

    for (const pattern of exceptionPatterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(msg.content)) !== null) {
        const exception = `${msg.sender || 'Someone'}: ${match[0].trim()}`;
        if (!exceptions.includes(exception)) {
          exceptions.push(exception);
        }
      }
    }
  }

  return exceptions;
}

// Full date extraction pipeline
export function extractDatesWithProposals(messages: RawChatMessage[]): AggregatedDates {
  const proposals = extractDateProposals(messages);
  const exceptions = extractDateExceptions(messages);
  return aggregateDates(proposals, exceptions);
}
