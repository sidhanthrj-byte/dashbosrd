'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Printer, ChevronDown, ChevronRight,
  Trash2, GripVertical, BookOpen, Save, CheckCircle2,
  Edit3, Building2, User, Phone, MapPin, Maximize2,
  MoreHorizontal, Copy, AlertCircle, BarChart3
} from 'lucide-react';
import { RateLibraryDrawer } from './RateLibraryDrawer';
import { ProjectSummary } from './ProjectSummary';
import { toast } from 'sonner';

type Project = {
  id: number; name: string; client_name: string; client_phone: string;
  client_email: string; project_type: string; location: string;
  total_area: number; status: string; markup_percent: number;
  discount_amount: number; notes: string; created_at: string;
};

type Section = {
  id: number; project_id: number; name: string; area: number | null;
  sort_order: number; subtotal?: number; item_count?: number;
};

type Item = {
  id: number; section_id: number; category: string; description: string;
  specification: string; unit: string; quantity: number; rate: number;
  gst_percent: number; sort_order: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'text-muted-foreground bg-muted' },
  sent: { label: 'Sent to Client', color: 'text-blue-400 bg-blue-500/15' },
  approved: { label: 'Approved', color: 'text-emerald-400 bg-emerald-500/15' },
  revision: { label: 'In Revision', color: 'text-amber-400 bg-amber-500/15' },
};

const CATEGORY_COLORS: Record<string, string> = {
  'Civil Work': 'bg-orange-500/20 text-orange-300',
  'Flooring': 'bg-amber-500/20 text-amber-300',
  'Wall & Painting': 'bg-yellow-500/20 text-yellow-300',
  'False Ceiling': 'bg-lime-500/20 text-lime-300',
  'Electrical': 'bg-blue-500/20 text-blue-300',
  'Plumbing': 'bg-cyan-500/20 text-cyan-300',
  'Modular Kitchen': 'bg-teal-500/20 text-teal-300',
  'Wardrobes & Storage': 'bg-violet-500/20 text-violet-300',
  'Doors & Windows': 'bg-purple-500/20 text-purple-300',
  'HVAC': 'bg-sky-500/20 text-sky-300',
  'Furniture': 'bg-pink-500/20 text-pink-300',
  'Décor & Soft Furnishing': 'bg-rose-500/20 text-rose-300',
  'Staircase & Railing': 'bg-indigo-500/20 text-indigo-300',
  'External Works': 'bg-green-500/20 text-green-300',
  'Miscellaneous': 'bg-slate-500/20 text-slate-300',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

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
  const [editingProjectField, setEditingProjectField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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

  // ── Computed totals ──────────────────────────────────────────
  const totals = (() => {
    let subtotal = 0;
    let gstTotal = 0;
    for (const item of items) {
      const amt = item.quantity * item.rate;
      subtotal += amt;
      gstTotal += amt * (item.gst_percent / 100);
    }
    const markup = subtotal * ((project?.markup_percent ?? 0) / 100);
    const discount = project?.discount_amount ?? 0;
    const grandTotal = subtotal + gstTotal + markup - discount;
    return { subtotal, gstTotal, markup, discount, grandTotal };
  })();

  // ── Section totals ──────────────────────────────────────────
  const sectionTotals = (sectionId: number) => {
    const sItems = items.filter(i => i.section_id === sectionId);
    return sItems.reduce((sum, i) => sum + i.quantity * i.rate, 0);
  };

  // ── Save item field with debounce ────────────────────────────
  const saveItem = useCallback(async (item: Item, field: keyof Item, value: unknown) => {
    const updated = { ...item, [field]: value };
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));

    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      await fetch(`/api/boq/projects/${projectId}/sections/${item.section_id}/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      setSaving(false);
    }, 600);
  }, [projectId]);

  // ── Add item (blank or from library) ────────────────────────
  const addItem = useCallback(async (fromLibrary?: {
    category: string; description: string; specification: string;
    unit: string; rate: number; gst_percent: number;
  }) => {
    if (!activeSectionId) return;
    const res = await fetch(
      `/api/boq/projects/${projectId}/sections/${activeSectionId}/items`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fromLibrary ?? {
          category: 'Civil Work', description: 'New Item', unit: 'sqft', quantity: 1, rate: 0,
        }),
      }
    );
    const data = await res.json();
    if (data.item) {
      setItems(prev => [...prev, data.item]);
      // Update section subtotal
      setSections(prev => prev.map(s =>
        s.id === activeSectionId
          ? { ...s, item_count: (s.item_count ?? 0) + 1 }
          : s
      ));
    }
  }, [activeSectionId, projectId]);

  const deleteItem = useCallback(async (item: Item) => {
    setItems(prev => prev.filter(i => i.id !== item.id));
    await fetch(
      `/api/boq/projects/${projectId}/sections/${item.section_id}/items/${item.id}`,
      { method: 'DELETE' }
    );
  }, [projectId]);

  const duplicateItem = useCallback(async (item: Item) => {
    const res = await fetch(
      `/api/boq/projects/${projectId}/sections/${item.section_id}/items`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: item.category,
          description: item.description + ' (copy)',
          specification: item.specification,
          unit: item.unit,
          quantity: item.quantity,
          rate: item.rate,
          gst_percent: item.gst_percent,
        }),
      }
    );
    const data = await res.json();
    if (data.item) setItems(prev => [...prev, data.item]);
  }, [projectId]);

  // ── Add section ──────────────────────────────────────────────
  const addSection = async () => {
    if (!newSectionName.trim()) return;
    const res = await fetch(`/api/boq/projects/${projectId}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSectionName.trim() }),
    });
    const data = await res.json();
    if (data.section) {
      setSections(prev => [...prev, { ...data.section, subtotal: 0, item_count: 0 }]);
      setActiveSectionId(data.section.id);
      setNewSectionName('');
      setIsAddingSection(false);
    }
  };

  const deleteSection = async (section: Section) => {
    if (!confirm(`Delete "${section.name}" and all its items?`)) return;
    await fetch(`/api/boq/projects/${projectId}/sections/${section.id}`, { method: 'DELETE' });
    setSections(prev => prev.filter(s => s.id !== section.id));
    setItems(prev => prev.filter(i => i.section_id !== section.id));
    if (activeSectionId === section.id) {
      const remaining = sections.filter(s => s.id !== section.id);
      setActiveSectionId(remaining[0]?.id ?? null);
    }
  };

  const updateStatus = async (status: string) => {
    await fetch(`/api/boq/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setProject(p => p ? { ...p, status } : p);
    toast.success(`Status updated to "${STATUS_CONFIG[status]?.label}"`);
  };

  const updateProjectField = async (field: string, value: unknown) => {
    setProject(p => p ? { ...p, [field]: value } : p);
    await fetch(`/api/boq/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    setEditingProjectField(null);
    toast.success('Project updated');
  };

  if (!project) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const activeSection = sections.find(s => s.id === activeSectionId);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <header className="shrink-0 h-14 border-b border-border flex items-center px-4 gap-3 bg-card">
        <button
          onClick={() => router.push('/boq')}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        <div className="w-px h-5 bg-border" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-foreground truncate">{project.name}</h1>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-xs text-muted-foreground truncate hidden sm:inline">{project.client_name}</span>
          </div>
        </div>

        {/* Status picker */}
        <div className="relative group">
          <button className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CONFIG[project.status]?.color ?? 'text-muted-foreground bg-muted'}`}>
            {STATUS_CONFIG[project.status]?.label ?? project.status}
          </button>
          <div className="absolute right-0 top-full mt-1 w-44 bg-popover border border-border rounded-xl shadow-xl z-50 hidden group-hover:block">
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <button
                key={k}
                onClick={() => updateStatus(k)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors first:rounded-t-xl last:rounded-b-xl ${project.status === k ? 'text-primary font-medium' : 'text-foreground'}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {saving && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
            <span className="hidden sm:inline">Saving</span>
          </div>
        )}

        <button
          onClick={() => setIsSummaryOpen(true)}
          className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          ₹{fmt(totals.grandTotal)}
        </button>

        <a
          href={`/boq/${projectId}/print`}
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/20 rounded-lg text-xs font-medium transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          Print / PDF
        </a>
      </header>

      {/* ── Grand Total Strip ───────────────────────────────────── */}
      <div className="shrink-0 h-10 border-b border-border bg-card/50 flex items-center px-4 gap-4 text-xs">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-mono font-medium text-foreground">₹{fmt(totals.subtotal)}</span>
        <span className="text-border">|</span>
        <span className="text-muted-foreground">GST</span>
        <span className="font-mono font-medium text-foreground">₹{fmt(totals.gstTotal)}</span>
        {totals.markup > 0 && <>
          <span className="text-border">|</span>
          <span className="text-muted-foreground">Markup</span>
          <span className="font-mono font-medium text-foreground">₹{fmt(totals.markup)}</span>
        </>}
        {totals.discount > 0 && <>
          <span className="text-border">|</span>
          <span className="text-muted-foreground">Discount</span>
          <span className="font-mono font-medium text-destructive">-₹{fmt(totals.discount)}</span>
        </>}
        <span className="text-border">|</span>
        <span className="text-muted-foreground font-medium">Grand Total</span>
        <span className="font-mono font-bold text-primary text-sm">₹{fmt(totals.grandTotal)}</span>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Section Sidebar ──────────────────────────────────── */}
        <aside className="w-52 shrink-0 border-r border-border flex flex-col bg-sidebar hidden md:flex">
          <div className="px-3 py-3 border-b border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sections</p>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {sections.map(section => {
              const isActive = section.id === activeSectionId;
              const st = sectionTotals(section.id);
              return (
                <div key={section.id} className="group px-2">
                  <button
                    onClick={() => setActiveSectionId(section.id)}
                    className={`w-full flex items-start gap-2 px-2.5 py-2.5 rounded-xl text-left transition-all mb-0.5 ${
                      isActive
                        ? 'bg-primary/15 border border-primary/20'
                        : 'hover:bg-sidebar-accent'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium leading-tight truncate ${isActive ? 'text-primary' : 'text-sidebar-foreground'}`}>
                        {section.name}
                      </p>
                      <p className={`text-[10px] mt-0.5 font-mono ${isActive ? 'text-primary/70' : 'text-muted-foreground'}`}>
                        ₹{fmt(st)}
                      </p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteSection(section); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </button>
                </div>
              );
            })}

            {/* Add Section */}
            <div className="px-2 mt-2">
              {isAddingSection ? (
                <div className="px-2.5 py-2">
                  <input
                    autoFocus
                    value={newSectionName}
                    onChange={e => setNewSectionName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addSection();
                      if (e.key === 'Escape') { setIsAddingSection(false); setNewSectionName(''); }
                    }}
                    placeholder="Section name..."
                    className="w-full bg-input border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
                  />
                  <SectionPresets onSelect={name => { setNewSectionName(name); }} />
                  <div className="flex gap-1.5 mt-2">
                    <button onClick={addSection} className="flex-1 py-1 text-[10px] bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                      Add
                    </button>
                    <button onClick={() => { setIsAddingSection(false); setNewSectionName(''); }}
                      className="flex-1 py-1 text-[10px] bg-muted text-muted-foreground rounded-lg hover:bg-accent transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingSection(true)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Section
                </button>
              )}
            </div>
          </div>

          {/* Project info */}
          <div className="px-3 py-3 border-t border-border space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Project</p>
            <div className="flex items-center gap-2">
              <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-[10px] text-sidebar-foreground truncate">{project.project_type}</span>
            </div>
            {project.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-[10px] text-sidebar-foreground truncate">{project.location}</span>
              </div>
            )}
            {project.total_area && (
              <div className="flex items-center gap-2">
                <Maximize2 className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-[10px] text-sidebar-foreground">{project.total_area} sqft</span>
              </div>
            )}
          </div>
        </aside>

        {/* ── Items Table ──────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Section header */}
          {activeSection ? (
            <>
              <div className="shrink-0 px-4 py-3 border-b border-border flex items-center gap-3 bg-card/30">
                <h2 className="text-sm font-semibold text-foreground">{activeSection.name}</h2>
                {activeSection.area && (
                  <span className="text-xs text-muted-foreground">{activeSection.area} sqft</span>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => setIsLibraryOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  From Library
                </button>
                <button
                  onClick={() => addItem()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </button>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                {activeItems.length === 0 ? (
                  <EmptySection onAddItem={() => addItem()} onOpenLibrary={() => setIsLibraryOpen(true)} />
                ) : (
                  <table className="w-full text-xs min-w-[900px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-card/95 backdrop-blur border-b border-border">
                        <th className="w-8 px-2 py-2.5 text-left text-muted-foreground font-medium">#</th>
                        <th className="w-32 px-2 py-2.5 text-left text-muted-foreground font-medium">Category</th>
                        <th className="px-2 py-2.5 text-left text-muted-foreground font-medium">Description</th>
                        <th className="w-40 px-2 py-2.5 text-left text-muted-foreground font-medium hidden lg:table-cell">Specification</th>
                        <th className="w-16 px-2 py-2.5 text-left text-muted-foreground font-medium">Unit</th>
                        <th className="w-20 px-2 py-2.5 text-right text-muted-foreground font-medium">Qty</th>
                        <th className="w-24 px-2 py-2.5 text-right text-muted-foreground font-medium">Rate (₹)</th>
                        <th className="w-24 px-2 py-2.5 text-right text-muted-foreground font-medium">Amount</th>
                        <th className="w-16 px-2 py-2.5 text-right text-muted-foreground font-medium">GST%</th>
                        <th className="w-28 px-2 py-2.5 text-right text-muted-foreground font-medium">Total</th>
                        <th className="w-16 px-2 py-2.5" />
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
                      <tr className="bg-card/50 border-t-2 border-border">
                        <td colSpan={7} className="px-3 py-3 text-xs font-semibold text-muted-foreground text-right">
                          Section Subtotal
                        </td>
                        <td className="px-3 py-3 text-xs font-bold text-foreground text-right font-mono">
                          ₹{fmt(activeItems.reduce((s, i) => s + i.quantity * i.rate, 0))}
                        </td>
                        <td />
                        <td className="px-3 py-3 text-sm font-bold text-primary text-right font-mono">
                          ₹{fmt(activeItems.reduce((s, i) => s + i.quantity * i.rate * (1 + i.gst_percent / 100), 0))}
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

        {/* ── Summary Panel (desktop) ──────────────────────────── */}
        <aside className="w-64 shrink-0 border-l border-border bg-sidebar hidden md:flex flex-col overflow-y-auto">
          <ProjectSummary
            project={project}
            sections={sections}
            items={items}
            totals={totals}
            onUpdateProject={updateProjectField}
          />
        </aside>
      </div>

      {/* ── Rate Library Drawer ─────────────────────────────────── */}
      <RateLibraryDrawer
        open={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onAdd={(item) => {
          addItem(item);
          toast.success(`Added: ${item.description}`);
        }}
      />

      {/* ── Mobile Summary Sheet ─────────────────────────────────── */}
      {isSummaryOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsSummaryOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-card rounded-t-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Summary</h3>
              <button onClick={() => setIsSummaryOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="overflow-y-auto flex-1">
              <ProjectSummary
                project={project}
                sections={sections}
                items={items}
                totals={totals}
                onUpdateProject={updateProjectField}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function ItemRow({
  item, index, onSave, onDelete, onDuplicate
}: {
  item: Item;
  index: number;
  onSave: (item: Item, field: keyof Item, value: unknown) => void;
  onDelete: (item: Item) => void;
  onDuplicate: (item: Item) => void;
}) {
  const amount = item.quantity * item.rate;
  const gstAmt = amount * (item.gst_percent / 100);
  const total = amount + gstAmt;

  const catColor = CATEGORY_COLORS[item.category] ?? 'bg-muted text-muted-foreground';

  return (
    <tr className="border-b border-border/60 hover:bg-accent/30 group transition-colors">
      <td className="px-2 py-1.5 text-muted-foreground">{index}</td>

      <td className="px-2 py-1.5">
        <CategorySelect
          value={item.category}
          onChange={v => onSave(item, 'category', v)}
          colorClass={catColor}
        />
      </td>

      <td className="px-2 py-1.5">
        <EditableCell
          value={item.description}
          onChange={v => onSave(item, 'description', v)}
          className="font-medium text-foreground"
          placeholder="Description"
        />
      </td>

      <td className="px-2 py-1.5 hidden lg:table-cell">
        <EditableCell
          value={item.specification ?? ''}
          onChange={v => onSave(item, 'specification', v)}
          className="text-muted-foreground"
          placeholder="Spec..."
        />
      </td>

      <td className="px-2 py-1.5">
        <UnitSelect value={item.unit} onChange={v => onSave(item, 'unit', v)} />
      </td>

      <td className="px-2 py-1.5 text-right">
        <EditableNumber
          value={item.quantity}
          onChange={v => onSave(item, 'quantity', v)}
          decimals={2}
        />
      </td>

      <td className="px-2 py-1.5 text-right">
        <EditableNumber
          value={item.rate}
          onChange={v => onSave(item, 'rate', v)}
          decimals={2}
        />
      </td>

      <td className="px-2 py-1.5 text-right font-mono text-foreground/80">
        {fmt(amount)}
      </td>

      <td className="px-2 py-1.5 text-right">
        <EditableNumber
          value={item.gst_percent}
          onChange={v => onSave(item, 'gst_percent', v)}
          decimals={0}
          suffix="%"
          className="text-muted-foreground"
        />
      </td>

      <td className="px-2 py-1.5 text-right font-mono font-semibold text-foreground">
        {fmt(total)}
      </td>

      <td className="px-2 py-1.5">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDuplicate(item)}
            className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-accent transition-colors"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function EditableCell({
  value, onChange, className = '', placeholder = ''
}: {
  value: string; onChange: (v: string) => void; className?: string; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={e => {
          if (e.key === 'Enter') { onChange(draft); setEditing(false); }
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        className={`w-full bg-input border border-primary/40 rounded px-1.5 py-0.5 outline-none text-xs ${className}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`w-full text-left px-1.5 py-0.5 rounded hover:bg-accent/50 transition-colors text-xs truncate ${className} ${!value ? 'text-muted-foreground/50 italic' : ''}`}
    >
      {value || placeholder}
    </button>
  );
}

function EditableNumber({
  value, onChange, decimals = 2, suffix = '', className = ''
}: {
  value: number; onChange: (v: number) => void; decimals?: number; suffix?: string; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => { setDraft(String(value)); }, [value]);

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => {
          const n = parseFloat(draft) || 0;
          onChange(n);
          setDraft(String(n));
          setEditing(false);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            const n = parseFloat(draft) || 0;
            onChange(n);
            setEditing(false);
          }
          if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); }
        }}
        className="w-full bg-input border border-primary/40 rounded px-1.5 py-0.5 outline-none text-xs text-right font-mono"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`w-full text-right px-1.5 py-0.5 rounded hover:bg-accent/50 transition-colors text-xs font-mono ${className}`}
    >
      {value.toFixed(decimals)}{suffix}
    </button>
  );
}

const CATEGORIES = [
  'Civil Work', 'Flooring', 'Wall & Painting', 'False Ceiling',
  'Electrical', 'Plumbing', 'Modular Kitchen', 'Wardrobes & Storage',
  'Doors & Windows', 'HVAC', 'Furniture', 'Décor & Soft Furnishing',
  'Staircase & Railing', 'External Works', 'Miscellaneous',
];

const UNITS = ['sqft', 'rft', 'nos', 'point', 'lot', 'rmt', 'set', 'kg', 'bag'];

function CategorySelect({ value, onChange, colorClass }: {
  value: string; onChange: (v: string) => void; colorClass: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border-0 outline-none cursor-pointer ${colorClass} bg-opacity-20`}
      style={{ WebkitAppearance: 'none' }}
    >
      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

function UnitSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="text-xs text-foreground bg-transparent border-0 outline-none cursor-pointer hover:text-primary transition-colors"
    >
      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
    </select>
  );
}

const PRESET_NAMES = [
  'Living Room', 'Dining Area', 'Kitchen', 'Master Bedroom', 'Bedroom 2',
  'Bedroom 3', 'Master Bathroom', 'Common Bathroom', 'Balcony', 'Study',
  'Entrance Lobby', 'Staircase', 'Terrace', 'Puja Room', 'Store Room',
];

function SectionPresets({ onSelect }: { onSelect: (n: string) => void }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {PRESET_NAMES.slice(0, 8).map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onSelect(n)}
          className="text-[9px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded hover:bg-primary/20 hover:text-primary transition-colors"
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function EmptySection({ onAddItem, onOpenLibrary }: {
  onAddItem: () => void; onOpenLibrary: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20 px-8">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Plus className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">No items yet</h3>
      <p className="text-xs text-muted-foreground mb-6 max-w-xs">
        Add items manually or browse the rate library with 150+ pre-priced items for the Indian market.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onOpenLibrary}
          className="flex items-center gap-2 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Browse Rate Library
        </button>
        <button
          onClick={onAddItem}
          className="flex items-center gap-2 px-4 py-2 text-xs border border-border text-muted-foreground rounded-xl hover:bg-accent transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Blank Item
        </button>
      </div>
    </div>
  );
}

function NoSections({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20 px-8">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Building2 className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">Add your first section</h3>
      <p className="text-xs text-muted-foreground mb-6 max-w-xs">
        Sections are rooms or areas in your project — Living Room, Bedroom, Kitchen, etc.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add First Section
      </button>
    </div>
  );
}
