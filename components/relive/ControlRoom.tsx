'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft, Bell, CalendarDays, LayoutDashboard, ListOrdered, MapPin,
  Megaphone, Radio, Siren, Truck, Users, Wrench, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/relive/client';
import type { Snapshot } from '@/lib/relive/types';
import { Dot, Modal, Pill } from '@/components/relive/bits';
import { Textarea } from '@/components/ui/textarea';
import { OverviewTab } from './OverviewTab';
import { ScheduleTab } from './ScheduleTab';
import { GuestsTab } from './GuestsTab';
import { TransportTab } from './TransportTab';
import { VendorsTab } from './VendorsTab';
import { CuesTab } from './CuesTab';
import { AlertsTab } from './AlertsTab';

export type TabId = 'overview' | 'schedule' | 'guests' | 'transport' | 'vendors' | 'cues' | 'alerts';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'schedule', label: 'Run of Show', icon: ListOrdered },
  { id: 'guests', label: 'Guests', icon: Users },
  { id: 'transport', label: 'Transport', icon: Truck },
  { id: 'vendors', label: 'Vendors', icon: Wrench },
  { id: 'cues', label: 'Cues & SFX', icon: Zap },
  { id: 'alerts', label: 'Alerts', icon: Bell },
];

export type RoomCtx = {
  snap: Snapshot;
  refresh: () => Promise<void>;
  mutate: <T = unknown>(path: string, method: string, body?: unknown) => Promise<T>;
  goTo: (tab: TabId) => void;
};

export function ControlRoom({ eventId }: { eventId: number }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('overview');
  const [clock, setClock] = useState('');
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const base = `/api/relive/events/${eventId}`;
  const snapRef = useRef<Snapshot | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api<Snapshot>(base);
      snapRef.current = data;
      setSnap(data);
      setError(null);
    } catch (e) {
      if (!snapRef.current) setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, [base]);

  const mutate = useCallback(async <T,>(path: string, method: string, body?: unknown): Promise<T> => {
    const result = await api<T>(`${base}${path}`, method, body);
    await refresh();
    return result;
  }, [base, refresh]);

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 12000);
    const tick = setInterval(() => setClock(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })), 1000);
    setClock(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [refresh]);

  const openWarnings = useMemo(
    () => snap?.alerts.filter((a) => a.level !== 'info').length ?? 0,
    [snap]
  );

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-lg">Could not load this event.</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-6" variant="outline" render={<Link href="/relive" />}>Back to events</Button>
      </div>
    );
  }
  if (!snap) {
    return <div className="py-32 text-center text-sm text-muted-foreground">Opening control room…</div>;
  }

  const { event } = snap;
  const ctx: RoomCtx = { snap, refresh, mutate, goTo: setTab };

  async function toggleLive() {
    const next = event.live ? 0 : 1;
    await mutate('', 'PATCH', {
      live: next,
      status: next ? 'live' : event.status === 'live' ? 'planning' : event.status,
      _log: { level: next ? 'info' : 'warn', message: next ? 'Live ops switched ON' : 'Live ops switched OFF' },
    });
    toast.success(next ? 'Live ops ON' : 'Live ops OFF');
  }

  async function panic() {
    await mutate('/alerts', 'POST', { level: 'critical', message: 'PANIC — security & medical teams alerted, all leads to channel 1' });
    toast.error('Panic raised — security & medical alerted');
    setTab('alerts');
  }

  return (
    <div className="mx-auto max-w-7xl px-3 pb-16 pt-5 sm:px-6">
      {/* Header */}
      <header className="mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/relive" className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-muted hover:text-foreground">
            <ArrowLeft className="size-3.5" /> All events
          </Link>
          <span aria-hidden>•</span>
          <span className="inline-flex items-center gap-1 uppercase tracking-[0.2em] text-primary"><Radio className="size-3" /> Relive Control Room</span>
        </div>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{event.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" /> {event.start_date}{event.end_date !== event.start_date ? ` → ${event.end_date}` : ''}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {event.venue}{event.city ? `, ${event.city}` : ''}</span>
              <Pill tone="neutral">{event.type}</Pill>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg border border-border bg-background/40 px-3 py-1.5 text-right">
              <div className="font-mono text-sm tabular-nums">{clock}</div>
              <div className="flex items-center justify-end gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {event.live ? <><Dot tone="ok" pulse /> live ops on</> : <><Dot tone="neutral" /> live ops off</>}
              </div>
            </div>
            <Button variant="outline" onClick={() => setBroadcastOpen(true)}><Megaphone data-icon="inline-start" /> Broadcast</Button>
            <Button variant={event.live ? 'secondary' : 'default'} onClick={toggleLive}>{event.live ? 'Go dark' : 'Go live'}</Button>
            <Button variant="destructive" onClick={panic}><Siren data-icon="inline-start" /> Panic</Button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card/60 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              tab === id ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}>
            <Icon className="size-4" />
            {label}
            {id === 'alerts' && openWarnings > 0 && (
              <span className={`ml-0.5 rounded-full px-1.5 text-[10px] font-semibold tabular-nums ${tab === id ? 'bg-primary-foreground/20' : 'bg-[var(--bad)]/20 text-[var(--bad)]'}`}>
                {openWarnings}
              </span>
            )}
          </button>
        ))}
      </nav>

      {tab === 'overview' && <OverviewTab ctx={ctx} />}
      {tab === 'schedule' && <ScheduleTab ctx={ctx} />}
      {tab === 'guests' && <GuestsTab ctx={ctx} />}
      {tab === 'transport' && <TransportTab ctx={ctx} />}
      {tab === 'vendors' && <VendorsTab ctx={ctx} />}
      {tab === 'cues' && <CuesTab ctx={ctx} />}
      {tab === 'alerts' && <AlertsTab ctx={ctx} />}

      <BroadcastModal open={broadcastOpen} onClose={() => setBroadcastOpen(false)} ctx={ctx} />
    </div>
  );
}

function BroadcastModal({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: RoomCtx }) {
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'guests' | 'vips' | 'crew'>('guests');
  const counts = {
    guests: ctx.snap.guests.length,
    vips: ctx.snap.guests.filter((g) => g.vip).length,
    crew: ctx.snap.vendors.length + ctx.snap.drivers.length,
  };

  async function send() {
    if (!message.trim()) { toast.error('Write a message first'); return; }
    await ctx.mutate('/alerts', 'POST', {
      level: 'info',
      message: `Broadcast to ${audience} (${counts[audience]}): "${message.trim()}"`,
    });
    toast.success(`Broadcast queued to ${counts[audience]} ${audience}`);
    setMessage('');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Broadcast message">
      <div className="space-y-3">
        <div className="flex gap-2">
          {(['guests', 'vips', 'crew'] as const).map((a) => (
            <button key={a} onClick={() => setAudience(a)}
              className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${audience === a ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
              {a} <span className="tabular-nums">({counts[a]})</span>
            </button>
          ))}
        </div>
        <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Dinner is served in the Grand Ballroom — follow the marigold path 🌼" />
        <p className="text-xs text-muted-foreground">Delivery is simulated and logged to the alerts feed — wire an SMS/WhatsApp provider to make it real.</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={send}><Megaphone data-icon="inline-start" /> Send broadcast</Button>
        </div>
      </div>
    </Modal>
  );
}
