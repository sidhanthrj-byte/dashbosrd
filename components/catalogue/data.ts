// Relive Events — SFX Machine Catalogue data
// Effect types drive the live particle animations in EffectCanvas.tsx

export type EffectType =
  | 'sparks'
  | 'spin-sparks'
  | 'spin-pyro'
  | 'co2'
  | 'eco2'
  | 'co2-gun'
  | 'confetti-flow'
  | 'confetti-dmx'
  | 'confetti-aero'
  | 'flame'
  | 'cold-fire'
  | 'pyro-gun'
  | 'bubbles'
  | 'smoke-bubbles';

export interface Spec {
  label: string;
  value: string;
}

export interface Machine {
  id: string;
  name: string;
  categoryId: string;
  tagline: string;
  description: string;
  effect: EffectType;
  hero: boolean; // show larger card
  specs: Spec[];
  bestFor: string[];
  safety: string;
  hue: number; // accent hue used for glow/gradients
}

export interface Category {
  id: string;
  name: string;
  short: string;
  hue: number;
  blurb: string;
}

export const categories: Category[] = [
  {
    id: 'cold-spark',
    name: 'Cold Sparks',
    short: 'Sparks',
    hue: 40,
    blurb: 'Touch-safe spark fountains — no fire, no smoke, no heat warnings.',
  },
  {
    id: 'cryo',
    name: 'Cryo & CO₂',
    short: 'CO₂',
    hue: 190,
    blurb: 'Ice-white blasts and cooling fog that hit the beat.',
  },
  {
    id: 'confetti',
    name: 'Confetti',
    short: 'Confetti',
    hue: 330,
    blurb: 'From gentle snow to stadium-scale explosions of colour.',
  },
  {
    id: 'flame-pyro',
    name: 'Flame & Pyro',
    short: 'Pyro',
    hue: 18,
    blurb: 'Real heat and choreographed fire for the biggest reveals.',
  },
  {
    id: 'atmosphere',
    name: 'Atmosphere',
    short: 'Bubbles',
    hue: 265,
    blurb: 'Dreamy, playful texture that fills a room with wonder.',
  },
];

export const machines: Machine[] = [
  // ---------------- COLD SPARKS ----------------
  {
    id: 'sparkler-machine',
    name: 'Sparkler Machine',
    categoryId: 'cold-spark',
    tagline: 'The safe indoor spark fountain everyone films',
    description:
      'A cold-spark fountain that throws a glittering column of sparks into the air — yet the sparks are cool to the touch. No flame, no smoke and no fire alarms, so it runs happily indoors, over a dance floor or right beside your guests.',
    effect: 'sparks',
    hero: true,
    specs: [
      { label: 'Spark height', value: '1 – 5 m (adjustable)' },
      { label: 'Placement', value: 'Indoor & outdoor' },
      { label: 'Control', value: 'DMX or wireless remote' },
      { label: 'Consumable', value: 'Granular spark powder' },
    ],
    bestFor: ['First dance', 'Grand entrance', 'Cake reveal', 'Stage moments'],
    safety: 'Cold to the touch • No open flame • No smoke — safe near guests and indoors.',
    hue: 42,
  },
  {
    id: 'spin-sparkler',
    name: 'Spin Sparkler',
    categoryId: 'cold-spark',
    tagline: 'A spinning halo of cold sparks',
    description:
      'Rotating arms whirl cold sparks into a glowing circular ring — a hypnotic centrepiece that reads beautifully on camera. All the safety of cold spark technology with a mesmerising spinning signature.',
    effect: 'spin-sparks',
    hero: false,
    specs: [
      { label: 'Pattern', value: 'Circular spark ring' },
      { label: 'Spark height', value: '1 – 3 m' },
      { label: 'Placement', value: 'Indoor & outdoor' },
      { label: 'Control', value: 'DMX or remote' },
    ],
    bestFor: ['Stage backdrops', 'Reveals', 'Photo moments', 'Product launches'],
    safety: 'Cold spark technology • No flame or smoke.',
    hue: 46,
  },
  {
    id: 'spin-pyro',
    name: 'Spin Pyro',
    categoryId: 'cold-spark',
    tagline: 'Catherine-wheel energy, cold-spark safe',
    description:
      'A rotating pyro effect that flings sparks outward in a dynamic wheel of light. It brings the drama of a classic spinning firework while keeping the touch-safe, smoke-free benefits of modern cold-spark gear.',
    effect: 'spin-pyro',
    hero: false,
    specs: [
      { label: 'Pattern', value: 'Rotating spark wheel' },
      { label: 'Reach', value: '2 – 3 m radius' },
      { label: 'Placement', value: 'Indoor & outdoor' },
      { label: 'Control', value: 'DMX or remote' },
    ],
    bestFor: ['Finales', 'DJ risers', 'Festival stages', 'Countdowns'],
    safety: 'Cold spark technology • Guest-friendly clearances.',
    hue: 38,
  },

  // ---------------- CRYO & CO2 ----------------
  {
    id: 'co2-jet',
    name: 'CO₂ Jet',
    categoryId: 'cryo',
    tagline: 'The ice-white blast that owns the drop',
    description:
      'Fires a towering plume of cryogenic white fog on cue — instant, loud and impossibly crisp. Powered by a liquid CO₂ cylinder, it cools the room and lands every beat drop with a satisfying rush.',
    effect: 'co2',
    hero: true,
    specs: [
      { label: 'Plume height', value: 'Up to 8 – 10 m' },
      { label: 'Power source', value: 'Liquid CO₂ cylinder' },
      { label: 'Control', value: 'DMX or remote' },
      { label: 'Vibe', value: 'Club / concert drop' },
    ],
    bestFor: ['Beat drops', 'DJ sets', 'Big reveals', 'Cooling the crowd'],
    safety: 'Requires ventilation & clear headroom • Operated by trained crew.',
    hue: 190,
  },
  {
    id: 'eco2-jet',
    name: 'eCO₂ Jet',
    categoryId: 'cryo',
    tagline: 'CO₂ drama — without the gas bottles',
    description:
      'All the white-plume theatre of a CO₂ jet, generated electrically from fluid instead of gas cylinders. No heavy tanks to hire, move or refill — just plug in, and get repeatable blasts with far lower running costs.',
    effect: 'eco2',
    hero: false,
    specs: [
      { label: 'Plume height', value: '4 – 6 m' },
      { label: 'Power source', value: 'Mains + fluid (no CO₂ tank)' },
      { label: 'Control', value: 'DMX or remote' },
      { label: 'Upside', value: 'Cheaper to run, easy logistics' },
    ],
    bestFor: ['Indoor venues', 'Touring shows', 'Tight load-ins', 'Budget-smart drops'],
    safety: 'No pressurised gas cylinders • Simple, repeatable operation.',
    hue: 200,
  },
  {
    id: 'co2-gun',
    name: 'CO₂ Gun',
    categoryId: 'cryo',
    tagline: 'Hand-held blasts, straight at the crowd',
    description:
      'A performer-held cannon fed by a CO₂ line, letting your DJ or host fire cryo bursts exactly where the energy is. Point, squeeze, and send an ice-white jet over the front rows for pure crowd interaction.',
    effect: 'co2-gun',
    hero: false,
    specs: [
      { label: 'Throw', value: '5 – 8 m' },
      { label: 'Power source', value: 'CO₂ cylinder via hose' },
      { label: 'Control', value: 'Manual trigger' },
      { label: 'Handling', value: 'Performer-operated' },
    ],
    bestFor: ['DJ interaction', 'Hype moments', 'Walk-ons', 'Crowd surf peaks'],
    safety: 'Aim above head height • Handled by briefed performer.',
    hue: 185,
  },

  // ---------------- CONFETTI ----------------
  {
    id: 'aero-confetti',
    name: 'Aero Confetti',
    categoryId: 'confetti',
    tagline: 'Stadium-scale bursts that fill the sky',
    description:
      'Air-powered launchers that punch confetti high overhead for a huge, drifting canopy of colour. Perfect for the single unforgettable explosion — the winning goal, the “I do”, the final chorus.',
    effect: 'confetti-aero',
    hero: true,
    specs: [
      { label: 'Launch height', value: '8 – 12 m' },
      { label: 'Style', value: 'Big single / multi bursts' },
      { label: 'Control', value: 'DMX or remote' },
      { label: 'Confetti', value: 'Custom colours & shapes' },
    ],
    bestFor: ['Finales', 'Winning moments', 'Ceremony kiss', 'Countdown zero'],
    safety: 'Flame-retardant confetti • Clear overhead space required.',
    hue: 330,
  },
  {
    id: 'dmx-confetti-blower',
    name: 'DMX Confetti Blower',
    categoryId: 'confetti',
    tagline: 'Confetti on tap, timed to the music',
    description:
      'A continuous confetti blower wired into your lighting desk, so intensity and timing sync perfectly to the show. Ramp it up for the chorus, ease it back for the verse — total creative control over the flow.',
    effect: 'confetti-dmx',
    hero: false,
    specs: [
      { label: 'Style', value: 'Continuous, variable flow' },
      { label: 'Throw', value: '6 – 8 m' },
      { label: 'Control', value: 'Full DMX integration' },
      { label: 'Confetti', value: 'Custom colours & shapes' },
    ],
    bestFor: ['Live shows', 'Choreographed sets', 'Fashion runways', 'Extended drops'],
    safety: 'Flame-retardant confetti • Programmed with your lighting cues.',
    hue: 320,
  },
  {
    id: 'confetti-blower',
    name: 'Confetti Blower',
    categoryId: 'confetti',
    tagline: 'A steady, joyful snowfall of colour',
    description:
      'The dependable continuous blower — a simple remote fires a flowing stream of confetti out over the crowd. Straightforward to run and endlessly celebratory for that feel-good peak.',
    effect: 'confetti-flow',
    hero: false,
    specs: [
      { label: 'Style', value: 'Continuous stream' },
      { label: 'Throw', value: 'Up to 6 m' },
      { label: 'Control', value: 'Wireless remote (on/off)' },
      { label: 'Confetti', value: 'Custom colours & shapes' },
    ],
    bestFor: ['Dance floors', 'Parties', 'Corporate wins', 'Birthday peaks'],
    safety: 'Flame-retardant confetti • Easy, plug-and-play operation.',
    hue: 340,
  },

  // ---------------- FLAME & PYRO ----------------
  {
    id: 'flame-thrower',
    name: 'Flame Thrower',
    categoryId: 'flame-pyro',
    tagline: 'Real fire columns you feel in your chest',
    description:
      'A DMX flame projector that shoots controlled columns of fire skyward on cue. When you need genuine heat and spectacle for an outdoor stage or grand reveal, nothing else compares.',
    effect: 'flame',
    hero: true,
    specs: [
      { label: 'Flame height', value: '1 – 5 m' },
      { label: 'Fuel', value: 'Propane / butane gas' },
      { label: 'Placement', value: 'Outdoor / large stages' },
      { label: 'Control', value: 'DMX, trained operator' },
    ],
    bestFor: ['Outdoor concerts', 'Grand reveals', 'Festival mainstages', 'Award shows'],
    safety: 'Real flame & heat • Generous exclusion zone • Licensed operator only.',
    hue: 20,
  },
  {
    id: 'cold-fire-125',
    name: '125-Channel Cold Fire',
    categoryId: 'flame-pyro',
    tagline: 'Choreograph 125 cues to the music',
    description:
      'A multi-channel cold-pyrotechnic firing system that sequences up to 125 spark cues in precise, music-locked choreography. Build rolling waves, chases and finales across the whole stage — with cold-spark safety throughout.',
    effect: 'cold-fire',
    hero: false,
    specs: [
      { label: 'Channels', value: 'Up to 125 cues' },
      { label: 'Effect', value: 'Sequenced cold spark' },
      { label: 'Sync', value: 'Music / timecode' },
      { label: 'Placement', value: 'Indoor & outdoor' },
    ],
    bestFor: ['Choreographed finales', 'Award shows', 'Concerts', 'Brand launches'],
    safety: 'Cold spark cues • Programmed & fired by trained crew.',
    hue: 30,
  },
  {
    id: 'pyro-gun',
    name: 'Pyro Gun',
    categoryId: 'flame-pyro',
    tagline: 'Fire the spark burst from your own hands',
    description:
      'A hand-held cold-spark gun that lets a performer fire a punchy burst of sparks on demand. Dramatic, precise and interactive — the artist becomes part of the effect.',
    effect: 'pyro-gun',
    hero: false,
    specs: [
      { label: 'Effect', value: 'Directed cold-spark burst' },
      { label: 'Reach', value: '2 – 4 m' },
      { label: 'Placement', value: 'Indoor & outdoor' },
      { label: 'Handling', value: 'Performer-operated' },
    ],
    bestFor: ['Walk-ons', 'Solo moments', 'MC hype', 'Photo ops'],
    safety: 'Cold spark technology • Aim to clear space, briefed performer.',
    hue: 34,
  },

  // ---------------- ATMOSPHERE ----------------
  {
    id: 'bubble-machine',
    name: 'Bubble Machine',
    categoryId: 'atmosphere',
    tagline: 'Clouds of bubbles that light up the room',
    description:
      'A high-output bubble machine that fills the air with drifting streams of bubbles. Instantly playful and dreamy — magic for younger guests and a gorgeous texture under stage lighting.',
    effect: 'bubbles',
    hero: false,
    specs: [
      { label: 'Output', value: 'High-volume streams' },
      { label: 'Fluid', value: 'Water-based bubble fluid' },
      { label: 'Placement', value: 'Indoor & outdoor' },
      { label: 'Control', value: 'Remote (on/off)' },
    ],
    bestFor: ['Kids parties', 'Whimsical weddings', 'Dance floors', 'Photo backdrops'],
    safety: 'Water-based fluid • Keep floors non-slip.',
    hue: 210,
  },
  {
    id: 'smoke-bubble-machine',
    name: 'Smoke Bubble Machine',
    categoryId: 'atmosphere',
    tagline: 'Bubbles that burst into a puff of fog',
    description:
      'The showstopping novelty: each bubble is filled with fog, so it drifts intact then pops into a little cloud of smoke when touched. A guaranteed “how did they do that?” moment guests love to play with.',
    effect: 'smoke-bubbles',
    hero: false,
    specs: [
      { label: 'Effect', value: 'Fog-filled bubbles' },
      { label: 'Fluid', value: 'Bubble + fog fluid' },
      { label: 'Placement', value: 'Indoor & outdoor' },
      { label: 'Control', value: 'Remote (on/off)' },
    ],
    bestFor: ['Interactive moments', 'Kids & family events', 'Product reveals', 'Content capture'],
    safety: 'Light haze on burst • Water-based fluids.',
    hue: 270,
  },
];

export const machinesByCategory = (categoryId: string) =>
  categoryId === 'all' ? machines : machines.filter((m) => m.categoryId === categoryId);
