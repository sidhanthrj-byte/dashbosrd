'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Info, Send, Siren } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fmtAgo } from '@/lib/relive/client';
import type { AlertLevel } from '@/lib/relive/types';
import { Card, EmptyState, NativeSelect } from './bits';
import type { RoomCtx } from './ControlRoom';

const LEVEL_META: Record<AlertLevel, { icon: React.ComponentType<{ className?: string }>; cls: string; label: string }> = {
  info: { icon: Info, cls: 'text-muted-foreground', label: 'Info' },
  warn: { icon: AlertTriangle, cls: 'text-[var(--warn)]', label: 'Warning' },
  critical: { icon: Siren, cls: 'text-[var(--bad)]', label: 'Critical' },
};

export function AlertsTab({ ctx }: { ctx: RoomCtx }) {
  const { alerts } = ctx.snap;
  const [filter, setFilter] = useState<'all' | AlertLevel>('all');
  const [message, setMessage] = useState('');
  const [level, setLevel] = useState<AlertLevel>('info');

  const list = useMemo(
    () => (filter === 'all' ? alerts : alerts.filter((a) => a.level === filter)),
    [alerts, filter]
  );

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    await ctx.mutate('/alerts', 'POST', { level, message: message.trim() });
    setMessage('');
    toast.success('Logged to the feed');
  }

  return (
    <Card title="Ops feed">
      <form onSubmit={post} className="mb-4 flex gap-2">
        <NativeSelect className="w-28" value={level} onChange={(v) => setLevel(v as AlertLevel)}>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="critical">Critical</option>
        </NativeSelect>
        <Input className="flex-1" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Log a note for the whole ops team…" />
        <Button type="submit"><Send data-icon="inline-start" /> Log</Button>
      </form>

      <div className="mb-3 flex gap-1">
        {(['all', 'info', 'warn', 'critical'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-lg px-2.5 py-1 text-xs capitalize ${filter === f ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-muted'}`}>
            {f}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState>Nothing here — a quiet control room is a good control room.</EmptyState>
      ) : (
        <ul className="divide-y divide-border/60">
          {list.map((a) => {
            const meta = LEVEL_META[a.level as AlertLevel] ?? LEVEL_META.info;
            const Icon = meta.icon;
            return (
              <li key={a.id} className="flex items-start gap-3 py-2.5">
                <Icon className={`mt-0.5 size-4 shrink-0 ${meta.cls}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{a.message}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{meta.label} • {fmtAgo(a.created_at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
