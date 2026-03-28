'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays, Sparkles } from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, targetDate: string) => void;
  selectedDate: string | null;
}

export default function AddTaskModal({ isOpen, onClose, onAdd, selectedDate }: AddTaskModalProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(selectedDate || todayStr);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDate(selectedDate || todayStr);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, selectedDate, todayStr]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), date);
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden">
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
              <div className="px-6 py-5 space-y-4">
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

                {/* Date Picker */}
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
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)]">
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
