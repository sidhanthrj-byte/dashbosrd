import { createClient, type Client, type InArgs } from '@libsql/client';

// Relive Control Room database — completely separate from the CRM (crm.db).
let _client: Client | null = null;
let _initialized = false;

export function getDb(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.RELIVE_DB_URL || 'file:./relive.db',
      authToken: process.env.RELIVE_DB_AUTH_TOKEN,
    });
  }
  return _client;
}

export async function initDb(): Promise<void> {
  if (_initialized) return;
  const db = getDb();
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      tagline TEXT,
      type TEXT NOT NULL DEFAULT 'Wedding',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      venue TEXT NOT NULL,
      city TEXT,
      status TEXT NOT NULL DEFAULT 'planning',
      live INTEGER NOT NULL DEFAULT 0,
      safety_on INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      grp TEXT,
      vip INTEGER NOT NULL DEFAULT 0,
      seat TEXT,
      diet TEXT NOT NULL DEFAULT 'None',
      phone TEXT,
      checked_in INTEGER NOT NULL DEFAULT 0,
      checked_in_at TEXT,
      driver_id INTEGER,
      pickup_eta TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      vehicle TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 4,
      phone TEXT,
      status TEXT NOT NULL DEFAULT 'available'
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      contact TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      start_time TEXT NOT NULL,
      duration_min INTEGER NOT NULL DEFAULT 30,
      venue TEXT,
      owner TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      sort INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      number TEXT NOT NULL,
      name TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT 'stage',
      status TEXT NOT NULL DEFAULT 'standby',
      fired_at TEXT,
      notes TEXT,
      sort INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      level TEXT NOT NULL DEFAULT 'info',
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_relive_guests_event ON guests(event_id);
    CREATE INDEX IF NOT EXISTS idx_relive_drivers_event ON drivers(event_id);
    CREATE INDEX IF NOT EXISTS idx_relive_vendors_event ON vendors(event_id);
    CREATE INDEX IF NOT EXISTS idx_relive_schedule_event ON schedule(event_id, start_time);
    CREATE INDEX IF NOT EXISTS idx_relive_cues_event ON cues(event_id, sort);
    CREATE INDEX IF NOT EXISTS idx_relive_alerts_event ON alerts(event_id, id);
  `);
  await seedIfEmpty();
  _initialized = true;
}

export async function query<T>(sql: string, args?: InArgs): Promise<T[]> {
  const result = await getDb().execute({ sql, args: args || [] });
  return result.rows as unknown as T[];
}

export async function queryOne<T>(sql: string, args?: InArgs): Promise<T | null> {
  const rows = await query<T>(sql, args);
  return rows[0] ?? null;
}

export async function run(sql: string, args?: InArgs): Promise<{ lastInsertRowid: number; changes: number }> {
  const result = await getDb().execute({ sql, args: args || [] });
  return { lastInsertRowid: Number(result.lastInsertRowid ?? 0), changes: result.rowsAffected };
}

export async function logAlert(eventId: number, level: string, message: string): Promise<void> {
  await run('INSERT INTO alerts (event_id, level, message) VALUES (?, ?, ?)', [eventId, level, message]);
}

// ---------------------------------------------------------------------------
// Demo seed — a live wedding weekend plus a corporate event in planning,
// dated relative to "now" so the control room feels live out of the box.
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Rohan', 'Meera', 'Kabir', 'Ishita', 'Vikram', 'Nandini', 'Arjun', 'Priya',
  'Dev', 'Shreya', 'Karan', 'Tara', 'Aditya', 'Rhea', 'Nikhil', 'Anjali', 'Siddharth', 'Pooja',
  'Rahul', 'Divya', 'Manav', 'Kavya', 'Yash', 'Sneha', 'Varun', 'Aisha', 'Raghav', 'Nisha',
];
const LAST_NAMES = ['Sharma', 'Iyer', 'Patel', 'Reddy', 'Mehta', 'Kapoor', 'Nair', 'Singh', 'Rao', 'Joshi', 'Malhotra', 'Bhat'];
const DIET_POOL = ['None', 'None', 'None', 'Vegetarian', 'Vegetarian', 'Vegan', 'Jain', 'Gluten-Free', 'Egg-Free', 'Nut Allergy'];

function iso(d: Date): string {
  return d.toISOString();
}

function day(base: Date, dayOffset: number, hour: number, minute = 0): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function seedIfEmpty(): Promise<void> {
  const existing = await queryOne<{ n: number }>('SELECT COUNT(*) AS n FROM events');
  if (existing && existing.n > 0) return;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);

  const wedding = await run(
    `INSERT INTO events (title, tagline, type, start_date, end_date, venue, city, status, live, safety_on)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'live', 1, 1)`,
    ['Abhishek ❤ Priyanka', 'Two days, two venues, one unforgettable weekend', 'Wedding',
     today, tomorrow, 'JW Marriott Prestige Golfshire + Amita Rasa', 'Bengaluru']
  );
  const wid = wedding.lastInsertRowid;

  const driverRows = [
    ['Suresh K', 'Innova Crysta • KA01 AB 1111', 6, '+91 98450 11111'],
    ['Manjunath R', 'Tempo Traveller • KA01 CD 2222', 12, '+91 98450 22222'],
    ['Ravi P', 'Mercedes V-Class • KA01 EF 3333', 5, '+91 98450 33333'],
    ['Imran S', 'Urbania • KA01 GH 4444', 14, '+91 98450 44444'],
  ];
  const driverIds: number[] = [];
  for (const [name, vehicle, capacity, phone] of driverRows) {
    const r = await run('INSERT INTO drivers (event_id, name, vehicle, capacity, phone) VALUES (?, ?, ?, ?, ?)',
      [wid, name, vehicle, capacity, phone]);
    driverIds.push(r.lastInsertRowid);
  }

  // 56 named guests across both sides — 8 VIPs, some checked in / assigned pickups
  let guestCount = 0;
  for (let i = 0; i < 56; i++) {
    const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 7) % LAST_NAMES.length]}`;
    const grp = i % 2 === 0 ? "Abhishek's side" : "Priyanka's side";
    const vip = i < 8 ? 1 : 0;
    const seat = `T${Math.floor(i / 8) + 1}-${(i % 8) + 1}`;
    const diet = DIET_POOL[(i * 3) % DIET_POOL.length];
    const checkedIn = i % 4 === 0 ? 1 : 0;
    const driverId = i % 3 === 0 ? driverIds[i % driverIds.length] : null;
    await run(
      `INSERT INTO guests (event_id, name, grp, vip, seat, diet, checked_in, checked_in_at, driver_id, pickup_eta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [wid, name, grp, vip, seat, diet, checkedIn,
       checkedIn ? iso(new Date(now.getTime() - (i + 1) * 4 * 60000)) : null,
       driverId, driverId ? `${10 + (i % 35)} min` : null]
    );
    guestCount++;
  }

  const vendorRows: [string, string, string, string][] = [
    ['Gastronome Catering', 'F&B', 'Anita • +91 99000 10001', 'on-site'],
    ['LightCraft', 'Lighting', 'Vivek • +91 99000 10002', 'ready'],
    ['SoundWave Audio', 'Audio', 'Farhan • +91 99000 10003', 'on-site'],
    ['FrameByFrame', 'Photo & Film', 'Lakshmi • +91 99000 10004', 'ready'],
    ['FXPros', 'SFX & Pyro', 'Dinesh • +91 99000 10005', 'confirmed'],
    ['Bloom & Vine', 'Florals & Decor', 'Sana • +91 99000 10006', 'on-site'],
    ['Mandap Makers', 'Staging', 'Gopal • +91 99000 10007', 'ready'],
    ['SecureOne', 'Security', 'Major Pillai • +91 99000 10008', 'pending'],
  ];
  for (const [name, role, contact, status] of vendorRows) {
    await run('INSERT INTO vendors (event_id, name, role, contact, status) VALUES (?, ?, ?, ?, ?)',
      [wid, name, role, contact, status]);
  }

  // Run of show — anchored around "now" so there is a live item on first open
  const h = now.getHours();
  const sched: [string, Date, number, string, string, string][] = [
    ['Guest pickups begin', day(now, 0, h - 4), 90, 'Hotel lobbies', 'Transport lead', 'done'],
    ['Baraat assembly', day(now, 0, h - 2), 45, 'Golfshire gates', 'Stage manager', 'done'],
    ['Baraat procession', day(now, 0, h - 1), 60, 'Main drive', 'Stage manager', 'done'],
    ['Varmala ceremony', day(now, 0, h, -15), 45, 'Lakeside mandap', 'Pandit ji + AV', 'in_progress'],
    ['Cocktail hour', day(now, 0, h + 1), 75, 'Terrace lawn', 'F&B lead', 'pending'],
    ['Pheras', day(now, 0, h + 2, 30), 90, 'Lakeside mandap', 'Pandit ji', 'pending'],
    ['Dinner service', day(now, 0, h + 4), 120, 'Grand ballroom', 'F&B lead', 'pending'],
    ['Sangeet performances', day(now, 1, 19), 120, 'Amita Rasa stage', 'Choreographer', 'pending'],
    ['Couple first dance', day(now, 1, 21), 20, 'Amita Rasa stage', 'Stage manager', 'pending'],
    ['Reception & send-off', day(now, 1, 21, 30), 150, 'Amita Rasa', 'Event director', 'pending'],
  ];
  for (let idx = 0; idx < sched.length; idx++) {
    const [title, start, dur, venue, owner, status] = sched[idx];
    await run(
      'INSERT INTO schedule (event_id, title, start_time, duration_min, venue, owner, status, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [wid, title, iso(start), dur, venue, owner, status, idx]
    );
  }

  const cueRows: [string, string, string, string][] = [
    ['Q01', 'Walk-in playlist', 'audio', 'fired'],
    ['Q02', 'Baraat dhol mix', 'audio', 'fired'],
    ['Q03', 'Mandap wash — warm gold', 'lighting', 'fired'],
    ['Q04', 'Varmala spotlight + petals', 'stage', 'ready'],
    ['Q05', 'Cold sparks — varmala moment', 'sfx', 'ready'],
    ['Q06', 'Cocktail ambient set', 'audio', 'standby'],
    ['Q07', 'Pheras livestream start', 'video', 'standby'],
    ['Q08', 'Dinner uplighting — amber', 'lighting', 'standby'],
    ['Q09', 'First dance follow-spot', 'lighting', 'standby'],
    ['Q10', 'Send-off confetti blast', 'sfx', 'standby'],
  ];
  for (let i = 0; i < cueRows.length; i++) {
    const [number, name, department, status] = cueRows[i];
    await run(
      'INSERT INTO cues (event_id, number, name, department, status, fired_at, sort) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [wid, number, name, department, status, status === 'fired' ? iso(new Date(now.getTime() - (10 - i) * 9 * 60000)) : null, i]
    );
  }

  await logAlert(wid, 'info', 'Control room initialized — demo data seeded');
  await logAlert(wid, 'info', 'LightCraft confirmed mandap wash preset');
  await logAlert(wid, 'warn', 'SecureOne crew ETA delayed 20 min — gate 2 uncovered');
  await logAlert(wid, 'info', `${guestCount} guests imported from RSVP sheet`);

  // Second event — corporate, still in planning
  const inTen = new Date(now.getTime() + 10 * 86400000).toISOString().slice(0, 10);
  const inEleven = new Date(now.getTime() + 11 * 86400000).toISOString().slice(0, 10);
  const corp = await run(
    `INSERT INTO events (title, tagline, type, start_date, end_date, venue, city, status, live, safety_on)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'planning', 0, 1)`,
    ['Northwind Leadership Summit', 'Annual offsite — 3 keynotes, 1 gala night', 'Corporate',
     inTen, inEleven, 'Taj West End', 'Bengaluru']
  );
  const cid = corp.lastInsertRowid;
  for (let i = 0; i < 12; i++) {
    const name = `${FIRST_NAMES[(i * 5 + 3) % FIRST_NAMES.length]} ${LAST_NAMES[(i * 3 + 1) % LAST_NAMES.length]}`;
    await run('INSERT INTO guests (event_id, name, grp, vip, seat, diet) VALUES (?, ?, ?, ?, ?, ?)',
      [cid, name, i < 6 ? 'Leadership' : 'Regional heads', i < 3 ? 1 : 0, `R${i + 1}`, DIET_POOL[(i * 2) % DIET_POOL.length]]);
  }
  await run('INSERT INTO vendors (event_id, name, role, contact, status) VALUES (?, ?, ?, ?, ?)',
    [cid, 'Taj Banquets', 'F&B', 'Banquet office', 'confirmed']);
  await run('INSERT INTO vendors (event_id, name, role, contact, status) VALUES (?, ?, ?, ?, ?)',
    [cid, 'AVConnect', 'Audio / Video', 'Prakash • +91 99000 20001', 'pending']);
  await logAlert(cid, 'info', 'Event created — awaiting final guest list from HR');
}
