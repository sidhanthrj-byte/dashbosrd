export type RateItem = {
  id: string;
  category: string;
  subcategory: string;
  description: string;
  specification: string;
  unit: string;
  rate: number;
  rate_min: number;
  rate_max: number;
  gst_percent: number;
};

export const CATEGORIES = [
  'Civil Work',
  'Flooring',
  'Wall & Painting',
  'False Ceiling',
  'Electrical',
  'Plumbing',
  'Modular Kitchen',
  'Wardrobes & Storage',
  'Doors & Windows',
  'HVAC',
  'Furniture',
  'Décor & Soft Furnishing',
  'Staircase & Railing',
  'External Works',
  'Miscellaneous',
] as const;

export const UNITS = ['sqft', 'rft', 'nos', 'point', 'lot', 'rmt', 'kg', 'bag', 'set'];

export const PROJECT_TYPES = [
  'Residential Apartment',
  'Residential Villa / Bungalow',
  'Commercial Office',
  'Retail / Showroom',
  'Hospitality / Hotel',
  'Restaurant / Café',
  'Healthcare / Clinic',
  'Educational Institution',
  'Mixed Use',
];

export const PRESET_SECTIONS = [
  'Living Room',
  'Dining Area',
  'Kitchen',
  'Master Bedroom',
  'Bedroom 2',
  'Bedroom 3',
  'Master Bathroom',
  'Common Bathroom',
  'Powder Room',
  'Study / Home Office',
  'Balcony',
  'Entrance Lobby',
  'Staircase',
  'Terrace',
  'Puja Room',
  'Store Room',
  'Servant Room',
  'Garage',
  'External Façade',
  'Common Areas',
];

export const RATE_LIBRARY: RateItem[] = [
  // ─── CIVIL WORK ───────────────────────────────────────────────
  { id: 'c01', category: 'Civil Work', subcategory: 'Demolition', description: 'Demolition of existing brick wall', specification: 'Including debris removal', unit: 'sqft', rate: 30, rate_min: 20, rate_max: 45, gst_percent: 18 },
  { id: 'c02', category: 'Civil Work', subcategory: 'Demolition', description: 'Tile / flooring removal', specification: 'Including disposal', unit: 'sqft', rate: 18, rate_min: 12, rate_max: 25, gst_percent: 18 },
  { id: 'c03', category: 'Civil Work', subcategory: 'Masonry', description: 'Brick partition wall 4" thick', specification: 'First class brick, CM 1:6', unit: 'sqft', rate: 105, rate_min: 85, rate_max: 130, gst_percent: 18 },
  { id: 'c04', category: 'Civil Work', subcategory: 'Masonry', description: 'Brick partition wall 9" thick', specification: 'First class brick, CM 1:6', unit: 'sqft', rate: 165, rate_min: 140, rate_max: 200, gst_percent: 18 },
  { id: 'c05', category: 'Civil Work', subcategory: 'Plastering', description: 'Internal wall plaster 12mm', specification: '2-coat plaster CM 1:4', unit: 'sqft', rate: 35, rate_min: 25, rate_max: 48, gst_percent: 18 },
  { id: 'c06', category: 'Civil Work', subcategory: 'Plastering', description: 'External wall plaster 20mm', specification: 'CM 1:4 with integral waterproofing', unit: 'sqft', rate: 48, rate_min: 35, rate_max: 65, gst_percent: 18 },
  { id: 'c07', category: 'Civil Work', subcategory: 'Waterproofing', description: 'Bathroom waterproofing', specification: 'Dr. Fixit 2-coat system, 1.5mm DFT', unit: 'sqft', rate: 85, rate_min: 65, rate_max: 120, gst_percent: 18 },
  { id: 'c08', category: 'Civil Work', subcategory: 'Waterproofing', description: 'Terrace waterproofing', specification: 'Bituminous membrane 4mm thick', unit: 'sqft', rate: 130, rate_min: 100, rate_max: 180, gst_percent: 18 },
  { id: 'c09', category: 'Civil Work', subcategory: 'Flooring base', description: 'PCC flooring base', specification: 'M15 concrete 75mm thick', unit: 'sqft', rate: 48, rate_min: 35, rate_max: 65, gst_percent: 18 },
  { id: 'c10', category: 'Civil Work', subcategory: 'Flooring base', description: 'Screed for floor levelling', specification: 'CM 1:4 self-levelling screed 40mm', unit: 'sqft', rate: 32, rate_min: 22, rate_max: 45, gst_percent: 18 },
  { id: 'c11', category: 'Civil Work', subcategory: 'Partition', description: 'Gypsum board partition 75mm', specification: '12.5mm GBD both sides, GI framing', unit: 'sqft', rate: 125, rate_min: 95, rate_max: 160, gst_percent: 18 },
  { id: 'c12', category: 'Civil Work', subcategory: 'Partition', description: 'Gypsum board partition 100mm', specification: '12.5mm GBD both sides with insulation', unit: 'sqft', rate: 155, rate_min: 120, rate_max: 200, gst_percent: 18 },

  // ─── FLOORING ─────────────────────────────────────────────────
  { id: 'f01', category: 'Flooring', subcategory: 'Tiles', description: 'Vitrified tile laying 600×600mm', specification: 'Supply & fix, CM 1:4 bed, epoxy grout', unit: 'sqft', rate: 75, rate_min: 60, rate_max: 95, gst_percent: 18 },
  { id: 'f02', category: 'Flooring', subcategory: 'Tiles', description: 'Vitrified tile laying 800×800mm', specification: 'Supply & fix, CM 1:4 bed, epoxy grout', unit: 'sqft', rate: 85, rate_min: 65, rate_max: 110, gst_percent: 18 },
  { id: 'f03', category: 'Flooring', subcategory: 'Tiles', description: 'Anti-skid ceramic tile bathroom', specification: 'Supply & fix, 300×300mm, epoxy grout', unit: 'sqft', rate: 70, rate_min: 55, rate_max: 90, gst_percent: 18 },
  { id: 'f04', category: 'Flooring', subcategory: 'Marble', description: 'Indian marble flooring Makrana', specification: 'Supply & fix, 18mm thick, machine polished', unit: 'sqft', rate: 160, rate_min: 120, rate_max: 220, gst_percent: 18 },
  { id: 'f05', category: 'Flooring', subcategory: 'Marble', description: 'Italian marble flooring Statuario', specification: 'Supply & fix, 18mm thick, mirror finish', unit: 'sqft', rate: 380, rate_min: 280, rate_max: 550, gst_percent: 18 },
  { id: 'f06', category: 'Flooring', subcategory: 'Wood', description: 'Engineered wood flooring', specification: 'Supply & fix, 12mm HDF, click lock', unit: 'sqft', rate: 280, rate_min: 200, rate_max: 400, gst_percent: 18 },
  { id: 'f07', category: 'Flooring', subcategory: 'Wood', description: 'Solid teak wood flooring', specification: 'Supply & fix, 18mm, tongue-groove, lacquer finish', unit: 'sqft', rate: 550, rate_min: 400, rate_max: 750, gst_percent: 18 },
  { id: 'f08', category: 'Flooring', subcategory: 'Vinyl', description: 'LVT vinyl plank flooring', specification: 'Supply & fix, 5mm SPC core, click lock', unit: 'sqft', rate: 130, rate_min: 95, rate_max: 180, gst_percent: 18 },
  { id: 'f09', category: 'Flooring', subcategory: 'Vinyl', description: 'Vinyl sheet flooring 2mm', specification: 'Supply & fix, commercial grade Tarkett/Armstrong', unit: 'sqft', rate: 95, rate_min: 70, rate_max: 130, gst_percent: 18 },
  { id: 'f10', category: 'Flooring', subcategory: 'Stone', description: 'Kotah stone flooring', specification: 'Supply & fix, 20mm honed finish', unit: 'sqft', rate: 105, rate_min: 80, rate_max: 140, gst_percent: 18 },
  { id: 'f11', category: 'Flooring', subcategory: 'Stone', description: 'Granite flooring black/tan brown', specification: 'Supply & fix, 18mm, machine cut, polished', unit: 'sqft', rate: 145, rate_min: 110, rate_max: 195, gst_percent: 18 },
  { id: 'f12', category: 'Flooring', subcategory: 'Epoxy', description: 'Epoxy self-levelling flooring', specification: '3mm thick, 2-part epoxy, gloss finish', unit: 'sqft', rate: 185, rate_min: 140, rate_max: 260, gst_percent: 18 },

  // ─── WALL & PAINTING ──────────────────────────────────────────
  { id: 'p01', category: 'Wall & Painting', subcategory: 'Preparation', description: 'Wall putty 2 coats', specification: 'Asian Paints / Berger wall putty', unit: 'sqft', rate: 22, rate_min: 16, rate_max: 30, gst_percent: 18 },
  { id: 'p02', category: 'Wall & Painting', subcategory: 'Preparation', description: 'Primer coat', specification: 'Asian Paints/Dulux interior primer', unit: 'sqft', rate: 12, rate_min: 8, rate_max: 18, gst_percent: 18 },
  { id: 'p03', category: 'Wall & Painting', subcategory: 'Interior', description: 'Interior emulsion 2 coats', specification: 'Asian Paints Tractor Emulsion / Dulux Velvet Touch', unit: 'sqft', rate: 28, rate_min: 20, rate_max: 40, gst_percent: 18 },
  { id: 'p04', category: 'Wall & Painting', subcategory: 'Interior', description: 'Premium interior emulsion 2 coats', specification: 'Asian Paints Royale / Dulux AquaClean', unit: 'sqft', rate: 42, rate_min: 32, rate_max: 58, gst_percent: 18 },
  { id: 'p05', category: 'Wall & Painting', subcategory: 'Texture', description: 'Interior texture paint', specification: 'Royale Play / Berger Illusions, 1 design', unit: 'sqft', rate: 90, rate_min: 55, rate_max: 160, gst_percent: 18 },
  { id: 'p06', category: 'Wall & Painting', subcategory: 'Exterior', description: 'Exterior emulsion 2 coats', specification: 'Asian Paints Apex / Dulux Weathershield', unit: 'sqft', rate: 45, rate_min: 35, rate_max: 62, gst_percent: 18 },
  { id: 'p07', category: 'Wall & Painting', subcategory: 'Wood', description: 'Enamel paint on woodwork 2 coats', specification: 'Asian Paints Apcolite enamel, primer + 2 finish coats', unit: 'sqft', rate: 38, rate_min: 28, rate_max: 52, gst_percent: 18 },
  { id: 'p08', category: 'Wall & Painting', subcategory: 'Wood', description: 'PU polish on woodwork', specification: 'Glossy PU, 3 coats, Matt/Semi-gloss finish', unit: 'sqft', rate: 65, rate_min: 48, rate_max: 90, gst_percent: 18 },
  { id: 'p09', category: 'Wall & Painting', subcategory: 'Metal', description: 'Enamel paint on MS / iron works', specification: 'Red oxide primer + 2 enamel coats', unit: 'sqft', rate: 35, rate_min: 25, rate_max: 48, gst_percent: 18 },
  { id: 'p10', category: 'Wall & Painting', subcategory: 'Wallpaper', description: 'Wallpaper supply & installation', specification: 'Non-woven, sticker type, standard patterns', unit: 'sqft', rate: 120, rate_min: 80, rate_max: 200, gst_percent: 18 },
  { id: 'p11', category: 'Wall & Painting', subcategory: 'Wallpaper', description: 'Imported designer wallpaper', specification: 'Phillip Jeffries / Elitis, paste-the-wall type', unit: 'sqft', rate: 350, rate_min: 200, rate_max: 600, gst_percent: 18 },
  { id: 'p12', category: 'Wall & Painting', subcategory: 'Cladding', description: 'Stone veneer wall cladding', specification: 'Natural ledger stone 20-25mm, adhesive fixed', unit: 'sqft', rate: 480, rate_min: 350, rate_max: 700, gst_percent: 18 },
  { id: 'p13', category: 'Wall & Painting', subcategory: 'Cladding', description: 'Wooden wall panelling', specification: '18mm plywood base + veneer finish', unit: 'sqft', rate: 650, rate_min: 480, rate_max: 950, gst_percent: 18 },
  { id: 'p14', category: 'Wall & Painting', subcategory: 'Cladding', description: 'Fluted wood panel wall cladding', specification: 'Solid MDF fluted panels, natural oak finish', unit: 'sqft', rate: 850, rate_min: 620, rate_max: 1200, gst_percent: 18 },

  // ─── FALSE CEILING ────────────────────────────────────────────
  { id: 'fc01', category: 'False Ceiling', subcategory: 'Gypsum', description: 'Gypsum false ceiling plain', specification: '12.5mm GBD, GI framing, L&T/Saint-Gobain', unit: 'sqft', rate: 90, rate_min: 70, rate_max: 120, gst_percent: 18 },
  { id: 'fc02', category: 'False Ceiling', subcategory: 'Gypsum', description: 'Gypsum false ceiling with cove', specification: '12.5mm GBD, cove for indirect lighting', unit: 'sqft', rate: 125, rate_min: 95, rate_max: 165, gst_percent: 18 },
  { id: 'fc03', category: 'False Ceiling', subcategory: 'POP', description: 'POP false ceiling plain', specification: '10mm POP on GI frame', unit: 'sqft', rate: 78, rate_min: 60, rate_max: 100, gst_percent: 18 },
  { id: 'fc04', category: 'False Ceiling', subcategory: 'POP', description: 'POP cornice / border moulding', specification: 'POP decorative cornice 4" wide', unit: 'rft', rate: 85, rate_min: 60, rate_max: 120, gst_percent: 18 },
  { id: 'fc05', category: 'False Ceiling', subcategory: 'Wood', description: 'Wooden baffle ceiling', specification: 'Solid MDF baffles 120mm×40mm, OAK veneer', unit: 'sqft', rate: 420, rate_min: 300, rate_max: 600, gst_percent: 18 },
  { id: 'fc06', category: 'False Ceiling', subcategory: 'Metal', description: 'Metal strip / linear ceiling', specification: 'Aluminium linear 84C profile, powder coated', unit: 'sqft', rate: 280, rate_min: 200, rate_max: 400, gst_percent: 18 },
  { id: 'fc07', category: 'False Ceiling', subcategory: 'Stretch', description: 'Stretch ceiling system', specification: 'PVC membrane, BARRISOL/CLIPSO brand', unit: 'sqft', rate: 350, rate_min: 250, rate_max: 500, gst_percent: 18 },
  { id: 'fc08', category: 'False Ceiling', subcategory: 'Provision', description: 'Cove lighting channel (L-angle)', specification: 'GI L-angle cove, min 150mm depth', unit: 'rft', rate: 380, rate_min: 280, rate_max: 520, gst_percent: 18 },

  // ─── ELECTRICAL ──────────────────────────────────────────────
  { id: 'e01', category: 'Electrical', subcategory: 'Wiring', description: 'Concealed wiring per point (light/fan)', specification: 'Havells / Polycab FR 1.5sqmm copper, conduit', unit: 'point', rate: 1200, rate_min: 950, rate_max: 1600, gst_percent: 18 },
  { id: 'e02', category: 'Electrical', subcategory: 'Wiring', description: 'Concealed wiring per point (power/AC)', specification: 'Havells / Polycab FR 4sqmm copper, conduit', unit: 'point', rate: 1800, rate_min: 1400, rate_max: 2400, gst_percent: 18 },
  { id: 'e03', category: 'Electrical', subcategory: 'DB', description: 'Distribution board 4-way', specification: 'Schneider/L&T TPN DB, 4 MCB slots', unit: 'nos', rate: 5500, rate_min: 4000, rate_max: 8000, gst_percent: 18 },
  { id: 'e04', category: 'Electrical', subcategory: 'DB', description: 'Distribution board 8-way', specification: 'Schneider/L&T TPN DB, 8 MCB slots', unit: 'nos', rate: 9000, rate_min: 7000, rate_max: 13000, gst_percent: 18 },
  { id: 'e05', category: 'Electrical', subcategory: 'DB', description: 'MCB single pole 10/16A', specification: 'Schneider/ABB/L&T, C-curve', unit: 'nos', rate: 500, rate_min: 350, rate_max: 750, gst_percent: 18 },
  { id: 'e06', category: 'Electrical', subcategory: 'Switches', description: 'Switch plate (Anchor Roma) 1M', specification: '1 module switch/socket plate, 6A/16A', unit: 'nos', rate: 750, rate_min: 500, rate_max: 1100, gst_percent: 18 },
  { id: 'e07', category: 'Electrical', subcategory: 'Switches', description: 'Switch plate (Legrand Arteor) 1M', specification: '1 module Legrand plate with switch', unit: 'nos', rate: 2800, rate_min: 1800, rate_max: 4200, gst_percent: 18 },
  { id: 'e08', category: 'Electrical', subcategory: 'Switches', description: 'Smart touch switch plate', specification: 'Havells Reeva / Legrand Mosaic touch switch', unit: 'nos', rate: 4500, rate_min: 3000, rate_max: 7500, gst_percent: 18 },
  { id: 'e09', category: 'Electrical', subcategory: 'Lighting', description: 'Recessed LED panel light 12W', specification: 'Havells/Crompton 12W round/square panel', unit: 'nos', rate: 1200, rate_min: 800, rate_max: 1800, gst_percent: 18 },
  { id: 'e10', category: 'Electrical', subcategory: 'Lighting', description: 'Recessed spotlight / downlight 7W', specification: 'Philips/Havells GU10 MR16 LED downlight', unit: 'nos', rate: 950, rate_min: 600, rate_max: 1500, gst_percent: 18 },
  { id: 'e11', category: 'Electrical', subcategory: 'Lighting', description: 'LED strip light cove (per rft)', specification: 'Philips/Havells 12W/m RGB or WW, dimmer point', unit: 'rft', rate: 280, rate_min: 180, rate_max: 420, gst_percent: 18 },
  { id: 'e12', category: 'Electrical', subcategory: 'Lighting', description: 'Pendant light point provision', specification: 'Wiring point + canopy bracket for pendant', unit: 'nos', rate: 2200, rate_min: 1600, rate_max: 3200, gst_percent: 18 },
  { id: 'e13', category: 'Electrical', subcategory: 'Lighting', description: 'Outdoor weatherproof light fixture', specification: 'IP65 wall light, supply & install', unit: 'nos', rate: 2800, rate_min: 1800, rate_max: 4500, gst_percent: 18 },
  { id: 'e14', category: 'Electrical', subcategory: 'Safety', description: 'Fire alarm detector point', specification: 'Addressable smoke detector + loop wiring', unit: 'nos', rate: 4500, rate_min: 3200, rate_max: 6500, gst_percent: 18 },
  { id: 'e15', category: 'Electrical', subcategory: 'Safety', description: 'ELCB / RCD 25A 30mA', specification: 'Schneider/Legrand RCCB, bathroom circuit', unit: 'nos', rate: 2200, rate_min: 1600, rate_max: 3200, gst_percent: 18 },

  // ─── PLUMBING ─────────────────────────────────────────────────
  { id: 'pl01', category: 'Plumbing', subcategory: 'Piping', description: 'CPVC pipe 3/4" concealed', specification: 'Astral/Supreme CPVC, hot+cold supply', unit: 'rft', rate: 230, rate_min: 170, rate_max: 310, gst_percent: 18 },
  { id: 'pl02', category: 'Plumbing', subcategory: 'Piping', description: 'uPVC soil/drain pipe 4"', specification: 'Supreme/Prince uPVC SWR pipe', unit: 'rft', rate: 280, rate_min: 200, rate_max: 380, gst_percent: 18 },
  { id: 'pl03', category: 'Plumbing', subcategory: 'Sanitary', description: 'Wall-hung WC with concealed cistern', specification: 'Jaquar/Parryware WC + Jaquar cistern', unit: 'nos', rate: 28000, rate_min: 18000, rate_max: 55000, gst_percent: 18 },
  { id: 'pl04', category: 'Plumbing', subcategory: 'Sanitary', description: 'EWC (floor-mounted WC)', specification: 'Jaquar/Kohler standard close-coupled', unit: 'nos', rate: 14000, rate_min: 9000, rate_max: 28000, gst_percent: 18 },
  { id: 'pl05', category: 'Plumbing', subcategory: 'Sanitary', description: 'Counter basin with mixer tap', specification: 'Jaquar/Kohler counter basin + single lever', unit: 'nos', rate: 16000, rate_min: 10000, rate_max: 35000, gst_percent: 18 },
  { id: 'pl06', category: 'Plumbing', subcategory: 'Sanitary', description: 'Pedestal wash basin with tap', specification: 'Jaquar/Parryware pedestal basin + tap', unit: 'nos', rate: 9500, rate_min: 6500, rate_max: 18000, gst_percent: 18 },
  { id: 'pl07', category: 'Plumbing', subcategory: 'Sanitary', description: 'Health faucet set (bidet spray)', specification: 'Jaquar/Grohe health faucet + holder + hose', unit: 'nos', rate: 1800, rate_min: 1200, rate_max: 3200, gst_percent: 18 },
  { id: 'pl08', category: 'Plumbing', subcategory: 'Shower', description: 'Overhead rain shower 250mm', specification: 'Jaquar/Kohler overhead, CP finish', unit: 'nos', rate: 8500, rate_min: 5500, rate_max: 18000, gst_percent: 18 },
  { id: 'pl09', category: 'Plumbing', subcategory: 'Shower', description: 'Concealed thermostatic shower system', specification: 'Grohe Grohtherm / Jaquar concealed valve + head', unit: 'nos', rate: 32000, rate_min: 22000, rate_max: 65000, gst_percent: 18 },
  { id: 'pl10', category: 'Plumbing', subcategory: 'Shower', description: 'Shower enclosure frameless 8mm', specification: 'Frameless tempered glass, pivot door, chrome hardware', unit: 'nos', rate: 22000, rate_min: 15000, rate_max: 45000, gst_percent: 18 },
  { id: 'pl11', category: 'Plumbing', subcategory: 'Water heating', description: 'Storage water heater 15L', specification: 'Racold/Havells Adonia 15L BEE 5-star', unit: 'nos', rate: 14000, rate_min: 9000, rate_max: 22000, gst_percent: 18 },
  { id: 'pl12', category: 'Plumbing', subcategory: 'Water heating', description: 'Storage water heater 25L', specification: 'Racold/Havells 25L BEE 5-star', unit: 'nos', rate: 18000, rate_min: 12000, rate_max: 28000, gst_percent: 18 },
  { id: 'pl13', category: 'Plumbing', subcategory: 'Accessories', description: 'CP bathroom accessories set', specification: 'Jaquar/Grohe: towel ring, soap dish, TP holder, robe hook', unit: 'set', rate: 8500, rate_min: 5000, rate_max: 20000, gst_percent: 18 },
  { id: 'pl14', category: 'Plumbing', subcategory: 'Accessories', description: 'Floor drain (CP)', specification: 'Jaquar/Kohler anti-smell floor drain, 100×100mm', unit: 'nos', rate: 1200, rate_min: 800, rate_max: 2200, gst_percent: 18 },

  // ─── MODULAR KITCHEN ──────────────────────────────────────────
  { id: 'mk01', category: 'Modular Kitchen', subcategory: 'Cabinets', description: 'Base cabinet with shutter & hardware', specification: '18mm BWP ply, acrylic/membrane shutter, soft close', unit: 'sqft', rate: 3800, rate_min: 2800, rate_max: 5500, gst_percent: 18 },
  { id: 'mk02', category: 'Modular Kitchen', subcategory: 'Cabinets', description: 'Wall cabinet with shutter & hardware', specification: '18mm BWP ply, acrylic shutter, soft close hinge', unit: 'sqft', rate: 3000, rate_min: 2200, rate_max: 4500, gst_percent: 18 },
  { id: 'mk03', category: 'Modular Kitchen', subcategory: 'Cabinets', description: 'Loft / overhead cabinet', specification: '18mm BWP ply, shutter', unit: 'sqft', rate: 2200, rate_min: 1600, rate_max: 3200, gst_percent: 18 },
  { id: 'mk04', category: 'Modular Kitchen', subcategory: 'Countertop', description: 'Granite countertop supply & fix', specification: 'Min 20mm, polished, edge treatment incl.', unit: 'sqft', rate: 380, rate_min: 250, rate_max: 600, gst_percent: 18 },
  { id: 'mk05', category: 'Modular Kitchen', subcategory: 'Countertop', description: 'Quartz countertop supply & fix', specification: 'Silestone/Caesarstone 20mm, undermount edge', unit: 'sqft', rate: 750, rate_min: 550, rate_max: 1100, gst_percent: 18 },
  { id: 'mk06', category: 'Modular Kitchen', subcategory: 'Countertop', description: 'SS countertop 16 gauge', specification: 'Commercial grade SS 304, 16 gauge, 50mm nosing', unit: 'sqft', rate: 550, rate_min: 400, rate_max: 750, gst_percent: 18 },
  { id: 'mk07', category: 'Modular Kitchen', subcategory: 'Appliances point', description: 'SS sink double bowl supply & fix', specification: 'Carysil/Franke SS 304 double bowl, waste fittings', unit: 'nos', rate: 9500, rate_min: 6000, rate_max: 18000, gst_percent: 18 },
  { id: 'mk08', category: 'Modular Kitchen', subcategory: 'Appliances point', description: 'Kitchen chimney 60cm', specification: 'Faber/Elica 60cm, 1200m³/h, baffle filter', unit: 'nos', rate: 14000, rate_min: 8000, rate_max: 28000, gst_percent: 18 },
  { id: 'mk09', category: 'Modular Kitchen', subcategory: 'Appliances point', description: 'Kitchen chimney 90cm', specification: 'Faber/Elica 90cm, 1400m³/h, baffle filter', unit: 'nos', rate: 20000, rate_min: 12000, rate_max: 38000, gst_percent: 18 },
  { id: 'mk10', category: 'Modular Kitchen', subcategory: 'Accessories', description: 'Kitchen accessories (bottle pull-out, bin, etc.)', specification: 'Hettich/Hafele: 1 bottle pull-out + 1 waste bin', unit: 'lot', rate: 18000, rate_min: 12000, rate_max: 28000, gst_percent: 18 },

  // ─── WARDROBES & STORAGE ──────────────────────────────────────
  { id: 'w01', category: 'Wardrobes & Storage', subcategory: 'Sliding', description: 'Sliding wardrobe with mirror', specification: '18mm BWP ply, Godrej/Hettich slider, 2 mirror doors', unit: 'sqft', rate: 4200, rate_min: 3200, rate_max: 6000, gst_percent: 18 },
  { id: 'w02', category: 'Wardrobes & Storage', subcategory: 'Hinged', description: 'Hinged wardrobe with internal fittings', specification: '18mm BWP ply, laminate finish, Hettich hinges, shelves', unit: 'sqft', rate: 3500, rate_min: 2600, rate_max: 5000, gst_percent: 18 },
  { id: 'w03', category: 'Wardrobes & Storage', subcategory: 'Walk-in', description: 'Walk-in wardrobe system', specification: '18mm BWP ply, open shelving + rods + drawers, laminate', unit: 'sqft', rate: 5500, rate_min: 4000, rate_max: 8500, gst_percent: 18 },
  { id: 'w04', category: 'Wardrobes & Storage', subcategory: 'TV Unit', description: 'TV unit with wall display', specification: '18mm BWP ply, mix open/closed, back panel, lacquer/veneer', unit: 'sqft', rate: 3800, rate_min: 2800, rate_max: 5500, gst_percent: 18 },
  { id: 'w05', category: 'Wardrobes & Storage', subcategory: 'TV Unit', description: 'Floating media console unit', specification: '18mm ply, wall-hung, concealed LED provision', unit: 'sqft', rate: 4500, rate_min: 3200, rate_max: 6500, gst_percent: 18 },
  { id: 'w06', category: 'Wardrobes & Storage', subcategory: 'Shoe rack', description: 'Shoe rack cabinet', specification: '18mm ply, slanted shelves, ventilated shutters', unit: 'sqft', rate: 2800, rate_min: 2000, rate_max: 4000, gst_percent: 18 },
  { id: 'w07', category: 'Wardrobes & Storage', subcategory: 'Crockery', description: 'Crockery / display unit', specification: '18mm ply + glass shutter, laminate finish, LED inside', unit: 'sqft', rate: 4000, rate_min: 3000, rate_max: 5800, gst_percent: 18 },
  { id: 'w08', category: 'Wardrobes & Storage', subcategory: 'Study', description: 'Study table with overhead cabinet', specification: '18mm ply, L-shaped, 2 drawers, overhead with shutter', unit: 'nos', rate: 28000, rate_min: 18000, rate_max: 45000, gst_percent: 18 },

  // ─── DOORS & WINDOWS ──────────────────────────────────────────
  { id: 'd01', category: 'Doors & Windows', subcategory: 'Doors', description: 'Teak wood door frame + shutter', specification: '2nd teak, 5-panel shutter, M-seal, PU lacquer', unit: 'nos', rate: 48000, rate_min: 32000, rate_max: 85000, gst_percent: 18 },
  { id: 'd02', category: 'Doors & Windows', subcategory: 'Doors', description: 'Flush door with architrave', specification: 'Solid core flush, 35mm, laminate finish, SS hardware', unit: 'nos', rate: 14000, rate_min: 9000, rate_max: 22000, gst_percent: 18 },
  { id: 'd03', category: 'Doors & Windows', subcategory: 'Doors', description: 'WPC door frame + shutter', specification: 'Virgo/Royal Touch WPC, termite-proof, paint finish', unit: 'nos', rate: 20000, rate_min: 14000, rate_max: 32000, gst_percent: 18 },
  { id: 'd04', category: 'Doors & Windows', subcategory: 'Doors', description: 'Frameless glass door 12mm', specification: 'Tempered glass, patch fittings, SS floor spring', unit: 'nos', rate: 35000, rate_min: 25000, rate_max: 60000, gst_percent: 18 },
  { id: 'd05', category: 'Doors & Windows', subcategory: 'Hardware', description: 'Door hardware set (locks + handles)', specification: 'Dorset/Hafele, mortise lock + lever handle per door', unit: 'nos', rate: 4500, rate_min: 2800, rate_max: 9500, gst_percent: 18 },
  { id: 'd06', category: 'Doors & Windows', subcategory: 'Windows', description: 'uPVC window (fixed + sliding 2-track)', specification: 'Prominance/Veka uPVC, 5mm tinted glass, mosquito mesh', unit: 'sqft', rate: 950, rate_min: 700, rate_max: 1300, gst_percent: 18 },
  { id: 'd07', category: 'Doors & Windows', subcategory: 'Windows', description: 'Aluminium powder-coated window', specification: 'Hindalco section, 5mm glass, bronze/silver finish', unit: 'sqft', rate: 650, rate_min: 480, rate_max: 900, gst_percent: 18 },
  { id: 'd08', category: 'Doors & Windows', subcategory: 'Partitions', description: 'Frameless glass partition 12mm', specification: 'Tempered glass, patch fittings, patch hardware', unit: 'sqft', rate: 700, rate_min: 520, rate_max: 950, gst_percent: 18 },
  { id: 'd09', category: 'Doors & Windows', subcategory: 'Partitions', description: 'Aluminium framed glass partition', specification: 'Al section, 8mm tempered glass, powder coated', unit: 'sqft', rate: 480, rate_min: 350, rate_max: 650, gst_percent: 18 },
  { id: 'd10', category: 'Doors & Windows', subcategory: 'Skylights', description: 'Polycarbonate skylight / rooflight', specification: '16mm multi-wall PC, Al frame, fixed', unit: 'sqft', rate: 750, rate_min: 550, rate_max: 1100, gst_percent: 18 },

  // ─── HVAC ─────────────────────────────────────────────────────
  { id: 'h01', category: 'HVAC', subcategory: 'Split AC', description: 'Split AC 1-ton supply & install', specification: 'Daikin/Mitsubishi 3-star, copper piping up to 3m', unit: 'nos', rate: 36000, rate_min: 28000, rate_max: 50000, gst_percent: 28 },
  { id: 'h02', category: 'HVAC', subcategory: 'Split AC', description: 'Split AC 1.5-ton supply & install', specification: 'Daikin/Mitsubishi 5-star inverter, copper piping 3m', unit: 'nos', rate: 48000, rate_min: 36000, rate_max: 68000, gst_percent: 28 },
  { id: 'h03', category: 'HVAC', subcategory: 'Split AC', description: 'Split AC 2-ton supply & install', specification: 'Daikin/Hitachi 5-star inverter, copper piping 3m', unit: 'nos', rate: 62000, rate_min: 48000, rate_max: 88000, gst_percent: 28 },
  { id: 'h04', category: 'HVAC', subcategory: 'Ventilation', description: 'Exhaust fan kitchen 200mm', specification: 'Havells/Usha 8" exhaust fan, ducted to shaft', unit: 'nos', rate: 5500, rate_min: 3500, rate_max: 9000, gst_percent: 18 },
  { id: 'h05', category: 'HVAC', subcategory: 'Ventilation', description: 'Bathroom exhaust fan', specification: 'Havells/Usha 150mm, noise <35dB', unit: 'nos', rate: 3800, rate_min: 2500, rate_max: 6000, gst_percent: 18 },
  { id: 'h06', category: 'HVAC', subcategory: 'Ventilation', description: 'ERV / HRV unit', specification: 'Panasonic/Mitsubishi ERV, 150CMH, ducted', unit: 'nos', rate: 55000, rate_min: 40000, rate_max: 85000, gst_percent: 18 },

  // ─── FURNITURE ───────────────────────────────────────────────
  { id: 'fur01', category: 'Furniture', subcategory: 'Seating', description: 'Sofa 3-seater custom fabric', specification: 'Teak frame, foam seating, fabric upholstery', unit: 'nos', rate: 52000, rate_min: 35000, rate_max: 90000, gst_percent: 18 },
  { id: 'fur02', category: 'Furniture', subcategory: 'Seating', description: 'Sofa 2-seater custom fabric', specification: 'Teak frame, foam seating, fabric upholstery', unit: 'nos', rate: 38000, rate_min: 25000, rate_max: 65000, gst_percent: 18 },
  { id: 'fur03', category: 'Furniture', subcategory: 'Seating', description: 'Accent / lounge chair', specification: 'Custom upholstered, hardwood frame, castors optional', unit: 'nos', rate: 22000, rate_min: 14000, rate_max: 45000, gst_percent: 18 },
  { id: 'fur04', category: 'Furniture', subcategory: 'Beds', description: 'Bed frame king-size (6×6.5ft)', specification: 'Solid wood/PLY frame, upholstered headboard, box base', unit: 'nos', rate: 42000, rate_min: 28000, rate_max: 75000, gst_percent: 18 },
  { id: 'fur05', category: 'Furniture', subcategory: 'Beds', description: 'Bed frame queen-size (5×6.5ft)', specification: 'Solid wood/PLY frame, upholstered headboard', unit: 'nos', rate: 32000, rate_min: 22000, rate_max: 58000, gst_percent: 18 },
  { id: 'fur06', category: 'Furniture', subcategory: 'Dining', description: 'Dining table 6-seater', specification: 'Solid sheesham/marble top, wooden base, 72"×36"', unit: 'nos', rate: 35000, rate_min: 22000, rate_max: 65000, gst_percent: 18 },
  { id: 'fur07', category: 'Furniture', subcategory: 'Tables', description: 'Center/coffee table', specification: 'Marble/glass top, metal base or solid wood', unit: 'nos', rate: 18000, rate_min: 10000, rate_max: 38000, gst_percent: 18 },
  { id: 'fur08', category: 'Furniture', subcategory: 'Tables', description: 'Console / side table', specification: 'Solid wood or metal frame with MDF top', unit: 'nos', rate: 12000, rate_min: 7000, rate_max: 25000, gst_percent: 18 },
  { id: 'fur09', category: 'Furniture', subcategory: 'Outdoor', description: 'Outdoor patio furniture set', specification: 'WPC/teak 4-seater table + chairs, weather-resistant', unit: 'set', rate: 45000, rate_min: 28000, rate_max: 80000, gst_percent: 18 },
  { id: 'fur10', category: 'Furniture', subcategory: 'Office', description: 'Executive office desk', specification: 'L-shaped, 18mm ply, laminate finish, cable management', unit: 'nos', rate: 32000, rate_min: 20000, rate_max: 55000, gst_percent: 18 },

  // ─── DÉCOR & SOFT FURNISHING ──────────────────────────────────
  { id: 'dec01', category: 'Décor & Soft Furnishing', subcategory: 'Curtains', description: 'Curtains (sheer + blackout pair)', specification: 'Supply & stitch, eyelet header, track incl.', unit: 'sqft', rate: 380, rate_min: 250, rate_max: 600, gst_percent: 5 },
  { id: 'dec02', category: 'Décor & Soft Furnishing', subcategory: 'Blinds', description: 'Roller blind (blackout)', specification: 'Somfy motorised / manual roller, custom cut', unit: 'sqft', rate: 320, rate_min: 220, rate_max: 480, gst_percent: 5 },
  { id: 'dec03', category: 'Décor & Soft Furnishing', subcategory: 'Blinds', description: 'Venetian blind (aluminium)', specification: '25mm slats, cord operated, custom width', unit: 'sqft', rate: 380, rate_min: 280, rate_max: 520, gst_percent: 5 },
  { id: 'dec04', category: 'Décor & Soft Furnishing', subcategory: 'Blinds', description: 'Motorised roller blind (Somfy)', specification: 'Somfy RTS motor, remote + app control', unit: 'sqft', rate: 750, rate_min: 550, rate_max: 1100, gst_percent: 18 },
  { id: 'dec05', category: 'Décor & Soft Furnishing', subcategory: 'Carpet', description: 'Area rug custom', specification: 'Hand-tufted / machine-made, custom size', unit: 'sqft', rate: 250, rate_min: 150, rate_max: 500, gst_percent: 5 },
  { id: 'dec06', category: 'Décor & Soft Furnishing', subcategory: 'Mirrors', description: 'Decorative framed mirror', specification: 'Custom frame, silver/bronze, wall-hung', unit: 'nos', rate: 8500, rate_min: 4500, rate_max: 22000, gst_percent: 18 },
  { id: 'dec07', category: 'Décor & Soft Furnishing', subcategory: 'Art', description: 'Art / canvas artwork', specification: 'Locally sourced contemporary canvas, framed', unit: 'nos', rate: 12000, rate_min: 6000, rate_max: 40000, gst_percent: 12 },
  { id: 'dec08', category: 'Décor & Soft Furnishing', subcategory: 'Plants', description: 'Indoor plant with pot (large)', specification: 'Fiddle leaf / areca palm / monstera, decorative pot', unit: 'nos', rate: 5500, rate_min: 3000, rate_max: 12000, gst_percent: 0 },

  // ─── STAIRCASE & RAILING ──────────────────────────────────────
  { id: 'st01', category: 'Staircase & Railing', subcategory: 'Treads', description: 'Granite stair treads (per step)', specification: 'Granite 800×300×30mm, nosing chamfered, polish', unit: 'nos', rate: 2800, rate_min: 2000, rate_max: 4500, gst_percent: 18 },
  { id: 'st02', category: 'Staircase & Railing', subcategory: 'Treads', description: 'Wooden stair treads (per step)', specification: 'Teak / walnut 40mm solid, lacquer finish', unit: 'nos', rate: 4200, rate_min: 3000, rate_max: 7000, gst_percent: 18 },
  { id: 'st03', category: 'Staircase & Railing', subcategory: 'Railing', description: 'SS railing (round tube 50mm)', specification: 'SS 316 handrail + balusters, satin finish', unit: 'rft', rate: 2800, rate_min: 2000, rate_max: 4500, gst_percent: 18 },
  { id: 'st04', category: 'Staircase & Railing', subcategory: 'Railing', description: 'MS railing (flat bar design)', specification: 'MS powder-coated, custom design, paint finish', unit: 'rft', rate: 2000, rate_min: 1400, rate_max: 3200, gst_percent: 18 },
  { id: 'st05', category: 'Staircase & Railing', subcategory: 'Railing', description: 'Glass railing 12mm frameless', specification: 'Tempered glass, SS top handrail, patch fittings', unit: 'rft', rate: 4200, rate_min: 3000, rate_max: 6500, gst_percent: 18 },
  { id: 'st06', category: 'Staircase & Railing', subcategory: 'Railing', description: 'Wooden handrail (teak)', specification: 'Teak handrail 75×50mm, lacquer finish, wall brackets', unit: 'rft', rate: 1400, rate_min: 900, rate_max: 2200, gst_percent: 18 },

  // ─── EXTERNAL WORKS ───────────────────────────────────────────
  { id: 'ext01', category: 'External Works', subcategory: 'Compound', description: 'Compound wall (brick, plastered both sides)', specification: '230mm brick wall, CM 1:4, 2 coats plaster both sides', unit: 'sqft', rate: 280, rate_min: 200, rate_max: 380, gst_percent: 18 },
  { id: 'ext02', category: 'External Works', subcategory: 'Paving', description: 'Paver block driveway', specification: 'Interlocking 60mm paver blocks, GSB base, sand bed', unit: 'sqft', rate: 95, rate_min: 70, rate_max: 130, gst_percent: 18 },
  { id: 'ext03', category: 'External Works', subcategory: 'Paving', description: 'Natural stone paved pathway', specification: 'Kota/sandstone 30mm natural, sand bed', unit: 'sqft', rate: 145, rate_min: 100, rate_max: 200, gst_percent: 18 },
  { id: 'ext04', category: 'External Works', subcategory: 'Landscaping', description: 'Lawn area with irrigation', specification: 'Korean grass, 4-zone drip system, topsoil 150mm', unit: 'sqft', rate: 65, rate_min: 45, rate_max: 95, gst_percent: 18 },
  { id: 'ext05', category: 'External Works', subcategory: 'Landscaping', description: 'Planting / landscaping (shrubs/trees)', specification: 'Supply & plant, incl. topsoil, mulch, basic drip', unit: 'lot', rate: 120000, rate_min: 60000, rate_max: 300000, gst_percent: 0 },
  { id: 'ext06', category: 'External Works', subcategory: 'Gate', description: 'MS main gate (sliding)', specification: 'MS sliding gate 14ft wide, powder coated, motor optional', unit: 'nos', rate: 65000, rate_min: 40000, rate_max: 120000, gst_percent: 18 },
  { id: 'ext07', category: 'External Works', subcategory: 'Pool', description: 'Swimming pool (plunge, 8×4m)', specification: 'RCC shell, tiling, filtration, variable speed pump', unit: 'lot', rate: 850000, rate_min: 600000, rate_max: 1500000, gst_percent: 18 },
  { id: 'ext08', category: 'External Works', subcategory: 'Security', description: 'CCTV system (4 cameras)', specification: '4-cam Hikvision Turbo HD, DVR 8ch, 2TB HDD, monitor', unit: 'lot', rate: 28000, rate_min: 18000, rate_max: 45000, gst_percent: 18 },

  // ─── MISCELLANEOUS ────────────────────────────────────────────
  { id: 'misc01', category: 'Miscellaneous', subcategory: 'Services', description: 'Overhead water tank 1000L', specification: 'Sintex/Plasto 3-layer anti-bacterial, on stand', unit: 'nos', rate: 20000, rate_min: 14000, rate_max: 32000, gst_percent: 18 },
  { id: 'misc02', category: 'Miscellaneous', subcategory: 'Services', description: 'Underground sump 5000L RCC', specification: 'RCC 150mm walls, waterproofed, manhole cover', unit: 'lot', rate: 95000, rate_min: 65000, rate_max: 160000, gst_percent: 18 },
  { id: 'misc03', category: 'Miscellaneous', subcategory: 'Generator', description: 'Diesel generator set 7.5 KVA', specification: 'Kirloskar/Mahindra 7.5KVA, ATS, 100L fuel tank', unit: 'nos', rate: 95000, rate_min: 70000, rate_max: 140000, gst_percent: 18 },
  { id: 'misc04', category: 'Miscellaneous', subcategory: 'Automation', description: 'Smart home automation system', specification: 'Lutron/Crestron: lighting, AC, blinds, 10 zones', unit: 'lot', rate: 180000, rate_min: 100000, rate_max: 400000, gst_percent: 18 },
  { id: 'misc05', category: 'Miscellaneous', subcategory: 'Security', description: 'Video door phone', specification: 'Legrand/Urmet 2-wire, colour 7" monitor', unit: 'nos', rate: 16000, rate_min: 10000, rate_max: 28000, gst_percent: 18 },
  { id: 'misc06', category: 'Miscellaneous', subcategory: 'Solar', description: 'Solar PV system 3kW on-grid', specification: '10×300W panels, string inverter, net metering', unit: 'lot', rate: 180000, rate_min: 140000, rate_max: 250000, gst_percent: 5 },
  { id: 'misc07', category: 'Miscellaneous', subcategory: 'EV', description: 'EV charging point (7.4kW)', specification: 'AC Type-2, 32A, wall-mounted, 6mm² wiring 10m', unit: 'nos', rate: 35000, rate_min: 25000, rate_max: 55000, gst_percent: 18 },
  { id: 'misc08', category: 'Miscellaneous', subcategory: 'Professional', description: "Architect's / Designer's fee", specification: 'Professional service fee on total project cost', unit: 'lot', rate: 0, rate_min: 0, rate_max: 0, gst_percent: 18 },
  { id: 'misc09', category: 'Miscellaneous', subcategory: 'Professional', description: 'Site supervision charges', specification: 'Per visit or monthly basis', unit: 'lot', rate: 0, rate_min: 0, rate_max: 0, gst_percent: 18 },
  { id: 'misc10', category: 'Miscellaneous', subcategory: 'Cleaning', description: 'Final site cleaning & handover', specification: 'Deep clean all areas, waste removal', unit: 'lot', rate: 12000, rate_min: 8000, rate_max: 25000, gst_percent: 18 },
];
