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
  function h(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '') + ' ';
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + h(n % 100);
    if (n < 100000) return h(Math.floor(n / 1000)) + 'Thousand ' + h(n % 1000);
    if (n < 10000000) return h(Math.floor(n / 100000)) + 'Lakh ' + h(n % 100000);
    return h(Math.floor(n / 10000000)) + 'Crore ' + h(n % 10000000);
  }
  return h(Math.round(n)).trim() + ' Rupees Only';
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

  const sectionItems = sections.map(s => ({
    section: s,
    items: allItems.filter(i => i.section_id === s.id),
    subtotal: allItems.filter(i => i.section_id === s.id).reduce((a, i) => a + i.quantity * i.rate, 0),
  }));

  const categoryTotals: Record<string, number> = {};
  for (const item of allItems) {
    categoryTotals[item.category] = (categoryTotals[item.category] ?? 0) + item.quantity * item.rate;
  }
  const activeCats = CATEGORY_ORDER.filter(c => categoryTotals[c] > 0);

  const firmName = user?.firm_name ?? user?.name ?? 'Architecture Studio';

  return (
    <html lang="en">
      <head>
        <title>{project.name} — Bill of Quantities · {boqRef}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

          body {
            font-family: 'Inter', -apple-system, 'Helvetica Neue', Arial, sans-serif;
            background: #e8e8e8;
            color: #1a1a1a;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }

          /* ── Screen wrapper ── */
          .page {
            max-width: 794px;
            margin: 0 auto 16px;
            background: #fff;
            box-shadow: 0 1px 16px rgba(0,0,0,0.12);
          }

          @media print {
            body { background: #fff !important; }
            .no-print { display: none !important; }
            .page { box-shadow: none; margin: 0; max-width: 100%; }
            .page-break { page-break-before: always; }
            .avoid-break { page-break-inside: avoid; }
            @page { margin: 0; size: A4; }
          }

          /* ── Mobile overrides ── */
          @media screen and (max-width: 600px) {
            body { background: #111; }
            .page { margin: 0 0 2px; box-shadow: none; }
            .cover { padding: 28px 24px !important; min-height: 100svh; }
            .cover-title { font-size: 22pt !important; }
            .cover-total-value { font-size: 26pt !important; }
            .cover-footer { grid-template-columns: 1fr 1fr !important; }
            .cover-footer-item:last-child { display: none; }
            .pc { padding: 20px !important; }
            .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            table { min-width: 580px; }
            .sig-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
            .ie-grid { grid-template-columns: 1fr !important; }
            .logo-img { height: 140px !important; }
            .cover-doc-type { font-size: 7pt !important; }
          }

          /* ══════════════════════════════════════
             COVER PAGE
          ══════════════════════════════════════ */
          .cover {
            background: #0a0a0a;
            color: #fff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 52px 56px;
            position: relative;
            overflow: hidden;
          }

          /* Subtle architectural grid texture */
          .cover::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image:
              linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
            background-size: 52px 52px;
            pointer-events: none;
          }

          /* Corner marks — architectural drawing style */
          .cover::after {
            content: '';
            position: absolute;
            bottom: 52px;
            right: 56px;
            width: 32px;
            height: 32px;
            border-right: 1px solid #2a2a2a;
            border-bottom: 1px solid #2a2a2a;
            pointer-events: none;
          }

          .cover-inner {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            height: 100%;
            gap: 0;
          }

          /* Logo */
          .cover-logo { margin-bottom: auto; }
          .logo-img { height: 190px; width: auto; object-fit: contain; }

          /* Document type marker */
          .cover-doc-type {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
          }
          .cover-doc-type::before {
            content: '';
            display: block;
            width: 28px;
            height: 1px;
            background: #333;
          }
          .cover-doc-type span {
            font-size: 7.5pt;
            letter-spacing: 0.25em;
            text-transform: uppercase;
            color: #475569;
          }

          /* Main text */
          .cover-body { margin-top: 80px; margin-bottom: 48px; }

          .cover-title {
            font-size: 30pt;
            font-weight: 300;
            letter-spacing: -0.01em;
            line-height: 1.18;
            color: #fff;
            margin-bottom: 28px;
          }

          .cover-rule { border: none; border-top: 1px solid #1e1e1e; margin: 0 0 20px; }

          .cover-client-name {
            font-size: 10pt;
            font-weight: 500;
            color: #94a3b8;
            margin-bottom: 5px;
          }
          .cover-meta {
            font-size: 8pt;
            color: #374151;
            margin-top: 4px;
            line-height: 1.6;
          }

          /* Grand total */
          .cover-total-block { margin-top: 40px; }
          .cover-total-label {
            font-size: 6.5pt;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: #374151;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .cover-total-label::after {
            content: '';
            display: block;
            flex: 1;
            max-width: 60px;
            height: 1px;
            background: #1e1e1e;
          }
          .cover-total-value {
            font-size: 34pt;
            font-weight: 700;
            color: #fff;
            letter-spacing: -0.02em;
            font-variant-numeric: tabular-nums;
            line-height: 1;
          }
          .cover-total-words {
            font-size: 7.5pt;
            color: #374151;
            margin-top: 10px;
            font-style: italic;
            line-height: 1.65;
            max-width: 420px;
          }

          /* Footer grid */
          .cover-footer {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            border-top: 1px solid #141414;
            padding-top: 24px;
            margin-top: auto;
          }
          .cover-footer-item { display: flex; flex-direction: column; gap: 5px; }
          .cover-footer-key {
            font-size: 6pt;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #2a2a2a;
            font-weight: 600;
          }
          .cover-footer-val { font-size: 8pt; color: #475569; }

          /* ══════════════════════════════════════
             CONTENT PAGES
          ══════════════════════════════════════ */
          .pc { padding: 44px 48px; background: #fff; }

          /* Page header */
          .ph {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            padding-bottom: 12px;
            border-bottom: 1.5px solid #0a0a0a;
            margin-bottom: 32px;
          }
          .ph-left .ph-firm {
            font-size: 8pt;
            font-weight: 700;
            color: #0a0a0a;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }
          .ph-left .ph-proj {
            font-size: 7pt;
            color: #94a3b8;
            margin-top: 2px;
            letter-spacing: 0.04em;
          }
          .ph-right { text-align: right; }
          .ph-right .ph-num { font-size: 7.5pt; color: #94a3b8; }
          .ph-right .ph-ref { font-size: 6.5pt; color: #cbd5e1; margin-top: 1px; letter-spacing: 0.04em; }

          /* Section block */
          .sec-block { margin-bottom: 40px; }

          .sec-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #0a0a0a;
            padding: 10px 16px;
          }
          .sec-title-name {
            font-size: 9.5pt;
            font-weight: 600;
            color: #fff;
            letter-spacing: 0.04em;
          }
          .sec-title-meta {
            font-size: 7pt;
            color: #475569;
          }

          .sec-notes {
            padding: 9px 16px;
            background: #fafafa;
            font-size: 7.5pt;
            color: #64748b;
            font-style: italic;
            border-left: 2px solid #e2e8f0;
            line-height: 1.55;
          }

          /* Table */
          .table-scroll { overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }

          thead tr th {
            background: #f8fafc;
            color: #64748b;
            font-size: 6pt;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            padding: 8px 10px;
            text-align: left;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
            white-space: nowrap;
          }
          th.r { text-align: right; }

          td {
            padding: 7.5px 10px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
            color: #1a1a1a;
          }
          td.r { text-align: right; font-variant-numeric: tabular-nums; }
          tr:nth-child(even) td { background: #fafafa; }
          tr:last-child td { border-bottom: none; }

          .d-main { font-weight: 500; font-size: 8.5pt; line-height: 1.4; color: #111; }
          .d-spec { font-size: 7.5pt; color: #64748b; margin-top: 2px; line-height: 1.4; }
          .d-rmk { font-size: 7pt; color: #94a3b8; margin-top: 2px; font-style: italic; }
          .cat-txt { font-size: 6.5pt; color: #374151; font-weight: 600; letter-spacing: 0.04em; white-space: nowrap; }
          .num { font-variant-numeric: tabular-nums; }
          .num-bold { font-variant-numeric: tabular-nums; font-weight: 700; }

          .sec-subtotal {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f1f5f9;
            padding: 9px 16px;
            border-top: 1.5px solid #e2e8f0;
          }
          .sec-subtotal-label { font-size: 7.5pt; font-weight: 700; color: #374151; letter-spacing: 0.05em; text-transform: uppercase; }
          .sec-subtotal-val { font-size: 8.5pt; font-weight: 800; color: #0a0a0a; font-variant-numeric: tabular-nums; }

          /* ══════════════════════════════════════
             SUMMARY PAGE
          ══════════════════════════════════════ */
          .sum-h { font-size: 14pt; font-weight: 700; color: #0a0a0a; letter-spacing: -0.01em; }
          .sum-rule { border: none; border-top: 2px solid #0a0a0a; margin: 6px 0 28px; }
          .sum-section-label {
            font-size: 6pt;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #94a3b8;
            margin: 24px 0 10px;
          }

          /* Category table */
          .cat-tbl { width: 100%; border-collapse: collapse; }
          .cat-tbl td {
            padding: 6.5px 8px;
            font-size: 8pt;
            border-bottom: 1px solid #f1f5f9;
            color: #1a1a1a;
          }
          .cat-tbl td:nth-child(1) { color: #94a3b8; font-size: 7.5pt; width: 24px; }
          .cat-tbl td:nth-child(2) { font-weight: 500; }
          .cat-tbl td.bar-cell { width: 90px; }
          .bar-wrap { height: 3px; background: #f1f5f9; border-radius: 1px; }
          .bar-fill { height: 100%; background: #374151; border-radius: 1px; }
          .cat-tbl td.amt { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
          .cat-tbl td.pct { text-align: right; font-size: 7.5pt; color: #94a3b8; width: 44px; }

          /* Totals */
          .totals-box {
            border: 1px solid #e2e8f0;
            margin-top: 24px;
          }
          .t-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 16px;
            border-bottom: 1px solid #f1f5f9;
          }
          .t-row:last-child { border-bottom: none; }
          .t-label { font-size: 8.5pt; color: #374151; }
          .t-val { font-size: 8.5pt; font-variant-numeric: tabular-nums; font-weight: 600; color: #0a0a0a; }
          .t-row-muted .t-label { color: #94a3b8; }
          .t-row-muted .t-val { color: #94a3b8; font-weight: 400; }
          .t-row-credit .t-label { color: #374151; }
          .t-row-credit .t-val { color: #374151; }
          .t-row-grand { background: #0a0a0a; }
          .t-row-grand .t-label { color: #fff; font-weight: 700; font-size: 9pt; letter-spacing: 0.05em; }
          .t-row-grand .t-val { color: #fff; font-weight: 800; font-size: 11.5pt; }
          .t-row-sqft { background: #f8fafc; }
          .t-row-sqft .t-label, .t-row-sqft .t-val { color: #94a3b8; font-size: 8pt; font-weight: 400; }

          .amount-words {
            font-size: 7pt;
            color: #94a3b8;
            font-style: italic;
            margin-top: 10px;
            line-height: 1.65;
          }

          /* Inclusions / Exclusions */
          .ie-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 20px; }
          .ie-box { border: 1px solid #e2e8f0; padding: 14px 16px; }
          .ie-head {
            font-size: 6.5pt; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.1em; margin-bottom: 8px;
            padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;
          }
          .ie-inc { color: #374151; }
          .ie-exc { color: #374151; }
          .ie-text { font-size: 7.5pt; color: #475569; line-height: 1.65; white-space: pre-wrap; }

          /* Notes */
          .note-box {
            margin-top: 18px; padding: 12px 16px;
            background: #f8fafc; border: 1px solid #e2e8f0;
          }
          .note-head {
            font-size: 6.5pt; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.1em; color: #64748b; margin-bottom: 7px;
          }
          .note-text { font-size: 7.5pt; color: #475569; line-height: 1.65; white-space: pre-wrap; }

          /* Terms */
          .terms { margin-top: 24px; padding: 14px 18px; border: 1px solid #e2e8f0; background: #fafafa; }
          .terms-h {
            font-size: 6.5pt; font-weight: 700; letter-spacing: 0.12em;
            text-transform: uppercase; color: #64748b; margin-bottom: 10px;
          }
          .terms ol { padding-left: 16px; }
          .terms li { font-size: 7.5pt; color: #475569; margin-bottom: 4px; line-height: 1.55; }

          /* Signature */
          .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 36px; }
          .sig-box { border-top: 1px solid #e2e8f0; padding-top: 14px; }
          .sig-label { font-size: 6pt; letter-spacing: 0.14em; text-transform: uppercase; color: #94a3b8; }
          .sig-name { font-size: 9.5pt; font-weight: 700; color: #0a0a0a; margin-top: 8px; }
          .sig-firm { font-size: 7.5pt; color: #64748b; margin-top: 3px; }
          .sig-date { font-size: 7.5pt; color: #94a3b8; margin-top: 4px; }

          /* Page footer strip */
          .page-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 48px;
            background: #0a0a0a;
          }
          .pf-firm { font-size: 6.5pt; color: #333; letter-spacing: 0.1em; text-transform: uppercase; }
          .pf-ref { font-size: 6.5pt; color: #2a2a2a; letter-spacing: 0.05em; }
        `}</style>
      </head>
      <body>
        <PrintButton />

        {/* ══════ COVER ══════ */}
        <div className="page">
          <div className="cover">
            <div className="cover-inner">
              {/* Logo */}
              <div className="cover-logo">
                <img
                  src="/space-hyphen-logo.svg"
                  alt="Space Hyphen Architecture"
                  className="logo-img"
                />
              </div>

              {/* Document tag */}
              <div className="cover-body">
                <div className="cover-doc-type">
                  <span>Bill of Quantities</span>
                </div>

                <div className="cover-title">{project.name}</div>
                <hr className="cover-rule" />

                <div className="cover-client-name">Prepared for: {project.client_name}</div>
                {project.client_phone && (
                  <div className="cover-meta">{project.client_phone}</div>
                )}
                {project.client_email && (
                  <div className="cover-meta">{project.client_email}</div>
                )}
                <div className="cover-meta" style={{ marginTop: 8 }}>
                  {[project.project_type, project.location, project.total_area ? `${project.total_area} sqft` : null]
                    .filter(Boolean).join('  ·  ')}
                </div>

                {/* Grand Total */}
                <div className="cover-total-block">
                  <div className="cover-total-label">Estimated Grand Total (incl. GST)</div>
                  <div className="cover-total-value">₹{fmt(grandTotal)}</div>
                  <div className="cover-total-words">{inWords(grandTotal)}</div>
                </div>
              </div>

              {/* Footer metadata */}
              <div className="cover-footer">
                <div className="cover-footer-item">
                  <span className="cover-footer-key">Date Issued</span>
                  <span className="cover-footer-val">{today}</span>
                </div>
                <div className="cover-footer-item">
                  <span className="cover-footer-key">Reference</span>
                  <span className="cover-footer-val">{boqRef}</span>
                </div>
                <div className="cover-footer-item">
                  <span className="cover-footer-key">Status</span>
                  <span className="cover-footer-val">{project.status.charAt(0).toUpperCase() + project.status.slice(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════ SECTION PAGES ══════ */}
        {sectionItems.map(({ section, items: secItems, subtotal: secSub }, secIdx) => (
          <div key={section.id} className="page page-break">
            <div className="pc">
              {/* Page header */}
              <div className="ph">
                <div className="ph-left">
                  <div className="ph-firm">{firmName}</div>
                  <div className="ph-proj">{project.name}</div>
                </div>
                <div className="ph-right">
                  <div className="ph-num">Page {secIdx + 2}</div>
                  <div className="ph-ref">{boqRef}</div>
                </div>
              </div>

              {/* Section */}
              <div className="sec-block">
                <div className="sec-title">
                  <span className="sec-title-name">{section.name}</span>
                  <span className="sec-title-meta">
                    {[section.area ? `${section.area} sqft` : null, `${secItems.length} item${secItems.length !== 1 ? 's' : ''}`]
                      .filter(Boolean).join('  ·  ')}
                  </span>
                </div>

                {section.notes && (
                  <div className="sec-notes">{section.notes}</div>
                )}

                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 22 }}>#</th>
                        <th style={{ width: 72 }}>Category</th>
                        <th>Description</th>
                        <th className="r" style={{ width: 36 }}>Unit</th>
                        <th className="r" style={{ width: 42 }}>Qty</th>
                        <th className="r" style={{ width: 64 }}>Rate (₹)</th>
                        <th className="r" style={{ width: 72 }}>Amount (₹)</th>
                        <th className="r" style={{ width: 34 }}>GST</th>
                        <th className="r" style={{ width: 78 }}>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {secItems.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#cbd5e1', fontSize: '8pt', fontStyle: 'italic' }}>
                            No items added to this section
                          </td>
                        </tr>
                      ) : secItems.map((item, idx) => {
                        const amt = item.quantity * item.rate;
                        const gst = amt * (item.gst_percent / 100);
                        return (
                          <tr key={item.id} className="avoid-break">
                            <td style={{ color: '#cbd5e1', fontSize: '7.5pt' }}>{idx + 1}</td>
                            <td><span className="cat-txt">{item.category.split(' ').slice(0, 2).join(' ')}</span></td>
                            <td>
                              <div className="d-main">{item.description}</div>
                              {item.specification && <div className="d-spec">{item.specification}</div>}
                              {item.remarks && <div className="d-rmk">* {item.remarks}</div>}
                            </td>
                            <td className="r num" style={{ color: '#64748b', fontSize: '8pt' }}>{item.unit}</td>
                            <td className="r num">{item.quantity}</td>
                            <td className="r num">{fmt(item.rate)}</td>
                            <td className="r num">{fmt(amt)}</td>
                            <td className="r" style={{ fontSize: '7.5pt', color: '#94a3b8' }}>{item.gst_percent}%</td>
                            <td className="r num-bold">{fmt(amt + gst)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {secItems.length > 0 && (
                  <div className="sec-subtotal">
                    <span className="sec-subtotal-label">Section Subtotal (excl. GST)</span>
                    <span className="sec-subtotal-val">₹{fmt(secSub)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Page footer */}
            <div className="page-footer">
              <span className="pf-firm">{firmName}</span>
              <span className="pf-ref">{boqRef}</span>
            </div>
          </div>
        ))}

        {/* ══════ SUMMARY PAGE ══════ */}
        <div className="page page-break">
          <div className="pc">
            {/* Page header */}
            <div className="ph">
              <div className="ph-left">
                <div className="ph-firm">{firmName}</div>
                <div className="ph-proj">{project.name}</div>
              </div>
              <div className="ph-right">
                <div className="ph-num">Page {sections.length + 2}</div>
                <div className="ph-ref">{boqRef}</div>
              </div>
            </div>

            <div className="sum-h">Cost Summary</div>
            <hr className="sum-rule" />

            {/* Category breakdown */}
            <div className="sum-section-label">Breakdown by Work Category</div>
            <table className="cat-tbl">
              <thead>
                <tr>
                  <th style={{ background: '#f8fafc', color: '#94a3b8', fontSize: '6pt', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 8px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>#</th>
                  <th style={{ background: '#f8fafc', color: '#94a3b8', fontSize: '6pt', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 8px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Category</th>
                  <th style={{ background: '#f8fafc', padding: '7px 8px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', width: 90 }}></th>
                  <th style={{ background: '#f8fafc', color: '#94a3b8', fontSize: '6pt', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 8px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Amount (₹)</th>
                  <th style={{ background: '#f8fafc', color: '#94a3b8', fontSize: '6pt', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 8px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', textAlign: 'right', width: 48 }}>Share</th>
                </tr>
              </thead>
              <tbody>
                {activeCats.map((cat, i) => (
                  <tr key={cat}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{cat}</td>
                    <td className="bar-cell">
                      <div className="bar-wrap">
                        <div className="bar-fill"
                          style={{ width: subtotal > 0 ? `${Math.min(100, (categoryTotals[cat] / subtotal) * 100)}%` : '0%' }} />
                      </div>
                    </td>
                    <td className="amt">₹{fmt(categoryTotals[cat])}</td>
                    <td className="pct">{subtotal > 0 ? `${((categoryTotals[cat] / subtotal) * 100).toFixed(1)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="sum-section-label">Cost Totals</div>
            <div className="totals-box">
              <div className="t-row">
                <span className="t-label">Works Subtotal (excl. GST)</span>
                <span className="t-val">₹{fmt(subtotal)}</span>
              </div>
              <div className="t-row t-row-muted">
                <span className="t-label">GST (weighted average per item)</span>
                <span className="t-val">₹{fmt(gstTotal)}</span>
              </div>
              {markup > 0 && (
                <div className="t-row">
                  <span className="t-label">Professional / Markup ({project.markup_percent}%)</span>
                  <span className="t-val">+₹{fmt(markup)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="t-row t-row-credit">
                  <span className="t-label">Less: Discount</span>
                  <span className="t-val">−₹{fmt(discount)}</span>
                </div>
              )}
              {project.total_area > 0 && grandTotal > 0 && (
                <div className="t-row t-row-sqft">
                  <span className="t-label">Cost per sqft · {project.total_area} sqft</span>
                  <span className="t-val">₹{fmt(Math.round(grandTotal / project.total_area))}</span>
                </div>
              )}
              <div className="t-row t-row-grand">
                <span className="t-label">GRAND TOTAL (incl. GST)</span>
                <span className="t-val">₹{fmt(grandTotal)}</span>
              </div>
            </div>

            <p className="amount-words">{inWords(grandTotal)}</p>

            {/* Inclusions / Exclusions */}
            {(project.inclusions || project.exclusions) && (
              <div className="ie-grid">
                {project.inclusions && (
                  <div className="ie-box">
                    <div className="ie-head ie-inc">Inclusions</div>
                    <div className="ie-text">{project.inclusions}</div>
                  </div>
                )}
                {project.exclusions && (
                  <div className="ie-box">
                    <div className="ie-head ie-exc">Exclusions</div>
                    <div className="ie-text">{project.exclusions}</div>
                  </div>
                )}
              </div>
            )}

            {/* Project notes */}
            {project.notes && (
              <div className="note-box">
                <div className="note-head">Project Notes</div>
                <div className="note-text">{project.notes}</div>
              </div>
            )}

            {/* Terms */}
            <div className="terms">
              <div className="terms-h">Terms & Conditions</div>
              <ol>
                <li>This BOQ is an estimate based on design drawings available at this stage. Actual quantities and rates may vary during execution.</li>
                <li>Rates are inclusive of material supply, labour, and basic fixings unless otherwise specified. GST is shown separately as applicable per item.</li>
                <li>This estimate excludes structural modifications, external utility connections, and items not listed herein.</li>
                <li>Material grades and brand alternatives are subject to client approval prior to procurement.</li>
                <li>Payment terms: 30% advance, balance as per agreed milestone schedule.</li>
                <li>This estimate is valid for 30 days from date of issue. Rates are subject to revision thereafter.</li>
              </ol>
            </div>

            {/* Signatures */}
            <div className="sig-grid">
              <div className="sig-box">
                <div className="sig-label">Prepared By</div>
                <div className="sig-name">{user?.name ?? 'Architect / Designer'}</div>
                {user?.firm_name && <div className="sig-firm">{user.firm_name}</div>}
                <div className="sig-date">Date: {today}</div>
              </div>
              <div className="sig-box">
                <div className="sig-label">Client Acceptance</div>
                <div className="sig-name">{project.client_name}</div>
                <div className="sig-date">Signature & Date: _________________________</div>
              </div>
            </div>
          </div>

          {/* Page footer */}
          <div className="page-footer">
            <span className="pf-firm">{firmName}</span>
            <span className="pf-ref">{boqRef}</span>
          </div>
        </div>
      </body>
    </html>
  );
}
