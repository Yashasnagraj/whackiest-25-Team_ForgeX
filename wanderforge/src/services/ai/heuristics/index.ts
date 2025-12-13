// Re-export all heuristic extractors
export { extractDatesHeuristic } from './date-extractor';
export { extractBudgetHeuristic } from './budget-extractor';
export { extractPlacesHeuristic, mapPlaceType } from './place-extractor';
export {
  extractTasksHeuristic,
  extractDecisionsHeuristic,
  extractQuestionsHeuristic,
  extractConsensusDecisions,
  extractDue,
  inferAssignee,
} from './task-extractor';

// V3.3: New decision extractor with voter normalization
export {
  normalizeVoters,
  computeDecisionConfirmation,
  formatDecisionOutput,
  isAgreementMessage,
  hasDecisionKeyword,
  extractConsensusDecisions as extractConsensusDecisionsV2,
} from './decision-extractor';

// V3.3: New dates aggregator with proposals/exceptions/status
export {
  aggregateDates,
  extractDateProposals,
  extractDateExceptions,
  extractDatesWithProposals,
} from './dates-aggregator';
export type { DateProposal, AggregatedDates } from './dates-aggregator';
