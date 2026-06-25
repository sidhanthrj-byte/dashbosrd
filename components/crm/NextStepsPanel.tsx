'use client';

import { NextStep } from '@/lib/next-steps';
import { Sparkles, Clock, ChevronDown, MessageSquare } from 'lucide-react';
import { useState } from 'react';

type Props = {
  steps: NextStep[];
};

const DOT: Record<string, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-slate-500',
};
const ROW: Record<string, string> = {
  high: 'border-red-500/20 bg-red-500/5',
  medium: 'border-amber-500/20 bg-amber-500/5',
  low: 'border-border bg-secondary/40',
};

export function NextStepsPanel({ steps }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  if (!steps || steps.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-primary">AI Next Steps</span>
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i}
            className={`rounded-lg border p-3 cursor-pointer transition-all ${ROW[step.priority]}`}
            onClick={() => setExpanded(expanded === i ? null : i)}>
            <div className="flex items-start gap-2.5">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${DOT[step.priority]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium">{step.action}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{step.timeframe}</span>
                </div>
              </div>
              {step.script && (
                <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expanded === i ? 'rotate-180' : ''}`} />
              )}
            </div>
            {step.script && expanded === i && (
              <div className="mt-3 ml-4 p-3 bg-background/60 rounded-lg border border-border">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MessageSquare className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-primary">Suggested script</span>
                </div>
                <p className="text-xs text-muted-foreground italic leading-relaxed">{step.script}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
