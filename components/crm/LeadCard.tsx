'use client';

import { useState } from 'react';
import { Lead } from '@/lib/db';
import { NextStep } from '@/lib/next-steps';
import { StatusBadge } from './StatusBadge';
import { UpdateLeadModal } from './UpdateLeadModal';
import { NextStepsPanel } from './NextStepsPanel';
import { PostCallModal } from './PostCallModal';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import {
  MapPin, Phone, Mail, Link2, Calendar, ChevronDown,
  Edit3, ExternalLink, MessageCircle, Bell, IndianRupee,
  Search, Loader2, UserX, RefreshCw, Star, Check, StickyNote, Copy,
} from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  lead: Lead;
  onUpdate: (lead: Lead) => void;
  onReplace?: (archivedId: number, newLead: Lead | null) => void;
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

function daysSince(d: string | null) {
  if (!d) return null;
  const diff = Date.now() - new Date(d).getTime();
  return Math.floor(diff / 86400000);
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

type LookupState = 'idle' | 'loading' | 'found' | 'not-found';

export function LeadCard({ lead: initialLead, onUpdate, onReplace, compact = false }: Props) {
  const [lead, setLead] = useState(initialLead);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPostCall, setShowPostCall] = useState(false);
  const [lookupState, setLookupState] = useState<LookupState>(
    initialLead.phone ? 'found' : initialLead.phone_fetched ? 'not-found' : 'idle'
  );
  const [manualPhone, setManualPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(lead.notes || '');
  const [savingNote, setSavingNote] = useState(false);
  const [changingStatus, setChangingStatus] = useState<string | null>(null);
  const [nextSteps, setNextSteps] = useState<NextStep[]>(() => {
    try { return lead.ai_next_steps ? JSON.parse(lead.ai_next_steps) : []; }
    catch { return []; }
  });

  function handleUpdated(updated: Lead, steps?: NextStep[]) {
    setLead(updated);
    if (steps) setNextSteps(steps);
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
          apolloId: lead.apollo_id,
          linkedinUrl: lead.linkedin_url,
          name: lead.contact_name,
          company: lead.company_name,
          email: lead.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Lookup failed'); setLookupState('idle'); return; }

      if (data.phone) {
        const src = data.source === 'website' ? 'website' : data.source === 'justdial' ? 'JustDial' : 'Apollo';
        toast.success(`Phone found via ${src}: ${data.phone}`);
        setLookupState('found');
        const updated = { ...lead, phone: data.phone, email: data.email || lead.email, phone_fetched: 1 };
        setLead(updated);
        onUpdate(updated);
        setExpanded(true);
      } else if (data.email && !lead.email) {
        toast.info(`Email found — no phone number. Enter manually or swap lead.`);
        setLookupState('not-found');
        const updated = { ...lead, email: data.email, phone_fetched: 1 };
        setLead(updated);
        onUpdate(updated);
        setExpanded(true);
      } else {
        toast.info('No contact info found — enter manually or swap this lead');
        setLookupState('not-found');
        const updated = { ...lead, phone_fetched: 1 };
        setLead(updated);
        onUpdate(updated);
        setExpanded(true);
      }
    } catch (err) {
      toast.error('Lookup failed: ' + String(err));
      setLookupState('idle');
    }
  }

  async function saveManualPhone(e: React.MouseEvent) {
    e.stopPropagation();
    if (!manualPhone.trim()) return;
    setSavingPhone(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: manualPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Phone saved!');
      setLead(data.lead);
      setLookupState('found');
      setManualPhone('');
      onUpdate(data.lead);
    } catch (err) {
      toast.error('Failed to save: ' + String(err));
    } finally {
      setSavingPhone(false);
    }
  }

  async function quickStatus(newStatus: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (changingStatus || newStatus === lead.status) return;
    setChangingStatus(newStatus);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const steps = data.aiNextSteps || [];
      handleUpdated(data.lead, steps);
      toast.success(`Moved to: ${data.lead.status.replace(/_/g, ' ')}`);
    } catch (err) {
      toast.error('Failed to update: ' + String(err));
    } finally {
      setChangingStatus(null);
    }
  }

  function copyPhone(e: React.MouseEvent) {
    e.stopPropagation();
    if (!lead.phone) return;
    navigator.clipboard.writeText(lead.phone).then(() => toast.success('Phone copied!'));
  }

  async function saveNote(e: React.MouseEvent) {
    e.stopPropagation();
    if (noteText.trim() === (lead.notes || '').trim()) { setEditingNote(false); return; }
    setSavingNote(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLead(data.lead);
      setEditingNote(false);
      onUpdate(data.lead);
    } catch (err) {
      toast.error('Failed to save note: ' + String(err));
    } finally {
      setSavingNote(false);
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
      if (!res.ok) { toast.error(data.error || 'Failed to swap lead'); setReplacing(false); return; }
      if (data.added > 0 && data.leads?.[0]) {
        toast.success('Swapped for a fresh lead!');
        onReplace?.(lead.id, data.leads[0]);
      } else {
        // Generate already archived the lead server-side; just remove from UI
        toast.info('Lead removed. Apollo had no new leads right now.');
        onReplace?.(lead.id, null);
      }
    } catch {
      toast.error('Failed to replace lead');
      setReplacing(false);
    }
  }

  const calendarUrl = `/api/calendar/${lead.id}`;
  const waUrl = getWhatsAppUrl(lead.phone || '', lead.contact_name, lead.company_name, lead.status, lead.project_type);

  const overdue = lead.next_action_date && isOverdue(lead.next_action_date)
    && !['converted', 'not_interested'].includes(lead.status);
  const tier = TIER[lead.priority] || TIER.medium;
  const daysSinceContact = daysSince(lead.last_contact_date);
  const staleDays = daysSinceContact !== null && daysSinceContact > 14 && !['converted', 'not_interested', 'on_hold'].includes(lead.status) ? daysSinceContact : null;

  // Suppress unused var warning
  void tomorrowStr;

  function ActionButton() {
    if (lead.phone) {
      return (
        <div className="flex items-center gap-1 shrink-0">
          <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 h-9 px-2 bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 rounded-l-xl text-[11px] font-bold max-w-[80px] truncate">
            <Phone className="w-3 h-3 shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </a>
          <button onClick={copyPhone}
            title="Copy number"
            className="h-9 px-1.5 bg-emerald-600/10 border-y border-emerald-500/30 text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-500/20 text-xs transition-colors shrink-0">
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setShowPostCall(true); }}
            className="h-9 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-r-xl text-xs font-bold shrink-0 transition-colors active:scale-95">
            Log
          </button>
        </div>
      );
    }
    if (lookupState === 'loading') {
      return (
        <span className="flex items-center gap-1.5 h-9 px-3 bg-secondary border border-border rounded-xl text-xs text-muted-foreground shrink-0">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...
        </span>
      );
    }
    if (lookupState === 'not-found') {
      return (
        <div className="flex items-center gap-1 shrink-0">
          {/* Retry lookup — tries website scraping now too */}
          <button onClick={handleLookup}
            className="flex items-center gap-1 h-9 px-2 bg-zinc-700/50 border border-zinc-600/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded-l-xl text-[10px] font-semibold transition-colors">
            <Search className="w-3 h-3" /> Retry
          </button>
          <button onClick={handleReplace} disabled={replacing}
            className="flex items-center gap-1 h-9 px-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 rounded-r-xl text-xs font-semibold shrink-0 transition-colors disabled:opacity-50">
            {replacing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Swap
          </button>
        </div>
      );
    }
    return (
      <button onClick={handleLookup}
        className="flex items-center gap-1.5 h-9 px-2.5 bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 rounded-xl text-xs font-semibold shrink-0 transition-colors active:scale-95">
        <Search className="w-3.5 h-3.5" />
        <span>Find #</span>
      </button>
    );
  }

  return (
    <>
      <div className={`bg-card border rounded-xl overflow-hidden transition-all hover:shadow-md hover:shadow-black/20 active:scale-[0.995]
        ${overdue ? 'border-l-2 border-l-orange-500/70 border-border' : 'border-border'}`}>
        <div className={`h-0.5 w-full bg-gradient-to-r ${PRIORITY_BAR[lead.priority] || PRIORITY_BAR.medium}`} />

        {/* Collapsed row */}
        <div className="px-3 pt-3 pb-2.5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_BG[lead.priority] || AVATAR_BG.medium} flex items-center justify-center text-white font-bold text-xs shrink-0 border border-white/10`}>
              {initials(lead.contact_name)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-foreground text-sm leading-tight">{lead.contact_name}</span>
                <StatusBadge status={lead.status} />
                <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${tier.color}`}>
                  <Star className="w-2 h-2" /> {tier.label}
                </span>
                {overdue && (
                  <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.5 rounded-full">OVERDUE</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xs text-foreground/70 font-medium truncate max-w-[110px]">{lead.company_name}</span>
                {lead.area && (
                  <>
                    <span className="text-border">·</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{lead.area}</span>
                  </>
                )}
                {lead.next_action_date && (
                  <>
                    <span className="text-border">·</span>
                    <span className={`text-xs flex items-center gap-0.5 ${overdue ? 'text-orange-400' : 'text-muted-foreground'}`}>
                      <Calendar className="w-2.5 h-2.5" />{overdue ? 'Due ' : ''}{formatDate(lead.next_action_date)}
                    </span>
                  </>
                )}
                {lead.email && !lead.phone && (
                  <>
                    <span className="text-border">·</span>
                    <span className="text-xs text-sky-400 flex items-center gap-0.5"><Mail className="w-2.5 h-2.5" />email only</span>
                  </>
                )}
                {staleDays && (
                  <>
                    <span className="text-border">·</span>
                    <span className="text-xs text-amber-500/80 flex items-center gap-0.5">{staleDays}d silent</span>
                  </>
                )}
              </div>
            </div>

            <ActionButton />

            <button onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
              className="w-7 h-7 rounded-lg bg-secondary hover:bg-muted flex items-center justify-center text-muted-foreground shrink-0 transition-colors">
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded section */}
        {expanded && !compact && (
          <div className="px-3 pb-3 border-t border-border/40 space-y-2.5 pt-2.5">
            {/* Quick status pills */}
            <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {[
                { key: 'first_call_done', label: 'Called', color: 'text-purple-400 bg-purple-500/10 border-purple-500/25 hover:bg-purple-500/20' },
                { key: 'call_back_requested', label: 'Call Back', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25 hover:bg-yellow-500/20' },
                { key: 'follow_up', label: 'Follow Up', color: 'text-orange-400 bg-orange-500/10 border-orange-500/25 hover:bg-orange-500/20' },
                { key: 'meeting_scheduled', label: 'Meeting', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25 hover:bg-indigo-500/20' },
                { key: 'sample_sent', label: 'Sample', color: 'text-teal-400 bg-teal-500/10 border-teal-500/25 hover:bg-teal-500/20' },
                { key: 'proposal_sent', label: 'Proposal', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25 hover:bg-cyan-500/20' },
                { key: 'negotiation', label: 'Negotiating', color: 'text-pink-400 bg-pink-500/10 border-pink-500/25 hover:bg-pink-500/20' },
                { key: 'converted', label: '✓ Won', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/20' },
                { key: 'not_interested', label: 'Lost', color: 'text-red-400 bg-red-500/10 border-red-500/25 hover:bg-red-500/20' },
                { key: 'on_hold', label: 'Hold', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/25 hover:bg-zinc-500/20' },
              ].map(s => (
                <button key={s.key}
                  onClick={e => quickStatus(s.key, e)}
                  disabled={changingStatus !== null}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all whitespace-nowrap
                    ${lead.status === s.key
                      ? s.color + ' ring-1 ring-current/50 scale-[1.04]'
                      : s.color + ' opacity-60 hover:opacity-100'}
                    ${changingStatus === s.key ? 'opacity-40 scale-95' : ''}
                  `}>
                  {changingStatus === s.key ? '...' : s.label}
                </button>
              ))}
            </div>
            {/* Primary actions row */}
            <div className="flex flex-wrap gap-1.5">
              {/* WhatsApp — always shown */}
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-500 rounded-full px-3 py-1.5 transition-colors active:scale-95">
                <MessageCircle className="w-3 h-3" /> WhatsApp
              </a>

              {/* Reminder — always shown */}
              <a href={calendarUrl} onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs font-medium text-primary/80 hover:text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1.5 transition-colors">
                <Bell className="w-3 h-3" /> Reminder{!lead.next_action_date ? ' (tomorrow)' : ''}
              </a>

              {/* Call button if has phone */}
              {lead.phone && (
                <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1.5 hover:bg-emerald-500/20 transition-colors">
                  <Phone className="w-3 h-3" /> {lead.phone}
                </a>
              )}

              {/* Email */}
              {lead.email && (
                <a href={`mailto:${lead.email}?subject=Follow up - Pongs Stretch Ceiling&body=Hi ${lead.contact_name.split(' ')[0]},`}
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/20 rounded-full px-2.5 py-1.5 transition-colors">
                  <Mail className="w-3 h-3" /> Email
                </a>
              )}

              {/* LinkedIn */}
              {lead.linkedin_url && (
                <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-1.5 transition-colors">
                  <Link2 className="w-3 h-3" /> LinkedIn <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}

              {lead.deal_value && (
                <span className="flex items-center gap-0.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                  <IndianRupee className="w-3 h-3" />{lead.deal_value.toLocaleString('en-IN')}
                </span>
              )}

              <button onClick={e => { e.stopPropagation(); setEditing(true); }}
                className="flex items-center gap-1 text-xs font-medium text-foreground/60 hover:text-foreground bg-secondary rounded-full px-2.5 py-1 transition-colors ml-auto">
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>

            {/* Manual phone entry when lookup failed */}
            {lookupState === 'not-found' && !lead.phone && (
              <div className="flex gap-2 items-center p-2.5 bg-secondary/50 rounded-xl border border-border">
                <UserX className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-muted-foreground flex-shrink-0">Not in Apollo.</span>
                <input
                  type="tel"
                  placeholder="Enter phone manually..."
                  value={manualPhone}
                  onChange={e => setManualPhone(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
                />
                <button onClick={saveManualPhone} disabled={!manualPhone.trim() || savingPhone}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1 disabled:opacity-40 transition-colors shrink-0">
                  {savingPhone ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Save
                </button>
              </div>
            )}

            {/* Notes — inline editable */}
            <div className="bg-secondary/40 rounded-xl border border-border overflow-hidden">
              {editingNote ? (
                <div className="p-2.5 space-y-1.5">
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => { if (e.key === 'Escape') { setEditingNote(false); setNoteText(lead.notes || ''); } }}
                    rows={3}
                    placeholder="Add a note..."
                    className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none resize-none leading-relaxed"
                    autoFocus
                  />
                  <div className="flex gap-1.5">
                    <button onClick={saveNote} disabled={savingNote}
                      className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1 disabled:opacity-40">
                      {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                    </button>
                    <button onClick={e => { e.stopPropagation(); setEditingNote(false); setNoteText(lead.notes || ''); }}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={e => { e.stopPropagation(); setEditingNote(true); }}
                  className="w-full text-left p-2.5 flex items-start gap-2 hover:bg-secondary/60 transition-colors group">
                  <StickyNote className="w-3 h-3 text-muted-foreground/60 shrink-0 mt-0.5 group-hover:text-primary/60" />
                  {lead.notes
                    ? <span className="text-xs text-muted-foreground leading-relaxed">{lead.notes}</span>
                    : <span className="text-xs text-muted-foreground/40">Add a note...</span>
                  }
                </button>
              )}
            </div>

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
      </div>

      {/* Post-call modal */}
      <PostCallModal
        lead={lead}
        open={showPostCall}
        onClose={() => setShowPostCall(false)}
        onUpdated={updated => handleUpdated(updated)}
      />

      <UpdateLeadModal
        lead={lead}
        open={editing}
        onClose={() => setEditing(false)}
        onUpdated={handleUpdated}
      />
    </>
  );
}
