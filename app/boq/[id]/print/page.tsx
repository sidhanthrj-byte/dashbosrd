import { initDb, query, queryOne } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'pongs-crm-jwt-secret-2026-secure');
const CATEGORY_ORDER = [
  'Civil Work', 'Flooring', 'Wall & Painting', 'False Ceiling', 'Electrical',
  'Plumbing', 'Modular Kitchen', 'Wardrobes & Storage', 'Doors & Windows',
  'HVAC', 'Furniture', 'Décor & Soft Furnishing', 'Staircase & Railing',
  'External Works', 'Miscellaneous',
];

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function inWords(n: number): string {
  if (n === 0) return 'Zero';
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

  // Auth
  const cookieStore = await cookies();
  const token = cookieStore.get('pongs_session')?.value;
  if (!token) redirect('/login');
  let userId: number;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    userId = (payload as { userId: number }).userId;
  } catch {
    redirect('/login');
  }

  const project = await queryOne<{
    id: number; name: string; client_name: string; client_phone: string;
    client_email: string; project_type: string; location: string;
    total_area: number; status: string; markup_percent: number;
    discount_amount: number; notes: string; created_at: string;
  }>('SELECT * FROM boq_projects WHERE id = ? AND user_id = ?', [id, userId]);

  if (!project) redirect('/boq');

  const user = await queryOne<{ name: string; firm_name: string; city: string }>(
    'SELECT name, firm_name, city FROM users WHERE id = ?', [userId]
  );

  const sections = await query<{ id: number; name: string; area: number; sort_order: number }>(
    'SELECT * FROM boq_sections WHERE project_id = ? ORDER BY sort_order, id', [id]
  );

  const allItems = await query<{
    id: number; section_id: number; category: string; description: string;
    specification: string; unit: string; quantity: number; rate: number; gst_percent: number;
  }>(
    `SELECT i.* FROM boq_items i
     JOIN boq_sections s ON s.id = i.section_id
     WHERE s.project_id = ?
     ORDER BY s.sort_order, s.id, i.sort_order, i.id`,
    [id]
  );

  // Compute totals
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

  // Group items per section
  const sectionItems = sections.map(section => ({
    section,
    items: allItems.filter(i => i.section_id === section.id),
    subtotal: allItems.filter(i => i.section_id === section.id)
      .reduce((s, i) => s + i.quantity * i.rate, 0),
  }));

  // Category summary
  const categoryTotals: Record<string, number> = {};
  for (const item of allItems) {
    categoryTotals[item.category] = (categoryTotals[item.category] ?? 0) + item.quantity * item.rate;
  }

  return (
    <html>
      <head>
        <title>{project.name} — BOQ</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Georgia', 'Times New Roman', serif; background: #fff; color: #1a1a1a; font-size: 10pt; }
          .page { max-width: 210mm; margin: 0 auto; }

          @media print {
            body { font-size: 9pt; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
            .avoid-break { page-break-inside: avoid; }
          }

          /* Cover page */
          .cover { min-height: 100vh; padding: 60px 48px; display: flex; flex-direction: column; background: #0a0a0a; color: #f5f5f5; }
          .cover-logo { display: flex; align-items: center; gap: 12px; margin-bottom: auto; }
          .cover-logo-box { width: 40px; height: 40px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: sans-serif; font-weight: 900; font-size: 18px; color: #000; }
          .cover-firm { font-family: sans-serif; font-size: 12pt; font-weight: 700; color: #f5f5f5; }
          .cover-firm small { display: block; font-size: 8pt; font-weight: 400; color: #888; margin-top: 2px; }
          .cover-main { margin-bottom: 60px; }
          .cover-label { font-family: sans-serif; font-size: 8pt; letter-spacing: 4px; text-transform: uppercase; color: #f59e0b; margin-bottom: 16px; }
          .cover-title { font-size: 32pt; font-weight: 400; line-height: 1.2; color: #f5f5f5; margin-bottom: 12px; }
          .cover-client { font-family: sans-serif; font-size: 13pt; color: #aaa; margin-bottom: 8px; }
          .cover-meta { font-family: sans-serif; font-size: 9pt; color: #666; margin-top: 6px; }
          .cover-divider { border: none; border-top: 1px solid #333; margin: 48px 0; }
          .cover-total-box { background: #111; border: 1px solid #333; border-radius: 12px; padding: 24px 32px; display: inline-block; }
          .cover-total-label { font-family: sans-serif; font-size: 8pt; letter-spacing: 2px; text-transform: uppercase; color: #888; margin-bottom: 6px; }
          .cover-total-value { font-family: 'Courier New', monospace; font-size: 28pt; font-weight: 700; color: #f59e0b; }
          .cover-total-words { font-family: sans-serif; font-size: 8pt; color: #666; margin-top: 6px; font-style: italic; }
          .cover-footer { font-family: sans-serif; font-size: 8pt; color: #555; margin-top: auto; border-top: 1px solid #222; padding-top: 24px; display: flex; justify-content: space-between; }

          /* Content pages */
          .content { padding: 32px 40px; }
          .section-header { background: #0a0a0a; color: white; padding: 10px 16px; font-family: sans-serif; font-weight: 700; font-size: 11pt; margin-bottom: 0; display: flex; justify-content: space-between; align-items: center; }
          .section-header .section-area { font-size: 8pt; color: #aaa; font-weight: 400; }

          table { width: 100%; border-collapse: collapse; font-size: 9pt; }
          th { background: #1a1a1a; color: #e5e5e5; font-family: sans-serif; font-weight: 600; font-size: 7.5pt; letter-spacing: 0.5px; text-transform: uppercase; padding: 8px 10px; text-align: left; }
          th.right { text-align: right; }
          td { padding: 7px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
          td.right { text-align: right; font-family: 'Courier New', monospace; font-size: 9pt; }
          tr:nth-child(even) td { background: #fafafa; }
          tr:last-child td { border-bottom: none; }
          .description { font-weight: 500; }
          .spec { font-size: 8pt; color: #777; margin-top: 2px; }
          .cat-badge { font-family: sans-serif; font-size: 7pt; padding: 1px 6px; border-radius: 4px; background: #f0f0f0; color: #555; display: inline-block; white-space: nowrap; }

          /* Section subtotal row */
          .subtotal-row td { background: #f5f5f5; font-family: sans-serif; font-weight: 700; font-size: 9pt; border-top: 1.5px solid #ddd; }
          .subtotal-row td.right { font-family: 'Courier New', monospace; }

          /* Summary */
          .summary-page { padding: 32px 40px; }
          .summary-title { font-family: sans-serif; font-size: 14pt; font-weight: 700; margin-bottom: 24px; padding-bottom: 8px; border-bottom: 2px solid #0a0a0a; }
          .summary-table { width: 100%; }
          .summary-table tr td { padding: 6px 8px; font-family: sans-serif; font-size: 9.5pt; border-bottom: 1px solid #f0f0f0; }
          .summary-table tr td:last-child { text-align: right; font-family: 'Courier New', monospace; }
          .summary-total-row td { font-weight: 800; font-size: 12pt; border-top: 2px solid #0a0a0a; padding-top: 10px; }
          .summary-total-row td:last-child { color: #d97706; }

          /* Terms */
          .terms { margin-top: 40px; padding: 20px 24px; border: 1px solid #e5e5e5; border-radius: 8px; background: #fafafa; }
          .terms h3 { font-family: sans-serif; font-size: 9pt; font-weight: 700; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; color: #555; }
          .terms ol { padding-left: 16px; }
          .terms li { font-size: 8.5pt; color: #555; margin-bottom: 5px; line-height: 1.5; }

          /* Signature block */
          .signature-block { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
          .sig-box { border-top: 1px solid #ccc; padding-top: 12px; }
          .sig-label { font-family: sans-serif; font-size: 8pt; color: #999; }
          .sig-name { font-family: sans-serif; font-size: 9pt; font-weight: 600; margin-top: 4px; }

          /* Print button */
          .print-btn { position: fixed; bottom: 24px; right: 24px; background: #f59e0b; color: #000; border: none; padding: 12px 24px; border-radius: 12px; font-family: sans-serif; font-weight: 700; font-size: 13px; cursor: pointer; box-shadow: 0 4px 20px rgba(245,158,11,0.4); z-index: 100; }
          .print-btn:hover { background: #d97706; }

          .page-no { font-family: sans-serif; font-size: 7.5pt; color: #aaa; text-align: right; margin-bottom: 16px; }
        `}</style>
      </head>
      <body>
        {/* ── Print Button ─ */}
        <button className="print-btn no-print" id="print-btn">
          Print / Save PDF
        </button>

        {/* ══ COVER PAGE ══ */}
        <div className="page cover">
          <div className="cover-logo">
            <div className="cover-logo-box">B</div>
            <div>
              <div className="cover-firm">
                {user?.firm_name ?? user?.name ?? 'Architecture Studio'}
                <small>Bill of Quantities</small>
              </div>
            </div>
          </div>

          <div className="cover-main">
            <div className="cover-label">Bill of Quantities</div>
            <div className="cover-title">{project.name}</div>
            <div className="cover-client">Prepared for: {project.client_name}</div>
            {project.client_phone && <div className="cover-meta">{project.client_phone}</div>}
            {project.client_email && <div className="cover-meta">{project.client_email}</div>}
            <div className="cover-meta" style={{ marginTop: 12 }}>
              {project.project_type}
              {project.location ? ` · ${project.location}` : ''}
              {project.total_area ? ` · ${project.total_area} sqft` : ''}
            </div>

            <hr className="cover-divider" />

            <div>
              <div className="cover-total-box">
                <div className="cover-total-label">Estimated Grand Total</div>
                <div className="cover-total-value">₹{fmt(grandTotal)}</div>
                <div className="cover-total-words" style={{ fontSize: '7.5pt', marginTop: 4 }}>
                  {inWords(grandTotal)}
                </div>
              </div>
            </div>
          </div>

          <div className="cover-footer">
            <span>Date: {today}</span>
            <span>BOQ Reference: BOQ-{String(project.id).padStart(4, '0')}</span>
            <span>Status: {project.status.charAt(0).toUpperCase() + project.status.slice(1)}</span>
          </div>
        </div>

        {/* ══ SECTION PAGES ══ */}
        {sectionItems.map(({ section, items, subtotal: secSubtotal }, secIdx) => (
          <div key={section.id} className="page content page-break">
            <div className="page-no">Page {secIdx + 2} · {project.name}</div>

            <div className="section-header">
              <span>{section.name}</span>
              <span className="section-area">
                {section.area ? `Area: ${section.area} sqft` : ''}
              </span>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: 28 }}>#</th>
                  <th style={{ width: 90 }}>Category</th>
                  <th>Description / Specification</th>
                  <th style={{ width: 45 }} className="right">Unit</th>
                  <th style={{ width: 50 }} className="right">Qty</th>
                  <th style={{ width: 70 }} className="right">Rate ₹</th>
                  <th style={{ width: 80 }} className="right">Amount ₹</th>
                  <th style={{ width: 40 }} className="right">GST%</th>
                  <th style={{ width: 85 }} className="right">Total ₹</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: '#aaa', padding: '20px' }}>No items in this section</td></tr>
                ) : items.map((item, idx) => {
                  const amt = item.quantity * item.rate;
                  const gst = amt * (item.gst_percent / 100);
                  return (
                    <tr key={item.id} className="avoid-break">
                      <td style={{ color: '#999' }}>{idx + 1}</td>
                      <td><span className="cat-badge">{item.category}</span></td>
                      <td>
                        <div className="description">{item.description}</div>
                        {item.specification && <div className="spec">{item.specification}</div>}
                      </td>
                      <td className="right">{item.unit}</td>
                      <td className="right">{item.quantity}</td>
                      <td className="right">{fmt(item.rate)}</td>
                      <td className="right">{fmt(amt)}</td>
                      <td className="right">{item.gst_percent}%</td>
                      <td className="right" style={{ fontWeight: 600 }}>{fmt(amt + gst)}</td>
                    </tr>
                  );
                })}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr className="subtotal-row">
                    <td colSpan={6} style={{ textAlign: 'right' }}>Section Subtotal (before GST)</td>
                    <td className="right">₹{fmt(secSubtotal)}</td>
                    <td />
                    <td className="right" style={{ color: '#d97706' }}>
                      ₹{fmt(items.reduce((s, i) => s + i.quantity * i.rate * (1 + i.gst_percent / 100), 0))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        ))}

        {/* ══ SUMMARY PAGE ══ */}
        <div className="page summary-page page-break">
          <div className="page-no">Page {sections.length + 2} · {project.name}</div>
          <div className="summary-title">Cost Summary</div>

          {/* Category breakdown */}
          <table className="summary-table" style={{ marginBottom: 32 }}>
            <thead>
              <tr>
                <th style={{ background: '#1a1a1a', color: '#e5e5e5', padding: '8px', fontFamily: 'sans-serif', fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Work Category</th>
                <th style={{ background: '#1a1a1a', color: '#e5e5e5', padding: '8px', fontFamily: 'sans-serif', fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Amount (₹)</th>
                <th style={{ background: '#1a1a1a', color: '#e5e5e5', padding: '8px', fontFamily: 'sans-serif', fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORY_ORDER
                .filter(cat => categoryTotals[cat] > 0)
                .map(cat => (
                  <tr key={cat}>
                    <td style={{ fontFamily: 'sans-serif', padding: '7px 8px', borderBottom: '1px solid #f0f0f0' }}>{cat}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Courier New', padding: '7px 8px', borderBottom: '1px solid #f0f0f0' }}>₹{fmt(categoryTotals[cat])}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'sans-serif', fontSize: '8pt', color: '#888', padding: '7px 8px', borderBottom: '1px solid #f0f0f0' }}>
                      {subtotal > 0 ? `${((categoryTotals[cat] / subtotal) * 100).toFixed(1)}%` : '0%'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* Cost summary */}
          <table className="summary-table">
            <tbody>
              <tr>
                <td>Works Subtotal (without GST)</td>
                <td style={{ textAlign: 'right', fontFamily: 'Courier New' }}>₹{fmt(subtotal)}</td>
              </tr>
              <tr>
                <td style={{ color: '#555' }}>GST (as applicable per item)</td>
                <td style={{ textAlign: 'right', fontFamily: 'Courier New', color: '#555' }}>₹{fmt(gstTotal)}</td>
              </tr>
              {markup > 0 && (
                <tr>
                  <td style={{ color: '#555' }}>Professional / Markup ({project.markup_percent}%)</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Courier New', color: '#555' }}>₹{fmt(markup)}</td>
                </tr>
              )}
              {discount > 0 && (
                <tr>
                  <td style={{ color: '#c00' }}>Less: Discount</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Courier New', color: '#c00' }}>-₹{fmt(discount)}</td>
                </tr>
              )}
              <tr className="summary-total-row">
                <td style={{ fontFamily: 'sans-serif', fontWeight: 800, fontSize: '12pt', borderTop: '2px solid #0a0a0a', paddingTop: 10 }}>GRAND TOTAL</td>
                <td style={{ textAlign: 'right', fontFamily: 'Courier New', fontWeight: 800, fontSize: '12pt', color: '#d97706', borderTop: '2px solid #0a0a0a', paddingTop: 10 }}>₹{fmt(grandTotal)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 12, fontFamily: 'sans-serif', fontSize: '8pt', color: '#888', fontStyle: 'italic' }}>
            {inWords(grandTotal)}
          </div>

          {/* Standard Terms */}
          <div className="terms">
            <h3>Standard Terms & Conditions</h3>
            <ol>
              <li>This BOQ is an estimate prepared on the basis of design drawings available at this stage. Actual quantities and rates may vary during execution.</li>
              <li>Rates are inclusive of material supply, labour, and basic fixings unless otherwise specified. Taxes (GST) are shown separately per applicable rates.</li>
              <li>This estimate does not include structural modifications, external utility connections, or items not listed herein.</li>
              <li>Material grades and brand alternatives are subject to client approval prior to procurement.</li>
              <li>Payment terms: 30% advance, balance as per agreed milestone schedule.</li>
              <li>This estimate is valid for 30 days from the date of issue. Rates are subject to revision thereafter.</li>
            </ol>
          </div>

          {/* Signature */}
          <div className="signature-block">
            <div className="sig-box">
              <div className="sig-label">Prepared by</div>
              <div className="sig-name">{user?.name ?? 'Architect'}</div>
              {user?.firm_name && <div style={{ fontFamily: 'sans-serif', fontSize: '8pt', color: '#777', marginTop: 2 }}>{user.firm_name}</div>}
              <div style={{ fontFamily: 'sans-serif', fontSize: '8pt', color: '#999', marginTop: 2 }}>Date: {today}</div>
            </div>
            <div className="sig-box">
              <div className="sig-label">Client Acceptance</div>
              <div className="sig-name">{project.client_name}</div>
              <div style={{ fontFamily: 'sans-serif', fontSize: '8pt', color: '#999', marginTop: 2 }}>Signature & Date: _______________</div>
            </div>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          document.querySelector('.print-btn')?.addEventListener('click', () => window.print());
        ` }} />
      </body>
    </html>
  );
}
