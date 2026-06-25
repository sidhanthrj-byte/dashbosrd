'use client';

import { LayoutDashboard, Users, KanbanSquare, Clock } from 'lucide-react';
import type { View } from './Sidebar';

type Props = {
  current: View;
  onNavigate: (v: View) => void;
  todayCount?: number;
};

const ITEMS = [
  { id: 'dashboard' as View, label: 'Home',     icon: LayoutDashboard },
  { id: 'leads'     as View, label: 'Leads',    icon: Users },
  { id: 'pipeline'  as View, label: 'Pipeline', icon: KanbanSquare },
  { id: 'today'     as View, label: 'Today',    icon: Clock },
];

export function BottomNav({ current, onNavigate, todayCount = 0 }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border safe-area-pb">
      <div className="flex">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          const hasBadge = id === 'today' && todayCount > 0;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 relative transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                {hasBadge && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] font-black bg-amber-500 text-black rounded-full flex items-center justify-center">
                    {todayCount > 9 ? '9+' : todayCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : ''}`}>{label}</span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
