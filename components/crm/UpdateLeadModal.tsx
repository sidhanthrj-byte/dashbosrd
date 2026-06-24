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
import { Loader2, Sparkles, Phone, Calendar, MessageSquare } from 'lucide-react';

type Props = {
  lead: Lead;
  open: boolean;
  onClose: () => void;
  onUpdated: (lead: Lead, steps: NextStep[]) => void;
};

export function UpdateLeadModal({ lead, open, onClose, onUpdated }: Props) {
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState('');
  const [callbackDate, setCallbackDate] = useState('');
  const [loading, setLoading] = useState(false);

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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Lead updated — AI next steps ready!`);
      onUpdated(data.lead, data.aiNextSteps || []);
      onClose();
    } catch (err) {
      toast.error('Failed to update: ' + String(err));
    } finally {
      setLoading(false);
    }
  }

  const statusOptions = Object.entries(STATUS_CONFIG);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Update — {lead.contact_name}
          </DialogTitle>
          <p className="text-sm text-gray-500">{lead.company_name} · {lead.city}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Current Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v ?? status)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === 'call_back_requested' && (
            <div>
              <Label className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Callback Date
              </Label>
              <Input
                type="date"
                value={callbackDate}
                onChange={e => setCallbackDate(e.target.value)}
                className="mt-1"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          <div>
            <Label>Notes from this interaction</Label>
            <Textarea
              className="mt-1"
              placeholder="What happened on the call? Any objections, interests, project details..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg p-3">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Claude AI will generate personalised next steps the moment you save.</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !status}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save & Get Next Steps'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
