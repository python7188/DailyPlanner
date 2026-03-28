'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Plus, Trash2, TrendingUp, X, Zap, Trophy, Flame,
  Dumbbell, BookOpen, Briefcase, Palette, Music, FlaskConical,
  Languages, Heart, Code, Rocket, Star, CheckSquare, Square,
  ChevronDown,
} from 'lucide-react';
import type { Goal, SubTask } from '@/lib/supabase';
import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

/* ── Icon mapping ──────────────────────────────────────── */
function getGoalIcon(title: string) {
  const l = title.toLowerCase();
  if (l.includes('gym') || l.includes('workout') || l.includes('fitness') || l.includes('physique') || l.includes('kg'))
    return <Dumbbell className="w-5 h-5" />;
  if (l.includes('study') || l.includes('read') || l.includes('learn') || l.includes('book') || l.includes('bitsat'))
    return <BookOpen className="w-5 h-5" />;
  if (l.includes('work') || l.includes('business') || l.includes('project') || l.includes('career') || l.includes('brand') || l.includes('nubie'))
    return <Briefcase className="w-5 h-5" />;
  if (l.includes('design') || l.includes('art') || l.includes('creative'))
    return <Palette className="w-5 h-5" />;
  if (l.includes('music') || l.includes('spotify') || l.includes('playlist'))
    return <Music className="w-5 h-5" />;
  if (l.includes('chemistry') || l.includes('science') || l.includes('lab'))
    return <FlaskConical className="w-5 h-5" />;
  if (l.includes('language') || l.includes('sanskrit') || l.includes('english'))
    return <Languages className="w-5 h-5" />;
  if (l.includes('health') || l.includes('meditation') || l.includes('sleep'))
    return <Heart className="w-5 h-5" />;
  if (l.includes('code') || l.includes('dev') || l.includes('programming'))
    return <Code className="w-5 h-5" />;
  if (l.includes('launch') || l.includes('ship') || l.includes('deploy'))
    return <Rocket className="w-5 h-5" />;
  return <Star className="w-5 h-5" />;
}

/* ── Animated counter ──────────────────────────────────── */
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);
  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    prevValue.current = value;
    const controls = animate(from, to, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(v) {
        if (nodeRef.current) nodeRef.current.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [value, suffix]);
  return <span ref={nodeRef}>{Math.round(value)}{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────
   GOAL CARD
───────────────────────────────────────────────────────── */
function GoalCard({
  goal,
  index,
  onDelete,
  onUpdateProgress,
  subtasks,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: {
  goal: Goal;
  index: number;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, val: number) => void;
  subtasks: SubTask[];
  onAddSubtask: (goalId: string, title: string, achievedValue: number) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [newSubText, setNewSubText] = useState('');
  const [newSubValue, setNewSubValue] = useState<string>('');
  const [hovered, setHovered] = useState(false);

  // Filter subtasks for this specific goal
  const goalSubtasks = subtasks;
  const completedSubsCount = goalSubtasks.filter(s => s.is_completed).length;
  const totalSubs = goalSubtasks.length;

  // Find max achieved value from completed subtasks
  let maxAchieved = goal.current_value;
  goalSubtasks.forEach(s => {
    if (s.is_completed && s.achieved_value > maxAchieved) {
      maxAchieved = s.achieved_value;
    }
  });

  // Effective current metrics
  // Check if we are going up (like 66 to 75) or down (like 100 to 50)
  const isDescending = goal.start_value > goal.target_value;
  
  // To keep math simple, track the generic numeric delta
  let totalDistance = Math.abs(goal.target_value - goal.start_value);
  if (totalDistance === 0) totalDistance = 1; // avoid /0

  let currentDelta = Math.abs(maxAchieved - goal.start_value);
  let progress = Math.min(100, Math.max(0, Math.round((currentDelta / totalDistance) * 100)));

  const icon = getGoalIcon(goal.title);

  const handleAddSub = () => {
    if (!newSubText.trim()) return;
    const achieveVal = Number(newSubValue) || goal.target_value;
    onAddSubtask(goal.id, newSubText.trim(), achieveVal);
    setNewSubText('');
    setNewSubValue('');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-border-gold)] rounded-2xl overflow-hidden transition-all hover:shadow-[var(--shadow-gold)]"
    >
      {/* Hover shimmer overlay */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background: 'linear-gradient(135deg, transparent 30%, rgba(184,134,11,0.04) 50%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 p-5">
        {/* ── Top row: Icon + Title + Delete ── */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2.5 rounded-xl bg-[var(--color-gold-dim)] border border-[var(--color-border-gold)] text-[var(--color-gold)] flex-shrink-0 transition-transform duration-300 ${hovered ? 'scale-110' : ''}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] leading-snug">
              {goal.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <TrendingUp className="w-3 h-3 text-[var(--color-gold)]" />
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {totalSubs > 0
                  ? `${completedSubsCount}/${totalSubs} subtasks`
                  : `${maxAchieved} / ${goal.target_value}`}
              </span>
              {/* Status label */}
              {progress >= 100 ? (
                <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5 ml-1">
                  <Trophy className="w-3 h-3" /> Done!
                </span>
              ) : progress >= 75 ? (
                <span className="text-[10px] font-bold text-[var(--color-gold)] flex items-center gap-0.5 ml-1">
                  <Flame className="w-3 h-3" /> On fire
                </span>
              ) : progress >= 50 ? (
                <span className="text-[10px] font-medium text-[var(--color-gold)] ml-1">On track</span>
              ) : null}
            </div>
          </div>
          <motion.button
            onClick={() => onDelete(goal.id)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 transition-all flex-shrink-0 cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 className="w-3.5 h-3.5 text-[var(--color-danger)]" />
          </motion.button>
        </div>

        {/* ── Bold Progress Bar (no animation, clear visual weight) ── */}
        <div className="mb-4 relative group/progress">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-[var(--color-text-ghost)] uppercase tracking-widest">Progress</span>
            <span className="text-sm font-black text-[var(--color-gold)]">{progress}%</span>
          </div>
          <div className="h-3 bg-[var(--color-bg-input)] rounded-full overflow-hidden border border-[var(--color-border)]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: progress >= 100
                  ? 'linear-gradient(90deg, #3EA87A, #52C89A)'
                  : 'linear-gradient(90deg, #B8860B, #D4A127, #E6C55A)',
              }}
            />
          </div>

          {/* Intelligent Progress Tooltip on Hover */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 opacity-0 pointer-events-none group-hover/progress:opacity-100 group-hover/progress:pointer-events-auto transition-opacity z-20">
            <div className="bg-[var(--color-bg-sidebar)]/90 backdrop-blur-xl border border-[var(--color-border-gold)] rounded-xl p-3 shadow-[var(--shadow-gold)] text-[10px] text-[var(--color-text-secondary)]">
              <p className="font-bold text-[var(--color-gold)] uppercase tracking-widest mb-2 border-b border-[var(--color-border)] pb-1">Intelligent Math</p>
              <div className="flex justify-between mb-1">
                <span>Start Point:</span>
                <span className="font-mono text-white">{goal.start_value}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Current Point:</span>
                <span className="font-mono text-white">{maxAchieved}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Target Point:</span>
                <span className="font-mono text-[var(--color-gold)]">{goal.target_value}</span>
              </div>
              <div className="flex justify-between mt-2 pt-1 border-t border-[var(--color-border)]">
                <span>Delta:</span>
                <span className="font-mono text-white font-bold">{currentDelta} / {totalDistance}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Manual metric slider (only if no subtasks) ── */}
        {totalSubs === 0 && (
          <div className="mb-4">
            <input
              type="range"
              min={isDescending ? goal.target_value : goal.start_value}
              max={isDescending ? goal.start_value : goal.target_value}
              value={goal.current_value}
              onChange={(e) => onUpdateProgress(goal.id, Number(e.target.value))}
              className="w-full h-1.5 appearance-none bg-[var(--color-bg-input)] rounded-full cursor-pointer accent-[var(--color-gold)]"
              style={{ direction: isDescending ? 'rtl' : 'ltr' }}
            />
          </div>
        )}

        {/* ── Subtasks toggle ── */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-text-tertiary)] hover:text-[var(--color-gold)] hover:brightness-110 uppercase tracking-widest transition-colors w-full cursor-pointer"
        >
          <motion.div animate={{ rotate: expanded ? 0 : -90 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
          Subtasks {totalSubs > 0 && `(${completedSubsCount}/${totalSubs})`}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2">
                {goalSubtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-2 group/sub"
                  >
                    <button
                      onClick={() => onToggleSubtask(sub.id)}
                      className="flex-shrink-0 cursor-pointer hover:brightness-110 transition-all"
                    >
                      {sub.is_completed
                        ? <CheckSquare className="w-4 h-4 text-[var(--color-gold)]" />
                        : <Square className="w-4 h-4 text-[var(--color-text-ghost)] hover:text-[var(--color-gold)] transition-colors" />
                      }
                    </button>
                    <div className="flex-1 flex justify-between items-center">
                      <span className={`text-xs leading-snug ${sub.is_completed ? 'line-through text-[var(--color-text-ghost)]' : 'text-[var(--color-text-primary)]'}`}>
                        {sub.title}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--color-gold)] font-medium bg-[var(--color-gold-dim)] px-1.5 py-0.5 rounded ml-2">
                        {sub.achieved_value}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteSubtask(sub.id)}
                      className="opacity-0 group-hover/sub:opacity-100 p-0.5 rounded hover:bg-red-50 transition-all cursor-pointer hover:brightness-90"
                    >
                      <X className="w-3 h-3 text-[var(--color-danger)]" />
                    </button>
                  </div>
                ))}

                {/* Add subtask */}
                <div className="flex items-center gap-2 mt-2">
                  <Plus className="w-3.5 h-3.5 text-[var(--color-text-ghost)] flex-shrink-0" />
                  <input
                    type="text"
                    value={newSubText}
                    onChange={(e) => setNewSubText(e.target.value)}
                    placeholder="Subtask name"
                    className="flex-1 min-w-0 text-xs bg-transparent border-b border-[var(--color-border)] focus:border-[var(--color-gold)] outline-none py-1 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-ghost)] transition-colors"
                  />
                  <input
                    type="number"
                    value={newSubValue}
                    onChange={(e) => setNewSubValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSub()}
                    placeholder={`e.g. ${goal.target_value}`}
                    className="w-16 text-xs bg-transparent border-b border-[var(--color-border)] focus:border-[var(--color-gold)] outline-none py-1 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-ghost)] transition-colors"
                  />
                  {newSubText.trim() && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      onClick={handleAddSub}
                      className="text-[10px] font-semibold text-[var(--color-gold)] hover:underline cursor-pointer hover:brightness-110"
                    >
                      Add
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   MACRO GOALS DASHBOARD
═══════════════════════════════════════════════════════ */
interface MacroGoalsProps {
  goals: Goal[];
  subTasks: SubTask[];
  onAddGoal: (title: string, startValue: number, targetValue: number) => void;
  onUpdateProgress: (id: string, currentMetric: number) => void;
  onDeleteGoal: (id: string) => void;
  onAddSubTask: (goalId: string, title: string, achievedValue: number) => void;
  onToggleSubTask: (id: string) => void;
  onDeleteSubTask: (id: string) => void;
}

export default function MacroGoals({
  goals, subTasks, onAddGoal, onUpdateProgress, onDeleteGoal, onAddSubTask, onToggleSubTask, onDeleteSubTask
}: MacroGoalsProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState('0');
  const [newTarget, setNewTarget] = useState('100');

  /* ── Stats ── */
  const stats = useMemo(() => {
    const total = goals.length;
    let sumProg = 0;
    let onTrackCount = 0;

    goals.forEach(g => {
      const gSubs = subTasks.filter(s => s.goal_id === g.id);
      let maxAch = g.current_value;
      gSubs.forEach(s => {
        if (s.is_completed && s.achieved_value > maxAch) maxAch = s.achieved_value;
      });
      let dist = Math.abs(g.target_value - g.start_value);
      if (dist === 0) dist = 1;
      let d = Math.abs(maxAch - g.start_value);
      let p = Math.max(0, Math.min(100, (d / dist) * 100));
      sumProg += p;
      if (p >= 50) onTrackCount++;
    });

    return { total, avgCompletion: total > 0 ? Math.round(sumProg / total) : 0, onTrack: onTrackCount };
  }, [goals, subTasks]);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAddGoal(newTitle.trim(), Number(newStart) || 0, Number(newTarget) || 100);
    setNewTitle('');
    setNewStart('0');
    setNewTarget('100');
    setShowAdd(false);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">

      {/* ── Section Header ── */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--color-gold-dim)] border border-[var(--color-border-gold)]">
            <Target className="w-[18px] h-[18px] text-[var(--color-gold)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
              Goals
            </h2>
            <p className="text-[10px] text-[var(--color-text-ghost)] mt-0.5">
              Track and achieve your objectives
            </p>
          </div>
        </div>
        <motion.button
          onClick={() => setShowAdd(!showAdd)}
          className="p-2 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-border-gold)] hover:bg-[var(--color-gold-dim)] transition-all cursor-pointer hover:brightness-110"
          whileHover={{ scale: 1.05, rotate: showAdd ? 45 : 0 }}
          whileTap={{ scale: 0.95 }}
        >
          {showAdd
            ? <X className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            : <Plus className="w-4 h-4 text-[var(--color-text-tertiary)]" />}
        </motion.button>
      </motion.div>

      {/* ── Hero Stats Row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: <Target className="w-4 h-4 text-[var(--color-gold)]" />, suffix: '' },
          { label: 'Avg Progress', value: stats.avgCompletion, icon: <TrendingUp className="w-4 h-4 text-[var(--color-gold)]" />, suffix: '%' },
          { label: 'On Track', value: stats.onTrack, icon: <Trophy className="w-4 h-4 text-emerald-500" />, suffix: '' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-3 sm:p-4 hover:border-[var(--color-border-gold)] transition-all hover:shadow-[var(--shadow-gold)] group"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[var(--color-gold-dim)]">{stat.icon}</div>
              <div>
                <p className="text-[9px] text-[var(--color-text-ghost)] uppercase tracking-widest">{stat.label}</p>
                <p className="text-lg font-black text-[var(--color-text-primary)]">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Add Goal Form ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-gold)] rounded-2xl p-5 space-y-4 shadow-[var(--shadow-gold)]">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-[var(--color-gold)]" />
                <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">New Goal</span>
              </div>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What do you want to achieve?"
                className="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-ghost)] focus:outline-none focus:border-[var(--color-border-gold)] focus:ring-2 focus:ring-[var(--color-gold-dim)] transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] text-[var(--color-text-ghost)] uppercase tracking-widest mb-1.5">Start Value</label>
                  <input
                    type="number"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-gold)] transition-all"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] text-[var(--color-text-ghost)] uppercase tracking-widest mb-1.5">Target Value</label>
                  <input
                    type="number"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-gold)] transition-all"
                  />
                </div>
                <motion.button
                  onClick={handleAdd}
                  className="btn-gold px-6 py-2.5 rounded-xl text-xs font-semibold self-end shadow-[var(--shadow-gold)] cursor-pointer hover:brightness-110 transition-all"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Create Goal
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Goals Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {goals.map((goal, i) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={i}
              onDelete={onDeleteGoal}
              onUpdateProgress={onUpdateProgress}
              subtasks={subTasks.filter(s => s.goal_id === goal.id)}
              onAddSubtask={onAddSubTask}
              onToggleSubtask={onToggleSubTask}
              onDeleteSubtask={onDeleteSubTask}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ── Empty state ── */}
      {goals.length === 0 && !showAdd && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <motion.div
            className="w-20 h-20 rounded-3xl bg-[var(--color-gold-dim)] border border-[var(--color-border-gold)] flex items-center justify-center mb-5"
            animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Target className="w-9 h-9 text-[var(--color-gold)]" />
          </motion.div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">No goals set yet</p>
          <p className="text-xs text-[var(--color-text-ghost)] mt-1">Define your objectives to start tracking</p>
          <motion.button
            onClick={() => setShowAdd(true)}
            className="btn-gold px-5 py-2 rounded-xl text-xs font-semibold mt-4 shadow-[var(--shadow-gold)] cursor-pointer hover:brightness-110 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-3.5 h-3.5 inline mr-1.5" />
            Create First Goal
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
