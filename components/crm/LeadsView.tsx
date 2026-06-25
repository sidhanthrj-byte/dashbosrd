'use client';

import { useEffect, useState, useCallback } from 'react';
import { Lead } from '@/lib/db';
import { LeadCard } from './LeadCard';
import { StatsBar } from './StatsBar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_CONFIG } from '@/lib/next-steps';
import { Search, SlidersHorizontal, ArrowUpDown, Download } from 'lucide-react';

const MUMBAI_AREAS = [
  'Bandra', 'Andheri', 'Juhu', 'Powai', 'Lower Parel', 'Worli',
  'South Mumbai', 'Khar', 'Santa Cruz', 'Vile Parle', 'Goregaon',
  'Malad', 'Borivali', 'Ghatkopar', 'Mulund', 'Vikhroli',
  'Navi Mumbai', 'Thane',
];

const SORT_OPTIONS = [
  { value: 'priority', label: 'Priority' },
  { value: 'recent', label: 'Recently Updated' },
  { value: 'followup', label: 'Follow-up Date' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'company', label: 'Company A–Z' },
];

type Props = {
  onNavigateToday?: () => void;
};

export function LeadsView({ onNavigateToday }: Props) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sort, setSort] = useState('priority');
  const [statsKey, setStatsKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (cityFilter !== 'all') params.set('city', cityFilter);
      if (areaFilter !== 'all') params.set('area', areaFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (search) params.set('search', search);
      params.set('sort', sort);
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, cityFilter, areaFilter, priorityFilter, search, sort]);

  useEffect(() => {
    const t = setTimeout(fetchLeads, 250);
    return () => clearTimeout(t);
  }, [fetchLeads]);

  function handleLeadUpdate(updated: Lead) {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    setStatsKey(k => k + 1);
  }

  function exportCSV() {
    const headers = ['Name', 'Company', 'Title', 'City', 'Area', 'Status', 'Phone', 'Email', 'Priority', 'Project Type', 'Deal Value', 'Next Action Date', 'Notes'];
    const rows = leads.map(l => [
      l.contact_name, l.company_name, l.contact_title, l.city, l.area || '',
      l.status, l.phone || '', l.email || '', l.priority, l.project_type || '',
      l.deal_value || '', l.next_action_date || '', (l.notes || '').replace(/,/g, ';'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'pongs-crm-leads.csv'; a.click();
  }

  const isMumbaiFilter = cityFilter.toLowerCase().includes('mumbai') || cityFilter === 'all';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <StatsBar key={statsKey} onTodayClick={onNavigateToday} />

        {/* Search + actions row */}
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search name, company, city, area..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 h-10 rounded-lg border text-sm font-medium transition-colors ${showFilters ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-muted border-border text-muted-foreground hover:text-foreground'}`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
          <button
            onClick={exportCSV}
            title="Export to CSV"
            className="flex items-center gap-2 px-3 h-10 rounded-lg border border-border bg-muted text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3 p-3 bg-secondary/40 rounded-xl border border-border">
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? 'all')}>
              <SelectTrigger className="bg-card border-border text-sm h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={v => setCityFilter(v ?? 'all')}>
              <SelectTrigger className="bg-card border-border text-sm h-9">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Cities</SelectItem>
                {['Mumbai', 'New Delhi', 'Bangalore', 'Pune', 'Noida', 'Ahmedabad', 'Hyderabad', 'Chennai', 'Chandigarh', 'Jaipur'].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isMumbaiFilter && (
              <Select value={areaFilter} onValueChange={v => setAreaFilter(v ?? 'all')}>
                <SelectTrigger className="bg-card border-border text-sm h-9">
                  <SelectValue placeholder="All Mumbai Areas" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-60">
                  <SelectItem value="all">All Mumbai Areas</SelectItem>
                  {MUMBAI_AREAS.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={priorityFilter} onValueChange={v => setPriorityFilter(v ?? 'all')}>
              <SelectTrigger className="bg-card border-border text-sm h-9">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">🔴 High</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="low">⚪ Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Sort + count row */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {loading ? 'Loading...' : `${leads.length} lead${leads.length !== 1 ? 's' : ''}`}
          </span>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            <Select value={sort} onValueChange={v => setSort(v ?? 'priority')}>
              <SelectTrigger className="bg-muted border-border text-xs h-8 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {SORT_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Leads list */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border h-28 animate-pulse" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No leads match your filters</p>
            <button onClick={() => { setSearch(''); setStatusFilter('all'); setCityFilter('all'); setAreaFilter('all'); setPriorityFilter('all'); }}
              className="mt-3 text-xs text-primary hover:underline">
              Clear all filters
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
    </div>
  );
}
