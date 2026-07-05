'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, fmtAgo, fmtTime } from '@/lib/relive/client';
import { Card, Dot, EmptyState, Meter, Pill, StatTile } from './bits';
import type { RoomCtx } from './ControlRoom';

export function OverviewTab({ ctx }: { ctx: RoomCtx }) {
  const { snap } = ctx;
  const { guests, vendors, schedule, cues, alerts, drivers } = snap;

  const stats = useMemo(() => {
    const checkedIn = guests.filter((g) => g.checked_in).length;
    const vips = guests.filter((g) => g.vip);
    const vipsIn = vips.filter((g) => g.checked_in).length;
    const noPickup = guests.filter((g) => !g.driver_id).length;
    const vendorsReady = vendors.filter((v) => v.status === 'ready' || v.status === 'on-site').length;
    const vendorIssues = vendors.filter((v) => v.status === 'issue').length;
    const done = schedule.filter((s) => s.status === 'done').length;
    const firedCues = cues.filter((c) => c.status === 'fired').length;
    const dietCounts: Record<string, number> = {};
    for (const g of guests) if (g.diet && g.diet !== 'None') dietCounts[g.diet] = (dietCounts[g.diet] || 0) + 1;
    return { checkedIn, vips, vipsIn, noPickup, vendorsReady, vendorIssues, done, firedCues, dietCounts };
  }, [guests, vendors, schedule, cues]);

  const liveItem = schedule.find((s) => s.status === 'in_progress');
  const nextItem = schedule.find((s) => s.status === 'pending');
  const recentAlerts = alerts.slice(0, 5);
  const maxDiet = Math.max(1, ...Object.values(stats.dietCounts));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Left column — headline stats + now/next */}
      <div className="space-y-4 lg:col-span-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Guests in" value={`${stats.checkedIn}/${guests.length}`}
            sub={`${stats.vipsIn}/${stats.vips.length} VIPs`} tone={stats.vipsIn === stats.vips.length ? 'ok' : 'warn'} />
          <StatTile label="Run of show" value={`${stats.done}/${schedule.length}`}
            sub={liveItem ? 'one segment live' : 'between segments'} tone={liveItem ? 'ok' : undefined} />
          <StatTile label="Vendors ready" value={`${stats.vendorsReady}/${vendors.length}`}
            sub={stats.vendorIssues ? `${stats.vendorIssues} issue(s)` : 'no issues'} tone={stats.vendorIssues ? 'bad' : 'ok'} />
          <StatTile label="Cues fired" value={`${stats.firedCues}/${cues.length}`}
            sub={`${cues.filter((c) => c.status === 'ready').length} armed`} />
        </div>

        <Card title="Now & next" action={
          <Button size="sm" variant="ghost" onClick={() => ctx.goTo('schedule')}>Full run of show <ArrowRight data-icon="inline-end" /></Button>
        }>
          {liveItem ? (
            <div className="rounded-xl border border-[var(--ok)]/40 bg-[var(--ok)]/10 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--ok)]">
                <Dot tone="ok" pulse /> Live now
              </div>
              <div className="mt-1 font-display text-xl font-semibold">{liveItem.title}</div>
              <div className="mt-0.5 text-sm text-muted-foreground">
                {fmtTime(liveItem.start_time)} • {liveItem.duration_min} min • {liveItem.venue}{liveItem.owner ? ` • ${liveItem.owner}` : ''}
              </div>
            </div>
          ) : (
            <EmptyState>No segment is live right now.</EmptyState>
          )}
          {nextItem && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-background/40 p-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Up next</div>
                <div className="mt-0.5 font-medium">{nextItem.title}</div>
                <div className="text-sm text-muted-foreground">{fmtTime(nextItem.start_time)} • {nextItem.venue}</div>
              </div>
              <Button size="sm" variant="outline" onClick={async () => {
                await ctx.mutate(`/schedule/${nextItem.id}`, 'PATCH', {
                  status: 'in_progress',
                  _log: { message: `Segment started: ${nextItem.title}` },
                });
                toast.success(`${nextItem.title} started`);
              }}>Start now</Button>
            </div>
          )}
        </Card>

        <Card title="Check-in progress">
          <div className="flex items-center gap-3">
            <Meter value={stats.checkedIn} max={guests.length} className="h-3 flex-1" />
            <span className="text-sm tabular-nums text-muted-foreground">
              {guests.length ? Math.round((stats.checkedIn / guests.length) * 100) : 0}%
            </span>
          </div>
          <div className="mt-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Dietary plates to stage</div>
            {Object.keys(stats.dietCounts).length === 0 ? (
              <EmptyState>No special dietary requirements.</EmptyState>
            ) : (
              <div className="space-y-1.5">
                {Object.entries(stats.dietCounts).sort((a, b) => b[1] - a[1]).map(([diet, n]) => (
                  <div key={diet} className="flex items-center gap-2 text-sm">
                    <span className="w-24 shrink-0 text-xs text-muted-foreground">{diet}</span>
                    <div className="h-4 flex-1 overflow-hidden rounded bg-background/60">
                      <div className="h-full rounded-r bg-primary/80" style={{ width: `${(n / maxDiet) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Right column — Aura + transport snapshot + alerts */}
      <div className="space-y-4">
        <AuraCard ctx={ctx} />

        <Card title="Transport at a glance" action={
          <Button size="sm" variant="ghost" onClick={() => ctx.goTo('transport')}>Board <ArrowRight data-icon="inline-end" /></Button>
        }>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Fleet</span><span className="tabular-nums">{drivers.length} vehicles</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Guests without pickup</span>
              <span className={`tabular-nums ${stats.noPickup ? 'text-[var(--warn)]' : 'text-[var(--ok)]'}`}>{stats.noPickup}</span></div>
          </div>
        </Card>

        <Card title="Latest alerts" action={
          <Button size="sm" variant="ghost" onClick={() => ctx.goTo('alerts')}>Feed <ArrowRight data-icon="inline-end" /></Button>
        }>
          {recentAlerts.length === 0 ? <EmptyState>All quiet.</EmptyState> : (
            <ul className="space-y-2">
              {recentAlerts.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  {a.level === 'critical' ? <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[var(--bad)]" />
                    : a.level === 'warn' ? <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[var(--warn)]" />
                    : <Dot tone="neutral" />}
                  <span className="flex-1 leading-snug">{a.message}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{fmtAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function AuraCard({ ctx }: { ctx: RoomCtx }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ briefing: string; tips: string[]; source: string } | null>(null);

  async function generate() {
    setLoading(true);
    try {
      const data = await api<{ briefing: string; tips: string[]; source: string }>(
        `/api/relive/events/${ctx.snap.event.id}/aura`, 'POST');
      setResult(data);
    } catch {
      toast.error('Aura briefing failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title={<span className="inline-flex items-center gap-1.5"><Sparkles className="size-4 text-primary" /> Aura briefing</span>}
      action={<Button size="sm" variant="outline" onClick={generate} disabled={loading}>{loading ? 'Reading the room…' : result ? 'Refresh' : 'Generate'}</Button>}>
      {result ? (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed">{result.briefing}</p>
          {result.tips.length > 0 && (
            <ul className="space-y-1.5">
              {result.tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="leading-snug">{t}</span>
                </li>
              ))}
            </ul>
          )}
          <Pill tone={result.source === 'aura' ? 'gold' : 'neutral'}>
            {result.source === 'aura' ? 'AI briefing' : 'Heuristic briefing (no API key set)'}
          </Pill>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aura reads the whole board — check-ins, vendors, run of show, cues, alerts — and hands you a prioritized action list.
        </p>
      )}
    </Card>
  );
}
