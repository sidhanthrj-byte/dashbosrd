import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || './crm.db';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(path.resolve(DB_PATH));
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_title TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT,
      linkedin_url TEXT,
      email TEXT,
      phone TEXT,
      phone_fetched INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'new',
      last_contact_date TEXT,
      next_action TEXT,
      next_action_date TEXT,
      ai_next_steps TEXT,
      notes TEXT,
      batch_number INTEGER DEFAULT 1,
      priority TEXT DEFAULT 'medium',
      project_type TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      status_before TEXT,
      status_after TEXT NOT NULL,
      notes TEXT,
      outcome TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  try { db.exec('ALTER TABLE leads ADD COLUMN area TEXT'); } catch {}
  try { db.exec('ALTER TABLE leads ADD COLUMN deal_value INTEGER'); } catch {}

  const count = (db.prepare('SELECT COUNT(*) as c FROM leads').get() as { c: number }).c;
  if (count === 0) {
    seedLeads(db);
    db.prepare("INSERT OR REPLACE INTO settings VALUES ('last_batch', '1')").run();
    db.prepare("INSERT OR REPLACE INTO settings VALUES ('leads_contacted_since_last_batch', '0')").run();
  }
}

function seedLeads(db: Database.Database) {
  const leads = [
    {
      company_name: 'Morphogenesis',
      contact_name: 'Sonali Rastogi',
      contact_title: 'Principal Architect',
      city: 'New Delhi',
      state: 'Delhi',
      linkedin_url: 'https://www.linkedin.com/in/sonali-rastogi-morphogenesis',
      email: 'info@morphogenesis.org',
      priority: 'high',
      project_type: 'Residential & Commercial',
    },
    {
      company_name: 'Sanjay Puri Architects',
      contact_name: 'Sanjay Puri',
      contact_title: 'Principal Architect',
      city: 'Mumbai',
      state: 'Maharashtra',
      linkedin_url: 'https://www.linkedin.com/in/sanjaypuriarchitects',
      email: 'studio@sanjaypuriarchitects.com',
      priority: 'high',
      project_type: 'Luxury Residential',
    },
    {
      company_name: 'Design Forum International',
      contact_name: 'Vineet Singhania',
      contact_title: 'Managing Director',
      city: 'New Delhi',
      state: 'Delhi',
      linkedin_url: 'https://www.linkedin.com/in/vineet-singhania-dfi',
      email: 'dfi@designforuminternational.com',
      priority: 'high',
      project_type: 'Corporate & Hospitality',
    },
    {
      company_name: 'RSP Design Consultants',
      contact_name: 'Ar. Prasanna Raghavendra',
      contact_title: 'Director',
      city: 'Bangalore',
      state: 'Karnataka',
      linkedin_url: 'https://www.linkedin.com/company/rsp-design-consultants',
      email: 'bangalore@rspdesign.com',
      priority: 'high',
      project_type: 'IT Parks & Offices',
    },
    {
      company_name: 'IMK Architects',
      contact_name: 'Karan Grover',
      contact_title: 'Principal Architect',
      city: 'Mumbai',
      state: 'Maharashtra',
      linkedin_url: 'https://www.linkedin.com/company/imk-architects',
      email: 'info@imkarchitects.com',
      priority: 'medium',
      project_type: 'Residential High-rise',
    },
    {
      company_name: 'Studio Archohm',
      contact_name: 'Sourabh Gupta',
      contact_title: 'Principal Architect',
      city: 'Noida',
      state: 'Uttar Pradesh',
      linkedin_url: 'https://www.linkedin.com/in/sourabh-gupta-archohm',
      email: 'studio@archohm.com',
      priority: 'medium',
      project_type: 'Residential & Urban Design',
    },
    {
      company_name: 'Hundredhands',
      contact_name: 'Prasanna Raghavendra',
      contact_title: 'Founding Partner',
      city: 'Bangalore',
      state: 'Karnataka',
      linkedin_url: 'https://www.linkedin.com/company/hundredhands',
      email: 'studio@hundredhands.com',
      priority: 'medium',
      project_type: 'Sustainable Architecture',
    },
    {
      company_name: 'Abraham John Architects',
      contact_name: 'Abraham John',
      contact_title: 'Founding Principal',
      city: 'Mumbai',
      state: 'Maharashtra',
      linkedin_url: 'https://www.linkedin.com/company/abraham-john-architects',
      email: 'aja@abrahamjohnarchitects.com',
      priority: 'medium',
      project_type: 'Luxury Villas & Bungalows',
    },
    {
      company_name: 'SNK Architects',
      contact_name: 'Shivdatt Natu',
      contact_title: 'Partner',
      city: 'Pune',
      state: 'Maharashtra',
      linkedin_url: 'https://www.linkedin.com/company/snk-architects-pune',
      email: 'info@snkarchitects.com',
      priority: 'medium',
      project_type: 'Commercial & Retail',
    },
    {
      company_name: 'Spacematters',
      contact_name: 'Aashish Contractor',
      contact_title: 'Principal',
      city: 'New Delhi',
      state: 'Delhi',
      linkedin_url: 'https://www.linkedin.com/company/spacematters',
      email: 'info@spacematters.in',
      priority: 'medium',
      project_type: 'Interior & Architecture',
    },
    {
      company_name: 'HCP Design Planning & Management',
      contact_name: 'Bimal Patel',
      contact_title: 'Director',
      city: 'Ahmedabad',
      state: 'Gujarat',
      linkedin_url: 'https://www.linkedin.com/company/hcp-design-planning-management',
      email: 'hcp@hcp.in',
      priority: 'high',
      project_type: 'Urban Planning & Infrastructure',
    },
    {
      company_name: 'Serie Architects',
      contact_name: 'Christopher Lee',
      contact_title: 'Founding Director',
      city: 'Mumbai',
      state: 'Maharashtra',
      linkedin_url: 'https://www.linkedin.com/company/serie-architects',
      email: 'mumbai@serie.co.uk',
      priority: 'high',
      project_type: 'Cultural & Mixed-use',
    },
  ];

  const stmt = db.prepare(`
    INSERT INTO leads (company_name, contact_name, contact_title, city, state, linkedin_url, email, priority, project_type, batch_number, status)
    VALUES (@company_name, @contact_name, @contact_title, @city, @state, @linkedin_url, @email, @priority, @project_type, 1, 'new')
  `);

  for (const lead of leads) {
    stmt.run(lead);
  }
}

export type Lead = {
  id: number;
  company_name: string;
  contact_name: string;
  contact_title: string;
  city: string;
  state: string;
  linkedin_url: string;
  email: string;
  phone: string | null;
  phone_fetched: number;
  status: string;
  last_contact_date: string | null;
  next_action: string | null;
  next_action_date: string | null;
  ai_next_steps: string | null;
  notes: string | null;
  batch_number: number;
  priority: string;
  project_type: string | null;
  area: string | null;
  deal_value: number | null;
  created_at: string;
  updated_at: string;
};

export type CallLog = {
  id: number;
  lead_id: number;
  status_before: string;
  status_after: string;
  notes: string | null;
  outcome: string | null;
  created_at: string;
};
