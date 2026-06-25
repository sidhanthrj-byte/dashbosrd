'use client';
import { STATUS_CONFIG } from '@/lib/next-steps';

const STATUS_STYLE: Record<string, string> = {
  new:                  'bg-blue-500/15 text-blue-300 border-blue-500/30',
  first_call_done:      'bg-violet-500/15 text-violet-300 border-violet-500/30',
  call_back_requested:  'bg-amber-500/15 text-amber-300 border-amber-500/30',
  follow_up:            'bg-orange-500/15 text-orange-300 border-orange-500/30',
  meeting_scheduled:    'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  proposal_sent:        'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  negotiation:          'bg-pink-500/15 text-pink-300 border-pink-500/30',
  sample_sent:          'bg-teal-500/15 text-teal-300 border-teal-500/30',
  converted:            'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  not_interested:       'bg-red-500/15 text-red-400 border-red-500/30',
  on_hold:              'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export const STATUS_DOT: Record<string, string> = {
  new:                  'bg-blue-400',
  first_call_done:      'bg-violet-400',
  call_back_requested:  'bg-amber-400',
  follow_up:            'bg-orange-400',
  meeting_scheduled:    'bg-indigo-400',
  proposal_sent:        'bg-cyan-400',
  negotiation:          'bg-pink-400',
  sample_sent:          'bg-teal-400',
  converted:            'bg-emerald-400',
  not_interested:       'bg-red-400',
  on_hold:              'bg-slate-400',
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
