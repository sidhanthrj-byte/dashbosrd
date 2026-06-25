'use client';

import { useState } from 'react';
import { Lead } from '@/lib/db';
import { NextStep } from '@/lib/next-steps';
import { StatusBadge } from './StatusBadge';
import { UpdateLeadModal } from './UpdateLeadModal';
import { NextStepsPanel } from './NextStepsPanel';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import {
  MapPin, Phone, Mail, Link2, Calendar, ChevronDown,
  Edit3, ExternalLink, MessageCircle, Bell, IndianRupee,
  Search, Loader2, UserX, RefreshCw, Star,
} from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  lead: Lead;
  onUpdate: (lead: Lead) => void;
  onReplace?: (archivedId: number, newLead: Lead) => void;
  compact?: boolean;
};

const PRIORITY_BAR: Record<string, string> = {
  high:   'from-amber-500 to-orange-500',
  medium: 'from-zinc-500 to-zinc-600',
  low:    'from-slate-600 to-slate-700',
};

const AVATAR_BG: Record<string, string> = {
  high:   'from-amber-500/80 to-orange-600/80',
  medium: 'from-zinc-600/80 to-zinc-700/80',
  low:    'from-slate-600/80 to-slate-700/80',
};

const TIER: Record<string, { label: string; color: string }> = {
  high:   { label: 'T1', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  medium: { label: 'T2', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
  low:    { label: 'T3', color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' },
};

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function isOverdue(d: string) {
  return new Date(d) < new Date(new Date().toDateString());
}

type LookupState = 'idle' | 'loading' | 'found' | 'not-found';

export function LeadCard({ lead: initialLead, onUpdate, onReplace, compact = false }: Props) {
  const [lead, setLead] = useState(initialLead);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [lookupState, setLookupState] = useState<LookupState>(
    initialLead.phone ? 'found' : initialLead.phone_fetched ? 'not-found' : 'idle'
  );
  const [replacing, setReplacing] = useState(false);
  const [nextSteps, setNextSteps] = useState<NextStep[]>(() => {
    try { return lead.ai_next_steps ? JSON.parse(lead.ai_next_steps) : []; }
    catch { return []; }
  });

  function handleUpdated(updated: Lead, steps: NextStep[]) {
    setLead(updated);
    setNextSteps(steps);
    setExpanded(true);
    onUpdate(updated);
  }

  async function handleLookup(e: React.MouseEvent) {
    e.stopPropagation();
    setLookupState('loading');
    try {
      const res = await fetch('/api/contact-lookup', {
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
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Lookup failed'); setLookupState('idle'); return; }

      if (data.phone || data.email) {
        toast.success(`Found contact info!`);
        setLookupState('found');
        setLead(prev => ({ ...prev, phone: data.phone || prev.phone, email: data.email || prev.email, phone_fetched: 1 }));
        onUpdate({ ...lead, phone: data.phone || lead.phone, email: data.email || lead.email, phone_fetched: 1 });
      } else {
        toast.info('No phone number found in Apollo for this contact.');
        setLookupState('not-found');
        setLead(prev => ({ ...prev, phone_fetched: 1 }));
        onUpdate({ ...lead, phone_fetched: 1 });
      }
    } catch (err) {
      toast.error('Lookup failed: ' + String(err));
      setLookupState('idle');
    }
  }

  async function handleReplace(e: React.MouseEvent) {
    e.stopPropagation();
    if (replacing) return;
    setReplacing(true);
    try {
      const res = await fetch('/api/leads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 1, replace_lead_id: lead.id, page: Math.floor(Math.random() * 5) + 1 }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to replace lead'); setReplacing(false); return; }
      if (data.added > 0 && data.leads[0]) {
        toast.success('Lead replaced with a fresh one from Apollo!');
        onReplace?.(lead.id, data.leads[0]);
      } else {
        // Archive only, no replacement found
        await fetch(`/api/leads/${lead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archived: 1 }),
        });
        toast.info('Lead archived. No new leads available right now.');
        onReplace?.(lead.id, null as unknown as Lead);
      }
    } catch {
      toast.error('Failed to replace lead');
      setReplacing(false);
    }
  }

  const overdue = lead.next_action_date && isOverdue(lead.next_action_date)
    && !['converted', 'not_interested'].includes(lead.status);
  const waUrl = lead.phone
    ? getWhatsAppUrl(lead.phone, lead.contact_name, lead.company_name, lead.status, lead.project_type)
    : null;
  const tier = TIER[lead.priority] || TIER.medium;

  // Compact action button for collapsed state
  function ActionButton() {
    if (lead.phone) {
      return (
        <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
          className="flex items-center gap-1.5 h-9 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors">
          <Phone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Call</span>
        </a>
      );
    }
    if (lookupState === 'loading') {
      return (
        <span className="flex items-center gap-1.5 h-9 px-3 bg-secondary border border-border rounded-xl text-xs text-muted-foreground shrink-0">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        </span>
      );
    }
    if (lookupState === 'not-found') {
      return (
        <button onClick={handleReplace} disabled={replacing}
          className="flex items-center gap-1.5 h-9 px-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 rounded-xl text-xs font-semibold shrink-0 transition-colors disabled:opacity-50">
          {replacing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>Replace</span>
        </button>
      );
    }
    // idle — not yet looked up
    return (
      <button onClick={handleLookup}
        className="flex items-center gap-1.5 h-9 px-2.5 bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 rounded-xl text-xs font-semibold shrink-0 transition-colors">
        <Search className="w-3.5 h-3.5" />
        <span>Find #</span>
      </button>
    );
  }

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all hover:shadow-md hover:shadow-black/20 active:scale-[0.995]
      ${overdue ? 'border-l-2 border-l-orange-500/70 border-border' : 'border-border'}`}>
      {/* Priority bar */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${PRIORITY_BAR[lead.priority] || PRIORITY_BAR.medium}`} />

      {/* Collapsed row — always visible, tap to expand */}
      <div className="px-3 pt-3 pb-2.5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_BG[lead.priority] || AVATAR_BG.medium} flex items-center justify-center text-white font-bold text-xs shrink-0 border border-white/10`}>
            {initials(lead.contact_name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-foreground text-sm leading-tight">{lead.contact_name}</span>
              <StatusBadge status={lead.status} />
              <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${tier.color}`}>
                <Star className="w-2 h-2" /> {tier.label}
              </span>
              {overdue && (
                <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.5 rounded-full">
                  OVERDUE
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-xs text-foreground/70 font-medium truncate">{lead.company_name}</span>
              {lead.area && (
                <>
                  <span className="text-border">·</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" />{lead.area}
                  </span>
                </>
              )}
              {lead.next_action_date && (
                <>
                  <span className="text-border">·</span>
                  <span className={`text-xs flex items-center gap-0.5 ${overdue ? 'text-orange-400' : 'text-muted-foreground'}`}>
                    <Calendar className="w-2.5 h-2.5" />
                    {overdue ? 'Due ' : ''}{formatDate(lead.next_action_date)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action button */}
          <ActionButton />

          {/* Expand chevron */}
          <button onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-7 h-7 rounded-lg bg-secondary hover:bg-muted flex items-center justify-center text-muted-foreground shrink-0 transition-colors">
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* If phone found from lookup, show inline */}
        {lookupState === 'found' && !lead.phone && (
          <div className="mt-2 ml-11 flex items-center gap-1.5 text-xs text-muted-foreground/50">
            <UserX className="w-3 h-3" /> Not in Apollo
          </div>
        )}
      </div>

      {/* Expanded section */}
      {expanded && !compact && (
        <div className="px-3 pb-3 pt-1 border-t border-border/40 space-y-3">
          {/* Contact actions row */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            {lead.phone ? (
              <>
                <a href={`tel:${lead.phone}`}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1.5 hover:bg-emerald-500/20 transition-colors">
                  <Phone className="w-3 h-3" /> {lead.phone}
                </a>
                {waUrl && (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-500 rounded-full px-3 py-1.5 transition-colors">
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </a>
                )}
              </>
            ) : lookupState === 'not-found' ? (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground/50 px-1">
                <UserX className="w-3 h-3" /> No phone found in Apollo
              </span>
            ) : lookupState === 'idle' ? (
              <button onClick={handleLookup}
                className="flex items-center gap-1.5 text-xs font-medium text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-2.5 py-1.5 hover:bg-violet-500/20 transition-colors">
                <Search className="w-3 h-3" /> Find Phone / Email
              </button>
            ) : null}

            {lead.email && (
              <a href={`mailto:${lead.email}`}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-1.5 transition-colors">
                <Mail className="w-3 h-3" /> {lead.email}
              </a>
            )}

            {lead.linkedin_url && (
              <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-1.5 transition-colors">
                <Link2 className="w-3 h-3" /> LinkedIn <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          {/* Follow-up + quick actions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {lead.next_action_date && (
              <a href={`/api/calendar/${lead.id}`}
                className="flex items-center gap-1.5 text-xs font-medium text-primary/80 hover:text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1 transition-colors">
                <Bell className="w-3 h-3" /> Add Reminder
              </a>
            )}
            {!waUrl && lead.email && (
              <a href={`mailto:${lead.email}?subject=Follow up - Pongs Stretch Ceiling&body=Hi ${lead.contact_name.split(' ')[0]},`}
                className="flex items-center gap-1.5 text-xs font-medium text-sky-400/80 hover:text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-full px-2.5 py-1 transition-colors">
                <Mail className="w-3 h-3" /> Email
              </a>
            )}
            {lead.deal_value && (
              <span className="flex items-center gap-0.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                <IndianRupee className="w-3 h-3" />
                {lead.deal_value.toLocaleString('en-IN')}
              </span>
            )}
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-xs font-medium text-foreground/60 hover:text-foreground bg-secondary rounded-full px-2.5 py-1 transition-colors ml-auto">
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2.5 border border-border leading-relaxed">
              <span className="text-foreground font-medium block mb-0.5">Notes</span>
              {lead.notes}
            </div>
          )}

          {/* Next steps */}
          {nextSteps.length > 0
            ? <NextStepsPanel steps={nextSteps} />
            : (
              <p className="text-xs text-muted-foreground text-center py-2">
                Update this lead&apos;s status to get AI-powered next steps.
              </p>
            )
          }
        </div>
      )}

      <UpdateLeadModal
        lead={lead}
        open={editing}
        onClose={() => setEditing(false)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
