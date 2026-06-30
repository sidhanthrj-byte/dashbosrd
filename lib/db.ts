import { createClient, type Client, type InArgs } from '@libsql/client';

let _client: Client | null = null;

export function getDb(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_URL || 'file:./crm.db',
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
      city TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_title TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT,
      area TEXT,
      linkedin_url TEXT,
      email TEXT,
      phone TEXT,
      phone_fetched INTEGER DEFAULT 0,
      archived INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'new',
      last_contact_date TEXT,
      next_action TEXT,
      next_action_date TEXT,
      ai_next_steps TEXT,
      notes TEXT,
      batch_number INTEGER DEFAULT 1,
      priority TEXT DEFAULT 'medium',
      project_type TEXT,
      deal_value INTEGER,
      user_id INTEGER REFERENCES users(id),
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

  // Migrations for existing DBs — each is safe to re-run (catches duplicate column error)
  const migrations = [
    'ALTER TABLE leads ADD COLUMN area TEXT',
    'ALTER TABLE leads ADD COLUMN deal_value INTEGER',
    'ALTER TABLE leads ADD COLUMN user_id INTEGER REFERENCES users(id)',
    'ALTER TABLE leads ADD COLUMN archived INTEGER DEFAULT 0',
    'ALTER TABLE leads ADD COLUMN apollo_id TEXT',
    'ALTER TABLE leads ADD COLUMN lookup_attempts INTEGER DEFAULT 0',
    'CREATE INDEX IF NOT EXISTS idx_leads_user_status ON leads(user_id, status)',
    'CREATE INDEX IF NOT EXISTS idx_leads_user_phone ON leads(user_id, phone_fetched)',
    'CREATE INDEX IF NOT EXISTS idx_leads_user_date ON leads(user_id, next_action_date)',
    'CREATE INDEX IF NOT EXISTS idx_leads_archived ON leads(user_id, archived)',
  ];
  for (const m of migrations) {
    try { await db.execute(m); } catch { /* column/index already exists */ }
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

const MUMBAI_LEADS = [
  { company_name: 'Sanjay Puri Architects', contact_name: 'Sanjay Puri', contact_title: 'Principal Architect', city: 'Mumbai', state: 'Maharashtra', area: 'Bandra', email: 'studio@sanjaypuriarchitects.com', linkedin_url: 'https://www.linkedin.com/in/sanjaypuriarchitects', priority: 'high', project_type: 'Luxury Residential' },
  { company_name: 'IMK Architects', contact_name: 'Karan Grover', contact_title: 'Principal Architect', city: 'Mumbai', state: 'Maharashtra', area: 'Lower Parel', email: 'info@imkarchitects.com', linkedin_url: null, priority: 'medium', project_type: 'Residential High-rise' },
  { company_name: 'Abraham John Architects', contact_name: 'Abraham John', contact_title: 'Founding Principal', city: 'Mumbai', state: 'Maharashtra', area: 'South Mumbai', email: 'aja@abrahamjohnarchitects.com', linkedin_url: null, priority: 'medium', project_type: 'Luxury Villas & Bungalows' },
  { company_name: 'Serie Architects', contact_name: 'Christopher Lee', contact_title: 'Founding Director', city: 'Mumbai', state: 'Maharashtra', area: 'Bandra', email: 'mumbai@serie.co.uk', linkedin_url: null, priority: 'high', project_type: 'Cultural & Mixed-use' },
  { company_name: 'Ar. Rajiv Saini & Associates', contact_name: 'Rajiv Saini', contact_title: 'Principal Architect', city: 'Mumbai', state: 'Maharashtra', area: 'Juhu', email: 'studio@rajivsaini.com', linkedin_url: null, priority: 'high', project_type: 'Luxury Interiors' },
  { company_name: 'Malik Architecture', contact_name: 'Rahul Malik', contact_title: 'Principal', city: 'Mumbai', state: 'Maharashtra', area: 'Andheri', email: 'info@malikarchitecture.com', linkedin_url: null, priority: 'medium', project_type: 'Commercial & Residential' },
  { company_name: 'P K Das & Associates', contact_name: 'Prasad Das', contact_title: 'Principal Architect', city: 'Mumbai', state: 'Maharashtra', area: 'South Mumbai', email: 'pkdas@pkdas.com', linkedin_url: null, priority: 'high', project_type: 'Social & Public Architecture' },
  { company_name: 'Abha Narain Lambah Associates', contact_name: 'Abha Narain Lambah', contact_title: 'Principal Architect', city: 'Mumbai', state: 'Maharashtra', area: 'South Mumbai', email: 'anl@anlheritage.com', linkedin_url: null, priority: 'medium', project_type: 'Heritage Conservation' },
  { company_name: 'ZZ Architects', contact_name: 'Zubin Zainuddin', contact_title: 'Partner', city: 'Mumbai', state: 'Maharashtra', area: 'Bandra', email: 'studio@zzarchitects.com', linkedin_url: null, priority: 'medium', project_type: 'Residential & Commercial' },
  { company_name: 'Talati & Panthaky Associated', contact_name: 'Mehul Talati', contact_title: 'Director', city: 'Mumbai', state: 'Maharashtra', area: 'South Mumbai', email: 'info@tpassociates.com', linkedin_url: null, priority: 'medium', project_type: 'Corporate Offices' },
  { company_name: 'Square Foot Design Studio', contact_name: 'Nilesh Shah', contact_title: 'Principal Designer', city: 'Mumbai', state: 'Maharashtra', area: 'Goregaon', email: 'info@squarefootdesign.in', linkedin_url: null, priority: 'low', project_type: 'Hospitality & Retail' },
  { company_name: 'Morphogenesis', contact_name: 'Sonali Rastogi', contact_title: 'Principal Architect', city: 'Mumbai', state: 'Maharashtra', area: 'Worli', linkedin_url: 'https://www.linkedin.com/in/sonali-rastogi-morphogenesis', email: 'info@morphogenesis.org', priority: 'high', project_type: 'Residential & Commercial' },
];

const BANGALORE_LEADS = [
  { company_name: 'Hundredhands', contact_name: 'Prasanna Raghavendra', contact_title: 'Founding Partner', city: 'Bangalore', state: 'Karnataka', area: 'Indiranagar', email: 'studio@hundredhands.com', linkedin_url: 'https://www.linkedin.com/company/hundredhands', priority: 'high', project_type: 'Sustainable Architecture' },
  { company_name: 'Khosla Associates', contact_name: 'Sandeep Khosla', contact_title: 'Principal', city: 'Bangalore', state: 'Karnataka', area: 'Koramangala', email: 'studio@khoslaassociates.com', linkedin_url: 'https://www.linkedin.com/company/khosla-associates', priority: 'high', project_type: 'Luxury Residential' },
  { company_name: 'RSP Design Consultants', contact_name: 'Prasanna Raghavendra', contact_title: 'Director', city: 'Bangalore', state: 'Karnataka', area: 'MG Road', email: 'bangalore@rspdesign.com', linkedin_url: null, priority: 'high', project_type: 'IT Parks & Offices' },
  { company_name: 'Biome Environmental Solutions', contact_name: 'Chitra Vishwanath', contact_title: 'Director', city: 'Bangalore', state: 'Karnataka', area: 'Jayanagar', email: 'info@biome-solutions.com', linkedin_url: null, priority: 'medium', project_type: 'Green Buildings' },
  { company_name: 'DADA & Partners', contact_name: 'Ashish Deshpande', contact_title: 'Design Director', city: 'Bangalore', state: 'Karnataka', area: 'Whitefield', email: 'info@dadapartners.com', linkedin_url: null, priority: 'medium', project_type: 'Commercial' },
  { company_name: 'Cadence Architects', contact_name: 'Smaran Mallesh', contact_title: 'Principal', city: 'Bangalore', state: 'Karnataka', area: 'HSR Layout', email: 'studio@cadencearchitects.in', linkedin_url: null, priority: 'high', project_type: 'Luxury Residential & Hospitality' },
  { company_name: 'Collaborative Architecture', contact_name: 'Chetan Puttalingaiah', contact_title: 'Principal Architect', city: 'Bangalore', state: 'Karnataka', area: 'Bannerghatta Road', email: 'info@collaborativearchitecture.in', linkedin_url: null, priority: 'medium', project_type: 'Affordable Housing' },
  { company_name: 'De Panache Interior Design', contact_name: 'Akshay Khandelwal', contact_title: 'Founder', city: 'Bangalore', state: 'Karnataka', area: 'Koramangala', email: 'info@depanache.com', linkedin_url: null, priority: 'medium', project_type: 'Luxury Interiors' },
  { company_name: 'Viya Architects', contact_name: 'Vikram Singh', contact_title: 'Principal', city: 'Bangalore', state: 'Karnataka', area: 'Sarjapur', email: 'info@viyaarchitects.com', linkedin_url: null, priority: 'medium', project_type: 'Residential Villas' },
  { company_name: 'Studio Lotus', contact_name: 'Ambrish Arora', contact_title: 'Founding Partner', city: 'Bangalore', state: 'Karnataka', area: 'Indiranagar', email: 'bangalore@studiolotus.in', linkedin_url: null, priority: 'high', project_type: 'Heritage & Sustainable' },
  { company_name: 'Mathew & Ghosh Architects', contact_name: 'Soumitro Ghosh', contact_title: 'Principal', city: 'Bangalore', state: 'Karnataka', area: 'Malleswaram', email: 'info@mathewandghosh.com', linkedin_url: null, priority: 'medium', project_type: 'Cultural & Educational' },
  { company_name: 'Spaces Architects & Urbanists', contact_name: 'Anooradha Iyer Siddiqi', contact_title: 'Principal', city: 'Bangalore', state: 'Karnataka', area: 'Electronic City', email: 'info@spacesarchitects.in', linkedin_url: null, priority: 'low', project_type: 'Urban Design' },
];

const CHENNAI_LEADS = [
  { company_name: 'Shanmugam Associates', contact_name: 'S. Shanmugam', contact_title: 'Principal Architect', city: 'Chennai', state: 'Tamil Nadu', area: 'Nungambakkam', email: 'info@shanmugamassociates.com', linkedin_url: null, priority: 'high', project_type: 'Villa & Bungalow' },
  { company_name: 'Venkataramanan Associates', contact_name: 'G. Venkataramanan', contact_title: 'Director', city: 'Chennai', state: 'Tamil Nadu', area: 'Adyar', email: 'va@venkataramanan.com', linkedin_url: null, priority: 'high', project_type: 'Residential & Commercial' },
  { company_name: 'C.R. Narayana Rao Architects', contact_name: 'Narayana Rao', contact_title: 'Principal Architect', city: 'Chennai', state: 'Tamil Nadu', area: 'Anna Nagar', email: 'info@crnrarchitects.com', linkedin_url: null, priority: 'medium', project_type: 'Institutional & Commercial' },
  { company_name: 'Edifice Consultants', contact_name: 'Hafeez Contractor', contact_title: 'Chairman', city: 'Chennai', state: 'Tamil Nadu', area: 'Egmore', email: 'hmc@edifice.in', linkedin_url: null, priority: 'high', project_type: 'Large-scale Commercial' },
  { company_name: 'Parallax Design Studio', contact_name: 'Arun Kumar', contact_title: 'Founder', city: 'Chennai', state: 'Tamil Nadu', area: 'Velachery', email: 'hello@parallaxdesign.in', linkedin_url: null, priority: 'medium', project_type: 'Hospitality & Residential' },
  { company_name: 'Integrated Design Associates', contact_name: 'Priya Krishnan', contact_title: 'Principal', city: 'Chennai', state: 'Tamil Nadu', area: 'OMR', email: 'info@idachennai.com', linkedin_url: null, priority: 'medium', project_type: 'Corporate & Office' },
  { company_name: 'Mindscape Architects', contact_name: 'Ramesh Babu', contact_title: 'Principal Architect', city: 'Chennai', state: 'Tamil Nadu', area: 'ECR', email: 'info@mindscapearchitects.com', linkedin_url: null, priority: 'high', project_type: 'Luxury Villas' },
  { company_name: 'Studio Symbiosis Chennai', contact_name: 'Amit Khanna', contact_title: 'Principal', city: 'Chennai', state: 'Tamil Nadu', area: 'Kilpauk', email: 'chennai@studiosymbiosis.com', linkedin_url: null, priority: 'medium', project_type: 'Mixed-use' },
  { company_name: 'Arkiteca Studio', contact_name: 'Suresh Rajan', contact_title: 'Founder', city: 'Chennai', state: 'Tamil Nadu', area: 'Sholinganallur', email: 'info@arkiteca.com', linkedin_url: null, priority: 'medium', project_type: 'Residential' },
  { company_name: 'Design Consortium', contact_name: 'Krishnaswamy Iyer', contact_title: 'Managing Director', city: 'Chennai', state: 'Tamil Nadu', area: 'Guindy', email: 'info@designconsortium.in', linkedin_url: null, priority: 'high', project_type: 'Industrial & Commercial' },
  { company_name: 'Geometry Design Studio', contact_name: 'Subramanian Pillai', contact_title: 'Principal', city: 'Chennai', state: 'Tamil Nadu', area: 'Porur', email: 'studio@geometrydesign.in', linkedin_url: null, priority: 'medium', project_type: 'Residential & Interior' },
  { company_name: 'Terra Design', contact_name: 'Nalini Thiagarajan', contact_title: 'Principal Architect', city: 'Chennai', state: 'Tamil Nadu', area: 'Besant Nagar', email: 'info@terradesignstudio.com', linkedin_url: null, priority: 'low', project_type: 'Sustainable Homes' },
];

const PUNE_LEADS = [
  { company_name: 'SNK Architects', contact_name: 'Shivdatt Natu', contact_title: 'Partner', city: 'Pune', state: 'Maharashtra', area: 'Koregaon Park', email: 'info@snkarchitects.com', linkedin_url: 'https://www.linkedin.com/company/snk-architects-pune', priority: 'high', project_type: 'Commercial & Retail' },
  { company_name: 'Shirish Beri Architecture', contact_name: 'Shirish Beri', contact_title: 'Principal Architect', city: 'Pune', state: 'Maharashtra', area: 'Aundh', email: 'info@shirishberi.com', linkedin_url: null, priority: 'high', project_type: 'Luxury Residential' },
  { company_name: 'ADEA Architects', contact_name: 'Amar Deshpande', contact_title: 'Principal', city: 'Pune', state: 'Maharashtra', area: 'Baner', email: 'info@adea.in', linkedin_url: null, priority: 'medium', project_type: 'Residential & Commercial' },
  { company_name: 'Environments Architects', contact_name: 'Girish Deshpande', contact_title: 'Principal Architect', city: 'Pune', state: 'Maharashtra', area: 'Hinjawadi', email: 'info@environmentsarchitects.com', linkedin_url: null, priority: 'medium', project_type: 'Corporate & IT Parks' },
  { company_name: 'Design Plus Architects', contact_name: 'Niteen Paranjape', contact_title: 'Director', city: 'Pune', state: 'Maharashtra', area: 'Wakad', email: 'info@designplusarchitects.com', linkedin_url: null, priority: 'medium', project_type: 'Residential High-rise' },
  { company_name: 'VK:e Architectural Design', contact_name: 'Vivek Kapadia', contact_title: 'Principal', city: 'Pune', state: 'Maharashtra', area: 'Kalyani Nagar', email: 'info@vkearchitects.com', linkedin_url: null, priority: 'high', project_type: 'Luxury Bungalows' },
  { company_name: 'AbhikGandhi Architects', contact_name: 'Abhik Gandhi', contact_title: 'Founding Principal', city: 'Pune', state: 'Maharashtra', area: 'Camp', email: 'info@abhikgandhiarchitects.com', linkedin_url: null, priority: 'high', project_type: 'Cultural & Institutional' },
  { company_name: 'Prabhakar B. Bhagwat Architects', contact_name: 'Prabhakar Bhagwat', contact_title: 'Principal Architect', city: 'Pune', state: 'Maharashtra', area: 'Deccan', email: 'pbb@pbharchitects.com', linkedin_url: null, priority: 'medium', project_type: 'Educational Institutions' },
  { company_name: 'The Design Village', contact_name: 'Rahul Kadri', contact_title: 'Director', city: 'Pune', state: 'Maharashtra', area: 'Viman Nagar', email: 'info@thedesignvillage.in', linkedin_url: null, priority: 'medium', project_type: 'Mixed-use Developments' },
  { company_name: 'Tao Architecture', contact_name: 'Hemant Purohit', contact_title: 'Principal', city: 'Pune', state: 'Maharashtra', area: 'Kothrud', email: 'info@taoarchitecture.in', linkedin_url: null, priority: 'medium', project_type: 'Residential & Interior' },
  { company_name: 'Forma Architects', contact_name: 'Sagar Kolte', contact_title: 'Founder', city: 'Pune', state: 'Maharashtra', area: 'Balewadi', email: 'info@formaarchitects.com', linkedin_url: null, priority: 'low', project_type: 'Boutique Residential' },
  { company_name: 'Space Craft Architects', contact_name: 'Mangesh Joshi', contact_title: 'Principal', city: 'Pune', state: 'Maharashtra', area: 'Hadapsar', email: 'info@spacecraftarchitects.com', linkedin_url: null, priority: 'low', project_type: 'Affordable Housing' },
];

const HYDERABAD_LEADS = [
  { company_name: 'SNS Architects', contact_name: 'Ravi Shankar Reddy', contact_title: 'Principal Architect', city: 'Hyderabad', state: 'Telangana', area: 'Banjara Hills', email: 'info@snsarchitects.com', linkedin_url: null, priority: 'high', project_type: 'Luxury Residential' },
  { company_name: 'Morphogenesis Hyderabad', contact_name: 'Ananya Mehta', contact_title: 'Director', city: 'Hyderabad', state: 'Telangana', area: 'Jubilee Hills', email: 'hyd@morphogenesis.org', linkedin_url: null, priority: 'high', project_type: 'Mixed-use' },
  { company_name: 'Spacematters Architecture', contact_name: 'Kiran Venkat', contact_title: 'Founding Partner', city: 'Hyderabad', state: 'Telangana', area: 'Gachibowli', email: 'studio@spacematters.in', linkedin_url: null, priority: 'high', project_type: 'Corporate & IT Parks' },
  { company_name: 'Mold Architects', contact_name: 'Priya Reddy', contact_title: 'Principal Architect', city: 'Hyderabad', state: 'Telangana', area: 'Kondapur', email: 'info@moldarchitects.com', linkedin_url: null, priority: 'medium', project_type: 'Residential & Commercial' },
  { company_name: 'Cadence Architects Hyderabad', contact_name: 'Sathya Prakash', contact_title: 'Principal', city: 'Hyderabad', state: 'Telangana', area: 'Madhapur', email: 'hyd@cadencearchitects.in', linkedin_url: null, priority: 'high', project_type: 'Luxury Residential & Hospitality' },
  { company_name: 'Hitech Design Studio', contact_name: 'Venkata Ramana', contact_title: 'Design Director', city: 'Hyderabad', state: 'Telangana', area: 'Hitech City', email: 'info@hitechdesignstudio.com', linkedin_url: null, priority: 'medium', project_type: 'Tech Parks & Offices' },
  { company_name: 'Arthaspace Architects', contact_name: 'Deepika Nair', contact_title: 'Co-Founder', city: 'Hyderabad', state: 'Telangana', area: 'Kukatpally', email: 'studio@arthaspace.in', linkedin_url: null, priority: 'medium', project_type: 'Affordable Housing' },
  { company_name: 'Deccan Architects', contact_name: 'Suresh Babu Rao', contact_title: 'Managing Director', city: 'Hyderabad', state: 'Telangana', area: 'Begumpet', email: 'info@deccanarchitects.com', linkedin_url: null, priority: 'high', project_type: 'Commercial & Retail' },
  { company_name: 'Studio Symbiosis Hyderabad', contact_name: 'Rahul Deshpande', contact_title: 'Principal', city: 'Hyderabad', state: 'Telangana', area: 'Ameerpet', email: 'hyd@studiosymbiosis.com', linkedin_url: null, priority: 'medium', project_type: 'Mixed-use Developments' },
  { company_name: 'Vastushilpa Consultants', contact_name: 'Lakshmi Prasad', contact_title: 'Chief Architect', city: 'Hyderabad', state: 'Telangana', area: 'Banjara Hills', email: 'info@vastushilpa.com', linkedin_url: null, priority: 'high', project_type: 'Luxury Villas & Bungalows' },
  { company_name: 'Form Follows Function', contact_name: 'Aditya Krishnamurthy', contact_title: 'Founder', city: 'Hyderabad', state: 'Telangana', area: 'Jubilee Hills', email: 'hello@fff-architects.com', linkedin_url: null, priority: 'medium', project_type: 'Boutique Residential' },
  { company_name: 'Tetra Architects', contact_name: 'Swathi Rao', contact_title: 'Senior Architect', city: 'Hyderabad', state: 'Telangana', area: 'Gachibowli', email: 'info@tetraarchitects.in', linkedin_url: null, priority: 'low', project_type: 'Sustainable Design' },
];

const CITY_LEADS: Record<string, typeof MUMBAI_LEADS> = {
  Mumbai: MUMBAI_LEADS,
  Bangalore: BANGALORE_LEADS,
  Chennai: CHENNAI_LEADS,
  Pune: PUNE_LEADS,
  Hyderabad: HYDERABAD_LEADS,
};

export async function seedLeadsForUser(userId: number, city: string): Promise<void> {
  const leads = CITY_LEADS[city];
  if (!leads) return;

  for (const lead of leads) {
    await run(
      `INSERT INTO leads (company_name, contact_name, contact_title, city, state, area, linkedin_url, email, priority, project_type, batch_number, status, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'new', ?)`,
      [lead.company_name, lead.contact_name, lead.contact_title, lead.city, lead.state, lead.area ?? null, lead.linkedin_url ?? null, lead.email ?? null, lead.priority, lead.project_type, userId]
    );
  }

  await run("INSERT OR REPLACE INTO settings VALUES (?, '1')", [`last_batch_${userId}`]);
  await run("INSERT OR REPLACE INTO settings VALUES (?, '0')", [`leads_contacted_${userId}`]);
}

export type Lead = {
  id: number;
  company_name: string;
  contact_name: string;
  contact_title: string;
  city: string;
  state: string;
  area: string | null;
  linkedin_url: string | null;
  email: string | null;
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
  deal_value: number | null;
  archived: number;
  apollo_id: string | null;
  lookup_attempts: number;
  user_id: number | null;
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
