'use client';

import { useEffect, useState } from 'react';
import { Lead } from '@/lib/db';
import { LeadCard } from './LeadCard';
import { CheckCircle2, Clock } from 'lucide-react';

export function TodayView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch('/api/leads?sort=followup').then(r => r.json()).then(data => {
      const today = new Date().toISOString().split('T')[0];
      const due = (data.leads || []).filter((l: Lead) =>
        l.next_action_date && l.next_action_date <= today &&
        !['converted', 'not_interested'].includes(l.status)
      );
      setLeads(due);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  function handleUpdate(updated: Lead) {
    // Remove from today's list if status changed to done/converted/not_interested
    // or if next action date moved to future
    const today = new Date().toISOString().split('T')[0];
    const stillDue = updated.next_action_date && updated.next_action_date <= today
      && !['converted', 'not_interested'].includes(updated.status);
    if (!stillDue) {
      setLeads(prev => prev.filter(l => l.id !== updated.id));
    } else {
      setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const overdue = leads.filter(l => l.next_action_date! < today);
  const dueToday = leads.filter(l => l.next_action_date === today);

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 md:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-400" /> Today&apos;s Follow-ups
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border h-[72px] animate-pulse" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400/30 mb-3" />
          <h3 className="text-foreground font-semibold">All caught up!</h3>
          <p className="text-sm text-muted-foreground mt-1">No follow-ups due today. Great work!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {overdue.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-orange-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                Overdue ({overdue.length})
              </h3>
              <div className="space-y-2">
                {overdue.map(l => <LeadCard key={l.id} lead={l} onUpdate={handleUpdate} />)}
              </div>
            </div>
          )}

          {dueToday.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Due Today ({dueToday.length})
              </h3>
              <div className="space-y-2">
                {dueToday.map(l => <LeadCard key={l.id} lead={l} onUpdate={handleUpdate} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
