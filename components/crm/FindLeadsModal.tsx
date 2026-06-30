'use client';

import { useState, useCallback } from 'react';
import { X, Search, Plus, CheckCircle2, Phone, Loader2, ChevronRight, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { Lead } from '@/lib/db';
import { toast } from 'sonner';

interface ApolloResult {
  id: string;
  name: string;
  first_name?: string;
  title: string;
  phone: string | null;
  email: string | null;
  has_direct_phone: string;
  linkedin_url: string | null;
  organization: { name: string; website_url: string | null; primary_phone: string | null };
  city: string;
  state: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onLeadsAdded: (leads: Lead[]) => void;
}

const AREA_SUGGESTIONS: Record<string, string[]> = {
  Mumbai:    ['Bandra', 'Juhu', 'Khar', 'Andheri', 'Lower Parel', 'Worli', 'Powai', 'Goregaon', 'Malad', 'Navi Mumbai'],
  Bangalore: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar', 'BTM Layout', 'Yelahanka'],
  Chennai:   ['Adyar', 'Anna Nagar', 'OMR', 'Velachery', 'T Nagar', 'Nungambakkam'],
  Pune:      ['Koregaon Park', 'Baner', 'Kothrud', 'Viman Nagar', 'Hinjawadi', 'Wakad'],
  Hyderabad: ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Madhapur', 'Kondapur', 'Hitech City'],
};

export function FindLeadsModal({ open, onClose, onLeadsAdded }: Props) {
  const [tab, setTab] = useState<'browse' | 'search'>('browse');

  // Browse state
  const [area, setArea] = useState('');
  const [browseResults, setBrowseResults] = useState<ApolloResult[]>([]);
  const [browsePage, setBrowsePage] = useState(1);
  const [browseTotal, setBrowseTotal] = useState(0);
  const [browsing, setBrowsing] = useState(false);
  const [hasBrowsed, setHasBrowsed] = useState(false);

  // Search state
  const [keywords, setKeywords] = useState('');
  const [company, setCompany] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [searchResults, setSearchResults] = useState<ApolloResult[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Adding
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addingAll, setAddingAll] = useState(false);
  const [cityAreas, setCityAreas] = useState<string[]>([]);

  // Fetch city areas on mount
  useState(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      const city = d.user?.city || 'Mumbai';
      setCityAreas(AREA_SUGGESTIONS[city] || AREA_SUGGESTIONS.Mumbai);
    }).catch(() => setCityAreas(AREA_SUGGESTIONS.Mumbai));
  });

  const browse = useCallback(async (p = 1, areaFilter = area) => {
    setBrowsing(true);
    setHasBrowsed(true);
    if (p === 1) setBrowseResults([]);
    try {
      const res = await fetch('/api/leads/search-apollo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: p, ...(areaFilter ? { area: areaFilter } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to load'); return; }
      const people: ApolloResult[] = data.people || [];
      setBrowseResults(prev => p === 1 ? people : [...prev, ...people]);
      setBrowseTotal(data.total || 0);
      setBrowsePage(p);
    } catch { toast.error('Failed to load leads'); }
    finally { setBrowsing(false); }
  }, [area]);

  async function doSearch(p = 1) {
    if (!keywords && !company && !linkedinUrl) { toast.error('Enter at least one search term'); return; }
    setSearching(true);
    setHasSearched(true);
    if (p === 1) setSearchResults([]);
    try {
      const res = await fetch('/api/leads/search-apollo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywords.trim() || undefined,
          company: company.trim() || undefined,
          linkedinUrl: linkedinUrl.trim() || undefined,
          page: p,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Search failed'); return; }
      const people: ApolloResult[] = data.people || [];
      setSearchResults(prev => p === 1 ? people : [...prev, ...people]);
      setSearchTotal(data.total || 0);
      setSearchPage(p);
    } catch { toast.error('Search failed'); }
    finally { setSearching(false); }
  }

  async function addOne(person: ApolloResult): Promise<Lead | null> {
    if (addingIds.has(person.id) || addedIds.has(person.id)) return null;
    setAddingIds(prev => new Set(prev).add(person.id));
    try {
      const res = await fetch('/api/leads/search-apollo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addPerson: person }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to add'); return null; }
      setAddedIds(prev => new Set(prev).add(person.id));
      return data.lead;
    } catch { return null; }
    finally { setAddingIds(prev => { const s = new Set(prev); s.delete(person.id); return s; }); }
  }

  async function addAll(results: ApolloResult[]) {
    const toAdd = results.filter(p => !addedIds.has(p.id));
    if (!toAdd.length) { toast.info('All results already added'); return; }
    setAddingAll(true);
    const added: Lead[] = [];
    // 3 concurrent
    for (let i = 0; i < toAdd.length; i += 3) {
      const batch = toAdd.slice(i, i + 3);
      const results = await Promise.all(batch.map(addOne));
      results.forEach(l => { if (l) added.push(l); });
    }
    if (added.length > 0) {
      onLeadsAdded(added);
      toast.success(`Added ${added.length} leads!`);
    } else {
      toast.info('All already in your CRM');
    }
    setAddingAll(false);
  }

  async function handleAddOne(person: ApolloResult) {
    const lead = await addOne(person);
    if (lead) {
      onLeadsAdded([lead]);
      toast.success(`${person.name || person.first_name || 'Lead'} added!`);
    }
  }

  const results = tab === 'browse' ? browseResults : searchResults;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ animation: 'slideUp 200ms ease' }}>
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-border shrink-0">
        <div>
          <h2 className="text-lg font-bold text-foreground">Get Leads</h2>
          <p className="text-xs text-muted-foreground">Find architects &amp; designers from Apollo</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-2 shrink-0">
        <button onClick={() => setTab('browse')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'browse' ? 'bg-primary/15 text-primary border border-primary/25' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
          Browse Your City
        </button>
        <button onClick={() => setTab('search')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'search' ? 'bg-primary/15 text-primary border border-primary/25' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
          Search by Name
        </button>
      </div>

      {/* Browse tab */}
      {tab === 'browse' && (
        <div className="shrink-0 px-4 pb-3 space-y-2.5 border-b border-border">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Filter by area (e.g. Bandra, Koramangala)..."
              value={area}
              onChange={e => setArea(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') browse(1, area); }}
              className="flex-1 h-10 px-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
            />
            <button onClick={() => browse(1, area)} disabled={browsing}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5">
              {browsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Browse
            </button>
          </div>
          {/* Area quick filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button onClick={() => { setArea(''); browse(1, ''); }}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${!area ? 'bg-primary/15 border-primary/25 text-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}>
              All city
            </button>
            {cityAreas.map(a => (
              <button key={a} onClick={() => { setArea(a); browse(1, a); }}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${area === a ? 'bg-primary/15 border-primary/25 text-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}>
                {a}
              </button>
            ))}
          </div>
          {browseResults.length > 0 && !browsing && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground flex-1">{browseTotal} found · showing {browseResults.length}</span>
              <button onClick={() => addAll(browseResults)} disabled={addingAll}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50">
                {addingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search tab */}
      {tab === 'search' && (
        <div className="shrink-0 px-4 pb-3 space-y-2 border-b border-border">
          <input type="text" placeholder="Name or keywords (e.g. Rahul, interior designer)..."
            value={keywords} onChange={e => setKeywords(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') doSearch(1); }}
            className="w-full h-10 px-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
          />
          <div className="flex gap-2">
            <input type="text" placeholder="Company name (optional)..."
              value={company} onChange={e => setCompany(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doSearch(1); }}
              className="flex-1 h-10 px-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
            />
            <button onClick={() => doSearch(1)} disabled={searching}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
          <input type="text" placeholder="LinkedIn URL (most accurate)..."
            value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
            className="w-full h-9 px-3 bg-secondary border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
          />
          {searchResults.length > 0 && !searching && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground flex-1">{searchTotal} found · showing {searchResults.length}</span>
              <button onClick={() => addAll(searchResults)} disabled={addingAll}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-semibold disabled:opacity-50">
                {addingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Add All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {(tab === 'browse' ? browsing && !browseResults.length : searching && !searchResults.length) ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            <p className="text-sm">Searching Apollo for architects...</p>
          </div>
        ) : results.length === 0 && (tab === 'browse' ? hasBrowsed : hasSearched) ? (
          <div className="text-center py-16 text-muted-foreground">
            <SlidersHorizontal className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No results found</p>
            <p className="text-xs mt-1 opacity-60">Try a different area or search term</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-4 opacity-15" />
            <p className="text-sm font-semibold">
              {tab === 'browse' ? 'Choose an area or click Browse' : 'Search for architects by name or company'}
            </p>
            <p className="text-xs mt-1.5 opacity-60 max-w-xs mx-auto">
              {tab === 'browse'
                ? 'Tap an area chip above or click Browse to load architects in your city'
                : 'Enter a name, company, or paste a LinkedIn URL for exact match'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map(person => {
              const isAdded = addedIds.has(person.id);
              const isAdding = addingIds.has(person.id);
              const hasPhone = !!(person.phone || person.has_direct_phone === 'Yes' || person.organization?.primary_phone);
              const displayName = person.name || person.first_name || 'Unknown';

              return (
                <div key={person.id}
                  className={`bg-card border rounded-xl p-3 flex items-center gap-3 transition-all ${isAdded ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border hover:border-border/80'}`}>
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                    {(displayName[0] || '?').toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{displayName}</span>
                      {hasPhone && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded-full">
                          <Phone className="w-2 h-2" /> HAS PHONE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{person.title}</p>
                    <p className="text-[11px] text-muted-foreground/70 truncate">{person.organization?.name}{person.city ? ` · ${person.city}` : ''}</p>
                    {person.phone && (
                      <p className="text-xs text-emerald-400 font-mono mt-0.5">{person.phone}</p>
                    )}
                  </div>

                  {/* Add button */}
                  <button
                    onClick={() => handleAddOne(person)}
                    disabled={isAdded || isAdding || addingAll}
                    className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all
                      ${isAdded
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                        : 'bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 active:scale-95'}
                      ${isAdding ? 'opacity-60' : ''}
                    `}>
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : isAdded ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}

            {/* Load more */}
            {tab === 'browse' && browseResults.length < browseTotal && (
              <button onClick={() => browse(browsePage + 1, area)} disabled={browsing}
                className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                {browsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                Load more ({browseTotal - browseResults.length} remaining)
              </button>
            )}
            {tab === 'search' && searchResults.length < searchTotal && (
              <button onClick={() => doSearch(searchPage + 1)} disabled={searching}
                className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                Load more
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
