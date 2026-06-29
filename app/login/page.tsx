'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
  'Pune', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Surat',
  'Chandigarh', 'Kochi', 'Indore', 'Nagpur', 'Lucknow',
];

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [city, setCity] = useState('Mumbai');

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Sign in failed'); setLoading(false); return; }
    router.push('/boq');
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, firm_name: firmName, email: signupEmail, password: signupPassword, city }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Sign up failed'); setLoading(false); return; }
    router.push('/boq');
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'oklch(0.055 0.010 265)' }}>
      {/* Left panel — blueprint grid decoration */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'oklch(0.042 0.008 265)', borderRight: '1px solid oklch(0.14 0.012 265)' }}>
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(oklch(0.14 0.012 265 / 0.4) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.14 0.012 265 / 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, oklch(0.70 0.22 268 / 0.12) 0%, transparent 70%)' }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
              style={{ background: 'oklch(0.70 0.22 268)', color: 'white' }}>B</div>
            <span className="font-bold text-white text-sm tracking-tight">BOQwise</span>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight mb-4" style={{ color: 'oklch(0.96 0.004 265)' }}>
              Professional BOQ software for Indian architects
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.52 0.018 265)' }}>
              Create detailed Bills of Quantities in minutes, not hours. 150+ pre-priced items for every room and material.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: '⬡', label: '150+ pre-priced rate library items' },
              { icon: '⬡', label: 'GST-aware calculations, markup & discount' },
              { icon: '⬡', label: 'Professional PDF export in one click' },
              { icon: '⬡', label: 'Section-wise breakdown for every room' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <span style={{ color: 'oklch(0.70 0.22 268)' }} className="text-xs">{f.icon}</span>
                <span className="text-xs" style={{ color: 'oklch(0.65 0.015 265)' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-[10px]" style={{ color: 'oklch(0.35 0.012 265)' }}>
            BOQwise © {new Date().getFullYear()} · Built for the Indian architecture & interior design industry
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-black text-white"
              style={{ background: 'oklch(0.70 0.22 268)' }}>B</div>
            <span className="font-bold text-white text-sm">BOQwise</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1.5">
              {tab === 'signin' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-sm" style={{ color: 'oklch(0.52 0.018 265)' }}>
              {tab === 'signin'
                ? 'Sign in to your BOQwise account'
                : 'Start creating professional BOQs in minutes'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg p-1 mb-6" style={{ background: 'oklch(0.085 0.013 265)' }}>
            {(['signin', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className="flex-1 py-2 text-xs font-semibold rounded-md transition-all duration-200"
                style={tab === t
                  ? { background: 'oklch(0.70 0.22 268)', color: 'white' }
                  : { color: 'oklch(0.52 0.018 265)' }}
              >
                {t === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg text-xs"
              style={{ background: 'oklch(0.64 0.22 25 / 0.12)', border: '1px solid oklch(0.64 0.22 25 / 0.25)', color: 'oklch(0.75 0.16 25)' }}>
              {error}
            </div>
          )}

          {tab === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@studio.com" />
              <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
              <SubmitBtn loading={loading} label="Sign In →" />
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Your name" type="text" value={name} onChange={setName} placeholder="Ar. Priya Sharma" required />
                <Field label="City" type="select" value={city} onChange={setCity} options={CITIES} />
              </div>
              <Field label="Firm / Studio name" type="text" value={firmName} onChange={setFirmName} placeholder="PS Design Studio" />
              <Field label="Email address" type="email" value={signupEmail} onChange={setSignupEmail} placeholder="studio@example.com" required />
              <Field label="Password" type="password" value={signupPassword} onChange={setSignupPassword} placeholder="Min. 6 characters" required minLength={6} />
              <SubmitBtn loading={loading} label="Create Account →" />
            </form>
          )}

          <p className="text-center text-[11px] mt-6" style={{ color: 'oklch(0.35 0.012 265)' }}>
            By continuing you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, placeholder, required, minLength, options
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  required?: boolean; minLength?: number; options?: string[];
}) {
  const base = {
    background: 'oklch(0.10 0.012 265)',
    border: '1px solid oklch(0.18 0.014 265)',
    borderRadius: '0.5rem',
    color: 'white',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.15s',
    width: '100%',
    padding: '10px 14px',
  } as React.CSSProperties;

  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'oklch(0.60 0.018 265)', marginBottom: '6px' }}>
        {label}
      </label>
      {type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={base}>
          {options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          style={base}
          onFocus={e => { e.currentTarget.style.borderColor = 'oklch(0.70 0.22 268 / 0.6)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'oklch(0.18 0.014 265)'; }}
        />
      )}
    </div>
  );
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-50 mt-2"
      style={{ background: 'oklch(0.70 0.22 268)', color: 'white' }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Please wait...
        </span>
      ) : label}
    </button>
  );
}
