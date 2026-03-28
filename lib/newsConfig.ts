// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — News Engine Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const SOURCES = {

  // ── SCIENCE PINS (slots 1–5, always filled first) ────────────────────────────────────────
  // Note: YouTube RSS feeds are blocked by Vercel's outbound proxy.
  // Replaced with podcast RSS feeds hosted on open CDNs.

  starTalk: {
    url: 'https://media.rss.com/startalk-podcast/feed.xml',
    type: 'science_pin',
    label: 'StarTalk',
    pinSlots: 2,
  },

  pbsSpaceTime: {
    // PBS Space Time does not have a standalone podcast feed — replaced with
    // PBS NewsHour Science, which covers astronomy/physics/space regularly.
    url: 'https://www.pbs.org/newshour/feeds/rss/science',
    type: 'science_pin',
    label: 'PBS NewsHour Science',
    pinSlots: 2,
  },

  pbsNova: {
    // NOVA Now podcast feed (PRX-hosted, publicly accessible)
    url: 'https://www.pbs.org/wgbh/nova/podcast/rss',
    type: 'science_nova',
    label: 'PBS NOVA',
    pinSlots: 1,
    maxAgeDays: 30,
  },

  // ── NEWS POOL (slots 6–12, scored + Letterman guarantee) ─────────────────────────────────

  georgiaRecorder: {
    url: 'https://georgiarecorder.com/feed/',
    type: 'news',
    label: 'Georgia Recorder',
    sourceBonus: 5,
    maxPerSource: 2,
  },

  roughDraft: {
    url: 'https://roughdraftatlanta.com/feed/',
    type: 'news',
    label: 'Rough Draft Atlanta',
    sourceBonus: 5,
    maxPerSource: 2,
  },

  atlantaVoice: {
    url: 'https://theatlantavoice.com/feed',
    type: 'news',
    label: 'The Atlanta Voice',
    sourceBonus: 5,
    maxPerSource: 2,
  },

  canopyAtlanta: {
    url: 'https://canopyatlanta.org/feed',
    type: 'news',
    label: 'Canopy Atlanta',
    sourceBonus: 8,
    maxPerSource: 2,
  },

  atlantaMagazine: {
    url: 'https://atlantamagazine.com/feed',
    type: 'news',
    label: 'Atlanta Magazine',
    sourceBonus: 3,
    maxPerSource: 1,
  },

  cnn: {
    url: 'https://rss.cnn.com/rss/cnn_topstories.rss',
    type: 'news',
    label: 'CNN',
    sourceBonus: 0,
    maxPerSource: 1,
  },

  pbsNewsHour: {
    url: 'https://www.pbs.org/newshour/feeds/rss/headlines',
    type: 'news',
    label: 'PBS NewsHour',
    sourceBonus: 2,
    maxPerSource: 1,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Scoring Rules
// ─────────────────────────────────────────────────────────────────────────────

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
    'brunswick', 'jekyll island',
  ],

  tier3: [
    'wrongful death', 'premises liability', 'malpractice', 'sovereign immunity',
    'motion to suppress', 'civil rights', 'fourth amendment', 'first amendment',
    'due process', 'class action', 'injunction', 'attorney general',
    'habeas corpus', 'qualified immunity', 'statute of limitations',
    'claims against the city', 'ante-litem',
  ],

  caribbean: [
    'jamaica', 'barbados', 'trinidad', 'bahamas', 'haiti',
    'caribbean', 'caricom', 'cayman', 'antigua', 'belize',
    'barbuda', 'grenada', 'st. kitts', 'montserrat', 'dominica',
  ],

  science: [
    'quantum', 'astrophysics', 'space telescope', 'nasa', 'black hole',
    'dark matter', 'particle physics', 'cosmology', 'exoplanet',
    'milky way', 'galaxy', 'universe', 'big bang', 'supernova',
  ],

  letterman: [
    'waffle house', 'dunkin', 'waffle', 'dollar general', 'gas station',
    'parking lot', 'fast food', 'walmart', 'alligator', 'snake', 'python',
    'bear', 'feral hog', 'feral pig', 'teleport', 'claims to have',
    'somehow', 'inexplicably', 'accidentally', 'mistakenly',
    'odd couple', 'man bites', 'bites officer', 'unusual suspect',
    'police say', 'neighbors say', 'witnesses say', 'bizarre',
  ],

  deprioritize: [
    'nfl standings', 'nba standings', 'mlb standings', 'box score',
    'dow jones', 's&p 500', 'nasdaq', 'celebrity wedding',
    'grammy award', 'oscar nominations', 'box office',
  ],

  recencyBonus: {
    within12Hours: 10,
    within24Hours: 5,
  },
};

export const SLOT_CONFIG = {
  total: 12,
  starTalk: 2,
  pbsSpaceTime: 2,
  pbsNova: 1,
  letterman: 2,
  news: 5,
};