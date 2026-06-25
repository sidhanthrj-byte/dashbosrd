'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Search, Phone, Mail, UserX } from 'lucide-react';
import { Lead } from '@/lib/db';

type Props = {
  lead: Lead;
  onFound: (phone: string | null, email: string | null) => void;
};

type State = 'idle' | 'loading' | 'done-found' | 'done-notfound';

export function ContactLookupButton({ lead, onFound }: Props) {
  const [state, setState] = useState<State>('idle');
  const [result, setResult] = useState<{ phone: string | null; email: string | null } | null>(null);

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
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error('Lookup failed: ' + (data.error || 'Unknown error'));
        setState('idle');
        return;
      }

      const phone = data.phone || null;
      const email = data.email || null;

      if (phone || email) {
        toast.success(`Found info for ${lead.contact_name}!`);
        setState('done-found');
        setResult({ phone, email });
        onFound(phone, email);
      } else {
        toast.info('No contact info found for this lead.');
        setState('done-notfound');
        onFound(null, null);
      }
    } catch (err) {
      toast.error('Lookup failed: ' + String(err));
      setState('idle');
    }
  }

  if (state === 'loading') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 border border-border rounded-full px-2.5 py-1">
        <Loader2 className="w-3 h-3 animate-spin" /> Searching Apollo...
      </span>
    );
  }

  if (state === 'done-notfound') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground/50 rounded-full px-2.5 py-1">
        <UserX className="w-3 h-3" /> Not found
      </span>
    );
  }

  if (state === 'done-found' && result) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {result.phone && (
          <a href={`tel:${result.phone}`}
            className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1 hover:bg-emerald-500/20 transition-colors">
            <Phone className="w-3 h-3" /> {result.phone}
          </a>
        )}
        {result.email && !lead.email && (
          <a href={`mailto:${result.email}`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Mail className="w-3 h-3" /> {result.email}
          </a>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={lookup}
      className="flex items-center gap-1.5 text-xs text-primary/80 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1 hover:bg-primary/20 transition-colors"
    >
      <Search className="w-3 h-3" /> Find Phone
    </button>
  );
}
