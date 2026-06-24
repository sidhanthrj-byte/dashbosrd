'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Phone, Loader2, CheckCircle2, Search } from 'lucide-react';
import { Lead } from '@/lib/db';

type Props = {
  lead: Lead;
  onFound: (phone: string | null, email: string | null) => void;
};

export function ContactLookupButton({ lead, onFound }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!!lead.phone_fetched);

  async function lookup() {
    setLoading(true);
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
      if (!res.ok) throw new Error(data.error);

      if (data.phone || data.email) {
        toast.success(`Found contact info for ${lead.contact_name}!`);
        setDone(true);
        onFound(data.phone || null, data.email || null);
      } else {
        toast.info('No contact info found via ContactOut for this lead.');
      }
    } catch (err) {
      toast.error('Contact lookup failed: ' + String(err));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <CheckCircle2 className="w-3.5 h-3.5" /> Contact found
      </span>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={lookup} disabled={loading}
      className="text-xs h-7 border-blue-200 text-blue-700 hover:bg-blue-50">
      {loading
        ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Looking up...</>
        : <><Search className="w-3 h-3 mr-1" /> Find Number</>}
    </Button>
  );
}
