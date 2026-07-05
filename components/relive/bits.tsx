'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Small shared pieces for the control room. Status colors are reserved
// tokens (--ok/--warn/--bad) and always ship with a label, never color alone.

export function Card({ title, action, children, className }: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 shadow-lg shadow-black/10', className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h3 className="text-sm font-semibold tracking-wide text-foreground/90">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatTile({ label, value, sub, tone }: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: 'ok' | 'warn' | 'bad';
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      {sub && (
        <div className={cn('mt-0.5 text-xs',
          tone === 'ok' && 'text-[var(--ok)]',
          tone === 'warn' && 'text-[var(--warn)]',
          tone === 'bad' && 'text-[var(--bad)]',
          !tone && 'text-muted-foreground')}>
          {sub}
        </div>
      )}
    </div>
  );
}

export function Meter({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-background/60', className)}
      role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

const PILL_TONES: Record<string, string> = {
  ok: 'bg-[var(--ok)]/15 text-[var(--ok)] border-[var(--ok)]/30',
  warn: 'bg-[var(--warn)]/15 text-[var(--warn)] border-[var(--warn)]/30',
  bad: 'bg-[var(--bad)]/15 text-[var(--bad)] border-[var(--bad)]/30',
  neutral: 'bg-muted text-muted-foreground border-border',
  gold: 'bg-primary/15 text-primary border-primary/30',
};

export function Pill({ tone = 'neutral', children, className }: {
  tone?: keyof typeof PILL_TONES;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', PILL_TONES[tone], className)}>
      {children}
    </span>
  );
}

export function Dot({ tone = 'neutral', pulse }: { tone?: 'ok' | 'warn' | 'bad' | 'neutral' | 'gold'; pulse?: boolean }) {
  const color = {
    ok: 'bg-[var(--ok)]', warn: 'bg-[var(--warn)]', bad: 'bg-[var(--bad)]',
    neutral: 'bg-muted-foreground', gold: 'bg-primary',
  }[tone];
  return <span className={cn('inline-block size-1.5 rounded-full', color, pulse && 'live-dot')} />;
}

export function Modal({ open, onClose, title, children, wide }: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

// Styled native select — keeps dropdown behavior dead simple and reliable.
export function NativeSelect({ value, onChange, children, className }: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn('h-8 w-full rounded-lg border border-input bg-background/60 px-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40', className)}
    >
      {children}
    </select>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{children}</div>;
}
