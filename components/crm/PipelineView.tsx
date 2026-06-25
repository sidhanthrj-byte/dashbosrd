'use client';

import { useEffect, useState } from 'react';
import { Lead } from '@/lib/db';
import { STATUS_CONFIG } from '@/lib/next-steps';
import { STATUS_DOT } from './StatusBadge';
import { UpdateLeadModal } from './UpdateLeadModal';
import { NextStep } from '@/lib/next-steps';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import { MapPin, Phone, MessageCircle, Edit3, Bell } from 'lucide-react';

const PIPELINE_STAGES = [
  'new',
  'first_call_done',
  'call_back_requested',
  'follow_up',
  'meeting_scheduled',
  'proposal_sent',
  'negotiation',
];

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

type MiniCardProps = {
  lead: Lead;
  onEdit: (lead: Lead) => void;
};

function MiniCard({ lead, onEdit }: MiniCardProps) {
  const overdue = lead.next_action_date && new Date(lead.next_action_date) < new Date(new Date().toDateString())
    && !['converted', 'not_interested'].includes(lead.status);
  const waUrl = lead.phone ? getWhatsAppUrl(lead.phone, lead.contact_name, lead.company_name, lead.status, lead.project_type) : null;

  return (
    <div className={`bg-card border rounded-xl p-3 group transition-all hover:border-primary/40 ${overdue ? 'border-orange-500/40' : 'border-border'}`}>
      <div className="flex items-start gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
          {initials(lead.contact_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{lead.contact_name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{lead.company_name}</p>
        </div>
        <button onClick={() => onEdit(lead)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary">
          <Edit3 className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
        <MapPin className="w-2.5 h-2.5" />
        <span className="truncate">{lead.city}{lead.area ? `, ${lead.area}` : ''}</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 rounded-full px-1.5 py-0.5 hover:bg-emerald-500/20">
            <Phone className="w-2.5 h-2.5" />
          </a>
        )}
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 rounded-full px-1.5 py-0.5 hover:bg-green-500/20">
            <MessageCircle className="w-2.5 h-2.5" />
          </a>
        )}
        {lead.next_action_date && (
          <a href={`/api/calendar/${lead.id}`} title="Add reminder"
            className="flex items-center gap-1 text-[10px] text-primary/70 bg-primary/10 rounded-full px-1.5 py-0.5 hover:bg-primary/20">
            <Bell className="w-2.5 h-2.5" />
          </a>
        )}
        {overdue && (
          <span className="text-[10px] text-orange-400 font-bold ml-auto">OVERDUE</span>
        )}
      </div>

      {lead.project_type && (
        <p className="text-[10px] text-primary/70 mt-1.5 truncate">{lead.project_type}</p>
      )}
    </div>
  );
}

export function PipelineView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leads?sort=priority').then(r => r.json()).then(data => {
      setLeads(data.leads || []);
      setLoading(false);
    });
  }, []);

  function handleUpdated(updated: Lead, _steps: NextStep[]) {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    setEditingLead(null);
  }

  const byStatus = (status: string) => leads.filter(l => l.status === status);
  const others = leads.filter(l => !PIPELINE_STAGES.includes(l.status));

  if (loading) return (
    <div className="flex-1 p-6 flex gap-4 overflow-x-auto">
      {PIPELINE_STAGES.map(s => (
        <div key={s} className="w-60 shrink-0 bg-card border border-border rounded-xl h-40 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="px-6 pt-6 pb-2 shrink-0">
        <h2 className="text-lg font-semibold text-foreground">Sales Pipeline</h2>
        <p className="text-sm text-muted-foreground">{leads.filter(l => PIPELINE_STAGES.includes(l.status)).length} active leads across {PIPELINE_STAGES.length} stages</p>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
        <div className="flex gap-4 h-full min-w-max pt-4">
          {PIPELINE_STAGES.map(status => {
            const stageLeads = byStatus(status);
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} className="w-60 shrink-0 flex flex-col">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[status] || 'bg-slate-400'}`} />
                  <span className="text-xs font-semibold text-foreground">{cfg?.label || status}</span>
                  <span className="ml-auto text-[10px] font-bold text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {stageLeads.length === 0 ? (
                    <div className="border border-dashed border-border/50 rounded-xl h-16 flex items-center justify-center">
                      <p className="text-[10px] text-muted-foreground/50">No leads</p>
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <MiniCard key={lead.id} lead={lead} onEdit={setEditingLead} />
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* Others column */}
          {others.length > 0 && (
            <div className="w-60 shrink-0 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-xs font-semibold text-foreground">Closed</span>
                <span className="ml-auto text-[10px] font-bold text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5">
                  {others.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {others.map(lead => (
                  <MiniCard key={lead.id} lead={lead} onEdit={setEditingLead} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {editingLead && (
        <UpdateLeadModal
          lead={editingLead}
          open={true}
          onClose={() => setEditingLead(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
