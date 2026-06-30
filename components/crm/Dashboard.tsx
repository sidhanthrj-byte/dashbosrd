'use client';

import { useEffect, useState } from 'react';
import { Lead } from '@/lib/db';
import { STATUS_CONFIG } from '@/lib/next-steps';
import { STATUS_DOT } from './StatusBadge';
import { LeadCard } from './LeadCard';
import {
  TrendingUp, Clock, CheckCircle2, Users,
  Zap, AlertCircle, ChevronRight,
} from 'lucide-react';

type Stats = {
  total: number;
  converted: number;
  inProgress: number;
  todayFollowUps: number;
  byStatus: { status: string; count: number }[];
  nextBatchIn: number;
  contactedSinceBatch: number;
  lastBatch: number;
  recentLogs: { id: number; contact_name: string; company_name: string; status_after: string; notes: string | null; created_at: string }[];
};

import { View } from './Sidebar';

type Props = {
  onNavigate: (view: View) => void;
  userName?: string;
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function Dashboard({ onNavigate, userName = 'there' }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [todayLeads, setTodayLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats);
    fetch('/api/leads?sort=followup&status=').then(r => r.json()).then(data => {
      const today = new Date().toISOString().split('T')[0];
      const due = (data.leads || []).filter((l: Lead) =>
        l.next_action_date && l.next_action_date <= today &&
        !['converted', 'not_interested'].includes(l.status)
      ).slice(0, 5);
      setTodayLeads(due);
    });
  }, []);

  if (!stats) return (
    <div className="flex-1 p-6 space-y-4 animate-pulse">
      {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-card rounded-xl border border-border" />)}
    </div>
  );

  const convRate = stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Good {getGreeting()}, {userName.split(' ')[0]} 👋</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {todayLeads.length > 0 && (
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2.5 cursor-pointer hover:bg-orange-500/15 transition-colors"
            onClick={() => onNavigate('today')}>
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-orange-400">{todayLeads.length} follow-up{todayLeads.length !== 1 ? 's' : ''} due</span>
            <ChevronRight className="w-4 h-4 text-orange-400" />
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Leads" value={stats.total}
          sub={`Batch ${stats.lastBatch}`} accent="text-blue-400" bg="bg-blue-500/10 border-blue-500/20" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="In Progress" value={stats.inProgress}
          sub="Active deals" accent="text-violet-400" bg="bg-violet-500/10 border-violet-500/20" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Follow-ups Due" value={todayLeads.length}
          sub="Today & overdue" accent={todayLeads.length > 0 ? 'text-orange-400' : 'text-muted-foreground'}
          bg={todayLeads.length > 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-card border-border'}
          onClick={() => onNavigate('today')} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Converted" value={stats.converted}
          sub={`${convRate}% rate`} accent="text-emerald-400" bg="bg-emerald-500/10 border-emerald-500/20" />
      </div>

      {/* Auto-batch */}
      <div className="bg-card border border-primary/20 rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {stats.nextBatchIn === 0
              ? '🎉 New batch added! 12 fresh leads are ready.'
              : `${stats.nextBatchIn} more contact${stats.nextBatchIn !== 1 ? 's' : ''} until 12 new leads auto-add`}
          </p>
          <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${((6 - stats.nextBatchIn) / 6) * 100}%` }} />
          </div>
        </div>
        <span className="text-sm font-bold text-primary">{6 - stats.nextBatchIn}/6</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline breakdown */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">Pipeline Breakdown</h3>
            <button onClick={() => onNavigate('pipeline')}
              className="text-xs text-primary hover:underline flex items-center gap-0.5">
              View pipeline <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {stats.byStatus
              .filter(s => !['converted', 'not_interested', 'on_hold'].includes(s.status))
              .sort((a, b) => b.count - a.count)
              .map(s => (
                <div key={s.status} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s.status] || 'bg-slate-400'}`} />
                  <span className="text-xs text-muted-foreground flex-1">{STATUS_CONFIG[s.status]?.label || s.status}</span>
                  <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full"
                      style={{ width: `${(s.count / Math.max(...stats.byStatus.map(x => x.count), 1)) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-foreground w-5 text-right">{s.count}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground text-sm mb-4">Recent Activity</h3>
          {stats.recentLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-2.5">
              {stats.recentLogs.slice(0, 6).map(log => (
                <div key={log.id} className="flex items-start gap-2.5">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS_DOT[log.status_after] || 'bg-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">
                      <span className="font-medium">{log.contact_name}</span>
                      <span className="text-muted-foreground"> → </span>
                      <span>{STATUS_CONFIG[log.status_after]?.label || log.status_after}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">{log.company_name} · {timeAgo(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Today's leads */}
      {todayLeads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" /> Due Today
            </h3>
            <button onClick={() => onNavigate('today')} className="text-xs text-primary hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {todayLeads.map(l => (
              <LeadCard key={l.id} lead={l} onUpdate={() => {}} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent, bg, onClick }: {
  icon: React.ReactNode; label: string; value: number; sub: string;
  accent: string; bg: string; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className={`bg-card border rounded-xl p-4 transition-all ${bg} ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className={accent}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
