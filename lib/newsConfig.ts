// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — News Engine Configuration (Serper-only Edition)
// ─────────────────────────────────────────────────────────────────────────────
// All news is fetched via Serper (Google Search API). No RSS feeds.
// The cron job at 5:00 AM UTC (midnight ET) runs these queries once per day
// and writes results to Edge Config. The /api/news route serves only from cache.
// ─────────────────────────────────────────────────────────────────────────────

export type SerperEndpoint = 'news' | 'search' | 'videos';

export interface SearchQuery {
  q: string;
  endpoint: SerperEndpoint;
  num: number;
}

// ── Search Queries ─────────────────────────────────────────────────────────────
// Designed to surface diverse, high-quality content across science, local,
// international, and oddball categories.

export const SEARCH_QUERIES: Record<string, SearchQuery> = {
  // SLOTS 3-4 — Science bonus: overflow from above or adjacent science channels
  scienceBonus: {
    q: '"PBS Nova" OR Kurzgesagt OR Veritasium OR "Closer to Truth" OR "Isaac Arthur" science new episode',
    endpoint: 'videos',
    num: 4,
  },

  // SLOTS 5-10 — Local Atlanta/Georgia: TV stations first (guaranteed fresh), then general
  atlantaTV: {
    q: 'site:wsbtv.com OR site:atlantanewsfirst.com breaking news today',
    endpoint: 'news',
    num: 6,
  },

  atlantaDeep: {
    q: 'Atlanta Georgia court law politics community housing crime local news',
    endpoint: 'news',
    num: 10,
  },

  // Mixed into local pool — national/CNN
  national: {
    q: 'site:cnn.com OR site:nbcnews.com OR site:pbsnewshour.org top news today',
    endpoint: 'news',
    num: 5,
  },

  // SLOTS 11-13 — International / deep dives: long-form, unusual, thoughtful
  international: {
    q: 'site:aeon.co OR site:nautil.us OR site:restofworld.org OR site:foreignpolicy.com OR site:theatlantic.com international depth',
    endpoint: 'search',
    num: 6,
  },

  // SLOTS 14-15 — Letterman: quirky, oddball, funny-strange
  letterman: {
    q: '"waffle house" OR "feral hog" OR alligator OR bizarre OR "claims to have" OR "police say" OR inexplicably weird funny news Georgia Florida',
    endpoint: 'news',
    num: 5,
  },
};

// ── Slot Targets ──────────────────────────────────────────────────────────────
// How many items to fill per category. Total = 15.

export const SLOT_TARGETS = {
  sciencePin:   2,   // Slots 1-2:   StarTalk + PBS Space Time (hard guarantee)
  scienceBonus: 2,   // Slots 3-4:   Extra science videos
  local:        6,   // Slots 5-10:  Atlanta/Georgia local + national
  international: 3,  // Slots 11-13: International deep dives
  letterman:    2,   // Slots 14-15: Quirky/Letterman stories
  total:        15,
};

// ── Scoring Keywords ──────────────────────────────────────────────────────────
// Applied to local/national pool to rank stories before filling slots 5-10.

export const SCORING = {
  tier1: [
    'georgia law', 'georgia legislature', 'general assembly', 'georgia supreme court',
    'georgia court of appeals', '11th circuit', 'fulton county court', 'georgia bill',
    'governor signs', 'governor kemp', 'indictment', 'settlement', 'verdict',
    'lawsuit filed', 'georgia governor', 'state senate', 'state house',
  ],
  tier2: [
    'atlanta', 'georgia', 'savannah', 'macon', 'augusta', 'fayette',
    'peachtree city', 'gwinnett', 'cobb county', 'dekalb', 'fulton',
    'albany', 'columbus', 'rome, georgia', 'athens, georgia', 'valdosta',
  ],
  tier3: [
    'wrongful death', 'premises liability', 'malpractice', 'sovereign immunity',
    'civil rights', 'fourth amendment', 'first amendment', 'due process',
    'class action', 'injunction', 'attorney general', 'habeas corpus',
    'qualified immunity', 'statute of limitations',
  ],
  caribbean: [
    'jamaica', 'barbados', 'trinidad', 'bahamas', 'haiti',
    'caribbean', 'caricom', 'cayman', 'antigua', 'belize',
  ],
  deprioritize: [
    'nfl standings', 'nba standings', 'mlb standings', 'box score',
  ],
}
