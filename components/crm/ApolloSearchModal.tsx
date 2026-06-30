'use client';

import { useState } from 'react';
import { X, Search, UserPlus, Phone, Mail, ExternalLink, Building2, Loader2, ChevronRight } from 'lucide-react';
import { Lead } from '@/lib/db';
import { toast } from 'sonner';

interface ApolloPersonResult {
  id: string;
  name: string;
  title: string;
  email: string | null;
  phone: string | null;
  has_direct_phone: string;
  linkedin_url: string | null;
  organization: {
    name: string;
    website_url: string | null;
    primary_phone: string | null;
  };
  city: string;
  state: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onLeadAdded: (lead: Lead) => void;
}

export function ApolloSearchModal({ open, onClose, onLeadAdded }: Props) {
  const [keywords, setKeywords] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [results, setResults] = useState<ApolloPersonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  async function doSearch(p = 1) {
    if (!keywords && !company && !title && !linkedinUrl) {
      toast.error('Enter at least one search term');
      return;
    }
    setLoading(true);
    setSearched(true);
    if (p === 1) setResults([]);
    try {
      const res = await fetch('/api/leads/search-apollo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: keywords.trim() || undefined, company: company.trim() || undefined, title: title.trim() || undefined, linkedinUrl: linkedinUrl.trim() || undefined, page: p }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Search failed'); return; }
      if (p === 1) {
        setResults(data.people || []);
      } else {
        setResults(prev => [...prev, ...(data.people || [])]);
      }
      setTotal(data.total || 0);
      setPage(p);
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }

  async function addLead(person: ApolloPersonResult) {
    if (addingIds.has(person.id) || addedIds.has(person.id)) return;
    setAddingIds(prev => new Set(prev).add(person.id));
    try {
      const res = await fetch('/api/leads/search-apollo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addPerson: person }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to add lead'); return; }
      setAddedIds(prev => new Set(prev).add(person.id));
      onLeadAdded(data.lead);
      toast.success(`${person.name} added as lead!`);
    } catch {
      toast.error('Failed to add lead');
    } finally {
      setAddingIds(prev => { const s = new Set(prev); s.delete(person.id); return s; });
    }
  }

  function handleClose() {
    setKeywords(''); setCompany(''); setTitle(''); setLinkedinUrl('');
    setResults([]); setSearched(false); setAddedIds(new Set());
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full sm:max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border shrink-0">
          <div>
            <h2 className="font-semibold text-foreground">Search Apollo</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Find architects & designers by name, company, or title</p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search form */}
        <div className="px-4 py-3 space-y-2 shrink-0 border-b border-border">
          <input
            type="text"
            placeholder="Name or keywords (e.g. Rahul Mehta, Bandra architect)"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch(1)}
            className="w-full h-9 px-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Company / firm name"
              value={company}
              onChange={e => setCompany(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch(1)}
              className="h-9 px-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
            <input
              type="text"
              placeholder="Title (e.g. Architect)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch(1)}
              className="h-9 px-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <input
            type="text"
            placeholder="LinkedIn URL (most accurate)"
            value={linkedinUrl}
            onChange={e => setLinkedinUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch(1)}
            className="w-full h-9 px-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
          <button
            onClick={() => doSearch(1)}
            disabled={loading}
            className="w-full h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Searching Apollo...' : 'Search'}
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {!searched && !loading && (
            <div className="py-10 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Search Apollo&apos;s database of 275M+ contacts</p>
              <p className="text-xs mt-1 opacity-60">Same data as Apollo.io — but right here</p>
            </div>
          )}

          {searched && !loading && results.length === 0 && (
            <div className="py-10 text-center text-muted-foreground">
              <p className="text-sm">No results found</p>
              <p className="text-xs mt-1 opacity-60">Try different keywords or a broader search</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="divide-y divide-border">
              {total > 0 && (
                <div className="px-4 py-2 text-[11px] text-muted-foreground bg-secondary/30">
                  {total.toLocaleString()} results found
                </div>
              )}
              {results.map(person => (
                <div key={person.id} className="px-4 py-3 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm shrink-0 mt-0.5">
                      {(person.name || 'U')[0].toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{person.name || '—'}</p>
                        {person.has_direct_phone === 'Yes' && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold">HAS #</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{person.title}</p>
                      {person.organization?.name && (
                        <div className="flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                          <p className="text-xs text-muted-foreground truncate">{person.organization.name}</p>
                        </div>
                      )}
                      {/* Contact details */}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                        {person.phone && (
                          <a href={`tel:${person.phone}`} className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300">
                            <Phone className="w-3 h-3" />{person.phone}
                          </a>
                        )}
                        {!person.phone && person.organization?.primary_phone && (
                          <a href={`tel:${person.organization.primary_phone}`} className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300">
                            <Phone className="w-3 h-3" />{person.organization.primary_phone}
                          </a>
                        )}
                        {person.email && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Mail className="w-3 h-3" />{person.email}
                          </span>
                        )}
                        {person.linkedin_url && (
                          <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300">
                            <ExternalLink className="w-3 h-3" />LinkedIn
                          </a>
                        )}
                        {person.city && (
                          <span className="text-[11px] text-muted-foreground/60">{person.city}</span>
                        )}
                      </div>
                    </div>

                    {/* Add button */}
                    <button
                      onClick={() => addLead(person)}
                      disabled={addingIds.has(person.id) || addedIds.has(person.id)}
                      className={`shrink-0 h-8 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        addedIds.has(person.id)
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground'
                      } disabled:opacity-50`}
                    >
                      {addingIds.has(person.id) ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : addedIds.has(person.id) ? (
                        'Added'
                      ) : (
                        <><UserPlus className="w-3.5 h-3.5" />Add</>
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {/* Load more */}
              {results.length < total && (
                <div className="px-4 py-3">
                  <button
                    onClick={() => doSearch(page + 1)}
                    disabled={loading}
                    className="w-full h-9 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ChevronRight className="w-4 h-4" />Load more</>}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
