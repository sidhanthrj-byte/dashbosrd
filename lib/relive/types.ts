// Shared types for the Relive Control Room. Safe to import from client components.

export type EventStatus = 'planning' | 'live' | 'wrapped';

export type EventRow = {
  id: number;
  title: string;
  tagline: string | null;
  type: string;
  start_date: string;
  end_date: string;
  venue: string;
  city: string | null;
  status: EventStatus;
  live: number;
  safety_on: number;
  created_at: string;
};

export type EventSummary = EventRow & {
  guest_count: number;
  checked_in: number;
  vendor_count: number;
  open_alerts: number;
};

export type Guest = {
  id: number;
  event_id: number;
  name: string;
  grp: string | null;
  vip: number;
  seat: string | null;
  diet: string;
  phone: string | null;
  checked_in: number;
  checked_in_at: string | null;
  driver_id: number | null;
  pickup_eta: string | null;
  notes: string | null;
};

export type Driver = {
  id: number;
  event_id: number;
  name: string;
  vehicle: string;
  capacity: number;
  phone: string | null;
  status: string;
};

export type Vendor = {
  id: number;
  event_id: number;
  name: string;
  role: string;
  contact: string | null;
  status: 'pending' | 'confirmed' | 'on-site' | 'ready' | 'issue';
  notes: string | null;
};

export type ScheduleItem = {
  id: number;
  event_id: number;
  title: string;
  start_time: string; // ISO datetime
  duration_min: number;
  venue: string | null;
  owner: string | null;
  status: 'pending' | 'in_progress' | 'done' | 'skipped';
  notes: string | null;
  sort: number;
};

export type Cue = {
  id: number;
  event_id: number;
  number: string;
  name: string;
  department: 'audio' | 'lighting' | 'video' | 'sfx' | 'stage';
  status: 'standby' | 'ready' | 'fired';
  fired_at: string | null;
  notes: string | null;
  sort: number;
};

export type AlertLevel = 'info' | 'warn' | 'critical';

export type Alert = {
  id: number;
  event_id: number;
  level: AlertLevel;
  message: string;
  created_at: string;
};

export type Snapshot = {
  event: EventRow;
  guests: Guest[];
  drivers: Driver[];
  vendors: Vendor[];
  schedule: ScheduleItem[];
  cues: Cue[];
  alerts: Alert[];
};

export const DIETS = ['None', 'Vegetarian', 'Vegan', 'Jain', 'Gluten-Free', 'Egg-Free', 'Nut Allergy'] as const;
export const VENDOR_STATUSES = ['pending', 'confirmed', 'on-site', 'ready', 'issue'] as const;
export const CUE_DEPARTMENTS = ['audio', 'lighting', 'video', 'sfx', 'stage'] as const;
export const EVENT_TYPES = ['Wedding', 'Corporate', 'Concert', 'Conference', 'Private Party', 'Festival'] as const;
