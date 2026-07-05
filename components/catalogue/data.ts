// Relive Events — SFX Technical Catalogue data

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

export interface Machine {
  id: string;
  index: string; // "01"…"14"
  name: string;
  categoryId: string;
  tagline: string;
  overview: string; // 2–3 sentence editorial description
  deployment: string; // planning / operational note
  effect: EffectType;
  specs: { label: string; value: string }[];
  applications: string[];
  pairsWith: string[];
  environment: 'Indoor / Outdoor' | 'Indoor' | 'Outdoor';
  crewed: boolean;
}

export interface Category {
  id: string;
  no: string;
  name: string;
  blurb: string;
}

export const categories: Category[] = [
  {
    id: 'cold-spark',
    no: 'I',
    name: 'Cold Spark Systems',
    blurb:
      'Electrically fired titanium-granule fountains. The spark column is cool to the touch, produces no smoke and requires no open flame — the standard for indoor spark moments.',
  },
  {
    id: 'cryo',
    no: 'II',
    name: 'Cryogenic & CO₂',
    blurb:
      'High-pressure cryogenic plumes for percussive, beat-synchronised impact. Instant onset, instant cut-off, with a visible cooling effect on the room.',
  },
  {
    id: 'confetti',
    no: 'III',
    name: 'Confetti Systems',
    blurb:
      'From a single ceiling-height burst to a continuous, DMX-shaped stream. All confetti stocked is flame-retardant and available in custom colours, metallics and shapes.',
  },
  {
    id: 'flame-pyro',
    no: 'IV',
    name: 'Flame & Sequenced Pyro',
    blurb:
      'Genuine flame projection and multi-channel spark sequencing for outdoor stages and licensed venues. Always specified, permitted and fired by our own crew.',
  },
  {
    id: 'atmosphere',
    no: 'V',
    name: 'Atmospheric',
    blurb:
      'Soft, continuous texture — bubble and fog-bubble systems that photograph beautifully under stage lighting and invite interaction.',
  },
];

export const machines: Machine[] = [
  {
    id: 'sparkler-machine',
    index: '01',
    name: 'Sparkler Machine',
    categoryId: 'cold-spark',
    tagline: 'Vertical cold-spark fountain, 1–5 m',
    overview:
      'The core indoor spark effect: a controlled vertical column of cold sparks with adjustable height from a low shimmer to a five-metre fountain. Because the granules burn cool, units can be positioned within a metre of guests, on dance floors, aisles and stages — with no smoke and no flame, most venues approve it without special fire measures.',
    deployment:
      'Typically specified in symmetrical pairs or fours to frame an entrance, first dance or stage. Height is programmed per cue; a four-unit set draws a single 13 A circuit.',
    effect: 'sparks',
    specs: [
      { label: 'Effect height', value: '1 – 5 m, adjustable per cue' },
      { label: 'Duration', value: 'Continuous or timed bursts' },
      { label: 'Control', value: 'DMX 512 / wireless remote' },
      { label: 'Power', value: '230 V, ~600 W per unit' },
      { label: 'Consumable', value: 'Titanium composite granules' },
      { label: 'Residue', value: 'Minimal; swept in minutes' },
    ],
    applications: ['First dance', 'Stage framing', 'Grand entrance', 'Cake moment'],
    pairsWith: ['CO₂ Jet', 'Aero Confetti'],
    environment: 'Indoor / Outdoor',
    crewed: true,
  },
  {
    id: 'spin-sparkler',
    index: '02',
    name: 'Spin Sparkler',
    categoryId: 'cold-spark',
    tagline: 'Rotating cold-spark ring',
    overview:
      'A motorised head sweeps the spark column through a continuous circle, producing a ring of light rather than a static fountain. On camera it reads as a halo — a distinctive alternative where standard fountains have become familiar.',
    deployment:
      'Most effective as a single centrepiece behind a couple or artist, or flown above a stage on truss. Requires slightly more clearance than a static unit due to the sweep radius.',
    effect: 'spin-sparks',
    specs: [
      { label: 'Pattern', value: '360° rotating column' },
      { label: 'Effect height', value: '1 – 3 m' },
      { label: 'Sweep radius', value: '≈ 1 m' },
      { label: 'Control', value: 'DMX 512 / remote' },
      { label: 'Power', value: '230 V, ~650 W' },
      { label: 'Mounting', value: 'Floor or truss (inverted)' },
    ],
    applications: ['Centrepiece reveals', 'Stage backdrop', 'Photo moment'],
    pairsWith: ['Sparkler Machine', 'DMX Confetti Blower'],
    environment: 'Indoor / Outdoor',
    crewed: true,
  },
  {
    id: 'spin-pyro',
    index: '03',
    name: 'Spin Pyro',
    categoryId: 'cold-spark',
    tagline: 'High-speed radial spark wheel',
    overview:
      'A faster, wider rotation throws sparks outward in a radial wheel — the visual language of a traditional Catherine wheel, delivered with cold-spark safety. The most kinetic effect in the spark family, suited to finales and high-energy cues.',
    deployment:
      'Mounted on stands or truss at height so the wheel reads over the audience line. Usually fired in short 5–10 second cues rather than continuously.',
    effect: 'spin-pyro',
    specs: [
      { label: 'Pattern', value: 'Radial wheel, 2 – 3 m diameter' },
      { label: 'Rotation', value: 'Variable speed' },
      { label: 'Cue length', value: '5 – 10 s recommended' },
      { label: 'Control', value: 'DMX 512 / remote' },
      { label: 'Power', value: '230 V, ~650 W' },
      { label: 'Mounting', value: 'Stand or truss' },
    ],
    applications: ['Finales', 'Countdowns', 'DJ risers'],
    pairsWith: ['125-Channel Cold Fire', 'CO₂ Jet'],
    environment: 'Indoor / Outdoor',
    crewed: true,
  },
  {
    id: 'co2-jet',
    index: '04',
    name: 'CO₂ Jet',
    categoryId: 'cryo',
    tagline: 'Fixed cryogenic plume, 8–10 m',
    overview:
      'The definitive beat-drop effect: liquid CO₂ released through a fixed jet produces a dense white plume up to ten metres with instant onset and cut-off. The discharge audibly punctuates the music and measurably cools the room — valuable on packed dance floors.',
    deployment:
      'Fed from siphon cylinders positioned within 5 m of the jet. We handle cylinder logistics, changeovers and venue sign-off; a two-jet setup is standard for stages up to 12 m wide.',
    effect: 'co2',
    specs: [
      { label: 'Plume height', value: '8 – 10 m' },
      { label: 'Onset / cut-off', value: 'Instant (< 0.1 s)' },
      { label: 'Supply', value: 'Liquid CO₂ siphon cylinder' },
      { label: 'Burst length', value: '0.5 – 3 s typical' },
      { label: 'Cylinder yield', value: '≈ 30 – 40 full bursts' },
      { label: 'Control', value: 'DMX 512 / manual valve' },
    ],
    applications: ['Beat drops', 'Headline sets', 'Award reveals', 'Crowd cooling'],
    pairsWith: ['Sparkler Machine', 'Aero Confetti'],
    environment: 'Indoor / Outdoor',
    crewed: true,
  },
  {
    id: 'eco2-jet',
    index: '05',
    name: 'eCO₂ Jet',
    categoryId: 'cryo',
    tagline: 'Electric cryo-effect, no cylinders',
    overview:
      'An electrically generated plume that reproduces the CO₂ look without pressurised gas: no cylinders to source, transport or store. Output is shorter than true CO₂ but repeatable all night at a fraction of the running cost — the practical choice for venues that restrict gas.',
    deployment:
      'Mains power and fluid only; load-in is one flight case per unit. Well suited to multi-date tours and hotel ballrooms where cylinder handling is impractical.',
    effect: 'eco2',
    specs: [
      { label: 'Plume height', value: '4 – 6 m' },
      { label: 'Supply', value: 'Mains + effect fluid' },
      { label: 'Recovery', value: 'Continuous-fire capable' },
      { label: 'Running cost', value: 'Low — no gas logistics' },
      { label: 'Power', value: '230 V, ~1.5 kW' },
      { label: 'Control', value: 'DMX 512 / remote' },
    ],
    applications: ['Hotel ballrooms', 'Touring shows', 'Repeat-fire sets'],
    pairsWith: ['DMX Confetti Blower', 'Spin Sparkler'],
    environment: 'Indoor',
    crewed: true,
  },
  {
    id: 'co2-gun',
    index: '06',
    name: 'CO₂ Gun',
    categoryId: 'cryo',
    tagline: 'Handheld cryogenic cannon',
    overview:
      'A performer-held cannon on a flexible hose line, firing directional CO₂ bursts of five to eight metres wherever the energy is. It turns the effect into performance — a DJ or host sweeping the plume across the front rows is one of the most reliable crowd moments in live events.',
    deployment:
      'Backpack or floor-cylinder fed. We brief the operator on safe handling and aim discipline before doors; a crew member manages the cylinder line throughout.',
    effect: 'co2-gun',
    specs: [
      { label: 'Throw', value: '5 – 8 m directional' },
      { label: 'Handling', value: 'Handheld, hose-fed' },
      { label: 'Trigger', value: 'Manual valve grip' },
      { label: 'Supply', value: 'CO₂ cylinder / backpack' },
      { label: 'Burst length', value: 'Operator controlled' },
      { label: 'Briefing', value: 'Included, pre-show' },
    ],
    applications: ['DJ interaction', 'Hype moments', 'Walk-ons'],
    pairsWith: ['CO₂ Jet', 'Confetti Blower'],
    environment: 'Indoor / Outdoor',
    crewed: true,
  },
  {
    id: 'aero-confetti',
    index: '07',
    name: 'Aero Confetti',
    categoryId: 'confetti',
    tagline: 'Pneumatic burst launcher, 8–12 m',
    overview:
      'Compressed-air launchers deliver the single defining confetti moment: a full load driven eight to twelve metres up, opening into a slow, room-filling canopy. One clean burst on the right cue outperforms minutes of continuous confetti — this is the system for the kiss, the winner, midnight.',
    deployment:
      'Sited to clear lighting rigs and HVAC intakes; we plot launch angles at the site visit. Multiple launchers are fired as a single synchronised cue from the desk.',
    effect: 'confetti-aero',
    specs: [
      { label: 'Launch height', value: '8 – 12 m' },
      { label: 'Load', value: 'Up to 1 kg per launcher' },
      { label: 'Drive', value: 'Compressed air' },
      { label: 'Firing', value: 'DMX / hardwired cue' },
      { label: 'Confetti', value: 'Flame-retardant, custom' },
      { label: 'Reload', value: '≈ 2 min per unit' },
    ],
    applications: ['Ceremony kiss', 'Countdown zero', 'Trophy lift', 'Finale'],
    pairsWith: ['CO₂ Jet', 'Sparkler Machine'],
    environment: 'Indoor / Outdoor',
    crewed: true,
  },
  {
    id: 'dmx-confetti-blower',
    index: '08',
    name: 'DMX Confetti Blower',
    categoryId: 'confetti',
    tagline: 'Desk-controlled continuous stream',
    overview:
      'A continuous turbine blower with output on a DMX fader, letting your lighting operator shape confetti density in real time against the music — swelling through a chorus, cutting on the downbeat. The choreographer’s confetti system.',
    deployment:
      'Patched into the venue desk alongside lighting; we pre-load colourways per song. Hopper capacity sustains several minutes of full-rate output before reload.',
    effect: 'confetti-dmx',
    specs: [
      { label: 'Output', value: 'Variable, fader-controlled' },
      { label: 'Throw', value: '6 – 8 m' },
      { label: 'Hopper', value: '≈ 2 kg capacity' },
      { label: 'Control', value: 'DMX 512, 2 channels' },
      { label: 'Power', value: '230 V, ~1.2 kW' },
      { label: 'Confetti', value: 'Flame-retardant, custom' },
    ],
    applications: ['Live sets', 'Runway shows', 'Choreographed cues'],
    pairsWith: ['eCO₂ Jet', 'Spin Sparkler'],
    environment: 'Indoor / Outdoor',
    crewed: true,
  },
  {
    id: 'confetti-blower',
    index: '09',
    name: 'Confetti Blower',
    categoryId: 'confetti',
    tagline: 'Continuous stream, remote fired',
    overview:
      'The straightforward workhorse: a turbine blower on a wireless remote producing a steady six-metre stream. Where a show desk isn’t part of the production, this delivers a sustained confetti moment with one-button simplicity.',
    deployment:
      'Positioned side-of-stage or on a balcony rail aimed across the floor. A crew member fires and reloads; colour mixes are prepared in advance.',
    effect: 'confetti-flow',
    specs: [
      { label: 'Output', value: 'Fixed rate, on/off' },
      { label: 'Throw', value: 'Up to 6 m' },
      { label: 'Hopper', value: '≈ 1.5 kg capacity' },
      { label: 'Control', value: 'Wireless remote' },
      { label: 'Power', value: '230 V, ~1 kW' },
      { label: 'Confetti', value: 'Flame-retardant, custom' },
    ],
    applications: ['Dance floor peaks', 'Corporate reveals', 'Birthday moments'],
    pairsWith: ['CO₂ Gun', 'Bubble Machine'],
    environment: 'Indoor / Outdoor',
    crewed: true,
  },
  {
    id: 'flame-thrower',
    index: '10',
    name: 'Flame Projector',
    categoryId: 'flame-pyro',
    tagline: 'DMX flame column, 1–5 m',
    overview:
      'Genuine propane flame fired in precise columns of one to five metres, with the radiant heat the audience feels from the front rows. For outdoor stages and licensed arenas, nothing substitutes for real fire — and nothing is treated with more rigour in our operation.',
    deployment:
      'Outdoor or high-clearance licensed venues only. We produce the risk assessment and permit file, plot exclusion zones, and our licensed operator arms and fires every cue with a physical dead-man safety.',
    effect: 'flame',
    specs: [
      { label: 'Flame height', value: '1 – 5 m per shot' },
      { label: 'Fuel', value: 'Propane, self-contained' },
      { label: 'Shot length', value: '0.1 – 2 s' },
      { label: 'Safety', value: 'Dead-man arm + E-stop' },
      { label: 'Clearance', value: 'Site-specific exclusion zone' },
      { label: 'Control', value: 'DMX, licensed operator' },
    ],
    applications: ['Festival mainstage', 'Outdoor concerts', 'Arena shows'],
    pairsWith: ['CO₂ Jet', '125-Channel Cold Fire'],
    environment: 'Outdoor',
    crewed: true,
  },
  {
    id: 'cold-fire-125',
    index: '11',
    name: '125-Channel Cold Fire',
    categoryId: 'flame-pyro',
    tagline: 'Sequenced multi-point spark firing',
    overview:
      'A firing system addressing up to 125 independent cold-spark positions, sequenced to timecode. Waves that roll across the stage width, chases that follow the vocal line, a synchronised full-front finale — this is spark choreography at production scale.',
    deployment:
      'Programmed against your track or show timecode in advance; on the night it runs locked to the desk. Site time of roughly half a day for a full stage plot.',
    effect: 'cold-fire',
    specs: [
      { label: 'Channels', value: 'Up to 125 positions' },
      { label: 'Sync', value: 'SMPTE timecode / manual' },
      { label: 'Resolution', value: 'Frame-accurate cueing' },
      { label: 'Effect', value: 'Cold spark, per-position' },
      { label: 'Programming', value: 'Pre-plotted to track' },
      { label: 'Setup', value: '≈ half-day for full plot' },
    ],
    applications: ['Award shows', 'Concert finales', 'Brand launches'],
    pairsWith: ['Flame Projector', 'Aero Confetti'],
    environment: 'Indoor / Outdoor',
    crewed: true,
  },
  {
    id: 'pyro-gun',
    index: '12',
    name: 'Pyro Gun',
    categoryId: 'flame-pyro',
    tagline: 'Handheld directed spark burst',
    overview:
      'A handheld cold-spark device firing a directed two-to-four-metre burst on the trigger. It puts the effect literally in the performer’s hands — an MC punctuating a line, an artist walking on through their own sparks. Cold-spark composition; no licence burden on the venue.',
    deployment:
      'Charged and handed to the performer immediately before the cue; our crew retrieves and re-preps between uses. Aim discipline briefed in advance.',
    effect: 'pyro-gun',
    specs: [
      { label: 'Throw', value: '2 – 4 m directed' },
      { label: 'Burst length', value: '3 – 8 s per charge' },
      { label: 'Handling', value: 'Handheld, trigger-fired' },
      { label: 'Effect', value: 'Cold spark composite' },
      { label: 'Reload', value: 'Crew-managed between cues' },
      { label: 'Briefing', value: 'Included, pre-show' },
    ],
    applications: ['Artist walk-ons', 'MC moments', 'Editorial shoots'],
    pairsWith: ['Sparkler Machine', 'CO₂ Gun'],
    environment: 'Indoor / Outdoor',
    crewed: true,
  },
  {
    id: 'bubble-machine',
    index: '13',
    name: 'Bubble Machine',
    categoryId: 'atmosphere',
    tagline: 'High-output bubble generator',
    overview:
      'A professional-output generator producing a continuous drift of bubbles across the floor or over a crowd. Under stage lighting the effect is unexpectedly elegant — thousands of catching highlights — while remaining the most guest-interactive system in the catalogue.',
    deployment:
      'Positioned to drift with venue airflow; on hard floors we manage fluid fallout with matting at the unit. Fluid is non-staining and hypoallergenic.',
    effect: 'bubbles',
    specs: [
      { label: 'Output', value: 'High-volume, continuous' },
      { label: 'Coverage', value: '≈ 50 m² drift field' },
      { label: 'Fluid', value: 'Non-staining, hypoallergenic' },
      { label: 'Power', value: '230 V, ~300 W' },
      { label: 'Control', value: 'Remote on/off' },
      { label: 'Noise', value: 'Low — conversation safe' },
    ],
    applications: ['Garden parties', 'Family events', 'Photo areas'],
    pairsWith: ['Smoke Bubble Machine', 'Confetti Blower'],
    environment: 'Indoor / Outdoor',
    crewed: false,
  },
  {
    id: 'smoke-bubble-machine',
    index: '14',
    name: 'Smoke Bubble Machine',
    categoryId: 'atmosphere',
    tagline: 'Fog-filled bubbles that burst to haze',
    overview:
      'Each bubble carries a charge of fog and releases a small suspended cloud on contact. The effect invites touch — guests reach for the bubbles, and every burst is a micro-moment on camera. A quietly memorable detail rather than a headline cue.',
    deployment:
      'Best in still air at entrances, photo corners and children’s areas. Haze output is light and dissipates quickly; we confirm detector zones with the venue as standard.',
    effect: 'smoke-bubbles',
    specs: [
      { label: 'Effect', value: 'Fog-filled bubbles' },
      { label: 'Burst', value: 'Haze puff on contact' },
      { label: 'Fluids', value: 'Bubble + water-based fog' },
      { label: 'Power', value: '230 V, ~400 W' },
      { label: 'Control', value: 'Remote on/off' },
      { label: 'Detectors', value: 'Venue zones confirmed' },
    ],
    applications: ['Entrances', 'Content capture', 'Family events'],
    pairsWith: ['Bubble Machine', 'Sparkler Machine'],
    environment: 'Indoor',
    crewed: false,
  },
];
