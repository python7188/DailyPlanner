'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useSpring, Reorder } from 'framer-motion';
import {
  Check, Trash2, Clock,
  Dumbbell, BookOpen, Briefcase, Palette,
  Music, FlaskConical, Languages, CalendarDays,
  AlertTriangle, FileText
} from 'lucide-react';
import type { Task } from '@/lib/supabase';
import { getHighlightSegments, getLocalDateString } from '@/utils/timeParser';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onTimeboxClick?: (minutes: number) => void;
  isToday: boolean;
  index: number;
}

/* ── Icon mapping ─────────────────────────────────────── */
function getTaskIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('gym') || lower.includes('barbell') || lower.includes('workout') || lower.includes('physique') || lower.includes('kg'))
    return <Dumbbell className="w-3.5 h-3.5" />;
  if (lower.includes('study') || lower.includes('mock') || lower.includes('bitsat') || lower.includes('paper') || lower.includes('syllabus'))
    return <BookOpen className="w-3.5 h-3.5" />;
  if (lower.includes('chemistry') || lower.includes('reaction') || lower.includes('zero-order'))
    return <FlaskConical className="w-3.5 h-3.5" />;
  if (lower.includes('design') || lower.includes('layout') || lower.includes('image') || lower.includes('nubie'))
    return <Palette className="w-3.5 h-3.5" />;
  if (lower.includes('spotify') || lower.includes('playlist') || lower.includes('music'))
    return <Music className="w-3.5 h-3.5" />;
  if (lower.includes('sanskrit') || lower.includes('language'))
    return <Languages className="w-3.5 h-3.5" />;
  if (lower.includes('brand') || lower.includes('launch') || lower.includes('business') || lower.includes('project'))
    return <Briefcase className="w-3.5 h-3.5" />;
  if (lower.includes('review') || lower.includes('read'))
    return <FileText className="w-3.5 h-3.5" />;
  return <CalendarDays className="w-3.5 h-3.5" />;
}

/* ── Audio feedback ───────────────────────────────────── */
function playCheckSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.value = 0.06;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.stop(ctx.currentTime + 0.08);
  } catch { /* silent */ }
}

function playDeleteSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 300;
    osc.type = 'triangle';
    gain.gain.value = 0.04;
    osc.start();
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.stop(ctx.currentTime + 0.15);
  } catch { /* silent */ }
}

/* ── Time Math & Formatting ───────────────────────────── */
export function formatAMPM(timeStr?: string) {
  if (!timeStr) return '';
  const cleanTime = timeStr.replace(/am|pm/gi, '').trim();
  const [hourStr, minute] = cleanTime.split(':');
  if (!hourStr || !minute) return timeStr;
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${minute} ${ampm}`;
}

export function calculateDuration(start: string, end: string) {
  if (!start || !end) return '';
  const cleanStart = start.replace(/am|pm/gi, '').trim();
  const cleanEnd = end.replace(/am|pm/gi, '').trim();
  const [startH, startM] = cleanStart.split(':').map(Number);
  const [endH, endM] = cleanEnd.split(':').map(Number);
  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return '';
  let startTotal = startH * 60 + startM;
  let endTotal = endH * 60 + endM;
  if (endTotal < startTotal) endTotal += 24 * 60;
  const diff = endTotal - startTotal;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/* ═══════════════════════════════════════════════════════
   TASK CARD — Swipe-to-Delete + Mobile Time Fix
   ═══════════════════════════════════════════════════════ */
export default function TaskCard({ task, onToggle, onDelete, onUpdateTitle, onTimeboxClick, isToday, index }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const cardRef = useRef<any>(null);

  /* ── Swipe-to-Delete motion values ── */
  const swipeX = useMotionValue(0);
  // Red background fades in as the card slides left
  const revealOpacity = useTransform(swipeX, [-120, -20, 0], [1, 0.5, 0]);

  /* ── 3D Parallax motion values (desktop hover) ── */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), { stiffness: 300, damping: 30 });
  const glareX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);
  const glareOpacity = useSpring(0, { stiffness: 300, damping: 30 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (task.is_completed || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
    glareOpacity.set(0.08);
  }, [task.is_completed, mouseX, mouseY, glareOpacity]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    glareOpacity.set(0);
  }, [mouseX, mouseY, glareOpacity]);

  /* ── Overdue check ── */
  const todayStr = getLocalDateString();
  const isOverdue = !task.is_completed && (task.target_date || '').split('T')[0] < todayStr;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (task.is_completed) return;
    setEditValue(task.title);
    setIsEditing(true);
  };

  const handleEditSave = () => {
    if (editValue.trim() && editValue.trim() !== task.title) {
      onUpdateTitle(task.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleToggle = () => {
    playCheckSound();
    if (!task.is_completed) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 800);
    }
    onToggle(task.id);
  };

  const handleDelete = () => {
    playDeleteSound();
    onDelete(task.id);
  };

  /* ── 3. SNAP-BACK THRESHOLD ── */
  const handleDragEnd = useCallback((_: any, info: { offset: { x: number } }) => {
    if (info.offset.x < -100) {
      // 4. HAPTIC FEEDBACK
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      playDeleteSound();
      onDelete(task.id);
    }
    // If threshold not met, spring snaps back automatically
  }, [onDelete, task.id]);

  const icon = getTaskIcon(task.title);
  const highlighted = getHighlightSegments(task.title);
  const dateLabel = new Date((task.target_date || '').split('T')[0] + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const hasTimeBlock = !!(task.start_time || task.end_time);
  const Component = task.is_completed ? motion.div : Reorder.Item;

  return (
    /* 1. THE RED REVEAL — outer wrapper is relative + overflow-hidden */
    <div className="relative overflow-hidden border-b border-[var(--color-border)]">

      {/* Background layer: red reveal with trash icon anchored right */}
      <motion.div
        className="absolute inset-0 bg-red-500/90 flex items-center justify-end pr-5 z-0"
        style={{ opacity: revealOpacity }}
        aria-hidden="true"
      >
        <Trash2 className="w-5 h-5 text-white" />
      </motion.div>

      {/* Foreground layer: draggable card content */}
      <Component
        value={task}
        ref={cardRef}
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}
        transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
        dragListener={!task.is_completed}
        style={{
          x: swipeX,
          rotateX: task.is_completed ? 0 : rotateX,
          rotateY: task.is_completed ? 0 : rotateY,
          transformStyle: 'preserve-3d',
          transformPerspective: 800,
          touchAction: 'pan-x',
          backgroundColor: 'var(--color-bg)',
          position: 'relative',
          zIndex: 1,
        }}
        onDragEnd={handleDragEnd}
        onDoubleClick={handleDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`
          notion-row group relative flex flex-col px-4 py-3
          hover:bg-[var(--color-bg-card)] transition-colors duration-150
          cursor-default touch-pan-y select-none
          ${isToday && !task.is_completed ? 'notion-row-today' : ''}
          ${task.is_completed ? 'opacity-50' : ''}
          ${isOverdue ? 'overdue-row' : ''}
        `}
      >
        {/* Dynamic Glare */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-10 rounded-none overflow-hidden"
          aria-hidden="true"
          style={{ opacity: glareOpacity }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(212,161,39,0.25) 0%, transparent 60%)`,
            }}
          />
        </motion.div>

        {/* Confetti burst */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  left: '20px',
                  top: '50%',
                  background: ['var(--color-gold)', '#F5D060', '#B8962E', '#FFF8E1'][i % 4],
                }}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1.2, 0],
                  x: Math.cos((i * Math.PI * 2) / 8) * 35,
                  y: Math.sin((i * Math.PI * 2) / 8) * 25,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            ))}
          </div>
        )}

        {/* ── Row 1: checkbox + icon + title + badges + delete ── */}
        <div className="flex items-center gap-3 w-full min-w-0">
          {/* Checkbox */}
          <motion.button
            onClick={handleToggle}
            className={`
              flex-shrink-0 w-[18px] h-[18px] rounded-md border-2 transition-all cursor-pointer
              flex items-center justify-center
              ${task.is_completed
                ? 'bg-[var(--color-gold)] border-[var(--color-gold)] shadow-[0_0_8px_var(--color-gold-dim)]'
                : 'border-[var(--color-text-ghost)] hover:border-[var(--color-gold)] hover:shadow-[0_0_6px_var(--color-gold-dim)]'
              }
            `}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
          >
            {task.is_completed && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </motion.button>

          {/* Category Icon */}
          <div className={`flex-shrink-0 transition-colors ${task.is_completed ? 'text-[var(--color-text-ghost)]' : 'text-[var(--color-gold)] opacity-60'}`}>
            {icon}
          </div>

          {/* Title Area Wrapper */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleEditSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  className="w-full bg-transparent text-base font-medium text-[var(--color-text-primary)] resize-none border-b-2 border-[var(--color-gold)] outline-none py-0.5"
                  rows={1}
                />
              ) : (
                <div className="relative">
                  <p className={`text-base font-medium leading-snug break-words transition-colors duration-300 ${
                    task.is_completed
                      ? 'text-[var(--color-text-ghost)]'
                      : isOverdue
                      ? 'text-red-400 kinetic-overdue'
                      : 'text-[var(--color-text-primary)]'
                  }`}>
                    {highlighted.map((seg, j) =>
                      !seg.isTime ? (
                        <span key={j}>{seg.text}</span>
                      ) : (
                        <span key={j} className="gold-pill font-bold px-1.5 py-0.5 rounded-md bg-[var(--color-gold-dim)] text-[var(--color-gold)] border border-[var(--color-border-gold)] mx-1 text-sm shadow-[0_0_10px_rgba(212,161,39,0.2)] whitespace-nowrap">
                          {seg.text}
                        </span>
                      )
                    )}
                  </p>
                  {task.is_completed && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-[var(--color-text-ghost)] rounded-full"
                    />
                  )}
                </div>
              )}

              {/* Overdue badge */}
              {isOverdue && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/30 text-[9px] font-bold text-red-400 uppercase tracking-wider"
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Late
                </motion.span>
              )}

              {/* Timebox Badge */}
              {task.time_target_minutes && !task.is_completed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTimeboxClick) onTimeboxClick(task.time_target_minutes!);
                  }}
                  className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full text-[#CFA660] bg-[#CFA660]/10 border border-[#CFA660]/20 hover:bg-[#CFA660]/20 backdrop-blur-md transition-all cursor-pointer shadow-[0_0_10px_rgba(207,166,96,0.1)] font-mono"
                >
                  {task.time_target_minutes}m
                </button>
              )}

              {/* Date pill removed */}

            </div>

            {/* ── Universal Time Block (Desktop & Mobile) ── */}
            {(task.start_time || task.end_time) && (
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                
                {/* START TIME: Individual Gold Box */}
                {task.start_time && (
                  <span className="font-bold px-2 py-0.5 rounded-md bg-[var(--color-gold-dim)] text-[var(--color-gold)] border border-[var(--color-border-gold)] text-[11px] shadow-[0_0_10px_rgba(212,161,39,0.2)] flex items-center w-fit">
                    {formatAMPM(task.start_time)}
                  </span>
                )}
                
                {/* DASH SEPARATOR */}
                {task.start_time && task.end_time && (
                  <span className="opacity-50 text-[var(--color-gold)] font-medium">-</span>
                )}
                
                {/* END TIME: Individual Gold Box */}
                {task.end_time && (
                  <span className="font-bold px-2 py-0.5 rounded-md bg-[var(--color-gold-dim)] text-[var(--color-gold)] border border-[var(--color-border-gold)] text-[11px] shadow-[0_0_10px_rgba(212,161,39,0.2)] flex items-center w-fit">
                    {formatAMPM(task.end_time)}
                  </span>
                )}
                
                {/* CALCULATED DURATION */}
                {task.start_time && task.end_time && (
                  <span className="text-[var(--color-gold)] opacity-90 font-extrabold uppercase text-[10px] tracking-wider shrink-0 ml-1">
                    {calculateDuration(task.start_time, task.end_time)}
                  </span>
                )}
                
              </div>
            )}
          </div>

          {/* Delete button — desktop hover only, hidden on mobile (use swipe) */}
          <motion.button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 hidden md:flex p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0 cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 className="w-3.5 h-3.5 text-[var(--color-danger)]" />
          </motion.button>
        </div>

        {/* Today left accent bar */}
        {isToday && !task.is_completed && (
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--color-gold)] rounded-r"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          />
        )}

        {/* Overdue left accent bar */}
        {isOverdue && (
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-[2px] bg-red-400 rounded-r"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1, opacity: [1, 0.4, 1] }}
            transition={{ duration: 0.4, delay: index * 0.05, opacity: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } }}
          />
        )}
      </Component>
    </div>
  );
}
