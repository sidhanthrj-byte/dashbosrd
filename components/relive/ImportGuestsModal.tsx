'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileSpreadsheet, FileUp, Download, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Modal, Pill } from './bits';
import type { RoomCtx } from './ControlRoom';

type ParsedGuest = { name: string; grp: string | null; seat: string | null; diet: string | null; phone: string | null; vip: number };

// Header synonyms → our fields. Matching is lowercase / punctuation-insensitive.
const FIELD_MATCHERS: { field: keyof ParsedGuest; keys: string[] }[] = [
  { field: 'name', keys: ['name', 'guest', 'guestname', 'fullname', 'guest name'] },
  { field: 'grp', keys: ['group', 'grp', 'side', 'category', 'table group', 'party'] },
  { field: 'seat', keys: ['seat', 'table', 'seatno', 'seat no', 'table no', 'seatnumber'] },
  { field: 'diet', keys: ['diet', 'dietary', 'meal', 'food', 'dietary requirement', 'dietary requirements', 'preference'] },
  { field: 'phone', keys: ['phone', 'mobile', 'contact', 'number', 'phone number', 'cell', 'whatsapp'] },
  { field: 'vip', keys: ['vip', 'isvip', 'priority', 'vvip'] },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function mapRow(raw: Record<string, unknown>): ParsedGuest {
  const out: Record<string, unknown> = {};
  const entries = Object.entries(raw);
  for (const { field, keys } of FIELD_MATCHERS) {
    const wanted = keys.map(norm);
    const hit = entries.find(([h]) => wanted.includes(norm(h)));
    if (hit) out[field] = hit[1];
  }
  return {
    name: String(out.name ?? '').trim(),
    grp: out.grp != null && String(out.grp).trim() ? String(out.grp).trim() : null,
    seat: out.seat != null && String(out.seat).trim() ? String(out.seat).trim() : null,
    diet: out.diet != null && String(out.diet).trim() ? String(out.diet).trim() : null,
    phone: out.phone != null && String(out.phone).trim() ? String(out.phone).trim() : null,
    vip: (() => {
      const v = String(out.vip ?? '').trim().toLowerCase();
      return v === 'yes' || v === 'y' || v === 'true' || v === '1' || v === 'vip' ? 1 : 0;
    })(),
  };
}

export function ImportGuestsModal({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: RoomCtx }) {
  const [rows, setRows] = useState<ParsedGuest[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [detectedCols, setDetectedCols] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setRows(null); setFileName(''); setDetectedCols([]);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function onFile(file: File) {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      if (json.length === 0) { toast.error('That sheet looks empty'); return; }
      setDetectedCols(Object.keys(json[0]));
      const mapped = json.map(mapRow).filter((g) => g.name);
      if (mapped.length === 0) {
        toast.error('No rows with a name found — check your columns');
        return;
      }
      setRows(mapped);
      setFileName(file.name);
    } catch {
      toast.error('Could not read that file');
    }
  }

  async function doImport() {
    if (!rows) return;
    setLoading(true);
    try {
      const res = await ctx.mutate<{ inserted: number; skipped: number }>('/guests/bulk', 'POST', { guests: rows });
      toast.success(`${res.inserted} guests imported${res.skipped ? ` • ${res.skipped} skipped` : ''}`);
      reset();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Name', 'Group', 'Seat', 'Diet', 'Phone', 'VIP'],
      ['Aisha Kapoor', "Bride's side", 'T1-2', 'Vegetarian', '+91 98000 12345', 'yes'],
      ['Rohan Mehta', "Groom's side", 'T3-5', 'None', '+91 98000 67890', 'no'],
    ]);
    ws['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 6 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guests');
    XLSX.writeFile(wb, 'relive-guest-template.xlsx');
  }

  const vipCount = rows?.filter((g) => g.vip).length ?? 0;

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Import guests from a spreadsheet" wide>
      <div className="space-y-4">
        {!rows ? (
          <>
            <button
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-10 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
              <FileUp className="size-8 text-primary" />
              <span className="font-medium">Choose an Excel or CSV file</span>
              <span className="text-xs text-muted-foreground">.xlsx, .xls or .csv — parsed right here in your browser</span>
            </button>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />

            <div className="rounded-xl border border-border bg-background/40 p-4 text-sm">
              <div className="mb-1 font-medium">Expected columns</div>
              <p className="text-xs text-muted-foreground">
                <strong>Name</strong> (required), plus optional <strong>Group</strong>, <strong>Seat</strong>,
                {' '}<strong>Diet</strong>, <strong>Phone</strong>, <strong>VIP</strong>. Header names are matched
                flexibly (e.g. “Guest Name”, “Side”, “Table”, “Mobile”, “Dietary” all work).
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={downloadTemplate}>
                <Download data-icon="inline-start" /> Download template
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--ok)]/40 bg-[var(--ok)]/10 p-3 text-sm">
              <CheckCircle2 className="size-4 text-[var(--ok)]" />
              <span className="font-medium">{fileName}</span>
              <Pill tone="ok">{rows.length} guests</Pill>
              {vipCount > 0 && <Pill tone="gold">{vipCount} VIP</Pill>}
              <button className="ml-auto text-xs text-muted-foreground underline hover:text-foreground" onClick={reset}>choose a different file</button>
            </div>

            <div className="text-xs text-muted-foreground">
              Detected columns: {detectedCols.map((c) => <span key={c} className="mr-1 inline-block rounded bg-muted px-1.5 py-0.5">{c}</span>)}
            </div>

            <div className="max-h-64 overflow-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Group</th>
                    <th className="px-3 py-2 font-medium">Seat</th>
                    <th className="px-3 py-2 font-medium">Diet</th>
                    <th className="px-3 py-2 font-medium">VIP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rows.slice(0, 50).map((g, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5">{g.name}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{g.grp || '—'}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{g.seat || '—'}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{g.diet || 'None'}</td>
                      <td className="px-3 py-1.5">{g.vip ? <Pill tone="gold">VIP</Pill> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 50 && <p className="text-xs text-muted-foreground">Showing first 50 of {rows.length} rows.</p>}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { reset(); onClose(); }}>Cancel</Button>
              <Button onClick={doImport} disabled={loading}>
                <FileSpreadsheet data-icon="inline-start" /> {loading ? 'Importing…' : `Import ${rows.length} guests`}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
