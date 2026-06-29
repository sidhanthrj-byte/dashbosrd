import { createClient, type Client, type InArgs } from '@libsql/client';

let _client: Client | null = null;

export function getDb(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_URL || 'file:./boq.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

export async function initDb(): Promise<void> {
  const db = getDb();
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      firm_name TEXT,
      city TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS boq_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_phone TEXT,
      client_email TEXT,
      project_type TEXT DEFAULT 'Residential',
      location TEXT,
      total_area REAL,
      status TEXT NOT NULL DEFAULT 'draft',
      markup_percent REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      notes TEXT,
      inclusions TEXT,
      exclusions TEXT,
      user_id INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS boq_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES boq_projects(id),
      name TEXT NOT NULL,
      area REAL,
      notes TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS boq_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL REFERENCES boq_sections(id),
      category TEXT NOT NULL DEFAULT 'Civil',
      description TEXT NOT NULL,
      specification TEXT,
      remarks TEXT,
      unit TEXT NOT NULL DEFAULT 'sqft',
      quantity REAL NOT NULL DEFAULT 0,
      rate REAL NOT NULL DEFAULT 0,
      gst_percent REAL DEFAULT 18,
      sort_order INTEGER DEFAULT 0
    );
  `);

  // Add new columns to existing tables (safe — ignored if already exist)
  const migrations = [
    `ALTER TABLE boq_projects ADD COLUMN inclusions TEXT`,
    `ALTER TABLE boq_projects ADD COLUMN exclusions TEXT`,
    `ALTER TABLE boq_sections ADD COLUMN notes TEXT`,
    `ALTER TABLE boq_items ADD COLUMN remarks TEXT`,
  ];
  for (const sql of migrations) {
    try { await db.execute(sql); } catch { /* column already exists */ }
  }
}

export async function query<T>(sql: string, args?: InArgs): Promise<T[]> {
  const db = getDb();
  const result = await db.execute({ sql, args: args || [] });
  return result.rows as unknown as T[];
}

export async function queryOne<T>(sql: string, args?: InArgs): Promise<T | null> {
  const rows = await query<T>(sql, args);
  return rows[0] ?? null;
}

export async function run(sql: string, args?: InArgs): Promise<{ lastInsertRowid: number; changes: number }> {
  const db = getDb();
  const result = await db.execute({ sql, args: args || [] });
  return {
    lastInsertRowid: Number(result.lastInsertRowid ?? 0),
    changes: result.rowsAffected,
  };
}

export type BOQProject = {
  id: number;
  name: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  project_type: string;
  location: string | null;
  total_area: number | null;
  status: string;
  markup_percent: number;
  discount_amount: number;
  notes: string | null;
  user_id: number | null;
  created_at: string;
  updated_at: string;
};

export type BOQSection = {
  id: number;
  project_id: number;
  name: string;
  area: number | null;
  sort_order: number;
};

export type BOQItem = {
  id: number;
  section_id: number;
  category: string;
  description: string;
  specification: string | null;
  unit: string;
  quantity: number;
  rate: number;
  gst_percent: number;
  sort_order: number;
};
