'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  CheckCircle2, Clock, ListChecks, ChevronDown, Sparkles,
  AlignLeft, Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react';
import TaskCard from './TaskCard';
import type { Task } from '@/lib/supabase';

interface TaskListProps {
  tasks: Task[];
  selectedDate: string | null;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onSelectDate?: (date: string | null) => void;
  onReorder?: (newOrder: Task[]) => void;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function TaskList({
  tasks,
  selectedDate,
  onToggle,
  onDelete,
  onUpdateTitle,
  onSelectDate,
  onReorder,
}: TaskListProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);

  // Calendar state
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

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
    month: 'long', year: 'numeric',
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  // Task counts for calendar dots
  const taskCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => {
      if (!t.is_completed) map[t.target_date] = (map[t.target_date] || 0) + 1;
    });
    return map;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (!selectedDate) return tasks;
    return tasks.filter((t) => t.target_date === selectedDate);
  }, [tasks, selectedDate]);

  const pendingTasks = filteredTasks.filter((t) => !t.is_completed);
  const completedTasks = filteredTasks.filter((t) => t.is_completed);

  const groupedPending = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    pendingTasks.forEach((t) => {
      if (!groups[t.target_date]) groups[t.target_date] = [];
      groups[t.target_date].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [pendingTasks]);

  const getDateHeading = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    if (dateStr === tomorrow) return 'Tomorrow';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  };

  const totalFiltered = filteredTasks.length;
  const completedCount = completedTasks.length;
  const completionRate = totalFiltered > 0 ? Math.round((completedCount / totalFiltered) * 100) : 0;

  // Selected date display label
  const selectedDateLabel = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      })
    : null;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">

      {/* ── Section Header ── */}
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-[var(--color-gold)]" />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest">
              To-Do List
            </span>
          </div>

          {/* Stats chips */}
          <div className="hidden sm:flex items-center gap-3 ml-2">
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-ghost)]">
              <Sparkles className="w-3 h-3" />
              <span className="font-semibold text-[var(--color-text-tertiary)]">{pendingTasks.length}</span> active
            </div>
            <div className="w-px h-3 bg-[var(--color-border)]" />
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-ghost)]">
              <CheckCircle2 className="w-3 h-3 text-[var(--color-success)]" />
              <span className="font-semibold text-[var(--color-text-tertiary)]">{completedCount}</span> done
            </div>
            <div className="w-px h-3 bg-[var(--color-border)]" />
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-ghost)]">
              <Clock className="w-3 h-3" />
              <span className="font-semibold text-gradient-gold">{completionRate}%</span>
            </div>
          </div>
        </div>

        {/* Calendar toggle + All/Today quick filter */}
        <div className="flex items-center gap-2">
          {selectedDate && onSelectDate && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => onSelectDate(null)}
              className="text-[10px] font-medium text-[var(--color-gold)] hover:underline px-2 py-1 rounded-lg hover:bg-[var(--color-gold-dim)] transition-all"
            >
              Show All
            </motion.button>
          )}
          <motion.button
            onClick={() => setShowCalendar(!showCalendar)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-semibold uppercase tracking-wider transition-all ${
              showCalendar
                ? 'bg-[var(--color-gold-dim)] border-[var(--color-border-gold)] text-[var(--color-gold)]'
                : 'border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-gold)] hover:bg-[var(--color-gold-dim)]'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <Calendar className="w-3 h-3" />
            <span className="hidden sm:inline">Calendar</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ── Inline Calendar Picker ── */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-4 shadow-[var(--shadow-soft)]">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
                  {monthLabel}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-[var(--color-bg-input)] transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                  </button>
                  <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-[var(--color-bg-input)] transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                  </button>
                </div>
              </div>
              {/* Day labels */}
              <div className="grid grid-cols-7 gap-0 mb-1">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-[9px] font-medium text-[var(--color-text-ghost)] py-1 uppercase">
                    {d}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0">
                {calendarDays.map((day, i) => {
                  if (day === null) return <div key={`e-${i}`} className="h-8" />;
                  const dateStr = getDateStr(day);
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  const hasTasks = taskCountByDate[dateStr] > 0;
                  return (
                    <motion.button
                      key={dateStr}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (onSelectDate) onSelectDate(isSelected ? null : dateStr);
                        setShowCalendar(false);
                      }}
                      className={`h-8 w-full flex flex-col items-center justify-center rounded-lg text-xs transition-all relative ${
                        isSelected
                          ? 'bg-[var(--color-gold)] text-white font-semibold shadow-[var(--shadow-gold)]'
                          : isToday
                          ? 'bg-[var(--color-gold-dim)] text-[var(--color-gold)] font-semibold ring-1 ring-[var(--color-gold-ring)]'
                          : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-input)]'
                      }`}
                    >
                      {day}
                      {hasTasks && !isSelected && (
                        <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[var(--color-gold)]" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Selected Date / Day Banner ── */}
      <AnimatePresence>
        {selectedDate && selectedDateLabel && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-gold-dim)] border border-[var(--color-border-gold)]"
          >
            <Calendar className="w-3.5 h-3.5 text-[var(--color-gold)]" />
            <span className="text-xs font-semibold text-[var(--color-gold)]">
              {selectedDate === todayStr ? '📅 Today · ' : ''}{selectedDateLabel}
            </span>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ── Column labels ── */}
      <motion.div
        className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-border)] mb-1 select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="w-[18px]" />
        <div className="w-3.5" />
        <div className="flex-1 text-[10px] font-semibold text-[var(--color-text-ghost)] uppercase tracking-widest flex items-center gap-1">
          <AlignLeft className="w-3 h-3" /> Task
        </div>
        <div className="text-[10px] font-semibold text-[var(--color-text-ghost)] uppercase tracking-widest flex items-center gap-1 w-16 justify-center">
          <Calendar className="w-3 h-3" /> Date
        </div>
        <div className="w-7" />
      </motion.div>

      {/* ── Empty State ── */}
      {filteredTasks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <motion.div
            className="w-16 h-16 rounded-2xl bg-[var(--color-gold-dim)] border border-[var(--color-border-gold)] flex items-center justify-center mb-4"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ListChecks className="w-8 h-8 text-[var(--color-gold)]" />
          </motion.div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">No tasks here yet</p>
          <p className="text-xs text-[var(--color-text-ghost)] mt-1">
            {selectedDate ? 'No tasks for this date. Pick another day.' : 'Create one to get started'}
          </p>
        </motion.div>
      )}

      {/* ── Pending Tasks ── */}
      {(selectedDate ? [[selectedDate, pendingTasks] as [string, Task[]]] : groupedPending).map(
        ([date, dateTasks]) => (
          <div key={date} className="mb-4">
            {!selectedDate && (
              <motion.div
                className="flex items-center gap-2 px-4 py-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-[10px] font-semibold text-[var(--color-text-ghost)] uppercase tracking-widest">
                  {getDateHeading(date)}
                </h3>
                {date === todayStr && (
                  <motion.span
                    className="px-2 py-0.5 text-[9px] font-bold bg-[var(--color-gold-dim)] text-[var(--color-gold)] rounded-full border border-[var(--color-border-gold)]"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    Focus
                  </motion.span>
                )}
                <div className="flex-1 h-px bg-[var(--color-border)] opacity-50" />
              </motion.div>
            )}
            <div>
              <Reorder.Group axis="y" values={dateTasks} onReorder={onReorder || (() => {})}>
                <AnimatePresence mode="popLayout">
                  {dateTasks.map((task, i) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={onToggle}
                      onDelete={onDelete}
                      onUpdateTitle={onUpdateTitle}
                      isToday={task.target_date === todayStr}
                      index={i}
                    />
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            </div>
          </div>
        )
      )}

      {/* ── Completed Section ── */}
      {completedTasks.length > 0 && (
        <div className="mt-6">
          <motion.button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 px-4 py-2 w-full group hover:bg-[var(--color-bg-card)] rounded-lg transition-colors"
            whileTap={{ scale: 0.99 }}
          >
            <motion.div animate={{ rotate: showCompleted ? 0 : -90 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-ghost)]" />
            </motion.div>
            <h3 className="text-[10px] font-semibold text-[var(--color-text-ghost)] uppercase tracking-widest">
              Completed
            </h3>
            <span className="text-[10px] text-[var(--color-text-ghost)] opacity-60">
              {completedTasks.length}
            </span>
            <div className="flex-1 h-px bg-[var(--color-border)] opacity-30" />
          </motion.button>

          <AnimatePresence>
            {showCompleted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <AnimatePresence mode="popLayout">
                  {completedTasks.map((task, i) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={onToggle}
                      onDelete={onDelete}
                      onUpdateTitle={onUpdateTitle}
                      isToday={false}
                      index={i}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
