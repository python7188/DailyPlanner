'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Target, LayoutGrid } from 'lucide-react';
import type { Task } from '@/lib/supabase';

interface SidebarProps {
  activeView: 'tasks' | 'goals' | 'execution';
  onSelectView: (view: 'tasks' | 'goals' | 'execution') => void;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  tasks: Task[];
}

const DAYS_LABEL = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function Sidebar({ activeView, onSelectView, selectedDate, onSelectDate, tasks }: SidebarProps) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const todayStr = today.toISOString().split('T')[0];

  // Task count per date for dot indicators
  const taskCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => {
      if (!t.is_completed) {
        map[t.target_date] = (map[t.target_date] || 0) + 1;
      }
    });
    return map;
  }, [tasks]);

  // Calendar grid computation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return cells;
  }, [viewMonth, viewYear]);

  const getDateStr = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${viewYear}-${m}-${d}`;
  };

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  return (
    <aside className="w-full lg:w-72 xl:w-80 border-r border-[var(--color-border)] bg-[var(--color-bg-sidebar)] flex flex-col">
      {/* Logo Strip */}
      <div className="px-6 py-5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 52 52" fill="none">
            <defs>
              <linearGradient id="sideLogoG" x1="0" y1="0" x2="52" y2="52">
                <stop offset="0%" stopColor="#D4A127" />
                <stop offset="50%" stopColor="#B8860B" />
                <stop offset="100%" stopColor="#E6C55A" />
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="20" height="20" rx="4" stroke="url(#sideLogoG)" strokeWidth="2.5" fill="none" />
            <rect x="28" y="4" width="20" height="20" rx="4" stroke="url(#sideLogoG)" strokeWidth="2.5" fill="none" opacity="0.6" />
            <rect x="4" y="28" width="20" height="20" rx="4" stroke="url(#sideLogoG)" strokeWidth="2.5" fill="none" opacity="0.6" />
            <rect x="28" y="28" width="20" height="20" rx="4" stroke="url(#sideLogoG)" strokeWidth="2.5" fill="none" />
            <circle cx="14" cy="14" r="3" fill="url(#sideLogoG)" />
            <circle cx="38" cy="38" r="3" fill="url(#sideLogoG)" />
          </svg>
          <div>
            <h2 className="text-sm font-semibold text-gradient-gold tracking-tight">Daily Planner</h2>
            <p className="text-[10px] text-[var(--color-text-ghost)] uppercase tracking-widest">Elite</p>
          </div>
        </div>
      </div>

      {/* Navigation & Filters */}
      <div className="px-4 py-4 space-y-1 border-b border-[var(--color-border)]">
        <button
          onClick={() => {
            onSelectView('tasks');
            onSelectDate(todayStr);
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
            activeView === 'tasks'
              ? 'bg-[var(--color-gold-dim)] text-[var(--color-gold)] font-semibold border border-[var(--color-border-gold)] shadow-[var(--shadow-gold)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-input)] hover:text-[var(--color-text-primary)] font-medium cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-4 h-4" />
            To Do List
          </div>
          {activeView === 'tasks' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]" />}
        </button>
        
        <button
          onClick={() => {
            onSelectView('goals');
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
            activeView === 'goals'
              ? 'bg-[var(--color-gold-dim)] text-[var(--color-gold)] font-semibold border border-[var(--color-border-gold)] shadow-[var(--shadow-gold)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-input)] hover:text-[var(--color-text-primary)] font-medium cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-3">
            <Target className="w-4 h-4" />
            Goals Dashboard
          </div>
          {activeView === 'goals' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]" />}
        </button>

        <button
          onClick={() => {
            onSelectView('execution');
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
            activeView === 'execution'
              ? 'bg-[var(--color-gold-dim)] text-[var(--color-gold)] font-semibold border border-[var(--color-border-gold)] shadow-[var(--shadow-gold)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-input)] hover:text-[var(--color-text-primary)] font-medium cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-3 relative">
            <div className="absolute inset-0 bg-red-500/10 blur-md rounded-full" />
            <span className="relative w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Execution Room
          </div>
          {activeView === 'execution' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]" />}
        </button>

        <button
          onClick={() => {
            const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            const url = `${window.location.origin}/room/${roomId}`;
            navigator.clipboard.writeText(url);
            alert(`War Room link copied: ${url}\n\nRedirecting you to the room...`);
            window.location.href = `/room/${roomId}`;
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 mt-2 rounded-xl text-xs font-semibold uppercase tracking-widest text-[var(--color-bg)] bg-[var(--color-gold)] hover:bg-yellow-600 transition-all shadow-[var(--shadow-gold)]"
        >
          <span>Invite Squad (War Room)</span>
        </button>
      </div>

            {/* Calendar */}
            <div className="px-4 py-4 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[var(--color-text-primary)] tracking-wide uppercase">
            {monthLabel}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-[var(--color-bg-input)] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-[var(--color-bg-input)] transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
            </button>
          </div>
        </div>

        {/* Day Labels */}
        <div className="grid grid-cols-7 gap-0 mb-1">
          {DAYS_LABEL.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-[var(--color-text-ghost)] py-1 uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} className="h-9" />;

            const dateStr = getDateStr(day);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasTasks = taskCountByDate[dateStr] > 0;

            return (
              <motion.button
                key={dateStr}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSelectDate(isSelected ? null : dateStr)}
                className={`h-9 w-full flex flex-col items-center justify-center rounded-lg text-xs transition-all relative ${
                  isSelected
                    ? 'bg-[var(--color-gold)] text-white font-semibold shadow-[var(--shadow-gold)]'
                    : isToday
                    ? 'bg-[var(--color-gold-dim)] text-[var(--color-gold)] font-semibold ring-1 ring-[var(--color-gold-ring)]'
                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-input)]'
                }`}
              >
                {day}
                {hasTasks && !isSelected && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--color-gold)]" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="flex-1" />
      <div className="px-4 py-4 border-t border-[var(--color-border)]">
        <p className="text-[10px] text-[var(--color-text-ghost)] text-center">
          Version 2.0 · Elite Edition
        </p>
      </div>
    </aside>
  );
}
