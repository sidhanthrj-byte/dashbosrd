'use client';

import { useEffect, useState } from 'react';
import { Users, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

type Stats = {
  total: number;
  converted: number;
  inProgress: number;
  todayFollowUps: number;
  nextBatchIn: number;
  contactedSinceBatch: number;
  lastBatch: number;
};

type Props = {
  onTodayClick?: () => void;
};

export function StatsBar({ onTodayClick }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => null);
  }, []);

  if (!stats) return (
    <div className="space-y-2 animate-pulse">
      <div className="h-12 bg-card rounded-xl border border-border" />
      <div className="h-2 bg-card rounded-full" />
    </div>
  );

  const chips = [
    { label: 'Leads', value: stats.total, icon: <Users className="w-3 h-3" />, color: 'text-foreground' },
    { label: "Today", value: stats.todayFollowUps, icon: <Clock className="w-3 h-3" />, color: stats.todayFollowUps > 0 ? 'text-orange-400' : 'text-muted-foreground', onClick: onTodayClick, highlight: stats.todayFollowUps > 0 },
    { label: 'Active', value: stats.inProgress, icon: <TrendingUp className="w-3 h-3" />, color: 'text-violet-400' },
    { label: 'Won', value: stats.converted, icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-emerald-400' },
  ];

  const progress = ((6 - stats.nextBatchIn) / 6) * 100;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {chips.map(c => (
          <button
            key={c.label}
            onClick={c.onClick}
            disabled={!c.onClick}
            className={`flex-1 flex flex-col items-center py-2.5 px-1 rounded-xl border transition-all
              ${c.highlight ? 'bg-orange-500/10 border-orange-500/30' : 'bg-card border-border'}
              ${c.onClick ? 'cursor-pointer hover:bg-secondary active:scale-95' : 'cursor-default'}
            `}
          >
            <span className={`flex items-center gap-1 ${c.color}`}>{c.icon}</span>
            <span className={`text-lg font-bold leading-tight ${c.color}`}>{c.value}</span>
            <span className="text-[10px] text-muted-foreground">{c.label}</span>
          </button>
        ))}
      </div>

      {/* Progress to next batch */}
      <div className="bg-card border border-border/50 rounded-xl px-3 py-2 flex items-center gap-2.5">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-muted-foreground">
              {stats.nextBatchIn === 0
                ? '🎉 New batch just added!'
                : `${stats.nextBatchIn} more contact${stats.nextBatchIn !== 1 ? 's' : ''} → 12 new leads`}
            </span>
            <span className="text-[11px] text-primary font-semibold">{6 - stats.nextBatchIn}/6</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
