'use client';

import { useState } from 'react';
import { Edit3, Check, X, ChevronDown, ChevronRight, Percent, MinusCircle, TrendingUp } from 'lucide-react';

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

const CATEGORY_COLORS: Record<string, string> = {
  'Civil Work': 'bg-orange-500',
  'Flooring': 'bg-amber-500',
  'Wall & Painting': 'bg-yellow-500',
  'False Ceiling': 'bg-lime-500',
  'Electrical': 'bg-blue-500',
  'Plumbing': 'bg-cyan-500',
  'Modular Kitchen': 'bg-teal-500',
  'Wardrobes & Storage': 'bg-violet-500',
  'Doors & Windows': 'bg-purple-500',
  'HVAC': 'bg-sky-500',
  'Furniture': 'bg-pink-500',
  'Décor & Soft Furnishing': 'bg-rose-500',
  'Staircase & Railing': 'bg-indigo-500',
  'External Works': 'bg-green-500',
  'Miscellaneous': 'bg-slate-500',
};

export function ProjectSummary({ project, sections, items, totals, onUpdateProject }: Props) {
  const [markupDraft, setMarkupDraft] = useState('');
  const [discountDraft, setDiscountDraft] = useState('');
  const [editingMarkup, setEditingMarkup] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [sectionsExpanded, setSectionsExpanded] = useState(true);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);

  // Category breakdown
  const categoryTotals = items.reduce<Record<string, number>>((acc, item) => {
    const amt = item.quantity * item.rate;
    acc[item.category] = (acc[item.category] ?? 0) + amt;
    return acc;
  }, {});
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  // Section breakdown
  const sectionTotals = sections.map(section => ({
    section,
    total: items
      .filter(i => i.section_id === section.id)
      .reduce((s, i) => s + i.quantity * i.rate, 0),
  })).sort((a, b) => b.total - a.total);

  return (
    <div className="flex flex-col h-full text-xs">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cost Summary</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Grand total hero ─ */}
        <div className="px-4 py-5 border-b border-border text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Grand Total</p>
          <p className="text-3xl font-black text-primary font-mono">₹{fmt(totals.grandTotal)}</p>
          {project.total_area && totals.grandTotal > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">
              ₹{fmt(Math.round(totals.grandTotal / project.total_area))} per sqft
            </p>
          )}
        </div>

        {/* ── Breakup ─ */}
        <div className="px-4 py-3 border-b border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono font-medium text-foreground">₹{fmt(totals.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">GST</span>
            <span className="font-mono text-foreground">₹{fmt(totals.gstTotal)}</span>
          </div>

          {/* Markup */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Markup
            </span>
            {editingMarkup ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={markupDraft}
                  onChange={e => setMarkupDraft(e.target.value)}
                  className="w-14 bg-input border border-primary/40 rounded px-1.5 py-0.5 text-xs text-right font-mono outline-none"
                  placeholder="0"
                />
                <span className="text-muted-foreground">%</span>
                <button onClick={() => {
                  onUpdateProject('markup_percent', parseFloat(markupDraft) || 0);
                  setEditingMarkup(false);
                }}>
                  <Check className="w-3 h-3 text-emerald-400" />
                </button>
                <button onClick={() => setEditingMarkup(false)}>
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setMarkupDraft(String(project.markup_percent)); setEditingMarkup(true); }}
                className="font-mono text-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                ₹{fmt(totals.markup)}
                <span className="text-[9px] text-muted-foreground">({project.markup_percent}%)</span>
                <Edit3 className="w-2.5 h-2.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Discount */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <MinusCircle className="w-3 h-3" />
              Discount
            </span>
            {editingDiscount ? (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">₹</span>
                <input
                  autoFocus
                  value={discountDraft}
                  onChange={e => setDiscountDraft(e.target.value)}
                  className="w-20 bg-input border border-primary/40 rounded px-1.5 py-0.5 text-xs text-right font-mono outline-none"
                  placeholder="0"
                />
                <button onClick={() => {
                  onUpdateProject('discount_amount', parseFloat(discountDraft) || 0);
                  setEditingDiscount(false);
                }}>
                  <Check className="w-3 h-3 text-emerald-400" />
                </button>
                <button onClick={() => setEditingDiscount(false)}>
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setDiscountDraft(String(project.discount_amount)); setEditingDiscount(true); }}
                className="font-mono text-destructive hover:text-red-400 transition-colors flex items-center gap-1"
              >
                -₹{fmt(totals.discount)}
                <Edit3 className="w-2.5 h-2.5 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="font-semibold text-foreground">Grand Total</span>
            <span className="font-mono font-bold text-primary">₹{fmt(totals.grandTotal)}</span>
          </div>
        </div>

        {/* ── Section breakdown ─ */}
        {sections.length > 0 && (
          <div className="border-b border-border">
            <button
              onClick={() => setSectionsExpanded(!sectionsExpanded)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent/40 transition-colors"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">By Section</span>
              {sectionsExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </button>
            {sectionsExpanded && (
              <div className="px-4 pb-3 space-y-2">
                {sectionTotals.map(({ section, total }) => (
                  <div key={section.id}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-foreground/80 truncate pr-2">{section.name}</span>
                      <span className="font-mono shrink-0">₹{fmt(total)}</span>
                    </div>
                    {totals.subtotal > 0 && (
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full"
                          style={{ width: `${Math.min(100, (total / totals.subtotal) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Category breakdown ─ */}
        {sortedCategories.length > 0 && (
          <div>
            <button
              onClick={() => setCategoriesExpanded(!categoriesExpanded)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent/40 transition-colors"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">By Category</span>
              {categoriesExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </button>
            {categoriesExpanded && (
              <div className="px-4 pb-4 space-y-2">
                {sortedCategories.map(([category, total]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${CATEGORY_COLORS[category] ?? 'bg-muted-foreground'}`} />
                      <span className="text-foreground/80 flex-1 truncate">{category}</span>
                      <span className="font-mono shrink-0">₹{fmt(total)}</span>
                    </div>
                    {totals.subtotal > 0 && (
                      <div className="ml-3.5 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full opacity-60 ${CATEGORY_COLORS[category] ?? 'bg-primary'}`}
                          style={{ width: `${Math.min(100, (total / totals.subtotal) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
