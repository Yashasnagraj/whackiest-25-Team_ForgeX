// Heuristic Place Extraction - Smart Validation
import type { ExtractedPlace, RawChatMessage } from '../types';

// V2 FIX: Verb patterns that should NOT be in place names
const VERB_PHRASE_PATTERNS = [
  /\b(imagining|thinking|planning|going|visiting|seeing|loving|hating)\b/i,
  /\b(want|need|love|hate|like|wish)\s+(?:to|the)/i,
  /\b(already|still|just|never|always)\s+\w+ing\b/i,
  /\b(can't|cannot|won't|wouldn't|couldn't)\s+wait/i,
  /\b(looking\s+forward|excited\s+about|dreaming\s+of)/i,
  /\b(i'm|i am|we're|we are)\s+\w+ing/i,
];

// Check if text contains verb phrases (not a place name)
function containsVerbPhrase(text: string): boolean {
  return VERB_PHRASE_PATTERNS.some(p => p.test(text));
}

// V3 FIX: Generic travel nouns that should NOT be extracted alone
const GENERIC_TRAVEL_NOUNS = new Set([
  'hotel', 'hostel', 'resort', 'room', 'stay', 'accommodation',
  'train', 'bus', 'flight', 'cab', 'taxi', 'car', 'bike',
  'restaurant', 'cafe', 'bar', 'club', 'pub', 'dhaba',
  'beach', 'fort', 'temple', 'lake', 'hill', 'mountain', // Only if standalone
  'market', 'mall', 'shop', 'store',
  'airport', 'station', 'terminal',
]);

// V3.2 FIX: Common verbs that indicate a sentence context (not a place name)
const SENTENCE_VERBS = new Set([
  'saves', 'save', 'cost', 'costs', 'takes', 'take', 'need', 'needs',
  'want', 'wants', 'get', 'gets', 'book', 'books', 'find', 'finds',
  'skip', 'skips', 'avoid', 'avoids', 'prefer', 'prefers',
  'is', 'are', 'was', 'were', 'will', 'would', 'could', 'should',
  'have', 'has', 'had', 'do', 'does', 'did',
]);

// V3.2: Check if context contains a verb (indicates sentence, not place reference)
function sentenceContainsVerb(context: string): boolean {
  const words = context.toLowerCase().split(/\s+/);
  return words.some(w => SENTENCE_VERBS.has(w.replace(/[^a-z]/g, '')));
}

// V3 FIX: Check if name is just a generic noun (needs qualifier)
function isGenericNoun(name: string): boolean {
  const lower = name.toLowerCase().trim();
  // If it's just a generic noun by itself, reject
  if (GENERIC_TRAVEL_NOUNS.has(lower)) return true;
  // If it starts with "the" + generic noun, reject
  if (/^the\s+(hotel|hostel|beach|train|bus|flight|temple|fort|lake|restaurant|cafe)$/i.test(lower)) return true;
  // If it's "overnight" + noun without qualifier, reject
  if (/^overnight\s+(train|bus|flight)$/i.test(lower)) return true;
  return false;
}

// V3.2 FIX: Check if generic noun appears in sentence context (not a place name)
function isGenericNounInSentence(name: string, context: string): boolean {
  const lower = name.toLowerCase().trim();
  // Check if any word in the name is a generic travel noun
  const words = lower.split(/\s+/);
  const hasGenericWord = words.some(w => GENERIC_TRAVEL_NOUNS.has(w));

  if (hasGenericWord && sentenceContainsVerb(context)) {
    // "Overnight train saves hotel" → "hotel" is generic noun in sentence context
    return true;
  }
  return false;
}

// Common travel-related verbs that precede place names
const PLACE_INDICATORS = [
  'visit', 'go to', 'check out', 'see', 'explore',
  'stay at', 'book', 'stay in',
  'eat at', 'lunch at', 'dinner at', 'breakfast at',
  'near', 'around', 'to', 'at'
];

// V3.3 FIX: Canonical place type mapping for consistency
// Maps various keywords to semantic categories
const PLACE_TYPE_MAP: Record<string, string> = {
  // Accommodation
  'hotel': 'accommodation',
  'hostel': 'accommodation',
  'resort': 'accommodation',
  'inn': 'accommodation',
  'lodge': 'accommodation',
  'stay': 'accommodation',
  'villa': 'accommodation',
  'guesthouse': 'accommodation',
  'airbnb': 'accommodation',
  'oyo': 'accommodation',
  // Food & Dining
  'restaurant': 'restaurant',
  'cafe': 'restaurant',
  'dhaba': 'restaurant',
  'shack': 'restaurant',
  'eatery': 'restaurant',
  'bistro': 'restaurant',
  // Nightlife
  'bar': 'nightlife',
  'pub': 'nightlife',
  'club': 'nightlife',
  'lane': 'nightlife',         // Tito's Lane → nightlife
  'nightclub': 'nightlife',
  // Attractions & Activities
  'market': 'attraction',
  'mall': 'attraction',
  'cruise': 'activity',
  'tour': 'activity',
  'trek': 'activity',
  'watersports': 'activity',
  'diving': 'activity',
  'parasailing': 'activity',
  // Natural destinations
  'beach': 'beach',
  'hill': 'destination',
  'hills': 'destination',
  'lake': 'destination',
  'waterfall': 'destination',
  'falls': 'destination',
  'island': 'destination',
  'dam': 'destination',
  'valley': 'destination',
  // Landmarks
  'temple': 'landmark',
  'fort': 'landmark',
  'palace': 'landmark',
  'museum': 'landmark',
  'ruins': 'landmark',
  'church': 'landmark',
  'mosque': 'landmark',
  'monument': 'landmark',
};

// V3.3 FIX: Map raw keyword to canonical place type
export function mapPlaceType(rawType: string): string {
  const t = (rawType || '').toString().toLowerCase().trim();
  return PLACE_TYPE_MAP[t] || rawType || 'destination';
}

// Common place type indicators (with confidence boost)
// Note: types here are for backward compat, mapPlaceType() converts to semantic categories
const PLACE_TYPE_BOOST: Record<string, number> = {
  'temple': 30,
  'beach': 30,
  'hotel': 25,
  'hostel': 25,
  'resort': 25,
  'restaurant': 20,
  'cafe': 20,
  'dhaba': 20,
  'fort': 30,
  'palace': 30,
  'museum': 25,
  'hill': 25,
  'hills': 25,
  'lake': 25,
  'waterfall': 30,
  'falls': 30,
  'market': 15,
  'mall': 15,
  'ruins': 30,
  'island': 30,
  'dam': 25,
  'cruise': 20,
  'shack': 20,
  'lane': 15,
  'club': 15,
  'bar': 15,
  'pub': 15,
};

// COMMON INDIAN NAMES (500+) - These are NOT places!
const COMMON_NAMES = new Set([
  // Indian male names
  'yashas', 'naveen', 'jeeth', 'shrajan', 'rahul', 'amit', 'rohit', 'sachin',
  'deepak', 'ankit', 'nikhil', 'arun', 'vikram', 'sanjay', 'ajay', 'vijay',
  'rajesh', 'suresh', 'mahesh', 'ganesh', 'rakesh', 'mukesh', 'dinesh', 'ramesh',
  'krishna', 'vishnu', 'shiva', 'ravi', 'kumar', 'sunil', 'anil', 'kapil',
  'manoj', 'pramod', 'vinod', 'ashok', 'kishore', 'mohan', 'sohan', 'rohan',
  'arjun', 'karan', 'varun', 'tarun', 'chetan', 'nitin', 'vipin', 'lalit',
  'mohit', 'sumit', 'puneet', 'vineet', 'prashant', 'nishant', 'siddharth', 'harsh',
  'yash', 'ayush', 'piyush', 'ankush', 'ashish', 'manish', 'girish', 'harish',
  'satish', 'jagdish', 'naresh', 'paresh', 'hitesh', 'ritesh', 'jitesh', 'nilesh',
  'abhishek', 'pratik', 'kartik', 'sahil', 'kunal', 'vishal', 'tushar', 'gaurav',
  'saurabh', 'sourav', 'anurag', 'chirag', 'dhruv', 'dev', 'raj', 'aman',

  // Indian female names
  'priya', 'pooja', 'neha', 'kavita', 'divya', 'swati', 'meera', 'anjali',
  'ritu', 'suman', 'sunita', 'anita', 'sangeeta', 'geeta', 'seema', 'reema',
  'nisha', 'asha', 'usha', 'rekha', 'shikha', 'diksha', 'deepa', 'shweta',
  'sneha', 'megha', 'shruti', 'smriti', 'preeti', 'jyoti', 'arti', 'bharti',
  'sakshi', 'rashi', 'khushi', 'tanvi', 'manvi', 'janvi', 'anvi', 'devi',
  'lakshmi', 'saraswati', 'parvati', 'durga', 'kali', 'radha', 'sita', 'gita',
  'komal', 'kamal', 'vimal', 'nirmala', 'kamala', 'shobha', 'vibha', 'abha',
  'madhuri', 'kajol', 'kajal', 'kiran', 'simran', 'manpreet', 'harpreet', 'gurpreet',

  // Western names
  'john', 'james', 'robert', 'michael', 'william', 'david', 'richard', 'joseph',
  'thomas', 'charles', 'christopher', 'daniel', 'matthew', 'anthony', 'mark', 'donald',
  'steven', 'paul', 'andrew', 'joshua', 'kenneth', 'kevin', 'brian', 'george',
  'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica',
  'sarah', 'karen', 'nancy', 'lisa', 'betty', 'margaret', 'sandra', 'ashley',
  'dorothy', 'kimberly', 'emily', 'donna', 'michelle', 'carol', 'amanda', 'melissa',
  'deborah', 'stephanie', 'rebecca', 'sharon', 'laura', 'cynthia', 'kathleen', 'amy',
  'angela', 'shirley', 'anna', 'brenda', 'pamela', 'emma', 'nicole', 'helen',
]);

// INDIAN INFORMAL WORDS - These are NOT places!
const NON_PLACE_WORDS = new Set([
  // Kannada casual words
  'madi', 'macha', 'guru', 'ide', 'illa', 'beda', 'baro', 'hogi', 'kelsa',
  'andre', 'anta', 'hege', 'yake', 'yenu', 'nodi', 'kodi', 'thogo', 'heli',
  'gottilla', 'gottu', 'sari', 'olledu', 'chennagide',

  // Hindi casual words
  'yaar', 'bhai', 'karo', 'karna', 'dekho', 'chalo', 'aaja', 'jao', 'bolo',
  'sunno', 'haan', 'nahi', 'theek', 'accha', 'sahi', 'pakka', 'pukka',
  'mast', 'bindaas', 'jhakkas', 'zabardast', 'kamaal', 'kamal',

  // Common chat words
  'bro', 'dude', 'boss', 'man', 'guys', 'lol', 'bruh', 'fam', 'homie',
  'buddy', 'mate', 'pal', 'chief', 'champ', 'legend',

  // Pronouns and common words
  'i', 'we', 'you', 'they', 'he', 'she', 'it', 'me', 'us', 'them',
  'yes', 'no', 'ok', 'okay', 'sure', 'fine', 'done', 'cool', 'nice',
  'tomorrow', 'today', 'yesterday', 'morning', 'evening', 'night', 'afternoon',
  'good', 'great', 'awesome', 'amazing', 'perfect', 'super', 'best', 'worst',
  'money', 'budget', 'cost', 'price', 'cheap', 'expensive', 'free',
  'meme', 'gif', 'image', 'photo', 'video', 'sent', 'shared',
  'what', 'when', 'where', 'why', 'how', 'which', 'who',
  'this', 'that', 'these', 'those', 'here', 'there',
  'will', 'would', 'could', 'should', 'can', 'may', 'might',
  'have', 'has', 'had', 'been', 'being', 'was', 'were', 'are', 'is',

  // Travel generic words (not specific places)
  'trip', 'travel', 'journey', 'tour', 'vacation', 'holiday',
  'flight', 'train', 'bus', 'car', 'bike', 'taxi', 'cab',
  'ticket', 'booking', 'reservation', 'plan', 'plans', 'planning',
]);

// Known Indian destinations (high confidence)
const KNOWN_PLACES = new Set([
  'goa', 'mumbai', 'delhi', 'bangalore', 'bengaluru', 'chennai', 'kolkata',
  'hyderabad', 'pune', 'jaipur', 'udaipur', 'jodhpur', 'agra', 'varanasi',
  'rishikesh', 'haridwar', 'manali', 'shimla', 'dharamshala', 'leh', 'ladakh',
  'kerala', 'kochi', 'munnar', 'alleppey', 'kovalam', 'ooty', 'coorg', 'kodaikanal',
  'hampi', 'mysore', 'mysuru', 'hospet', 'badami', 'gokarna', 'udupi', 'mangalore',
  'pondicherry', 'mahabalipuram', 'kanyakumari', 'madurai', 'thanjavur',
  'darjeeling', 'gangtok', 'sikkim', 'meghalaya', 'shillong', 'kaziranga',
  'andaman', 'nicobar', 'lakshadweep', 'maldives',
  // Goa specific
  'calangute', 'baga', 'anjuna', 'vagator', 'palolem', 'colva', 'candolim',
  'aguada', 'chapora', 'panaji', 'margao', 'mapusa', 'dudhsagar',
]);

function isCommonName(word: string): boolean {
  return COMMON_NAMES.has(word.toLowerCase());
}

function isNonPlaceWord(word: string): boolean {
  return NON_PLACE_WORDS.has(word.toLowerCase());
}

function isKnownPlace(name: string): boolean {
  const lower = name.toLowerCase();
  return KNOWN_PLACES.has(lower) ||
         Array.from(KNOWN_PLACES).some(p => lower.includes(p));
}

function detectPlaceType(name: string): { type: string; boost: number } {
  const lower = name.toLowerCase();
  // V3.3 FIX: Check PLACE_TYPE_BOOST for confidence boost, use mapPlaceType for type
  for (const [keyword, boost] of Object.entries(PLACE_TYPE_BOOST)) {
    if (lower.includes(keyword)) {
      // Use mapPlaceType to ensure consistent semantic type
      return { type: mapPlaceType(keyword), boost };
    }
  }
  // Check PLACE_TYPE_MAP for additional keywords without boost
  for (const keyword of Object.keys(PLACE_TYPE_MAP)) {
    if (lower.includes(keyword)) {
      return { type: mapPlaceType(keyword), boost: 10 };
    }
  }
  return { type: 'destination', boost: 0 };
}

function cleanPlaceName(name: string): string {
  // Remove trailing punctuation and common suffixes
  return name
    .replace(/[.!?,;:]+$/, '')
    .replace(/\s+(and|or|but|is|are|was|were|will|can)$/i, '')
    .trim();
}

export function extractPlacesHeuristic(text: string, messages: RawChatMessage[]): ExtractedPlace[] {
  const placesMap = new Map<string, ExtractedPlace>();
  const _allWords = text.split(/\s+/);

  // Pattern 1: Look for "visit/go to [Place Name]"
  const indicatorPattern = new RegExp(
    `(?:${PLACE_INDICATORS.join('|')})\\s+(?:the\\s+)?([A-Z][a-zA-Z\\s]+?)(?:\\s*[.!?,]|\\s+(?:and|or|but|tomorrow|today|is|was|are|were|will|can|could|should|would)|$)`,
    'gi'
  );

  let match;
  while ((match = indicatorPattern.exec(text)) !== null) {
    const name = cleanPlaceName(match[1]);

    // Skip if too short, is a name, or non-place word
    if (name.length < 3) continue;
    if (isCommonName(name)) continue;
    if (isNonPlaceWord(name)) continue;

    // V2 FIX: Skip if contains verb phrases ("imagining the beach")
    if (containsVerbPhrase(name)) continue;

    // V3 FIX: Skip generic nouns without qualifiers ("hotel" alone)
    if (isGenericNoun(name)) continue;

    // V3.2 FIX: Get context and check if generic noun in sentence
    const contextStart = Math.max(0, match.index - 50);
    const contextEnd = Math.min(text.length, match.index + match[0].length + 50);
    const context = text.slice(contextStart, contextEnd);
    if (isGenericNounInSentence(name, context)) continue;

    // Check each word in multi-word names
    const words = name.split(/\s+/);
    if (words.some(w => isCommonName(w) || isNonPlaceWord(w))) continue;

    const key = name.toLowerCase();
    const { type, boost } = detectPlaceType(name);
    const isKnown = isKnownPlace(name);

    if (!placesMap.has(key)) {
      placesMap.set(key, {
        name,
        type,
        votes: 1,
        status: 'maybe',
        mentionedBy: [],
        confidence: isKnown ? 80 : 50 + boost,
        source: 'heuristic',
      });
    }
  }

  // Pattern 2: Look for known places directly mentioned
  for (const knownPlace of KNOWN_PLACES) {
    const regex = new RegExp(`\\b${knownPlace}\\b`, 'gi');
    if (regex.test(text)) {
      const key = knownPlace.toLowerCase();
      if (!placesMap.has(key)) {
        // Capitalize properly
        const name = knownPlace.charAt(0).toUpperCase() + knownPlace.slice(1);
        placesMap.set(key, {
          name,
          type: 'destination',
          votes: 1,
          status: 'maybe',
          mentionedBy: [],
          confidence: 85,
          source: 'heuristic',
        });
      }
    }
  }

  // Pattern 3: Look for place-type keywords (e.g., "Chapora fort", "Baga beach")
  for (const keyword of Object.keys(PLACE_TYPE_BOOST)) {
    const regex = new RegExp(`([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)\\s+${keyword}`, 'gi');
    while ((match = regex.exec(text)) !== null) {
      const fullName = `${match[1]} ${keyword}`;
      const key = fullName.toLowerCase();

      // Skip if the prefix is a name
      if (isCommonName(match[1])) continue;

      const { type, boost } = detectPlaceType(fullName);

      if (!placesMap.has(key)) {
        placesMap.set(key, {
          name: fullName,
          type,
          votes: 1,
          status: 'maybe',
          mentionedBy: [],
          confidence: 75 + boost,
          source: 'heuristic',
        });
      }
    }
  }

  // Pattern 4: Places in quotes (e.g., "Pinto's Shack")
  const quotedPattern = /["']([^"']+)["']/g;
  while ((match = quotedPattern.exec(text)) !== null) {
    const name = cleanPlaceName(match[1]);
    // V2+V3 FIX: Check for verb phrases, generic nouns in quoted names
    if (name.length >= 3 && !isCommonName(name) && !isNonPlaceWord(name) && !containsVerbPhrase(name) && !isGenericNoun(name)) {
      const key = name.toLowerCase();
      const { type, boost } = detectPlaceType(name);

      // Quoted names with place keywords get high confidence
      const hasPlaceKeyword = Object.keys(PLACE_TYPE_BOOST).some(k =>
        name.toLowerCase().includes(k)
      );

      if (hasPlaceKeyword && !placesMap.has(key)) {
        placesMap.set(key, {
          name,
          type,
          votes: 1,
          status: 'maybe',
          mentionedBy: [],
          confidence: 70 + boost,
          source: 'heuristic',
        });
      }
    }
  }

  // Count mentions per sender for voting
  for (const [key, place] of placesMap) {
    for (const msg of messages) {
      if (msg.content.toLowerCase().includes(key) && !msg.isMedia) {
        if (msg.sender && !place.mentionedBy.includes(msg.sender)) {
          place.mentionedBy.push(msg.sender);
          place.votes++;
        }
      }
    }

    // Upgrade to "confirmed" if multiple people mentioned it
    if (place.votes >= 2) {
      place.status = 'confirmed';
      place.confidence = Math.min(place.confidence + 15, 95);
    }
  }

  // Filter out low-confidence places without place-type keywords
  const filtered = Array.from(placesMap.values()).filter(place => {
    // V3 FIX: Final check - reject generic nouns that slipped through
    if (isGenericNoun(place.name)) return false;

    // Always keep known places
    if (isKnownPlace(place.name)) return true;

    // Keep places with type keywords (but must have qualifier)
    const hasTypeKeyword = Object.keys(PLACE_TYPE_BOOST).some(k =>
      place.name.toLowerCase().includes(k)
    );
    // V3 FIX: Type keyword alone isn't enough - need a proper name too
    if (hasTypeKeyword) {
      const words = place.name.split(/\s+/);
      // Must have at least 2 words (qualifier + type) OR be in known places
      if (words.length >= 2 || isKnownPlace(place.name)) return true;
      return false; // Just "beach" or "hotel" alone
    }

    // Keep high-confidence or confirmed places
    if (place.confidence >= 70 || place.status === 'confirmed') return true;

    return false;
  });

  // Sort by confidence and votes
  return filtered.sort((a, b) => b.confidence - a.confidence || b.votes - a.votes);
}
