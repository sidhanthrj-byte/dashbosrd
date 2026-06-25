'use client';

import { useEffect, useState, useCallback } from 'react';
import { Lead } from '@/lib/db';
import { LeadCard } from './LeadCard';
import { StatsBar } from './StatsBar';
import { STATUS_CONFIG } from '@/lib/next-steps';
import { Search, SlidersHorizontal, X, Download, Plus } from 'lucide-react';
import { AddLeadModal } from './AddLeadModal';

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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sort, setSort] = useState('priority');
  const [statsKey, setStatsKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (search) params.set('search', search);
      params.set('sort', sort);
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
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

  function clearFilters() {
    setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); setSort('priority');
  }

  const hasFilters = search || statusFilter !== 'all' || priorityFilter !== 'all';

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
              placeholder="Search name, company, area..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-10 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 h-10 rounded-xl border text-sm font-medium transition-colors shrink-0 ${showFilters ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
          </button>
          <button
            onClick={() => setShowAddLead(true)}
            className="flex items-center gap-1.5 px-3 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Lead</span>
          </button>
          <button onClick={exportCSV} title="Export CSV"
            className="w-10 h-10 rounded-xl border border-border bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0">
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="p-3 bg-secondary/40 rounded-xl border border-border space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Status</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full h-9 px-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary/50"
                >
                  <option value="all">All Statuses</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="w-full h-9 px-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary/50"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
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
              <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Count row */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {loading ? 'Loading...' : `${leads.length} lead${leads.length !== 1 ? 's' : ''}`}
          </span>
          {!showFilters && (
            <div className="flex gap-1">
              {SORT_OPTIONS.map(o => (
                <button key={o.value} onClick={() => setSort(o.value)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors hidden md:block ${sort === o.value ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leads list */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border h-28 animate-pulse" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No leads found</p>
            <p className="text-xs mt-1 opacity-60">Try searching by name, company, or area like &quot;Bandra&quot;</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-3 text-xs text-primary hover:underline">
                Clear filters
              </button>
            )}
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
