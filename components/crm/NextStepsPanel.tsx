'use client';

import { NextStep } from '@/lib/next-steps';
import { Sparkles, Clock, ChevronRight, MessageSquare } from 'lucide-react';
import { useState } from 'react';

type Props = {
  steps: NextStep[];
  compact?: boolean;
};

const priorityColors = {
  high: 'border-red-200 bg-red-50',
  medium: 'border-orange-200 bg-orange-50',
  low: 'border-gray-200 bg-gray-50',
};

const priorityDot = {
  high: 'bg-red-500',
  medium: 'bg-orange-400',
  low: 'bg-gray-400',
};

export function NextStepsPanel({ steps, compact = false }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-800">AI Next Steps</span>
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className={`rounded-lg border p-3 cursor-pointer transition-all ${priorityColors[step.priority]}`}
            onClick={() => setExpanded(expanded === i ? null : i)}>
            <div className="flex items-start gap-2">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${priorityDot[step.priority]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{step.action}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{step.timeframe}</span>
                </div>
              </div>
              {step.script && (
                <ChevronRight className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expanded === i ? 'rotate-90' : ''}`} />
              )}
            </div>
            {step.script && expanded === i && (
              <div className="mt-2 ml-4 p-2 bg-white rounded border border-blue-100">
                <div className="flex items-center gap-1 mb-1">
                  <MessageSquare className="w-3 h-3 text-blue-500" />
                  <span className="text-xs font-medium text-blue-600">Suggested script</span>
                </div>
                <p className="text-xs text-gray-600 italic">{step.script}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
