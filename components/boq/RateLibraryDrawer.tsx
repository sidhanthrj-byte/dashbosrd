'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, Plus, ChevronRight, Tag, Info } from 'lucide-react';
import { CATEGORIES } from '@/lib/boq-data';

type RateItem = {
  id: string; category: string; subcategory: string; description: string;
  specification: string; unit: string; rate: number; rate_min: number;
  rate_max: number; gst_percent: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (item: { category: string; description: string; specification: string; unit: string; rate: number; gst_percent: number }) => void;
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN').format(n);
}

export function RateLibraryDrawer({ open, onClose, onAdd }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [items, setItems] = useState<RateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== 'All') params.set('category', activeCategory);
    if (search.trim()) params.set('q', search.trim());
    const res = await fetch(`/api/boq/rate-library?${params}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, [activeCategory, search]);

  useEffect(() => {
    if (open) fetchItems();
  }, [open, fetchItems]);

  // Group items by subcategory
  const grouped = items.reduce<Record<string, RateItem[]>>((acc, item) => {
    const key = item.subcategory;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg h-full bg-card border-l border-border flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-sm font-bold text-foreground">Rate Library</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">150+ items · Indian market rates</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items, materials, finishes..."
              className="w-full bg-input border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category scroll */}
        <div className="px-4 py-2 border-b border-border overflow-x-auto scrollbar-none">
          <div className="flex gap-1.5 w-max">
            {['All', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {cat === 'All' ? 'All' : cat.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <Search className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No items found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="pb-6">
              {Object.entries(grouped).map(([subcategory, subItems]) => (
                <div key={subcategory}>
                  <div className="sticky top-0 bg-card/95 backdrop-blur-sm px-4 py-2 border-b border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{subcategory}</p>
                  </div>
                  {subItems.map(item => (
                    <RateLibraryItem
                      key={item.id}
                      item={item}
                      hovered={hoveredId === item.id}
                      onHover={setHoveredId}
                      onAdd={onAdd}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            Rates are standard Indian market estimates · Adjust as needed in the BOQ
          </p>
        </div>
      </div>
    </div>
  );
}

function RateLibraryItem({
  item, hovered, onHover, onAdd
}: {
  item: RateItem;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onAdd: (item: { category: string; description: string; specification: string; unit: string; rate: number; gst_percent: number }) => void;
}) {
  return (
    <div
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      className="flex items-start gap-3 px-4 py-3 border-b border-border/40 hover:bg-accent/40 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-snug">{item.description}</p>
        {item.specification && (
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">{item.specification}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[10px] font-mono font-bold text-primary">
            ₹{fmt(item.rate)} <span className="font-normal text-muted-foreground">/ {item.unit}</span>
          </span>
          {item.rate_min !== item.rate_max && (
            <span className="text-[10px] text-muted-foreground/70">
              Range: ₹{fmt(item.rate_min)}–{fmt(item.rate_max)}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/70">GST {item.gst_percent}%</span>
        </div>
      </div>
      <button
        onClick={() => onAdd({
          category: item.category,
          description: item.description,
          specification: item.specification,
          unit: item.unit,
          rate: item.rate,
          gst_percent: item.gst_percent,
        })}
        className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-primary/15 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 rounded-lg text-xs font-medium transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        Add
      </button>
    </div>
  );
}
