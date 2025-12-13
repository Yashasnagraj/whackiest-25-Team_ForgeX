// Chat Extraction Types
import type { LLMProviderName } from './llm.types';
import type { EnrichedPlaceData } from './place.types';

export interface RawChatMessage {
  sender?: string;
  content: string;
  timestamp?: string;
  isMedia?: boolean;
}

export interface ExtractedDate {
  date: string;
  startDate?: string;
  endDate?: string;
  context: string;
  confidence: number;
  source: 'ai' | 'heuristic';
  proposedBy?: string;  // V3.2: Track who proposed this date
  status?: 'open' | 'finalized';  // V3.2: Consensus-based status
}

export interface ExtractedBudget {
  total: string | null;  // V3.2: null if no consensus
  currency: string;
  perPerson: boolean;
  breakdown: BudgetItem[];
  confidence: number;
  source: 'ai' | 'heuristic';
  status?: 'open' | 'finalized';  // V3.2: Consensus-based status
  proposals?: BudgetProposal[];   // V3.2: Individual proposals when no consensus
}

// V3.2: Track individual budget proposals
export interface BudgetProposal {
  amount: string;
  proposedBy: string[];
  context?: string;
}

export interface BudgetItem {
  item: string;
  amount: string;
  assignee?: string;
  source?: string;
}

export interface ExtractedPlace {
  name: string;
  type?: 'destination' | 'restaurant' | 'hotel' | 'activity' | 'landmark';
  votes: number;
  status: 'confirmed' | 'maybe' | 'rejected';
  mentionedBy: string[];
  coordinates?: { lat: number; lng: number };
  enrichedData?: EnrichedPlaceData;
  source: 'ai' | 'heuristic';
  confidence: number;
}

export interface ExtractedTask {
  task: string;
  assignee?: string;
  status: 'pending' | 'in-progress' | 'done';
  deadline?: string;
  priority?: 'low' | 'medium' | 'high';
  source: 'ai' | 'heuristic';
}

export interface ExtractedDecision {
  decision: string;
  timestamp?: string;
  participants?: string[];
  madeBy?: string;  // V3.3: Comma-separated voter string
  confirmed?: boolean;  // V3.3: True if 2+ distinct voters confirmed
  confidence: number;
  source: 'ai' | 'heuristic';
}

export interface OpenQuestion {
  question: string;
  participants?: string[];
  context?: string;
  status?: 'open' | 'conditional' | 'resolved'; // V2 FIX: 3-state model
}

export interface ChatExtractionResult {
  dates: ExtractedDate[];
  budget: ExtractedBudget | null;
  places: ExtractedPlace[];
  tasks: ExtractedTask[];
  decisions: ExtractedDecision[];
  openQuestions: OpenQuestion[];
  stats: {
    totalMessages: number;
    relevantMessages: number;
    mediaFiltered: number;
    extractedItems: number;
    processingTimeMs: number;
    providersUsed: LLMProviderName[];
  };
}

export interface ChatParsingOptions {
  includeConfidenceScores?: boolean;
  minConfidenceThreshold?: number;
  enrichPlaces?: boolean;
  maxPlacesToEnrich?: number;
}
