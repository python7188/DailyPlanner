'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Flame, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  firstName?: string;
  onSignOut: () => void;
  pendingToday: number;
  completedToday: number;
  disciplineScore?: number;
  lastScoreDelta?: number;
}

export default function Header({ 
  firstName = 'Hustler', 
  onSignOut, 
  pendingToday, 
  completedToday, 
  disciplineScore = 1000, 
  lastScoreDelta = 0 
}: HeaderProps) {
  const [greeting, setGreeting] = useState('');
  const [liveTime, setLiveTime] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Live clock — ticks every second
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setLiveTime(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const totalToday = pendingToday + completedToday;
  const progressPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-[var(--color-border)] bg-[var(--color-glass)] backdrop-blur-xl"
    >
      <div className="w-full flex items-center justify-between sm:hidden">
        {/* Mobile top strip: Greeting + Sign Out */}
        <div className="flex flex-col gap-0.5">
          <h1 className="text-sm font-semibold tracking-tight">
            <span className="text-[var(--color-text-secondary)]">{greeting}, </span>
            <strong className="text-gradient-gold font-bold">{firstName}</strong>
            <span className="text-[var(--color-text-primary)]">. ✦</span>
          </h1>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSignOut}
          className="p-2 rounded-xl border border-[var(--color-border)] hover:border-red-500/40 bg-[var(--color-bg-card)] hover:bg-red-500/10 transition-all group cursor-pointer"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] group-hover:text-red-400 transition-colors" />
        </motion.button>
      </div>

      {/* Left: Greeting + Date + Live Clock (Desktop only logic inside a shared container or just hiding the greeting on desktop to avoid dupes) */}
      <div className="hidden sm:flex flex-col gap-0.5">
        <h1 className="text-base lg:text-xl font-semibold tracking-tight">
          <span className="text-[var(--color-text-secondary)]">{greeting}, </span>
          <strong className="text-gradient-gold font-bold">{firstName}</strong>
          <span className="text-[var(--color-text-primary)]">. ✦</span>
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[10px] text-[var(--color-text-tertiary)] tracking-wide uppercase">
            {dateLabel}
          </p>
          {liveTime && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl border border-[var(--color-border-gold)] bg-white/40 dark:bg-black/20 backdrop-blur-md text-[10px] font-mono font-bold text-[var(--color-gold)] tracking-widest shadow-sm"
              >
                <Clock className="w-3 h-3 text-[var(--color-gold)]" />
                {liveTime}
              </motion.span>
          )}
        </div>
      </div>

      {/* Center: Today Stats Pills (Scrollable on Mobile) */}
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1 sm:pb-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border)]">
          <Clock className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">{pendingToday}</span>
          <span className="text-[10px] text-[var(--color-text-ghost)] uppercase tracking-wide">pending</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border)]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">{completedToday}</span>
          <span className="text-[10px] text-[var(--color-text-ghost)] uppercase tracking-wide">done</span>
        </div>
        {progressPct > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-gold-dim)] border border-[var(--color-border-gold)]"
          >
            <Flame className="w-3.5 h-3.5 text-[var(--color-gold)]" />
            <span className="text-xs font-bold text-[var(--color-gold)]">{progressPct}%</span>
          </motion.div>
        )}
        {/* Momentum Ticker (Discipline Score) */}
        <motion.div
          key={disciplineScore} // Forces re-animation on score change
          initial={{ backgroundColor: lastScoreDelta > 0 ? 'rgba(34, 197, 94, 0.4)' : lastScoreDelta < 0 ? 'rgba(239, 68, 68, 0.4)' : 'var(--color-bg-card)', scale: lastScoreDelta !== 0 ? 1.05 : 1 }}
          animate={{ backgroundColor: 'var(--color-bg-card)', scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border)] shadow-inner"
        >
          <TrendingUp className={`w-3.5 h-3.5 ${lastScoreDelta > 0 ? 'text-green-400' : lastScoreDelta < 0 ? 'text-red-400' : 'text-[var(--color-text-tertiary)]'}`} />
          <span className="text-xs font-mono font-bold tracking-widest text-[var(--color-text-secondary)]">{disciplineScore}</span>
        </motion.div>
      </div>

      {/* Right: Sign Out (Desktop) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSignOut}
        className="hidden sm:flex p-2.5 rounded-xl border border-[var(--color-border)] hover:border-red-500/40 bg-[var(--color-bg-card)] hover:bg-red-500/10 transition-all group cursor-pointer"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-red-400 transition-colors" />
      </motion.button>
    </motion.header>
  );
}
