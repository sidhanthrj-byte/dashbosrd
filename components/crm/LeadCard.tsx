'use client';

import { useState } from 'react';
import { Lead } from '@/lib/db';
import { NextStep } from '@/lib/next-steps';
import { StatusBadge } from './StatusBadge';
import { UpdateLeadModal } from './UpdateLeadModal';
import { ContactLookupButton } from './ContactLookupButton';
import { NextStepsPanel } from './NextStepsPanel';
import { Button } from '@/components/ui/button';
import {
  Building2, MapPin, Phone, Mail, Link2, Calendar,
  ChevronDown, ChevronUp, Edit3, ExternalLink, Star
} from 'lucide-react';

type Props = {
  lead: Lead;
  onUpdate: (lead: Lead) => void;
};

const PRIORITY_STAR: Record<string, string> = {
  high: 'text-yellow-500',
  medium: 'text-gray-300',
  low: 'text-gray-200',
};

export function LeadCard({ lead: initialLead, onUpdate }: Props) {
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

  const hasNextSteps = nextSteps.length > 0;
  const isActive = !['converted', 'not_interested'].includes(lead.status);

  return (
    <div className={`bg-white rounded-xl border shadow-sm transition-all ${hasNextSteps && isActive ? 'border-blue-200 shadow-blue-100' : 'border-gray-200'}`}>
      {/* Header Row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {lead.contact_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-sm">{lead.contact_name}</h3>
              <Star className={`w-3.5 h-3.5 ${PRIORITY_STAR[lead.priority]}`} fill="currentColor" />
              <StatusBadge status={lead.status} />
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <Building2 className="w-3 h-3" />
              <span className="font-medium text-gray-700">{lead.company_name}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500 text-xs">{lead.contact_title}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <MapPin className="w-3 h-3" />
              {lead.city}, {lead.state}
              {lead.project_type && (
                <><span className="text-gray-300 mx-1">·</span><span className="text-blue-500">{lead.project_type}</span></>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={() => setEditing(true)}
              className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
              <Edit3 className="w-3 h-3 mr-1" /> Update
            </Button>
            <button onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Contact Row */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100">
          {lead.phone ? (
            <a href={`tel:${lead.phone}`}
              className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1 hover:bg-green-100">
              <Phone className="w-3 h-3" /> {lead.phone}
            </a>
          ) : (
            <ContactLookupButton lead={lead} onFound={handleContactFound} />
          )}

          {lead.email && (
            <a href={`mailto:${lead.email}`}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600">
              <Mail className="w-3 h-3" /> {lead.email}
            </a>
          )}

          {lead.linkedin_url && (
            <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
              <Link2 className="w-3 h-3" /> LinkedIn <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}

          {lead.next_action_date && (
            <span className="flex items-center gap-1 text-xs text-orange-600 ml-auto">
              <Calendar className="w-3 h-3" />
              Follow up: {new Date(lead.next_action_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {lead.notes && (
            <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">
              <span className="font-medium text-gray-800 block mb-1">Notes</span>
              {lead.notes}
            </div>
          )}
          {hasNextSteps && <NextStepsPanel steps={nextSteps} />}
          {!hasNextSteps && (
            <p className="text-xs text-gray-400 text-center py-2">
              Update this lead's status to get AI-powered next steps.
            </p>
          )}
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
