'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
  'Pune', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Surat',
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
    setLoading(true);
    setError('');
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
    setLoading(true);
    setError('');
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
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 mb-4 shadow-2xl shadow-amber-500/30">
            <FileText className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">BOQwise</h1>
          <p className="text-sm text-zinc-500 mt-1.5">Professional BOQ software for architects &amp; interior designers</p>
        </div>

        {/* Card */}
        <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
          <div className="flex border-b border-[#1e1e1e]">
            {(['signin', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                  tab === t
                    ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/5'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {tab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@studio.com" />
                <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
                <SubmitBtn loading={loading} label="Sign In" />
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <Field label="Your Name" type="text" value={name} onChange={setName} placeholder="Ar. Priya Sharma" required />
                <Field label="Firm / Studio Name" type="text" value={firmName} onChange={setFirmName} placeholder="PS Architects & Interiors" />
                <Field label="Email" type="email" value={signupEmail} onChange={setSignupEmail} placeholder="studio@example.com" required />
                <Field label="Password" type="password" value={signupPassword} onChange={setSignupPassword} placeholder="Min. 6 characters" required minLength={6} />
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">City</label>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  >
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <SubmitBtn loading={loading} label="Create Account" />
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-zinc-700 mt-6">
          BOQwise &copy; {new Date().getFullYear()} · Built for the Indian architecture &amp; design industry
        </p>
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, placeholder, required, minLength
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean; minLength?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
      />
    </div>
  );
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
    >
      {loading ? 'Please wait...' : label}
    </button>
  );
}
