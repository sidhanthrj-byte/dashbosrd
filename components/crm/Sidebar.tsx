'use client';

import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, KanbanSquare, Clock, ChevronRight, LogOut, MapPin, FileText } from 'lucide-react';

export type View = 'dashboard' | 'leads' | 'pipeline' | 'today' | 'quotes';

type NavItem = {
  id: View;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};

type Props = {
  current: View;
  onNavigate: (v: View) => void;
  userName?: string;
  userCity?: string;
  onLogout?: () => void;
};

export function Sidebar({ current, onNavigate, userName, userCity, onLogout }: Props) {
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(s => {
      setTodayCount(s.todayFollowUps || 0);
    }).catch(() => null);
  }, []);

  const items: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard',      icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'leads',     label: 'All Leads',       icon: <Users className="w-4 h-4" /> },
    { id: 'pipeline',  label: 'Pipeline',        icon: <KanbanSquare className="w-4 h-4" /> },
    { id: 'today',     label: "Today's Tasks",   icon: <Clock className="w-4 h-4" />, badge: todayCount },
    { id: 'quotes',    label: 'Quotations',      icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-56 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <span className="text-black font-black text-xs">P</span>
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
                <span className="text-[10px] font-bold bg-amber-500 text-black rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
              {active && <ChevronRight className="w-3.5 h-3.5 text-primary/60" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border space-y-3">
        {(userName || userCity) && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-primary font-bold text-[10px]">
                {userName ? userName[0].toUpperCase() : '?'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground leading-none truncate">{userName}</p>
              {userCity && (
                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  {userCity}
                </p>
              )}
            </div>
          </div>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        )}
        {!userName && (
          <p className="text-[10px] text-muted-foreground/40">AI-powered sales CRM</p>
        )}
      </div>
    </aside>
  );
}
