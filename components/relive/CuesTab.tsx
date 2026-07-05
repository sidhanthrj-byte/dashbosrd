'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Flame, Lightbulb, Lock, LockOpen, Music, Plus, Sparkles, Trash2, Video, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fmtAgo } from '@/lib/relive/client';
import type { Cue } from '@/lib/relive/types';
import { CUE_DEPARTMENTS } from '@/lib/relive/types';
import { Card, EmptyState, Field, Modal, NativeSelect, Pill } from './bits';
import type { RoomCtx } from './ControlRoom';

const DEPT_ICON: Record<Cue['department'], React.ComponentType<{ className?: string }>> = {
  audio: Music,
  lighting: Lightbulb,
  video: Video,
  sfx: Sparkles,
  stage: Zap,
};

export function CuesTab({ ctx }: { ctx: RoomCtx }) {
  const { cues, event } = ctx.snap;
  const [addOpen, setAddOpen] = useState(false);
  const [confirmPyro, setConfirmPyro] = useState(false);
  const safetyOn = event.safety_on === 1;

  async function fire(cue: Cue) {
    await ctx.mutate(`/cues/${cue.id}`, 'PATCH', {
      status: 'fired',
      fired_at: new Date().toISOString(),
      _log: { message: `Cue ${cue.number} fired: ${cue.name} [${cue.department}]` },
    });
    toast.success(`GO — ${cue.number} ${cue.name}`);
  }

  async function arm(cue: Cue, ready: boolean) {
    await ctx.mutate(`/cues/${cue.id}`, 'PATCH', { status: ready ? 'ready' : 'standby' });
  }

  async function toggleSafety() {
    const next = safetyOn ? 0 : 1;
    await ctx.mutate('', 'PATCH', {
      safety_on: next,
      _log: { level: next ? 'info' : 'warn', message: next ? 'SFX safety interlock ENGAGED' : 'SFX safety interlock RELEASED — pyro armed' },
    });
    if (next) toast.success('Safety interlock engaged');
    else toast.warning('Safety released — pyro can fire');
  }

  async function fireSfx(name: string, needsSafety: boolean) {
    if (needsSafety && safetyOn) {
      toast.error('Blocked by safety interlock — release it first');
      return;
    }
    await ctx.mutate('/alerts', 'POST', { level: 'warn', message: `SFX fired: ${name} (simulated)` });
    toast.success(`${name} fired (simulated)`);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2" title="Cue stack"
        action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus data-icon="inline-start" /> Add cue</Button>}>
        {cues.length === 0 ? (
          <EmptyState>No cues in the stack.</EmptyState>
        ) : (
          <ul className="space-y-1.5">
            {cues.map((c) => {
              const Icon = DEPT_ICON[c.department] ?? Zap;
              return (
                <li key={c.id} className={`flex items-center gap-3 rounded-xl border p-3 ${
                  c.status === 'ready' ? 'border-primary/40 bg-primary/5' : 'border-border bg-background/40'
                } ${c.status === 'fired' ? 'opacity-60' : ''}`}>
                  <span className="w-10 shrink-0 font-mono text-xs font-semibold text-primary">{c.number}</span>
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className={`truncate font-medium ${c.status === 'fired' ? 'line-through decoration-border' : ''}`}>{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.department}{c.fired_at ? ` • fired ${fmtAgo(c.fired_at)}` : ''}</div>
                  </div>
                  {c.status === 'standby' && <Button size="xs" variant="outline" onClick={() => arm(c, true)}>Arm</Button>}
                  {c.status === 'ready' && (
                    <>
                      <Button size="xs" variant="ghost" onClick={() => arm(c, false)}>Stand down</Button>
                      <Button size="xs" onClick={() => fire(c)}>GO</Button>
                    </>
                  )}
                  {c.status === 'fired' && <Pill tone="gold">Fired</Pill>}
                  <Button size="icon-xs" variant="ghost" aria-label="Delete cue" onClick={async () => {
                    await ctx.mutate(`/cues/${c.id}`, 'DELETE');
                    toast.success('Cue removed');
                  }}><Trash2 /></Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="space-y-4">
        <Card title="Safety interlock">
          <button onClick={toggleSafety}
            className={`flex w-full items-center justify-between rounded-xl border p-4 transition-colors ${
              safetyOn ? 'border-[var(--ok)]/40 bg-[var(--ok)]/10' : 'border-[var(--bad)]/50 bg-[var(--bad)]/10'
            }`}>
            <span className="flex items-center gap-2 font-medium">
              {safetyOn ? <Lock className="size-4 text-[var(--ok)]" /> : <LockOpen className="size-4 text-[var(--bad)]" />}
              {safetyOn ? 'ENGAGED' : 'RELEASED'}
            </span>
            <span className="text-xs text-muted-foreground">tap to {safetyOn ? 'release' : 'engage'}</span>
          </button>
          <p className="mt-2 text-xs text-muted-foreground">Pyro triggers are blocked while the interlock is engaged. All triggers here are simulated.</p>
        </Card>

        <Card title="Instant SFX">
          <div className="space-y-2">
            <Button className="w-full" variant="outline" onClick={() => fireSfx('Confetti blast', false)}>
              <Sparkles data-icon="inline-start" /> Confetti
            </Button>
            <Button className="w-full" variant="outline" onClick={() => fireSfx('Cold sparks', false)}>
              <Zap data-icon="inline-start" /> Cold sparks
            </Button>
            <Button className="w-full" variant={safetyOn ? 'secondary' : 'destructive'} onClick={() => {
              if (safetyOn) { toast.error('Blocked by safety interlock'); return; }
              setConfirmPyro(true);
            }}>
              <Flame data-icon="inline-start" /> Pyro {safetyOn && <Lock className="size-3" />}
            </Button>
          </div>
        </Card>
      </div>

      <AddCueModal open={addOpen} onClose={() => setAddOpen(false)} ctx={ctx} />

      <Modal open={confirmPyro} onClose={() => setConfirmPyro(false)} title="Fire pyro?">
        <p className="text-sm text-muted-foreground">Safety is released. Confirm you have visual on the pyro zone and the area is clear.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmPyro(false)}>Cancel</Button>
          <Button variant="destructive" onClick={async () => { setConfirmPyro(false); await fireSfx('PYRO', true); }}>
            <Flame data-icon="inline-start" /> Fire pyro
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function AddCueModal({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: RoomCtx }) {
  const nextNum = `Q${String(ctx.snap.cues.length + 1).padStart(2, '0')}`;
  const [form, setForm] = useState({ number: nextNum, name: '', department: 'stage' });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { toast.error('Cue name is required'); return; }
    await ctx.mutate('/cues', 'POST', {
      number: form.number || nextNum, name: form.name, department: form.department,
      sort: ctx.snap.cues.length,
      _log: { message: `Cue added: ${form.number} ${form.name}` },
    });
    toast.success('Cue added');
    setForm({ number: `Q${String(ctx.snap.cues.length + 2).padStart(2, '0')}`, name: '', department: 'stage' });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add cue">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Number"><Input value={form.number} onChange={(e) => set('number', e.target.value)} /></Field>
          <div className="col-span-2">
            <Field label="Department">
              <NativeSelect value={form.department} onChange={(v) => set('department', v)}>
                {CUE_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </NativeSelect>
            </Field>
          </div>
        </div>
        <Field label="Name *"><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Bride entrance — spotlight + petals" /></Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add cue</Button>
        </div>
      </form>
    </Modal>
  );
}
