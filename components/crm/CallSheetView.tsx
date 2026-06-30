'use client';

import { useEffect, useState, useCallback } from 'react';
import { Lead } from '@/lib/db';
import { Phone, PhoneCall, PhoneOff, CheckCircle2, Clock, ChevronDown, ChevronUp, Loader2, RefreshCw, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { PostCallModal } from './PostCallModal';
import { FindLeadsModal } from './FindLeadsModal';
import { STATUS_CONFIG } from '@/lib/next-steps';

type Section = 'due' | 'all_phone';

function statusColor(status: string) {
  const map: Record<string, string> = {
    new: 'bg-slate-500/20 text-slate-300',
    first_call_done: 'bg-emerald-500/20 text-emerald-300',
    follow_up_1: 'bg-blue-500/20 text-blue-300',
    follow_up_2: 'bg-blue-500/20 text-blue-300',
    follow_up_3: 'bg-blue-500/20 text-blue-300',
    meeting_scheduled: 'bg-violet-500/20 text-violet-300',
    proposal_sent: 'bg-amber-500/20 text-amber-300',
    negotiating: 'bg-orange-500/20 text-orange-300',
    converted: 'bg-emerald-500/20 text-emerald-300',
    not_interested: 'bg-red-500/20 text-red-300',
    on_hold: 'bg-zinc-500/20 text-zinc-300',
    call_back_requested: 'bg-amber-500/20 text-amber-300',
    voicemail: 'bg-zinc-500/20 text-zinc-300',
  };
  return map[status] || 'bg-slate-500/20 text-slate-300';
}

function CallCard({ lead, onUpdated, isOverdue }: { lead: Lead; onUpdated: (l: Lead) => void; isOverdue?: boolean }) {
  const [showPostCall, setShowPostCall] = useState(false);
  const [logging, setLogging] = useState(false);

  async function quickLog(status: string) {
    if (logging) return;
    setLogging(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Updated!');
      onUpdated(data.lead);
    } catch {
      toast.error('Failed');
    } finally {
      setLogging(false);
    }
  }

  return (
    <>
      <div className={`bg-card border rounded-xl p-3.5 space-y-2.5 ${isOverdue ? 'border-orange-500/30' : 'border-border'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground leading-none">{lead.contact_name}</p>
              {isOverdue && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 uppercase tracking-wider">OVERDUE</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{lead.company_name}</p>
            {lead.contact_title && <p className="text-[11px] text-muted-foreground/70">{lead.contact_title}</p>}
          </div>
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg shrink-0 ${statusColor(lead.status)}`}>
            {STATUS_CONFIG[lead.status]?.label || lead.status}
          </span>
        </div>

        {/* Phone number — big and tappable */}
        <a
          href={`tel:${lead.phone}`}
          className="flex items-center gap-2.5 w-full px-3.5 py-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl hover:bg-emerald-500/20 active:scale-[0.98] transition-all"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-sm font-bold text-emerald-400 tracking-wide flex-1">{lead.phone}</span>
          <PhoneCall className="w-4 h-4 text-emerald-400/60" />
        </a>

        {/* Quick action buttons */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowPostCall(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Log Call
          </button>
          <button
            onClick={() => quickLog('not_interested')}
            disabled={logging || lead.status === 'not_interested'}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-40"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => quickLog('converted')}
            disabled={logging || lead.status === 'converted'}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Next action date */}
        {lead.next_action_date && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Due {lead.next_action_date}</span>
          </div>
        )}
      </div>

      <PostCallModal
        lead={lead}
        open={showPostCall}
        onClose={() => setShowPostCall(false)}
        onUpdated={updated => { onUpdated(updated); setShowPostCall(false); }}
      />
    </>
  );
}

export function CallSheetView() {
  const [dueLeads, setDueLeads] = useState<Lead[]>([]);
  const [allPhoneLeads, setAllPhoneLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');
  const [showFindLeads, setShowFindLeads] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeads = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Due today/overdue with phone
      const dueRes = await fetch('/api/leads?phone_filter=has_phone&sort=followup&status=&limit=50');
      const dueData = await dueRes.json();
      const due = (dueData.leads || []).filter((l: Lead) =>
        l.next_action_date && l.next_action_date <= today &&
        !['converted', 'not_interested'].includes(l.status)
      );
      setDueLeads(due);

      // All with phone (for the full call list)
      const allRes = await fetch('/api/leads?phone_filter=has_phone&sort=attention&limit=100');
      const allData = await allRes.json();
      setAllPhoneLeads(allData.leads || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  function handleUpdate(updated: Lead) {
    const today = new Date().toISOString().split('T')[0];
    const isStillDue = updated.next_action_date && updated.next_action_date <= today &&
      !['converted', 'not_interested'].includes(updated.status);

    setDueLeads(prev =>
      isStillDue
        ? prev.map(l => l.id === updated.id ? updated : l)
        : prev.filter(l => l.id !== updated.id)
    );
    setAllPhoneLeads(prev =>
      ['converted', 'not_interested'].includes(updated.status)
        ? prev.filter(l => l.id !== updated.id)
        : prev.map(l => l.id === updated.id ? updated : l)
    );
  }

  function handleLeadsAdded(newLeads: Lead[]) {
    const withPhone = newLeads.filter(l => l.phone);
    if (withPhone.length > 0) {
      setAllPhoneLeads(prev => [...withPhone, ...prev]);
    }
  }

  const filtered = search.trim()
    ? allPhoneLeads.filter(l =>
        l.contact_name.toLowerCase().includes(search.toLowerCase()) ||
        l.company_name.toLowerCase().includes(search.toLowerCase())
      )
    : allPhoneLeads;

  const visibleAll = showAll ? filtered : filtered.slice(0, 10);

  if (loading) {
    return (
      <div className="flex-1 p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 bg-card rounded-xl border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">Call Sheet</h2>
            <p className="text-xs text-muted-foreground">{allPhoneLeads.length} lead{allPhoneLeads.length !== 1 ? 's' : ''} with phone numbers</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLeads(true)}
              disabled={refreshing}
              className="w-8 h-8 rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowFindLeads(true)}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> Get Leads
            </button>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-4">
          {/* Due today section */}
          {dueLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Due Today / Overdue</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400">{dueLeads.length}</span>
              </div>
              <div className="space-y-2.5">
                {dueLeads.map(l => (
                  <CallCard key={l.id} lead={l} onUpdated={handleUpdate} isOverdue />
                ))}
              </div>
            </div>
          )}

          {/* No phone leads at all */}
          {allPhoneLeads.length === 0 && (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <PhoneOff className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No leads with phone numbers yet</p>
              <p className="text-xs text-muted-foreground mb-4">Add leads from Apollo to get phone numbers instantly</p>
              <button
                onClick={() => setShowFindLeads(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="w-4 h-4" /> Find Leads with Phones
              </button>
            </div>
          )}

          {/* All phone leads */}
          {allPhoneLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">All Callable Leads</span>
              </div>

              {/* Search */}
              <div className="relative mb-2.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search name or company..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 h-8 bg-secondary border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
                />
              </div>

              <div className="space-y-2.5">
                {visibleAll.map(l => (
                  <CallCard key={l.id} lead={l} onUpdated={handleUpdate} />
                ))}
              </div>

              {filtered.length > 10 && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="w-full mt-2.5 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-1.5"
                >
                  {showAll
                    ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                    : <><ChevronDown className="w-3.5 h-3.5" /> Show {filtered.length - 10} more</>
                  }
                </button>
              )}

              {filtered.length === 0 && search && (
                <p className="text-center text-xs text-muted-foreground py-6">No leads match &quot;{search}&quot;</p>
              )}
            </div>
          )}
        </div>
      </div>

      <FindLeadsModal
        open={showFindLeads}
        onClose={() => setShowFindLeads(false)}
        onLeadsAdded={handleLeadsAdded}
      />
    </>
  );
}
