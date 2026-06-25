'use client';

import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, KanbanSquare, Clock, ChevronRight } from 'lucide-react';

export type View = 'dashboard' | 'leads' | 'pipeline' | 'today';

type NavItem = {
  id: View;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};

type Props = {
  current: View;
  onNavigate: (v: View) => void;
};

export function Sidebar({ current, onNavigate }: Props) {
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(s => {
      setTodayCount(s.todayFollowUps || 0);
    }).catch(() => null);
  }, []);

  const items: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'leads',     label: 'All Leads',  icon: <Users className="w-4 h-4" /> },
    { id: 'pipeline',  label: 'Pipeline',   icon: <KanbanSquare className="w-4 h-4" /> },
    { id: 'today',     label: "Today's Tasks", icon: <Clock className="w-4 h-4" />, badge: todayCount },
  ];

  return (
    <aside className="w-56 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
            <span className="text-white font-black text-xs">P</span>
          </div>
          <div>
            <p className="text-sm font-bold text-sidebar-foreground leading-none">Pongs CRM</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Stretch Ceiling</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(item => {
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <span className={active ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground'}>
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="text-[10px] font-bold bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
              {active && <ChevronRight className="w-3.5 h-3.5 text-primary/60" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground/60">Sidhanth · Pongs Stretch Ceiling</p>
        <p className="text-[10px] text-muted-foreground/40 mt-0.5">AI-powered sales CRM</p>
      </div>
    </aside>
  );
}
