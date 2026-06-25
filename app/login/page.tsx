'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CITIES = [
  { value: 'Mumbai', emoji: '🏙️', sub: 'Maharashtra' },
  { value: 'Bangalore', emoji: '🌿', sub: 'Karnataka' },
  { value: 'Chennai', emoji: '🌊', sub: 'Tamil Nadu' },
  { value: 'Pune', emoji: '🏔️', sub: 'Maharashtra' },
  { value: 'Hyderabad', emoji: '🏯', sub: 'Telangana' },
];

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sign in state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign up state
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [city, setCity] = useState('');

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Sign in failed'); return; }
      router.push('/');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!city) { setError('Please select a city'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: signupEmail, password: signupPassword, city }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Sign up failed'); return; }
      router.push('/');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 mb-4 shadow-lg shadow-amber-500/20">
            <span className="text-black font-black text-lg">P</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pongs CRM</h1>
          <p className="text-sm text-zinc-500 mt-1">Stretch Ceiling Sales Platform</p>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
          {/* Tabs */}
          <div className="flex border-b border-[#1e1e1e]">
            <button
              onClick={() => { setTab('signin'); setError(''); }}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                tab === 'signin'
                  ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/5'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('signup'); setError(''); }}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                tab === 'signup'
                  ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/5'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {tab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Sidhanth Kumar"
                    className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                  />
                </div>

                {/* City selector */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Your City</label>
                  <div className="grid grid-cols-3 sm:grid-cols-2 gap-2">
                    {CITIES.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCity(c.value)}
                        className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                          city === c.value
                            ? 'border-amber-500/60 bg-amber-500/10 shadow-sm shadow-amber-500/10'
                            : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a] hover:bg-[#1f1f1f]'
                        }`}
                      >
                        <span className="text-lg mb-1">{c.emoji}</span>
                        <span className={`text-xs font-semibold leading-none ${city === c.value ? 'text-amber-400' : 'text-zinc-300'}`}>
                          {c.value}
                        </span>
                        <span className="text-[10px] text-zinc-600 mt-0.5">{c.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-zinc-700 mt-6">
          Pongs Stretch Ceiling &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
