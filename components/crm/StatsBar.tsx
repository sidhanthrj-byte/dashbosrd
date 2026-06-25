'use client';

import { useEffect, useState } from 'react';
import { Users, TrendingUp, Clock, CheckCircle2, Zap } from 'lucide-react';

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border h-24" />
      ))}
    </div>
  );

  const pct = Math.round(((stats.total - (stats.total - stats.converted)) / Math.max(stats.total, 1)) * 100);
  void pct;

  const cards = [
    {
      label: 'Total Leads',
      value: stats.total,
      sub: `Batch ${stats.lastBatch}`,
      icon: <Users className="w-4 h-4" />,
      accent: 'text-blue-400',
      glow: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      sub: 'Active deals',
      icon: <TrendingUp className="w-4 h-4" />,
      accent: 'text-violet-400',
      glow: 'bg-violet-500/10 border-violet-500/20',
    },
    {
      label: "Today's Follow-ups",
      value: stats.todayFollowUps,
      sub: stats.todayFollowUps > 0 ? 'Needs attention!' : 'All clear ✓',
      icon: <Clock className="w-4 h-4" />,
      accent: stats.todayFollowUps > 0 ? 'text-orange-400' : 'text-muted-foreground',
      glow: stats.todayFollowUps > 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-card border-border',
      onClick: onTodayClick,
    },
    {
      label: 'Converted',
      value: stats.converted,
      sub: 'Orders confirmed',
      icon: <CheckCircle2 className="w-4 h-4" />,
      accent: 'text-emerald-400',
      glow: 'bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  return (
    <div className="space-y-3 mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(c => (
          <div
            key={c.label}
            onClick={c.onClick}
            className={`bg-card border rounded-xl p-4 transition-all ${c.onClick ? 'cursor-pointer hover:scale-[1.02]' : ''} ${c.glow}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{c.label}</span>
              <span className={c.accent}>{c.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${c.accent}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3">
        <Zap className="w-4 h-4 text-primary shrink-0" />
        <div className="flex-1">
          <span className="text-sm text-foreground font-medium">
            {stats.nextBatchIn === 0
              ? '🎉 New batch of 12 leads just added!'
              : `${stats.nextBatchIn} more contact${stats.nextBatchIn !== 1 ? 's' : ''} until 12 new leads auto-add`}
          </span>
          <div className="mt-1.5 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all"
              style={{ width: `${((6 - stats.nextBatchIn) / 6) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-primary font-bold shrink-0">{6 - stats.nextBatchIn}/6</span>
      </div>
    </div>
  );
}
