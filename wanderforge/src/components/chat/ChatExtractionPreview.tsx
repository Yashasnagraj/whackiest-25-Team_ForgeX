// ============================================================
// CHAT EXTRACTION PREVIEW
// Live extraction sidebar with trip data
// ============================================================

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Wallet,
  MapPin,
  CheckSquare,
  MessageSquare,
  Sparkles,
  Loader2,
  ChevronRight,
  X,
  RefreshCw,
} from 'lucide-react';
import { useChatStore } from '../../stores/chat.store';
import { forceExtraction, finalizeExtraction } from '../../services/chat';
import { useItineraryStore } from '../../stores/itinerary.store';

interface Props {
  groupId: string;
  memberId: string;
  onClose: () => void;
}

export function ChatExtractionPreview({ groupId, memberId, onClose }: Props) {
  const navigate = useNavigate();
  const liveExtraction = useChatStore((state) => state.liveExtraction);
  const setExtractionSource = useItineraryStore((state) => state.setExtractionSource);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const extraction = liveExtraction?.extraction ?? null;
  const confidence = liveExtraction?.confidence ?? 0;
  const isExtracting = liveExtraction?.isExtracting ?? false;
  const messagesSinceExtraction = liveExtraction?.messagesSinceExtraction ?? 0;

  // Compute hasExtraction and summary without creating new objects
  const hasExtraction = extraction !== null;

  const summary = useMemo(() => {
    if (!extraction) {
      return { dates: 0, budget: false, places: 0, tasks: 0, decisions: 0 };
    }
    return {
      dates: extraction.dates?.length ?? 0,
      budget: extraction.budget !== null,
      places: extraction.places?.filter((p) => p.status !== 'rejected').length ?? 0,
      tasks: extraction.tasks?.length ?? 0,
      decisions: extraction.decisions?.filter((d) => d.confirmed).length ?? 0,
    };
  }, [extraction]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await forceExtraction(groupId);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFinalize = async () => {
    if (!extraction) return;

    setIsFinalizing(true);
    try {
      const snapshot = await finalizeExtraction(groupId, memberId);
      if (snapshot) {
        // Pass to itinerary store
        setExtractionSource(extraction);

        // Navigate to trip planner
        navigate('/itinerary');
      }
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="border-l border-white/10 bg-dark-800 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-purple" />
          <h3 className="font-semibold text-white">Live Extraction</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isExtracting}
            className="p-1.5 hover:bg-dark-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-400 ${
                isRefreshing || isExtracting ? 'animate-spin' : ''
              }`}
            />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isExtracting ? (
          // Extracting state
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="w-8 h-8 text-accent-purple animate-spin" />
            <p className="text-sm text-gray-400">Extracting trip details...</p>
          </div>
        ) : !hasExtraction ? (
          // No extraction yet
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <MessageSquare className="w-8 h-8 text-gray-600" />
            <p className="text-sm text-gray-400 text-center">
              Keep chatting! Trip details will appear here as we detect them.
            </p>
            {messagesSinceExtraction > 0 && (
              <p className="text-xs text-gray-500">
                {messagesSinceExtraction} messages since last extraction
              </p>
            )}
          </div>
        ) : (
          // Show extraction
          <>
            {/* Confidence badge */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Confidence</span>
              <span
                className={`font-medium ${
                  confidence >= 70
                    ? 'text-journey-success'
                    : confidence >= 40
                    ? 'text-yellow-400'
                    : 'text-gray-400'
                }`}
              >
                {confidence}%
              </span>
            </div>

            {/* Dates */}
            {extraction?.dates && extraction.dates.length > 0 && (
              <ExtractedSection
                icon={Calendar}
                title="Dates"
                color="text-accent-cyan"
              >
                {extraction.dates.map((date, i) => (
                  <div key={i} className="text-sm text-white">
                    {date.date}
                    {date.context && (
                      <span className="text-gray-400 text-xs block">
                        {date.context}
                      </span>
                    )}
                  </div>
                ))}
              </ExtractedSection>
            )}

            {/* Budget */}
            {extraction?.budget && (
              <ExtractedSection
                icon={Wallet}
                title="Budget"
                color="text-journey-dreamGold"
              >
                <div className="text-sm text-white">
                  {extraction.budget.total || 'TBD'} {extraction.budget.currency}
                  {extraction.budget.perPerson && (
                    <span className="text-gray-400 text-xs"> / person</span>
                  )}
                </div>
                {extraction.budget.breakdown.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {extraction.budget.breakdown.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-xs text-gray-400"
                      >
                        <span>{item.item}</span>
                        <span>{item.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ExtractedSection>
            )}

            {/* Places */}
            {extraction?.places && extraction.places.length > 0 && (
              <ExtractedSection
                icon={MapPin}
                title={`Places (${summary.places})`}
                color="text-journey-memory"
              >
                <div className="flex flex-wrap gap-2">
                  {extraction.places
                    .filter((p) => p.status !== 'rejected')
                    .map((place, i) => (
                      <span
                        key={i}
                        className={`px-2 py-1 rounded-full text-xs ${
                          place.status === 'confirmed'
                            ? 'bg-journey-success/20 text-journey-success'
                            : 'bg-gray-600/50 text-gray-300'
                        }`}
                      >
                        {place.name}
                        {place.votes > 1 && (
                          <span className="ml-1 opacity-70">({place.votes})</span>
                        )}
                      </span>
                    ))}
                </div>
              </ExtractedSection>
            )}

            {/* Tasks */}
            {extraction?.tasks && extraction.tasks.length > 0 && (
              <ExtractedSection
                icon={CheckSquare}
                title={`Tasks (${summary.tasks})`}
                color="text-accent-orange"
              >
                <div className="space-y-2">
                  {extraction.tasks.map((task, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div
                        className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 ${
                          task.status === 'done'
                            ? 'bg-journey-success border-journey-success'
                            : 'border-gray-600'
                        }`}
                      />
                      <div className="text-sm">
                        <span className="text-white">{task.task}</span>
                        {task.assignee && (
                          <span className="text-gray-400 text-xs block">
                            {task.assignee}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ExtractedSection>
            )}

            {/* Decisions */}
            {extraction?.decisions && summary.decisions > 0 && (
              <ExtractedSection
                icon={MessageSquare}
                title={`Decisions (${summary.decisions})`}
                color="text-accent-purple"
              >
                <div className="space-y-2">
                  {extraction.decisions
                    .filter((d) => d.confirmed)
                    .map((decision, i) => (
                      <div
                        key={i}
                        className="text-sm text-white bg-dark-700/50 p-2 rounded-lg"
                      >
                        {decision.decision}
                      </div>
                    ))}
                </div>
              </ExtractedSection>
            )}
          </>
        )}
      </div>

      {/* Finalize button */}
      {hasExtraction && (
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleFinalize}
            disabled={isFinalizing}
            className="w-full py-3 bg-gradient-to-r from-accent-purple to-accent-cyan text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isFinalizing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Finalizing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Finalize & Plan Trip
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}

// Section component
function ExtractedSection({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm font-medium text-gray-300">{title}</span>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}
