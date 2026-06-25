'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Search, Phone, Mail, UserX } from 'lucide-react';
import { Lead } from '@/lib/db';

type Props = {
  lead: Lead;
  onFound: (phone: string | null, email: string | null) => void;
};

type LookupState = 'idle' | 'loading' | 'found' | 'not-found';

export function ContactLookupButton({ lead, onFound }: Props) {
  const [state, setState] = useState<LookupState>('idle');
  const [foundPhone, setFoundPhone] = useState<string | null>(null);
  const [foundEmail, setFoundEmail] = useState<string | null>(null);

  async function lookup() {
    setState('loading');
    try {
      const res = await fetch('/api/contact-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          linkedinUrl: lead.linkedin_url,
          name: lead.contact_name,
          company: lead.company_name,
          email: lead.email,
        }),
      });
      const data = await res.json();

      const phone = data.phone || null;
      const email = data.email || null;

      if (!res.ok) {
        toast.error(data.error || 'Lookup failed');
        setState('idle');
        return;
      }

      if (phone || email) {
        toast.success(`Found contact info for ${lead.contact_name}!`);
        setState('found');
        setFoundPhone(phone);
        setFoundEmail(email);
        onFound(phone, email);
      } else {
        toast.info('No phone or email found in Apollo for this contact.');
        setState('not-found');
        onFound(null, null);
      }
    } catch (err) {
      toast.error('Lookup failed: ' + String(err));
      setState('idle');
    }
  }

  if (state === 'loading') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary border border-border rounded-full px-3 py-1.5">
        <Loader2 className="w-3 h-3 animate-spin" /> Searching Apollo...
      </span>
    );
  }

  if (state === 'not-found') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground/50 rounded-full px-2.5 py-1">
        <UserX className="w-3 h-3" /> Not in Apollo
      </span>
    );
  }

  if (state === 'found') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {foundPhone ? (
          <a href={`tel:${foundPhone}`}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1.5 hover:bg-emerald-500/20 transition-colors">
            <Phone className="w-3 h-3" /> {foundPhone}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground/50 flex items-center gap-1">
            <Phone className="w-3 h-3" /> No phone in Apollo
          </span>
        )}
        {foundEmail && (
          <a href={`mailto:${foundEmail}`}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
            <Mail className="w-3 h-3" /> {foundEmail}
          </a>
        )}
      </div>
    );
  }

  // idle state
  return (
    <button
      onClick={lookup}
      className="flex items-center gap-1.5 text-xs font-medium text-primary/80 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1.5 hover:bg-primary/20 transition-colors"
    >
      <Search className="w-3 h-3" /> Find Phone / Email
    </button>
  );
}
