'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { STATUS_CONFIG, NextStep } from '@/lib/next-steps';
import { Lead } from '@/lib/db';
import { Loader2, Sparkles, Calendar, IndianRupee, MapPin } from 'lucide-react';

type Props = {
  lead: Lead;
  open: boolean;
  onClose: () => void;
  onUpdated: (lead: Lead, steps: NextStep[]) => void;
};

const MUMBAI_AREAS = [
  'Bandra West', 'Bandra East', 'Khar', 'Santa Cruz',
  'Juhu', 'Vile Parle', 'Andheri West', 'Andheri East',
  'Jogeshwari', 'Goregaon', 'Malad', 'Borivali',
  'Powai', 'Vikhroli', 'Ghatkopar', 'Mulund',
  'Lower Parel', 'Worli', 'Prabhadevi', 'Dadar',
  'South Mumbai', 'Colaba', 'Nariman Point', 'Fort',
  'Navi Mumbai', 'Thane', 'Kurla', 'Sion',
];

export function UpdateLeadModal({ lead, open, onClose, onUpdated }: Props) {
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState('');
  const [callbackDate, setCallbackDate] = useState(lead.next_action_date || '');
  const [area, setArea] = useState(lead.area || '');
  const [dealValue, setDealValue] = useState(lead.deal_value ? String(lead.deal_value) : '');
  const [loading, setLoading] = useState(false);

  const isMumbai = lead.city?.toLowerCase().includes('mumbai');

  async function handleSubmit() {
    if (!status) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes: notes || undefined,
          next_action_date: callbackDate || undefined,
          area: area || undefined,
          deal_value: dealValue ? parseInt(dealValue) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Lead updated — AI next steps ready!', { icon: '✨' });
      onUpdated(data.lead, data.aiNextSteps || []);
      setNotes('');
      onClose();
    } catch (err) {
      toast.error('Failed to update: ' + String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Update — {lead.contact_name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{lead.company_name} · {lead.city}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-muted-foreground text-xs mb-1.5 block">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v ?? status)}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key} className="text-foreground hover:bg-muted">
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-muted-foreground text-xs flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5" /> Follow-up Date
            </Label>
            <Input
              type="date"
              value={callbackDate}
              onChange={e => setCallbackDate(e.target.value)}
              className="bg-muted border-border text-foreground"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {isMumbai && (
            <div>
              <Label className="text-muted-foreground text-xs flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5" /> Mumbai Area
              </Label>
              <Select value={area} onValueChange={(v) => setArea(v ?? area)}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Select area..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-60">
                  {MUMBAI_AREAS.map(a => (
                    <SelectItem key={a} value={a} className="text-foreground hover:bg-muted">{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!isMumbai && (
            <div>
              <Label className="text-muted-foreground text-xs flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5" /> Area / Locality
              </Label>
              <Input
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="e.g. Banjara Hills, Koramangala..."
                className="bg-muted border-border text-foreground"
              />
            </div>
          )}

          <div>
            <Label className="text-muted-foreground text-xs flex items-center gap-1.5 mb-1.5">
              <IndianRupee className="w-3.5 h-3.5" /> Estimated Deal Value (₹)
            </Label>
            <Input
              type="number"
              value={dealValue}
              onChange={e => setDealValue(e.target.value)}
              placeholder="e.g. 150000"
              className="bg-muted border-border text-foreground"
            />
          </div>

          <div>
            <Label className="text-muted-foreground text-xs mb-1.5 block">Notes from this interaction</Label>
            <Textarea
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
              placeholder="What happened on the call? Objections, interests, project details..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2.5 text-xs text-primary bg-primary/10 rounded-lg p-3 border border-primary/20">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Claude AI generates personalised next steps the moment you save.</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}
            className="border-border text-muted-foreground hover:text-foreground">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !status}
            className="bg-primary text-primary-foreground hover:bg-primary/90">
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              : <>Save & Get AI Steps</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
