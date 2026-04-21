/**
 * Tarot Final Readings Library
 * 100 card-aware readings with guide, planet, and spread metadata
 * Used for synthesized final reading at the end of each tarot game session
 */

var FINAL_READINGS = [
  // SCRIBE READINGS - Moon Planet
  {
    id: 'scribe-moon-1',
    guide: 'scribe',
    planet: 'moon',
    spreadType: 'mirror',
    cardPatterns: ['the-high-priestess', 'the-moon', 'cups-suit'],
    keywords: ['intuition', 'dreams', 'reflection', 'emotion'],
    text: "The High Priestess whispers beneath Luna's glow: the card you have drawn speaks of knowledge hidden within. The Moon's influence illuminates what dwells beneath the surface of your consciousness. Listen to the quiet voice within—it knows truths your waking mind has yet to grasp. Write down your dreams tonight. They carry messages from the deeper self."
  },
  {
    id: 'scribe-moon-2',
    guide: 'scribe',
    planet: 'moon',
    spreadType: 'mirror',
    cardPatterns: ['major-arcana'],
    keywords: ['wisdom', 'mystery', 'cycles', 'memory'],
    text: "Under the Moon's tender eye, the Scribe reads the card as a mirror of your inner sanctuary. Whatever Major card appears is a teacher in the dark—a guide through the cycles of your becoming. The wisdom here is old, lunar wisdom. Let it settle like silver dust upon your soul."
  },
  {
    id: 'scribe-moon-3',
    guide: 'scribe',
    planet: 'moon',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['journey', 'emotion', 'transformation'],
    text: "Three cards arranged beneath the Moon's soft light reveal the arc of your emotional journey. Past feeds into Present; Present shapes the Future. The Moon teaches patience with yourself. Each phase matters. Each card is a phase of becoming. Trust the darkness as much as the light."
  },
  {
    id: 'scribe-moon-4',
    guide: 'scribe',
    planet: 'moon',
    spreadType: 'three',
    cardPatterns: ['cups-suit'],
    keywords: ['relationships', 'feelings', 'connection', 'vulnerability'],
    text: "Cups shimmer in the Moon's reflection—these are the waters of your heart across time. The Scribe notes: water remembers. Your emotions hold wisdom. The three cards show where your feelings have led you, where they lead you now, and where your heart seeks to go. Honor this journey."
  },
  {
    id: 'scribe-moon-5',
    guide: 'scribe',
    planet: 'moon',
    spreadType: 'mirror',
    cardPatterns: ['the-fool'],
    keywords: ['innocence', 'new beginning', 'trust'],
    text: "The Fool steps into Luna's domain, and the Scribe laughs gently. Innocence and wisdom meet here. Whatever begins under this influence will be tender and true. Trust the beginning, even if you cannot see the path ahead. The Moon lights only the next step—and that is all you need."
  },

  // SCRIBE READINGS - Mercury Planet
  {
    id: 'scribe-mercury-1',
    guide: 'scribe',
    planet: 'mercury',
    spreadType: 'mirror',
    cardPatterns: ['the-magician', 'swords-suit'],
    keywords: ['communication', 'intellect', 'clarity', 'expression'],
    text: "The Magician conjures words and meaning. Under Mercury's swift wing, the Scribe sees your power of expression. What you have drawn speaks of the tools in your hand—the ability to communicate, persuade, create with language and thought. Write your truths. Speak your visions. The universe listens when you voice them clearly."
  },
  {
    id: 'scribe-mercury-2',
    guide: 'scribe',
    planet: 'mercury',
    spreadType: 'mirror',
    cardPatterns: ['major-arcana'],
    keywords: ['knowledge', 'understanding', 'revelation'],
    text: "Mercury dances with ideas, and your card is a revelation waiting to be understood. The Scribe records this: clarity is coming. What seemed obscure will become lucid. The energy of this moment favors learning, study, and intellectual breakthrough. Read deeply. Think carefully. Understanding is your gift now."
  },
  {
    id: 'scribe-mercury-3',
    guide: 'scribe',
    planet: 'mercury',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['dialogue', 'exchange', 'messages'],
    text: "Three cards speak across time, a dialogue written by the hands of fate. Past shows what you understood; Present asks what you understand now; Future reveals the wisdom gained through all of this understanding. Mercury teaches that life itself is a conversation. Listen carefully to all three voices."
  },
  {
    id: 'scribe-mercury-4',
    guide: 'scribe',
    planet: 'mercury',
    spreadType: 'three',
    cardPatterns: ['swords-suit'],
    keywords: ['truth', 'conflict', 'clarity', 'breakthrough'],
    text: "Swords cut through illusion—three of them arranged show past conflicts, present clarity, and future truth. Mercury favors the sharp mind. The Scribe notes: sometimes truth requires a blade. But that blade, once drawn, clears the air. Speak what needs speaking."
  },
  {
    id: 'scribe-mercury-5',
    guide: 'scribe',
    planet: 'mercury',
    spreadType: 'mirror',
    cardPatterns: ['the-hierophant'],
    keywords: ['teaching', 'tradition', 'wisdom passed down'],
    text: "The Hierophant stands at Mercury's crossroads. The Scribe writes: you carry ancient knowledge. Whether you teach or learn, tradition has chosen you. What you have drawn speaks of sacred knowledge—the kind passed mouth to ear, hand to hand, soul to soul."
  },

  // SCRIBE READINGS - Venus Planet
  {
    id: 'scribe-venus-1',
    guide: 'scribe',
    planet: 'venus',
    spreadType: 'mirror',
    cardPatterns: ['the-lovers', 'cups-suit'],
    keywords: ['love', 'choice', 'beauty', 'value'],
    text: "Venus smiles upon you, and the card drawn is an offering of grace. The Scribe sees: you are worthy of love—the love of others and of yourself. Whatever appears here is touched by Venus's blessing. Know your value. Choose what honors your heart. Love is the oldest wisdom."
  },
  {
    id: 'scribe-venus-2',
    guide: 'scribe',
    planet: 'venus',
    spreadType: 'mirror',
    cardPatterns: ['major-arcana'],
    keywords: ['harmony', 'balance', 'treasure'],
    text: "Under Venus's gentle gaze, even the most challenging card becomes a gift. The Scribe transcribes: this is a time of finding value in all things. Beauty is not only in the pleasant—it lives in contrast, in complexity, in the full spectrum of being. You are learning to love it all."
  },
  {
    id: 'scribe-venus-3',
    guide: 'scribe',
    planet: 'venus',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['relationship', 'connection', 'deepening'],
    text: "Three cards unfold like petals opening. Past shows what you have valued; Present shows the beauty you cherish now; Future reveals the deepening of your capacity to love and be loved. Venus teaches that love grows in spirals—each cycle takes you deeper into its mystery."
  },
  {
    id: 'scribe-venus-4',
    guide: 'scribe',
    planet: 'venus',
    spreadType: 'three',
    cardPatterns: ['pentacles-suit'],
    keywords: ['abundance', 'prosperity', 'gratitude'],
    text: "Pentacles glow with worth under Venus's blessing. Past shows resources gathered; Present shows what you now possess; Future reveals the abundance that continues to flow. Gratitude is the coin that keeps Venus's treasury open. Count your blessings deliberately."
  },
  {
    id: 'scribe-venus-5',
    guide: 'scribe',
    planet: 'venus',
    spreadType: 'mirror',
    cardPatterns: ['the-empress'],
    keywords: ['creation', 'nurturing', 'generosity'],
    text: "The Empress and Venus are sisters. The Scribe writes: you carry generative power. Whatever you nurture will flourish. Whatever you create will be beautiful. Trust in your capacity to bring things to life—ideas, love, projects, joy. This is your gift now."
  },

  // SCRIBE READINGS - Mars Planet
  {
    id: 'scribe-mars-1',
    guide: 'scribe',
    planet: 'mars',
    spreadType: 'mirror',
    cardPatterns: ['the-tower', 'swords-suit', 'wands-suit'],
    keywords: ['action', 'challenge', 'courage', 'transformation'],
    text: "Mars stokes the fire of action, and your card speaks of transformation through courage. The Scribe writes: this is not a time for hesitation. Whatever you have drawn calls you to face it directly. The Tower destroys only what was false. Fire purifies. Movement creates breakthrough. Step forward."
  },
  {
    id: 'scribe-mars-2',
    guide: 'scribe',
    planet: 'mars',
    spreadType: 'mirror',
    cardPatterns: ['major-arcana'],
    keywords: ['power', 'will', 'striving', 'victory'],
    text: "Mars lends its warrior energy to your reading. The Scribe notes: power is awakening within you. This Major card is a champion, a force, a movement. You are stronger than you know. Channel this energy not into conflict but into creation—build something that will stand against time."
  },
  {
    id: 'scribe-mars-3',
    guide: 'scribe',
    planet: 'mars',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['progression', 'momentum', 'overcoming'],
    text: "Three cards march through time in formation. Past shows the struggle that forged you; Present shows your current strength; Future shows what you will overcome. Mars teaches that struggle itself is the teacher. You are becoming invincible."
  },
  {
    id: 'scribe-mars-4',
    guide: 'scribe',
    planet: 'mars',
    spreadType: 'three',
    cardPatterns: ['wands-suit'],
    keywords: ['passion', 'creative fire', 'inspiration'],
    text: "Wands ignite beneath Mars's heat. Past shows the spark; Present shows the flame; Future shows the light cast by your burning. This is the path of the creator, the innovator, the inspired. Feed the fire with your attention and will. Your passion is your power."
  },
  {
    id: 'scribe-mars-5',
    guide: 'scribe',
    planet: 'mars',
    spreadType: 'mirror',
    cardPatterns: ['the-chariot'],
    keywords: ['control', 'direction', 'victory', 'mastery'],
    text: "The Chariot races beneath Mars's war banner. The Scribe reads: you are learning to master the forces within and around you. This card speaks of taking control with grace and clarity. You know where you're going. Drive toward it with full force."
  },

  // SCRIBE READINGS - Jupiter Planet
  {
    id: 'scribe-jupiter-1',
    guide: 'scribe',
    planet: 'jupiter',
    spreadType: 'mirror',
    cardPatterns: ['the-wheel-of-fortune', 'major-arcana'],
    keywords: ['expansion', 'opportunity', 'growth', 'luck'],
    text: "Jupiter expands all it touches, and your card is blessed by fortune's giant grin. The Scribe records: this is a time of expansion and opportunity. Seeds planted now will grow tenfold. Doors thought closed are opening. Say yes to what calls you forward. Luck favors the bold."
  },
  {
    id: 'scribe-jupiter-2',
    guide: 'scribe',
    planet: 'jupiter',
    spreadType: 'mirror',
    cardPatterns: ['pentacles-suit'],
    keywords: ['abundance', 'plenty', 'prosperity', 'reward'],
    text: "Pentacles multiply beneath Jupiter's golden touch. The Scribe smiles: abundance is not just possible—it is natural. What you have sown, you will harvest abundantly. Prosperity comes not only in money but in experience, wisdom, and joy. You are entering a season of plenty."
  },
  {
    id: 'scribe-jupiter-3',
    guide: 'scribe',
    planet: 'jupiter',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['journey', 'learning', 'wisdom', 'journey'],
    text: "Three cards plot your journey under Jupiter's protection. Past shows where wisdom came from; Present shows where you stand enlightened; Future shows the heights still to climb. Jupiter favors the seeker, the student, the explorer. Your journey expands your soul."
  },
  {
    id: 'scribe-jupiter-4',
    guide: 'scribe',
    planet: 'jupiter',
    spreadType: 'three',
    cardPatterns: ['major-arcana'],
    keywords: ['destiny', 'unfolding', 'blessing'],
    text: "Three Major cards reveal the unfolding of your greater destiny. Past shows the foundation; Present shows your current elevation; Future shows the heights yet to reach. Jupiter whispers: you are exactly where you need to be. Trust the unfolding."
  },
  {
    id: 'scribe-jupiter-5',
    guide: 'scribe',
    planet: 'jupiter',
    spreadType: 'mirror',
    cardPatterns: ['the-hermit', 'the-world'],
    keywords: ['wisdom', 'completion', 'enlightenment'],
    text: "The Hermit carries Jupiter's lantern; The World dances in Jupiter's light. The Scribe writes: you are approaching completion of something. Whether it is a phase, a lesson, or a cycle, fulfillment is at hand. The wisdom you have gathered will light the way forward."
  },

  // SCRIBE READINGS - Saturn Planet
  {
    id: 'scribe-saturn-1',
    guide: 'scribe',
    planet: 'saturn',
    spreadType: 'mirror',
    cardPatterns: ['the-world', 'the-hermit', 'major-arcana'],
    keywords: ['mastery', 'discipline', 'foundation', 'karma'],
    text: "Saturn tests all it touches, but through testing comes mastery. The Scribe observes: the card you have drawn is a teacher. Whatever it represents requires discipline and patience, but the mastery you gain will be unshakable. Build slowly. Build well. This foundation will last."
  },
  {
    id: 'scribe-saturn-2',
    guide: 'scribe',
    planet: 'saturn',
    spreadType: 'mirror',
    cardPatterns: ['pentacles-suit'],
    keywords: ['material foundation', 'responsibility', 'security'],
    text: "Pentacles sink deep roots under Saturn's watchful eye. The Scribe writes: what you build now must be solid. This is not a time for illusions. Focus on what is real, tangible, and lasting. Your responsibility creates your security. Tend to the foundation carefully."
  },
  {
    id: 'scribe-saturn-3',
    guide: 'scribe',
    planet: 'saturn',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['karma', 'lessons', 'inheritance', 'time'],
    text: "Three cards reveal Saturn's teaching across time. Past shows what you have learned at great cost; Present shows how you apply this knowledge; Future shows the freedom that comes from full understanding. Saturn's lessons are slow but deep. You are becoming wise."
  },
  {
    id: 'scribe-saturn-4',
    guide: 'scribe',
    planet: 'saturn',
    spreadType: 'three',
    cardPatterns: ['major-arcana'],
    keywords: ['initiation', 'boundaries', 'authority'],
    text: "Three Major cards show Saturn's initiation—the path from naïveté to mastery. Past was innocence; Present is discipline; Future is earned authority. You are being tested to be worthy of your own power. Welcome the test. It makes you real."
  },
  {
    id: 'scribe-saturn-5',
    guide: 'scribe',
    planet: 'saturn',
    spreadType: 'mirror',
    cardPatterns: ['the-emperor'],
    keywords: ['authority', 'structure', 'leadership', 'control'],
    text: "The Emperor rules with Saturn's approval. The Scribe reads: you are claiming authority over your own life. Structure is not restriction—it is freedom gained through discipline. Order what was chaotic. Lead with clarity. You have earned this power."
  },

  // SCRIBE READINGS - Sun Planet
  {
    id: 'scribe-sun-1',
    guide: 'scribe',
    planet: 'sun',
    spreadType: 'mirror',
    cardPatterns: ['the-sun', 'major-arcana'],
    keywords: ['clarity', 'joy', 'success', 'vitality'],
    text: "The Sun blazes through all shadow, and your card is illuminated with its warmth. The Scribe smiles: clarity is here. Whatever you have drawn is blessed by the Sun's unwavering light. This is a time of success, vitality, and joy. Let yourself be seen. Shine boldly."
  },
  {
    id: 'scribe-sun-2',
    guide: 'scribe',
    planet: 'sun',
    spreadType: 'mirror',
    cardPatterns: ['wands-suit', 'pentacles-suit'],
    keywords: ['radiance', 'confidence', 'authenticity'],
    text: "Under the Sun's golden gaze, there is nowhere to hide—and why would you want to? The Scribe writes: authenticity is your superpower now. Whatever you have drawn calls you to be fully yourself. The world brightens when you shine your true light. Fear is dissolved by the Sun."
  },
  {
    id: 'scribe-sun-3',
    guide: 'scribe',
    planet: 'sun',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['becoming', 'wholeness', 'radiance'],
    text: "Three cards unfold beneath the Sun's blessing. Past shows your path to self-knowledge; Present shows you claiming your own light; Future shows the radiance of your full potential. You are becoming whole. The Sun sees you completely and says: beautiful."
  },
  {
    id: 'scribe-sun-4',
    guide: 'scribe',
    planet: 'sun',
    spreadType: 'three',
    cardPatterns: ['major-arcana'],
    keywords: ['triumph', 'renewal', 'enlightenment'],
    text: "Three Major cards bask in the Sun's eternal light. Whatever challenge or shadow appeared before, the Sun burns through it. This is the time of triumph, renewal, and enlightenment. You are stepping into the full power of who you truly are."
  },
  {
    id: 'scribe-sun-5',
    guide: 'scribe',
    planet: 'sun',
    spreadType: 'mirror',
    cardPatterns: ['the-fool', 'the-magician'],
    keywords: ['potential', 'new dawn', 'birth'],
    text: "The Fool steps into the new dawn; The Magician awakens to his power. The Scribe records: you are beginning something glorious. All the conditions align for success. The universe is conspiring in your favor. Move forward with confidence and joy."
  },

  // SCRIBE READINGS - Uranus Planet
  {
    id: 'scribe-uranus-1',
    guide: 'scribe',
    planet: 'uranus',
    spreadType: 'mirror',
    cardPatterns: ['the-fool', 'the-tower', 'the-magician'],
    keywords: ['innovation', 'revolution', 'awakening', 'liberation'],
    text: "Uranus brings lightning, and your card crackles with revolutionary energy. The Scribe writes: the old way is no longer serving you. What you have drawn calls for innovation and daring. Break free from what confines you. The lightning strikes exactly where it needs to, illuminating a new path."
  },
  {
    id: 'scribe-uranus-2',
    guide: 'scribe',
    planet: 'uranus',
    spreadType: 'mirror',
    cardPatterns: ['major-arcana'],
    keywords: ['sudden change', 'awakening', 'genius'],
    text: "Uranus awakens the genius within. The Scribe observes: this Major card is an awakening. What you have been blind to will suddenly become clear. What you thought impossible will suddenly become obvious. Trust your intuitive flashes. Genius is striking."
  },
  {
    id: 'scribe-uranus-3',
    guide: 'scribe',
    planet: 'uranus',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['liberation', 'breakthrough', 'freedom'],
    text: "Three cards track your path to liberation. Past shows the chains you didn't know you wore; Present shows the moment of awakening; Future shows the freedom that follows courage. Uranus says: be yourself fully. The world needs your unique light."
  },
  {
    id: 'scribe-uranus-4',
    guide: 'scribe',
    planet: 'uranus',
    spreadType: 'three',
    cardPatterns: ['swords-suit', 'wands-suit'],
    keywords: ['rebellion', 'truth', 'radical change'],
    text: "Swords of truth and Wands of action merge under Uranus's lightning. Past shows what was false; Present shows you speaking truth; Future shows the transformation that follows honesty. Rebellion here is righteous. Change here is necessary. Be brave."
  },
  {
    id: 'scribe-uranus-5',
    guide: 'scribe',
    planet: 'uranus',
    spreadType: 'mirror',
    cardPatterns: ['the-wheel-of-fortune'],
    keywords: ['destiny reset', 'new cycle', 'fate'],
    text: "The Wheel spins under Uranus's hand, and a new cycle begins. The Scribe reads: you are being reset, repositioned, and reborn for something greater. The lightning that strikes destroys only what is false. What is true will remain and shine brighter."
  },

  // WEAVER READINGS - Moon Planet
  {
    id: 'weaver-moon-1',
    guide: 'weaver',
    planet: 'moon',
    spreadType: 'mirror',
    cardPatterns: ['the-high-priestess', 'the-moon', 'cups-suit'],
    keywords: ['connection', 'intuition', 'web of emotion'],
    text: "The Weaver reads the threads of your heart beneath the Moon's soft glow. This card is woven into the greater pattern—see how it threads back through your past and forward into your future. You are not alone. You are held in the web of all things. Trust the invisible connections."
  },
  {
    id: 'weaver-moon-2',
    guide: 'weaver',
    planet: 'moon',
    spreadType: 'mirror',
    cardPatterns: ['major-arcana'],
    keywords: ['destiny', 'interconnection', 'grace'],
    text: "The Weaver smiles: this Major card is a knot in the sacred web. The Moon teaches that all things are connected—your joy is woven with others' joy; your pain is held by the web of compassion. You are exactly where you need to be in this pattern."
  },
  {
    id: 'weaver-moon-3',
    guide: 'weaver',
    planet: 'moon',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['relational arc', 'emotional threads', 'bonding'],
    text: "Three cards show how you are woven into the lives of others and they into you. The Weaver sees: these threads bind you not in restriction but in mutual strength. Each card is a hand held, a heart recognized. You belong to something larger than yourself."
  },
  {
    id: 'weaver-moon-4',
    guide: 'weaver',
    planet: 'moon',
    spreadType: 'three',
    cardPatterns: ['cups-suit'],
    keywords: ['emotional bonds', 'family', 'love's web'],
    text: "Cups pour out their love, and the Weaver shows how these waters connect heart to heart. Past shows love's origin; Present shows its flow; Future shows its deepening. The web of love is the strongest thread of all. Tend to it carefully."
  },
  {
    id: 'weaver-moon-5',
    guide: 'weaver',
    planet: 'moon',
    spreadType: 'mirror',
    cardPatterns: ['the-empress'],
    keywords: ['nurturing web', 'mother', 'creation'],
    text: "The Empress weaves the world itself into being. The Weaver knows: you carry this creative power. What you nurture becomes real. Your presence in the lives of others creates the very fabric of their reality. Be intentional about what you weave."
  },

  // WEAVER READINGS - Mercury Planet
  {
    id: 'weaver-mercury-1',
    guide: 'weaver',
    planet: 'mercury',
    spreadType: 'mirror',
    cardPatterns: ['the-magician', 'swords-suit'],
    keywords: ['communication', 'connection', 'language of souls'],
    text: "Mercury carries messages, and the Weaver reads them carefully. This card speaks of how your words ripple through the web, touching souls in ways you may not know. Speak truthfully. Listen deeply. Words are threads that bind the world together."
  },
  {
    id: 'weaver-mercury-2',
    guide: 'weaver',
    planet: 'mercury',
    spreadType: 'mirror',
    cardPatterns: ['major-arcana'],
    keywords: ['exchange', 'understanding', 'bridge-building'],
    text: "The Weaver notes: this card is a bridge between souls. Mercury asks: who are you meant to understand? Whom are you meant to help understand you? The answer lies in this card. Be the bridge. Be the translator. Be the one who connects."
  },
  {
    id: 'weaver-mercury-3',
    guide: 'weaver',
    planet: 'mercury',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['dialogue', 'conversation', 'exchange across time'],
    text: "Three cards form a conversation—past speaks to present, present to future. The Weaver listens to all three voices. Your life is this dialogue. Listen to what each season is saying. All three speak a single truth written across time."
  },
  {
    id: 'weaver-mercury-4',
    guide: 'weaver',
    planet: 'mercury',
    spreadType: 'three',
    cardPatterns: ['swords-suit'],
    keywords: ['truth-telling', 'clarity in relationships', 'honest exchange'],
    text: "Three Swords pierce through illusion, and the Weaver sees clearly. Past shows what was hidden; Present shows the truth being spoken; Future shows the freedom of honest connection. Hard truths strengthen bonds. The Weaver trusts your words."
  },
  {
    id: 'weaver-mercury-5',
    guide: 'weaver',
    planet: 'mercury',
    spreadType: 'mirror',
    cardPatterns: ['the-hierophant'],
    keywords: ['sacred language', 'tradition shared', 'wisdom passed down'],
    text: "The Hierophant and Mercury together create a conduit for sacred knowledge. The Weaver writes: you are meant to pass something forward. The wisdom you carry belongs not to you alone but to the greater thread. Share it. Let it flow through you to others."
  },

  // WEAVER READINGS - Venus Planet
  {
    id: 'weaver-venus-1',
    guide: 'weaver',
    planet: 'venus',
    spreadType: 'mirror',
    cardPatterns: ['the-lovers', 'cups-suit'],
    keywords: ['love', 'union', 'partnership', 'harmony'],
    text: "The Weaver reads love in all its forms. This card shows how you are woven together with others in bonds of affection, attraction, and alignment. Venus asks: whom do you choose? What choices honor both yourself and the other? This card is the answer written in thread."
  },
  {
    id: 'weaver-venus-2',
    guide: 'weaver',
    planet: 'venus',
    spreadType: 'mirror',
    cardPatterns: ['major-arcana'],
    keywords: ['attraction', 'magnetism', 'appreciation'],
    text: "Under Venus's gaze, the Weaver sees you as the world sees you—beautiful, valuable, magnetic. This Major card reflects something precious in you that draws others near. Do not question it. Accept it. Your presence is a gift to the weave."
  },
  {
    id: 'weaver-venus-3',
    guide: 'weaver',
    planet: 'venus',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['relationship arc', 'deepening love', 'partnership'],
    text: "Three cards show the spiral of relationship: how you came together, where you stand now, where you are becoming. The Weaver sees: love is not static. It spirals, grows, transforms. What you have woven requires tending, but it is strong."
  },
  {
    id: 'weaver-venus-4',
    guide: 'weaver',
    planet: 'venus',
    spreadType: 'three',
    cardPatterns: ['pentacles-suit'],
    keywords: ['shared resources', 'mutual support', 'abundance together'],
    text: "Pentacles multiply when shared. The Weaver reads: what you own, you own together. The wealth is not just material—it is emotional, spiritual, creative. You are building something lasting with another. This is the deepest magic."
  },
  {
    id: 'weaver-venus-5',
    guide: 'weaver',
    planet: 'venus',
    spreadType: 'mirror',
    cardPatterns: ['the-empress'],
    keywords: ['mutual nurturing', 'creative partnership', 'generosity'],
    text: "The Empress weaves others into herself and is woven by them in turn. The Weaver reads: you nurture and are nurtured. You create and are created by the presence of those you love. This is the ultimate magic—we make each other real."
  },

  // WEAVER READINGS - Mars Planet
  {
    id: 'weaver-mars-1',
    guide: 'weaver',
    planet: 'mars',
    spreadType: 'mirror',
    cardPatterns: ['the-tower', 'swords-suit', 'wands-suit'],
    keywords: ['conflict', 'passion', 'transformation through tension'],
    text: "The Weaver does not shy from Mars's challenge. This card speaks of passion, conflict, transformation. But see: conflict is only destructive if not woven carefully. The Weaver asks: can you fight for what matters while holding those you love? This is the art you are learning."
  },
  {
    id: 'weaver-mars-2',
    guide: 'weaver',
    planet: 'mars',
    spreadType: 'mirror',
    cardPatterns: ['major-arcana'],
    keywords: ['power', 'force', 'assertion', 'will'],
    text: "Mars teaches that some threads must be pulled tight. This Major card shows your power asserting itself. The Weaver notes: do not apologize for your strength. It is needed in the pattern. Assert yourself. The web needs your strength to hold its shape."
  },
  {
    id: 'weaver-mars-3',
    guide: 'weaver',
    planet: 'mars',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['conflict resolution', 'integration of tension', 'becoming whole'],
    text: "Three cards show past tension, present challenge, and future peace. The Weaver reads: conflict is not failure—it is the friction through which growth happens. You are integrating something through struggle. You will be stronger for it."
  },
  {
    id: 'weaver-mars-4',
    guide: 'weaver',
    planet: 'mars',
    spreadType: 'three',
    cardPatterns: ['wands-suit'],
    keywords: ['passionate exchange', 'creative friction', 'inspired action together'],
    text: "Wands clash and create sparks—the Weaver smiles. This is the creative friction of partnership. Past shows the spark; Present shows the heat; Future shows the light created by your combined passion. Let this tension energize you. It means you care deeply."
  },
  {
    id: 'weaver-mars-5',
    guide: 'weaver',
    planet: 'mars',
    spreadType: 'mirror',
    cardPatterns: ['the-chariot'],
    keywords: ['driving force', 'willpower in service to others', 'mastery'],
    text: "The Chariot races, and the Weaver sees: you are learning to drive your passion in service to the larger pattern. Mars teaches not just force, but directed force. Not just will, but will in alignment with something larger than yourself. This is true power."
  },

  // WEAVER READINGS - Jupiter Planet
  {
    id: 'weaver-jupiter-1',
    guide: 'weaver',
    planet: 'jupiter',
    spreadType: 'mirror',
    cardPatterns: ['the-wheel-of-fortune', 'major-arcana'],
    keywords: ['expansion', 'generosity', 'blessing others'],
    text: "Jupiter expands all it touches, and the Weaver sees the wave of blessing spreading through your web. This card shows abundance not to be hoarded but to be shared. The more you give, the more flows through. Your generosity creates the pattern."
  },
  {
    id: 'weaver-jupiter-2',
    guide: 'weaver',
    planet: 'jupiter',
    spreadType: 'mirror',
    cardPatterns: ['pentacles-suit'],
    keywords: ['shared prosperity', 'mutual wealth', 'community abundance'],
    text: "Pentacles flow like honey through the web. The Weaver reads: abundance is not individual—it is collective. What you have, you share. What others have strengthens you. This is the magic of true community. You are learning this."
  },
  {
    id: 'weaver-jupiter-3',
    guide: 'weaver',
    planet: 'jupiter',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['journey together', 'expansion of bonds', 'growing connection'],
    text: "Three cards show your journey with others. Past shows where you began together; Present shows your current closeness; Future shows the vast territories you will explore together. Jupiter teaches: relationships grow by moving forward. Never stop exploring with those you love."
  },
  {
    id: 'weaver-jupiter-4',
    guide: 'weaver',
    planet: 'jupiter',
    spreadType: 'three',
    cardPatterns: ['major-arcana'],
    keywords: ['shared destiny', 'collective blessing', 'unified path'],
    text: "Three Major cards reveal a shared destiny. The Weaver sees: you and others are woven together in something larger than any of you alone. This is not chance. This is the universe conspiring to bring you together. Trust this gathering."
  },
  {
    id: 'weaver-jupiter-5',
    guide: 'weaver',
    planet: 'jupiter',
    spreadType: 'mirror',
    cardPatterns: ['the-world', 'the-hermit'],
    keywords: ['completion together', 'sharing wisdom', 'wholeness with others'],
    text: "The World completes and the Hermit's light spreads. The Weaver writes: you are approaching a completion that will deepen your bonds. Wisdom gained alone means nothing until it is shared. This is your moment to illuminate others' paths."
  },

  // WEAVER READINGS - Saturn Planet
  {
    id: 'weaver-saturn-1',
    guide: 'weaver',
    planet: 'saturn',
    spreadType: 'mirror',
    cardPatterns: ['the-world', 'the-hermit', 'major-arcana'],
    keywords: ['karmic bonds', 'soul contracts', 'deep commitment'],
    text: "Saturn weaves the deepest threads—the ones forged through time and tested by experience. This card shows a bond that will last. The Weaver reads: the people tied to you by Saturn's knot are yours for lifetimes. Care for these bonds. They are sacred."
  },
  {
    id: 'weaver-saturn-2',
    guide: 'weaver',
    planet: 'saturn',
    spreadType: 'mirror',
    cardPatterns: ['pentacles-suit'],
    keywords: ['building legacy', 'family foundation', 'inherited strength'],
    text: "Pentacles set in stone—the Weaver sees what you are building to last. This is legacy work. What you create now will hold your family, your community, your bloodline. Tend to it carefully. The foundation you lay now will shelter generations."
  },
  {
    id: 'weaver-saturn-3',
    guide: 'weaver',
    planet: 'saturn',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['karmic arc', 'lessons through relationship', 'testing love'],
    text: "Three cards show how you are tested through relationship. Past shows the trial; Present shows your learning; Future shows the strength gained. Saturn asks: what is love but commitment through the hard times? You are becoming worthy of deep bonds."
  },
  {
    id: 'weaver-saturn-4',
    guide: 'weaver',
    planet: 'saturn',
    spreadType: 'three',
    cardPatterns: ['major-arcana'],
    keywords: ['ancestral patterns', 'inherited wisdom', 'karmic clearing'],
    text: "Three Major cards show your ancestors looking through your eyes, your parents' lessons living in your choices, your children's futures being shaped by your actions. The Weaver reads: you are a link in a chain. Honor where you come from. Be worthy of where you go."
  },
  {
    id: 'weaver-saturn-5',
    guide: 'weaver',
    planet: 'saturn',
    spreadType: 'mirror',
    cardPatterns: ['the-emperor'],
    keywords: ['leadership', 'authority earned through bonds', 'stewardship'],
    text: "The Emperor rules with Saturn's approval, and the Weaver bows. You are becoming a holder of the web—an elder, a guide, a keeper of structure. This is a sacred responsibility. Those who follow you are safe in your hands."
  },

  // WEAVER READINGS - Sun Planet
  {
    id: 'weaver-sun-1',
    guide: 'weaver',
    planet: 'sun',
    spreadType: 'mirror',
    cardPatterns: ['the-sun', 'major-arcana'],
    keywords: ['shining together', 'mutual radiance', 'shared light'],
    text: "The Sun shines on all equally, and the Weaver sees your light mingled with others' light, creating something brighter than you alone. This card speaks of shared joy, mutual success, the radiance of those you love reflected in your face. You illuminate each other."
  },
  {
    id: 'weaver-sun-2',
    guide: 'weaver',
    planet: 'sun',
    spreadType: 'mirror',
    cardPatterns: ['wands-suit', 'pentacles-suit'],
    keywords: ['creative collaboration', 'shared purpose', 'unified vision'],
    text: "Under the Sun's brilliant gaze, the Weaver reads: you are creating something beautiful together. Whether it is art, family, business, or friendship, your shared vision is taking shape in golden light. Trust what you are building together. The universe approves."
  },
  {
    id: 'weaver-sun-3',
    guide: 'weaver',
    planet: 'sun',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['journey toward wholeness', 'becoming visible together', 'shared transformation'],
    text: "Three cards show how you become whole together. Past shows where separation ended; Present shows you stepping into shared light; Future shows the radiance of your unified being. The Weaver reads: you were made for this. Stop hiding. Shine together."
  },
  {
    id: 'weaver-sun-4',
    guide: 'weaver',
    planet: 'sun',
    spreadType: 'three',
    cardPatterns: ['major-arcana'],
    keywords: ['collective triumph', 'shared destiny', 'unified blessing'],
    text: "Three Major cards glow with the Sun's warmth. The Weaver reads: you are approaching a triumph that involves everyone you love. This is not your victory alone—it is ours, together. The universe celebrates you as a collective. Know your worth as part of this blessed whole."
  },
  {
    id: 'weaver-sun-5',
    guide: 'weaver',
    planet: 'sun',
    spreadType: 'mirror',
    cardPatterns: ['the-fool', 'the-magician'],
    keywords: ['new dawn together', 'shared beginning', 'unified potential'],
    text: "The Fool and Magician step into the new dawn hand in hand. The Weaver records: you are beginning something glorious with others. All the conditions align. The universe is conspiring to bring you together in mutual triumph. Yes. A thousand times yes."
  },

  // WEAVER READINGS - Uranus Planet
  {
    id: 'weaver-uranus-1',
    guide: 'weaver',
    planet: 'uranus',
    spreadType: 'mirror',
    cardPatterns: ['the-fool', 'the-tower', 'the-magician'],
    keywords: ['revolution together', 'liberation of bonds', 'awakening others'],
    text: "Uranus strikes with lightning, and the Weaver watches the web transformed. This card asks: what needs to be broken so something truer can form? Perhaps a relationship needs new structure. Perhaps a friendship needs new honesty. The lightning burns away what is false. Let it."
  },
  {
    id: 'weaver-uranus-2',
    guide: 'weaver',
    planet: 'uranus',
    spreadType: 'mirror',
    cardPatterns: ['major-arcana'],
    keywords: ['awakening collective', 'liberation through others', 'mutual breakthrough'],
    text: "The Weaver sees: you are the catalyst. Others awaken because you awaken. You break free and others follow. This Major card is not just your revolution—it is the beginning of something that will ripple through everyone you touch. Be brave. Others need your courage."
  },
  {
    id: 'weaver-uranus-3',
    guide: 'weaver',
    planet: 'uranus',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['liberation arc', 'breaking free together', 'new form of connection'],
    text: "Three cards show the lightning strike and its aftermath. Past shows the constraints; Present shows the moment of breaking; Future shows the new form your bonds take. The Weaver reads: you are liberating each other. This is holy work. Continue."
  },
  {
    id: 'weaver-uranus-4',
    guide: 'weaver',
    planet: 'uranus',
    spreadType: 'three',
    cardPatterns: ['swords-suit', 'wands-suit'],
    keywords: ['radical truth', 'honest revolution', 'inspired change together'],
    text: "Swords and Wands merge in Uranus's lightning. Past shows the truth being hidden; Present shows you speaking it; Future shows others' liberation through your honesty. The Weaver knows: the hardest truth sets the most people free. Be willing to speak it."
  },
  {
    id: 'weaver-uranus-5',
    guide: 'weaver',
    planet: 'uranus',
    spreadType: 'mirror',
    cardPatterns: ['the-wheel-of-fortune'],
    keywords: ['collective reset', 'new destiny cycle', 'shared rebirth'],
    text: "The Wheel spins in Uranus's grip, and a new cycle begins for you and all you are connected to. The Weaver reads: what is being reset was meant to be reset. Trust the lightning. The new form will be more aligned, more authentic, more true."
  },

  // PSYCHIC READINGS - Moon Planet
  {
    id: 'psychic-moon-1',
    guide: 'psychic',
    planet: 'moon',
    spreadType: 'mirror',
    cardPatterns: ['the-high-priestess', 'the-moon', 'cups-suit'],
    keywords: ['inner sight', 'dreaming', 'shadow work', 'third eye'],
    text: "The Psychic's third eye opens wide. This card speaks of what your inner sight is revealing. Trust the dreams that come; trust the intuitions that whisper. The Moon is your teacher in the dark. What you see in shadow is as true as what you see in light. Integration is the work now."
  },
  {
    id: 'psychic-moon-2',
    guide: 'psychic',
    planet: 'moon',
    spreadType: 'mirror',
    cardPatterns: ['major-arcana'],
    keywords: ['channeling', 'receiving guidance', 'connection to source'],
    text: "The Psychic feels something moving through you. This Major card is a transmission—a message from something beyond you, moving through you toward the world. You are a conduit. Open yourself. Let wisdom flow through. Your body is a vessel for something vast."
  },
  {
    id: 'psychic-moon-3',
    guide: 'psychic',
    planet: 'moon',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['inner journey', 'underworld descent', 'shadow meeting light'],
    text: "Three cards map your journey into the deep. Past shows what sent you into darkness; Present shows you meeting yourself there; Future shows integration and return to light. The Psychic reads: what you learn in the dark is sacred. Do not flee it. Embrace it."
  },
  {
    id: 'psychic-moon-4',
    guide: 'psychic',
    planet: 'moon',
    spreadType: 'three',
    cardPatterns: ['cups-suit'],
    keywords: ['emotional psychism', 'empathic gift', 'feeling others' truths'],
    text: "Three Cups show how deeply you feel—not just your own emotions but the emotions of all around you. The Psychic sees your gift: you are an empath, a feeler of collective energy. This gift is both blessing and burden. Learn to hold it wisely."
  },
  {
    id: 'psychic-moon-5',
    guide: 'psychic',
    planet: 'moon',
    spreadType: 'mirror',
    cardPatterns: ['the-empress'],
    keywords: ['psychic creativity', 'channeling through creation', 'birthing new worlds'],
    text: "The Empress channels the fertility of the cosmos. The Psychic reads: your visions can be made real. What you see in the otherworld can be born into this one through your hands, your words, your creativity. You are a midwife of new realities."
  },

  // PSYCHIC READINGS - Mercury Planet
  {
    id: 'psychic-mercury-1',
    guide: 'psychic',
    planet: 'mercury',
    spreadType: 'mirror',
    cardPatterns: ['the-magician', 'swords-suit'],
    keywords: ['mental clarity', 'psychic communication', 'telepathy'],
    text: "The Psychic perceives your thoughts, your messages, moving through invisible channels. Mercury amplifies this. This card shows clarity of mind married to psychic sight. You can perceive what others cannot articulate. You translate the unseen into words. This gift is needed."
  },
  {
    id: 'psychic-mercury-2',
    guide: 'psychic',
    planet: 'mercury',
    spreadType: 'mirror',
    cardPatterns: ['major-arcana'],
    keywords: ['higher mind', 'gnosis', 'divine knowing'],
    text: "The Psychic perceives knowledge coming directly—not from learning but from knowing. Mercury carries messages from higher realms. This Major card is a revelation of something you always knew. Trust it. Your intuitive knowing is as valid as rational thought."
  },
  {
    id: 'psychic-mercury-3',
    guide: 'psychic',
    planet: 'mercury',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['conversation with higher self', 'receiving teaching', 'messages across time'],
    text: "Three cards form a conversation with something beyond you. Past shows what your higher self was teaching; Present shows the lesson being absorbed; Future shows the wisdom you will share. The Psychic reads: keep the conversation open. Stay in dialogue with what knows you."
  },
  {
    id: 'psychic-mercury-4',
    guide: 'psychic',
    planet: 'mercury',
    spreadType: 'three',
    cardPatterns: ['swords-suit'],
    keywords: ['psychic clarity', 'cutting through illusion', 'perceiving truth'],
    text: "Three Swords cut through the Veil with Mercury's precision. The Psychic sees what others miss. Past shows the illusion; Present shows your sight piercing it; Future shows the truth now visible. Your clarity is a gift to others. Speak what you see."
  },
  {
    id: 'psychic-mercury-5',
    guide: 'psychic',
    planet: 'mercury',
    spreadType: 'mirror',
    cardPatterns: ['the-hierophant'],
    keywords: ['channeling sacred knowledge', 'priesthood', 'initiate's teachings'],
    text: "The Hierophant opens the sacred mystery, and the Psychic is initiated. You are being shown something that is not meant for all ears—only for those ready to receive it. This knowledge carries responsibility. Protect it. Share it only with those who hunger for it."
  },

  // PSYCHIC READINGS - Venus Planet
  {
    id: 'psychic-venus-1',
    guide: 'psychic',
    planet: 'venus',
    spreadType: 'mirror',
    cardPatterns: ['the-lovers', 'cups-suit'],
    keywords: ['divine love', 'soul recognition', 'mirror of divinity'],
    text: "The Psychic perceives something moving beneath the surface of attraction—soul recognition, divine mirroring. This card shows love not as sentiment but as spiritual practice. The person or thing you are drawn to is showing you something about yourself you need to know. This is sacred."
  },
  {
    id: 'psychic-venus-2',
    guide: 'psychic',
    planet: 'venus',
    spreadType: 'mirror',
    cardPatterns: ['major-arcana'],
    keywords: ['heart opening', 'spiritual beauty', 'divine feminine'],
    text: "The Psychic feels your heart opening to something vast. This Major card is touched by Venus's grace. Whatever it represents is beautiful in a way that transcends ordinary aesthetics. You are being invited to see the divine in all things. This is a spiritual awakening."
  },
  {
    id: 'psychic-venus-3',
    guide: 'psychic',
    planet: 'venus',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['soul journey', 'spiritual partnership', 'divine union'],
    text: "Three cards show the unfolding of a spiritual love. Past shows what taught your heart to open; Present shows you in union with something beautiful; Future shows the transformation of your soul through this love. The Psychic reads: this is sacred. Tend to it as a spiritual practice."
  },
  {
    id: 'psychic-venus-4',
    guide: 'psychic',
    planet: 'venus',
    spreadType: 'three',
    cardPatterns: ['pentacles-suit'],
    keywords: ['abundance of spirit', 'material grace', 'blessing'],
    text: "Three Pentacles glow with Venus's blessing. What you give is returned sevenfold. The Psychic sees: your generosity of spirit creates a current of abundance. Give more. Trust more. The universe conspires to fill what flows out from you."
  },
  {
    id: 'psychic-venus-5',
    guide: 'psychic',
    planet: 'venus',
    spreadType: 'mirror',
    cardPatterns: ['the-empress'],
    keywords: ['creative divine', 'birth of worlds', 'fertile vision'],
    text: "The Empress channels Venus's creativity, and the Psychic sees: you are a creator of beauty and meaning. What you bring into the world is needed. Your visions shape reality for others. Birth what wants to be born through you. The universe awaits your creation."
  },

  // PSYCHIC READINGS - Mars Planet
  {
    id: 'psychic-mars-1',
    guide: 'psychic',
    planet: 'mars',
    spreadType: 'mirror',
    cardPatterns: ['the-tower', 'swords-suit', 'wands-suit'],
    keywords: ['spiritual warrior', 'sacred fire', 'aligned power'],
    text: "The Psychic perceives fire moving through you—not destructive, but purifying. Mars teaches that power aligned with spirit is unstoppable. This card shows you learning to channel your power for sacred purpose. You are becoming a spiritual warrior. Fight for what is true."
  },
  {
    id: 'psychic-mars-2',
    guide: 'psychic',
    planet: 'mars',
    spreadType: 'mirror',
    cardPatterns: ['major-arcana'],
    keywords: ['willpower awakening', 'spiritual assertion', 'claiming power'],
    text: "The Psychic feels your will aligning with universal will. This Major card is your personal power recognized by something greater. You are not separate from the force that moves through all things. Claim your power. It is not ego—it is alignment."
  },
  {
    id: 'psychic-mars-3',
    guide: 'psychic',
    planet: 'mars',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['warrior's path', 'righteous action', 'sacred battle'],
    text: "Three cards show your journey into power and purpose. Past shows the struggle that forged you; Present shows you claiming your strength; Future shows you wielding it in service to something sacred. The Psychic reads: this is your calling. Be fierce. Be righteous. Be true."
  },
  {
    id: 'psychic-mars-4',
    guide: 'psychic',
    planet: 'mars',
    spreadType: 'three',
    cardPatterns: ['wands-suit'],
    keywords: ['creative passion', 'inspired action', 'channeling divine fire'],
    text: "Three Wands blaze with Martian fire. The Psychic sees your passion as a conduit for divine energy. Past shows inspiration arriving; Present shows you embodying it; Future shows the light you cast for others. This fire was meant to be shared. Do not dim it."
  },
  {
    id: 'psychic-mars-5',
    guide: 'psychic',
    planet: 'mars',
    spreadType: 'mirror',
    cardPatterns: ['the-chariot'],
    keywords: ['mastery of self', 'divine will', 'destiny driving'],
    text: "The Chariot moves at Mars's command, guided by spirit. The Psychic reads: you are learning to align your will with a will greater than yourself. This is true mastery—not control but cooperation with the divine. Drive forward. You are guided."
  },

  // PSYCHIC READINGS - Jupiter Planet
  {
    id: 'psychic-jupiter-1',
    guide: 'psychic',
    planet: 'jupiter',
    spreadType: 'mirror',
    cardPatterns: ['the-wheel-of-fortune', 'major-arcana'],
    keywords: ['spiritual expansion', 'cosmic blessing', 'grace',],
    text: "The Psychic perceives the hand of the cosmos blessing you. Jupiter expands all it touches, and your spiritual vision is expanding. This card shows you being initiated into larger mysteries. You are being called to a greater service. Accept the calling."
  },
  {
    id: 'psychic-jupiter-2',
    guide: 'psychic',
    planet: 'jupiter',
    spreadType: 'mirror',
    cardPatterns: ['pentacles-suit'],
    keywords: ['spiritual abundance', 'cosmic support', 'universe providing'],
    text: "Jupiter pours blessings, and the Psychic sees them flowing toward you. This is not luck—it is divine support for your evolution. The universe provides for those aligned with their purpose. Trust in abundance. It is your birthright as a conscious being."
  },
  {
    id: 'psychic-jupiter-3',
    guide: 'psychic',
    planet: 'jupiter',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['spiritual journey', 'evolving consciousness', 'ascending path'],
    text: "Three cards show your spiritual evolution across time. Past shows where wisdom came from; Present shows your current elevation; Future shows the transcendence awaiting. The Psychic reads: you are ascending. Keep climbing. The view gets more beautiful."
  },
  {
    id: 'psychic-jupiter-4',
    guide: 'psychic',
    planet: 'jupiter',
    spreadType: 'three',
    cardPatterns: ['major-arcana'],
    keywords: ['cosmic initiation', 'mystical revelation', 'enlightenment path'],
    text: "Three Major cards reveal your initiation into cosmic mysteries. The Psychic perceives: you are being prepared for something. Whatever happens next, it is part of your soul's plan. Surrender to it. The universe knows what it is doing."
  },
  {
    id: 'psychic-jupiter-5',
    guide: 'psychic',
    planet: 'jupiter',
    spreadType: 'mirror',
    cardPatterns: ['the-world', 'the-hermit'],
    keywords: ['enlightenment', 'wholeness', 'light sharing'],
    text: "The World completes and the Hermit's light shines forth. The Psychic reads: you are approaching enlightenment in some area. What you learn will be meant to teach others. This is the way of the initiate—completion then transmission. Your light will shine."
  },

  // PSYCHIC READINGS - Saturn Planet
  {
    id: 'psychic-saturn-1',
    guide: 'psychic',
    planet: 'saturn',
    spreadType: 'mirror',
    cardPatterns: ['the-world', 'the-hermit', 'major-arcana'],
    keywords: ['spiritual maturity', 'earned wisdom', 'initiation',],
    text: "The Psychic sees the mark of Saturn upon your soul—the mark of one who has been tested and has endured. This card shows spiritual maturity earned through hardship. Your suffering has been your schooling. You are being initiated into the deeper mysteries. Welcome to the circle of elders."
  },
  {
    id: 'psychic-saturn-2',
    guide: 'psychic',
    planet: 'saturn',
    spreadType: 'mirror',
    cardPatterns: ['pentacles-suit'],
    keywords: ['grounding spirituality', 'manifestation', 'making the sacred real'],
    text: "Saturn grounds spirit into matter. The Psychic reads: your spiritual experiences must become real in the world. This card asks: what are you building that lasts? How are you making your inner truth into outer reality? This is your work now."
  },
  {
    id: 'psychic-saturn-3',
    guide: 'psychic',
    planet: 'saturn',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['karmic teaching', 'soul lessons', 'past life echoes'],
    text: "Three cards reveal your karmic journey. Past shows what your soul has come to learn; Present shows you in the midst of learning; Future shows the wisdom gained. The Psychic sees: this is not accident. Your soul chose these lessons. Honor them."
  },
  {
    id: 'psychic-saturn-4',
    guide: 'psychic',
    planet: 'saturn',
    spreadType: 'three',
    cardPatterns: ['major-arcana'],
    keywords: ['ancestral wisdom', 'inherited gifts', 'lineage blessing'],
    text: "Three Major cards show your place in the great chain of being. Your ancestors bless you. Your lineage flows through you. The Psychic reads: you carry gifts that have been passed down. Honor this legacy. Pass it forward with wisdom."
  },
  {
    id: 'psychic-saturn-5',
    guide: 'psychic',
    planet: 'saturn',
    spreadType: 'mirror',
    cardPatterns: ['the-emperor'],
    keywords: ['spiritual authority', 'elder presence', 'elder's teaching'],
    text: "The Emperor rules with Saturn's approval, crowned by initiation. The Psychic bows: you are becoming an elder, a keeper of sacred knowledge, a guide for others. This is a high calling. You have been tested and found worthy. Lead with wisdom."
  },

  // PSYCHIC READINGS - Sun Planet
  {
    id: 'psychic-sun-1',
    guide: 'psychic',
    planet: 'sun',
    spreadType: 'mirror',
    cardPatterns: ['the-sun', 'major-arcana'],
    keywords: ['enlightenment', 'awakening', 'full luminosity'],
    text: "The Psychic perceives the light within you blazing at full power. This card is your awakening—not from sleep but from illusion. You are remembering who you are. The Sun burns away all pretense. You stand revealed. Naked. True. Beautiful."
  },
  {
    id: 'psychic-sun-2',
    guide: 'psychic',
    planet: 'sun',
    spreadType: 'mirror',
    cardPatterns: ['wands-suit', 'pentacles-suit'],
    keywords: ['divine spark', 'creative light', 'authentic power'],
    text: "The Psychic feels the divine spark within you flaming. You are not separate from Source. You are a localized expression of divine consciousness. This card shows you claiming this truth. Stop hiding your light. The world needs your brilliance."
  },
  {
    id: 'psychic-sun-3',
    guide: 'psychic',
    planet: 'sun',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['transformation toward wholeness', 'integration of self', 'full becoming'],
    text: "Three cards show your journey toward your true self. Past shows fragmentation; Present shows you gathering your pieces; Future shows you unified and radiant. The Psychic reads: you are becoming whole. The light you shine is the light of integration. Be proud."
  },
  {
    id: 'psychic-sun-4',
    guide: 'psychic',
    planet: 'sun',
    spreadType: 'three',
    cardPatterns: ['major-arcana'],
    keywords: ['cosmic consciousness', 'unity realization', 'oneness'],
    text: "Three Major cards glow with realization. The Psychic perceives: you are approaching understanding of your unity with all things. The boundaries between self and other are dissolving. This is enlightenment—the recognition that you are the universe knowing itself."
  },
  {
    id: 'psychic-sun-5',
    guide: 'psychic',
    planet: 'sun',
    spreadType: 'mirror',
    cardPatterns: ['the-fool', 'the-magician'],
    keywords: ['rebirth', 'new consciousness', 'enlightened beginning'],
    text: "The Fool steps into the new dawn as the Magician, awakened and powerful. The Psychic reads: you are beginning anew from a place of enlightenment. The fool becomes the sage. The innocent becomes the conscious. This is rebirth into your true nature."
  },

  // PSYCHIC READINGS - Uranus Planet
  {
    id: 'psychic-uranus-1',
    guide: 'psychic',
    planet: 'uranus',
    spreadType: 'mirror',
    cardPatterns: ['the-fool', 'the-tower', 'the-magician'],
    keywords: ['spiritual awakening', 'sudden gnosis', 'enlightenment strike'],
    text: "The Psychic feels the lightning of awakening moving through you. This is not gentle unfolding—this is sudden, shattering, absolute recognition. The Fool becomes the Magician in a single bolt. Your consciousness is expanding exponentially. Hold on. You are becoming something new."
  },
  {
    id: 'psychic-uranus-2',
    guide: 'psychic',
    planet: 'uranus',
    spreadType: 'mirror',
    cardPatterns: ['major-arcana'],
    keywords: ['genius awakening', 'novel perception', 'divine wildness'],
    text: "The Psychic perceives the genius within you being activated. This is not conventional wisdom—it is radical knowing, intuitive brilliance, sudden clarity that has no rational explanation. Trust it. This is genius coming online. You are being activated for something unprecedented."
  },
  {
    id: 'psychic-uranus-3',
    guide: 'psychic',
    planet: 'uranus',
    spreadType: 'three',
    cardPatterns: [],
    keywords: ['quantum leap', 'paradigm shift', 'consciousness jump'],
    text: "Three cards show discontinuous transformation. Past and Present are separated by an abyss—the lightning strike. Future shows consciousness on a new frequency. The Psychic reads: you cannot go back. You can only go forward into new awareness. Embrace the strangeness."
  },
  {
    id: 'psychic-uranus-4',
    guide: 'psychic',
    planet: 'uranus',
    spreadType: 'three',
    cardPatterns: ['swords-suit', 'wands-suit'],
    keywords: ['radical truth', 'spiritual revolution', 'awakening others'],
    text: "Three cards show truth striking like lightning through illusion. The Psychic sees: you will become a transmitter of awakening consciousness. Others will feel the lightning through you. Your words, your presence will initiate others. You are becoming an instrument of transformation."
  },
  {
    id: 'psychic-uranus-5',
    guide: 'psychic',
    planet: 'uranus',
    spreadType: 'mirror',
    cardPatterns: ['the-wheel-of-fortune'],
    keywords: ['evolutionary leap', 'consciousness evolution', 'new cycle of being'],
    text: "The Wheel turns by Uranus's hand into a new cycle of consciousness. The Psychic perceives: you are not just changing—you are evolving as a being. What was possible before is not possible now. What is possible now could not have been before. You are becoming new."
  }
];

// Export for use in game-model.html
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FINAL_READINGS;
}

// Ensure global availability in browser
if (typeof window !== 'undefined') {
  window.FINAL_READINGS = FINAL_READINGS;
}
