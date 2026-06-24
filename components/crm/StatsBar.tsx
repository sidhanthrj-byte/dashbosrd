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

export function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => null);
  }, []);

  if (!stats) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-24" />
      ))}
    </div>
  );

  const cards = [
    {
      label: 'Total Leads',
      value: stats.total,
      sub: `Batch ${stats.lastBatch}`,
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      sub: 'Active conversations',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Follow Ups Today',
      value: stats.todayFollowUps,
      sub: 'Due today or overdue',
      icon: <Clock className="w-5 h-5" />,
      color: stats.todayFollowUps > 0 ? 'text-orange-600 bg-orange-50' : 'text-gray-500 bg-gray-50',
    },
    {
      label: 'Converted',
      value: stats.converted,
      sub: 'Orders confirmed',
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-green-600 bg-green-50',
    },
  ];

  return (
    <div className="space-y-3 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">{c.label}</span>
              <span className={`p-1.5 rounded-lg ${c.color}`}>{c.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Auto-batch indicator */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
        <div className="flex-1">
          <span className="text-sm text-indigo-800 font-medium">
            {stats.nextBatchIn === 0
              ? 'New batch of 12 leads just added!'
              : `${stats.nextBatchIn} more contact${stats.nextBatchIn !== 1 ? 's' : ''} until the next 12 leads auto-add`}
          </span>
          <div className="mt-1.5 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${((6 - stats.nextBatchIn) / 6) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-indigo-600 font-semibold shrink-0">
          {6 - stats.nextBatchIn}/6
        </span>
      </div>
    </div>
  );
}
