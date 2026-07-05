'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CalendarDays, MapPin, Plus, Radio, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, fmtDay } from '@/lib/relive/client';
import type { EventSummary } from '@/lib/relive/types';
import { EVENT_TYPES } from '@/lib/relive/types';
import { Dot, Field, Meter, Modal, NativeSelect, Pill } from '@/components/relive/bits';

export function EventsHome() {
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<{ events: EventSummary[] }>('/api/relive/events');
      setEvents(data.events);
    } catch {
      toast.error('Could not load events');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            <Radio className="size-3.5" /> Relive Events
          </div>
          <h1 className="font-display text-4xl font-semibold">Control Room</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every event, one command center — guests, run of show, transport, vendors and cues.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus data-icon="inline-start" /> New event</Button>
      </header>

      {events === null ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading events…</div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center text-muted-foreground">
          No events yet — create your first one.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((e) => (
            <Link key={e.id} href={`/relive/events/${e.id}`}
              className="group rounded-2xl border border-border bg-card/80 p-5 shadow-lg shadow-black/10 transition-colors hover:border-primary/50">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Pill tone={e.status === 'live' ? 'ok' : e.status === 'wrapped' ? 'neutral' : 'gold'}>
                  {e.status === 'live' && <Dot tone="ok" pulse />} {e.status.toUpperCase()}
                </Pill>
                <span className="text-xs text-muted-foreground">{e.type}</span>
              </div>
              <h2 className="font-display text-2xl font-semibold group-hover:text-primary">{e.title}</h2>
              {e.tagline && <p className="mt-0.5 text-sm text-muted-foreground">{e.tagline}</p>}
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><CalendarDays className="size-3.5" /> {fmtDay(e.start_date)}{e.end_date !== e.start_date ? ` – ${fmtDay(e.end_date)}` : ''}</div>
                <div className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {e.venue}{e.city ? `, ${e.city}` : ''}</div>
                <div className="flex items-center gap-1.5"><Users className="size-3.5" /> {e.checked_in}/{e.guest_count} guests checked in • {e.vendor_count} vendors</div>
              </div>
              <Meter value={e.checked_in} max={e.guest_count} className="mt-3" />
            </Link>
          ))}
        </div>
      )}

      <CreateEventModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        Relive Events — internal ops platform. SFX triggers are simulated; never connect real pyro without hardware interlocks.
      </footer>
    </div>
  );
}

function CreateEventModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', tagline: '', type: 'Wedding', start_date: '', end_date: '', venue: '', city: '' });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.start_date || !form.venue) {
      toast.error('Title, start date and venue are required');
      return;
    }
    setLoading(true);
    try {
      await api('/api/relive/events', 'POST', form);
      toast.success('Event created');
      setForm({ title: '', tagline: '', type: 'Wedding', start_date: '', end_date: '', venue: '', city: '' });
      onClose();
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New event">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Event title *"><Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Aisha ❤ Rohan" /></Field>
        <Field label="Tagline"><Input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="A weekend by the sea" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <NativeSelect value={form.type} onChange={(v) => set('type', v)}>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </NativeSelect>
          </Field>
          <Field label="City"><Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Bengaluru" /></Field>
          <Field label="Start date *"><Input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} /></Field>
          <Field label="End date"><Input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} /></Field>
        </div>
        <Field label="Venue *"><Input value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="JW Marriott Prestige Golfshire" /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create event'}</Button>
        </div>
      </form>
    </Modal>
  );
}
