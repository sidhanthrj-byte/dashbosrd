// Sub-resource definitions shared by the generic API handlers. Column
// whitelists keep the dynamic SQL safe — request bodies can never name
// a column that isn't listed here.
export const RESOURCES: Record<string, { table: string; columns: string[]; required: string[] }> = {
  guests: {
    table: 'guests',
    columns: ['name', 'grp', 'vip', 'seat', 'diet', 'phone', 'checked_in', 'checked_in_at', 'driver_id', 'pickup_eta', 'notes'],
    required: ['name'],
  },
  drivers: {
    table: 'drivers',
    columns: ['name', 'vehicle', 'capacity', 'phone', 'status'],
    required: ['name', 'vehicle'],
  },
  vendors: {
    table: 'vendors',
    columns: ['name', 'role', 'contact', 'status', 'notes'],
    required: ['name', 'role'],
  },
  schedule: {
    table: 'schedule',
    columns: ['title', 'start_time', 'duration_min', 'venue', 'owner', 'status', 'notes', 'sort'],
    required: ['title', 'start_time'],
  },
  cues: {
    table: 'cues',
    columns: ['number', 'name', 'department', 'status', 'fired_at', 'notes', 'sort'],
    required: ['number', 'name'],
  },
  alerts: {
    table: 'alerts',
    columns: ['level', 'message'],
    required: ['message'],
  },
};
