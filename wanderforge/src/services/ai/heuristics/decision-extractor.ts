// Decision Extraction with Voter Normalization and Confirmation Logic
import type { ExtractedDecision, RawChatMessage } from '../types';

// Helper: normalize raw voter strings into an array of distinct names
export function normalizeVoters(raw: string | string[]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return Array.from(new Set(raw.map(s => s.trim()).filter(Boolean)));
  }
  const asStr = String(raw).trim();
  // try comma/pipe/slash/and splits
  if (/[,|/]| and /i.test(asStr)) {
    return Array.from(new Set(asStr.split(/[,|/]+|\band\b/i).map(s => s.trim()).filter(Boolean)));
  }
  // fallback: break on word boundaries and CamelCase heuristics
  const parts = asStr.match(/[A-Z]?[a-z]+|[A-Z]{2,}|[0-9]+/g) || [];
  return Array.from(new Set(parts.map(p => p.trim()).filter(Boolean)));
}

// Compute confirmation and confidence for a decision object
export function computeDecisionConfirmation(
  decisionData: { voters?: string | string[]; voterString?: string },
  relatedMessages: RawChatMessage[] = []
): { voters: string[]; confirmed: boolean; confidence: number; score: number } {
  const voters = normalizeVoters(decisionData.voters || decisionData.voterString || []);

  // Count confirmations in related messages
  const confirmations = relatedMessages
    .map(m => m.content)
    .filter(c => /(yes|works|ok|fine|book it|confirmed|agree|\+1|👍|✅)/i.test(c)).length;

  const score = confirmations * 2 + Math.max(0, voters.length - 1);
  const confirmed = (voters.length >= 2 && score >= 4);
  const confidence = Math.min(1, score / 6);

  return { voters, confirmed, confidence, score };
}

// Format decision output with proper voter attribution
export function formatDecisionOutput(
  decision: string,
  voterData: { voters: string[]; confirmed: boolean; confidence: number }
): ExtractedDecision {
  return {
    decision,
    madeBy: voterData.voters.join(', '),
    participants: voterData.voters,
    confirmed: voterData.confirmed,
    confidence: Math.round(voterData.confidence * 100),
    source: 'heuristic',
  };
}

// Agreement signals for consensus detection
const AGREEMENT_SIGNALS = [
  'yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 'fine', 'done', 'agreed',
  'sounds good', 'works for me', 'works', 'perfect', 'great', 'cool', 'nice',
  'good idea', 'i agree', 'same', 'me too', '+1', 'lets go', "let's do it",
  'haan', 'ha', 'theek', 'sahi', 'pakka', 'chalega', 'chalo', 'done deal',
  'aaytu', 'sari', 'olledu', 'madi', 'book madi',
  '👍', '✅', '👌', '💯', '🔥', '✔️', '🙌',
];

// Decision keywords that indicate a real decision
const DECISION_KEYWORDS = [
  /let's\s+(do|go|book|take|use|finalize)/i,
  /we\s+will/i,
  /confirmed/i,
  /book\s+it/i,
  /final\s*(call|decision|ized)?/i,
  /done\s+deal/i,
  /go\s+with\s+(this|that)/i,
  /locked/i,
  /settled/i,
  /finalize/i,
  /decided/i,
  /agreed/i,
];

// Check if message is an agreement
export function isAgreementMessage(content: string): boolean {
  const lower = content.toLowerCase().trim();
  return AGREEMENT_SIGNALS.some(signal =>
    lower === signal.toLowerCase() ||
    lower.startsWith(signal.toLowerCase() + ' ') ||
    lower.endsWith(' ' + signal.toLowerCase())
  );
}

// Check if text contains decision keyword
export function hasDecisionKeyword(text: string): boolean {
  return DECISION_KEYWORDS.some(p => p.test(text));
}

// Extract consensus-based decisions from messages
export function extractConsensusDecisions(messages: RawChatMessage[]): ExtractedDecision[] {
  const decisions: ExtractedDecision[] = [];
  const statementVotes = new Map<string, {
    voters: Set<string>;
    statement: string;
    originalSender: string;
    agreements: RawChatMessage[];
  }>();

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.isMedia || !msg.content) continue;

    if (isAgreementMessage(msg.content) && i > 0 && msg.sender) {
      // Look for the statement being agreed to
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        const prevMsg = messages[j];
        if (!prevMsg.isMedia && prevMsg.content.length > 10) {
          const prevContent = prevMsg.content.toLowerCase();

          // Skip if previous message is also just an agreement
          if (isAgreementMessage(prevMsg.content)) continue;

          // Must have a decision keyword
          if (!hasDecisionKeyword(prevMsg.content)) continue;

          const key = prevContent.substring(0, 50);
          const originalSender = prevMsg.sender || 'unknown';

          if (!statementVotes.has(key)) {
            statementVotes.set(key, {
              voters: new Set([originalSender]),
              statement: prevMsg.content,
              originalSender,
              agreements: [],
            });
          }

          // Only count if voter is DIFFERENT from original sender
          if (msg.sender !== originalSender) {
            statementVotes.get(key)!.voters.add(msg.sender);
            statementVotes.get(key)!.agreements.push(msg);
          }
          break;
        }
      }
    }
  }

  // Convert statements with sufficient votes to decisions
  for (const [_, data] of statementVotes) {
    const voterResult = computeDecisionConfirmation(
      { voters: Array.from(data.voters) },
      data.agreements
    );

    if (voterResult.confirmed || data.voters.size >= 2) {
      const statement = data.statement.replace(/[.!,;:]+$/, '').trim();
      if (statement.length > 5) {
        decisions.push(formatDecisionOutput(
          statement.charAt(0).toUpperCase() + statement.slice(1),
          voterResult
        ));
      }
    }
  }

  return decisions.slice(0, 5);
}
