'use client';

import { useState } from 'react';
import { X, Building2, User, Phone, Mail, MapPin, Maximize2, FileText } from 'lucide-react';
import { PROJECT_TYPES } from '@/lib/boq-data';

type Props = {
  onClose: () => void;
  onCreate: (project: { id: number }) => void;
};

export function NewProjectModal({ onClose, onCreate }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    client_name: '',
    client_phone: '',
    client_email: '',
    project_type: 'Residential Apartment',
    location: '',
    total_area: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.client_name.trim()) {
      setError('Project name and client name are required');
      return;
    }
    setLoading(true);
    setError('');
    const res = await fetch('/api/boq/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        total_area: form.total_area ? parseFloat(form.total_area) : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong');
      setLoading(false);
      return;
    }
    onCreate(data.project);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-foreground text-base">New Project</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Fill in the project details to get started</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">

            {/* Project name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Project Name <span className="text-destructive">*</span>
              </label>
              <input
                autoFocus
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Sharma Residence – Interior"
                className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Client name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5 block">
                <User className="w-3 h-3" />
                Client Name <span className="text-destructive">*</span>
              </label>
              <input
                value={form.client_name}
                onChange={e => set('client_name', e.target.value)}
                placeholder="e.g. Mr. Rajesh Sharma"
                className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5 block">
                  <Phone className="w-3 h-3" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.client_phone}
                  onChange={e => set('client_phone', e.target.value)}
                  placeholder="+91 98xxx xxxxx"
                  className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5 block">
                  <Mail className="w-3 h-3" />
                  Email
                </label>
                <input
                  type="email"
                  value={form.client_email}
                  onChange={e => set('client_email', e.target.value)}
                  placeholder="client@email.com"
                  className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {/* Project type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5 block">
                <Building2 className="w-3 h-3" />
                Project Type
              </label>
              <select
                value={form.project_type}
                onChange={e => set('project_type', e.target.value)}
                className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
              >
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Location + Area */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5 block">
                  <MapPin className="w-3 h-3" />
                  Location
                </label>
                <input
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                  placeholder="e.g. Bandra, Mumbai"
                  className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5 block">
                  <Maximize2 className="w-3 h-3" />
                  Total Area (sqft)
                </label>
                <input
                  type="number"
                  value={form.total_area}
                  onChange={e => set('total_area', e.target.value)}
                  placeholder="e.g. 1800"
                  className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5 block">
                <FileText className="w-3 h-3" />
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Brief description, scope, special requirements..."
                rows={3}
                className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm text-muted-foreground border border-border rounded-xl hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Project →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
