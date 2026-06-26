export type PriceTier = 'dealer' | 'msp' | 'specifiors'
export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'l-shape'
export type UnitSystem = 'feet' | 'meters'
export type LightType = 'none' | 'single_color' | 'single_color_dimmable' | 'tunable' | 'rgb' | 'rgbw'
export type GripperType = 'CW' | 'CC' | 'Profile' | 'Flexible CW' | 'Flexible CC'
export type LEDWidth = 'standard' | 'wider'
export type SurfaceType = 'ceiling' | 'wall'

export interface RectDims { length: number; width: number }
export interface CircleDims { diameter: number }
export interface TriangleDims { base: number; height: number; side1: number; side2: number; side3: number }
export interface LShaperDims { length1: number; width1: number; length2: number; width2: number }

export type ShapeDimensions = RectDims | CircleDims | TriangleDims | LShaperDims

export interface CeilingItem {
  id: string
  name: string
  surface: SurfaceType
  shape: ShapeType
  unit: UnitSystem
  dimensions: ShapeDimensions
  fabricType: string
  withPrinting: boolean
  withFleece: boolean
  lightType: LightType
  lightDepth: number
  ledWidth: LEDWidth
  gripperType: GripperType
  quantity: number
  notes: string
}

export interface Quote {
  id: string
  quoteNumber: string
  leadId?: number | null
  clientName: string
  projectName: string
  location: string
  date: string
  validUntil: string
  priceTier: PriceTier
  markupPercent: number
  items: CeilingItem[]
  installationRatePerSqft: number
  notes: string
  grandTotal: number
  userId?: number | null
  createdAt: string
  updatedAt: string
}

export interface LineItem {
  description: string
  qty: number
  unit: string
  dealerRate: number
  tierRate: number
  dealerAmount: number
  tierAmount: number
}

export interface FabricDetail {
  rollWidth: number
  cutLength: number
  totalArea: number
  usedArea: number
  wastageArea: number
  wastagePercent: number
  orientation: string
}

export interface LEDDetail {
  stripCount: number
  runningLength: number
  totalRunningMeters: number
  totalWatts: number
}

export interface ItemBreakdown {
  item: CeilingItem
  lengthM: number
  widthM: number
  areaM2: number
  areaM2Used: number
  perimeterM: number
  fabricDetail: FabricDetail
  ledDetail: LEDDetail | null
  lineItems: LineItem[]
  installationCost: number
  subtotalDealer: number
  subtotalTier: number
  subtotalFinal: number
  itemTotal: number
}

export interface QuoteBreakdown {
  quote: Quote
  itemBreakdowns: ItemBreakdown[]
  materialsTotalDealer: number
  materialsTotalTier: number
  materialsTotalFinal: number
  totalInstallation: number
  grandTotal: number
}
