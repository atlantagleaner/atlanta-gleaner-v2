// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — News Engine Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const SOURCES = {

  // ── SCIENCE PINS (slots 1–5, always filled first) ────────────────────────────────────────

  starTalk: {
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCqoAEDirJPjEUFcF2FklnBA',
    type: 'science_pin',
    label: 'StarTalk',
    pinSlots: 2,
  },

  pbsSpaceTime: {
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC7_gcs09iThXybpVgjHZ_7g',
    type: 'science_pin',
    label: 'PBS SpaceTime',
    pinSlots: 2,
  },

  pbsNova: {
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCjHz5SVHeMT0AViCYZvsGDA',
    type: 'science_nova',
    label: 'PBS NOVA',
    pinSlots: 1,
    maxAgeDays: 7,
  },

  // ── NEWS POOL (slots 6–12, scored + Letterman guarantee) ─────────────────────────────────

  wabe: {
    url: 'https://www.wabe.org/feed/',
    type: 'news',
    label: 'WABE',
    sourceBonus: 5,
    maxPerSource: 2,
  },

  wsb: {
    url: 'https://www.wsbtv.com/arc/outboundfeeds/rss/category/news/',
    type: 'news',
    label: 'WSB-TV',
    sourceBonus: 5,
    maxPerSource: 2,
  },

  anf: {
    url: 'https://www.atlantanewsfirst.com/arc/outboundfeeds/rss/',
    type: 'news',
    label: 'Atlanta News First',
    sourceBonus: 5,
    maxPerSource: 2,
  },

  fox5: {
    url: 'https://www.fox5atlanta.com/rss/headlines',
    type: 'news',
    label: 'FOX 5 Atlanta',
    sourceBonus: 5,
    maxPerSource: 2,
  },

  gpb: {
    url: 'https://www.gpb.org/news/rss',
    type: 'news',
    label: 'GPB News',
    sourceBonus: 5,
    maxPerSource: 2,
  },

  cnn: {
    url: 'https://rss.cnn.com/rss/cnn_topstories.rss',
    type: 'news',
    label: 'CNN',
    sourceBonus: 0,
    maxPerSource: 1,
  },

  ap: {
    url: 'https://feeds.apnews.com/rss/apf-topnews',
    type: 'news',
    label: 'AP News',
    sourceBonus: 0,
    maxPerSource: 1,
  },

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

  savannah: {
    url: 'https://www.savannahnow.com/section/feed',
    type: 'news',
    label: 'Savannah Morning News',
    sourceBonus: 8,
    maxPerSource: 2,
  },

  macon: {
    url: 'https://www.macon.com/news/state/georgia/?f=rss',
    type: 'news',
    label: 'Macon Telegraph',
    sourceBonus: 8,
    maxPerSource: 2,
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