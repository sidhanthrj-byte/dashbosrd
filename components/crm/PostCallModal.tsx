'use client';

import { useState } from 'react';
import { Lead } from '@/lib/db';
import { toast } from 'sonner';
import { X, CheckCircle2, PhoneOff, Clock, Loader2 } from 'lucide-react';

type Props = {
  lead: Lead;
  open: boolean;
  onClose: () => void;
  onUpdated: (lead: Lead) => void;
};

const OUTCOMES = [
  { id: 'first_call_done', label: 'Connected!', sub: 'Had a conversation', icon: <CheckCircle2 className="w-5 h-5" />, color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' },
  { id: 'call_back_requested', label: 'Call Back', sub: 'Asked to call later', icon: <Clock className="w-5 h-5" />, color: 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' },
  { id: 'voicemail', label: 'No Answer', sub: "Didn't pick up", icon: <PhoneOff className="w-5 h-5" />, color: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20' },
  { id: 'not_interested', label: 'Not Interested', sub: 'Not a fit right now', icon: <X className="w-5 h-5" />, color: 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20' },
];

export function PostCallModal({ lead, open, onClose, onUpdated }: Props) {
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!outcome || outcome === 'voicemail') {
      // For voicemail/no-answer, just reschedule in 2 days without changing status
      if (outcome === 'voicemail') {
        setSaving(true);
        const reschedDate = new Date();
        reschedDate.setDate(reschedDate.getDate() + 2);
        const dateStr = reschedDate.toISOString().split('T')[0];
        try {
          const res = await fetch(`/api/leads/${lead.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ next_action_date: dateStr, notes: notes || undefined }),
          });
          const data = await res.json();
          if (res.ok) { toast.success('Rescheduled in 2 days'); onUpdated(data.lead); onClose(); setNotes(''); setOutcome(''); }
        } catch {}
        setSaving(false);
      }
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: outcome, notes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const followUp = data.lead?.next_action_date;
      toast.success(
        followUp
          ? `Logged! Follow-up reminder set for ${new Date(followUp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
          : 'Logged! AI next steps generated.',
        { icon: '✨' }
      );
      onUpdated(data.lead);
      onClose();
      setNotes('');
      setOutcome('');
    } catch (err) {
      toast.error('Failed to save: ' + String(err));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl p-4 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-foreground text-sm">Call with {lead.contact_name.split(' ')[0]}</p>
            <p className="text-xs text-muted-foreground">{lead.company_name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">How did it go?</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {OUTCOMES.map(o => (
            <button key={o.id} onClick={() => setOutcome(o.id)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${outcome === o.id ? o.color + ' ring-1 ring-current' : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'}`}>
              <span className={outcome === o.id ? '' : 'opacity-50'}>{o.icon}</span>
              <div>
                <p className="text-xs font-semibold leading-none">{o.label}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{o.sub}</p>
              </div>
            </button>
          ))}
        </div>

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Quick note... (optional)"
          rows={2}
          className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/40 mb-3"
        />

        <button onClick={save} disabled={!outcome || saving}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 transition-colors hover:bg-primary/90">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Log Outcome'}
        </button>
      </div>
    </>
  );
}
