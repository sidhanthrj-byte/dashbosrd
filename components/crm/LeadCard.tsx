'use client';

import { useState } from 'react';
import { Lead } from '@/lib/db';
import { NextStep } from '@/lib/next-steps';
import { StatusBadge } from './StatusBadge';
import { UpdateLeadModal } from './UpdateLeadModal';
import { ContactLookupButton } from './ContactLookupButton';
import { NextStepsPanel } from './NextStepsPanel';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import {
  MapPin, Phone, Mail, Link2, Calendar, ChevronDown,
  Edit3, ExternalLink, MessageCircle, Bell, IndianRupee,
} from 'lucide-react';

type Props = {
  lead: Lead;
  onUpdate: (lead: Lead) => void;
  compact?: boolean;
};

const PRIORITY_COLOR: Record<string, string> = {
  high:   'from-amber-500 to-orange-500',
  medium: 'from-blue-500 to-indigo-500',
  low:    'from-slate-500 to-slate-600',
};

const AVATAR_COLOR: Record<string, string> = {
  high:   'from-amber-500/80 to-orange-600/80',
  medium: 'from-indigo-500/80 to-violet-600/80',
  low:    'from-slate-500/80 to-slate-600/80',
};

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function isOverdue(d: string) {
  return new Date(d) < new Date(new Date().toDateString());
}

export function LeadCard({ lead: initialLead, onUpdate, compact = false }: Props) {
  const [lead, setLead] = useState(initialLead);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nextSteps, setNextSteps] = useState<NextStep[]>(() => {
    try { return lead.ai_next_steps ? JSON.parse(lead.ai_next_steps) : []; }
    catch { return []; }
  });

  function handleUpdated(updated: Lead, steps: NextStep[]) {
    setLead(updated);
    setNextSteps(steps);
    setExpanded(true);
    onUpdate(updated);
  }

  function handleContactFound(phone: string | null, email: string | null) {
    setLead(prev => ({ ...prev, phone: phone || prev.phone, email: email || prev.email, phone_fetched: 1 }));
  }

  const overdue = lead.next_action_date && isOverdue(lead.next_action_date)
    && !['converted', 'not_interested'].includes(lead.status);
  const waUrl = lead.phone ? getWhatsAppUrl(lead.phone, lead.contact_name, lead.company_name, lead.status, lead.project_type) : null;

  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden transition-all hover:border-border/80 ${overdue ? 'border-l-orange-500/60 shadow-orange-500/5' : ''}`}>
      {/* Priority bar */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${PRIORITY_COLOR[lead.priority] || PRIORITY_COLOR.medium}`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLOR[lead.priority] || AVATAR_COLOR.medium} flex items-center justify-center text-white font-bold text-sm shrink-0 border border-white/10`}>
            {initials(lead.contact_name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground text-sm">{lead.contact_name}</h3>
                  <StatusBadge status={lead.status} />
                  {overdue && (
                    <span className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.5 rounded-full">
                      OVERDUE
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="text-foreground/80 font-medium">{lead.company_name}</span>
                  <span className="text-border mx-1.5">·</span>
                  {lead.contact_title}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 flex-wrap">
                  <MapPin className="w-3 h-3" />
                  <span>{lead.city}{lead.area ? `, ${lead.area}` : ''}</span>
                  {lead.project_type && (
                    <>
                      <span className="text-border mx-1">·</span>
                      <span className="text-primary/80">{lead.project_type}</span>
                    </>
                  )}
                  {lead.deal_value && (
                    <>
                      <span className="text-border mx-1">·</span>
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <IndianRupee className="w-3 h-3" />
                        {lead.deal_value.toLocaleString('en-IN')}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setEditing(true)}
                  className="h-8 px-3 text-xs font-medium rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors flex items-center gap-1.5 border border-primary/20"
                >
                  <Edit3 className="w-3 h-3" /> Update
                </button>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="w-8 h-8 rounded-lg bg-secondary hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Contact row */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {lead.phone ? (
                <a href={`tel:${lead.phone}`}
                  className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1 hover:bg-emerald-500/20 transition-colors">
                  <Phone className="w-3 h-3" /> {lead.phone}
                </a>
              ) : (
                <ContactLookupButton lead={lead} onFound={handleContactFound} />
              )}

              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-1 hover:bg-green-500/20 transition-colors">
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </a>
              )}

              {lead.email && (
                <a href={`mailto:${lead.email}`}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="w-3 h-3" /> {lead.email}
                </a>
              )}

              {lead.linkedin_url && (
                <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  <Link2 className="w-3 h-3" /> LinkedIn <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>
              )}

              {lead.next_action_date && (
                <div className="ml-auto flex items-center gap-1.5">
                  <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-orange-400 font-semibold' : 'text-muted-foreground'}`}>
                    <Calendar className="w-3 h-3" />
                    {overdue ? 'Overdue: ' : 'Follow up: '}{formatDate(lead.next_action_date)}
                  </span>
                  <a
                    href={`/api/calendar/${lead.id}`}
                    title="Add to iPhone Reminders / Calendar"
                    className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 transition-colors"
                  >
                    <Bell className="w-3 h-3" /> Remind
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && !compact && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
          {lead.notes && (
            <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3 border border-border leading-relaxed">
              <span className="text-foreground font-medium block mb-1">Notes</span>
              {lead.notes}
            </div>
          )}
          {nextSteps.length > 0
            ? <NextStepsPanel steps={nextSteps} />
            : (
              <p className="text-xs text-muted-foreground text-center py-3">
                Update this lead&apos;s status to get AI-powered next steps.
              </p>
            )
          }
        </div>
      )}

      <UpdateLeadModal
        lead={lead}
        open={editing}
        onClose={() => setEditing(false)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
