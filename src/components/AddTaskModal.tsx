'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays, Sparkles } from 'lucide-react';
import { getLocalDateString } from '@/utils/timeParser';



interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, targetDate: string, startTime?: string, endTime?: string, isDaily?: boolean) => void;
  selectedDate: string | null;
}

export default function AddTaskModal({ isOpen, onClose, onAdd, selectedDate }: AddTaskModalProps) {
  const todayStr = getLocalDateString();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(selectedDate || todayStr);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isDaily, setIsDaily] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDate(selectedDate || todayStr);
      setStartTime('');
      setEndTime('');
      setIsDaily(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, selectedDate, todayStr]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    // Pass raw HH:MM values — TaskCard handles AM/PM display formatting
    // Supabase time columns require HH:MM, not "9:00 AM" strings
    onAdd(title.trim(), date, startTime || undefined, endTime || undefined, isDaily);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[calc(100%-2rem)] max-w-md"
          >
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-gold)]" />
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">New Task</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-bg-input)] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4 overflow-y-auto">
                {/* Title Input */}
                <div>
                  <label className="block text-[10px] font-medium text-[var(--color-text-ghost)] uppercase tracking-widest mb-2">
                    Task
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="What needs to be done?"
                    className="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-ghost)] focus:outline-none focus:border-[var(--color-border-gold)] focus:ring-2 focus:ring-[var(--color-gold-dim)] transition-all"
                  />
                  {/* Quick Examples */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {['Hit the gym', 'Read 20 pages', 'Deep work session', 'Study Chapter 4'].map((example) => (
                      <button
                        key={example}
                        onClick={() => setTitle(example)}
                        className="text-[10px] px-2.5 py-1 rounded-md bg-[var(--color-bg-sidebar)] border border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-gold)] hover:text-[var(--color-gold)] hover:bg-[var(--color-gold-dim)] transition-all cursor-pointer whitespace-nowrap"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Date */}
                <div>
                  <label className="block text-[10px] font-medium text-[var(--color-text-ghost)] uppercase tracking-widest mb-2">
                    Target Date
                  </label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-ghost)]" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-gold)] focus:ring-2 focus:ring-[var(--color-gold-dim)] transition-all"
                    />
                  </div>
                </div>

                {/* Time Blocking Row */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-medium text-[var(--color-text-ghost)] uppercase tracking-widest mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-gold)] focus:ring-2 focus:ring-[var(--color-gold-dim)] transition-all appearance-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-medium text-[var(--color-text-ghost)] uppercase tracking-widest mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-gold)] focus:ring-2 focus:ring-[var(--color-gold-dim)] transition-all appearance-none"
                    />
                  </div>
                </div>

                {/* Daily Habit Toggle */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Daily Habit</span>
                  <button
                    type="button"
                    onClick={() => setIsDaily(!isDaily)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none ${
                      isDaily 
                        ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' 
                        : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${
                        isDaily ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-card)] shrink-0">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-input)] transition-all cursor-pointer hover:brightness-110"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className="btn-gold px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 shadow-[var(--shadow-gold)] cursor-pointer hover:brightness-110 transition-all"
                >
                  Add Task
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
