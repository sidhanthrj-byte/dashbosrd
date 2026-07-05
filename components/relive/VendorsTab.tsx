'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Vendor } from '@/lib/relive/types';
import { VENDOR_STATUSES } from '@/lib/relive/types';
import { Card, EmptyState, Field, Modal, NativeSelect, Pill } from './bits';
import type { RoomCtx } from './ControlRoom';

const STATUS_TONE: Record<Vendor['status'], 'ok' | 'warn' | 'bad' | 'neutral' | 'gold'> = {
  pending: 'neutral',
  confirmed: 'gold',
  'on-site': 'ok',
  ready: 'ok',
  issue: 'bad',
};

export function VendorsTab({ ctx }: { ctx: RoomCtx }) {
  const { vendors } = ctx.snap;
  const [addOpen, setAddOpen] = useState(false);

  async function setStatus(v: Vendor, status: string) {
    await ctx.mutate(`/vendors/${v.id}`, 'PATCH', {
      status,
      _log: {
        level: status === 'issue' ? 'warn' : 'info',
        message: `Vendor ${v.name} (${v.role}) → ${status}`,
      },
    });
    if (status === 'issue') toast.warning(`${v.name} flagged with an issue`);
    else toast.success(`${v.name} → ${status}`);
  }

  return (
    <Card title={`Vendors & crew — ${vendors.filter((v) => v.status === 'ready' || v.status === 'on-site').length}/${vendors.length} ready`}
      action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus data-icon="inline-start" /> Add vendor</Button>}>
      {vendors.length === 0 ? (
        <EmptyState>No vendors yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Vendor</th>
                <th className="py-2 pr-3 font-medium">Role</th>
                <th className="hidden py-2 pr-3 font-medium sm:table-cell">Contact</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {vendors.map((v) => (
                <tr key={v.id}>
                  <td className="py-2.5 pr-3">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      {v.status === 'issue' && <AlertTriangle className="size-3.5 text-[var(--bad)]" />}
                      {v.name}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{v.role}</td>
                  <td className="hidden py-2.5 pr-3 text-xs text-muted-foreground sm:table-cell">{v.contact || '—'}</td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <Pill tone={STATUS_TONE[v.status] ?? 'neutral'}>{v.status}</Pill>
                      <NativeSelect className="h-7 w-28 text-xs" value={v.status} onChange={(s) => setStatus(v, s)}>
                        {VENDOR_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </NativeSelect>
                    </div>
                  </td>
                  <td className="py-2.5 text-right">
                    <Button size="icon-xs" variant="ghost" aria-label="Remove vendor" onClick={async () => {
                      await ctx.mutate(`/vendors/${v.id}`, 'DELETE');
                      toast.success(`${v.name} removed`);
                    }}><Trash2 /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AddVendorModal open={addOpen} onClose={() => setAddOpen(false)} ctx={ctx} />
    </Card>
  );
}

function AddVendorModal({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: RoomCtx }) {
  const [form, setForm] = useState({ name: '', role: '', contact: '' });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.role) { toast.error('Name and role are required'); return; }
    await ctx.mutate('/vendors', 'POST', {
      name: form.name, role: form.role, contact: form.contact || null,
      _log: { message: `Vendor added: ${form.name} (${form.role})` },
    });
    toast.success('Vendor added');
    setForm({ name: '', role: '', contact: '' });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add vendor">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Name *"><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="LightCraft" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role *"><Input value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="Lighting" /></Field>
          <Field label="Contact"><Input value={form.contact} onChange={(e) => set('contact', e.target.value)} placeholder="Vivek • +91 …" /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add vendor</Button>
        </div>
      </form>
    </Modal>
  );
}
