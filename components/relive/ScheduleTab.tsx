'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Play, Plus, SkipForward, Trash2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fmtDay, fmtTime } from '@/lib/relive/client';
import type { ScheduleItem } from '@/lib/relive/types';
import { Card, Dot, EmptyState, Field, Modal, Pill } from './bits';
import type { RoomCtx } from './ControlRoom';

const STATUS_META: Record<ScheduleItem['status'], { label: string; tone: 'ok' | 'warn' | 'bad' | 'neutral' | 'gold' }> = {
  pending: { label: 'Pending', tone: 'neutral' },
  in_progress: { label: 'Live', tone: 'ok' },
  done: { label: 'Done', tone: 'gold' },
  skipped: { label: 'Skipped', tone: 'warn' },
};

export function ScheduleTab({ ctx }: { ctx: RoomCtx }) {
  const { schedule } = ctx.snap;
  const [addOpen, setAddOpen] = useState(false);

  // Group by calendar day for multi-day events
  const byDay = new Map<string, ScheduleItem[]>();
  for (const s of schedule) {
    const key = s.start_time.slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(s);
  }

  async function setStatus(item: ScheduleItem, status: ScheduleItem['status'], logMsg?: string) {
    await ctx.mutate(`/schedule/${item.id}`, 'PATCH', {
      status,
      _log: logMsg ? { message: logMsg } : undefined,
    });
    if (logMsg) toast.success(logMsg);
  }

  return (
    <Card title="Run of show" action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus data-icon="inline-start" /> Add segment</Button>}>
      {schedule.length === 0 ? (
        <EmptyState>No segments yet — build the run of show.</EmptyState>
      ) : (
        <div className="space-y-6">
          {[...byDay.entries()].map(([dayKey, items]) => (
            <div key={dayKey}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{fmtDay(dayKey)}</div>
              <ol className="relative space-y-1 border-l border-border pl-4">
                {items.map((item) => {
                  const meta = STATUS_META[item.status];
                  return (
                    <li key={item.id} className={`relative rounded-xl border p-3 pl-4 transition-colors ${
                      item.status === 'in_progress'
                        ? 'border-[var(--ok)]/50 bg-[var(--ok)]/10'
                        : 'border-transparent hover:border-border hover:bg-background/40'
                    }`}>
                      <span className="absolute -left-[21px] top-5"><Dot tone={meta.tone === 'gold' ? 'gold' : meta.tone} pulse={item.status === 'in_progress'} /></span>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs tabular-nums text-muted-foreground">{fmtTime(item.start_time)}</span>
                            <span className={`font-medium ${item.status === 'done' || item.status === 'skipped' ? 'text-muted-foreground line-through decoration-border' : ''}`}>{item.title}</span>
                            <Pill tone={meta.tone}>{item.status === 'in_progress' && <Dot tone="ok" pulse />} {meta.label}</Pill>
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {item.duration_min} min{item.venue ? ` • ${item.venue}` : ''}{item.owner ? ` • ${item.owner}` : ''}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {item.status === 'pending' && (
                            <>
                              <Button size="xs" variant="outline" onClick={() => setStatus(item, 'in_progress', `Segment started: ${item.title}`)}><Play data-icon="inline-start" /> Start</Button>
                              <Button size="xs" variant="ghost" onClick={() => setStatus(item, 'skipped', `Segment skipped: ${item.title}`)}><SkipForward data-icon="inline-start" /> Skip</Button>
                            </>
                          )}
                          {item.status === 'in_progress' && (
                            <Button size="xs" onClick={() => setStatus(item, 'done', `Segment completed: ${item.title}`)}><Check data-icon="inline-start" /> Complete</Button>
                          )}
                          {(item.status === 'done' || item.status === 'skipped') && (
                            <Button size="xs" variant="ghost" onClick={() => setStatus(item, 'pending')}><Undo2 data-icon="inline-start" /> Reopen</Button>
                          )}
                          <Button size="icon-xs" variant="ghost" aria-label="Delete segment" onClick={async () => {
                            await ctx.mutate(`/schedule/${item.id}`, 'DELETE');
                            toast.success('Segment removed');
                          }}><Trash2 /></Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
      <AddSegmentModal open={addOpen} onClose={() => setAddOpen(false)} ctx={ctx} />
    </Card>
  );
}

function AddSegmentModal({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: RoomCtx }) {
  const defaultDate = ctx.snap.event.start_date;
  const [form, setForm] = useState({ title: '', date: defaultDate, time: '18:00', duration_min: '30', venue: '', owner: '' });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) { toast.error('Title is required'); return; }
    const start = new Date(`${form.date}T${form.time || '00:00'}`);
    await ctx.mutate('/schedule', 'POST', {
      title: form.title,
      start_time: start.toISOString(),
      duration_min: Number(form.duration_min) || 30,
      venue: form.venue || null,
      owner: form.owner || null,
      sort: ctx.snap.schedule.length,
      _log: { message: `Segment added: ${form.title}` },
    });
    toast.success('Segment added');
    setForm({ title: '', date: defaultDate, time: '18:00', duration_min: '30', venue: '', owner: '' });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add segment">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Title *"><Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Cake cutting" /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></Field>
          <Field label="Time"><Input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} /></Field>
          <Field label="Duration (min)"><Input type="number" min={5} value={form.duration_min} onChange={(e) => set('duration_min', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Venue"><Input value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="Grand ballroom" /></Field>
          <Field label="Owner"><Input value={form.owner} onChange={(e) => set('owner', e.target.value)} placeholder="Stage manager" /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add segment</Button>
        </div>
      </form>
    </Modal>
  );
}
