// ============================================================
// TRIP CHAT - Extraction Service
// Live extraction with debounce, integrates with Signal-Cleanse pipeline
// ============================================================

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { ChatParserPipeline } from '../ai/pipelines/chat-parser.pipeline';
import type { ChatExtractionResult } from '../ai/types';
import type {
  DbChatMessage,
  DbChatMember,
  DbChatExtractionSnapshot,
  LiveExtractionState,
  ExtractionProgress,
} from './types';
import { getAllMessages } from './chat-messages.service';
import { getGroupMembers } from './chat-groups.service';

// ==================== Constants ====================

const EXTRACTION_DEBOUNCE_MS = 5000; // 5 seconds after last message
const MIN_MESSAGES_FOR_EXTRACTION = 3; // Minimum messages before extraction
const EXTRACTION_COOLDOWN_MS = 30000; // Minimum time between extractions

// ==================== State ====================

let extractionDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastExtractionTime: number = 0;
let currentExtraction: LiveExtractionState | null = null;
let extractionCallback: ((state: LiveExtractionState) => void) | null = null;
let progressCallback: ((progress: ExtractionProgress) => void) | null = null;
let pipeline: ChatParserPipeline | null = null;

// ==================== Initialization ====================

/**
 * Initialize extraction service for a group
 */
export function initExtractionService(
  onExtraction: (state: LiveExtractionState) => void,
  onProgress?: (progress: ExtractionProgress) => void
): void {
  extractionCallback = onExtraction;
  progressCallback = onProgress || null;

  // Initialize pipeline with progress callbacks
  pipeline = new ChatParserPipeline({
    onProgress: (stage, progress) => {
      if (progressCallback) {
        progressCallback({
          stage: 'extracting',
          progress,
          message: stage,
        });
      }
    },
  });

  // Reset state
  currentExtraction = {
    isExtracting: false,
    lastExtractedAt: null,
    messagesSinceExtraction: 0,
    extraction: null,
    confidence: 0,
  };

  emitExtractionState();
}

/**
 * Cleanup extraction service
 */
export function cleanupExtractionService(): void {
  if (extractionDebounceTimer) {
    clearTimeout(extractionDebounceTimer);
    extractionDebounceTimer = null;
  }

  extractionCallback = null;
  progressCallback = null;
  pipeline = null;
  currentExtraction = null;
  lastExtractionTime = 0;
}

// ==================== Trigger Extraction ====================

/**
 * Trigger extraction on new message (with debounce)
 */
export function triggerExtraction(groupId: string): void {
  if (!currentExtraction) return;

  // Increment message counter
  currentExtraction.messagesSinceExtraction++;
  emitExtractionState();

  // Clear existing debounce
  if (extractionDebounceTimer) {
    clearTimeout(extractionDebounceTimer);
  }

  // Set new debounce
  extractionDebounceTimer = setTimeout(async () => {
    await performExtraction(groupId);
  }, EXTRACTION_DEBOUNCE_MS);
}

/**
 * Force immediate extraction (bypass debounce)
 */
export async function forceExtraction(groupId: string): Promise<void> {
  if (extractionDebounceTimer) {
    clearTimeout(extractionDebounceTimer);
    extractionDebounceTimer = null;
  }

  await performExtraction(groupId);
}

/**
 * Perform the actual extraction
 */
async function performExtraction(groupId: string): Promise<void> {
  if (!currentExtraction || !pipeline) return;

  // Check cooldown
  const now = Date.now();
  if (now - lastExtractionTime < EXTRACTION_COOLDOWN_MS) {
    console.log('[ChatExtraction] Skipping - cooldown active');
    return;
  }

  // Get messages
  const messages = await getAllMessages(groupId);
  if (messages.length < MIN_MESSAGES_FOR_EXTRACTION) {
    console.log('[ChatExtraction] Skipping - not enough messages');
    return;
  }

  // Get members for sender names
  const members = await getGroupMembers(groupId);

  // Update state
  currentExtraction.isExtracting = true;
  emitExtractionState();

  if (progressCallback) {
    progressCallback({
      stage: 'collecting',
      progress: 10,
      message: 'Collecting messages...',
    });
  }

  try {
    // Convert to chat text format
    const chatText = formatMessagesForExtraction(messages, members);

    console.log('[ChatExtraction] Extracting from', messages.length, 'messages');

    // Run extraction pipeline
    const result = await pipeline.process(chatText, {
      enrichPlaces: true,
      maxPlacesToEnrich: 5,
    });

    // Calculate overall confidence
    const confidence = calculateConfidence(result);

    // Update state
    currentExtraction = {
      isExtracting: false,
      lastExtractedAt: new Date(),
      messagesSinceExtraction: 0,
      extraction: result,
      confidence,
    };

    lastExtractionTime = Date.now();

    if (progressCallback) {
      progressCallback({
        stage: 'complete',
        progress: 100,
        message: 'Extraction complete!',
      });
    }

    emitExtractionState();
    console.log('[ChatExtraction] Extraction complete, confidence:', confidence);
  } catch (error) {
    console.error('[ChatExtraction] Extraction failed:', error);

    currentExtraction.isExtracting = false;
    emitExtractionState();

    if (progressCallback) {
      progressCallback({
        stage: 'idle',
        progress: 0,
        message: 'Extraction failed',
      });
    }
  }
}

// ==================== Finalization ====================

/**
 * Finalize extraction and save snapshot
 */
export async function finalizeExtraction(
  groupId: string,
  memberId: string
): Promise<DbChatExtractionSnapshot | null> {
  if (!isSupabaseConfigured() || !supabase || !currentExtraction?.extraction) {
    return null;
  }

  try {
    // Get latest message for reference
    const messages = await getAllMessages(groupId);
    const lastMessage = messages[messages.length - 1];

    const { data, error } = await supabase
      .from('chat_extraction_snapshots')
      .insert({
        group_id: groupId,
        extraction_data: currentExtraction.extraction,
        message_count: messages.length,
        last_message_id: lastMessage?.id || null,
        is_finalized: true,
        finalized_by: memberId,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('[ChatExtraction] Failed to save snapshot:', error);
      return null;
    }

    console.log('[ChatExtraction] Snapshot saved:', data.id);
    return data as DbChatExtractionSnapshot;
  } catch (error) {
    console.error('[ChatExtraction] Error saving snapshot:', error);
    return null;
  }
}

/**
 * Get the latest finalized extraction snapshot
 */
export async function getLatestSnapshot(
  groupId: string
): Promise<DbChatExtractionSnapshot | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('chat_extraction_snapshots')
      .select()
      .eq('group_id', groupId)
      .eq('is_finalized', true)
      .order('finalized_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data as DbChatExtractionSnapshot;
  } catch (error) {
    console.error('[ChatExtraction] Error getting snapshot:', error);
    return null;
  }
}

/**
 * Get all extraction snapshots for a group
 */
export async function getAllSnapshots(
  groupId: string
): Promise<DbChatExtractionSnapshot[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('chat_extraction_snapshots')
      .select()
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as DbChatExtractionSnapshot[];
  } catch (error) {
    console.error('[ChatExtraction] Error getting snapshots:', error);
    return [];
  }
}

// ==================== Helpers ====================

/**
 * Format messages for extraction pipeline
 */
function formatMessagesForExtraction(
  messages: DbChatMessage[],
  members: DbChatMember[]
): string {
  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  return messages
    .filter((m) => m.message_type === 'text' && !m.is_deleted)
    .map((m) => {
      const senderName = memberMap.get(m.sender_id) || 'Unknown';
      const timestamp = new Date(m.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `[${timestamp}] ${senderName}: ${m.content}`;
    })
    .join('\n');
}

/**
 * Calculate overall confidence score
 */
function calculateConfidence(result: ChatExtractionResult): number {
  const scores: number[] = [];

  // Dates confidence
  if (result.dates.length > 0) {
    scores.push(
      result.dates.reduce((sum, d) => sum + d.confidence, 0) / result.dates.length
    );
  }

  // Budget confidence
  if (result.budget) {
    scores.push(result.budget.confidence);
  }

  // Places confidence (average of confirmed places)
  const confirmedPlaces = result.places.filter((p) => p.status === 'confirmed');
  if (confirmedPlaces.length > 0) {
    scores.push(
      confirmedPlaces.reduce((sum, p) => sum + p.confidence, 0) / confirmedPlaces.length
    );
  }

  // Decisions confidence
  const confirmedDecisions = result.decisions.filter((d) => d.confirmed);
  if (confirmedDecisions.length > 0) {
    scores.push(
      confirmedDecisions.reduce((sum, d) => sum + d.confidence, 0) /
        confirmedDecisions.length
    );
  }

  // Return average or 0 if no scores
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

/**
 * Emit current extraction state to callback
 */
function emitExtractionState(): void {
  if (extractionCallback && currentExtraction) {
    extractionCallback({ ...currentExtraction });
  }
}

/**
 * Get current extraction state
 */
export function getExtractionState(): LiveExtractionState | null {
  return currentExtraction ? { ...currentExtraction } : null;
}

/**
 * Check if extraction is in progress
 */
export function isExtracting(): boolean {
  return currentExtraction?.isExtracting || false;
}

/**
 * Get extraction summary for display
 */
export function getExtractionSummary(
  extraction: ChatExtractionResult | null
): {
  dateCount: number;
  hasBudget: boolean;
  placeCount: number;
  taskCount: number;
  decisionCount: number;
} {
  if (!extraction) {
    return {
      dateCount: 0,
      hasBudget: false,
      placeCount: 0,
      taskCount: 0,
      decisionCount: 0,
    };
  }

  return {
    dateCount: extraction.dates.length,
    hasBudget: extraction.budget !== null,
    placeCount: extraction.places.filter((p) => p.status !== 'rejected').length,
    taskCount: extraction.tasks.length,
    decisionCount: extraction.decisions.filter((d) => d.confirmed).length,
  };
}
