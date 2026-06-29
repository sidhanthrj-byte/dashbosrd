import { initDb, query, queryOne } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { PrintButton } from '@/components/boq/PrintButton';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'pongs-crm-jwt-secret-2026-secure');
const CATEGORY_ORDER = [
  'Civil Work', 'Flooring', 'Wall & Painting', 'False Ceiling', 'Electrical',
  'Plumbing', 'Modular Kitchen', 'Wardrobes & Storage', 'Doors & Windows',
  'HVAC', 'Furniture', 'Décor & Soft Furnishing', 'Staircase & Railing',
  'External Works', 'Security Systems', 'Fire Safety', 'AV & Home Theater',
  'Gym & Wellness', 'Solar & EV', 'Landscaping', 'Appliances', 'Miscellaneous',
];

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function inWords(n: number): string {
  if (n === 0) return 'Zero Rupees Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function helper(num: number): string {
    if (num === 0) return '';
    if (num < 20) return ones[num] + ' ';
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '') + ' ';
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred ' + helper(num % 100);
    if (num < 100000) return helper(Math.floor(num / 1000)) + 'Thousand ' + helper(num % 1000);
    if (num < 10000000) return helper(Math.floor(num / 100000)) + 'Lakh ' + helper(num % 100000);
    return helper(Math.floor(num / 10000000)) + 'Crore ' + helper(num % 10000000);
  }
  return helper(Math.round(n)).trim() + ' Rupees Only';
}

type Params = { params: Promise<{ id: string }> };

export default async function PrintPage({ params }: Params) {
  const { id } = await params;
  await initDb();

  const cookieStore = await cookies();
  const token = cookieStore.get('pongs_session')?.value;
  if (!token) redirect('/login');
  let userId = 0;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    userId = (payload as { userId: number }).userId;
  } catch { redirect('/login'); }

  const project = await queryOne<{
    id: number; name: string; client_name: string; client_phone: string;
    client_email: string; project_type: string; location: string;
    total_area: number; status: string; markup_percent: number;
    discount_amount: number; notes: string; created_at: string;
    inclusions: string | null; exclusions: string | null;
  }>('SELECT * FROM boq_projects WHERE id = ? AND user_id = ?', [id, userId]);

  if (!project) redirect('/boq');

  const user = await queryOne<{ name: string; firm_name: string; city: string }>(
    'SELECT name, firm_name, city FROM users WHERE id = ?', [userId]
  );

  const sections = await query<{ id: number; name: string; area: number; sort_order: number; notes: string | null }>(
    'SELECT * FROM boq_sections WHERE project_id = ? ORDER BY sort_order, id', [id]
  );

  const allItems = await query<{
    id: number; section_id: number; category: string; description: string;
    specification: string; remarks: string | null; unit: string;
    quantity: number; rate: number; gst_percent: number;
  }>(
    `SELECT i.* FROM boq_items i JOIN boq_sections s ON s.id = i.section_id
     WHERE s.project_id = ? ORDER BY s.sort_order, s.id, i.sort_order, i.id`, [id]
  );

  let subtotal = 0, gstTotal = 0;
  for (const item of allItems) {
    const amt = item.quantity * item.rate;
    subtotal += amt;
    gstTotal += amt * (item.gst_percent / 100);
  }
  const markup = subtotal * ((project.markup_percent ?? 0) / 100);
  const discount = project.discount_amount ?? 0;
  const grandTotal = subtotal + gstTotal + markup - discount;

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const boqRef = `BOQ-${String(project.id).padStart(5, '0')}`;

  const sectionItems = sections.map(section => ({
    section,
    items: allItems.filter(i => i.section_id === section.id),
    subtotal: allItems.filter(i => i.section_id === section.id).reduce((s, i) => s + i.quantity * i.rate, 0),
  }));

  const categoryTotals: Record<string, number> = {};
  for (const item of allItems) {
    categoryTotals[item.category] = (categoryTotals[item.category] ?? 0) + item.quantity * item.rate;
  }

  const activeCats = CATEGORY_ORDER.filter(c => categoryTotals[c] > 0);

  return (
    <html lang="en">
      <head>
        <title>{project.name} — BOQ · {boqRef}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: #f0f0f4;
            color: #1a1a2e;
            font-size: 10pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page { max-width: 210mm; margin: 0 auto 16px; background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }

          @media print {
            body { background: #fff; font-size: 9pt; }
            .no-print { display: none !important; }
            .page { box-shadow: none; margin: 0; }
            .page-break { page-break-before: always; }
            .avoid-break { page-break-inside: avoid; }
          }

          /* ── COVER ─────────────────────────────────── */
          .cover {
            min-height: 297mm;
            display: flex;
            flex-direction: column;
            background: #0d0d1e;
            color: #f0f0f8;
            position: relative;
            overflow: hidden;
          }
          .cover-grid {
            position: absolute; inset: 0;
            background-image:
              linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
            background-size: 36px 36px;
          }
          .cover-glow {
            position: absolute;
            top: 30%; left: 50%;
            transform: translate(-50%, -50%);
            width: 500px; height: 500px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
          }
          .cover-inner { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; padding: 48px; }
          .cover-logo { display: flex; align-items: center; gap: 12px; margin-bottom: auto; }
          .cover-logo-box {
            width: 42px; height: 42px;
            background: linear-gradient(135deg, #4f46e5, #6366f1);
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-weight: 900; font-size: 20px; color: #fff;
            box-shadow: 0 4px 16px rgba(99,102,241,0.4);
          }
          .cover-firm-name { font-size: 13pt; font-weight: 700; color: #f0f0f8; }
          .cover-firm-sub { font-size: 8pt; color: #7070a0; font-weight: 400; margin-top: 1px; }

          .cover-body { margin: 60px 0 48px; }
          .cover-boq-label {
            display: inline-block;
            font-size: 7.5pt; letter-spacing: 4px; text-transform: uppercase;
            color: #6366f1;
            border: 1px solid rgba(99,102,241,0.3);
            border-radius: 4px;
            padding: 4px 10px;
            margin-bottom: 20px;
            background: rgba(99,102,241,0.08);
          }
          .cover-title {
            font-size: 30pt; font-weight: 800; line-height: 1.15;
            color: #f0f0f8; margin-bottom: 16px;
            letter-spacing: -0.02em;
          }
          .cover-client { font-size: 12pt; color: #a0a0c8; margin-bottom: 6px; font-weight: 500; }
          .cover-meta { font-size: 8.5pt; color: #6060a0; margin-top: 4px; }
          .cover-divider { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 36px 0; }

          .cover-total-card {
            display: inline-flex; flex-direction: column;
            background: rgba(99,102,241,0.08);
            border: 1px solid rgba(99,102,241,0.25);
            border-radius: 14px;
            padding: 22px 32px;
            min-width: 280px;
          }
          .cover-total-label { font-size: 7.5pt; letter-spacing: 3px; text-transform: uppercase; color: #6060a0; margin-bottom: 8px; }
          .cover-total-value { font-size: 30pt; font-weight: 900; color: #818cf8; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
          .cover-total-words { font-size: 7.5pt; color: #5050a0; margin-top: 8px; font-style: italic; line-height: 1.5; }

          .cover-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin-top: 36px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 28px; }
          .cover-meta-item { display: flex; flex-direction: column; gap: 4px; }
          .cover-meta-item + .cover-meta-item { border-left: 1px solid rgba(255,255,255,0.06); padding-left: 20px; }
          .cover-meta-key { font-size: 7pt; letter-spacing: 2px; text-transform: uppercase; color: #5050a0; }
          .cover-meta-val { font-size: 9pt; color: #9090c0; font-weight: 500; }

          /* ── CONTENT PAGES ─────────────────────────── */
          .content { padding: 32px 40px; min-height: 270mm; }
          .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #1a1a2e; }
          .page-header-left { display: flex; flex-direction: column; gap: 2px; }
          .page-header-firm { font-size: 9pt; font-weight: 700; color: #1a1a2e; }
          .page-header-proj { font-size: 7.5pt; color: #888; }
          .page-header-right { text-align: right; }
          .page-no { font-size: 7.5pt; color: #bbb; }
          .page-ref { font-size: 7pt; color: #ccc; font-weight: 500; letter-spacing: 0.05em; }

          .section-block { margin-bottom: 32px; }
          .section-header {
            display: flex; align-items: center; justify-content: space-between;
            background: #1a1a2e; color: #f0f0f8;
            padding: 10px 16px; border-radius: 6px 6px 0 0;
          }
          .section-name { font-weight: 700; font-size: 10.5pt; }
          .section-meta { font-size: 7.5pt; color: #9090c0; }

          table { width: 100%; border-collapse: collapse; }
          thead { background: #f5f5fa; }
          th {
            font-size: 7pt; font-weight: 700; letter-spacing: 0.06em;
            text-transform: uppercase; color: #666;
            padding: 8px 10px; text-align: left;
            border-bottom: 1px solid #e0e0ea;
          }
          th.right { text-align: right; }
          td { padding: 7.5px 10px; border-bottom: 1px solid #f0f0f6; vertical-align: top; }
          td.right { text-align: right; font-variant-numeric: tabular-nums; }
          tr:nth-child(even) td { background: #fafafa; }
          .desc-main { font-weight: 600; font-size: 9pt; color: #1a1a2e; line-height: 1.4; }
          .desc-spec { font-size: 7.5pt; color: #888; margin-top: 2px; line-height: 1.4; }
          .desc-remarks { font-size: 7.5pt; color: #7070a0; margin-top: 2px; font-style: italic; }
          .cat-chip {
            display: inline-block;
            font-size: 6.5pt; font-weight: 600; letter-spacing: 0.04em;
            padding: 2px 6px; border-radius: 3px;
            background: #ebebf8; color: #4f46e5;
            white-space: nowrap;
          }
          .num { font-variant-numeric: tabular-nums; font-size: 9pt; }
          .num-total { font-variant-numeric: tabular-nums; font-size: 9pt; font-weight: 700; }

          .section-subtotal {
            display: flex; justify-content: space-between;
            background: #f0f0f8; padding: 9px 16px;
            border-radius: 0 0 6px 6px;
            border-top: 2px solid #e0e0ea;
          }
          .section-subtotal-label { font-size: 8.5pt; font-weight: 700; color: #555; }
          .section-subtotal-val { font-size: 8.5pt; font-weight: 800; color: #4f46e5; font-variant-numeric: tabular-nums; }

          /* ── SUMMARY ────────────────────────────────── */
          .summary-page { padding: 32px 40px; min-height: 270mm; }

          .summary-h { font-size: 14pt; font-weight: 800; color: #1a1a2e; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2.5px solid #4f46e5; letter-spacing: -0.01em; }
          .summary-sub-h { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin: 24px 0 10px; }

          .cat-table { width: 100%; margin-bottom: 8px; }
          .cat-table td { padding: 6px 8px; font-size: 8.5pt; border-bottom: 1px solid #f0f0f6; }
          .cat-table td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
          .cat-bar-cell { width: 80px; }
          .cat-bar-wrap { height: 5px; background: #eeeef8; border-radius: 3px; overflow: hidden; }
          .cat-bar-fill { height: 100%; background: linear-gradient(90deg, #4f46e5, #818cf8); border-radius: 3px; }

          .totals-box { border: 1.5px solid #e0e0ea; border-radius: 10px; overflow: hidden; margin-top: 24px; }
          .totals-row { display: flex; justify-content: space-between; padding: 9px 16px; border-bottom: 1px solid #f0f0f8; }
          .totals-row:last-child { border-bottom: none; }
          .totals-label { font-size: 9pt; color: #555; }
          .totals-val { font-size: 9pt; font-variant-numeric: tabular-nums; font-weight: 500; color: #1a1a2e; }
          .totals-grand { background: #1a1a2e; }
          .totals-grand .totals-label { color: #f0f0f8; font-weight: 800; font-size: 10pt; }
          .totals-grand .totals-val { color: #818cf8; font-weight: 900; font-size: 12pt; }

          .amount-words { font-size: 7.5pt; color: #999; font-style: italic; margin: 12px 0 0 0; line-height: 1.6; }

          /* Inclusions / Exclusions */
          .ie-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
          .ie-box { border: 1px solid #e0e0ea; border-radius: 8px; padding: 14px 16px; }
          .ie-title { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
          .ie-title.inc { color: #059669; border-bottom: 2px solid #d1fae5; padding-bottom: 6px; }
          .ie-title.exc { color: #dc2626; border-bottom: 2px solid #fee2e2; padding-bottom: 6px; }
          .ie-text { font-size: 8pt; color: #555; line-height: 1.65; white-space: pre-wrap; }

          /* Terms */
          .terms { margin-top: 24px; padding: 16px 20px; background: #fafafa; border: 1px solid #e8e8f0; border-radius: 8px; }
          .terms-h { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #666; margin-bottom: 10px; }
          .terms ol { padding-left: 16px; }
          .terms li { font-size: 7.5pt; color: #666; margin-bottom: 5px; line-height: 1.55; }

          /* Signature */
          .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 36px; }
          .sig-box { border-top: 1.5px solid #d0d0e0; padding-top: 12px; }
          .sig-label { font-size: 7pt; color: #aaa; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
          .sig-name { font-size: 9.5pt; font-weight: 700; color: #1a1a2e; margin-top: 6px; }
          .sig-firm { font-size: 8pt; color: #777; margin-top: 3px; }
          .sig-date { font-size: 7.5pt; color: #aaa; margin-top: 3px; }
        `}</style>
      </head>
      <body>
        <PrintButton />

        {/* ══════ COVER PAGE ══════ */}
        <div className="page cover">
          <div className="cover-grid" />
          <div className="cover-glow" />
          <div className="cover-inner">
            {/* Logo */}
            <div className="cover-logo">
              <div className="cover-logo-box">B</div>
              <div>
                <div className="cover-firm-name">{user?.firm_name ?? user?.name ?? 'Architecture Studio'}</div>
                <div className="cover-firm-sub">Bill of Quantities · BOQwise</div>
              </div>
            </div>

            {/* Main content */}
            <div className="cover-body">
              <span className="cover-boq-label">Bill of Quantities</span>
              <div className="cover-title">{project.name}</div>
              <div className="cover-client">Prepared for: {project.client_name}</div>
              {project.client_phone && <div className="cover-meta">{project.client_phone}</div>}
              {project.client_email && <div className="cover-meta">{project.client_email}</div>}

              <hr className="cover-divider" />

              <div className="cover-total-card">
                <div className="cover-total-label">Estimated Grand Total (incl. GST)</div>
                <div className="cover-total-value">₹{fmt(grandTotal)}</div>
                <div className="cover-total-words">{inWords(grandTotal)}</div>
              </div>

              <div className="cover-meta-grid">
                <div className="cover-meta-item">
                  <span className="cover-meta-key">Project Type</span>
                  <span className="cover-meta-val">{project.project_type}</span>
                </div>
                {project.location && (
                  <div className="cover-meta-item">
                    <span className="cover-meta-key">Location</span>
                    <span className="cover-meta-val">{project.location}</span>
                  </div>
                )}
                {project.total_area > 0 && (
                  <div className="cover-meta-item">
                    <span className="cover-meta-key">Total Area</span>
                    <span className="cover-meta-val">{project.total_area} sqft</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5pt', color: '#4040a0', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
              <span>Date: {today}</span>
              <span>Ref: {boqRef}</span>
              <span>Status: {project.status.charAt(0).toUpperCase() + project.status.slice(1)}</span>
            </div>
          </div>
        </div>

        {/* ══════ SECTION PAGES ══════ */}
        {sectionItems.map(({ section, items: secItems, subtotal: secSub }, secIdx) => (
          <div key={section.id} className="page content page-break">
            <div className="page-header">
              <div className="page-header-left">
                <span className="page-header-firm">{user?.firm_name ?? user?.name}</span>
                <span className="page-header-proj">{project.name}</span>
              </div>
              <div className="page-header-right">
                <div className="page-no">Page {secIdx + 2}</div>
                <div className="page-ref">{boqRef}</div>
              </div>
            </div>

            <div className="section-block">
              <div className="section-header">
                <span className="section-name">{section.name}</span>
                <span className="section-meta">
                  {section.area ? `${section.area} sqft  ·  ` : ''}
                  {secItems.length} item{secItems.length !== 1 ? 's' : ''}
                </span>
              </div>

              {section.notes && (
                <div style={{ padding: '8px 16px', background: '#fafafa', borderLeft: '3px solid #d0d0ea', fontSize: '8pt', color: '#666', fontStyle: 'italic' }}>
                  {section.notes}
                </div>
              )}

              <table>
                <thead>
                  <tr>
                    <th style={{ width: '22px' }}>#</th>
                    <th style={{ width: '76px' }}>Category</th>
                    <th>Description</th>
                    <th className="right" style={{ width: '38px' }}>Unit</th>
                    <th className="right" style={{ width: '44px' }}>Qty</th>
                    <th className="right" style={{ width: '66px' }}>Rate (₹)</th>
                    <th className="right" style={{ width: '74px' }}>Amount (₹)</th>
                    <th className="right" style={{ width: '36px' }}>GST</th>
                    <th className="right" style={{ width: '80px' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {secItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: '#bbb', fontSize: '8.5pt', fontStyle: 'italic' }}>
                        No items in this section
                      </td>
                    </tr>
                  ) : secItems.map((item, idx) => {
                    const amt = item.quantity * item.rate;
                    const gst = amt * (item.gst_percent / 100);
                    return (
                      <tr key={item.id} className="avoid-break">
                        <td style={{ color: '#bbb', fontSize: '7.5pt' }}>{idx + 1}</td>
                        <td><span className="cat-chip">{item.category.split(' ').slice(0, 2).join(' ')}</span></td>
                        <td>
                          <div className="desc-main">{item.description}</div>
                          {item.specification && <div className="desc-spec">{item.specification}</div>}
                          {item.remarks && <div className="desc-remarks">* {item.remarks}</div>}
                        </td>
                        <td className="right num" style={{ color: '#555' }}>{item.unit}</td>
                        <td className="right num">{item.quantity}</td>
                        <td className="right num">{fmt(item.rate)}</td>
                        <td className="right num">{fmt(amt)}</td>
                        <td className="right" style={{ fontSize: '7.5pt', color: '#888' }}>{item.gst_percent}%</td>
                        <td className="right num-total" style={{ color: '#1a1a2e' }}>{fmt(amt + gst)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {secItems.length > 0 && (
                <div className="section-subtotal">
                  <span className="section-subtotal-label">Section Subtotal (excl. GST)</span>
                  <span className="section-subtotal-val">₹{fmt(secSub)}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* ══════ SUMMARY PAGE ══════ */}
        <div className="page summary-page page-break">
          <div className="page-header">
            <div className="page-header-left">
              <span className="page-header-firm">{user?.firm_name ?? user?.name}</span>
              <span className="page-header-proj">{project.name}</span>
            </div>
            <div className="page-header-right">
              <div className="page-no">Page {sections.length + 2}</div>
              <div className="page-ref">{boqRef}</div>
            </div>
          </div>

          <div className="summary-h">Cost Summary</div>

          {/* Category breakdown */}
          <div className="summary-sub-h">Breakdown by Work Category</div>
          <table className="cat-table">
            <thead>
              <tr>
                <th style={{ width: '10px' }}>#</th>
                <th>Work Category</th>
                <th></th>
                <th className="right">Amount (₹)</th>
                <th className="right" style={{ width: '48px' }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {activeCats.map((cat, i) => (
                <tr key={cat}>
                  <td style={{ color: '#bbb', fontSize: '7.5pt' }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{cat}</td>
                  <td className="cat-bar-cell">
                    <div className="cat-bar-wrap">
                      <div className="cat-bar-fill" style={{ width: subtotal > 0 ? `${Math.min(100, (categoryTotals[cat] / subtotal) * 100)}%` : '0%' }} />
                    </div>
                  </td>
                  <td className="right" style={{ fontWeight: 600 }}>₹{fmt(categoryTotals[cat])}</td>
                  <td className="right" style={{ color: '#888', fontSize: '8pt' }}>
                    {subtotal > 0 ? `${((categoryTotals[cat] / subtotal) * 100).toFixed(1)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Cost totals */}
          <div className="summary-sub-h">Cost Totals</div>
          <div className="totals-box">
            <div className="totals-row">
              <span className="totals-label">Works Subtotal (excl. GST)</span>
              <span className="totals-val">₹{fmt(subtotal)}</span>
            </div>
            <div className="totals-row" style={{ background: '#fafafa' }}>
              <span className="totals-label" style={{ color: '#888' }}>GST (weighted average per item)</span>
              <span className="totals-val" style={{ color: '#888' }}>₹{fmt(gstTotal)}</span>
            </div>
            {markup > 0 && (
              <div className="totals-row">
                <span className="totals-label">Professional / Markup ({project.markup_percent}%)</span>
                <span className="totals-val" style={{ color: '#059669' }}>+₹{fmt(markup)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="totals-row">
                <span className="totals-label">Less: Discount</span>
                <span className="totals-val" style={{ color: '#dc2626' }}>−₹{fmt(discount)}</span>
              </div>
            )}
            {project.total_area > 0 && grandTotal > 0 && (
              <div className="totals-row" style={{ background: '#f0f0f8' }}>
                <span className="totals-label" style={{ color: '#888', fontSize: '8.5pt' }}>Cost per sqft</span>
                <span className="totals-val" style={{ color: '#888', fontSize: '8.5pt' }}>₹{fmt(Math.round(grandTotal / project.total_area))}</span>
              </div>
            )}
            <div className="totals-row totals-grand">
              <span className="totals-label">GRAND TOTAL (incl. GST)</span>
              <span className="totals-val">₹{fmt(grandTotal)}</span>
            </div>
          </div>
          <p className="amount-words">{inWords(grandTotal)}</p>

          {/* Inclusions / Exclusions */}
          {(project.inclusions || project.exclusions) && (
            <div className="ie-grid">
              {project.inclusions && (
                <div className="ie-box">
                  <div className="ie-title inc">Inclusions</div>
                  <div className="ie-text">{project.inclusions}</div>
                </div>
              )}
              {project.exclusions && (
                <div className="ie-box">
                  <div className="ie-title exc">Exclusions</div>
                  <div className="ie-text">{project.exclusions}</div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {project.notes && (
            <div style={{ marginTop: 20, padding: '12px 16px', background: '#fffff8', border: '1px solid #e8e8c0', borderRadius: '8px' }}>
              <div style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a08000', marginBottom: '6px' }}>Project Notes</div>
              <div style={{ fontSize: '8pt', color: '#666', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{project.notes}</div>
            </div>
          )}

          {/* Terms */}
          <div className="terms">
            <div className="terms-h">Standard Terms & Conditions</div>
            <ol>
              <li>This BOQ is an estimate based on design drawings available at this stage. Actual quantities and rates may vary during execution.</li>
              <li>Rates are inclusive of material supply, labour, and basic fixings unless otherwise specified. Taxes (GST) are shown separately per applicable rates.</li>
              <li>This estimate excludes structural modifications, external utility connections, or items not listed herein.</li>
              <li>Material grades and brand alternatives are subject to client approval prior to procurement.</li>
              <li>Payment terms: 30% advance, balance as per agreed milestone schedule.</li>
              <li>Estimate is valid for 30 days from date of issue. Rates are subject to revision thereafter based on market conditions.</li>
            </ol>
          </div>

          {/* Signature */}
          <div className="sig-grid">
            <div className="sig-box">
              <div className="sig-label">Prepared by</div>
              <div className="sig-name">{user?.name ?? 'Architect / Designer'}</div>
              {user?.firm_name && <div className="sig-firm">{user.firm_name}</div>}
              <div className="sig-date">Date: {today}</div>
            </div>
            <div className="sig-box">
              <div className="sig-label">Client Acceptance</div>
              <div className="sig-name">{project.client_name}</div>
              <div className="sig-date">Signature & Date: ________________________</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
