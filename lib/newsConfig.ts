// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — News Engine Configuration
// ─────────────────────────────────────────────────────────────────────────────
// Editorial model:
// - StarTalk + PBS Space Time stay pinned to slots 1-2.
// - The remaining feed is one weighted pool.
// - Local Georgia outlets should dominate that pool.
// - CNN should be strongly represented.
// - International, legal, absurd, and macabre stories compete underneath.
// ─────────────────────────────────────────────────────────────────────────────

export type SearchEndpoint = 'news' | 'search' | 'videos';

export interface SearchQuery {
  q: string;
  endpoint: SearchEndpoint;
  num: number;
}

export interface EditorialQuery extends SearchQuery {
  label: string;
  boost: number;
  maxAgeDays?: number;
}

export const FEED_TARGETS = {
  featured: 3,           // StarTalk, PBS Space Time, Grab Bag (now counts separately)
  audioDispatch: 8,      // Spotify podcasts
  news: 16,              // News articles (increased from 15)
  total: 20,             // StarTalk(1) + PBS(1) + GrabBag(1) + AudioDispatch(1) + News(16) = 20
} as const;

export const EDITORIAL_QUERIES = {
  local: [
    {
      label: 'WSB',
      q: 'site:wsbtv.com OR site:wsb.com Atlanta news breaking',
      endpoint: 'news',
      num: 8,
      boost: 80,
      maxAgeDays: 14,
    },
    {
      label: 'Atlanta News First',
      q: 'site:atlantanewsfirst.com Atlanta news breaking local',
      endpoint: 'news',
      num: 8,
      boost: 78,
      maxAgeDays: 14,
    },
    {
      label: 'WABE',
      q: 'site:wabe.org Atlanta Georgia local politics culture public radio',
      endpoint: 'news',
      num: 8,
      boost: 76,
      maxAgeDays: 14,
    },
    {
      label: 'GPB',
      q: 'site:gpb.org Georgia local news politics education health',
      endpoint: 'news',
      num: 8,
      boost: 75,
      maxAgeDays: 14,
    },
    {
      label: 'Axios Atlanta',
      q: 'site:axios.com/newsletters/axios-atlanta Atlanta',
      endpoint: 'search',
      num: 8,
      boost: 64,
      maxAgeDays: 10,
    },
    {
      label: '11Alive',
      q: 'site:11alive.com Atlanta local news breaking Georgia',
      endpoint: 'news',
      num: 8,
      boost: 60,
      maxAgeDays: 10,
    },
    {
      label: 'FOX 5 Atlanta',
      q: 'site:fox5atlanta.com Atlanta local news breaking Georgia',
      endpoint: 'news',
      num: 8,
      boost: 58,
      maxAgeDays: 10,
    },
    {
      label: 'Atlanta Civic Circle',
      q: 'site:atlantaciviccircle.org Atlanta civic journalism local news',
      endpoint: 'news',
      num: 8,
      boost: 56,
      maxAgeDays: 14,
    },
    {
      label: 'Rough Draft Atlanta',
      q: 'site:roughdraftatlanta.com metro Atlanta local news',
      endpoint: 'news',
      num: 8,
      boost: 54,
      maxAgeDays: 14,
    },
    {
      label: 'SaportaReport',
      q: 'site:saportareport.com Atlanta civic news politics development',
      endpoint: 'news',
      num: 8,
      boost: 52,
      maxAgeDays: 14,
    },
    {
      label: 'The Atlanta Voice',
      q: 'site:theatlantavoice.com Atlanta local news community politics',
      endpoint: 'news',
      num: 8,
      boost: 50,
      maxAgeDays: 14,
    },
    {
      label: 'Georgia Recorder',
      q: 'site:georgiarecorder.com Georgia local politics public policy',
      endpoint: 'news',
      num: 8,
      boost: 48,
      maxAgeDays: 14,
    },
  ] as EditorialQuery[],

  cnn: [
    {
      label: 'CNN',
      q: 'site:cnn.com breaking news analysis',
      endpoint: 'news',
      num: 8,
      boost: 72,
    },
  ] as EditorialQuery[],

  legal: [
    {
      label: 'Georgia legal',
      q: 'Georgia courts law lawsuit indictment verdict settlement wrongful death crime',
      endpoint: 'news',
      num: 8,
      boost: 48,
    },
  ] as EditorialQuery[],

  absurd: [
    {
      label: 'Absurd',
      q: 'Georgia bizarre strange odd Ripley\'s Believe It Or Not weird facts unusual news',
      endpoint: 'news',
      num: 8,
      boost: 42,
    },
  ] as EditorialQuery[],

  macabre: [
    {
      label: 'Macabre',
      q: 'Georgia gruesome forensics horrifying crime wrongful death injuries macabre news',
      endpoint: 'news',
      num: 8,
      boost: 46,
    },
  ] as EditorialQuery[],

  international: [
    {
      label: 'International',
      q: 'site:aeon.co OR site:nautil.us OR site:restofworld.org OR site:foreignpolicy.com OR site:theatlantic.com international depth',
      endpoint: 'search',
      num: 8,
      boost: 36,
    },
  ] as EditorialQuery[],

  docs: [
    {
      label: 'Documentary',
      q: 'site:youtube.com PBS Frontline NOVA documentary long form video',
      endpoint: 'videos',
      num: 8,
      boost: 38,
    },
    {
      label: 'Video essays',
      q: 'site:youtube.com high quality documentary news analysis long form',
      endpoint: 'videos',
      num: 8,
      boost: 30,
    },
  ] as EditorialQuery[],

  scienceBonus: [
    {
      label: 'Science',
      q: '"PBS Nova" OR Kurzgesagt OR Veritasium OR "Closer to Truth" OR "Isaac Arthur" science new episode',
      endpoint: 'videos',
      num: 6,
      boost: 34,
    },
  ] as EditorialQuery[],
} as const;

export const SOURCE_WEIGHTS = {
  'wsbtv.com': 42,
  'wsb-tv.com': 42,
  'wsb.com': 42,
  'atlantanewsfirst.com': 40,
  '11alive.com': 39,
  'wabe.org': 38,
  'gpb.org': 37,
  'cnn.com': 34,
  'npr.org': 28,
  'bbc.com': 26,
  'bbc.co.uk': 26,
  'youtube.com': 20,
} as const;

export const SCORING = {
  localGeorgia: [
    'atlanta',
    'georgia',
    'wsb',
    'wsbtv',
    'atlantanewsfirst',
    'wabe',
    'gpb',
    'fulton',
    'cobb county',
    'dekalb',
    'gwinnett',
    'savannah',
    'augusta',
    'macon',
    'athens',
  ],
  cnn: [
    'cnn',
  ],
  legalGeorgia: [
    'law',
    'lawsuit',
    'indictment',
    'verdict',
    'settlement',
    'wrongful death',
    'forensic',
    'forensics',
    'autopsy',
    'homicide',
    'murder',
    'assault',
    'court',
    'judge',
    'appeal',
    'legal',
  ],
  absurd: [
    'bizarre',
    'strange',
    'odd',
    'weird',
    'ripley',
    'believe it or not',
    'unusual',
    'unexpected',
    'outlandish',
  ],
  macabre: [
    'gruesome',
    'horrifying',
    'horror',
    'corpse',
    'body',
    'death',
    'injury',
    'injuries',
    'crime scene',
    'forensics',
    'wrongful death',
    'mutilated',
    'blood',
  ],
  documentary: [
    'documentary',
    'frontline',
    'nova',
    'pbs',
    'long form',
    'investigation',
    'investigative',
    'deep dive',
    'explained',
  ],
  international: [
    'international',
    'foreign policy',
    'rest of world',
    'aeon',
    'nautilus',
    'global',
    'world',
    'diplomacy',
  ],
  deprioritize: [
    'nfl standings',
    'nba standings',
    'mlb standings',
    'box score',
  ],
} as const;

export const SPOTIFY_SHOW_IDS = {
  "The Bill Simmons Podcast": "07SjDmKb9iliEzpNcN2xGD",
  "The Rewatchables": "1lUPomulZRPquVAOOd56EW",
  "The Big Picture": "6mTel3azvnK8isLs4VujvF",
  "The Watch": "3IcA76e8ZV0NNSJ81XHQUg",
  "Higher Learning": "4hI3rQ4C0e15rP3YKLKPut",
  "The Rest is History": "7Cvsbcjhtur7nplC148TWy",
  "Stuff You Missed in History Class": "4Zkj8TTa7XAZYI6aFetlec",
  "Our Fake History": "3Lk9LufHHM9AzVoyYvcI7R",
  "Behind the Bastards": "2ejvdShhn5D9tlVbb5vj9B",
  "Revolutions": "05lvdf9T77KE6y4gyMGEsD",
  "Stuff You Didn't Know About": "3iCqE2fH3ETuXx67BWqFPV",
  "Cabinet of Curiosities": "34RuD4w8IVNm49Ge9qzjwT",
  "The Bugle": "6Z0jGDQp46d69cja0EUFQe",
  "StarTalk Radio": "1mNsuXfG95Lf76YQeVMuo1",
  "Ologies": "5nvRkVMH58SelKZYZFZx1S",
  "Radiolab": "2hmkzUtix0qTqvtpPcMzEL",
  "Short Wave": "2rTT1klKUoQNuaW2Ah19Pa",
  "The Infinite Monkey Cage": "6Ijz5uEUxN6FvJI49ZGJAJ",
  "Sawbones": "0QCiNINmwgA6X4Z4nlnh5G",
  "Science Vs": "5lY4b5PGOvMuOYOjOVEcb9",
  "Stuff You Should Know": "0ofXAdFIQQRsCYj9754UFx",
  "99% Invisible": "2VRS1IJCTn2Nlkg33ZVfkM",
  "The New Yorker Radio Hour": "4ZTHlQzCm7ipnRn1ypnl1Z",
  "On Being": "08F60fHBihlcqWZTr7Thzc",
  "TED Radio Hour": "1vfOw64nKjQ8LzZDPCfRaO",
  "Switched On Pop": "1sgWaKtQxwfjUpZnnK8r7J",
  "Articles of Interest": "6XKe8xy5P16OLrkBW9oz0k",
  "The Ezra Klein Show": "08F60fHBihlcqWZTr7Thzc",
  "Kerning Cultures": "6Mwp0XM22DGXDva9SE3J8x",
  "Unexplained": "269rqhbJIyaCbIzEI4BzCz",
} as const;

export const SPOTIFY_SHOW_IDS_ARRAY = Object.values(SPOTIFY_SHOW_IDS);

export function flattenEditorialQueries() {
  return [
    ...EDITORIAL_QUERIES.local,
    ...EDITORIAL_QUERIES.cnn,
    ...EDITORIAL_QUERIES.legal,
    ...EDITORIAL_QUERIES.absurd,
    ...EDITORIAL_QUERIES.macabre,
    ...EDITORIAL_QUERIES.international,
    ...EDITORIAL_QUERIES.docs,
    ...EDITORIAL_QUERIES.scienceBonus,
  ];
}
