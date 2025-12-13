// Heuristic Task and Decision Extraction - Enhanced for Indian informal chat
import type { ExtractedTask, ExtractedDecision, OpenQuestion, RawChatMessage } from '../types';

// V3.3 FIX: Relative due-date patterns for task deadlines
const RELATIVE_DUE_PATTERNS: Array<{ pattern: RegExp; resolver: () => string }> = [
  { pattern: /\btonight\b/i, resolver: () => new Date().toISOString().slice(0, 10) },
  { pattern: /\btomorrow\b/i, resolver: () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }},
  { pattern: /\bby\s+tonight\b/i, resolver: () => new Date().toISOString().slice(0, 10) },
  { pattern: /\bby\s+tomorrow\b/i, resolver: () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }},
  { pattern: /\bby\s+(\d{1,2})\s*(pm|am)?\b/i, resolver: () => new Date().toISOString().slice(0, 10) },
];

// V3.3 FIX: Extract due date from task text
export function extractDue(text: string): string | undefined {
  for (const { pattern, resolver } of RELATIVE_DUE_PATTERNS) {
    if (pattern.test(text)) {
      return resolver();
    }
  }
  return undefined;
}

// V3.3 FIX: Infer task assignee using lookback patterns
export function inferAssignee(
  messages: RawChatMessage[],
  idx: number,
  currentMsg: RawChatMessage
): string | null {
  const lookback = messages.slice(Math.max(0, idx - 4), idx + 1).reverse();

  for (const m of lookback) {
    // Pattern 1: "@name please book" or "name, could you check"
    const askMatch = m.content.match(/(?:@?([A-Za-z0-9_]+)[,:]?)\s*(?:please|pls|could you|can you)\s+(book|check|do|make|handle|arrange)/i);
    if (askMatch && askMatch[1]) {
      return askMatch[1];
    }

    // Pattern 2: "I'll do it" or "I will book" → use message author
    if (/(i'?ll\s+(?:do|book|check|handle|make|arrange)|i will\s+\w+|i got it|i'm on it|let me)/i.test(m.content) && m.sender) {
      return m.sender;
    }

    // Pattern 3: "ok book" or "book then" → use message author
    if (/(ok book|ok then|book then|done|booked|confirmed)/i.test(m.content) && m.sender) {
      return m.sender;
    }
  }

  // Fallback: use current message sender
  return currentMsg.sender || null;
}

// V3 FIX: Context stitching - look back for task objects
const TASK_OBJECT_PATTERNS = [
  /(?:found|check|look at|try|checking|found this|see this)\s+(?:a\s+)?([A-Za-z\s]+(?:hostel|hotel|resort|stay))/i,
  /([A-Za-z]+(?:Hive|Stay|Inn|Lodge|House|Palace|Villa))\s*[-–]?\s*(?:hostel|hotel)?/i,
  /(?:hostel|hotel|resort|stay)\s*[-–:]?\s*([A-Za-z\s]+)/i,
];

// V3 FIX: Find task object from previous messages
function findTaskObject(messages: RawChatMessage[], currentIdx: number): string | null {
  // Look back up to 3 messages for context
  for (let i = currentIdx - 1; i >= Math.max(0, currentIdx - 3); i--) {
    const msg = messages[i];
    if (msg.isMedia) continue;

    // Look for accommodation/activity references
    for (const pattern of TASK_OBJECT_PATTERNS) {
      const match = msg.content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Also check for simple mentions
    if (/hostel|hotel|resort|ticket|flight|train/i.test(msg.content)) {
      // Extract the most relevant noun phrase
      const simpleMatch = msg.content.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:hostel|hotel|resort)/i);
      if (simpleMatch) return simpleMatch[1].trim();
    }
  }
  return null;
}

// V2 FIX: Explicit task verbs - task must contain one of these
const TASK_VERBS = new Set([
  'book', 'reserve', 'finalize', 'confirm', 'pack', 'bring',
  'arrange', 'organize', 'check', 'cancel', 'call', 'message',
  'send', 'buy', 'get', 'pick', 'drop', 'handle', 'complete',
  'find', 'search', 'look', 'research', 'plan', 'prepare',
  'remind', 'tell', 'ask', 'contact', 'pay', 'transfer',
]);

// V3.2 FIX: Single words that should NEVER be tasks alone
const INVALID_SINGLE_WORD_TASKS = new Set([
  'start', 'begin', 'go', 'do', 'make', 'let', 'see', 'try',
  'wait', 'stop', 'end', 'come', 'leave', 'stay', 'move',
  'i\'ll', 'will', 'can', 'should', 'would', 'could', 'must',
]);

// V2 FIX: Patterns that look like tasks but aren't (budget responses, etc.)
const NON_TASK_PATTERNS = [
  /stretch\s+to/i,           // Budget responses: "stretch to 15k"
  /max\s+\d/i,               // Budget limits: "max 15k"
  /\d+k?\s+max/i,            // Budget limits: "15k max"
  /budget\s+(?:is|of)/i,     // Budget statements
  /\d+k?\s*(?:per|each)/i,   // Price mentions: "1.8k per night"
  /^(?:yes|no|ok|okay|sure|fine|done|cool|nice)$/i, // One-word responses
  /^\d+[\s,-]*\d*k?$/,       // Just numbers: "10-12k"
  /(?:good|great|sounds|works|perfect)/i, // Agreement, not task
];

// Check if text contains a valid task verb
function hasTaskVerb(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/);
  return words.some(w => TASK_VERBS.has(w.replace(/[^a-z]/g, '')));
}

// Check if text matches non-task patterns
function isNonTask(text: string): boolean {
  return NON_TASK_PATTERNS.some(p => p.test(text));
}

// Task assignment patterns - English + Indian informal
const TASK_PATTERNS = [
  // English: "I'll book the tickets"
  { pattern: /\b(i'll|i will|i can|let me|i am going to|gonna)\s+(.+?)(?:[.!?\n]|$)/gi, status: 'pending' as const },
  // English: "Name will book"
  { pattern: /\b([A-Z][a-z]+)\s+(?:will|can|should|is going to)\s+(.+?)(?:[.!?\n]|$)/gi, status: 'pending' as const },

  // Imperative: "Book it", "Do it", "Finalize"
  { pattern: /\b(book|finalize|pack|bring|handle|arrange|organize|check|confirm|cancel)\s+(?:it|this|that|the\s+\w+)?\s*(?:[.!]|$)/gi, status: 'pending' as const },

  // Indian informal: "Book madi" (Kannada - "do it")
  { pattern: /\b(book|finalize|pack|bring|check|cancel|arrange)\s+(?:madi|macha|guru|bro|dude)\s*[.!]*/gi, status: 'pending' as const },

  // Hindi patterns: "Main karunga", "Mein book karunga"
  { pattern: /\b(?:main|mein|mai)\s+(.+?)\s*(?:karunga|karegi|karega|kar lunga|kar deta)\s*[.!]*/gi, status: 'pending' as const },

  // Deadline patterns: "by tonight", "by Dec 10"
  { pattern: /\b(.+?)\s+by\s+(tonight|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|dec\s*\d+|jan\s*\d+)/gi, status: 'pending' as const },

  // Status: Done/Completed
  { pattern: /\b(booked|done|confirmed|completed|finished|sorted|fixed|reserved)\s*[!.]*/gi, status: 'done' as const },

  // Status: In progress
  { pattern: /\b(working on|doing|checking|looking into|researching|searching|finding)\s+(.+?)(?:[.!?\n]|$)/gi, status: 'in-progress' as const },

  // Kannada done: "aaytu" (done), "madidini" (I did it)
  { pattern: /\b(aaytu|aytu|madidini|madidhe|hogidhe)\s*[!.]*/gi, status: 'done' as const },
];

// V3 FIX: Decision MUST contain one of these keywords
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

// V3 FIX: Reaction patterns - these are NEVER decisions
const REACTION_PATTERNS = [
  /^looks?\s+\w+$/i,              // "Looks decent"
  /^\d+\.?\d*\s*stars?$/i,        // "4.1 stars"
  /^why\s+me/i,                   // "Why me bro"
  /^budget\s+explodes?/i,         // "Budget explodes"
  /^(?:nice|cool|great|awesome|good|bad|okay|ok)$/i, // Simple reactions
  /^(?:bro|dude|man|boss|guru|macha)\b/i,  // Casual address
  /^[😭😂🤣💀👍👌🔥❤️]+$/,        // Emoji-only
  /^(?:haha|lol|lmao|rofl)/i,     // Laughter
  /^\d+\s*(?:k|K)?$/,             // Just numbers
  /^(?:yes|no|yeah|nope|yep|nah)$/i, // Simple yes/no
];

// V2 FIX: Patterns that should NEVER be decisions
const DECISION_BLOCKLIST = [
  /\?+$/,                        // Ends with question mark
  /\?\s*$/,                      // Ends with ? and space
  /still.*\?/i,                  // "still alive?"
  /alive|dead|kill/i,            // Joke patterns about being alive/dead
  /whatever|anything\s+goes/i,   // Vague statements
  /lol|haha|hehe|😂|🤣|💀/i,     // Humor indicators
  /if.*budget|budget.*if/i,      // Conditional on budget
  /^just\s+/i,                   // "Just eat whatever" - casual
  /idk|i\s+don't\s+know/i,       // Uncertainty
  /maybe|perhaps|possibly/i,     // Uncertain statements
  /meme|gif|image|sticker/i,     // Media references
];

// Check if text has a decision keyword
function hasDecisionKeyword(text: string): boolean {
  return DECISION_KEYWORDS.some(p => p.test(text));
}

// Check if text is a reaction (not a decision)
function isReaction(text: string): boolean {
  return REACTION_PATTERNS.some(p => p.test(text.trim()));
}

// V3.2 FIX: Patterns that are REQUESTS/TASKS not decisions
const REQUEST_PATTERNS = [
  /\b(check|wait|finalize|guys|please|pls)\b.*\b(first|by|tonight|tomorrow)\b/i,  // "Check reviews first", "Finalize by tonight"
  /\bwait\s+wait\b/i,  // "Wait wait..."
  /\b(can|could|should)\s+(you|we|someone)\b/i,  // "Can you...", "Should we..."
  /\bplease\b/i,  // Requests often have "please"
  /\b(guys|boss|bro|dude)\s+(finalize|check|book|confirm)/i,  // "Guys finalize..."
];

// Check if text is a valid decision (not a question or joke)
function isValidDecision(text: string): boolean {
  // V3: Must not be a reaction
  if (isReaction(text)) return false;

  // Must not match any blocklist pattern
  if (DECISION_BLOCKLIST.some(p => p.test(text))) return false;

  // Must be longer than just a few words
  if (text.split(/\s+/).length < 2) return false;

  // V3.2 FIX: Must NOT be a request/task pattern
  if (REQUEST_PATTERNS.some(p => p.test(text))) return false;

  // V3.2 FIX: Must have a decision keyword for pattern-based decisions too
  if (!hasDecisionKeyword(text)) return false;

  return true;
}

// Decision patterns - Look for consensus signals
const DECISION_PATTERNS = [
  // "Let's go with X" or "Let's do X"
  /\blet's\s+(?:go with|do|take|book|use|stay at|travel by)\s+(.+?)(?:[.!?\n]|$)/gi,
  // "Final: X" or "Confirmed: X"
  /\b(?:final|confirmed|decided|agreed|done|pakka)[:\s]+(.+?)(?:[.!?\n]|$)/gi,
  // "We'll X" or "We will X"
  /\bwe(?:'ll| will| should| are going to)\s+(.+?)(?:[.!?\n]|$)/gi,
  // Imperative with "it" - "Book it", "Do it"
  /\b(book|take|use|go with)\s+(?:it|this one|that one)\s*[!]*/gi,
];

// Agreement signals for consensus detection
const AGREEMENT_SIGNALS = [
  // English
  'yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 'fine', 'done', 'agreed',
  'sounds good', 'works for me', 'works', 'perfect', 'great', 'cool', 'nice',
  'good idea', 'i agree', 'same', 'me too', '+1', 'lets go', "let's do it",
  // Hindi/Kannada
  'haan', 'ha', 'theek', 'sahi', 'pakka', 'chalega', 'chalo', 'done deal',
  'aaytu', 'sari', 'olledu', 'madi', 'book madi',
  // Emoji signals
  '👍', '✅', '👌', '💯', '🔥', '✔️', '🙌',
];

// Question patterns - better filtering
const QUESTION_PATTERNS = [
  // Direct questions about decisions
  /([^.!?\n]*(?:budget|date|when|where|how much|which|should we|shall we|do we)[^.!?\n]*\?)/gi,
  // Options questions
  /([^.!?\n]*(?:or|vs|versus|better)[^.!?\n]*\?)/gi,
  // Generic questions (with minimum length)
  /([^.!?\n]{20,}\?)/g,
];

// Rhetorical/non-actionable patterns to exclude
const RHETORICAL_PATTERNS = [
  /^(what|how|why|huh|really|seriously|lol|haha|omg)\?*$/i,
  /^[^a-z]*$/i, // Only symbols/emojis
  /sent a (meme|gif|image|sticker)/i,
  /^\?+$/, // Just question marks
];

// V2 FIX: Patterns indicating conditional responses (not fully resolved)
const CONDITIONAL_RESPONSE_PATTERNS = [
  /if\s+(?:budget|time|we\s+can|possible|affordable)/i,
  /depends\s+on/i,
  /maybe/i,
  /we'll\s+see/i,
  /let's\s+see/i,
  /not\s+sure/i,
  /might/i,
  /could\s+work/i,
  /budget\s+allows/i,
  /if\s+we\s+have/i,
];

// V2 FIX: Patterns indicating fully resolved responses
const RESOLVED_RESPONSE_PATTERNS = [
  /^(?:yes|yeah|yep|done|booked|confirmed|ok|okay|sure|definitely)[\s!.]*$/i,
  /👍|✅|✔️|💯/,
  /it's\s+(?:done|booked|confirmed)/i,
  /already\s+(?:done|booked)/i,
];

// V2 FIX: Determine question status based on response
type QuestionResolution = 'open' | 'conditional' | 'resolved';

function getQuestionResolution(afterText: string): QuestionResolution {
  const trimmed = afterText.trim().substring(0, 200).toLowerCase();

  // Check for resolved first (definitive answers)
  if (RESOLVED_RESPONSE_PATTERNS.some(p => p.test(trimmed))) {
    return 'resolved';
  }

  // Check for conditional (maybes, depends on, etc.)
  if (CONDITIONAL_RESPONSE_PATTERNS.some(p => p.test(trimmed))) {
    return 'conditional';
  }

  // Check for general agreement signals (less definitive)
  if (AGREEMENT_SIGNALS.some(signal => trimmed.includes(signal.toLowerCase()))) {
    return 'resolved';
  }

  return 'open';
}

function cleanText(text: string): string {
  return text.replace(/[.!,;:]+$/, '').trim();
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function findAssigneeFromContext(text: string, messages: RawChatMessage[], matchIndex: number): string | undefined {
  // Try to find who said this by looking at message context
  const beforeText = text.slice(Math.max(0, matchIndex - 100), matchIndex);
  const senderMatch = beforeText.match(/([A-Z][a-z]+):\s*$/);
  return senderMatch ? senderMatch[1] : undefined;
}

export function extractTasksHeuristic(text: string, messages: RawChatMessage[]): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  const seenTasks = new Set<string>();

  for (const { pattern, status } of TASK_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      let assignee: string | undefined;
      let taskDesc: string;
      let deadline: string | undefined;

      if (match.length >= 3 && match[2]) {
        const firstCapture = match[1].toLowerCase();

        // Check if first capture is a person name
        if (/^[a-z]+$/.test(firstCapture) &&
            !['i\'ll', 'i will', 'i can', 'let me', 'gonna', 'main', 'mein', 'mai'].includes(firstCapture)) {
          assignee = capitalize(match[1]);
          taskDesc = match[2];
        } else if (['main', 'mein', 'mai'].includes(firstCapture)) {
          // Hindi "main" = "I"
          assignee = findAssigneeFromContext(text, messages, match.index);
          taskDesc = match[2];
        } else {
          assignee = findAssigneeFromContext(text, messages, match.index);
          taskDesc = match[2];
        }

        // Check for deadline in second capture
        if (/tonight|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|dec|jan/i.test(match[2])) {
          deadline = match[2];
          // Look for task in first capture
          taskDesc = match[1];
        }
      } else {
        taskDesc = match[1] || match[0];
      }

      // Clean up task description
      taskDesc = cleanText(taskDesc);

      // Skip done status indicators as task descriptions
      if (['done', 'booked', 'confirmed', 'completed', 'aaytu', 'sorted'].includes(taskDesc.toLowerCase())) {
        continue;
      }

      // V2 FIX: Skip non-task patterns (budget responses, etc.)
      if (isNonTask(taskDesc)) continue;

      // V2 FIX: Require task verb for longer descriptions
      if (taskDesc.length > 10 && !hasTaskVerb(taskDesc)) continue;

      // V3.2 FIX: Reject invalid single-word tasks that can never be tasks
      const firstWord = taskDesc.split(/\s+/)[0].toLowerCase();
      if (INVALID_SINGLE_WORD_TASKS.has(firstWord) && taskDesc.split(/\s+/).length === 1) {
        continue;
      }

      // V3 FIX: Minimum 2-word tasks (verb + object)
      const wordCount = taskDesc.split(/\s+/).filter(w => w.length > 1).length;
      if (wordCount < 2) {
        // V3.2: Check if single word is invalid task
        if (INVALID_SINGLE_WORD_TASKS.has(taskDesc.toLowerCase())) {
          continue;
        }

        // Try context stitching - look for object in previous messages
        const msgIdx = messages.findIndex(m => m.content.includes(match[0]));
        if (msgIdx > 0) {
          const taskObject = findTaskObject(messages, msgIdx);
          if (taskObject) {
            taskDesc = `${taskDesc} ${taskObject}`;
          } else {
            continue; // Skip single-word tasks without context
          }
        } else {
          continue; // Skip single-word tasks
        }
      }

      // Skip if too short or already seen
      if (taskDesc.length < 4 || seenTasks.has(taskDesc.toLowerCase())) continue;
      seenTasks.add(taskDesc.toLowerCase());

      // V3.3 FIX: If status is 'done' but no assignee, try to attribute
      let finalAssignee = assignee;
      if (status === 'done' && !finalAssignee) {
        const msgIdx = messages.findIndex(m => m.content.includes(match[0]));
        if (msgIdx >= 0) {
          finalAssignee = attributeTaskAssignee(messages, msgIdx);
        }
      }

      // V3.3 FIX: Extract relative due date if not already set
      const finalDeadline = deadline || extractDue(taskDesc) || extractDue(match[0]);

      tasks.push({
        task: capitalize(taskDesc),
        assignee: finalAssignee,
        deadline: finalDeadline,
        status,
        source: 'heuristic',
      });
    }
  }

  // Also look for tasks from message context
  for (const msg of messages) {
    if (msg.isMedia || !msg.sender) continue;

    const content = msg.content.toLowerCase();

    // "I'll do X" patterns from specific senders
    const willMatch = content.match(/\b(?:i'll|i will|let me|i can)\s+(.+?)(?:[.!?\n]|$)/i);
    if (willMatch) {
      const taskDesc = cleanText(willMatch[1]);
      // V2 FIX: Apply same validation to message-based tasks
      if (taskDesc.length >= 4 &&
          !seenTasks.has(taskDesc.toLowerCase()) &&
          !isNonTask(taskDesc) &&
          (taskDesc.length <= 10 || hasTaskVerb(taskDesc))) {
        seenTasks.add(taskDesc.toLowerCase());
        // V3.3 FIX: Also extract due date from message content
        const deadline = extractDue(taskDesc) || extractDue(msg.content);
        tasks.push({
          task: capitalize(taskDesc),
          assignee: msg.sender,
          deadline,
          status: 'pending',
          source: 'heuristic',
        });
      }
    }
  }

  return tasks.slice(0, 10);
}

export function extractDecisionsHeuristic(text: string): ExtractedDecision[] {
  const decisions: ExtractedDecision[] = [];
  const seenDecisions = new Set<string>();

  for (const pattern of DECISION_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      const decision = cleanText(match[1] || match[0]);

      if (decision.length < 4 || seenDecisions.has(decision.toLowerCase())) continue;

      // V2 FIX: Validate decision is not a question/joke
      if (!isValidDecision(decision)) continue;

      seenDecisions.add(decision.toLowerCase());

      decisions.push({
        decision: capitalize(decision),
        confidence: 65,
        source: 'heuristic',
      });
    }
  }

  return decisions.slice(0, 8);
}

// V3.2 FIX: Topic detection for implicit open questions
const IMPLICIT_QUESTION_TOPICS = [
  { topic: 'Dates?', patterns: [/\d{1,2}[-–]\d{1,2}/g, /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec\s+\d{1,2}/gi], conflictCheck: true },
  { topic: 'Travel mode?', patterns: [/train|bus|flight/gi], conflictCheck: true },
  { topic: 'Water sports?', patterns: [/water\s*sports?|scuba|parasail|snorkel|jet\s*ski/gi], conflictCheck: false },
  { topic: 'Accommodation?', patterns: [/hotel|hostel|resort|airbnb|oyo/gi], conflictCheck: true },
];

// V3.2: Check if topic has conflicting proposals (different values mentioned)
function hasConflictingProposals(text: string, patterns: RegExp[]): boolean {
  const matches = new Set<string>();
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.add(match[0].toLowerCase());
    }
  }
  return matches.size > 1; // Multiple different values = open question
}

// V3.2: Extract implicit open questions from conflicting proposals
function extractImplicitQuestions(text: string): OpenQuestion[] {
  const implicitQuestions: OpenQuestion[] = [];

  for (const { topic, patterns, conflictCheck } of IMPLICIT_QUESTION_TOPICS) {
    // Check if topic is mentioned in text
    const isMentioned = patterns.some(p => new RegExp(p.source, p.flags).test(text));
    if (!isMentioned) continue;

    // If conflict check is needed, verify there are conflicting proposals
    if (conflictCheck) {
      if (hasConflictingProposals(text, patterns)) {
        implicitQuestions.push({
          question: topic,
          status: 'open',
        });
      }
    } else {
      // For non-conflict topics (like water sports), check if it's mentioned but not confirmed
      const conditionalPatterns = /if\s+budget|depends|maybe|might|could/i;
      if (conditionalPatterns.test(text)) {
        implicitQuestions.push({
          question: topic,
          status: 'conditional',
        });
      }
    }
  }

  return implicitQuestions;
}

export function extractQuestionsHeuristic(text: string): OpenQuestion[] {
  const questions: OpenQuestion[] = [];
  const seenQuestions = new Set<string>();

  // V3.2: First extract explicit questions (with ?)
  for (const pattern of QUESTION_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      const question = match[1].trim();

      // Check if rhetorical or non-actionable
      if (RHETORICAL_PATTERNS.some(p => p.test(question))) continue;

      // Filter out very short questions
      if (question.length < 10 || seenQuestions.has(question.toLowerCase())) continue;

      seenQuestions.add(question.toLowerCase());

      // V2 FIX: Check resolution status using 3-state model
      const afterText = text.slice(match.index + question.length, match.index + question.length + 300);
      const resolution = getQuestionResolution(afterText);

      // Only include questions that are still open or conditional
      if (resolution === 'resolved') continue;

      // V2 FIX: Add status to indicate if conditional
      questions.push({
        question,
        status: resolution, // 'open' or 'conditional'
      });
    }
  }

  // V3.2: Add implicit questions from conflicting proposals
  const implicitQuestions = extractImplicitQuestions(text);
  for (const iq of implicitQuestions) {
    if (!seenQuestions.has(iq.question.toLowerCase())) {
      seenQuestions.add(iq.question.toLowerCase());
      questions.push(iq);
    }
  }

  return questions.slice(0, 8);  // V3.2: Allow more questions
}

// V3.3 FIX: Normalize voter strings like "ArjunRiyaKiran" -> ["Arjun", "Riya", "Kiran"]
function normalizeVoters(raw: string): string[] {
  // Try common separators first: comma, pipe, slash, space
  if (/[,\|\/ ]/.test(raw)) {
    return Array.from(new Set(raw.split(/[,\|\/ ]+/).map(s => s.trim()).filter(Boolean)));
  }
  // Fallback: CamelCase boundary split (ArjunRiyaKiran -> Arjun, Riya, Kiran)
  const parts = raw.match(/[A-Z][a-z]+/g) || [];
  return Array.from(new Set(parts.map(p => p.trim())));
}

// V3.3 FIX: Compute decision confidence based on distinct voters and agreement strength
function computeDecisionConfidence(voters: Set<string>, agreements: string[]): { confidence: number; confirmed: boolean; distinct: number } {
  const distinct = voters.size;
  // Quick scoring: direct confirmations + emoji = 2, implicit = 1
  const score = agreements.reduce((s, a) => s + (/(yes|works|fine|book it|confirmed|👍|✅|ok|done|pakka)/i.test(a) ? 2 : 1), 0);
  const confidence = Math.min(95, 50 + (distinct * 10) + (score * 3));
  const confirmed = distinct >= 2 && score >= 2;
  return { confidence, confirmed, distinct };
}

// V3.3 FIX: Patterns that indicate someone is taking ownership of a task
const OWNERSHIP_PATTERNS = [
  /\d+(\.\d+)?\s*stars?/i,           // "4.1 stars" - reviewing something
  /\bbook(?: it| then| this)?\b/i,   // "book it", "ok book"
  /\bi'?ll\s+(?:do|handle|check)/i,  // "I'll do it", "I'll handle it"
  /\bi\s+(?:found|checked|booked)/i, // "I found", "I checked"
  /\b(?:checking|looking|searching)\b/i, // "checking reviews"
  /\blet me\b/i,                     // "let me check"
  /\brating|review/i,                // "rating is good"
  /\bi'?m\s+on\s+it/i,               // "I'm on it"
];

// V3.3 FIX: Attribute task assignee by looking back for ownership signals
function attributeTaskAssignee(messages: RawChatMessage[], taskIdx: number, lookback: number = 3): string | undefined {
  for (let i = taskIdx - 1; i >= Math.max(0, taskIdx - lookback); i--) {
    const m = messages[i];
    if (!m.isMedia && m.sender) {
      // Check if message matches any ownership pattern
      if (OWNERSHIP_PATTERNS.some(p => p.test(m.content))) {
        return m.sender;
      }
    }
  }
  return undefined;
}

// New: Extract consensus-based decisions
export function extractConsensusDecisions(messages: RawChatMessage[]): ExtractedDecision[] {
  const decisions: ExtractedDecision[] = [];
  const statementVotes = new Map<string, {
    voters: Set<string>;
    statement: string;
    originalSender: string;
    agreements: string[];  // V3.3: Track agreement messages for confidence
  }>();

  // Track statements and who agreed
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.isMedia || !msg.content) continue;

    const content = msg.content.toLowerCase().trim();

    // Check if this is an agreement signal
    const isAgreement = AGREEMENT_SIGNALS.some(signal =>
      content === signal.toLowerCase() ||
      content.startsWith(signal.toLowerCase() + ' ') ||
      content.endsWith(' ' + signal.toLowerCase())
    );

    if (isAgreement && i > 0 && msg.sender) {
      // Look at the previous non-agreement message as the statement
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        const prevMsg = messages[j];
        if (!prevMsg.isMedia && prevMsg.content.length > 10) {
          const prevContent = prevMsg.content.toLowerCase();
          // Skip if previous message is also just an agreement
          if (AGREEMENT_SIGNALS.some(s => prevContent === s.toLowerCase())) continue;

          // V2 FIX: Validate the statement is not a question or joke
          if (!isValidDecision(prevMsg.content)) continue;

          // V3 FIX: For consensus decisions, require a decision keyword or action verb
          if (!hasDecisionKeyword(prevMsg.content) && !hasTaskVerb(prevMsg.content)) continue;

          const key = prevContent.substring(0, 50);
          const originalSender = prevMsg.sender || 'unknown';

          if (!statementVotes.has(key)) {
            statementVotes.set(key, {
              voters: new Set([originalSender]),
              statement: prevMsg.content,
              originalSender,
              agreements: [],  // V3.3
            });
          }

          // V2 FIX: Only count if voter is DIFFERENT from original sender
          if (msg.sender !== originalSender) {
            statementVotes.get(key)!.voters.add(msg.sender);
            statementVotes.get(key)!.agreements.push(msg.content);  // V3.3: Track agreement
          }
          break;
        }
      }
    }
  }

  // Convert statements with 2+ DIFFERENT voters to decisions
  for (const [_, data] of statementVotes) {
    // V3.3 FIX: Use new confidence calculation
    const { confidence, confirmed, distinct } = computeDecisionConfidence(data.voters, data.agreements);

    // Only include if confirmed (2+ distinct voters with sufficient agreement)
    if (confirmed) {
      const statement = cleanText(data.statement);
      if (statement.length > 5 && isValidDecision(statement)) {
        // V3.3 FIX: Normalize voters to proper comma-separated list
        const voterList = Array.from(data.voters);
        decisions.push({
          decision: capitalize(statement),
          madeBy: voterList.join(', '),  // Proper comma separation
          participants: voterList,  // V3.3: Also provide as array
          confidence,
          source: 'heuristic',
        });
      }
    }
  }

  return decisions.slice(0, 5);
}
