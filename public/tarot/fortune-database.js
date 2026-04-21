/**
 * Tarot Fortune Database
 * 3-part fortunes: Card Speaks + Astrophysical + Absurd Truth
 */

const TAROT_FORTUNES = {
  // ===== THE FOOL (Ambition, Mars, Cosmic Night) =====
  'the-fool-ambition-mars': {
    cardSpeaks: 'The Fool stands at the cliff edge, one foot already over the void. Fearlessness as wisdom — not recklessness, but the willingness to step into the unknown when something greater calls.',
    astrophysical: 'You are hurtling through spacetime at cosmic velocity. Mars accelerates, and hesitation is merely negative momentum. The universe has no brakes, only direction.',
    absurdTruth: 'The cosmos doesn\'t judge your choices — it\'s too busy expanding to care. Your foolishness today is tomorrow\'s legend.'
  },

  // ===== THE MAGICIAN (Ambition, Mars, Astrophysical Lab) =====
  'the-magician-ambition-mars': {
    cardSpeaks: 'The Magician stands with all tools on the table, hands raised to heaven and hell alike. Here is pure will — the willingness to transmute circumstance into destiny.',
    astrophysical: 'Under Mars\'s fire, you hold the universal solvent. What blocks you will dissolve. What you need will materialize. The act of intention itself is alchemy.',
    absurdTruth: 'You already have everything. You always have. The universe\'s cosmic joke: you\'re not becoming — you\'re remembering.'
  },

  // ===== THE HIGH PRIESTESS (Mystery, Moon, Moonlit Ritual) =====
  'the-high-priestess-mystery-moon': {
    cardSpeaks: 'Behind the veil of the High Priestess lies everything you need to know. The answers exist in the silence between your thoughts, in the dreams you half-remember.',
    astrophysical: 'The Moon governs the tides of consciousness itself. What you seek is not hidden from you — it is hidden within you. The mystery is not external; it is you.',
    absurdTruth: 'The real secret? You already knew the answer before you asked the question. The universe just loves making you work for the privilege of remembering.'
  },

  // ===== THE EMPRESS (Love, Venus, Moonlit Ritual) =====
  'the-empress-love-venus': {
    cardSpeaks: 'The Empress blooms in abundance and fertility. Here is nurturing power — the capacity to create, to grow, to generate life and love in all its forms.',
    astrophysical: 'Venus, the love-star, whispers that attraction is gravity on a cosmic scale. You are being pulled toward connection by forces older than stars. Resistance is futile and foolish.',
    absurdTruth: 'Love is just the universe\'s way of trying to merge with itself. When you love, you\'re participating in creation. Also, you\'re probably hungry — the Empress says: eat something beautiful.'
  },

  // ===== THE EMPEROR (Ambition, Mars, Shadow & Light) =====
  'the-emperor-ambition-mars': {
    cardSpeaks: 'The Emperor commands from his throne with absolute authority. Power here is not tyranny but sovereignty — the right to rule your own dominion with clarity and strength.',
    astrophysical: 'Mars empowers your will into law. Structure becomes your strength. What seemed impossible now has clear steps. Authority calls to you — not to dominate others, but to master yourself.',
    absurdTruth: 'Every emperor was once a fool. The universe is patiently waiting to see which you become. (Spoiler: you\'ll be both, and that\'s the whole point.)'
  },

  // ===== THE TOWER (Mystery, Uranus, Shadow & Light) =====
  'the-tower-mystery-moon': {
    cardSpeaks: 'The Tower crumbles, and everything you thought was solid falls. This is not destruction — this is revelation. What was false cannot stand. What is true already has.',
    astrophysical: 'Chaos is creation\'s raw material. The universe occasionally demolishes the walls you built to reorganize itself into something more beautiful. Surrender to the falling.',
    absurdTruth: 'The bad news: your plans are probably wrong. The good news: the universe\'s plans are way better. The absurd news: you\'ll recognize this as the best thing that could\'ve happened, but only in hindsight.'
  },

  // ===== THE WORLD (Mystery, Saturn, Abstract Energy) =====
  'the-world-mystery-moon': {
    cardSpeaks: 'The World completes the cycle. At the Wheel\'s turning, all journeys become one. Here is wholeness, unity, the recognition that every end is a beginning.',
    astrophysical: 'Saturn closes circles. What you sought is already within reach — not as distant destiny but as present reality. The universe was never incomplete. You were just slowly remembering you already had it.',
    absurdTruth: 'Congratulations: you\'ve completed nothing. Every end is a door. But at least you\'re aware now. Awareness is 90% of the game. The other 10% is showing up tomorrow and doing it again.'
  },

  // ===== LOVE + VENUS combinations =====
  'the-empress-love-venus-alt': {
    cardSpeaks: 'Gardens don\'t grow by force — they flourish through tending, through presence, through the patient devotion of someone who shows up every day.',
    astrophysical: 'Venus bends gravity itself. Connection finds you when you\'re grounded in your own soil. The love you seek is already orbiting — just increase your gravitational pull by being authentically yourself.',
    absurdTruth: 'The universe will arrange every coincidence necessary to put love in your path. Also, you have to say yes when it arrives. The cosmos is a flirt, but you have to actually show up for the date.'
  },

  // ===== Ambition + Mars combinations =====
  'the-world-ambition-mars': {
    cardSpeaks: 'Endings are disguised beginnings. What completes in your life right now makes space for the next chapter — the one you\'ve been dreaming about but couldn\'t quite see.',
    astrophysical: 'Mars drives you forward while Saturn teaches you to let go of what\'s served its purpose. The balance point: release the old with gratitude, sprint toward the new with fire.',
    absurdTruth: 'Every ending you\'ve survived has prepared you for this moment. The universe doesn\'t waste pain — it repurposes it as power.'
  },

  // ===== Mystery + Moon combinations =====
  'the-magician-mystery-moon': {
    cardSpeaks: 'The tools are all there, but the real magic comes from trusting what you don\'t yet understand. Your intuition is wiser than your planning.',
    astrophysical: 'The Moon and Mercury dance between consciousness and the unconscious. What you can\'t quite articulate is speaking directly to your soul. Trust the whisper.',
    absurdTruth: 'You\'re overthinking a situation whose solution doesn\'t fit in your logical mind. The answer is in the dream you forgot when you woke up.'
  },
};

/**
 * Get a specific fortune
 * @param {string} cardName - Name of the card
 * @param {string} intent - Intent (love, ambition, mystery)
 * @param {string} planet - Planet (mars, venus, moon, etc.)
 * @returns {Object} Fortune object with cardSpeaks, astrophysical, absurdTruth
 */
function getSpecificFortune(cardName, intent, planet) {
  const key = `${cardName}-${intent}-${planet}`;
  return TAROT_FORTUNES[key] || null;
}

/**
 * Get a random fortune for an intent/planet combo if specific card fortune doesn't exist
 */
function getFortuneFallbackAdvanced(card, intent, planet) {
  // Try to find by card + intent
  const keys = Object.keys(TAROT_FORTUNES);
  const matches = keys.filter(k =>
    k.includes(card.name.toLowerCase().replace(/\s+/g, '-')) &&
    k.includes(intent)
  );

  if (matches.length > 0) {
    return TAROT_FORTUNES[matches[0]];
  }

  // Generic fallbacks by intent
  const intentFallbacks = {
    love: {
      cardSpeaks: `The ${card.name} speaks of connection and the desire to merge with another soul.`,
      astrophysical: `Under Venus's benevolent gaze, two orbits are drawn inexorably toward intersection.`,
      absurdTruth: `Love is just mutual delusion. Fortunately, it\'s the best delusion there is.`
    },
    ambition: {
      cardSpeaks: `The ${card.name} burns with the fire of becoming something greater than you are now.`,
      astrophysical: `Mars accelerates your will into action. The cosmos rewards the bold.`,
      absurdTruth: `Ambition is the universe\'s fever dream, and you\'re the fever.`
    },
    mystery: {
      cardSpeaks: `The ${card.name} conceals what you are meant to discover through living, not thinking.`,
      astrophysical: `The Moon hides and reveals in the same breath. Trust the darkness.`,
      absurdTruth: `The answer was always the question you forgot to ask. Start there.`
    }
  };

  return intentFallbacks[intent] || intentFallbacks.mystery;
}
