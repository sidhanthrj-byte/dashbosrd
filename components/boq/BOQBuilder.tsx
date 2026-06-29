'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Printer, Trash2, BookOpen,
  Building2, MapPin, Maximize2, BarChart3, ChevronDown,
  Copy, FileText, Pencil, Check, X, MoreHorizontal,
  StickyNote, IndianRupee
} from 'lucide-react';
import { RateLibraryDrawer } from './RateLibraryDrawer';
import { ProjectSummary } from './ProjectSummary';
import { toast } from 'sonner';

type Project = {
  id: number; name: string; client_name: string; client_phone: string;
  client_email: string; project_type: string; location: string;
  total_area: number; status: string; markup_percent: number;
  discount_amount: number; notes: string;
};

type Section = {
  id: number; project_id: number; name: string; area: number | null;
  notes: string | null; sort_order: number;
};

type Item = {
  id: number; section_id: number; category: string; description: string;
  specification: string; remarks: string; unit: string; quantity: number;
  rate: number; gst_percent: number; sort_order: number;
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; pill: string; text: string }> = {
  draft:    { label: 'Draft',        dot: '#64748b', pill: 'oklch(0.12 0.012 265)',   text: 'oklch(0.60 0.018 265)' },
  sent:     { label: 'Sent',         dot: '#60a5fa', pill: 'oklch(0.15 0.06 240)',    text: '#60a5fa' },
  approved: { label: 'Approved',     dot: '#34d399', pill: 'oklch(0.15 0.06 160)',    text: '#34d399' },
  revision: { label: 'In Revision',  dot: '#fbbf24', pill: 'oklch(0.16 0.06 80)',     text: '#fbbf24' },
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  'Civil Work':           { bg: 'oklch(0.15 0.06 40)',   text: '#fb923c', bar: '#f97316' },
  'Flooring':             { bg: 'oklch(0.15 0.06 70)',   text: '#fbbf24', bar: '#f59e0b' },
  'Wall & Painting':      { bg: 'oklch(0.15 0.05 95)',   text: '#a3e635', bar: '#84cc16' },
  'False Ceiling':        { bg: 'oklch(0.15 0.06 155)',  text: '#34d399', bar: '#10b981' },
  'Electrical':           { bg: 'oklch(0.15 0.06 240)',  text: '#60a5fa', bar: '#3b82f6' },
  'Plumbing':             { bg: 'oklch(0.15 0.05 195)',  text: '#22d3ee', bar: '#06b6d4' },
  'Modular Kitchen':      { bg: 'oklch(0.15 0.05 175)',  text: '#2dd4bf', bar: '#14b8a6' },
  'Wardrobes & Storage':  { bg: 'oklch(0.15 0.06 285)',  text: '#a78bfa', bar: '#8b5cf6' },
  'Doors & Windows':      { bg: 'oklch(0.15 0.06 305)',  text: '#c084fc', bar: '#a855f7' },
  'HVAC':                 { bg: 'oklch(0.15 0.06 220)',  text: '#7dd3fc', bar: '#38bdf8' },
  'Furniture':            { bg: 'oklch(0.15 0.06 340)',  text: '#f9a8d4', bar: '#ec4899' },
  'Décor & Soft Furnishing': { bg: 'oklch(0.15 0.06 350)', text: '#fca5a5', bar: '#ef4444' },
  'Staircase & Railing':  { bg: 'oklch(0.15 0.06 260)',  text: '#818cf8', bar: '#6366f1' },
  'External Works':       { bg: 'oklch(0.15 0.06 140)',  text: '#86efac', bar: '#22c55e' },
  'Miscellaneous':        { bg: 'oklch(0.13 0.01 265)',  text: '#94a3b8', bar: '#64748b' },
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);
const UNITS = ['sqft', 'rft', 'nos', 'point', 'lot', 'rmt', 'kg', 'bag', 'set', 'cum', 'cft', 'lm'];

const GST_RATES = [0, 5, 12, 18, 28];

function fmtN(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

const PRESET_SECTIONS = [
  'Living Room', 'Dining Area', 'Kitchen', 'Master Bedroom', 'Bedroom 2', 'Bedroom 3',
  'Master Bathroom', 'Common Bathroom', 'Balcony', 'Study / Office', 'Entrance Lobby',
  'Terrace', 'Puja Room', 'Store Room', 'Staircase', 'Servant Room', 'Garage', 'External',
];

export function BOQBuilder({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [sectionNotesOpen, setSectionNotesOpen] = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const [projRes, sectRes] = await Promise.all([
      fetch(`/api/boq/projects/${projectId}`),
      fetch(`/api/boq/projects/${projectId}/sections`),
    ]);
    if (!projRes.ok) { router.push('/boq'); return; }
    const projData = await projRes.json();
    const sectData = await sectRes.json();
    setProject(projData.project);
    setSections(sectData.sections || []);
    setItems(sectData.items || []);
    if (sectData.sections?.length > 0 && !activeSectionId) {
      setActiveSectionId(sectData.sections[0].id);
    }
  }, [projectId, router, activeSectionId]);

  useEffect(() => { load(); }, [projectId]);

  const activeItems = items.filter(i => i.section_id === activeSectionId);

  const totals = (() => {
    let subtotal = 0, gstTotal = 0;
    for (const item of items) {
      const amt = item.quantity * item.rate;
      subtotal += amt;
      gstTotal += amt * (item.gst_percent / 100);
    }
    const markup = subtotal * ((project?.markup_percent ?? 0) / 100);
    const discount = project?.discount_amount ?? 0;
    return { subtotal, gstTotal, markup, discount, grandTotal: subtotal + gstTotal + markup - discount };
  })();

  const sectionTotal = (sectionId: number) =>
    items.filter(i => i.section_id === sectionId).reduce((s, i) => s + i.quantity * i.rate, 0);

  const saveItem = useCallback(async (item: Item, field: keyof Item, value: unknown) => {
    const updated = { ...item, [field]: value };
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      await fetch(`/api/boq/projects/${projectId}/sections/${item.section_id}/items/${item.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      setSaving(false);
    }, 500);
  }, [projectId]);

  const addItem = useCallback(async (fromLibrary?: Partial<Item>) => {
    if (!activeSectionId) return;
    const res = await fetch(`/api/boq/projects/${projectId}/sections/${activeSectionId}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fromLibrary ?? { category: 'Civil Work', description: 'New Item', unit: 'sqft', quantity: 1, rate: 0 }),
    });
    const data = await res.json();
    if (data.item) setItems(prev => [...prev, data.item]);
  }, [activeSectionId, projectId]);

  const deleteItem = useCallback(async (item: Item) => {
    setItems(prev => prev.filter(i => i.id !== item.id));
    await fetch(`/api/boq/projects/${projectId}/sections/${item.section_id}/items/${item.id}`, { method: 'DELETE' });
  }, [projectId]);

  const duplicateItem = useCallback(async (item: Item) => {
    const res = await fetch(`/api/boq/projects/${projectId}/sections/${item.section_id}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: item.category, description: item.description + ' (copy)', specification: item.specification, unit: item.unit, quantity: item.quantity, rate: item.rate, gst_percent: item.gst_percent }),
    });
    const data = await res.json();
    if (data.item) setItems(prev => [...prev, data.item]);
  }, [projectId]);

  const addSection = async () => {
    if (!newSectionName.trim()) return;
    const res = await fetch(`/api/boq/projects/${projectId}/sections`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSectionName.trim() }),
    });
    const data = await res.json();
    if (data.section) {
      setSections(prev => [...prev, data.section]);
      setActiveSectionId(data.section.id);
      setNewSectionName(''); setIsAddingSection(false);
    }
  };

  const deleteSection = async (section: Section) => {
    if (!confirm(`Delete "${section.name}" and all its items?`)) return;
    await fetch(`/api/boq/projects/${projectId}/sections/${section.id}`, { method: 'DELETE' });
    setSections(prev => prev.filter(s => s.id !== section.id));
    setItems(prev => prev.filter(i => i.section_id !== section.id));
    if (activeSectionId === section.id) {
      setActiveSectionId(sections.find(s => s.id !== section.id)?.id ?? null);
    }
  };

  const updateSectionNotes = async (section: Section, notes: string) => {
    setSections(prev => prev.map(s => s.id === section.id ? { ...s, notes } : s));
    await fetch(`/api/boq/projects/${projectId}/sections/${section.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
  };

  const updateStatus = async (status: string) => {
    setStatusMenuOpen(false);
    await fetch(`/api/boq/projects/${projectId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setProject(p => p ? { ...p, status } : p);
    toast.success(`Status → ${STATUS_CONFIG[status]?.label}`);
  };

  const updateProjectField = async (field: string, value: unknown) => {
    setProject(p => p ? { ...p, [field]: value } : p);
    await fetch(`/api/boq/projects/${projectId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
  };

  if (!project) return (
    <div className="flex h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'oklch(0.70 0.22 268)', borderTopColor: 'transparent' }} />
    </div>
  );

  const activeSection = sections.find(s => s.id === activeSectionId);
  const statusCfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.draft;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--background)' }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="shrink-0 h-13 border-b flex items-center px-4 gap-3"
        style={{ background: 'oklch(0.075 0.012 265)', borderColor: 'var(--border)', height: 52 }}>
        <button onClick={() => router.push('/boq')}
          className="flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-md"
          style={{ color: 'var(--muted-foreground)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        <div className="w-px h-4" style={{ background: 'var(--border)' }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{project.name}</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span className="text-xs truncate hidden sm:inline" style={{ color: 'var(--muted-foreground)' }}>{project.client_name}</span>
          </div>
        </div>

        {/* Status picker */}
        <div className="relative">
          <button
            onClick={() => setStatusMenuOpen(!statusMenuOpen)}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
            style={{ background: statusCfg.pill, color: statusCfg.text }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.dot }} />
            {statusCfg.label}
            <ChevronDown className="w-3 h-3" />
          </button>
          {statusMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 rounded-xl shadow-xl z-20 border overflow-hidden"
                style={{ background: 'var(--popover)', borderColor: 'var(--border)' }}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <button key={k} onClick={() => updateStatus(k)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-accent"
                    style={{ color: project.status === k ? 'oklch(0.70 0.22 268)' : 'var(--foreground)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: v.dot }} />
                    {v.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {saving && (
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            <span className="hidden sm:inline">Saving</span>
          </span>
        )}

        <button onClick={() => setIsSummaryOpen(true)}
          className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors"
          style={{ color: 'var(--muted-foreground)', background: 'var(--muted)' }}>
          <BarChart3 className="w-3.5 h-3.5" />
          ₹{fmtN(totals.grandTotal)}
        </button>

        <a href={`/boq/${projectId}/print`} target="_blank"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:opacity-80"
          style={{ color: 'oklch(0.70 0.22 268)', borderColor: 'oklch(0.70 0.22 268 / 0.35)', background: 'oklch(0.70 0.22 268 / 0.10)' }}>
          <Printer className="w-3.5 h-3.5" />
          Print / PDF
        </a>
      </header>

      {/* ── Totals strip ──────────────────────────────────────── */}
      <div className="shrink-0 h-9 border-b flex items-center px-4 gap-4 text-[11px]"
        style={{ background: 'oklch(0.065 0.010 265)', borderColor: 'var(--border)' }}>
        {[
          { label: 'Subtotal', val: `₹${fmtN(totals.subtotal)}` },
          { label: 'GST', val: `₹${fmtN(totals.gstTotal)}` },
          ...(totals.markup > 0 ? [{ label: 'Markup', val: `₹${fmtN(totals.markup)}` }] : []),
          ...(totals.discount > 0 ? [{ label: 'Discount', val: `-₹${fmtN(totals.discount)}` }] : []),
        ].map((t, i) => (
          <span key={t.label} className="flex items-center gap-2">
            {i > 0 && <span style={{ color: 'var(--border)' }}>·</span>}
            <span style={{ color: 'var(--muted-foreground)' }}>{t.label}</span>
            <span className="font-mono font-medium" style={{ color: 'var(--foreground)' }}>{t.val}</span>
          </span>
        ))}
        <span style={{ color: 'var(--border)' }}>·</span>
        <span style={{ color: 'var(--muted-foreground)' }}>Total</span>
        <span className="font-mono font-bold text-[13px]" style={{ color: 'oklch(0.70 0.22 268)' }}>
          ₹{fmtN(totals.grandTotal)}
        </span>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar: Sections ─────────────────────────────── */}
        <aside className="w-52 shrink-0 border-r flex-col hidden md:flex"
          style={{ background: 'var(--sidebar)', borderColor: 'var(--sidebar-border)' }}>

          <div className="px-3 pt-3 pb-2 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
              Sections
            </p>
          </div>

          <div className="flex-1 overflow-y-auto py-1.5">
            {sections.map(section => {
              const isActive = section.id === activeSectionId;
              const st = sectionTotal(section.id);
              const iCount = items.filter(i => i.section_id === section.id).length;
              return (
                <div key={section.id} className="px-2 mb-0.5 group/sec">
                  <button onClick={() => setActiveSectionId(section.id)}
                    className="w-full flex items-start gap-2 px-2.5 py-2 rounded-lg text-left transition-all"
                    style={isActive
                      ? { background: 'oklch(0.70 0.22 268 / 0.15)', border: '1px solid oklch(0.70 0.22 268 / 0.25)' }
                      : { background: 'transparent', border: '1px solid transparent' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium leading-tight truncate"
                        style={{ color: isActive ? 'oklch(0.70 0.22 268)' : 'var(--sidebar-foreground)' }}>
                        {section.name}
                      </p>
                      <p className="text-[10px] mt-0.5 font-mono"
                        style={{ color: isActive ? 'oklch(0.70 0.22 268 / 0.7)' : 'var(--muted-foreground)' }}>
                        ₹{fmtN(st)} · {iCount} item{iCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/sec:opacity-100 transition-opacity shrink-0 mt-0.5">
                      <button onClick={e => { e.stopPropagation(); setSectionNotesOpen(sectionNotesOpen === section.id ? null : section.id); }}
                        className="p-0.5 rounded transition-colors"
                        style={{ color: section.notes ? 'oklch(0.70 0.22 268)' : 'var(--muted-foreground)' }}
                        title="Section notes">
                        <StickyNote className="w-3 h-3" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteSection(section); }}
                        className="p-0.5 rounded transition-colors"
                        style={{ color: 'var(--muted-foreground)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)'}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </button>

                  {/* Section notes inline editor */}
                  {sectionNotesOpen === section.id && (
                    <div className="mt-1 px-1">
                      <textarea
                        autoFocus
                        value={section.notes ?? ''}
                        onChange={e => updateSectionNotes(section, e.target.value)}
                        placeholder="Notes for this section..."
                        rows={2}
                        className="w-full text-[10px] rounded-md px-2 py-1.5 resize-none outline-none"
                        style={{
                          background: 'var(--input)', border: '1px solid oklch(0.70 0.22 268 / 0.3)',
                          color: 'var(--foreground)', fontFamily: 'inherit',
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add section */}
            <div className="px-2 mt-1">
              {isAddingSection ? (
                <div className="px-2 py-2">
                  <input autoFocus value={newSectionName} onChange={e => setNewSectionName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addSection(); if (e.key === 'Escape') { setIsAddingSection(false); setNewSectionName(''); } }}
                    placeholder="Section name..."
                    className="w-full rounded-md px-2.5 py-1.5 text-[11px] outline-none"
                    style={{ background: 'var(--input)', border: '1px solid oklch(0.70 0.22 268 / 0.4)', color: 'var(--foreground)' }} />
                  {/* Quick presets */}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {PRESET_SECTIONS.slice(0, 8).map(n => (
                      <button key={n} type="button" onClick={() => setNewSectionName(n)}
                        className="text-[9px] px-1.5 py-0.5 rounded transition-colors"
                        style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.70 0.22 268 / 0.15)'; (e.currentTarget as HTMLButtonElement).style.color = 'oklch(0.70 0.22 268)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button onClick={addSection}
                      className="flex-1 py-1 text-[10px] font-medium rounded-md text-white"
                      style={{ background: 'oklch(0.70 0.22 268)' }}>Add</button>
                    <button onClick={() => { setIsAddingSection(false); setNewSectionName(''); }}
                      className="flex-1 py-1 text-[10px] rounded-md"
                      style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setIsAddingSection(true)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] transition-colors"
                  style={{ color: 'var(--muted-foreground)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-accent)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}>
                  <Plus className="w-3.5 h-3.5" /> Add Section
                </button>
              )}
            </div>
          </div>

          {/* Project info footer */}
          <div className="px-3 py-3 border-t space-y-1.5" style={{ borderColor: 'var(--sidebar-border)' }}>
            <p className="text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Project Info</p>
            {[
              project.project_type && { icon: <Building2 className="w-3 h-3" />, text: project.project_type },
              project.location && { icon: <MapPin className="w-3 h-3" />, text: project.location },
              project.total_area && { icon: <Maximize2 className="w-3 h-3" />, text: `${project.total_area} sqft` },
            ].filter(Boolean).map((row, i) => row && (
              <div key={i} className="flex items-center gap-1.5">
                <span style={{ color: 'var(--muted-foreground)' }}>{row.icon}</span>
                <span className="text-[10px] truncate" style={{ color: 'var(--sidebar-foreground)' }}>{row.text}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Items Table ───────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeSection ? (
            <>
              {/* Section header */}
              <div className="shrink-0 px-4 py-2.5 border-b flex items-center gap-3"
                style={{ background: 'oklch(0.065 0.010 265)', borderColor: 'var(--border)' }}>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{activeSection.name}</h2>
                  {activeSection.area && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{activeSection.area} sqft</p>
                  )}
                </div>
                {activeSection.notes && (
                  <div className="hidden lg:flex items-start gap-1.5 text-[10px] max-w-xs"
                    style={{ color: 'var(--muted-foreground)' }}>
                    <StickyNote className="w-3 h-3 shrink-0 mt-0.5" />
                    <span className="truncate">{activeSection.notes}</span>
                  </div>
                )}
                <button onClick={() => setIsLibraryOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all"
                  style={{ color: 'oklch(0.70 0.22 268)', borderColor: 'oklch(0.70 0.22 268 / 0.3)', background: 'oklch(0.70 0.22 268 / 0.08)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.70 0.22 268 / 0.15)'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.70 0.22 268 / 0.08)'}>
                  <BookOpen className="w-3.5 h-3.5" /> Rate Library
                </button>
                <button onClick={() => addItem()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-white transition-opacity hover:opacity-90"
                  style={{ background: 'oklch(0.70 0.22 268)' }}>
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                {activeItems.length === 0 ? (
                  <EmptySection onAdd={() => addItem()} onLibrary={() => setIsLibraryOpen(true)} />
                ) : (
                  <table className="w-full text-[11px] min-w-[920px]">
                    <thead className="sticky top-0 z-10">
                      <tr style={{ background: 'oklch(0.075 0.012 265)', borderBottom: '1px solid var(--border)' }}>
                        <th className="w-8 px-2 py-2 text-left font-medium" style={{ color: 'var(--muted-foreground)' }}>#</th>
                        <th className="w-28 px-2 py-2 text-left font-medium" style={{ color: 'var(--muted-foreground)' }}>Category</th>
                        <th className="px-2 py-2 text-left font-medium" style={{ color: 'var(--muted-foreground)' }}>Description</th>
                        <th className="w-40 px-2 py-2 text-left font-medium hidden xl:table-cell" style={{ color: 'var(--muted-foreground)' }}>Specification</th>
                        <th className="w-16 px-2 py-2 text-center font-medium" style={{ color: 'var(--muted-foreground)' }}>Unit</th>
                        <th className="w-20 px-2 py-2 text-right font-medium" style={{ color: 'var(--muted-foreground)' }}>Qty</th>
                        <th className="w-24 px-2 py-2 text-right font-medium" style={{ color: 'var(--muted-foreground)' }}>Rate ₹</th>
                        <th className="w-24 px-2 py-2 text-right font-medium" style={{ color: 'var(--muted-foreground)' }}>Amount</th>
                        <th className="w-16 px-2 py-2 text-center font-medium" style={{ color: 'var(--muted-foreground)' }}>GST%</th>
                        <th className="w-24 px-2 py-2 text-right font-medium" style={{ color: 'var(--muted-foreground)' }}>Total ₹</th>
                        <th className="w-14 px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {activeItems.map((item, idx) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          index={idx + 1}
                          onSave={saveItem}
                          onDelete={deleteItem}
                          onDuplicate={duplicateItem}
                        />
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'oklch(0.075 0.012 265)', borderTop: '2px solid var(--border)' }}>
                        <td colSpan={7} className="px-3 py-2.5 text-right text-[11px] font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                          Section subtotal (excl. GST)
                        </td>
                        <td className="px-3 py-2.5 text-right text-[11px] font-bold font-mono" style={{ color: 'var(--foreground)' }}>
                          ₹{fmtN(activeItems.reduce((s, i) => s + i.quantity * i.rate, 0))}
                        </td>
                        <td />
                        <td className="px-3 py-2.5 text-right text-sm font-bold font-mono" style={{ color: 'oklch(0.70 0.22 268)' }}>
                          ₹{fmtN(activeItems.reduce((s, i) => s + i.quantity * i.rate * (1 + i.gst_percent / 100), 0))}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </>
          ) : (
            <NoSections onAdd={() => setIsAddingSection(true)} />
          )}
        </main>

        {/* ── Summary Panel ────────────────────────────────── */}
        <aside className="w-64 shrink-0 border-l hidden md:flex flex-col overflow-y-auto"
          style={{ background: 'var(--sidebar)', borderColor: 'var(--sidebar-border)' }}>
          <ProjectSummary
            project={project}
            sections={sections}
            items={items}
            totals={totals}
            onUpdateProject={updateProjectField}
          />
        </aside>
      </div>

      <RateLibraryDrawer
        open={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onAdd={item => { addItem(item); toast.success(`Added: ${item.description}`); }}
      />

      {/* Mobile summary sheet */}
      {isSummaryOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setIsSummaryOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] rounded-t-2xl flex flex-col overflow-hidden"
            style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Cost Summary</h3>
              <button onClick={() => setIsSummaryOpen(false)} style={{ color: 'var(--muted-foreground)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <ProjectSummary project={project} sections={sections} items={items} totals={totals} onUpdateProject={updateProjectField} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Item Row ──────────────────────────────────────────────────────

function ItemRow({ item, index, onSave, onDelete, onDuplicate }: {
  item: Item; index: number;
  onSave: (item: Item, field: keyof Item, value: unknown) => void;
  onDelete: (item: Item) => void;
  onDuplicate: (item: Item) => void;
}) {
  const amt = item.quantity * item.rate;
  const total = amt * (1 + item.gst_percent / 100);
  const cat = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS['Miscellaneous'];
  const [showRemarks, setShowRemarks] = useState(false);

  return (
    <>
      <tr className="border-b group/row transition-colors"
        style={{ borderColor: 'oklch(0.13 0.012 265)' }}
        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'oklch(0.10 0.012 265 / 0.6)'}
        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
        <td className="px-2 py-1.5 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{index}</td>

        <td className="px-2 py-1.5">
          <select value={item.category} onChange={e => onSave(item, 'category', e.target.value)}
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border-0 outline-none cursor-pointer"
            style={{ background: cat.bg, color: cat.text, WebkitAppearance: 'none' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </td>

        <td className="px-2 py-1.5">
          <EditableCell value={item.description} onChange={v => onSave(item, 'description', v)}
            bold placeholder="Description" />
        </td>

        <td className="px-2 py-1.5 hidden xl:table-cell">
          <EditableCell value={item.specification ?? ''} onChange={v => onSave(item, 'specification', v)}
            placeholder="Specification" muted />
        </td>

        <td className="px-2 py-1.5 text-center">
          <select value={item.unit} onChange={e => onSave(item, 'unit', e.target.value)}
            className="text-[11px] text-center bg-transparent border-0 outline-none cursor-pointer transition-colors"
            style={{ color: 'var(--foreground)' }}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </td>

        <td className="px-2 py-1.5 text-right">
          <EditableNumber value={item.quantity} onChange={v => onSave(item, 'quantity', v)} decimals={2} />
        </td>

        <td className="px-2 py-1.5 text-right">
          <EditableNumber value={item.rate} onChange={v => onSave(item, 'rate', v)} decimals={0} />
        </td>

        <td className="px-2 py-1.5 text-right font-mono" style={{ color: 'var(--foreground)', opacity: 0.75 }}>
          {fmtN(amt)}
        </td>

        <td className="px-2 py-1.5 text-center">
          <select value={item.gst_percent} onChange={e => onSave(item, 'gst_percent', Number(e.target.value))}
            className="text-[11px] text-center bg-transparent border-0 outline-none cursor-pointer"
            style={{ color: 'var(--muted-foreground)' }}>
            {GST_RATES.map(g => <option key={g} value={g}>{g}%</option>)}
          </select>
        </td>

        <td className="px-2 py-1.5 text-right font-mono font-semibold" style={{ color: 'var(--foreground)' }}>
          {fmtN(total)}
        </td>

        <td className="px-2 py-1.5">
          <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
            <button onClick={() => setShowRemarks(!showRemarks)}
              className="p-1 rounded transition-colors"
              style={{ color: item.remarks ? 'oklch(0.70 0.22 268)' : 'var(--muted-foreground)' }}
              title="Add remarks">
              <StickyNote className="w-3 h-3" />
            </button>
            <button onClick={() => onDuplicate(item)}
              className="p-1 rounded transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'}>
              <Copy className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(item)}
              className="p-1 rounded transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'}>
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </td>
      </tr>

      {showRemarks && (
        <tr style={{ background: 'oklch(0.09 0.01 265)' }}>
          <td colSpan={11} className="px-3 py-2">
            <div className="flex items-start gap-2">
              <StickyNote className="w-3 h-3 mt-1 shrink-0" style={{ color: 'oklch(0.70 0.22 268)' }} />
              <input
                value={item.remarks ?? ''}
                onChange={e => onSave(item, 'remarks', e.target.value)}
                placeholder="Add remarks or notes for this item..."
                className="flex-1 bg-transparent text-[11px] outline-none"
                style={{ color: 'var(--foreground)', borderBottom: '1px solid var(--border)' }}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function EditableCell({
  value, onChange, placeholder = '', bold = false, muted = false
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; bold?: boolean; muted?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);

  const style: React.CSSProperties = {
    fontSize: '11px',
    color: muted ? 'var(--muted-foreground)' : 'var(--foreground)',
    fontWeight: bold ? 500 : 400,
  };

  if (editing) {
    return (
      <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={e => {
          if (e.key === 'Enter') { onChange(draft); setEditing(false); }
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
          if (e.key === 'Tab') { onChange(draft); setEditing(false); }
        }}
        placeholder={placeholder}
        className="w-full rounded px-1.5 py-0.5 outline-none"
        style={{ ...style, background: 'var(--input)', border: '1px solid oklch(0.70 0.22 268 / 0.45)' }} />
    );
  }
  return (
    <button onClick={() => setEditing(true)}
      className="w-full text-left px-1.5 py-0.5 rounded truncate transition-colors"
      style={{ ...style, color: value ? style.color : 'var(--muted-foreground)', opacity: value ? 1 : 0.4, fontStyle: value ? 'normal' : 'italic' }}
      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'}
      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
      {value || placeholder}
    </button>
  );
}

function EditableNumber({
  value, onChange, decimals = 2
}: {
  value: number; onChange: (v: number) => void; decimals?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);

  if (editing) {
    return (
      <input autoFocus type="number" value={draft} onChange={e => setDraft(e.target.value)}
        onBlur={() => { const n = parseFloat(draft) || 0; onChange(n); setEditing(false); }}
        onKeyDown={e => {
          if (e.key === 'Enter') { const n = parseFloat(draft) || 0; onChange(n); setEditing(false); }
          if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); }
        }}
        className="w-full text-right rounded px-1.5 py-0.5 outline-none font-mono text-[11px]"
        style={{ background: 'var(--input)', border: '1px solid oklch(0.70 0.22 268 / 0.45)', color: 'var(--foreground)' }} />
    );
  }
  return (
    <button onClick={() => setEditing(true)}
      className="w-full text-right px-1.5 py-0.5 rounded font-mono text-[11px] transition-colors"
      style={{ color: 'var(--foreground)' }}
      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'}
      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
      {Number(value).toFixed(decimals)}
    </button>
  );
}

function EmptySection({ onAdd, onLibrary }: { onAdd: () => void; onLibrary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20 px-8">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'oklch(0.70 0.22 268 / 0.1)', border: '1px solid oklch(0.70 0.22 268 / 0.2)' }}>
        <Plus className="w-7 h-7" style={{ color: 'oklch(0.70 0.22 268)' }} />
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>No items yet</h3>
      <p className="text-xs mb-6 max-w-xs" style={{ color: 'var(--muted-foreground)' }}>
        Add items manually or browse 150+ pre-priced items from the rate library
      </p>
      <div className="flex gap-3">
        <button onClick={onLibrary}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg text-white transition-opacity hover:opacity-90"
          style={{ background: 'oklch(0.70 0.22 268)' }}>
          <BookOpen className="w-3.5 h-3.5" /> Browse Library
        </button>
        <button onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg border transition-colors"
          style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)', background: 'var(--muted)' }}>
          <Plus className="w-3.5 h-3.5" /> Blank Item
        </button>
      </div>
    </div>
  );
}

function NoSections({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20 px-8">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'oklch(0.70 0.22 268 / 0.1)', border: '1px solid oklch(0.70 0.22 268 / 0.2)' }}>
        <Building2 className="w-7 h-7" style={{ color: 'oklch(0.70 0.22 268)' }} />
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Add your first section</h3>
      <p className="text-xs mb-6 max-w-xs" style={{ color: 'var(--muted-foreground)' }}>
        Sections are rooms or areas — Living Room, Kitchen, Master Bedroom, etc.
      </p>
      <button onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg text-white transition-opacity hover:opacity-90"
        style={{ background: 'oklch(0.70 0.22 268)' }}>
        <Plus className="w-3.5 h-3.5" /> Add First Section
      </button>
    </div>
  );
}
