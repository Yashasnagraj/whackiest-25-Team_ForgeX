// Heuristic Budget Extraction - V3.2 with Consensus Detection
import type { ExtractedBudget, BudgetItem, BudgetProposal, RawChatMessage } from '../types';

interface CurrencyPattern {
  pattern: RegExp;
  currency: string;
  symbol: string;
}

// Money context signals - amount must have these in context to be valid
const MONEY_CONTEXT_SIGNALS = [
  'k', 'K', '₹', 'rs', 'inr', 'budget', 'cost', 'price',
  'per person', 'per night', 'per head', 'each', 'total',
  'stay', 'hotel', 'hostel', 'resort', 'room',
  'train', 'bus', 'flight', 'cab', 'taxi', 'travel', 'ticket',
  'food', 'expense', 'spend', 'worth', 'max', 'min', 'around',
  'approx', 'roughly', 'about', 'upto', 'up to', 'stretch',
];

// Patterns that look like money but aren't (e.g., dates, times)
const DATE_LIKE_PATTERNS = [
  /^\d{1,2}[-/]\d{1,2}$/,           // 10-13 (date range without k)
  /^\d{1,2}:\d{2}$/,                 // 10:30 (time)
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{1,2}/i, // Dec 10
  /\d{1,2}\s*(am|pm)\b/i,            // 10 am
];

// V3 FIX: Media indicators - reject amounts from meme/GIF contexts
const MEDIA_INDICATORS = ['meme', 'gif', 'sticker', 'image', 'video', 'omitted', 'sent a'];

// V3 FIX: Check if context contains media indicators
function isMediaContext(context: string): boolean {
  const lower = context.toLowerCase();
  return MEDIA_INDICATORS.some(m => lower.includes(m));
}

// Enhanced currency patterns for Indian informal chat
const CURRENCY_PATTERNS: CurrencyPattern[] = [
  // Indian Rupees with k notation: "10k", "15k", "1.8k"
  { pattern: /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*k\b/gi, currency: 'INR', symbol: '₹' },
  // Standard: ₹15,000 or Rs. 15000 or INR 15000
  { pattern: /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{2})?)/gi, currency: 'INR', symbol: '₹' },
  // Standalone k notation: "10-12k", "15k max"
  { pattern: /\b([\d,]+(?:\.\d+)?)\s*k\b(?!\w)/gi, currency: 'INR', symbol: '₹' },
  // US Dollars
  { pattern: /(?:\$|usd)\s*([\d,]+(?:\.\d{2})?)/gi, currency: 'USD', symbol: '$' },
  // Euros
  { pattern: /(?:€|eur)\s*([\d,]+(?:\.\d{2})?)/gi, currency: 'EUR', symbol: '€' },
];

// Check if context has money-related signals
function hasMoneyContext(context: string, matchedText: string): boolean {
  const lower = context.toLowerCase();
  const matched = matchedText.toLowerCase();

  // If it has currency symbol or k notation, it's definitely money
  if (/₹|rs\.?|inr|\$|€/i.test(matched) || /\d+k\b/i.test(matched)) {
    return true;
  }

  // Otherwise check for context signals
  return MONEY_CONTEXT_SIGNALS.some(signal => lower.includes(signal.toLowerCase()));
}

// Check if match looks like a date/time rather than money
function isDateLike(matchedText: string, context: string): boolean {
  // Check if the matched text looks like a date
  if (DATE_LIKE_PATTERNS.some(p => p.test(matchedText))) {
    return true;
  }

  // Check if context has date indicators
  const dateContext = /\b(date|day|night|morning|evening|pm|am|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i;
  const lowerContext = context.toLowerCase();

  // If context mentions dates but no money signals, likely a date
  if (dateContext.test(lowerContext) && !MONEY_CONTEXT_SIGNALS.some(s => lowerContext.includes(s))) {
    return true;
  }

  return false;
}

// Range pattern: "10-12k", "10k-15k", "₹10,000-15,000"
const RANGE_PATTERN = /(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*k?\s*[-–to]+\s*([\d,]+(?:\.\d+)?)\s*k?/gi;

// Per-person/night patterns
const PER_PERSON_PATTERN = /per\s*(?:person|head|pax)|each|\/person|\/head|per\s*head/i;
const PER_NIGHT_PATTERN = /per\s*(?:night|day)|\/night|\/day|a\s*night/i;

// Budget category keywords
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Stay': ['hostel', 'hotel', 'resort', 'stay', 'room', 'dorm', 'accommodation', 'airbnb', 'oyo'],
  'Transport': ['train', 'bus', 'flight', 'cab', 'taxi', 'travel', 'ticket', 'uber', 'ola', 'petrol', 'fuel'],
  'Food': ['food', 'eat', 'lunch', 'dinner', 'breakfast', 'meal', 'restaurant', 'dhaba', 'cafe'],
  'Activities': ['entry', 'ticket', 'cruise', 'scuba', 'parasailing', 'activity', 'tour', 'guide', 'ride'],
  'Total': ['total', 'budget', 'max', 'overall', 'per person', 'per head'],
};

function getContext(text: string, matchIndex: number, radius: number = 80): string {
  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(text.length, matchIndex + radius);
  return text.slice(start, end).replace(/\n/g, ' ').trim();
}

function parseAmount(amountStr: string, hasKSuffix: boolean = false): number {
  // Remove commas and parse
  let amount = parseFloat(amountStr.replace(/,/g, ''));

  // Handle 'k' suffix (e.g., 15k = 15000, 1.8k = 1800)
  if (hasKSuffix || /k$/i.test(amountStr)) {
    amount *= 1000;
  }

  return amount;
}

function formatCurrency(amount: number, symbol: string): string {
  if (amount >= 100000) {
    return `${symbol}${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `${symbol}${amount.toLocaleString('en-IN')}`;
  }
  return `${symbol}${amount}`;
}

function detectCategory(context: string): string {
  const lower = context.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return 'Expense';
}

function cleanContext(context: string): string {
  // Extract meaningful part of context
  return context
    .replace(/[^\w\s₹$€.,\-–]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 50);
}

// V3.2: Find who proposed an amount from messages
function findProposer(context: string, messages: RawChatMessage[]): string | undefined {
  // Extract a snippet to match against messages
  const snippet = context.substring(0, 30).toLowerCase();
  for (const msg of messages) {
    if (msg.content.toLowerCase().includes(snippet) && msg.sender) {
      return msg.sender;
    }
  }
  return undefined;
}

// V3.2: Normalize budget amount for grouping similar proposals
function normalizeBudgetAmount(amount: number, maxAmount?: number): string {
  // Round to nearest 1000 for grouping
  const rounded = Math.round(amount / 1000) * 1000;
  if (maxAmount) {
    const roundedMax = Math.round(maxAmount / 1000) * 1000;
    return `${rounded}-${roundedMax}`;
  }
  return `${rounded}`;
}

export function extractBudgetHeuristic(text: string, messages: RawChatMessage[] = []): ExtractedBudget | null {
  const amounts: {
    amount: number;
    maxAmount?: number;
    currency: string;
    symbol: string;
    context: string;
    index: number;
    isRange: boolean;
    perPerson: boolean;
    perNight: boolean;
    category: string;
    proposedBy?: string;  // V3.2
  }[] = [];

  // First, extract ranges (e.g., "10-12k", "₹10,000-15,000")
  const rangeRegex = new RegExp(RANGE_PATTERN.source, RANGE_PATTERN.flags);
  let match;

  while ((match = rangeRegex.exec(text)) !== null) {
    const context = getContext(text, match.index);
    const matchedText = match[0];
    const hasK = /k/i.test(matchedText);
    const minAmount = parseAmount(match[1], hasK);
    const maxAmount = parseAmount(match[2], hasK);

    // V2 FIX: Skip if no money context or looks like a date
    if (!hasMoneyContext(context, matchedText)) continue;
    if (isDateLike(matchedText, context)) continue;

    // V3 FIX: Skip if context contains media indicators (meme/GIF)
    if (isMediaContext(context)) continue;

    // V2+V3 FIX: Minimum amount threshold (100 INR) - strict enforcement
    if (minAmount < 100 && !hasK) continue;

    if (minAmount > 0 && maxAmount > 0 && maxAmount >= minAmount) {
      amounts.push({
        amount: minAmount,
        maxAmount,
        currency: 'INR',
        symbol: '₹',
        context,
        index: match.index,
        isRange: true,
        perPerson: PER_PERSON_PATTERN.test(context),
        perNight: PER_NIGHT_PATTERN.test(context),
        category: detectCategory(context),
        proposedBy: findProposer(context, messages),  // V3.2
      });
    }
  }

  // Then extract single amounts
  for (const { pattern, currency, symbol } of CURRENCY_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(text)) !== null) {
      const context = getContext(text, match.index);
      const matchedText = match[0];
      const hasK = /k/i.test(matchedText);
      const amount = parseAmount(match[1], hasK);

      // V2 FIX: Skip if no money context or looks like a date
      if (!hasMoneyContext(context, matchedText)) continue;
      if (isDateLike(matchedText, context)) continue;

      // V3 FIX: Skip if context contains media indicators (meme/GIF)
      if (isMediaContext(context)) continue;

      // V2+V3 FIX: Minimum amount threshold (100 INR) - strict enforcement
      // Only allow amounts < 100 if they have explicit currency symbol AND k notation
      if (amount < 100 && !hasK) continue;

      // Skip if this is part of a range we already captured
      const isPartOfRange = amounts.some(a =>
        a.isRange &&
        Math.abs(match!.index - a.index) < 30
      );

      if (amount > 0 && !isPartOfRange) {
        amounts.push({
          amount,
          currency,
          symbol,
          context,
          index: match.index,
          isRange: false,
          perPerson: PER_PERSON_PATTERN.test(context),
          perNight: PER_NIGHT_PATTERN.test(context),
          category: detectCategory(context),
          proposedBy: findProposer(context, messages),  // V3.2
        });
      }
    }
  }

  if (amounts.length === 0) return null;

  // Deduplicate by similar amounts and close positions
  const deduped = amounts.filter((a, i, arr) => {
    return !arr.some((b, j) =>
      j < i &&
      Math.abs(a.amount - b.amount) < 100 &&
      Math.abs(a.index - b.index) < 50
    );
  });

  // V3.2: Group amounts by normalized value to check consensus
  const proposalGroups = new Map<string, { proposers: Set<string>; amounts: typeof amounts }>();

  for (const a of deduped) {
    // Only group "Total" category for consensus checking
    if (a.category !== 'Total' && !a.perPerson) continue;

    const key = normalizeBudgetAmount(a.amount, a.maxAmount);
    if (!proposalGroups.has(key)) {
      proposalGroups.set(key, { proposers: new Set(), amounts: [] });
    }
    const group = proposalGroups.get(key)!;
    group.amounts.push(a);
    if (a.proposedBy) {
      group.proposers.add(a.proposedBy);
    }
  }

  // V3.2: Check if any budget has consensus (2+ different proposers)
  let hasConsensus = false;
  let consensusAmount: typeof amounts[0] | null = null;

  for (const [_, group] of proposalGroups) {
    if (group.proposers.size >= 2) {
      hasConsensus = true;
      consensusAmount = group.amounts[0];
      break;
    }
  }

  // V3.2: Create proposals list for display when no consensus
  const proposals: BudgetProposal[] = [];
  for (const a of deduped.filter(x => x.category === 'Total' || x.perPerson)) {
    let amountStr = formatCurrency(a.amount, a.symbol);
    if (a.isRange && a.maxAmount) {
      amountStr = `${amountStr} - ${formatCurrency(a.maxAmount, a.symbol)}`;
    }

    // Check if this amount is already in proposals
    const existing = proposals.find(p => p.amount === amountStr);
    if (existing) {
      if (a.proposedBy && !existing.proposedBy.includes(a.proposedBy)) {
        existing.proposedBy.push(a.proposedBy);
      }
    } else {
      proposals.push({
        amount: amountStr,
        proposedBy: a.proposedBy ? [a.proposedBy] : [],
        context: cleanContext(a.context),
      });
    }
  }

  // V3.2: Only set total if there's consensus, otherwise null
  let totalStr: string | null = null;
  let budgetEntry = deduped[0]; // Default to first for currency/perPerson

  if (hasConsensus && consensusAmount) {
    budgetEntry = consensusAmount;
    if (budgetEntry.isRange && budgetEntry.maxAmount) {
      totalStr = `${formatCurrency(budgetEntry.amount, budgetEntry.symbol)} - ${formatCurrency(budgetEntry.maxAmount, budgetEntry.symbol)}`;
    } else {
      totalStr = formatCurrency(budgetEntry.amount, budgetEntry.symbol);
    }
  }

  // Create breakdown from other amounts (non-total categories)
  const breakdown: BudgetItem[] = deduped
    .filter(a => a.category !== 'Total' && !a.perPerson)
    .slice(0, 6)
    .map(a => {
      let amountStr = formatCurrency(a.amount, a.symbol);
      if (a.isRange && a.maxAmount) {
        amountStr = `${amountStr} - ${formatCurrency(a.maxAmount, a.symbol)}`;
      }
      if (a.perNight) {
        amountStr += '/night';
      }

      return {
        item: a.category,
        amount: amountStr,
        notes: cleanContext(a.context),
      };
    });

  // Calculate confidence based on what we found
  let confidence = 50;
  if (hasConsensus) confidence += 30;  // V3.2: Big boost for consensus
  if (breakdown.length > 0) confidence += 10;
  if (deduped.length > 2) confidence += 10;

  return {
    total: totalStr,  // V3.2: null if no consensus
    currency: budgetEntry?.currency || 'INR',
    perPerson: budgetEntry?.perPerson || false,
    breakdown,
    confidence: Math.min(confidence, 90),
    source: 'heuristic',
    status: hasConsensus ? 'finalized' : 'open',  // V3.2
    proposals: hasConsensus ? undefined : proposals,  // V3.2: Only show proposals if no consensus
  };
}
