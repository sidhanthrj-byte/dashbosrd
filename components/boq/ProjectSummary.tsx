'use client';

import { useState } from 'react';
import { Check, X, TrendingUp, MinusCircle, ChevronDown, ChevronRight } from 'lucide-react';

type Project = {
  id: number; name: string; client_name: string; client_phone: string;
  client_email: string; project_type: string; location: string;
  total_area: number; status: string; markup_percent: number;
  discount_amount: number; notes: string;
};

type Section = { id: number; name: string };
type Item = { id: number; section_id: number; category: string; quantity: number; rate: number; gst_percent: number };

type Totals = {
  subtotal: number; gstTotal: number; markup: number; discount: number; grandTotal: number;
};

type Props = {
  project: Project;
  sections: Section[];
  items: Item[];
  totals: Totals;
  onUpdateProject: (field: string, value: unknown) => void;
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

const CAT_COLORS: Record<string, { bar: string; dot: string }> = {
  'Civil Work':              { bar: 'oklch(0.65 0.18 35)',   dot: '#e67e4d' },
  'Flooring':                { bar: 'oklch(0.68 0.18 55)',   dot: '#d4a44c' },
  'Wall & Painting':         { bar: 'oklch(0.70 0.18 80)',   dot: '#bfb040' },
  'False Ceiling':           { bar: 'oklch(0.68 0.20 140)',  dot: '#48b47e' },
  'Electrical':              { bar: 'oklch(0.62 0.22 240)',  dot: '#4a90d9' },
  'Plumbing':                { bar: 'oklch(0.65 0.18 200)',  dot: '#3eb5c8' },
  'Modular Kitchen':         { bar: 'oklch(0.62 0.18 175)',  dot: '#36b099' },
  'Wardrobes & Storage':     { bar: 'oklch(0.60 0.22 290)',  dot: '#8b72e0' },
  'Doors & Windows':         { bar: 'oklch(0.60 0.20 310)',  dot: '#a45fd0' },
  'HVAC':                    { bar: 'oklch(0.62 0.18 220)',  dot: '#4ba8e0' },
  'Furniture':               { bar: 'oklch(0.62 0.22 335)',  dot: '#e06090' },
  'Décor & Soft Furnishing': { bar: 'oklch(0.62 0.22 355)',  dot: '#e05868' },
  'Staircase & Railing':     { bar: 'oklch(0.60 0.22 268)',  dot: '#6366f1' },
  'External Works':          { bar: 'oklch(0.62 0.20 155)',  dot: '#42b568' },
  'Security Systems':        { bar: 'oklch(0.62 0.18 25)',   dot: '#d96b4a' },
  'Fire Safety':             { bar: 'oklch(0.60 0.24 15)',   dot: '#e04040' },
  'AV & Home Theater':       { bar: 'oklch(0.60 0.22 260)',  dot: '#5c6ef0' },
  'Gym & Wellness':          { bar: 'oklch(0.62 0.20 130)',  dot: '#5ab865' },
  'Solar & EV':              { bar: 'oklch(0.70 0.22 95)',   dot: '#cdb53a' },
  'Landscaping':             { bar: 'oklch(0.64 0.20 148)',  dot: '#3db86a' },
  'Appliances':              { bar: 'oklch(0.60 0.18 250)',  dot: '#5585d8' },
  'Miscellaneous':           { bar: 'oklch(0.52 0.010 265)', dot: '#888da0' },
};

function BarRow({ label, value, total, color, dot }: {
  label: string; value: number; total: number; color: string; dot: string;
}) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0, display: 'inline-block' }} />
        <span style={{ flex: 1, fontSize: '11px', color: 'oklch(0.72 0.014 265)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'oklch(0.88 0.006 265)', flexShrink: 0 }}>₹{fmt(value)}</span>
      </div>
      <div style={{ height: '3px', background: 'oklch(0.16 0.012 265)', borderRadius: '2px', overflow: 'hidden', marginLeft: '13px' }}>
        <div style={{ height: '100%', borderRadius: '2px', background: color, width: `${pct}%`, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

export function ProjectSummary({ project, sections, items, totals, onUpdateProject }: Props) {
  const [markupDraft, setMarkupDraft] = useState('');
  const [discountDraft, setDiscountDraft] = useState('');
  const [editingMarkup, setEditingMarkup] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [secExpanded, setSecExpanded] = useState(true);
  const [catExpanded, setCatExpanded] = useState(true);

  const categoryTotals = items.reduce<Record<string, number>>((acc, item) => {
    const amt = item.quantity * item.rate;
    acc[item.category] = (acc[item.category] ?? 0) + amt;
    return acc;
  }, {});
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  const sectionTotals = sections.map(section => ({
    section,
    total: items.filter(i => i.section_id === section.id).reduce((s, i) => s + i.quantity * i.rate, 0),
  })).sort((a, b) => b.total - a.total);

  const inputStyle: React.CSSProperties = {
    background: 'oklch(0.10 0.012 265)',
    border: '1px solid oklch(0.70 0.22 268 / 0.4)',
    borderRadius: '6px',
    padding: '3px 8px',
    fontSize: '12px',
    color: 'oklch(0.96 0.004 265)',
    outline: 'none',
    fontFamily: 'monospace',
    textAlign: 'right',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '12px' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid oklch(0.16 0.012 265)' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(0.50 0.018 265)' }}>
          Cost Summary
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Grand total hero */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid oklch(0.16 0.012 265)', textAlign: 'center', background: 'oklch(0.07 0.012 265)' }}>
          <p style={{ fontSize: '10px', color: 'oklch(0.50 0.018 265)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Grand Total
          </p>
          <p style={{ fontSize: '26px', fontWeight: 900, fontFamily: 'monospace', color: 'oklch(0.72 0.22 268)', lineHeight: 1 }}>
            ₹{fmt(totals.grandTotal)}
          </p>
          {project.total_area > 0 && totals.grandTotal > 0 && (
            <p style={{ fontSize: '10px', color: 'oklch(0.50 0.018 265)', marginTop: '6px' }}>
              ₹{fmt(Math.round(totals.grandTotal / project.total_area))} / sqft · {project.total_area} sqft
            </p>
          )}
          {/* Progress arc — visual bar */}
          {totals.subtotal > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '2px', justifyContent: 'center' }}>
              {sortedCategories.slice(0, 8).map(([cat, val]) => {
                const c = CAT_COLORS[cat];
                const w = Math.max(4, Math.round((val / totals.subtotal) * 120));
                return (
                  <div key={cat} title={`${cat}: ₹${fmt(val)}`}
                    style={{ height: '4px', width: `${w}px`, borderRadius: '2px', background: c?.bar ?? 'oklch(0.50 0.018 265)' }} />
                );
              })}
            </div>
          )}
        </div>

        {/* Breakup */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid oklch(0.16 0.012 265)' }}>
          {[
            { label: 'Works Subtotal', value: `₹${fmt(totals.subtotal)}`, muted: false },
            { label: 'GST (weighted avg)', value: `₹${fmt(totals.gstTotal)}`, muted: true },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: row.muted ? 'oklch(0.50 0.018 265)' : 'oklch(0.70 0.014 265)' }}>{row.label}</span>
              <span style={{ fontFamily: 'monospace', color: row.muted ? 'oklch(0.60 0.014 265)' : 'oklch(0.88 0.006 265)' }}>{row.value}</span>
            </div>
          ))}

          {/* Markup inline edit */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'oklch(0.50 0.018 265)' }}>
              <TrendingUp style={{ width: 12, height: 12 }} />
              Markup
            </span>
            {editingMarkup ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input autoFocus value={markupDraft} onChange={e => setMarkupDraft(e.target.value)}
                  style={{ ...inputStyle, width: '52px' }} placeholder="0" />
                <span style={{ color: 'oklch(0.50 0.018 265)', fontSize: '11px' }}>%</span>
                <button onClick={() => { onUpdateProject('markup_percent', parseFloat(markupDraft) || 0); setEditingMarkup(false); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <Check style={{ width: 13, height: 13, color: '#4ade80' }} />
                </button>
                <button onClick={() => setEditingMarkup(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <X style={{ width: 13, height: 13, color: 'oklch(0.50 0.018 265)' }} />
                </button>
              </div>
            ) : (
              <button onClick={() => { setMarkupDraft(String(project.markup_percent)); setEditingMarkup(true); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', color: 'oklch(0.75 0.22 268)', fontSize: '12px' }}>
                +₹{fmt(totals.markup)}
                <span style={{ fontSize: '10px', color: 'oklch(0.50 0.018 265)' }}>({project.markup_percent}%)</span>
              </button>
            )}
          </div>

          {/* Discount inline edit */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'oklch(0.50 0.018 265)' }}>
              <MinusCircle style={{ width: 12, height: 12 }} />
              Discount
            </span>
            {editingDiscount ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: 'oklch(0.50 0.018 265)', fontSize: '11px' }}>₹</span>
                <input autoFocus value={discountDraft} onChange={e => setDiscountDraft(e.target.value)}
                  style={{ ...inputStyle, width: '72px' }} placeholder="0" />
                <button onClick={() => { onUpdateProject('discount_amount', parseFloat(discountDraft) || 0); setEditingDiscount(false); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <Check style={{ width: 13, height: 13, color: '#4ade80' }} />
                </button>
                <button onClick={() => setEditingDiscount(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <X style={{ width: 13, height: 13, color: 'oklch(0.50 0.018 265)' }} />
                </button>
              </div>
            ) : (
              <button onClick={() => { setDiscountDraft(String(project.discount_amount)); setEditingDiscount(true); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', color: totals.discount > 0 ? '#f87171' : 'oklch(0.60 0.014 265)', fontSize: '12px' }}>
                {totals.discount > 0 ? `-₹${fmt(totals.discount)}` : '— click to set'}
              </button>
            )}
          </div>

          <div style={{ borderTop: '1px solid oklch(0.18 0.014 265)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, color: 'oklch(0.88 0.006 265)' }}>Grand Total</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'oklch(0.72 0.22 268)' }}>₹{fmt(totals.grandTotal)}</span>
          </div>
        </div>

        {/* Section breakdown */}
        {sections.length > 0 && (
          <div style={{ borderBottom: '1px solid oklch(0.16 0.012 265)' }}>
            <button onClick={() => setSecExpanded(!secExpanded)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(0.50 0.018 265)' }}>
                By Room / Section
              </span>
              {secExpanded
                ? <ChevronDown style={{ width: 12, height: 12, color: 'oklch(0.50 0.018 265)' }} />
                : <ChevronRight style={{ width: 12, height: 12, color: 'oklch(0.50 0.018 265)' }} />}
            </button>
            {secExpanded && (
              <div style={{ padding: '0 16px 12px' }}>
                {sectionTotals.map(({ section, total }) => (
                  <BarRow key={section.id} label={section.name} value={total}
                    total={totals.subtotal}
                    color="oklch(0.70 0.22 268 / 0.8)"
                    dot="oklch(0.70 0.22 268)" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category breakdown */}
        {sortedCategories.length > 0 && (
          <div>
            <button onClick={() => setCatExpanded(!catExpanded)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(0.50 0.018 265)' }}>
                By Category
              </span>
              {catExpanded
                ? <ChevronDown style={{ width: 12, height: 12, color: 'oklch(0.50 0.018 265)' }} />
                : <ChevronRight style={{ width: 12, height: 12, color: 'oklch(0.50 0.018 265)' }} />}
            </button>
            {catExpanded && (
              <div style={{ padding: '0 16px 16px' }}>
                {sortedCategories.map(([cat, val]) => {
                  const c = CAT_COLORS[cat] ?? { bar: 'oklch(0.50 0.018 265)', dot: '#888' };
                  return <BarRow key={cat} label={cat} value={val} total={totals.subtotal} color={c.bar} dot={c.dot} />;
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
