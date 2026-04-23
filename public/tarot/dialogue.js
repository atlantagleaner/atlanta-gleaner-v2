/**
 * Dialogue System for Psychic Reader
 * Manages narrator lines and flow guidance
 */

const DialogueSystem = (() => {
  const lastChoiceByKey = new Map();

  function pickVariant(key, variants) {
    if (!Array.isArray(variants) || variants.length === 0) {
      return '';
    }

    if (variants.length === 1) {
      lastChoiceByKey.set(key, 0);
      return variants[0];
    }

    const lastIndex = lastChoiceByKey.get(key);
    let nextIndex = Math.floor(Math.random() * variants.length);

    if (variants.length > 1 && nextIndex === lastIndex) {
      nextIndex = (nextIndex + 1) % variants.length;
    }

    lastChoiceByKey.set(key, nextIndex);
    return variants[nextIndex];
  }

  function withPrompt(label, promptVariants, expressions) {
    return {
      label,
      prompt: pickVariant(label, promptVariants),
      expressions,
    };
  }

  const DIALOGUES = {
    opening: {
      greetings: [
        'Welcome, seeker. I sense you have come for guidance. What calls to your heart today?',
        'Come closer, seeker. The cards have already begun to stir. What brings you here?',
        'You have arrived at the threshold. Speak your question, and let the cards answer in kind.',
        'The air is already humming with meaning. Tell me what you are truly seeking.',
        'Welcome back to the circle. The deck remembers movement, and so does the soul.',
        'A quiet question brought you here. Let us listen for what it is not yet saying.',
        'The cards are restless tonight. So are you. Let us see why.',
        'Step lightly, seeker. Some truths arrive softly before they arrive clearly.',
        'This chamber is patient. It will wait while you decide how honest you wish to be.',
        'The deck does not mind if your question is messy. Messy questions often make the best readings.',
        'A reading begins before the cards are touched. I can already feel yours forming.',
        'There is a story in the room, and it is asking to be told through the cards.',
        'The threshold has opened again. Come through with whatever you have carried here.',
        'Speak plainly, or speak around the edges. The cards understand both.',
        'Some questions arrive wearing armor. We will see what is underneath.',
        'The future is not a lock. It is a conversation waiting for a reply.',
      ],
      expressions: ['neutral-welcome'],
    },
    intent: {
      love: withPrompt(
        'intent-love',
        [
          'I feel the currents of attachment, longing, and tenderness around you. Let us see what the cosmos has to say.',
          'Love always arrives carrying both delight and risk. Let us ask the cards where the heart is leaning.',
          'Something in you is reaching for connection. We should listen to that reaching before it hardens into silence.',
          'The heart is rarely tidy. Let us draw for what you desire, what you fear, and what desires you back.',
          'There is a pulse of intimacy in the air. The cards can tell us whether it is invitation, memory, or warning.',
          'Love can be a doorway or a mirror. Let us find out which one is opening for you.',
          'You have brought your tenderness here on purpose, even if you did not mean to. That matters.',
          'This is not just about romance. It is about the shape your heart is trying to take.',
          'Affection, grief, memory, hope. They all crowd the same room sometimes. Let us sort them carefully.',
          'Love asks the bravest question: what can you risk without betraying yourself?',
          'The cards can name the kind of love you are ready for and the kind you are still outgrowing.',
          'The heart is a good liar when it is frightened. Let us ask it to be honest anyway.',
        ],
        ['focused', 'revelation']
      ),
      ambition: withPrompt(
        'intent-ambition',
        [
          'Yes. Ambition is burning bright in you. Let the stars reveal the shape of your next ascent.',
          'Your will is asking for a horizon. We should see where that hunger is meant to lead.',
          'There is momentum in you now. The cards can show where it wants to break through.',
          'Ambition is not greed when it is aligned. Let us test whether your desire is calling or chasing.',
          'You are standing at the edge of a larger version of yourself. Let us ask what must be claimed next.',
          'The road ahead is not quiet. It is charged. The cards will tell us whether to press on or pivot.',
          'What you want is not trivial. The cards will not insult you by pretending otherwise.',
          'Ambition has two faces: one that builds and one that devours. We need to know which one is in charge.',
          'You do not need permission to want more. You do need clarity about what more means.',
          'The climb matters, but so does the reason you started climbing.',
          'If power is calling, we should ask what it expects from you in return.',
          'This reading may speak to achievement, but it will also speak to cost.',
        ],
        ['focused', 'cosmic-vision']
      ),
      mystery: withPrompt(
        'intent-mystery',
        [
          'The unknown calls to you. Let us pierce the veil and see what waits beneath it.',
          'Mystery likes to be approached sideways. We will ask the cards to reveal what is hidden without naming it too soon.',
          'Something elusive is near you. Let us listen for its shape before it becomes obvious.',
          'When the path is unclear, the cards can still speak. They may not explain everything, but they will not lie.',
          'The dark has its own grammar. Let us read it carefully.',
          'You are being drawn toward an answer that is not ready to be ordinary. We should ask with patience.',
          'Some questions cannot be forced into daylight. They have to be coaxed into speaking.',
          'Mystery is not a problem to solve so much as a depth to enter.',
          'There may be more than one answer here. That is not a flaw. It is the shape of the thing.',
          'The veil is not the enemy. Sometimes it protects the answer until you can hold it.',
          'We are not here to pin down the unknown like a specimen. We are here to let it breathe.',
          'Your question may not want a neat reply. Good. Neat replies are often too small for real mysteries.',
        ],
        ['focused', 'revelation']
      ),
    },
    spread: {
      mirror: withPrompt(
        'spread-mirror',
        [
          'A 1-card draw will speak your truth directly. One lens, one answer, one sharp reflection.',
          'One card can be enough when the question is honest. Let us let it stand alone and speak plainly.',
          'A single card will act as a mirror. Sometimes one face is all the soul needs to recognize itself.',
          'This draw will be direct. The card will not wander. It will answer in a single stroke.',
          'One card. One angle. One honest disturbance in the glass.',
          'A mirror spread is concise, but not small. It tends to tell the truth faster than the mind can decorate it.',
          'A single card can be merciless in its clarity. That is often the gift.',
          'When the deck speaks with one card, it usually means it wants you to stop circling the point.',
          'This spread is a lantern, not a maze. It will show you exactly where to look.',
          'One card can carry a whole weather system if you are willing to read it fully.',
          'Short readings are not shallow readings. Sometimes they are just unadorned.',
          'The mirror does not need many pieces to become accurate.',
        ],
        ['focused']
      ),
      three: withPrompt(
        'spread-three',
        [
          'A 3-card draw will unfold your story: where you have been, where you stand now, and where you are headed.',
          'Three cards will reveal a sequence. Past, present, future. It is simple, but it can open like a door.',
          'We will read this in three breaths: what shaped you, what is shaping you, and what wants to arrive next.',
          'A three-part spread gives the cards room to speak in motion. Let the sequence reveal the current beneath the surface.',
          'Three cards together can show the weather of a life. Let us see what kind of storm, calm, or dawn is forming.',
          'This spread gives time a voice. The first card remembers, the second listens, the third anticipates.',
          'Three cards can become a staircase if the meaning is willing to climb.',
          'Past, present, future is the usual language, but the cards may choose a more interesting grammar.',
          'This spread is a little longer because real change rarely fits into one symbol.',
          'Let the first card establish the old shape, the second reveal the living tension, and the third show the next becoming.',
          'The three-card path is a small narrative, and narratives are where the cards become impossible to ignore.',
          'We are asking for sequence here: what was, what is, and what insists on following.',
        ],
        ['focused', 'knowing-smile']
      ),
    },
    draw: {
      prompts: [
        'The cards are calling. I feel the universe stirring.',
        'The threads of fate are shifting. Let us see what reveals itself.',
        'I sense the answer emerging from the cosmic tapestry.',
        'The stars are speaking. Listen closely.',
        'The deck is warm in my hands. That is usually a sign something wants to be known.',
        'A small silence has opened. That is where the cards like to enter.',
        'There is movement behind the veil now. Hold still and let it approach.',
        'The next truth is not loud. It is gathering itself in the dark.',
        'Something is trying to become visible. We should not rush it.',
        'The moment before revelation always feels this way: charged, quiet, and slightly electric.',
        'The cards have begun to lean toward a direction. Let us follow their tilt.',
        'I can feel the reading assembling itself now. Stay with it.',
        'A pattern is trying to complete itself. We are only here to witness it becoming legible.',
        'The air around the deck has sharpened. That usually means the answer is closer than it appears.',
        'There is a pulse under the silence now. The cards are starting to answer in rhythm.',
        'This is the patient part. The part where meaning gathers itself before it speaks.',
        'The reading is not emerging all at once. It is unfolding like something remembered.',
        'I can feel the shape of the question pulling on the shape of the answer.',
        'A card does not have to shout to be unmistakable. The deck is proving that now.',
        'The universe likes dramatic entrances, but the cards prefer precise ones.',
      ],
      expressions: ['focused', 'revelation'],
    },
    bridge: {
      intentPrompt: [
        'What calls to your heart today?',
        'Name the current pulling at you most strongly.',
        'Which question has followed you here?',
        'Let us begin with the thing you keep returning to.',
        'Say the shape of your concern, and we will follow it.',
      ],
      spreadPrompt: [
        'Choose a 1-card draw or a 3-card draw.',
        'Decide whether you want a mirror or a sequence.',
        'Will you ask for a single reflection or a fuller unfolding?',
        'Select the spread that matches the size of the question.',
        'One card or three. The cards will honor either request.',
      ],
      closingPrompt: [
        'Would you like another reading?',
        'Shall we ask the deck again?',
        'Do you want to return for another turn of the cards?',
        'Would you like to consult the deck once more?',
        'Should we draw the next thread?',
      ],
      revealPrompt: [
        'The card is ready to be seen.',
        'The answer is waiting under the veil.',
        'This is the moment before the symbol speaks.',
        'A single motion stands between you and the reveal.',
        'The deck has settled. Let it answer now.',
      ],
      readingLead: [
        'Now the card speaks in full.',
        'Listen closely. The reading is opening.',
        'Here is the meaning unfolding in layers.',
        'We have the symbol. Now we ask it to explain itself.',
        'The card has taken shape. Let us hear what it means.',
      ],
    },
    cardFlip: {
      waiting: [
        'Click to reveal your card.',
        'The veil is thin here. Click when you are ready to see what answered.',
        'This is the moment of reveal. Click to turn the card and hear its voice.',
        'The card is waiting to be known. Click to let it speak.',
        'One motion remains between you and the truth. Click to turn the card.',
        'Click now. The answer is already in the room.',
        'The card is ready. You only have to decide whether you are.',
        'No more circling. Click and let the symbol become visible.',
        'This is the hinge of the reading. Click to move through it.',
        'A small act opens a larger message. Click to begin.',
        'The deck has settled. Click to disturb it into speech.',
        'The reveal is waiting at the edge of your attention. Click to cross over.',
      ],
      expressions: ['focused'],
    },
    reading: {
      cardSpeaks: withPrompt(
        'reading-cardSpeaks',
        [
          'What you see here is not decoration. It is the card speaking in its own voice.',
          'The card speaks first, before interpretation can soften it.',
          'This is the card in its raw form: symbolic, strange, and more honest than it looks.',
          'Before the mind explains it, let the card name itself.',
          'The card offers a direct statement here. Listen for the plain meaning underneath the poetry.',
          'What the card says is often simpler than what we want it to say.',
          'This card does not ask for permission to matter. It simply does.',
          'The image is doing more work than the caption ever could.',
          'Let the card be blunt for a moment. It is often more useful that way.',
          'There is a reason this symbol appeared now, and not some other one.',
          'Every card has a first voice. This is it, before the commentary arrives.',
          'If you can hear the card without translating it too quickly, you will get more from it.',
        ],
        ['revelation']
      ),
      astrophysical: withPrompt(
        'reading-astrophysical',
        [
          'In the language of stars and cosmos, this card is a pattern in motion.',
          'The sky has its own way of translating symbols into timing, pressure, and possibility.',
          'If we read this astronomically, the card becomes a weather system for the soul.',
          'The celestial lens widens the meaning. Now the card is not only personal, but planetary.',
          'In the astrological register, this is less an answer than a field of influence.',
          'The heavens are not being poetic here. They are being precise.',
          'The planet behind this card does not decorate it. It directs it.',
          'This is where symbol becomes orbit, and orbit becomes consequence.',
          'A cosmic reading asks what larger force is moving through the small event.',
          'The stars do not usually speak in sentences. They speak in patterns that sentence your life.',
          'What looks personal is also atmospheric. That is the trick of the heavens.',
          'This card belongs to a sky as much as it belongs to a story.',
        ],
        ['cosmic-vision']
      ),
      absurdTruth: withPrompt(
        'reading-absurdTruth',
        [
          'And yet, the universe would have you know something stranger and funnier than the polished meaning.',
          'There is always an absurd edge to wisdom. The cards are not too dignified to admit it.',
          'The truth has a practical costume, but it also wears a ridiculous one.',
          'This is the part of the reading that grins while it delivers the blow.',
          'The universe is serious about meaning and unserious about method.',
          'If the card seems too grand, ask what it would say while rolling its eyes.',
          'The joke is part of the message. The cards are not above making one at your expense and for your benefit.',
          'If wisdom ever becomes pompous, the universe tends to correct it with a slapstick turn.',
          'A little irreverence keeps the reading honest.',
          'The absurd truth often arrives first because it knows you will actually remember it.',
          'Humor is one of the ways the cards keep the ego from overclaiming the story.',
          'The cosmos can be profound without becoming solemn. That matters here.',
        ],
        ['playful-mischief', 'knowing-smile']
      ),
    },
    closing: {
      nextOptions: [
        'Draw again',
        'Ask a different question',
        'Read the cards once more',
        'Return to the deck',
        'Seek another pattern',
        'Let the cards speak again',
        'Consult the deck anew',
        'Turn another card',
        'Listen for a deeper layer',
        'Try a different angle',
      ],
      expressions: ['knowing-smile', 'playful-mischief'],
    },
  };

  return {
    /**
     * Get dialogue for opening sequence
     */
    getOpening() {
      return {
        greeting: pickVariant('opening-greeting', DIALOGUES.opening.greetings),
        expressions: DIALOGUES.opening.expressions,
      };
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
      return pickVariant('draw-prompt', DIALOGUES.draw.prompts);
    },

    getDrawExpressions() {
      return DIALOGUES.draw.expressions;
    },

    getIntentBridge() {
      return pickVariant('bridge-intent', DIALOGUES.bridge.intentPrompt);
    },

    getSpreadBridge() {
      return pickVariant('bridge-spread', DIALOGUES.bridge.spreadPrompt);
    },

    getClosingBridge() {
      return pickVariant('bridge-closing', DIALOGUES.bridge.closingPrompt);
    },

    getRevealBridge() {
      return pickVariant('bridge-reveal', DIALOGUES.bridge.revealPrompt);
    },

    getReadingLead() {
      return pickVariant('bridge-reading-lead', DIALOGUES.bridge.readingLead);
    },

    /**
     * Get card flip dialogue
     */
    getCardFlipDialogue() {
      return {
        waiting: pickVariant('card-flip-waiting', DIALOGUES.cardFlip.waiting),
        expressions: DIALOGUES.cardFlip.expressions,
      };
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
      return {
        nextOptions: DIALOGUES.closing.nextOptions.slice(),
        expressions: DIALOGUES.closing.expressions,
      };
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
        { label: '1-CARD DRAW', value: 'mirror' },
        { label: '3-CARD DRAW', value: 'three' },
      ];
    },
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DialogueSystem;
}

if (typeof window !== 'undefined') {
  window.DialogueSystem = DialogueSystem;
}
