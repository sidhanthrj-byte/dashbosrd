'use client';

import { useEffect, useState, useCallback } from 'react';
import { Lead } from '@/lib/db';
import { LeadCard } from './LeadCard';
import { StatsBar } from './StatsBar';
import { STATUS_CONFIG } from '@/lib/next-steps';
import { Search, SlidersHorizontal, X, Download, Plus, Sparkles, Loader2, Phone, PhoneOff, PhoneCall } from 'lucide-react';
import { AddLeadModal } from './AddLeadModal';
import { toast } from 'sonner';

const SORT_OPTIONS = [
  { value: 'priority', label: 'Priority' },
  { value: 'recent',   label: 'Recent' },
  { value: 'followup', label: 'Follow-up' },
  { value: 'name',     label: 'Name A–Z' },
  { value: 'company',  label: 'Company' },
];

type PhoneTab = 'all' | 'has_phone' | 'no_contact';

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
  const [phoneTab, setPhoneTab] = useState<PhoneTab>('all');
  const [statsKey, setStatsKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [generateArea, setGenerateArea] = useState('');
  const [showGeneratePanel, setShowGeneratePanel] = useState(false);
  const [batchLookupRunning, setBatchLookupRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number; found: number } | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (search) params.set('search', search);
      params.set('sort', sort);
      if (phoneTab !== 'all') params.set('phone_filter', phoneTab);
      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.leads)) setLeads(data.leads);
    } catch {
      // network error — keep existing leads visible
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, search, sort, phoneTab]);

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

  function handleLeadReplace(archivedId: number, newLead: Lead | null) {
    setLeads(prev => {
      const filtered = prev.filter(l => l.id !== archivedId);
      return newLead ? [newLead, ...filtered] : filtered;
    });
    setStatsKey(k => k + 1);
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

  async function batchFindPhones() {
    if (batchLookupRunning) return;
    setBatchLookupRunning(true);
    setBatchProgress({ done: 0, total: 0, found: 0 });
    try {
      // Fetch all leads that haven't been looked up yet
      const res = await fetch('/api/leads?phone_filter=not_fetched');
      if (!res.ok) { toast.error('Failed to fetch leads'); return; }
      const data = await res.json();
      const unfetched: Lead[] = Array.isArray(data.leads) ? data.leads : [];
      if (unfetched.length === 0) { toast.info('All leads have already been looked up!'); return; }

      let found = 0;
      setBatchProgress({ done: 0, total: unfetched.length, found: 0 });

      for (let i = 0; i < unfetched.length; i++) {
        const lead = unfetched[i];
        try {
          const lookupRes = await fetch('/api/contact-lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leadId: lead.id,
              linkedinUrl: lead.linkedin_url,
              name: lead.contact_name,
              company: lead.company_name,
              email: lead.email,
            }),
          });
          const lookupData = await lookupRes.json();
          if (lookupRes.ok && (lookupData.phone || lookupData.email)) {
            found++;
            handleLeadUpdate({ ...lead, phone: lookupData.phone || lead.phone, email: lookupData.email || lead.email, phone_fetched: 1 });
          }
        } catch {
          // continue with next lead
        }
        setBatchProgress({ done: i + 1, total: unfetched.length, found });
      }

      toast.success(`Batch lookup done! Found ${found} phone numbers out of ${unfetched.length} leads.`);
    } catch {
      toast.error('Batch lookup failed');
    } finally {
      setBatchLookupRunning(false);
      setBatchProgress(null);
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

  const PHONE_TABS: { id: PhoneTab; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: null },
    { id: 'has_phone', label: 'Has Phone', icon: <Phone className="w-3 h-3" /> },
    { id: 'no_contact', label: 'No Contact', icon: <PhoneOff className="w-3 h-3" /> },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 md:px-5 pt-3 md:pt-5 pb-2 shrink-0 space-y-2.5">
        <StatsBar key={statsKey} onTodayClick={onNavigateToday} />

        {/* Search + actions row */}
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Name, company, area..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 h-9 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm transition-colors shrink-0 ${showFilters ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasFilters && <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-400 translate-x-2 -translate-y-2" />}
          </button>
          <button onClick={() => setShowAddLead(true)}
            className="w-9 h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowGeneratePanel(!showGeneratePanel)}
            disabled={generating}
            className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors flex items-center justify-center shrink-0 disabled:opacity-50">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
          <button
            onClick={batchFindPhones}
            disabled={batchLookupRunning}
            title="Find all phone numbers"
            className="w-9 h-9 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white transition-colors flex items-center justify-center shrink-0 disabled:opacity-50">
            {batchLookupRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
          </button>
          <button onClick={exportCSV} title="Export CSV"
            className="w-9 h-9 rounded-xl border border-border bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0">
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Phone filter tabs */}
        <div className="flex gap-1.5">
          {PHONE_TABS.map(tab => (
            <button key={tab.id} onClick={() => setPhoneTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold border transition-colors
                ${phoneTab === tab.id
                  ? tab.id === 'has_phone' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : tab.id === 'no_contact' ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                    : 'bg-primary/15 border-primary/30 text-primary'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* Generate panel */}
        {showGeneratePanel && !generating && (
          <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl space-y-2.5">
            <p className="text-xs font-semibold text-violet-300">Generate Leads via Apollo</p>
            <input
              type="text"
              placeholder="Filter by area (e.g. Bandra, Koramangala)... or leave blank for whole city"
              value={generateArea}
              onChange={e => setGenerateArea(e.target.value)}
              className="w-full h-8 px-3 bg-secondary border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-400/50"
            />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Count:</span>
                {[10, 15, 25].map(n => (
                  <button key={n} onClick={() => setGenerateCount(n)}
                    className={`w-8 h-7 rounded-lg text-xs font-semibold border transition-colors ${generateCount === n ? 'bg-violet-500 text-white border-violet-400' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}>
                    {n}
                  </button>
                ))}
              </div>
              <button onClick={generateLeads}
                className="ml-auto px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors">
                Fetch {generateCount}{generateArea.trim() ? ` in ${generateArea.trim()}` : ''}
              </button>
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
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Tier</label>
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
              <div className="flex flex-wrap gap-1">
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
          <span className="text-[11px] text-muted-foreground">
            {loading ? 'Loading...' : generating ? 'Fetching from Apollo...' : batchLookupRunning && batchProgress ? `Finding phones... ${batchProgress.done}/${batchProgress.total} (${batchProgress.found} found)` : `${leads.length} lead${leads.length !== 1 ? 's' : ''}${phoneTab === 'no_contact' ? ' without phone' : phoneTab === 'has_phone' ? ' with phone' : ''}`}
          </span>
          {phoneTab === 'no_contact' && leads.length > 0 && !batchLookupRunning && (
            <span className="text-[11px] text-orange-400">Tap &quot;Replace&quot; to swap for a fresh lead</span>
          )}
        </div>
      </div>

      {/* Leads list */}
      <div className="flex-1 overflow-y-auto px-3 md:px-5 pb-4">
        {generating && (
          <div className="flex items-center gap-2 py-3 text-violet-400 text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Searching Apollo for architects...
          </div>
        )}
        {loading && leads.length === 0 ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border h-[72px] animate-pulse" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {phoneTab === 'no_contact' ? (
              <>
                <PhoneOff className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No leads without contact info</p>
                <p className="text-xs mt-1 opacity-60">All your looked-up leads have phone numbers!</p>
              </>
            ) : phoneTab === 'has_phone' ? (
              <>
                <Phone className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No leads with phone numbers yet</p>
                <p className="text-xs mt-1 opacity-60">Use &quot;Find #&quot; on leads to search Apollo for their contact info.</p>
              </>
            ) : (
              <>
                <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No leads found</p>
                <p className="text-xs mt-1 opacity-60">Try searching by name, company, or area like &quot;Bandra&quot;</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="mt-2 text-xs text-primary hover:underline block mx-auto">
                    Clear filters
                  </button>
                )}
                <button onClick={() => setShowGeneratePanel(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold mx-auto transition-colors">
                  <Sparkles className="w-4 h-4" /> Generate Leads from Apollo
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {leads.map(lead => (
              <LeadCard key={lead.id} lead={lead} onUpdate={handleLeadUpdate} onReplace={handleLeadReplace} />
            ))}
          </div>
        )}
      </div>

      <AddLeadModal open={showAddLead} onClose={() => setShowAddLead(false)} onAdded={handleLeadAdded} />
    </div>
  );
}
