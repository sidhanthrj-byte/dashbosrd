'use client';

import { useState } from 'react';
import { Sidebar, View } from './Sidebar';
import { Dashboard } from './Dashboard';
import { LeadsView } from './LeadsView';
import { PipelineView } from './PipelineView';
import { TodayView } from './TodayView';

export function CRMApp() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar current={view} onNavigate={setView} />
      <main className="flex-1 overflow-hidden flex flex-col">
        {view === 'dashboard' && <Dashboard onNavigate={setView} />}
        {view === 'leads'     && <LeadsView onNavigateToday={() => setView('today')} />}
        {view === 'pipeline'  && <PipelineView />}
        {view === 'today'     && <TodayView />}
      </main>
    </div>
  );
}
