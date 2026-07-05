'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Crown, Download, Plus, Search, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { fmtAgo } from '@/lib/relive/client';
import type { Guest } from '@/lib/relive/types';
import { DIETS } from '@/lib/relive/types';
import { Card, EmptyState, Field, Modal, NativeSelect, Pill } from './bits';
import type { RoomCtx } from './ControlRoom';

type Filter = 'all' | 'vip' | 'checked_in' | 'not_in' | 'no_pickup';

export function GuestsTab({ ctx }: { ctx: RoomCtx }) {
  const { guests, drivers } = ctx.snap;
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Guest | null>(null);

  const driverName = useMemo(() => new Map(drivers.map((d) => [d.id, d.name])), [drivers]);

  const list = useMemo(() => {
    let l = guests;
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      l = l.filter((g) => g.name.toLowerCase().includes(needle) || (g.seat ?? '').toLowerCase().includes(needle) || (g.grp ?? '').toLowerCase().includes(needle));
    }
    if (filter === 'vip') l = l.filter((g) => g.vip);
    if (filter === 'checked_in') l = l.filter((g) => g.checked_in);
    if (filter === 'not_in') l = l.filter((g) => !g.checked_in);
    if (filter === 'no_pickup') l = l.filter((g) => !g.driver_id);
    return l;
  }, [guests, q, filter]);

  const checkedIn = guests.filter((g) => g.checked_in).length;

  async function toggleCheckIn(g: Guest) {
    const next = g.checked_in ? 0 : 1;
    await ctx.mutate(`/guests/${g.id}`, 'PATCH', {
      checked_in: next,
      checked_in_at: next ? new Date().toISOString() : null,
      _log: {
        message: next
          ? `${g.name} checked in${g.vip ? ' — VIP welcome protocol triggered' : ''}`
          : `${g.name} checked out`,
      },
    });
    toast.success(next ? `${g.name} checked in` : `${g.name} checked out`);
  }

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: `All (${guests.length})` },
    { id: 'vip', label: `VIP (${guests.filter((g) => g.vip).length})` },
    { id: 'checked_in', label: `In (${checkedIn})` },
    { id: 'not_in', label: `Expected (${guests.length - checkedIn})` },
    { id: 'no_pickup', label: `No pickup (${guests.filter((g) => !g.driver_id).length})` },
  ];

  return (
    <Card
      title={`Guest list — ${checkedIn}/${guests.length} in`}
      action={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => window.open(`/api/relive/events/${ctx.snap.event.id}/guests/export`, '_blank')}>
            <Download data-icon="inline-start" /> CSV
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}><Plus data-icon="inline-start" /> Add guest</Button>
        </div>
      }>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search name, seat or group…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`rounded-lg px-2.5 py-1 text-xs tabular-nums ${filter === f.id ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-muted'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState>No guests match.</EmptyState>
      ) : (
        <ul className="divide-y divide-border/60">
          {list.map((g) => (
            <li key={g.id} className="flex items-center gap-3 py-2.5">
              <button className="min-w-0 flex-1 text-left" onClick={() => setSelected(g)}>
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{g.name}</span>
                  {g.vip === 1 && <Pill tone="gold"><Crown className="size-3" /> VIP</Pill>}
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {g.grp}{g.seat ? ` • Seat ${g.seat}` : ''}{g.diet !== 'None' ? ` • ${g.diet}` : ''}
                  {g.driver_id ? ` • 🚐 ${driverName.get(g.driver_id) ?? 'assigned'}${g.pickup_eta ? ` (${g.pickup_eta})` : ''}` : ' • no pickup'}
                </div>
              </button>
              {g.checked_in ? (
                <Pill tone="ok"><UserCheck className="size-3" /> In{g.checked_in_at ? ` • ${fmtAgo(g.checked_in_at)}` : ''}</Pill>
              ) : null}
              <Button size="xs" variant={g.checked_in ? 'ghost' : 'default'} onClick={() => toggleCheckIn(g)}>
                {g.checked_in ? 'Undo' : 'Check in'}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AddGuestModal open={addOpen} onClose={() => setAddOpen(false)} ctx={ctx} />
      {selected && <GuestModal guest={guests.find((x) => x.id === selected.id) ?? selected} onClose={() => setSelected(null)} ctx={ctx} />}
    </Card>
  );
}

function AddGuestModal({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: RoomCtx }) {
  const [form, setForm] = useState({ name: '', grp: '', seat: '', diet: 'None', phone: '', vip: false });
  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    await ctx.mutate('/guests', 'POST', {
      name: form.name.trim(), grp: form.grp || null, seat: form.seat || null,
      diet: form.diet, phone: form.phone || null, vip: form.vip ? 1 : 0,
      _log: { message: `Guest added: ${form.name.trim()}` },
    });
    toast.success('Guest added');
    setForm({ name: '', grp: '', seat: '', diet: 'None', phone: '', vip: false });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add guest">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Name *"><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Group / side"><Input value={form.grp} onChange={(e) => set('grp', e.target.value)} placeholder="Bride's side" /></Field>
          <Field label="Seat"><Input value={form.seat} onChange={(e) => set('seat', e.target.value)} placeholder="T4-2" /></Field>
          <Field label="Diet">
            <NativeSelect value={form.diet} onChange={(v) => set('diet', v)}>
              {DIETS.map((d) => <option key={d} value={d}>{d}</option>)}
            </NativeSelect>
          </Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 …" /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.vip} onChange={(e) => set('vip', e.target.checked)} className="size-4 accent-[var(--primary)]" />
          VIP guest
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add guest</Button>
        </div>
      </form>
    </Modal>
  );
}

function GuestModal({ guest, onClose, ctx }: { guest: Guest; onClose: () => void; ctx: RoomCtx }) {
  const { drivers } = ctx.snap;
  const [notes, setNotes] = useState(guest.notes ?? '');

  async function assignDriver(driverId: string) {
    const idNum = driverId ? Number(driverId) : null;
    const d = drivers.find((x) => x.id === idNum);
    await ctx.mutate(`/guests/${guest.id}`, 'PATCH', {
      driver_id: idNum,
      pickup_eta: idNum ? `${10 + Math.floor(Math.random() * 30)} min` : null,
      _log: { message: idNum ? `Pickup assigned: ${guest.name} → ${d?.name}` : `Pickup removed for ${guest.name}` },
    });
    toast.success(idNum ? `Assigned to ${d?.name}` : 'Pickup removed');
  }

  const load = (id: number) => ctx.snap.guests.filter((g) => g.driver_id === id).length;

  return (
    <Modal open onClose={onClose} title={<span className="inline-flex items-center gap-2">{guest.name}{guest.vip === 1 && <Pill tone="gold"><Crown className="size-3" /> VIP</Pill>}</span>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-xs text-muted-foreground">Group</span><div>{guest.grp || '—'}</div></div>
          <div><span className="text-xs text-muted-foreground">Seat</span><div>{guest.seat || '—'}</div></div>
          <div><span className="text-xs text-muted-foreground">Diet</span><div>{guest.diet}</div></div>
          <div><span className="text-xs text-muted-foreground">Phone</span><div>{guest.phone || '—'}</div></div>
          <div><span className="text-xs text-muted-foreground">Status</span>
            <div>{guest.checked_in ? <Pill tone="ok">Checked in {guest.checked_in_at ? fmtAgo(guest.checked_in_at) : ''}</Pill> : <Pill tone="neutral">Expected</Pill>}</div>
          </div>
          <div><span className="text-xs text-muted-foreground">Pickup ETA</span><div>{guest.pickup_eta || '—'}</div></div>
        </div>

        <Field label="Pickup driver">
          <NativeSelect value={guest.driver_id ? String(guest.driver_id) : ''} onChange={assignDriver}>
            <option value="">No pickup</option>
            {drivers.map((d) => (
              <option key={d.id} value={String(d.id)}>{d.name} — {d.vehicle} ({load(d.id)}/{d.capacity})</option>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Notes">
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Wheelchair access at ramp 2, prefers front table…" />
        </Field>
        <div className="flex justify-between gap-2">
          <Button variant="destructive" size="sm" onClick={async () => {
            await ctx.mutate(`/guests/${guest.id}`, 'DELETE');
            toast.success('Guest removed');
            onClose();
          }}>Remove guest</Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <Button onClick={async () => {
              await ctx.mutate(`/guests/${guest.id}`, 'PATCH', { notes });
              toast.success('Notes saved');
              onClose();
            }}>Save</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
