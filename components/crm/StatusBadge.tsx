'use client';
import { STATUS_CONFIG } from '@/lib/next-steps';

const STATUS_STYLE: Record<string, string> = {
  new:                  'bg-zinc-700/40 text-zinc-300 border-zinc-600/40',
  first_call_done:      'bg-stone-700/40 text-stone-300 border-stone-600/40',
  call_back_requested:  'bg-amber-500/15 text-amber-300 border-amber-500/30',
  follow_up:            'bg-orange-500/15 text-orange-300 border-orange-500/30',
  meeting_scheduled:    'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  proposal_sent:        'bg-lime-500/15 text-lime-300 border-lime-500/30',
  negotiation:          'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  sample_sent:          'bg-teal-500/15 text-teal-300 border-teal-500/30',
  converted:            'bg-amber-500/20 text-amber-400 border-amber-500/40',
  not_interested:       'bg-red-500/15 text-red-400 border-red-500/30',
  on_hold:              'bg-zinc-700/30 text-zinc-400 border-zinc-600/30',
};

export const STATUS_DOT: Record<string, string> = {
  new:                  'bg-zinc-400',
  first_call_done:      'bg-stone-400',
  call_back_requested:  'bg-amber-400',
  follow_up:            'bg-orange-400',
  meeting_scheduled:    'bg-yellow-400',
  proposal_sent:        'bg-lime-400',
  negotiation:          'bg-emerald-400',
  sample_sent:          'bg-teal-400',
  converted:            'bg-amber-400',
  not_interested:       'bg-red-400',
  on_hold:              'bg-zinc-400',
};

export function StatusBadge({ status }: { status: string }) {
  const label = STATUS_CONFIG[status]?.label || status;
  const style = STATUS_STYLE[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] || 'bg-slate-400'}`} />
      {label}
    </span>
  );
}
