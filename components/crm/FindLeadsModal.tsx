'use client';

import { useState, useEffect } from 'react';
import { X, Search, Plus, CheckCircle2, Phone, Loader2, ChevronRight, MapPin, Crown, Briefcase, Users2, PhoneCall } from 'lucide-react';
import { Lead } from '@/lib/db';
import { toast } from 'sonner';

interface ApolloResult {
  id: string;
  name: string;
  first_name?: string;
  title: string;
  phone: string | null;
  phone_type: string | null;
  email: string | null;
  has_direct_phone: string;
  linkedin_url: string | null;
  organization: { name: string; website_url: string | null; primary_phone: string | null };
  city: string;
  state: string;
  already_added?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onLeadsAdded: (leads: Lead[]) => void;
}

const AREA_SUGGESTIONS: Record<string, string[]> = {
  Mumbai:    ['Bandra', 'Juhu', 'Andheri', 'Lower Parel', 'Worli', 'Powai', 'Malad', 'Navi Mumbai'],
  Bangalore: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar', 'Rajajinagar', 'Malleswaram', 'JP Nagar'],
  Chennai:   ['Adyar', 'Anna Nagar', 'OMR', 'Velachery', 'T Nagar', 'Nungambakkam'],
  Pune:      ['Koregaon Park', 'Baner', 'Kothrud', 'Viman Nagar', 'Hinjawadi', 'Wakad'],
  Hyderabad: ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Madhapur', 'Kondapur', 'Hitech City'],
};

const SENIORITY_OPTIONS = [
  { id: 'leadership', label: 'Owners & Heads', sub: 'Principals, founders, directors', icon: Crown },
  { id: 'senior', label: 'Senior Staff', sub: 'Sr. designers, project heads', icon: Briefcase },
  { id: 'any', label: 'Everyone', sub: 'All relevant roles', icon: Users2 },
];

export function FindLeadsModal({ open, onClose, onLeadsAdded }: Props) {
  const [tab, setTab] = useState<'find' | 'search'>('find');

  // Find state
  const [area, setArea] = useState('');
  const [seniority, setSeniority] = useState('leadership');
  const [phoneOnly, setPhoneOnly] = useState(true);
  const [results, setResults] = useState<ApolloResult[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [finding, setFinding] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [cityAreas, setCityAreas] = useState<string[]>([]);
  const [city, setCity] = useState('');

  // Person/company search state
  const [keywords, setKeywords] = useState('');
  const [company, setCompany] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Adding
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addingAll, setAddingAll] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      const c = d.user?.city || 'Mumbai';
      setCity(c);
      setCityAreas(AREA_SUGGESTIONS[c] || AREA_SUGGESTIONS.Mumbai);
    }).catch(() => setCityAreas(AREA_SUGGESTIONS.Mumbai));
  }, []);

  async function find(p = 1, opts?: { area?: string; seniority?: string }) {
    const a = opts?.area !== undefined ? opts.area : area;
    const s = opts?.seniority || seniority;
    setFinding(true);
    setHasSearched(true);
    if (p === 1) setResults([]);
    try {
      const res = await fetch('/api/leads/search-apollo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: p,
          perPage: 25,
          seniority: s,
          ...(tab === 'find' && a ? { area: a } : {}),
          ...(tab === 'search' && keywords.trim() ? { keywords: keywords.trim() } : {}),
          ...(tab === 'search' && company.trim() ? { company: company.trim() } : {}),
          ...(tab === 'search' && linkedinUrl.trim() ? { linkedinUrl: linkedinUrl.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Search failed'); return; }
      const people: ApolloResult[] = data.people || [];
      setResults(prev => p === 1 ? people : [...prev, ...people]);
      setTotal(data.total || 0);
      setPage(p);
    } catch { toast.error('Search failed — check your connection'); }
    finally { setFinding(false); }
  }

  async function addOne(person: ApolloResult): Promise<Lead | null> {
    if (addingIds.has(person.id) || addedIds.has(person.id) || person.already_added) return null;
    setAddingIds(prev => new Set(prev).add(person.id));
    try {
      const res = await fetch('/api/leads/search-apollo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addPerson: person, addArea: area || null }),
      });
      const data = await res.json();
      if (res.status === 409) { setAddedIds(prev => new Set(prev).add(person.id)); return null; }
      if (!res.ok) { toast.error(data.error || 'Failed to add'); return null; }
      setAddedIds(prev => new Set(prev).add(person.id));
      return data.lead;
    } catch { return null; }
    finally { setAddingIds(prev => { const s = new Set(prev); s.delete(person.id); return s; }); }
  }

  async function addAll() {
    const pool = visible.filter(p => !addedIds.has(p.id) && !p.already_added);
    if (!pool.length) { toast.info('All results already added'); return; }
    setAddingAll(true);
    const added: Lead[] = [];
    for (let i = 0; i < pool.length; i += 3) {
      const batch = pool.slice(i, i + 3);
      const done = await Promise.all(batch.map(addOne));
      done.forEach(l => { if (l) added.push(l); });
    }
    if (added.length > 0) {
      onLeadsAdded(added);
      const withPhone = added.filter(l => l.phone).length;
      toast.success(`Added ${added.length} leads (${withPhone} with phone numbers)`);
    } else {
      toast.info('All already in your CRM');
    }
    setAddingAll(false);
  }

  async function handleAddOne(person: ApolloResult) {
    const lead = await addOne(person);
    if (lead) {
      onLeadsAdded([lead]);
      toast.success(lead.phone ? `${person.name || 'Lead'} added with phone!` : `${person.name || 'Lead'} added`);
    }
  }

  const visible = phoneOnly && tab === 'find'
    ? results.filter(r => r.has_direct_phone === 'Yes' || r.phone)
    : results;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ animation: 'slideUp 200ms ease' }}>
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-foreground">Find Leads</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {city || '...'} · architects &amp; interior designers
          </p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pb-2 shrink-0">
        <button onClick={() => setTab('find')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'find' ? 'bg-primary/15 text-primary border border-primary/25' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
          Discover New
        </button>
        <button onClick={() => setTab('search')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'search' ? 'bg-primary/15 text-primary border border-primary/25' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
          Specific Person / Firm
        </button>
      </div>

      {/* Find tab controls */}
      {tab === 'find' && (
        <div className="shrink-0 px-4 pb-3 space-y-2.5 border-b border-border">
          {/* Who */}
          <div className="grid grid-cols-3 gap-1.5">
            {SENIORITY_OPTIONS.map(o => {
              const Icon = o.icon;
              const active = seniority === o.id;
              return (
                <button key={o.id}
                  onClick={() => { setSeniority(o.id); if (hasSearched) find(1, { seniority: o.id }); }}
                  className={`flex flex-col items-start gap-0.5 p-2.5 rounded-xl border text-left transition-colors ${active ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}>
                  <Icon className="w-4 h-4 mb-0.5" />
                  <span className="text-[11px] font-bold leading-tight">{o.label}</span>
                  <span className="text-[9px] opacity-60 leading-tight">{o.sub}</span>
                </button>
              );
            })}
          </div>

          {/* Territory tag + Find */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tag leads with an area (optional — e.g. where you're meeting)"
              value={area}
              onChange={e => setArea(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') find(1); }}
              className="flex-1 h-10 px-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
            />
            <button onClick={() => find(1)} disabled={finding}
              className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 flex items-center gap-1.5 hover:bg-primary/90 transition-colors">
              {finding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Find
            </button>
          </div>

          {/* Area tag chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {cityAreas.map(a => (
              <button key={a} onClick={() => { setArea(area === a ? '' : a); if (!hasSearched) find(1, { area: a }); }}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${area === a ? 'bg-primary/15 border-primary/25 text-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}>
                {a}
              </button>
            ))}
          </div>
          {!hasSearched && (
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
              Searches your whole city — Apollo doesn&apos;t index neighbourhoods. Each firm&apos;s area is auto-detected
              from its address when you add it; the tag above fills in the rest so you can filter your leads by territory.
            </p>
          )}

          {/* Phone-only toggle + Add All */}
          {hasSearched && (
            <div className="flex items-center gap-2">
              <button onClick={() => setPhoneOnly(v => !v)}
                className={`flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[11px] font-semibold border transition-colors ${phoneOnly ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-secondary border-border text-muted-foreground'}`}>
                <PhoneCall className="w-3 h-3" />
                {phoneOnly ? 'Direct phone only' : 'Showing all'}
              </button>
              <span className="text-[11px] text-muted-foreground flex-1 text-right">
                {finding ? 'Searching...' : `${visible.length} shown · ${total.toLocaleString()} in Apollo`}
              </span>
              {visible.length > 0 && (
                <button onClick={addAll} disabled={addingAll}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50">
                  {addingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add All
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search tab controls */}
      {tab === 'search' && (
        <div className="shrink-0 px-4 pb-3 space-y-2 border-b border-border">
          <input type="text" placeholder="Person name (e.g. Sanjay Puri)..."
            value={keywords} onChange={e => setKeywords(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') find(1); }}
            className="w-full h-10 px-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
          />
          <div className="flex gap-2">
            <input type="text" placeholder="Firm name (e.g. Sanjay Puri Architects)..."
              value={company} onChange={e => setCompany(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') find(1); }}
              className="flex-1 h-10 px-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
            />
            <button onClick={() => find(1)} disabled={finding}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 flex items-center gap-1.5">
              {finding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            💡 Search a big firm&apos;s name to get its senior designers &amp; project heads — pick &quot;Owners &amp; Heads&quot; or &quot;Senior Staff&quot; on the Discover tab first
          </p>
          <input type="text" placeholder="LinkedIn URL (most accurate)..."
            value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') find(1); }}
            className="w-full h-9 px-3 bg-secondary border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
          />
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {finding && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            <p className="text-sm">Finding {seniority === 'leadership' ? 'owners & design heads' : seniority === 'senior' ? 'senior designers' : 'design professionals'}...</p>
          </div>
        ) : visible.length === 0 && hasSearched && !finding ? (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">
              {phoneOnly && results.length > 0 ? `${results.length} found but none with direct phones` : 'No results found'}
            </p>
            <p className="text-xs mt-1 opacity-60">
              {phoneOnly && results.length > 0 ? 'Turn off "Direct phone only" to see them, or load more' : 'Try a different area, or search the whole city'}
            </p>
            {phoneOnly && results.length > 0 && (
              <button onClick={() => setPhoneOnly(false)} className="mt-3 text-xs text-primary hover:underline">
                Show all {results.length} results
              </button>
            )}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-4 opacity-15" />
            <p className="text-sm font-semibold">Pick who you want, then hit Find</p>
            <p className="text-xs mt-1.5 opacity-60 max-w-xs mx-auto">
              Owners &amp; Heads approve vendors · Senior Staff specify materials on projects
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map(person => {
              const isAdded = addedIds.has(person.id) || person.already_added;
              const isAdding = addingIds.has(person.id);
              const hasDirect = person.has_direct_phone === 'Yes';
              const displayName = person.name || person.first_name || 'Unknown';

              return (
                <div key={person.id}
                  className={`bg-card border rounded-xl p-3 flex items-center gap-3 transition-all ${isAdded ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border hover:border-border/80'}`}>
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                    {(displayName[0] || '?').toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{displayName}</span>
                      {hasDirect && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded-full">
                          <Phone className="w-2 h-2" /> DIRECT PHONE
                        </span>
                      )}
                      {isAdded && (
                        <span className="text-[9px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">IN CRM</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{person.title}</p>
                    <p className="text-[11px] text-muted-foreground/70 truncate">{person.organization?.name}{person.city ? ` · ${person.city}` : ''}</p>
                    {person.phone && (
                      <p className="text-xs text-emerald-400 font-mono mt-0.5">
                        {person.phone}
                        {person.phone_type && <span className="text-[9px] text-emerald-400/60 ml-1.5 uppercase">{person.phone_type}</span>}
                      </p>
                    )}
                  </div>

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

            {results.length < total && (
              <button onClick={() => find(page + 1)} disabled={finding}
                className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                {finding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                Load 25 more
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
