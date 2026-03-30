'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTasks, useGoals } from '@/hooks/useTasks';
import { useNotifications } from '@/hooks/useNotifications';
import { useDisciplineScore } from '@/hooks/useDisciplineScore';
import { parseMultiTasks } from '@/utils/nlpParser';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MacroGoals from '@/components/MacroGoals';
import TaskList from '@/components/TaskList';
import ExecutionRoom from '@/components/ExecutionRoom';
import AddTaskModal from '@/components/AddTaskModal';
import GoldSparks from '@/components/GoldSparks';
import CinematicReveal from '@/components/CinematicReveal';
import ChronoAmbient from '@/components/ChronoAmbient';
import AudioBraindump from '@/components/AudioBraindump';
import OfflineBadge from '@/components/OfflineBadge';
import MilestoneSplash from '@/components/MilestoneSplash';
import { Plus, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientDashboard({ initialUserId, firstName }: { initialUserId: string; firstName: string }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | undefined>(initialUserId);
  const [isDemo, setIsDemo] = useState(initialUserId === 'demo');

  useEffect(() => {
    const checkStreak = async (uid: string) => {
      try {
        const { data, error } = await supabase.rpc('record_login', { target_user_id: uid });
        if (!error && data && data.is_milestone) {
          setMilestoneVal(data.milestone_val);
        }
      } catch (err) {
        console.error('Streak error:', err);
      }
    };

    if (initialUserId && initialUserId !== 'demo' && initialUserId !== 'ghost-001') {
      checkStreak(initialUserId);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else if (!isDemo) {
        // Don't redirect ghost user on Supabase auth state changes
        try {
          const ghost = localStorage.getItem('midnight_user');
          if (ghost && JSON.parse(ghost).id === 'ghost-001') return;
        } catch {}
        router.push('/login');
      }
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service Worker registration failed: ', err);
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const { tasks, isLoading: tasksLoading, addTask, toggleTask, deleteTask, updateTaskTitle, reorderTasks } = useTasks(userId, isDemo);
  const { goals, subTasks, addGoal, updateGoalProgress, deleteGoal, addSubTask, toggleSubTask, deleteSubTask } = useGoals(userId, isDemo);

  const { score: disciplineScore, lastDelta: lastScoreDelta, applyDelta } = useDisciplineScore(userId, isDemo, tasks);

  // Smart Push Notifications hook
  useNotifications(tasks);

  const todayStrForInit = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStrForInit);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeView, setActiveView] = useState<'tasks' | 'goals' | 'execution'>('tasks');

  // Gold Sparks state
  const [sparkOrigin, setSparkOrigin] = useState<{ x: number; y: number } | null>(null);

  // Cinematic Reveal state
  const [cinematicGoal, setCinematicGoal] = useState<string | null>(null);

  // Milestone Splash state
  const [milestoneVal, setMilestoneVal] = useState<number | null>(null);

  // Haptic feedback
  const haptic = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  // Handle task toggle with sparks + haptic + momentum
  const handleToggleTask = useCallback(
    (id: string, e?: React.MouseEvent) => {
      const task = tasks.find((t) => t.id === id);
      if (task && !task.is_completed) {
        if (e) {
          // Spark from checkbox position
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          setSparkOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
          setTimeout(() => setSparkOrigin(null), 1200);
          haptic(10); // crisp tap
        }
        
        // Award Momentum: +10 points when completing
        applyDelta(10);
      }
      toggleTask(id);
    },
    [tasks, toggleTask, haptic, applyDelta]
  );

  // Handle goal update with cinematic milestone
  const handleGoalUpdate = useCallback(
    (id: string, currentValue: number) => {
      const goal = goals.find((g) => g.id === id);
      if (goal && currentValue >= goal.target_value && goal.current_value < goal.target_value) {
        // Milestone reached!
        setCinematicGoal(goal.title);
        haptic([100, 50, 100]); // heavy double-pulse
        setTimeout(() => setCinematicGoal(null), 4000);
      }
      updateGoalProgress(id, currentValue);
    },
    [goals, updateGoalProgress, haptic]
  );

  // Timeboxing Handshake: Set local storage ghost_timer and jump to Execution Room
  const handleTimeboxClick = useCallback((minutes: number) => {
    const ms = minutes * 60 * 1000;
    localStorage.setItem('ghost_timer', JSON.stringify({
      total: ms,
      remaining: ms,
      running: true,
      lastTick: Date.now()
    }));
    setActiveView('execution');
    haptic([50, 50, 50]); // Triple tick pulse
  }, [haptic]);

  const handleSignOut = async () => {
    // Clear ghost user data if applicable
    try {
      const ghost = localStorage.getItem('midnight_user');
      if (ghost && JSON.parse(ghost).id === 'ghost-001') {
        localStorage.removeItem('midnight_user');
        localStorage.removeItem('midnight_ghost_tasks');
        localStorage.removeItem('midnight_ghost_goals');
        localStorage.removeItem('midnight_ghost_subtasks');
        setUserId(undefined);
        router.push('/login');
        return;
      }
    } catch {}
    await supabase.auth.signOut();
    setIsDemo(false);
    setUserId(undefined);
  };

  const handleDemoLogin = () => {
    setIsDemo(true);
    setUserId('demo');
  };

  // Auth screen
  // Loading
  if (tasksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[var(--color-text-ghost)] uppercase tracking-widest">Loading tasks...</span>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => (t.target_date || '').split('T')[0] === todayStr);
  const pendingToday = todayTasks.filter((t) => !t.is_completed).length;
  const completedToday = todayTasks.filter((t) => t.is_completed).length;

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)] relative overflow-hidden min-w-[380px]">
      {/* Chrono-Ambient Background */}
      {/* <ChronoAmbient /> */}

      {/* Offline Badge */}
      <OfflineBadge />

      {/* Gold Sparks Canvas */}
      <AnimatePresence>
        {sparkOrigin && <GoldSparks x={sparkOrigin.x} y={sparkOrigin.y} />}
      </AnimatePresence>

      {/* Cinematic Milestone Overlay */}
      <AnimatePresence>
        {cinematicGoal && <CinematicReveal text={cinematicGoal} onComplete={() => setCinematicGoal(null)} />}
      </AnimatePresence>

      {/* Streak Milestone Splash */}
      <AnimatePresence>
        {milestoneVal !== null && (
          <MilestoneSplash milestoneVal={milestoneVal} onComplete={() => setMilestoneVal(null)} />
        )}
      </AnimatePresence>

      {/* Sidebar — hidden on mobile */}
      <div className="hidden lg:flex">
        <Sidebar 
          activeView={activeView}
          onSelectView={setActiveView}
          selectedDate={selectedDate} 
          onSelectDate={setSelectedDate} 
          tasks={tasks} 
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        <Header 
          firstName={firstName} 
          onSignOut={handleSignOut} 
          pendingToday={pendingToday} 
          completedToday={completedToday} 
          disciplineScore={disciplineScore}
          lastScoreDelta={lastScoreDelta}
        />

        {/* Progressive Blur Top Mask */}
        <div className="sticky top-[60px] z-20 h-6 pointer-events-none bg-gradient-to-b from-[var(--color-bg)] to-transparent" />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scroll-smooth" id="main-scroll">
          <AnimatePresence mode="wait">
            {activeView === 'goals' ? (
              <motion.div
                key="goals"
                initial={{ opacity: 0, filter: 'blur(8px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(8px)' }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <MacroGoals
                  goals={goals}
                  subTasks={subTasks}
                  onAddGoal={addGoal}
                  onUpdateProgress={handleGoalUpdate}
                  onDeleteGoal={deleteGoal}
                  onAddSubTask={addSubTask}
                  onToggleSubTask={toggleSubTask}
                  onDeleteSubTask={deleteSubTask}
                />
              </motion.div>
            ) : activeView === 'execution' ? (
              <motion.div
                key="execution"
                initial={{ opacity: 0, filter: 'blur(8px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(8px)' }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="h-full"
              >
                <ExecutionRoom 
                  userId={userId} 
                  userName={firstName}
                  onDisciplinePenalty={applyDelta}
                  onSessionComplete={(title) => {
                    addTask(title, todayStrForInit);
                    // Provide a nice haptic tick if available
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, filter: 'blur(8px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(8px)' }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <TaskList
                  tasks={tasks}
                  selectedDate={selectedDate}
                  onToggle={handleToggleTask}
                  onDelete={deleteTask}
                  onUpdateTitle={updateTaskTitle}
                  onSelectDate={setSelectedDate}
                  onReorder={reorderTasks}
                  onTimeboxClick={handleTimeboxClick}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progressive Blur Bottom Mask */}
        <div className="sticky bottom-0 z-20 h-10 pointer-events-none bg-gradient-to-t from-[var(--color-bg)] to-transparent" />

        {/* Audio Braindump Mic */}
        <AudioBraindump 
          activeView={activeView}
          onTranscript={(text) => {
            const parsedItems = parseMultiTasks(text);
            if (parsedItems.length === 0) return;
            
            parsedItems.forEach((item) => {
              if (activeView === 'tasks') {
                addTask(item, todayStr);
              } else {
                addGoal(item, 0, 100);
              }
            });
          }} 
        />

        {/* FAB — Liquid Morphing Plus (Tasks Only) */}
        <AnimatePresence>
          {activeView === 'tasks' && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.12, rotate: 90 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowAddModal(true)}
              className="fixed bottom-[130px] lg:bottom-8 right-6 lg:right-8 w-14 h-14 rounded-full btn-gold shadow-[var(--shadow-gold)] flex items-center justify-center z-40 cursor-pointer hover:brightness-110"
              style={{ filter: 'url(#gooey)' }}
            >
              <Plus className="w-6 h-6 text-white" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* SVG Gooey Filter */}
        <svg className="fixed" width="0" height="0" aria-hidden="true">
          <defs>
            <filter id="gooey">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="gooey" />
              <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
            </filter>
          </defs>
        </svg>

        {/* Add Task Modal */}
        <AddTaskModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={addTask}
          selectedDate={selectedDate}
        />
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav 
        activeView={activeView}
        onSelectView={setActiveView}
        selectedDate={selectedDate} 
        onSelectDate={setSelectedDate} 
        tasks={tasks} 
      />
    </div>
  );
}

// Mobile bottom nav with date quick-select
function MobileNav({
  activeView,
  onSelectView,
  selectedDate,
  onSelectDate,
  tasks,
}: {
  activeView: 'tasks' | 'goals' | 'execution';
  onSelectView: (v: 'tasks' | 'goals' | 'execution') => void;
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
  tasks: { target_date: string; is_completed: boolean }[];
}) {
  const router = useRouter();
  const [showSquadMenu, setShowSquadMenu] = useState(false);
  const [joinId, setJoinId] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return d.toISOString().split('T')[0];
  });

  const taskCountByDate: Record<string, number> = {};
  tasks.forEach((t) => {
    if (!t.is_completed) {
      const dateStr = (t.target_date || '').split('T')[0];
      taskCountByDate[dateStr] = (taskCountByDate[dateStr] || 0) + 1;
    }
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-[var(--color-bg-sidebar)]/95 backdrop-blur-lg border-t border-[var(--color-border)] px-4 py-3 z-50">
      <div className="flex flex-col gap-3 relative">
        {/* Squad Menu Popup */}
        <AnimatePresence>
          {showSquadMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 w-full mb-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl py-3 px-3 shadow-2xl flex flex-col gap-3 backdrop-blur-xl"
            >
              <button
                onClick={() => {
                  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
                  router.push(`/room?id=${roomId}`);
                }}
                className="w-full py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold tracking-wide rounded-lg text-xs uppercase hover:bg-emerald-500/20 transition-colors"
              >
                Create Room
              </button>
              
              <div className="w-full h-px bg-[var(--color-border)]" />
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Room ID..."
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                  className="flex-1 bg-[var(--color-bg-input)] text-[var(--color-text-primary)] text-xs font-mono px-3 py-2 rounded-lg border border-[var(--color-border)] outline-none focus:border-[var(--color-gold)] transition-colors placeholder:font-sans"
                />
                <button
                  onClick={() => {
                    if (joinId.trim()) router.push(`/room?id=${joinId.trim()}`);
                  }}
                  disabled={!joinId.trim()}
                  className="px-3 py-2 bg-[var(--color-bg-sidebar)] text-[var(--color-text-primary)] border border-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs rounded-lg hover:bg-[var(--color-bg-input)] transition-colors"
                >
                  Join
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs */}
        <div className="flex bg-[var(--color-bg-input)] rounded-full p-1 border border-[var(--color-border)]">
          <button
            onClick={() => {
              onSelectView('tasks');
              onSelectDate(todayStr);
              setShowSquadMenu(false);
            }}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3 py-2 rounded-full text-[11px] sm:text-xs font-semibold transition-all ${
              activeView === 'tasks' && !showSquadMenu
                ? 'bg-white text-[var(--color-gold)] shadow-sm ring-1 ring-black/5'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => {
              onSelectView('goals');
              setShowSquadMenu(false);
            }}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3 py-2 rounded-full text-[11px] sm:text-xs font-semibold transition-all ${
              activeView === 'goals' && !showSquadMenu
                ? 'bg-white text-[var(--color-gold)] shadow-sm ring-1 ring-black/5'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer'
            }`}
          >
            Goals
          </button>
          <button
            onClick={() => {
              onSelectView('execution');
              setShowSquadMenu(false);
            }}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3 py-2 rounded-full text-[11px] sm:text-xs font-semibold transition-all ${
              activeView === 'execution' && !showSquadMenu
                ? 'bg-[var(--color-gold-dim)] border border-[var(--color-border-gold)] text-[var(--color-gold)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer'
            }`}
          >
            Execute
          </button>
          <button
            onClick={() => setShowSquadMenu(!showSquadMenu)}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3 py-2 rounded-full text-[11px] sm:text-xs font-semibold transition-all ${
              showSquadMenu
                ? 'bg-[var(--color-gold)] text-white shadow-[var(--shadow-gold)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer'
            }`}
          >
            Squad
          </button>
        </div>

        {/* Date Selector (Only visible in Tasks view and Squad Menu closed) */}
        <AnimatePresence>
          {activeView === 'tasks' && !showSquadMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center gap-1 overflow-x-auto pb-1"
            >
              <button
                onClick={() => onSelectDate(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all ${
                  selectedDate === null
                    ? 'bg-[var(--color-gold-dim)] text-[var(--color-gold)] border border-[var(--color-border-gold)]'
                    : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-input)]'
                }`}
              >
                All
              </button>
              {dates.map((d) => {
                const label =
                  d === todayStr
                    ? 'Today'
                    : new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                const hasTasks = taskCountByDate[d] > 0;
                return (
                  <button
                    key={d}
                    onClick={() => onSelectDate(selectedDate === d ? null : d)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all relative ${
                      selectedDate === d
                        ? 'bg-[var(--color-gold-dim)] text-[var(--color-gold)] border border-[var(--color-border-gold)]'
                        : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-input)]'
                    }`}
                  >
                    {label}
                    {hasTasks && selectedDate !== d && (
                      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
