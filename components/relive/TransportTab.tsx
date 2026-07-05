'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Phone, Plus, Trash2, Truck, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, EmptyState, Field, Meter, Modal, Pill } from './bits';
import type { RoomCtx } from './ControlRoom';

export function TransportTab({ ctx }: { ctx: RoomCtx }) {
  const { drivers, guests } = ctx.snap;
  const [addOpen, setAddOpen] = useState(false);
  const unassigned = guests.filter((g) => !g.driver_id);

  // Fill vehicles with the most free capacity first.
  async function autoAssign() {
    if (unassigned.length === 0) { toast.info('Everyone has a pickup'); return; }
    if (drivers.length === 0) { toast.error('Add a driver first'); return; }
    const loads = new Map(drivers.map((d) => [d.id, guests.filter((g) => g.driver_id === d.id).length]));
    let assigned = 0;
    for (const g of unassigned) {
      const candidates = drivers.filter((d) => (loads.get(d.id) ?? 0) < d.capacity);
      if (candidates.length === 0) break;
      const best = candidates.reduce((a, b) =>
        (b.capacity - (loads.get(b.id) ?? 0)) > (a.capacity - (loads.get(a.id) ?? 0)) ? b : a);
      await ctx.mutate(`/guests/${g.id}`, 'PATCH', {
        driver_id: best.id,
        pickup_eta: `${10 + Math.floor(Math.random() * 30)} min`,
      });
      loads.set(best.id, (loads.get(best.id) ?? 0) + 1);
      assigned++;
    }
    await ctx.mutate('/alerts', 'POST', { level: 'info', message: `Auto-assign: ${assigned} pickups distributed across the fleet` });
    toast.success(`${assigned} pickups assigned`);
    if (assigned < unassigned.length) toast.warning('Fleet is at capacity — some guests still need a ride');
  }

  return (
    <div className="space-y-4">
      <Card title={`Fleet — ${drivers.length} vehicles`}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={autoAssign}><Wand2 data-icon="inline-start" /> Auto-assign ({unassigned.length})</Button>
            <Button size="sm" onClick={() => setAddOpen(true)}><Plus data-icon="inline-start" /> Add vehicle</Button>
          </div>
        }>
        {drivers.length === 0 ? (
          <EmptyState>No vehicles yet — add your fleet to start assigning pickups.</EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {drivers.map((d) => {
              const riders = guests.filter((g) => g.driver_id === d.id);
              const full = riders.length >= d.capacity;
              return (
                <div key={d.id} className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 font-medium"><Truck className="size-4 text-primary" /> {d.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{d.vehicle}</div>
                      {d.phone && <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground"><Phone className="size-3" /> {d.phone}</div>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Pill tone={full ? 'warn' : 'ok'}>{riders.length}/{d.capacity}</Pill>
                      <Button size="icon-xs" variant="ghost" aria-label="Remove vehicle" onClick={async () => {
                        await ctx.mutate(`/drivers/${d.id}`, 'DELETE');
                        toast.success(`${d.name} removed — riders unassigned`);
                      }}><Trash2 /></Button>
                    </div>
                  </div>
                  <Meter value={riders.length} max={d.capacity} className="mt-3" />
                  {riders.length > 0 && (
                    <ul className="mt-3 max-h-36 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                      {riders.map((g) => (
                        <li key={g.id} className="flex items-center justify-between gap-2">
                          <span className="truncate">{g.name}{g.seat ? ` (${g.seat})` : ''}</span>
                          <button
                            className="shrink-0 rounded px-1.5 py-0.5 hover:bg-muted hover:text-foreground"
                            onClick={async () => {
                              await ctx.mutate(`/guests/${g.id}`, 'PATCH', { driver_id: null, pickup_eta: null });
                              toast.success(`${g.name} unassigned`);
                            }}>
                            unassign
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {unassigned.length > 0 && (
        <Card title={`Awaiting pickup — ${unassigned.length}`}>
          <div className="flex flex-wrap gap-1.5">
            {unassigned.map((g) => <Pill key={g.id} tone="neutral">{g.name}</Pill>)}
          </div>
        </Card>
      )}

      <AddDriverModal open={addOpen} onClose={() => setAddOpen(false)} ctx={ctx} />
    </div>
  );
}

function AddDriverModal({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: RoomCtx }) {
  const [form, setForm] = useState({ name: '', vehicle: '', capacity: '6', phone: '' });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.vehicle) { toast.error('Name and vehicle are required'); return; }
    await ctx.mutate('/drivers', 'POST', {
      name: form.name, vehicle: form.vehicle, capacity: Number(form.capacity) || 4, phone: form.phone || null,
      _log: { message: `Vehicle added to fleet: ${form.vehicle} (${form.name})` },
    });
    toast.success('Vehicle added');
    setForm({ name: '', vehicle: '', capacity: '6', phone: '' });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add vehicle">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Driver name *"><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Capacity"><Input type="number" min={1} value={form.capacity} onChange={(e) => set('capacity', e.target.value)} /></Field>
        </div>
        <Field label="Vehicle *"><Input value={form.vehicle} onChange={(e) => set('vehicle', e.target.value)} placeholder="Innova Crysta • KA01 AB 1234" /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 …" /></Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add vehicle</Button>
        </div>
      </form>
    </Modal>
  );
}
