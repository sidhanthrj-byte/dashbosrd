'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, View } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Dashboard } from './Dashboard';
import { LeadsView } from './LeadsView';
import { PipelineView } from './PipelineView';
import { TodayView } from './TodayView';
import { QuotesView } from './QuotesView';

export function CRMApp() {
  const [view, setView] = useState<View>('dashboard');
  const [user, setUser] = useState<{ name: string; city: string } | null>(null);
  const [todayCount, setTodayCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user) router.push('/login');
      else setUser(data.user);
    });
    fetch('/api/stats').then(r => r.json()).then(s => setTodayCount(s.todayFollowUps || 0)).catch(() => null);
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (!user) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <Sidebar
          current={view}
          onNavigate={setView}
          userName={user.name}
          userCity={user.city}
          onLogout={handleLogout}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col pb-16 md:pb-0">
        {view === 'dashboard' && <Dashboard onNavigate={setView} />}
        {view === 'leads'     && <LeadsView onNavigateToday={() => setView('today')} />}
        {view === 'pipeline'  && <PipelineView />}
        {view === 'today'     && <TodayView />}
        {view === 'quotes'    && <QuotesView />}
      </main>

      {/* Bottom nav — mobile only */}
      <div className="md:hidden">
        <BottomNav current={view} onNavigate={setView} todayCount={todayCount} />
      </div>
    </div>
  );
}
