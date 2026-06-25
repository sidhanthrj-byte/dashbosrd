'use client';

import { useEffect, useState, useCallback } from 'react';
import { Lead } from '@/lib/db';
import { LeadCard } from './LeadCard';
import { StatsBar } from './StatsBar';
import { STATUS_CONFIG } from '@/lib/next-steps';
import { Search, SlidersHorizontal, X, Download, Plus, Sparkles, Loader2 } from 'lucide-react';
import { AddLeadModal } from './AddLeadModal';
import { toast } from 'sonner';

const SORT_OPTIONS = [
  { value: 'priority', label: 'Priority' },
  { value: 'recent',   label: 'Recent' },
  { value: 'followup', label: 'Follow-up' },
  { value: 'name',     label: 'Name A–Z' },
  { value: 'company',  label: 'Company' },
];

type Props = {
  onNavigateToday?: () => void;
};

export function LeadsView({ onNavigateToday }: Props) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sort, setSort] = useState('priority');
  const [statsKey, setStatsKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [generateArea, setGenerateArea] = useState('');
  const [showGeneratePanel, setShowGeneratePanel] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (search) params.set('search', search);
      params.set('sort', sort);
      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) return; // keep existing leads on error
      const data = await res.json();
      if (Array.isArray(data.leads)) setLeads(data.leads);
    } catch {
      // network error — keep existing leads visible
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, search, sort]);

  useEffect(() => {
    const t = setTimeout(fetchLeads, 250);
    return () => clearTimeout(t);
  }, [fetchLeads]);

  function handleLeadUpdate(updated: Lead) {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    setStatsKey(k => k + 1);
  }

  function handleLeadAdded(lead: Lead) {
    setLeads(prev => [lead, ...prev]);
    setStatsKey(k => k + 1);
    setShowAddLead(false);
  }

  async function generateLeads() {
    setGenerating(true);
    setShowGeneratePanel(false);
    try {
      const res = await fetch('/api/leads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: generateCount, page: Math.floor(Math.random() * 5) + 1, area: generateArea.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to generate leads'); return; }
      if (data.added > 0) {
        toast.success(`${data.added} new architect leads added from Apollo!`);
        setLeads(prev => [...data.leads, ...prev]);
        setStatsKey(k => k + 1);
      } else {
        toast.info(data.message || 'No new leads found right now, try again later.');
      }
    } catch {
      toast.error('Failed to generate leads');
    } finally {
      setGenerating(false);
    }
  }

  function clearFilters() {
    setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); setSort('priority');
  }

  function exportCSV() {
    const headers = ['Name', 'Company', 'Title', 'City', 'Area', 'Status', 'Phone', 'Email', 'Priority', 'Project Type', 'Deal Value', 'Next Action Date', 'Notes'];
    const rows = leads.map(l => [
      l.contact_name, l.company_name, l.contact_title, l.city, l.area || '',
      l.status, l.phone || '', l.email || '', l.priority, l.project_type || '',
      l.deal_value || '', l.next_action_date || '', (l.notes || '').replace(/,/g, ';'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'pongs-crm-leads.csv';
    a.click();
  }

  const hasFilters = !!(search || statusFilter !== 'all' || priorityFilter !== 'all');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-3 shrink-0 space-y-3">
        <StatsBar key={statsKey} onTodayClick={onNavigateToday} />

        {/* Search row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Search name, company, area (e.g. Bandra)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 h-10 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 h-10 rounded-xl border text-sm font-medium transition-colors shrink-0 ${showFilters ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
          </button>
          <button
            onClick={() => setShowAddLead(true)}
            className="flex items-center gap-1 px-3 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline ml-0.5">Add</span>
          </button>
          <button
            onClick={() => setShowGeneratePanel(!showGeneratePanel)}
            disabled={generating}
            className="flex items-center gap-1 px-3 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shrink-0 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="hidden sm:inline ml-0.5">Generate</span>
          </button>
          <button onClick={exportCSV} title="Export CSV"
            className="w-10 h-10 rounded-xl border border-border bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0">
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Generate panel */}
        {showGeneratePanel && !generating && (
          <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
            <p className="text-sm font-medium text-violet-300 mb-1">Generate Leads via Apollo</p>
            <p className="text-xs text-muted-foreground mb-3">
              Fetches real architects from Apollo&apos;s database — with names, companies, emails, and phones where available.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Filter by Area (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Bandra, Koramangala, Adyar..."
                  value={generateArea}
                  onChange={e => setGenerateArea(e.target.value)}
                  className="w-full h-9 px-3 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-400/50"
                />
                <p className="text-[10px] text-muted-foreground/60 mt-1">Leave blank to search your whole city</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">How many?</span>
                  {[10, 15, 25].map(n => (
                    <button key={n} onClick={() => setGenerateCount(n)}
                      className={`w-9 h-8 rounded-lg text-xs font-semibold border transition-colors ${generateCount === n ? 'bg-violet-500 text-white border-violet-400' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}>
                      {n}
                    </button>
                  ))}
                </div>
                <button onClick={generateLeads}
                  className="ml-auto px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">
                  Fetch {generateCount} Leads{generateArea.trim() ? ` in ${generateArea.trim()}` : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter panel */}
        {showFilters && (
          <div className="p-3 bg-secondary/40 rounded-xl border border-border space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Status</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="w-full h-9 px-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none">
                  <option value="all">All Statuses</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Priority / Tier</label>
                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                  className="w-full h-9 px-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none">
                  <option value="all">All</option>
                  <option value="high">Tier 1 (High)</option>
                  <option value="medium">Tier 2 (Medium)</option>
                  <option value="low">Tier 3 (Low)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Sort by</label>
              <div className="flex flex-wrap gap-1.5">
                {SORT_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setSort(o.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${sort === o.value ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear all</button>
            )}
          </div>
        )}

        {/* Count row */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {loading ? 'Loading...' : generating ? 'Fetching from Apollo...' : `${leads.length} lead${leads.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Leads list */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
        {generating && (
          <div className="flex items-center gap-2 py-4 text-violet-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Searching Apollo for architects in your city...
          </div>
        )}
        {loading && leads.length === 0 ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border h-28 animate-pulse" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No leads found</p>
            <p className="text-xs mt-1 opacity-60">Try searching by name, company, or area like &quot;Bandra&quot; or &quot;Koramangala&quot;</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-3 text-xs text-primary hover:underline block mx-auto">
                Clear filters
              </button>
            )}
            <button onClick={() => setShowGeneratePanel(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold mx-auto transition-colors">
              <Sparkles className="w-4 h-4" /> Generate Leads from Apollo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map(lead => (
              <LeadCard key={lead.id} lead={lead} onUpdate={handleLeadUpdate} />
            ))}
          </div>
        )}
      </div>

      <AddLeadModal open={showAddLead} onClose={() => setShowAddLead(false)} onAdded={handleLeadAdded} />
    </div>
  );
}
