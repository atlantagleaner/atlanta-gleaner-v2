/**
 * Dialogue System for Psychic Reader
 * Manages narrator lines and flow guidance
 */

const DialogueSystem = (() => {
  const DIALOGUES = {
    opening: {
      greeting: 'Welcome, seeker. I sense you\'ve come for guidance... what calls to your heart today?',
      expressions: ['neutral-welcome'],
    },
    intent: {
      love: {
        prompt: 'I feel the currents of connection and desire flowing around you. Let\'s see what the cosmos has to say...',
        expressions: ['focused', 'revelation'],
      },
      ambition: {
        prompt: 'Ah, yes... ambition burns bright in your spirit. Let the stars reveal your path forward...',
        expressions: ['focused', 'cosmic-vision'],
      },
      mystery: {
        prompt: 'The unknown calls to you. Let\'s pierce the veil and see what waits beneath...',
        expressions: ['focused', 'revelation'],
      },
    },
    spread: {
      mirror: {
        prompt: 'One card shall speak your truth directly. A single lens through which to view your journey.',
        expressions: ['focused'],
      },
      three: {
        prompt: 'Three cards shall unfold your story: where you\'ve been, where you stand now, and where you\'re headed.',
        expressions: ['focused', 'knowing-smile'],
      },
    },
    draw: {
      prompts: [
        'The cards are calling... I feel the universe stirring...',
        'The threads of fate are shifting. Let\'s see what reveals itself...',
        'I sense the answer emerging from the cosmic tapestry...',
        'The stars are speaking. Listen closely...',
      ],
      expressions: ['focused', 'revelation'],
    },
    cardFlip: {
      waiting: 'Click to reveal your card...',
      expressions: ['focused'],
    },
    reading: {
      cardSpeaks: {
        label: 'The Card Speaks',
        prompt: 'What you see here is...',
        expressions: ['revelation'],
      },
      astrophysical: {
        label: 'Your Astrophysical Reading',
        prompt: 'In the language of stars and cosmos...',
        expressions: ['cosmic-vision'],
      },
      absurdTruth: {
        label: 'The Absurd Truth',
        prompt: 'And yet, the universe would have you know...',
        expressions: ['playful-mischief', 'knowing-smile'],
      },
    },
    closing: {
      nextOptions: [
        'Another reading?',
        'Tell me more',
        'Return to Saturn',
      ],
      expressions: ['knowing-smile', 'playful-mischief'],
    },
  };

  return {
    /**
     * Get dialogue for opening sequence
     */
    getOpening() {
      return DIALOGUES.opening;
    },

    /**
     * Get intent selection dialogue
     */
    getIntentDialogue(intent) {
      return DIALOGUES.intent[intent] || DIALOGUES.intent.mystery;
    },

    /**
     * Get spread selection dialogue
     */
    getSpreadDialogue(spreadType) {
      return DIALOGUES.spread[spreadType] || DIALOGUES.spread.mirror;
    },

    /**
     * Get random draw prompt
     */
    getDrawPrompt() {
      const prompts = DIALOGUES.draw.prompts;
      return prompts[Math.floor(Math.random() * prompts.length)];
    },

    getDrawExpressions() {
      return DIALOGUES.draw.expressions;
    },

    /**
     * Get card flip dialogue
     */
    getCardFlipDialogue() {
      return DIALOGUES.cardFlip;
    },

    /**
     * Get reading section dialogue
     */
    getReadingSection(section) {
      // section: 'cardSpeaks', 'astrophysical', or 'absurdTruth'
      return DIALOGUES.reading[section] || {};
    },

    /**
     * Get closing dialogue and options
     */
    getClosing() {
      return DIALOGUES.closing;
    },

    /**
     * Create intent menu options for display
     */
    getIntentOptions() {
      return [
        { label: 'LOVE & CONNECTION', value: 'love' },
        { label: 'AMBITION & CHANGE', value: 'ambition' },
        { label: 'MYSTERY & DESTINY', value: 'mystery' },
      ];
    },

    /**
     * Create spread menu options for display
     */
    getSpreadOptions() {
      return [
        { label: 'SINGLE INSIGHT', value: 'mirror' },
        { label: 'BIGGER PICTURE', value: 'three' },
      ];
    },
  };
})();
