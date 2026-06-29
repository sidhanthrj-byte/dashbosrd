'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Building2, User, MapPin, Calendar, Layers,
  FileText, ChevronRight, MoreHorizontal, Trash2, Copy,
  TrendingUp, Clock, CheckCircle2, Edit, LogOut
} from 'lucide-react';
import { NewProjectModal } from './NewProjectModal';
import { toast } from 'sonner';

type Project = {
  id: number; name: string; client_name: string; client_phone: string;
  project_type: string; location: string; total_area: number;
  status: string; markup_percent: number; section_count: number;
  subtotal: number; created_at: string; updated_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; dotColor: string; bg: string; text: string }> = {
  draft: { label: 'Draft', dotColor: 'bg-muted-foreground', bg: 'bg-muted/80', text: 'text-muted-foreground' },
  sent: { label: 'Sent', dotColor: 'bg-blue-400', bg: 'bg-blue-500/15', text: 'text-blue-400' },
  approved: { label: 'Approved', dotColor: 'bg-emerald-400', bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  revision: { label: 'Revision', dotColor: 'bg-amber-400', bg: 'bg-amber-500/15', text: 'text-amber-400' },
};

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)} K`;
  return `₹${n}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function ProjectsList() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);

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
    if (res.ok) {
      const data = await res.json();
      setProjects(data.projects ?? []);
    }
    setLoading(false);
  };

  const deleteProject = async (project: Project) => {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    await fetch(`/api/boq/projects/${project.id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== project.id));
    toast.success('Project deleted');
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const stats = {
    total: projects.length,
    approved: projects.filter(p => p.status === 'approved').length,
    totalValue: projects.reduce((s, p) => {
      const markup = p.subtotal * (p.markup_percent / 100);
      return s + p.subtotal + markup;
    }, 0),
    active: projects.filter(p => ['draft', 'sent', 'revision'].includes(p.status)).length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ─ */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
              <FileText className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-none">BOQwise</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">for Architects & Designers</p>
            </div>
          </div>

          <div className="flex-1" />

          {user && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium text-foreground">{user.name}</p>
              </div>
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-primary font-bold text-[10px]">{user.name?.[0]?.toUpperCase()}</span>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Page title + new button ─ */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your BOQs for all active projects</p>
          </div>
          <button
            onClick={() => setIsNewOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* ── Stats strip ─ */}
        {projects.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Total Projects', value: stats.total, icon: <Layers className="w-4 h-4" />, color: 'text-foreground' },
              { label: 'Active', value: stats.active, icon: <Clock className="w-4 h-4" />, color: 'text-blue-400' },
              { label: 'Approved', value: stats.approved, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-400' },
              { label: 'Total Value', value: fmt(stats.totalValue), icon: <TrendingUp className="w-4 h-4" />, color: 'text-primary' },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className={`flex items-center gap-2 ${stat.color} mb-1`}>
                  {stat.icon}
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                </div>
                <p className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Projects grid ─ */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState onNew={() => setIsNewOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => router.push(`/boq/${project.id}`)}
                onDelete={() => deleteProject(project)}
              />
            ))}
          </div>
        )}
      </div>

      {isNewOpen && (
        <NewProjectModal
          onClose={() => setIsNewOpen(false)}
          onCreate={(project) => {
            setIsNewOpen(false);
            router.push(`/boq/${project.id}`);
          }}
        />
      )}
    </div>
  );
}

function ProjectCard({ project, onOpen, onDelete }: {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.draft;
  const totalWithMarkup = project.subtotal * (1 + (project.markup_percent ?? 0) / 100);

  return (
    <div
      onClick={onOpen}
      className="relative bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group"
    >
      {/* Status */}
      <div className="flex items-center justify-between mb-4">
        <span className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
          {status.label}
        </span>
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={e => { e.stopPropagation(); setMenuOpen(false); }} />
              <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                <button
                  onClick={e => { e.stopPropagation(); onDelete(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Project name */}
      <h3 className="font-bold text-foreground text-base leading-tight mb-1 group-hover:text-primary transition-colors">
        {project.name}
      </h3>

      {/* Client */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
        <User className="w-3 h-3 shrink-0" />
        <span className="truncate">{project.client_name}</span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <Building2 className="w-3 h-3 shrink-0" />
          {project.project_type}
        </span>
        {project.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {project.location}
          </span>
        )}
        {project.total_area && (
          <span>{project.total_area} sqft</span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border pt-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground">Estimated Value</p>
          <p className="text-lg font-black text-primary font-mono">{fmt(totalWithMarkup)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">{project.section_count} section{project.section_count !== 1 ? 's' : ''}</p>
          <p className="text-[10px] text-muted-foreground">{timeAgo(project.updated_at)}</p>
        </div>
      </div>

      <ChevronRight className="absolute right-4 bottom-4 w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-6">
        <FileText className="w-10 h-10 text-muted-foreground/40" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">No projects yet</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-md">
        Create your first BOQ project. Add rooms, pick items from the rate library, and get a professional cost estimate in minutes.
      </p>
      <button
        onClick={onNew}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
      >
        <Plus className="w-4 h-4" />
        Create First Project
      </button>
    </div>
  );
}
