'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, User, MapPin, Layers, FileText, Trash2,
  TrendingUp, Clock, CheckCircle2, LogOut, Search,
  Grid3X3, List, SortAsc, ChevronDown, MoreHorizontal,
  Building2, Calendar, IndianRupee, Maximize2, FolderOpen
} from 'lucide-react';
import { NewProjectModal } from './NewProjectModal';
import { toast } from 'sonner';

type Project = {
  id: number; name: string; client_name: string; client_phone: string;
  project_type: string; location: string; total_area: number;
  status: string; markup_percent: number; section_count: number;
  subtotal: number; created_at: string; updated_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; pill: string; text: string }> = {
  draft:    { label: 'Draft',       dot: '#64748b', pill: 'oklch(0.12 0.012 265)',    text: 'oklch(0.60 0.018 265)' },
  sent:     { label: 'Sent',        dot: '#60a5fa', pill: 'oklch(0.15 0.06 240)',     text: '#60a5fa' },
  approved: { label: 'Approved',    dot: '#34d399', pill: 'oklch(0.15 0.06 160)',     text: '#34d399' },
  revision: { label: 'In Revision', dot: '#fbbf24', pill: 'oklch(0.16 0.06 80)',      text: '#fbbf24' },
};

type SortOption = 'newest' | 'oldest' | 'value_desc' | 'value_asc' | 'name_asc';
type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | string;

function fmtVal(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)} K`;
  return `₹${Math.round(n)}`;
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function projectTotal(p: Project) {
  return p.subtotal * (1 + (p.markup_percent ?? 0) / 100);
}

export function ProjectsList() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; firm_name?: string } | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [view, setView] = useState<ViewMode>('grid');
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) router.push('/login');
      else setUser(d.user);
    });
    loadProjects();
  }, [router]);

  const loadProjects = async () => {
    setLoading(true);
    const res = await fetch('/api/boq/projects');
    if (res.ok) { const data = await res.json(); setProjects(data.projects ?? []); }
    setLoading(false);
  };

  const deleteProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    await fetch(`/api/boq/projects/${project.id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== project.id));
    toast.success('Project deleted');
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const filtered = useMemo(() => {
    let list = [...projects];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.client_name.toLowerCase().includes(q) ||
        (p.location ?? '').toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') list = list.filter(p => p.status === filterStatus);
    switch (sort) {
      case 'newest': list.sort((a, b) => b.updated_at.localeCompare(a.updated_at)); break;
      case 'oldest': list.sort((a, b) => a.updated_at.localeCompare(b.updated_at)); break;
      case 'value_desc': list.sort((a, b) => projectTotal(b) - projectTotal(a)); break;
      case 'value_asc': list.sort((a, b) => projectTotal(a) - projectTotal(b)); break;
      case 'name_asc': list.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return list;
  }, [projects, search, filterStatus, sort]);

  const stats = {
    total: projects.length,
    active: projects.filter(p => ['draft', 'sent', 'revision'].includes(p.status)).length,
    approved: projects.filter(p => p.status === 'approved').length,
    totalValue: projects.reduce((s, p) => s + projectTotal(p), 0),
  };

  const SORT_LABELS: Record<SortOption, string> = {
    newest: 'Last updated', oldest: 'Oldest first',
    value_desc: 'Highest value', value_asc: 'Lowest value', name_asc: 'A → Z',
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b"
        style={{ background: 'oklch(0.075 0.012 265 / 0.92)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
              style={{ background: 'oklch(0.70 0.22 268)' }}>B</div>
            <div>
              <p className="text-[13px] font-bold leading-none" style={{ color: 'var(--foreground)' }}>BOQwise</p>
              <p className="text-[9px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>for Architects</p>
            </div>
          </div>

          <div className="flex-1" />

          {user && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{user.name}</p>
                {user.firm_name && <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{user.firm_name}</p>}
              </div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ background: 'oklch(0.70 0.22 268 / 0.3)', border: '1px solid oklch(0.70 0.22 268 / 0.4)' }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
            </div>
          )}

          <button onClick={logout}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors hover:bg-accent"
            style={{ color: 'var(--muted-foreground)' }}>
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Title row ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Projects</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''} · {fmtVal(stats.totalValue)} total
            </p>
          </div>
          <button
            onClick={() => setIsNewOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'oklch(0.70 0.22 268)' }}>
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* ── Stats ───────────────────────────────────────────────── */}
        {projects.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total', value: stats.total, icon: <Layers className="w-3.5 h-3.5" />, color: 'var(--foreground)' },
              { label: 'Active', value: stats.active, icon: <Clock className="w-3.5 h-3.5" />, color: '#60a5fa' },
              { label: 'Approved', value: stats.approved, icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: '#34d399' },
              { label: 'Total Value', value: fmtVal(stats.totalValue), icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'oklch(0.70 0.22 268)' },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-4 py-3 border"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: s.color }}>
                  {s.icon}
                  <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{s.label}</span>
                </div>
                <p className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Toolbar ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects, clients, locations..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border transition-colors outline-none"
              style={{
                background: 'var(--input)', borderColor: 'var(--border)',
                color: 'var(--foreground)',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'oklch(0.70 0.22 268 / 0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Status filter */}
            <div className="flex gap-1 p-1 rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              {(['all', 'draft', 'sent', 'approved', 'revision'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
                  style={filterStatus === s
                    ? { background: 'oklch(0.70 0.22 268)', color: 'white' }
                    : { color: 'var(--muted-foreground)' }}>
                  {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label ?? s}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-colors"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                <SortAsc className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-xl shadow-xl z-20 border overflow-hidden"
                    style={{ background: 'var(--popover)', borderColor: 'var(--border)' }}>
                    {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([k, v]) => (
                      <button key={k} onClick={() => { setSort(k); setSortOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-accent"
                        style={{ color: sort === k ? 'oklch(0.70 0.22 268)' : 'var(--foreground)', fontWeight: sort === k ? 600 : 400 }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* View toggle */}
            <div className="flex p-1 rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              {(['grid', 'list'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className="p-1.5 rounded-md transition-all"
                  style={view === v ? { background: 'oklch(0.70 0.22 268)', color: 'white' } : { color: 'var(--muted-foreground)' }}>
                  {v === 'grid' ? <Grid3X3 className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'oklch(0.70 0.22 268)', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          projects.length === 0
            ? <EmptyState onNew={() => setIsNewOpen(true)} />
            : <NoResults onClear={() => { setSearch(''); setFilterStatus('all'); }} />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={() => router.push(`/boq/${p.id}`)}
                onDelete={e => deleteProject(p, e)}
              />
            ))}
          </div>
        ) : (
          <ListView projects={filtered} onOpen={id => router.push(`/boq/${id}`)} onDelete={deleteProject} />
        )}
      </div>

      {isNewOpen && (
        <NewProjectModal
          onClose={() => setIsNewOpen(false)}
          onCreate={proj => { setIsNewOpen(false); router.push(`/boq/${proj.id}`); }}
        />
      )}
    </div>
  );
}

function ProjectCard({ project, onOpen, onDelete }: {
  project: Project; onOpen: () => void; onDelete: (e: React.MouseEvent) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.draft;
  const total = projectTotal(project);

  return (
    <div onClick={onOpen}
      className="relative rounded-xl border cursor-pointer group transition-all duration-200"
      style={{
        background: 'var(--card)', borderColor: 'var(--border)',
        padding: '1.125rem',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'oklch(0.70 0.22 268 / 0.4)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}>

      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: status.pill, color: status.text }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
          {status.label}
        </span>
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={e => { e.stopPropagation(); setMenuOpen(false); }} />
              <div className="absolute right-0 top-full mt-1 w-36 rounded-xl shadow-xl z-20 border overflow-hidden"
                style={{ background: 'var(--popover)', borderColor: 'var(--border)' }}>
                <button
                  onClick={e => { onDelete(e); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-destructive/10"
                  style={{ color: 'var(--destructive)' }}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete project
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Name */}
      <h3 className="font-semibold text-sm leading-tight mb-1 transition-colors"
        style={{ color: 'var(--foreground)' }}
        onMouseEnter={e => (e.currentTarget as HTMLHeadingElement).style.color = 'oklch(0.70 0.22 268)'}
        onMouseLeave={e => (e.currentTarget as HTMLHeadingElement).style.color = 'var(--foreground)'}>
        {project.name}
      </h3>
      <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
        <User className="w-3 h-3 shrink-0" />
        <span className="truncate">{project.client_name}</span>
      </p>

      {/* Meta tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
          {project.project_type.split(' ').slice(0, 2).join(' ')}
        </span>
        {project.location && (
          <span className="text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1"
            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
            <MapPin className="w-2.5 h-2.5" />{project.location}
          </span>
        )}
        {project.total_area > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-md"
            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
            {project.total_area} sqft
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-3 flex items-end justify-between" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="text-[10px] mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Estimate</p>
          <p className="text-base font-bold font-mono" style={{ color: 'oklch(0.70 0.22 268)' }}>{fmtVal(total)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
            {project.section_count} section{project.section_count !== 1 ? 's' : ''}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
            {fmtDate(project.updated_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ListView({ projects, onOpen, onDelete }: {
  projects: Project[];
  onOpen: (id: number) => void;
  onDelete: (p: Project, e: React.MouseEvent) => void;
}) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      {/* Table header */}
      <div className="grid grid-cols-[1fr_140px_100px_110px_80px] gap-4 px-4 py-2.5 border-b text-[10px] font-semibold uppercase tracking-wider"
        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--muted)' }}>
        <span>Project</span>
        <span>Type</span>
        <span className="text-right">Estimate</span>
        <span className="text-right">Updated</span>
        <span className="text-right">Status</span>
      </div>

      {projects.map((p, i) => {
        const status = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.draft;
        const total = projectTotal(p);
        return (
          <div key={p.id}
            onClick={() => onOpen(p.id)}
            className="grid grid-cols-[1fr_140px_100px_110px_80px] gap-4 px-4 py-3 border-b cursor-pointer transition-colors group items-center"
            style={{ borderColor: i < projects.length - 1 ? 'var(--border)' : 'transparent' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--accent)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{p.name}</p>
              <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                <User className="w-3 h-3" />{p.client_name}
                {p.location && <><span className="opacity-40">·</span><MapPin className="w-3 h-3" />{p.location}</>}
              </p>
            </div>
            <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
              {p.project_type.split(' ').slice(0, 2).join(' ')}
            </span>
            <span className="text-sm font-bold font-mono text-right" style={{ color: 'oklch(0.70 0.22 268)' }}>
              {fmtVal(total)}
            </span>
            <span className="text-xs text-right" style={{ color: 'var(--muted-foreground)' }}>
              {fmtDate(p.updated_at)}
            </span>
            <div className="flex justify-end items-center gap-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: status.pill, color: status.text }}>
                {status.label}
              </span>
              <button onClick={e => onDelete(p, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                style={{ color: 'var(--muted-foreground)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'oklch(0.70 0.22 268 / 0.1)', border: '1px solid oklch(0.70 0.22 268 / 0.2)' }}>
        <FolderOpen className="w-8 h-8" style={{ color: 'oklch(0.70 0.22 268)' }} />
      </div>
      <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>No projects yet</h2>
      <p className="text-sm mb-8 max-w-md" style={{ color: 'var(--muted-foreground)' }}>
        Create your first BOQ project. Add rooms, pick items from the rate library with 150+ pre-priced Indian market rates, and get a professional estimate in minutes.
      </p>
      <button onClick={onNew}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: 'oklch(0.70 0.22 268)' }}>
        <Plus className="w-4 h-4" /> Create First Project
      </button>
    </div>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Search className="w-10 h-10 mb-4" style={{ color: 'var(--muted-foreground)', opacity: 0.3 }} />
      <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>No projects found</h3>
      <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>Try a different search term or clear the filters</p>
      <button onClick={onClear}
        className="text-sm font-medium px-4 py-2 rounded-lg border transition-colors"
        style={{ color: 'oklch(0.70 0.22 268)', borderColor: 'oklch(0.70 0.22 268 / 0.3)', background: 'oklch(0.70 0.22 268 / 0.08)' }}>
        Clear filters
      </button>
    </div>
  );
}
