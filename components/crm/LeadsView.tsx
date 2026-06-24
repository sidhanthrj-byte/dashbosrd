'use client';

import { useEffect, useState, useCallback } from 'react';
import { Lead } from '@/lib/db';
import { LeadCard } from './LeadCard';
import { StatsBar } from './StatsBar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_CONFIG } from '@/lib/next-steps';
import { Search, RefreshCw, Filter } from 'lucide-react';

export function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statsKey, setStatsKey] = useState(0);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchLeads, 300);
    return () => clearTimeout(t);
  }, [fetchLeads]);

  function handleLeadUpdate(updated: Lead) {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    setStatsKey(k => k + 1);
  }

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label })),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Pongs <span className="text-blue-600">CRM</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Stretch Ceiling · Architect Leads</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLeads} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats */}
        <StatsBar key={statsKey} />

        {/* Filters */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, company, city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <div className="w-48">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
              <SelectTrigger className="bg-white">
                <Filter className="w-3.5 h-3.5 mr-2 text-gray-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Leads */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-28 animate-pulse" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No leads found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map(lead => (
              <LeadCard key={lead.id} lead={lead} onUpdate={handleLeadUpdate} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
