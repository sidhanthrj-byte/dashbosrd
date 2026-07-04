// Central content file — edit copy, numbers, and image URLs here.
// Pilot imagery is hot-linked from pongs.com; swap with PONGS India
// project photography when available.

export const site = {
  name: "PONGS India",
  tagline: "German textile ceilings & walls. Engineered in Mühltroff. Installed across India.",
  phone: "+91 98450 00000", // TODO: replace with real number
  email: "hello@pongsindia.com", // TODO: replace with real email
  whatsapp: "919845000000", // TODO: replace with real WhatsApp number
  instagram: "https://www.instagram.com/pongsindia/",
};

export const stats = [
  { value: "1,000+", label: "Projects executed across India" },
  { value: "110+", label: "Years of PONGS textile heritage" },
  { value: "6", label: "Experience centers in India" },
  { value: "5.05 m", label: "Seamless fabric width — no joints" },
];

export const centers = [
  { city: "Bengaluru", note: "Headquarters & flagship experience center" },
  { city: "Mumbai", note: "Experience center" },
  { city: "Delhi NCR", note: "Experience center" },
  { city: "Hyderabad", note: "Experience center" },
  { city: "Chennai", note: "Experience center" },
  { city: "Ahmedabad", note: "Experience center" },
];

export const img = {
  heroAuditorium:
    "https://www.pongs.com/wp-content/uploads/2024/12/0A2A0125-bearb-scaled.jpg",
  cafeteria:
    "https://www.pongs.com/wp-content/uploads/2024/12/0A2A0184-bearb-scaled.jpg",
  homeLiving:
    "https://www.pongs.com/wp-content/uploads/2023/09/IMG_6508-Kopie-scaled.jpg",
  kitchen:
    "https://www.pongs.com/wp-content/uploads/2023/09/IMG_6573-Kopie-scaled.jpg",
  retreat:
    "https://www.pongs.com/wp-content/uploads/2023/09/191-Kopie-scaled.jpg",
  study:
    "https://www.pongs.com/wp-content/uploads/2023/09/IMG_6524-Kopie-scaled.jpg",
  restaurant:
    "https://www.pongs.com/wp-content/uploads/2024/07/IMG_6905-bearb-scaled.jpg",
  jungleHome:
    "https://www.pongs.com/wp-content/uploads/2023/08/TOM_2702-Kopie-scaled.jpg",
  awardHome:
    "https://www.pongs.com/wp-content/uploads/2023/08/00-Kopie-scaled.jpg",
  museum:
    "https://www.pongs.com/wp-content/uploads/2024/09/DJI_20240822170054_0044_D-bearb-scaled.jpg",
  zoo: "https://www.pongs.com/wp-content/uploads/2023/08/02_DSC03433-Kopie2-scaled.jpg",
  lightCeiling:
    "https://www.pongs.com/wp-content/uploads/2023/08/PONGS-WCP-0098.jpg",
  event:
    "https://www.pongs.com/wp-content/uploads/2023/08/AVENTEM1801_1385-Kopie.jpg",
};

export const projects = [
  {
    title: "Manipal University — Auditorium",
    location: "Manipal, India",
    tag: "Institutional · DESCOR® PREMIUM Acoustic",
    image: img.heroAuditorium,
  },
  {
    title: "Manipal University — Cafeteria",
    location: "Manipal, India",
    tag: "Institutional · Acoustic ceiling",
    image: img.cafeteria,
  },
  {
    title: "Private Residence — Living Spaces",
    location: "Luxury residential",
    tag: "Residential · DESCOR® PREMIUM",
    image: img.homeLiving,
  },
  {
    title: "Chef's Kitchen with Acoustic Harmony",
    location: "Residential",
    tag: "Residential · Acoustic",
    image: img.kitchen,
  },
  {
    title: "Wellness & Relaxation Retreat",
    location: "Hospitality",
    tag: "Hospitality · Backlit translucent",
    image: img.retreat,
  },
  {
    title: "Fine-Dining Restaurant",
    location: "Hospitality",
    tag: "F&B · Acoustic + printed textile",
    image: img.restaurant,
  },
  {
    title: "Textile Museum, Plauen",
    location: "Germany",
    tag: "Cultural · Facade & interior textile",
    image: img.museum,
  },
  {
    title: "Award-Winning Private Villa",
    location: "Residential",
    tag: "Residential · DESCOR® PREMIUM Star",
    image: img.awardHome,
  },
  {
    title: "Wilhelma — Public Installation",
    location: "Stuttgart, Germany",
    tag: "Public · Large-span textile",
    image: img.zoo,
  },
];

export const variants = [
  {
    name: "DESCOR® PREMIUM",
    use: "The flagship. Seamless matte textile for ceilings and walls in any room.",
    specs: "100% PES, PU-coated · up to 505 cm width · B-s1,d0 / B1 fire class",
  },
  {
    name: "DESCOR® PREMIUM Acoustic",
    use: "Invisible micro-perforation for auditoriums, offices, restaurants, home theatres.",
    specs: "αw 0.90 (Class A, DIN EN ISO 354) · air-permeable · up to 505 cm",
  },
  {
    name: "DESCOR® Translucent",
    use: "Backlit luminous ceilings and light walls with perfectly even diffusion.",
    specs: "High light transmission · crease-resistant · no white/black breakage",
  },
  {
    name: "DESCOR® PREMIUM Star",
    use: "Aluminium-pigmented surface with a subtle metallic sheen for feature areas.",
    specs: "100% PES with aluminium pigments · B1 fire class",
  },
  {
    name: "PRINTERIEUR® Printed Textile",
    use: "Any artwork, any scale — printed edge-to-edge and stretched seamlessly.",
    specs: "UV print on DESCOR® base fabrics · photorealistic, washable",
  },
  {
    name: "SILENCIO® / AKUSTICO®",
    use: "Three-dimensional high-absorption weaves for demanding acoustic briefs.",
    specs: "3D weave structure · AKUSTICO® NewLife FR from 100% recycled bottles",
  },
];

export const certifications = [
  { name: "DIN EN 13501-1 (B-s1,d0)", desc: "European reaction-to-fire classification" },
  { name: "ASTM E84-16 & NFPA 701", desc: "US flame-spread and flammability standards" },
  { name: "DIN EN ISO 354 — Class A", desc: "Acoustic absorption, αw up to 0.90" },
  { name: "CE Marking", desc: "EU construction product conformity" },
  { name: "OEKO-TEX® Standard 100", desc: "Tested free of harmful substances" },
  { name: "Indoor Air Comfort Gold®", desc: "Lowest VOC emissions — healthy interiors" },
  { name: "IMO Certificate", desc: "Marine-grade fire safety (cruise & yacht approved)" },
  { name: "Global Recycled Standard", desc: "Certified recycled-content product lines" },
];

export const comparison = {
  columns: ["DESCOR® Textile", "Gypsum Board", "POP", "PVC Stretch", "Acoustic Panels"],
  rows: [
    {
      label: "Seamless span",
      values: ["Up to 5.05 m — one piece, zero joints", "Joints every 4–6 ft, visible over time", "Craftsman-dependent, cracks common", "Welded seams on larger rooms", "Panel grid always visible"],
    },
    {
      label: "Installation time (per room)",
      values: ["1 day, dust-free, furniture stays", "5–10 days + painting", "10–15 days wet work", "1–2 days, heat guns required", "2–4 days"],
    },
    {
      label: "Mess & site impact",
      values: ["No dust, no smell, no debris", "Heavy dust, sanding, paint fumes", "Wet plaster, curing time", "Heating of PVC membrane on site", "Moderate"],
    },
    {
      label: "Acoustics",
      values: ["Up to αw 0.90, Class A — built in", "Reflective; needs added treatment", "Reflective", "Reflective (perforation extra)", "Good, but visually intrusive"],
    },
    {
      label: "Material health",
      values: ["PVC-free, VOC-free, OEKO-TEX®", "Paint VOCs, joint compounds", "Dust, lime handling", "PVC membrane, plasticisers", "Varies; often MDF/foam"],
    },
    {
      label: "Fire behaviour",
      values: ["B-s1,d0 / B1 certified fabric", "Good (board), paint varies", "Good", "Melts and drips when burning", "Varies widely"],
    },
    {
      label: "Sag, cracks & repainting",
      values: ["No cracks, never needs paint", "Cracks at joints, repaint 3–5 yrs", "Cracks, repaint 3–5 yrs", "Can sag/discolour over time", "Panels warp in humidity"],
    },
    {
      label: "Access to services above",
      values: ["Fabric re-openable & re-installable", "Cut and re-do the board", "Break and re-plaster", "Partial, membrane risk", "Panel removal"],
    },
    {
      label: "Backlighting / printing",
      values: ["Translucent + edge-to-edge print", "Not possible", "Not possible", "Gloss look, limited texture", "Not possible"],
    },
  ],
};

export const installSteps = [
  {
    step: "01",
    title: "Site survey & measurement",
    desc: "Our team laser-measures the room and confirms services (AC, lighting, sprinklers, sensors) to be integrated. Any substrate — RCC, existing false ceiling, walls.",
  },
  {
    step: "02",
    title: "Track (profile) installation",
    desc: "A slim aluminium DESCOR® profile is fixed to the room perimeter — as little as 2 cm below the slab or existing surface. Cut-outs prepared for every fixture.",
  },
  {
    step: "03",
    title: "Fabric tensioning",
    desc: "The single-piece PONGS® textile is tensioned into the profile with a spatula tool. No heat, no adhesives, no wet work. Perfectly flat, seamless surface.",
  },
  {
    step: "04",
    title: "Integration & handover",
    desc: "Lights, diffusers, grills and detectors are trimmed in with precision rings. A typical living room is handed over the same day — vacuumed, done.",
  },
];

export const architectFaqs = [
  {
    q: "What is the minimum ceiling drop required?",
    a: "As little as 20 mm from the lowest point of the slab or services. For backlit ceilings we recommend 80–120 mm depending on the light source, to guarantee even diffusion without hotspots.",
  },
  {
    q: "How are AC diffusers, sprinklers and light fixtures handled?",
    a: "Every penetration gets a proprietary backing ring bonded to the rear of the fabric before the cut is made, so tension is preserved and edges stay crisp. Linear diffusers, magnetic tracks, recessed spots and sensors are all standard details — we share DWG blocks on request.",
  },
  {
    q: "What happens if the fabric is damaged or a client wants a new look?",
    a: "The membrane is re-openable: fabric can be released from the profile for access to services and re-tensioned. A full fabric swap on an existing track typically takes hours, not days — the track is reusable.",
  },
  {
    q: "Is it suitable for humid areas and coastal cities?",
    a: "Yes. Polyester textile does not absorb moisture, will not warp, flake or grow fungus like gypsum or POP — a major advantage in Mumbai and Chennai. It is routinely used above pools and spas in Europe.",
  },
  {
    q: "What acoustic performance can I specify?",
    a: "DESCOR® PREMIUM Acoustic achieves αw 0.90 (absorber Class A, DIN EN ISO 354, E-50 mounting). Combined with acoustic fleece backing, it meets auditorium and studio briefs while looking like a plain painted ceiling.",
  },
  {
    q: "What are typical lead times and commercial terms?",
    a: "Fabric is produced in Germany; standard whites are stocked in India. Typical timelines: measurement to installation in 2–3 weeks for stocked fabrics, 6–8 weeks for printed or special orders. We quote per project with itemised track, fabric and integration details.",
  },
];

export const homeownerFaqs = [
  {
    q: "How is this different from a normal false ceiling?",
    a: "Instead of boards, screws, putty and paint, a single piece of German-made fabric is stretched wall-to-wall. Your ceiling is done in a day — no dust, no smell, no cracks ever, and it never needs repainting.",
  },
  {
    q: "Will it look like cloth?",
    a: "No. The surface is perfectly flat and matte — most guests assume it's an exceptionally well-finished painted ceiling. Until you show them the glowing version or the printed one.",
  },
  {
    q: "Is it safe for my family?",
    a: "It's PVC-free, certified free of harmful substances (OEKO-TEX®) and holds Indoor Air Comfort Gold — one of the strictest clean-air certificates in the world. It's also fire-certified to European building standards.",
  },
  {
    q: "What about dust, insects or fungus?",
    a: "The fabric is anti-static, doesn't trap dust, and polyester doesn't support fungus — unlike POP or gypsum in humid Indian cities. Cleaning is a wipe or a vacuum with a brush head.",
  },
  {
    q: "Can I install it in my finished, furnished home?",
    a: "Yes — that's the point. Installation is dry and clean; furniture stays in the room under covers. A bedroom takes a few hours, a full 3BHK typically 2–3 days.",
  },
  {
    q: "How long does it last?",
    a: "Decades. The textile doesn't crack, peel, sag or yellow the way paint and boards do. And if you ever want a new look, the fabric swaps out in hours on the same track.",
  },
];

export const testimonials = [
  {
    quote:
      "Our clients could not believe the auditorium ceiling went in without a single day of dust or shutdown. Acoustically, it transformed the space.",
    name: "Principal Architect",
    role: "Institutional project, Karnataka",
  },
  {
    quote:
      "We had lived with cracked POP for years. The PONGS ceiling went up in one day, in a furnished home, and it still looks like day one.",
    name: "Homeowner",
    role: "Bengaluru residence",
  },
  {
    quote:
      "The backlit stretch ceiling is the first thing every guest photographs. Specification support and installation were genuinely German-precise.",
    name: "Interior Designer",
    role: "Hospitality project, Hyderabad",
  },
];
