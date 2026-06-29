'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { PROJECT_TYPES } from '@/lib/boq-data';

type Props = {
  onClose: () => void;
  onCreate: (project: { id: number }) => void;
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'oklch(0.10 0.012 265)',
  border: '1px solid oklch(0.18 0.014 265)',
  borderRadius: '0.5rem',
  padding: '9px 13px',
  fontSize: '13px',
  color: 'var(--foreground)',
  outline: 'none',
  transition: 'border-color 0.15s',
};

function Field({
  label, type = 'text', value, onChange, placeholder, required, span, options
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  required?: boolean; span?: boolean; options?: string[];
}) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'oklch(0.58 0.018 265)', marginBottom: '5px' }}>
        {label}{required && <span style={{ color: 'oklch(0.64 0.22 25)' }}> *</span>}
      </label>
      {type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
          {options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} rows={2}
          style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          required={required} placeholder={placeholder}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'oklch(0.70 0.22 268 / 0.55)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'oklch(0.18 0.014 265)')} />
      )}
    </div>
  );
}

export function NewProjectModal({ onClose, onCreate }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', client_name: '', client_phone: '', client_email: '',
    project_type: 'Residential Apartment', location: '',
    total_area: '', notes: '',
  });
  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.client_name.trim()) { setError('Project name and client name are required'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/boq/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, total_area: form.total_area ? parseFloat(form.total_area) : null }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); setLoading(false); return; }
    onCreate(data.project);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: 'black', opacity: 0.7 }} onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ background: 'oklch(0.085 0.013 265)', border: '1px solid oklch(0.18 0.014 265)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'oklch(0.18 0.014 265)' }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>New Project</h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Fill in project details to get started</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="px-5 py-4 max-h-[65vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Project Name" value={form.name} onChange={v => set('name', v)}
                placeholder="e.g. Sharma Residence – Interior" required span />
              <Field label="Client Name" value={form.client_name} onChange={v => set('client_name', v)}
                placeholder="Mr. Rajesh Sharma" required />
              <Field label="Phone" type="tel" value={form.client_phone} onChange={v => set('client_phone', v)}
                placeholder="+91 98xxx xxxxx" />
              <Field label="Client Email" type="email" value={form.client_email} onChange={v => set('client_email', v)}
                placeholder="client@email.com" />
              <Field label="Project Type" type="select" value={form.project_type} onChange={v => set('project_type', v)}
                span options={PROJECT_TYPES} />
              <Field label="Location" value={form.location} onChange={v => set('location', v)}
                placeholder="e.g. Bandra, Mumbai" />
              <Field label="Total Area (sqft)" type="number" value={form.total_area} onChange={v => set('total_area', v)}
                placeholder="e.g. 1800" />
              <Field label="Notes / Scope" type="textarea" value={form.notes} onChange={v => set('notes', v)}
                placeholder="Brief description, scope, special requirements..." span />
            </div>

            {error && (
              <p className="mt-3 text-xs px-3 py-2 rounded-lg"
                style={{ background: 'oklch(0.64 0.22 25 / 0.12)', color: 'oklch(0.75 0.16 25)', border: '1px solid oklch(0.64 0.22 25 / 0.25)' }}>
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: 'oklch(0.18 0.014 265)' }}>
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm rounded-lg border transition-colors"
              style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)', background: 'transparent' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-white transition-opacity disabled:opacity-50"
              style={{ background: 'oklch(0.70 0.22 268)' }}>
              {loading ? 'Creating...' : 'Create Project →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
