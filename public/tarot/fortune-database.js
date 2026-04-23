/**
 * Tarot Fortune Database - Comprehensive 3-Part Fortunes
 * Structure: Card + Intent + Planet combinations
 */

// Organized by intent for easier fallback logic
const FORTUNES_BY_INTENT = {
  love: {
    'the-fool': {
      cardSpeaks: 'The Fool takes a leap, eyes closed to fear, heart open to possibility. Here is the willingness to love without guarantees.',
      astrophysical: 'Love requires you to step off the cliff. Venus knows—the fall is brief, and the landing is always softer than you feared.',
      absurdTruth: 'You are already falling. The only question is whether you surrender to gravity or fight it.'
    },
    'the-magician': {
      cardSpeaks: 'The Magician has all the tools for connection: presence, attention, intention. Love is the ultimate magic—turning two into one.',
      astrophysical: 'Under Venus's influence, your will becomes attractive. What you focus on magnetizes toward you.',
      absurdTruth: 'You already know the spell. You just have to say the words out loud.'
    },
    'the-high-priestess': {
      cardSpeaks: 'The High Priestess understands that love lives in the spaces between words. Intuition is your guide here.',
      astrophysical: 'The Moon rules the unconscious tides of attraction. What you feel is wiser than what you think.',
      absurdTruth: 'Your soulmate is probably wondering the same thing you are right now.'
    },
    'the-empress': {
      cardSpeaks: 'The Empress is fertility, abundance, nurturing presence. She loves fiercely because she has infinite love to give.',
      astrophysical: 'Venus blooms through you. Your capacity to love is your greatest power.',
      absurdTruth: 'The universe designed you to love. Stop trying to be rational about it.'
    },
    'the-emperor': {
      cardSpeaks: 'The Emperor loves with boundaries and clarity. True love requires knowing your worth and standing firm.',
      astrophysical: 'Mars Mars your passion. Venus refines it. Together they create love that lasts.',
      absurdTruth: 'Love is not weakness. It is the most powerful choice you can make.'
    },
    'the-lovers': {
      cardSpeaks: 'The Lovers face each other, naked and willing. This is what love looks like: mutual choice, daily.',
      astrophysical: 'Gemini rules communication, duality, and choice. Love is choosing someone, again and again.',
      absurdTruth: 'The card literally says "lovers." Stop overthinking this one.'
    },
    'the-chariot': {
      cardSpeaks: 'The Chariot moves forward with power and will. Love is not static—it grows or it dies. Keep moving.',
      astrophysical: 'Cancer drives you toward home. Love is a journey toward belonging.',
      absurdTruth: 'You already know where you want to go. Stop waiting for permission to drive.'
    },
    'strength': {
      cardSpeaks: 'Strength shows gentleness as true power. Love requires the courage to be vulnerable, the strength to stay.',
      astrophysical: 'Leo roars softly. Real strength knows how to love without destroying.',
      absurdTruth: 'The person you love will survive you being yourself. That is the whole point.'
    },
    'the-hermit': {
      cardSpeaks: 'The Hermit searches within. Sometimes love means getting to know yourself first, fully.',
      astrophysical: 'Virgo seeks clarity. You cannot share what you do not understand about yourself.',
      absurdTruth: 'Loving yourself first is not selfish. It is the only love that lasts.'
    },
    'wheel-of-fortune': {
      cardSpeaks: 'The Wheel turns. Love comes and goes, appears and disappears. Surrender to timing.',
      astrophysical: 'Jupiter expands. Sometimes your fortune is meeting the right person at the right moment.',
      absurdTruth: 'Timing is everything. The universe is not late; you are just nervous.'
    },
    'justice': {
      cardSpeaks: 'Justice weighs equally. Love requires balance—give and take, stay and release.',
      astrophysical: 'Libra seeks equilibrium. Fair love is the only love worth having.',
      absurdTruth: 'If the relationship is one-sided, you already know. Stop pretending the scales balance.'
    },
    'the-hanged-man': {
      cardSpeaks: 'The Hanged Man sees from an upside-down perspective. Sometimes love requires surrendering your way of seeing.',
      astrophysical: 'Neptune dissolves boundaries. Love asks you to lose yourself to find yourself.',
      absurdTruth: 'Surrender does not mean giving up. It means letting go of control.'
    },
    'death': {
      cardSpeaks: 'Death transforms. A love ends so a new love can begin. What dies makes space for what grows.',
      astrophysical: 'Scorpio rules transformation through loss. Every ending births a new beginning.',
      absurdTruth: 'You are not too old, too broken, or too late. Every moment is a new love story.'
    },
    'temperance': {
      cardSpeaks: 'Temperance blends two into harmony. Love is the alchemy of two becoming one without losing themselves.',
      astrophysical: 'Sagittarius draws the bow. The arrow finds its target through balance and intention.',
      absurdTruth: 'The secret is not perfection. It is commitment on imperfect days.'
    },
    'the-devil': {
      cardSpeaks: 'The Devil represents the magnetic pull of desire. Sometimes love is raw, primal, undeniable attraction.',
      astrophysical: 'Capricorn grounds the body. Physical love is real love. Do not diminish it.',
      absurdTruth: 'Chemistry is not a sin. It is an invitation.'
    },
    'the-tower': {
      cardSpeaks: 'The Tower demolishes false love. What shatters was never solid. What remains is true.',
      astrophysical: 'Mars burns away illusion. Sometimes love must break to rebuild stronger.',
      absurdTruth: 'If it fell apart, it was not strong enough. Grieve it and move forward.'
    },
    'the-star': {
      cardSpeaks: 'The Star is hope, guidance, light. Love as your North Star, the thing you navigate toward.',
      astrophysical: 'Aquarius sees the infinite. Love that transcends time, space, and circumstance.',
      absurdTruth: 'You are worthy of the love you dream about. Stop settling for less.'
    },
    'the-moon': {
      cardSpeaks: 'The Moon reflects. Love is mirrors—you see yourself in another. Choose wisely who you reflect.',
      astrophysical: 'The Moon rules emotion and illusion. Ask: is this love or is this projection?',
      absurdTruth: 'Trust your gut. Your body knows the answer your mind keeps denying.'
    },
    'the-sun': {
      cardSpeaks: 'The Sun radiates fully. Love at its brightest—joyful, generous, visible to all.',
      astrophysical: 'The Sun illuminates truth. This love is real, warm, and life-giving.',
      absurdTruth: 'Stop hiding. The world is ready for your love.'
    },
    'judgement': {
      cardSpeaks: 'Judgement calls you to awaken. Love requires you to see clearly and choose consciously.',
      astrophysical: 'Pluto judges without mercy. Are you choosing this love or inheriting it?',
      absurdTruth: 'This is your chance to do love differently. Do not repeat the past.'
    },
    'the-world': {
      cardSpeaks: 'The World completes the cycle. Love that encompasses all of you, all of them, all of life.',
      astrophysical: 'Saturn closes one circle so another can begin. Love as wholeness.',
      absurdTruth: 'You have found your person or you will. Either way, you are already complete.'
    }
  },

  ambition: {
    'the-fool': {
      cardSpeaks: 'The Fool leaps into the unknown, trusting that the net will appear. Ambition is a leap of faith.',
      astrophysical: 'Uranus accelerates you into new territory. Your next breakthrough requires risk.',
      absurdTruth: 'You already know what to do. You are just waiting for permission you do not need.'
    },
    'the-magician': {
      cardSpeaks: 'The Magician commands all four elements. You have everything you need. Now use it.',
      astrophysical: 'Mercury moves fast. Strike while the iron is hot. The universe is giving you an opening.',
      absurdTruth: 'You were born for this. Stop pretending you do not know.'
    },
    'the-high-priestess': {
      cardSpeaks: 'The High Priestess knows secrets. Your ambition requires trusting what you cannot see yet.',
      astrophysical: 'The Moon rules instinct. Your gut is smarter than your fear.',
      absurdTruth: 'You already know the answer. You are just asking for certainty you will never get.'
    },
    'the-empress': {
      cardSpeaks: 'The Empress creates from nothing. Ambition is birthing something new into the world.',
      astrophysical: 'Venus attracts abundance. You are becoming magnetic.',
      absurdTruth: 'Your vision is not too big. The world is just catching up.'
    },
    'the-emperor': {
      cardSpeaks: 'The Emperor commands kingdoms. Your ambition is legitimate. Claim your throne.',
      astrophysical: 'Aries drives forward. Mars will not let you rest until you achieve.',
      absurdTruth: 'Power is yours to take. You just have to believe you deserve it.'
    },
    'the-lovers': {
      cardSpeaks: 'The Lovers choose consciously. Ambition requires choosing yourself, repeatedly.',
      astrophysical: 'Gemini speaks truth. Say what you want out loud. The universe is listening.',
      absurdTruth: 'People respect those who know what they want. You will too, eventually.'
    },
    'the-chariot': {
      cardSpeaks: 'The Chariot moves forward unstoppably. Your momentum is building. Do not stop now.',
      astrophysical: 'Cancer drives home. Your ambition is calling you toward your destiny.',
      absurdTruth: 'You are already winning. You just cannot see it from inside the race.'
    },
    'strength': {
      cardSpeaks: 'Strength is gentle power. True ambition builds others up while climbing.',
      astrophysical: 'Leo illuminates. Your light inspires others to shine too.',
      absurdTruth: 'The strongest people you know are kind. That is not a coincidence.'
    },
    'the-hermit': {
      cardSpeaks: 'The Hermit seeks wisdom. Your ambition requires understanding yourself first.',
      astrophysical: 'Virgo analyzes. Perfect your craft before showing the world.',
      absurdTruth: 'The time is never "ready." You are ready now.'
    },
    'wheel-of-fortune': {
      cardSpeaks: 'The Wheel turns in your favor. Timing is on your side. Move now.',
      astrophysical: 'Jupiter expands opportunities. Lucky breaks are coming. Prepare to catch them.',
      absurdTruth: 'Luck is preparation meeting opportunity. You are prepared.'
    },
    'justice': {
      cardSpeaks: 'Justice rewards those who play fair. Your ambition is righteous. Pursue it openly.',
      astrophysical: 'Libra balances karma. What you put out returns to you amplified.',
      absurdTruth: 'Integrity is your competitive advantage. Never abandon it for speed.'
    },
    'the-hanged-man': {
      cardSpeaks: 'The Hanged Man sacrifices the familiar for growth. Your ambition may require letting go.',
      astrophysical: 'Neptune dissolves old ways. You must die to what you were to become who you are meant to be.',
      absurdTruth: 'The price of success is leaving behind who you used to be. It is worth it.'
    },
    'death': {
      cardSpeaks: 'Death transforms. Your ambition is shedding old skin and emerging renewed.',
      astrophysical: 'Scorpio rises from ashes. This is your phoenix moment.',
      absurdTruth: 'Everything you are struggling to hold onto is already dead. Let it go.'
    },
    'temperance': {
      cardSpeaks: 'Temperance balances effort and surrender. Ambition without balance burns out.',
      astrophysical: 'Sagittarius aims true. You must rest between shots.',
      absurdTruth: 'The most successful people work half as hard and think twice as clearly.'
    },
    'the-devil': {
      cardSpeaks: 'The Devil is desire incarnate. Ambition is hunger. Feed it.',
      astrophysical: 'Capricorn climbs methodically. Do the unglamorous work. It compounds.',
      absurdTruth: 'Nobody gets to the top by being nice. Be kind, but do not be weak.'
    },
    'the-tower': {
      cardSpeaks: 'The Tower breaks what was blocking you. This is not failure; it is clearing the way.',
      astrophysical: 'Mars demolishes obstacles. What breaks was in your way.',
      absurdTruth: 'The breakthrough you want may come as a breakdown first.'
    },
    'the-star': {
      cardSpeaks: 'The Star guides your path. Your ambition is aligned with your purpose.',
      astrophysical: 'Aquarius sees the future clearly. Trust your vision of what is possible.',
      absurdTruth: 'You are building something that will outlast you. That is the whole point.'
    },
    'the-moon': {
      cardSpeaks: 'The Moon conceals and reveals. Your ambition is real, but it may look different than you imagined.',
      astrophysical: 'The Moon dreams. Your subconscious is solving what your waking mind cannot.',
      absurdTruth: 'The success you get might not be the success you planned. It will be better.'
    },
    'the-sun': {
      cardSpeaks: 'The Sun achieves. Your ambition is not too big. You are exactly as capable as you need to be.',
      astrophysical: 'The Sun illuminates. You are seen. Your work matters.',
      absurdTruth: 'You have already won. You just do not know it yet.'
    },
    'judgement': {
      cardSpeaks: 'Judgement awakens potential. Your ambition is calling you toward your true purpose.',
      astrophysical: 'Pluto transforms ruthlessly. The version of you that must die is already dying.',
      absurdTruth: 'You are not where you started. You have been preparing for this moment your whole life.'
    },
    'the-world': {
      cardSpeaks: 'The World celebrates completion. Your ambition is coming full circle.',
      astrophysical: 'Saturn ends cycles to begin new ones. What you built is becoming your platform for the next climb.',
      absurdTruth: 'Reaching the goal is not the finish line. It is the beginning of a larger game.'
    }
  },

  mystery: {
    'the-fool': {
      cardSpeaks: 'The Fool embraces the unknown. Mystery is not something to solve; it is something to walk into.',
      astrophysical: 'Uranus shatters certainty. The answer you seek may reframe the question entirely.',
      absurdTruth: 'The biggest mysteries have no answers. Just better questions.'
    },
    'the-magician': {
      cardSpeaks: 'The Magician knows that all mysteries follow patterns. Look deeper.',
      astrophysical: 'Mercury reveals connections. The answer is hiding in plain sight.',
      absurdTruth: 'You already understand more than you think. Trust your intuition.'
    },
    'the-high-priestess': {
      cardSpeaks: 'The High Priestess guards sacred secrets. Some mysteries are meant to stay veiled.',
      astrophysical: 'The Moon hides what the Sun reveals. The mystery itself is the message.',
      absurdTruth: 'Not knowing is okay. Sometimes it is the only honest answer.'
    },
    'the-empress': {
      cardSpeaks: 'The Empress knows that life itself is the greatest mystery—birth, growth, becoming.',
      astrophysical: 'Venus creates mystery through abundance. More questions arise the more you know.',
      absurdTruth: 'The mystery deepens the closer you get. That is how you know you are on the right path.'
    },
    'the-emperor': {
      cardSpeaks: 'The Emperor faces mystery with authority. You have the right to seek answers.',
      astrophysical: 'Mars cuts through fog. Demand clarity. The universe respects those who do.',
      absurdTruth: 'Your confusion is temporary. Your certainty is coming.'
    },
    'the-lovers': {
      cardSpeaks: 'The Lovers choose between known and unknown. Mystery asks you to choose anyway.',
      astrophysical: 'Gemini learns by asking. Ask bravely. Listen carefully.',
      absurdTruth: 'The person you are looking for might be yourself.'
    },
    'the-chariot': {
      cardSpeaks: 'The Chariot moves through mist. You do not need to see the entire path to begin.',
      astrophysical: 'Cancer feels its way home. Trust your inner compass.',
      absurdTruth: 'The mystery is solved by moving through it, not around it.'
    },
    'strength': {
      cardSpeaks: 'Strength trusts itself even in darkness. The mystery is not as dangerous as it feels.',
      astrophysical: 'Leo radiates even in shadow. Your light cuts through the fog.',
      absurdTruth: 'You are stronger than whatever mystery you are facing.'
    },
    'the-hermit': {
      cardSpeaks: 'The Hermit seeks wisdom in solitude. Some mysteries reveal themselves only when you stop looking.',
      astrophysical: 'Virgo analyzes the hidden. The answer is in the details.',
      absurdTruth: 'Silence answers what words cannot.'
    },
    'wheel-of-fortune': {
      cardSpeaks: 'The Wheel turns. Mystery is time revealing what was always true.',
      astrophysical: 'Jupiter expands perspective. Wait. The answer is coming.',
      absurdTruth: 'Patience is not passivity. It is active waiting.'
    },
    'justice': {
      cardSpeaks: 'Justice reveals truth. The mystery you face has an answer. It may not be what you expect.',
      astrophysical: 'Libra weighs evidence. The truth is complex. That is okay.',
      absurdTruth: 'You might be right. You might be wrong. Both are okay.'
    },
    'the-hanged-man': {
      cardSpeaks: 'The Hanged Man sees from a different perspective. Invert your assumptions.',
      astrophysical: 'Neptune dissolves certainty. What you think you know might be upside-down.',
      absurdTruth: 'The answer is the opposite of what you expect.'
    },
    'death': {
      cardSpeaks: 'Death transforms mystery into revelation. What dies reveals what lives.',
      astrophysical: 'Scorpio sees beneath the surface. Death shows you what matters.',
      absurdTruth: 'You have been asking the wrong question. The mystery shifts when you do.'
    },
    'temperance': {
      cardSpeaks: 'Temperance finds balance in paradox. Some mysteries are both true and false.',
      astrophysical: 'Sagittarius holds opposites. The answer is bigger than either/or.',
      absurdTruth: 'Accept ambiguity. The world is complex. So are you.'
    },
    'the-devil': {
      cardSpeaks: 'The Devil hides in plain sight. The mystery is obsession—what are you focusing on?',
      astrophysical: 'Capricorn builds slowly. The secret is sustained, unglamorous effort.',
      absurdTruth: 'What you are seeking is seeking you. Stop running.'
    },
    'the-tower': {
      cardSpeaks: 'The Tower reveals hidden truth through crisis. The mystery breaks open.',
      astrophysical: 'Mars shatters illusion. The answer was always there. Crisis just made you see it.',
      absurdTruth: 'What you feared to discover is less terrible than the not-knowing.'
    },
    'the-star': {
      cardSpeaks: 'The Star guides toward revelation. The mystery has a path. Follow it.',
      astrophysical: 'Aquarius sees forward. Your intuition knows the way.',
      absurdTruth: 'You are closer to understanding than you believe.'
    },
    'the-moon': {
      cardSpeaks: 'The Moon IS the mystery. Dreams, symbols, the subconscious speaking in riddles.',
      astrophysical: 'The Moon rules magic. What feels impossible is exactly what is becoming real.',
      absurdTruth: 'Trust the dream even if you cannot explain it.'
    },
    'the-sun': {
      cardSpeaks: 'The Sun illuminates. The mystery dissolves into clarity.',
      astrophysical: 'The Sun reveals all. The darkness you feared was just shadow.',
      absurdTruth: 'You understand more than you think. The clarity is coming.'
    },
    'judgement': {
      cardSpeaks: 'Judgement calls you to awakening. The mystery is about knowing yourself.',
      astrophysical: 'Pluto transforms understanding. What you learn will redefine you.',
      absurdTruth: 'The answer is inside you. You just have not asked yourself the right question yet.'
    },
    'the-world': {
      cardSpeaks: 'The World completes understanding. The mystery resolves into wholeness.',
      astrophysical: 'Saturn integrates all knowledge into wisdom. You finally understand.',
      absurdTruth: 'The mystery was always about the journey, not the destination. Now you see why.'
    }
  }
};

/**
 * Get a specific fortune
 */
function getSpecificFortune(cardName, intent, planet) {
  const cardKey = cardName.toLowerCase().replace(/\s+/g, '-');
  return FORTUNES_BY_INTENT[intent]?.[cardKey] || null;
}

function pickRandomVariant(variants) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return null;
  }

  return variants[Math.floor(Math.random() * variants.length)];
}

/**
 * Get advanced fallback fortunes
 */
function getFortuneFallbackAdvanced(card, intent, planet) {
  const cardKey = card.name.toLowerCase().replace(/\s+/g, '-');
  const intentFortunes = FORTUNES_BY_INTENT[intent];

  if (intentFortunes && intentFortunes[cardKey]) {
    return intentFortunes[cardKey];
  }

  // If the specific card is missing, rotate through a small fallback pool.
  const fallbackPools = {
    love: [
      () => ({
        cardSpeaks: `The ${card.name} whispers of connection and the desire to merge souls.`,
        astrophysical: `Under Venus's benevolent gaze, two orbits are drawn toward intersection.`,
        absurdTruth: `Love is mutual delusion. Thankfully, it is the best delusion there is.`,
      }),
      () => ({
        cardSpeaks: `The ${card.name} asks for closeness, honesty, and a little more courage than comfort prefers.`,
        astrophysical: `Venus draws what is willing to meet it. Attraction is a law, not a wish.`,
        absurdTruth: `The heart is dramatic on purpose. It wants your attention.`,
      }),
      () => ({
        cardSpeaks: `The ${card.name} leans toward tenderness, even if it arrives through awkwardness.`,
        astrophysical: `Venus rewards resonance. What matches your frequency can find you now.`,
        absurdTruth: `If you keep calling it chaos, the romance will start charging rent.`,
      }),
    ],
    ambition: {
      mars: [
        () => ({
          cardSpeaks: `The ${card.name} burns with Mars' impatience and the urge to move now, not later.`,
          astrophysical: `Mars turns momentum into consequence. Action is the language here.`,
          absurdTruth: `You are not behind. You are being wound up like a weapon that still has work to do.`,
        }),
        () => ({
          cardSpeaks: `The ${card.name} meets Mars in a room full of unfinished plans and unspent drive.`,
          astrophysical: `Mars rewards directness. The cleaner the strike, the cleaner the result.`,
          absurdTruth: `Ambition is just appetite with a calendar.`,
        }),
        () => ({
          cardSpeaks: `The ${card.name} carries pressure, heat, and the demand to choose a direction.`,
          astrophysical: `Mars makes the path visible by making hesitation expensive.`,
          absurdTruth: `The universe is not asking for perfection. It is asking for motion.`,
        }),
      ],
      default: [
        () => ({
          cardSpeaks: `The ${card.name} burns with the fire of becoming something greater.`,
          astrophysical: `Mars propels you forward along destiny's path. The cosmos rewards boldness.`,
          absurdTruth: `Ambition is the universe's fever dream, and you are the fever.`,
        }),
        () => ({
          cardSpeaks: `The ${card.name} points to effort that actually changes the room you are in.`,
          astrophysical: `Mars does not favor drift. It favors deliberate force.`,
          absurdTruth: `The climb is real, but so is the grip in your hands.`,
        }),
        () => ({
          cardSpeaks: `The ${card.name} asks whether your hunger is steering you or being steered.`,
          astrophysical: `Mars sharpens desire into action. Wanting becomes doing.`,
          absurdTruth: `If you are waiting for a sign, this is the alarm clock.`,
        }),
      ],
    },
    mystery: [
      () => ({
        cardSpeaks: `The ${card.name} conceals what you are meant to discover through living, not thinking.`,
        astrophysical: `The Moon hides and reveals in the same breath. Trust the darkness.`,
        absurdTruth: `The answer was always the question you forgot to ask.`,
      }),
      () => ({
        cardSpeaks: `The ${card.name} arrives wrapped in ambiguity, which is just mystery wearing practical shoes.`,
        astrophysical: `The Moon makes the hidden active. Not knowing is part of the signal.`,
        absurdTruth: `Mystery is not a bug in the system. It is the system.`,
      }),
      () => ({
        cardSpeaks: `The ${card.name} asks you to tolerate the fog long enough for a shape to emerge.`,
        astrophysical: `The Moon dims certainty so intuition can breathe.`,
        absurdTruth: `Some doors only open when you stop calling them locked.`,
      }),
    ],
  };

  const planetKey = (planet || '').toLowerCase();
  const pool =
    (fallbackPools[intent] && fallbackPools[intent][planetKey]) ||
    (fallbackPools[intent] && fallbackPools[intent].default) ||
    fallbackPools[intent] ||
    [
      () => ({
        cardSpeaks: `The ${card.name} speaks to your journey.`,
        astrophysical: `The cosmos moves in mysterious ways.`,
        absurdTruth: `You are exactly where you need to be.`,
      }),
      () => ({
        cardSpeaks: `The ${card.name} speaks, though not always in the language you expect.`,
        astrophysical: `The sky is still moving, even when the message feels still.`,
        absurdTruth: `Meaning rarely arrives wearing the outfit you planned.`,
      }),
      () => ({
        cardSpeaks: `The ${card.name} is still a message, even when it feels unfinished.`,
        astrophysical: `The cosmos prefers layers to slogans.`,
        absurdTruth: `The reading is not broken; it is being coy.`,
      }),
    ];

  return pickRandomVariant(pool)();
}
