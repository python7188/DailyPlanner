'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { supabase } from '@/lib/supabase';
import { useSquadPresence } from '@/hooks/useSquadPresence';
import WarRoomSidebar from './WarRoomSidebar';
import FlexCard from './FlexCard';

interface ExecutionRoomProps {
  userId?: string | null;
  userName?: string;
  onSessionComplete?: (sessionTitle: string) => void;
  onDisciplinePenalty?: (amount: number) => void;
  roomId?: string;
}

// Hooks for Ambient Mode
function useAmbientMode(timeoutMs = 10000) {
  const [isAmbient, setIsAmbient] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleActivity = () => {
      setIsAmbient(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsAmbient(true), timeoutMs);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    
    timerRef.current = setTimeout(() => setIsAmbient(true), timeoutMs);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeoutMs]);

  return isAmbient;
}

export default function ExecutionRoom({ userId, userName, onSessionComplete, onDisciplinePenalty, roomId }: ExecutionRoomProps) {
  const isAmbient = useAmbientMode(10000); 

  // Format MS helper
  const formatMs = useCallback((ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    
    const hStr = h > 0 ? String(h).padStart(2, '0') + ':' : '';
    const mStr = String(m).padStart(2, '0');
    const sStr = String(s).padStart(2, '0');
    return `${hStr}${mStr}:${sStr}`;
  }, []);

  // --- SQUAD PRESENCE HOOK ---
  const localSquadId = useMemo(() => userId || 'guest-' + Math.random().toString(36).slice(2, 6), [userId]);
  const localUsername = useMemo(() => userName || (typeof window !== 'undefined' ? localStorage.getItem('userName') : null) || 'User', [userName]);

  // Note: Initial state is just a baseline snapshot
  const { squadMembers, updateStatus } = useSquadPresence(roomId, {
    userId: localSquadId,
    username: localUsername,
    isRunning: false,
    timeLeft: '00:00',
    disciplinePoints: 0,
  });

  const broadcastState = useCallback((
    isRunning: boolean, 
    timeStr: string, 
    mode?: 'stopwatch' | 'timer', 
    startTimestamp?: number, 
    baseElapsed?: number
  ) => {
    if (!roomId) return;
    updateStatus({
      userId: localSquadId,
      username: localUsername,
      isRunning,
      timeLeft: timeStr,
      disciplinePoints: 0,
      mode,
      startTimestamp,
      baseElapsed
    });
  }, [roomId, updateStatus, localSquadId, localUsername]);

  // --- TOP: STOPWATCH (75%) ---
  const [swRunning, setSwRunning] = useState(false);
  const [swElapsed, setSwElapsed] = useState(0); 
  const swLastTickRef = useRef<number>(0);

  // Debrief State
  const [showDebrief, setShowDebrief] = useState(false);
  const [finalSessionTime, setFinalSessionTime] = useState(0);
  const [sessionNote, setSessionNote] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Share State
  const flexCardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Load Ghost State for Stopwatch
  useEffect(() => {
    const ghostState = localStorage.getItem('ghost_stopwatch');
    if (ghostState) {
      try {
        const parsed = JSON.parse(ghostState);
        if (parsed.running) {
          const now = Date.now();
          const elapsedSinceLast = now - parsed.lastTick;
          setSwElapsed(parsed.elapsed + elapsedSinceLast);
          swLastTickRef.current = now;
          setSwRunning(true);
        } else {
          setSwElapsed(parsed.elapsed);
        }
      } catch (e) { /* silent */ }
    }
  }, []);

  // Save/Tick Stopwatch
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (swRunning && !showDebrief) {
      swLastTickRef.current = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const delta = now - swLastTickRef.current;
        swLastTickRef.current = now;

        setSwElapsed((prev) => {
          const next = prev + delta;
          localStorage.setItem('ghost_stopwatch', JSON.stringify({ elapsed: next, running: true, lastTick: now }));
          return next;
        });
      }, 50);
    } else {
      setSwElapsed((prev) => {
        localStorage.setItem('ghost_stopwatch', JSON.stringify({ elapsed: prev, running: false, lastTick: Date.now() }));
        return prev;
      });
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [swRunning, showDebrief]); 

  const toggleStopwatch = () => {
    const newState = !swRunning;
    setSwRunning(newState);
    broadcastState(newState, formatMs(swElapsed), 'stopwatch', newState ? Date.now() : undefined, newState ? swElapsed : undefined);
  };
  
  // Triggers Debrief Modal
  const initiateDebrief = () => {
    setSwRunning(false);
    broadcastState(false, 'Debriefing...');
    setFinalSessionTime(Math.floor(swElapsed / 1000));
    setShowDebrief(true);
  };

  const discardSession = () => {
    setSwRunning(false);
    setSwElapsed(0);
    broadcastState(false, '00:00');
    setFinalSessionTime(0);
    setShowDebrief(false);
    setSessionNote('');
    localStorage.removeItem('ghost_stopwatch');
  };

  const logSessionToVault = async () => {
    setIsLogging(true);
    const points = Math.floor(finalSessionTime / 60); // 1 point per minute

    try {
      if (userId && userId !== 'demo') {
        // 1. Log focus session
        const { error } = await supabase.from('focus_sessions').insert({
          user_id: userId,
          duration_seconds: finalSessionTime,
          notes: sessionNote,
          points_earned: points,
        });
        if (error) throw error;

        // 2. Award discipline points
        if (points > 0) {
          await supabase.rpc('update_discipline_score', {
            target_user_id: userId,
            delta: points,
          });
        }
      }

      // 3. Create To-Do List Report Item
      if (onSessionComplete) {
        const timeDesc = formatMs(finalSessionTime * 1000);
        const taskTitle = `[Session: ${timeDesc}] ${sessionNote || 'Focused Execution'}`;
        onSessionComplete(taskTitle);
      }

      // Success Animation Flow
      setShowDebrief(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000); // hide toast after 3s

      // Fully reset
      setSwElapsed(0);
      setSessionNote('');
      localStorage.removeItem('ghost_stopwatch');

    } catch (e) {
      console.error('Failed to log session', e);
      alert('Failed to log session. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  const handleShare = async () => {
    if (!flexCardRef.current) return;
    setIsSharing(true);
    
    try {
      // 1. Generate image Data URL
      const dataUrl = await toPng(flexCardRef.current, {
        quality: 1,
        pixelRatio: 2, // High-res
      });

      // 2. Convert Data URL to File object
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `deep-work-session-${Date.now()}.png`, { type: 'image/png' });

      // 3. Web Share API or Fallback
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Deep Work Session',
          text: 'Just finished a brutal focus session on the Midnight Grind.',
        });
      } else {
        // Fallback: Download the image if Web Share API is unsupported on desktop
        const link = document.createElement('a');
        link.download = file.name;
        link.href = dataUrl;
        link.click();
      }
    } catch (e) {
      console.error('Share failed', e);
      alert('Failed to generate sharing image. Please try downloading it on a supported browser.');
    } finally {
      setIsSharing(false);
    }
  };

  // --- BOTTOM: CUSTOM TIMER (25%) ---
  const [tmrRunning, setTmrRunning] = useState(false);
  const [tmrInputStr, setTmrInputStr] = useState('');
  const [tmrTotalMs, setTmrTotalMs] = useState(0);
  const [tmrRemainingMs, setTmrRemainingMs] = useState(0);
  const tmrLastTickRef = useRef<number>(0);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  // Exam Simulator Hardcore Mode State
  const [isExamMode, setIsExamMode] = useState(false);
  const [examPenaltyAlert, setExamPenaltyAlert] = useState(false);
  const [showExamSetup, setShowExamSetup] = useState(false);
  const [examMinsInput, setExamMinsInput] = useState('60');

  // Load Ghost State for Timer
  useEffect(() => {
    const ghostTimer = localStorage.getItem('ghost_timer');
    if (ghostTimer) {
      try {
        const parsed = JSON.parse(ghostTimer);
        setTmrTotalMs(parsed.total);
        if (parsed.isExamMode) setIsExamMode(true);
        if (parsed.running) {
          const now = Date.now();
          const elapsed = now - parsed.lastTick;
          const remaining = Math.max(0, parsed.remaining - elapsed);
          setTmrRemainingMs(remaining);
          setTmrRunning(remaining > 0);
          tmrLastTickRef.current = now;
          if (remaining === 0) triggerAlarm();
        } else {
          setTmrRemainingMs(parsed.remaining);
        }
      } catch(e) {}
    }
  }, []);

  // Custom Timer Ringtone Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/TIMERRINGTONE.mp3');
      audio.addEventListener('ended', () => {
        audio.currentTime = 27;
        audio.play().catch(e => console.error(e));
      });
      alarmAudioRef.current = audio;
    }
    return () => {
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
      }
    };
  }, []);

  const triggerAlarm = () => {
    if (typeof window === 'undefined') return;
    setIsAlarmRinging(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
    
    if (alarmAudioRef.current) {
      alarmAudioRef.current.currentTime = 27;
      alarmAudioRef.current.play().catch(e => console.error(e));
    }
  };

  const stopAlarm = () => {
    setIsAlarmRinging(false);
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
    }
    resetTimer();
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (tmrRunning) {
      tmrLastTickRef.current = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const delta = now - tmrLastTickRef.current;
        tmrLastTickRef.current = now;

        setTmrRemainingMs(prev => {
          if (prev === 0) return 0; // Already done
          const next = Math.max(0, prev - delta);
          localStorage.setItem('ghost_timer', JSON.stringify({ total: tmrTotalMs, remaining: next, running: true, lastTick: now, isExamMode }));
          if (next === 0 && !isAlarmRinging) {
            setTmrRunning(false);
            triggerAlarm();
          }
          return next;
        });
      }, 50);
    } else {
      setTmrRemainingMs(prev => {
        localStorage.setItem('ghost_timer', JSON.stringify({ total: tmrTotalMs, remaining: prev, running: false, lastTick: Date.now(), isExamMode }));
        return prev;
      });
    }
    return () => {
      if (interval) clearInterval(interval);
    }
  }, [tmrRunning, tmrTotalMs]);

  const toggleTimer = () => {
    if (!tmrRunning && tmrRemainingMs === 0 && tmrInputStr) {
      const minutes = parseFloat(tmrInputStr);
      if (!isNaN(minutes) && minutes > 0) {
        const ms = Math.floor(minutes * 60 * 1000);
        setTmrTotalMs(ms);
        setTmrRemainingMs(ms);
        setTmrRunning(true);
        broadcastState(true, formatMs(ms), 'timer', Date.now(), ms);
      }
    } else if (tmrRemainingMs > 0) {
      if (tmrRemainingMs === 0 && !tmrRunning) {
         // Reset block instead
      }
      const newState = !tmrRunning;
      setTmrRunning(newState);
      broadcastState(newState, formatMs(tmrRemainingMs), 'timer', newState ? Date.now() : undefined, newState ? tmrRemainingMs : undefined);
    }
  };

  const resetTimer = () => {
    setTmrRunning(false);
    setTmrRemainingMs(0);
    setTmrTotalMs(0);
    setTmrInputStr('');
    setIsExamMode(false);
    localStorage.removeItem('ghost_timer');
    broadcastState(false, '00:00');
  };

  const promptExam = () => {
    setExamMinsInput('60');
    setShowExamSetup(true);
  };

  const startExamFromSetup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const mins = parseFloat(examMinsInput);
    if (!isNaN(mins) && mins > 0) {
      setIsExamMode(true);
      setShowExamSetup(false);
      const ms = Math.floor(mins * 60 * 1000);
      setTmrTotalMs(ms);
      setTmrRemainingMs(ms);
      setTmrRunning(true);
      broadcastState(true, formatMs(ms), 'timer', Date.now(), ms);
    }
  };

  // Panopticon Tab Blur Monitor
  useEffect(() => {
    const handleBlur = () => {
      // If strictly in an exam and naturally ticking
      if (isExamMode && tmrRunning) {
        if (onDisciplinePenalty) {
           onDisciplinePenalty(-25);
        }
        setExamPenaltyAlert(true);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
      }
    };
    
    // Listen for visibility loss or blur
    window.addEventListener('blur', handleBlur);
    const handleVis = () => { if (document.hidden) handleBlur(); };
    document.addEventListener('visibilitychange', handleVis);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, [isExamMode, tmrRunning, onDisciplinePenalty]);

  return (
    <div className="flex flex-col md:flex-row w-full min-h-[calc(100dvh-200px)] md:h-full bg-[var(--color-bg)] relative">
      <div className={`flex flex-col relative transition-all duration-500 shrink-0 ${roomId ? 'w-full h-[55vh] md:h-full md:w-3/4' : 'flex-1 w-full min-h-[calc(100dvh-200px)] md:h-full'}`}>

      {/* SUCCESS TOAST OVERLAY */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-green-500/20 text-green-200 border border-green-500/30 px-6 py-3 rounded-full backdrop-blur-md shadow-lg font-medium text-sm flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Session Added to Tasks
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP: PREMIUM STOPWATCH */}
      <div className="flex-1 md:flex-[3] flex flex-col items-center justify-center relative p-4 sm:p-8 shrink-0 min-h-[50%]">
        <h1 className="text-7xl sm:text-[120px] md:text-[180px] font-light tracking-tighter tabular-nums drop-shadow-sm transition-colors duration-1000" style={{ color: isAmbient && swRunning && !showDebrief ? 'var(--color-gold)' : 'var(--color-text-primary)' }}>
          {formatMs(swElapsed)}
        </h1>
        
        <motion.div 
          className="flex items-center gap-6 mt-8"
          initial={false}
          animate={{ opacity: isAmbient && swRunning && !showDebrief ? 0.2 : 1 }}
          transition={{ duration: 1 }}
        >
          <button 
            onClick={toggleStopwatch}
            className={`w-36 py-4 rounded-full text-lg font-bold transition-all shadow-lg hover:brightness-110 active:scale-95 ${swRunning ? 'bg-[var(--color-bg-card)] border border-[var(--color-border)] text-red-400' : 'btn-gold text-white'}`}
          >
            {swRunning ? 'Pause' : (swElapsed === 0 ? 'Start' : 'Resume')}
          </button>
          
          {(swElapsed > 0 && !swRunning) && (
            <motion.button 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={initiateDebrief} // <-- Used to be Reset
              className="px-8 py-4 rounded-full text-lg font-semibold bg-[var(--color-bg-card)] border border-[var(--color-gold)]/50 text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-black transition-all shadow-[0_0_20px_rgba(255,215,0,0.1)] active:scale-95"
            >
              End Session
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* BOTTOM: CUSTOM TIMER */}
      {!roomId && (
        <motion.div 
          className="flex-1 md:flex-[1] shrink-0 bg-[var(--color-bg-sidebar)]/80 backdrop-blur-md border-t border-[var(--color-border)] flex flex-col items-center justify-center p-8 transition-opacity duration-1000 relative"
          initial={false}
          animate={{ opacity: isAmbient && (swRunning || tmrRunning) && !showDebrief ? 0.2 : 1 }}
        >
          <div className="absolute top-4 left-6 text-xs font-bold uppercase tracking-widest text-[var(--color-gold)] opacity-50">Custom Timer</div>
          
          {!tmrRunning && tmrRemainingMs === 0 && !isAlarmRinging ? (
            <>
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
                <input 
                  type="number"
                  placeholder="Enter minutes..."
                  value={tmrInputStr}
                  onChange={(e) => setTmrInputStr(e.target.value)}
                  className="w-32 sm:w-64 bg-transparent border-b-2 border-white/20 focus:border-[var(--color-gold)] text-center text-3xl font-light text-[var(--color-text-primary)] px-2 sm:px-4 py-2 outline-none transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') toggleTimer();
                  }}
                />
                {tmrInputStr && (
                  <button 
                    onClick={toggleTimer}
                    className="btn-gold rounded-full px-5 py-2 sm:px-8 sm:py-3 font-bold text-white shadow-lg active:scale-95 transition-transform"
                  >
                    Set
                  </button>
                )}
              </div>
              
              {!tmrRunning && tmrRemainingMs === 0 && (
                <div className="mt-6 sm:mt-8 w-max z-10">
                  <button 
                    onClick={promptExam}
                    className="px-6 py-2 border border-red-500/30 hover:border-red-500/80 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] transition-all flex items-center justify-center gap-3"
                    title="Strips away the OS. Forces completely distraction focus. Penalizes on-blur."
                  >
                    <div className="relative flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-red-500 absolute animate-ping"></span>
                      <span className="w-2 h-2 rounded-full bg-red-500 relative"></span>
                    </div>
                    Initiate Exam Protocol
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center">
              <h2 className="text-4xl sm:text-5xl font-light tracking-tight tabular-nums relative">
                {isAlarmRinging ? "00:00" : formatMs(tmrRemainingMs)}
              </h2>
              <div className="flex items-center gap-4 mt-6">
                {isAlarmRinging ? (
                  <button 
                    onClick={stopAlarm}
                    className="w-48 py-3 rounded-full text-base font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse active:scale-95"
                  >
                    Stop Alarm
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={toggleTimer}
                      className={`w-32 py-2 rounded-full text-sm font-bold transition-all shadow-md active:scale-95 ${tmrRunning ? 'bg-red-500/10 border border-red-500/30 text-red-400 backdrop-blur-md' : 'btn-gold text-white'}`}
                    >
                      {tmrRunning ? 'Pause' : 'Resume'}
                    </button>
                    
                    {(!tmrRunning || tmrRemainingMs === 0) && (
                      <button 
                        onClick={resetTimer}
                        className="w-32 py-2 rounded-full text-sm font-bold bg-white/5 border border-white/10 text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-white transition-all shadow-inner active:scale-95"
                      >
                        Reset Timer
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* =========================================
          EXECUTIVE DEBRIEF MODAL (Framer Motion) 
          ========================================= */}
      <AnimatePresence>
        {showDebrief && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md p-8 mx-4 bg-[#121212]/90 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl text-white"
            >

              <h2 className="text-xs font-bold tracking-[0.3em] text-[var(--color-gold)]/70 uppercase text-center mb-6">
                Session Debrief
              </h2>

              <div className="flex flex-col items-center justify-center mb-8">
                <span className="text-6xl sm:text-7xl font-light tabular-nums tracking-tighter text-white mb-2">
                  {formatMs(finalSessionTime * 1000)}
                </span>
                
                <div className="flex items-center gap-3 bg-[var(--color-gold)]/10 px-4 py-2 rounded-full border border-[var(--color-gold)]/20">
                  <span className="text-sm font-medium text-[var(--color-gold)]">Discipline Yield</span>
                  <span className="text-sm font-bold text-white bg-[var(--color-gold)]/30 px-2 py-0.5 rounded-md">
                    + {Math.floor(finalSessionTime / 60)} Points
                  </span>
                </div>
              </div>

              <div className="w-full mb-8">
                <textarea 
                  value={sessionNote}
                  onChange={(e) => setSessionNote(e.target.value)}
                  placeholder="Session Notes (What did you execute?)..."
                  className="w-full mt-6 p-4 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#CFA660] resize-none"
                />
              </div>

              <div className="flex flex-col gap-4 mt-auto">
                <button
                  onClick={handleShare}
                  disabled={isSharing || isLogging}
                  className="w-full py-4 mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50"
                >
                  {isSharing ? (
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Share2 className="w-5 h-5 text-white/70" />
                  )}
                  Share to IG / Twitter
                </button>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={discardSession}
                    disabled={isLogging}
                    className="flex-1 py-3 text-sm font-semibold text-white/40 hover:text-white/80 transition-colors disabled:opacity-50"
                  >
                    Discard
                  </button>
                  <button 
                    onClick={logSessionToVault}
                    disabled={isLogging}
                    className="flex-1 py-4 bg-[#CFA660] hover:bg-[#b89355] text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(207,166,96,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLogging ? (
                      <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      'Save to Tasks'
                    )}
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {roomId && (
        /* SQUAD MODE: WAR ROOM SPECTATOR UI FOCUS */
        <div className="w-full md:w-1/4 min-h-[45vh] md:h-full relative z-10 border-t md:border-t-0 md:border-l border-[var(--color-border)] bg-[var(--color-bg-sidebar)]/30 backdrop-blur-md p-2 sm:p-4 shrink-0 overflow-y-auto">
           <WarRoomSidebar squadMembers={squadMembers} />
        </div>
      )}
      
      {/* HIDDEN FLEX CARD FOR VIRTUAL EXPORT */}
      {showDebrief && (
        <FlexCard 
          ref={flexCardRef}
          timeString={formatMs(finalSessionTime * 1000)}
          disciplinePoints={Math.floor(finalSessionTime / 60)}
          username={localUsername}
        />
      )}

      {/* =========================================
          EXAM SIMULATOR PANOPTICON OVERLAY & SETUP
          ========================================= */}
      {typeof document !== 'undefined' && createPortal(
        <>
          {/* Custom Setup Modal */}
          <AnimatePresence>
            {showExamSetup && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#121212] border border-red-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.2)] max-w-md w-full text-center"
                >
                  <h2 className="text-red-500 font-bold uppercase tracking-widest text-lg mb-4">Exam Protocol Setup</h2>
                  <p className="text-white/70 text-sm mb-8 leading-relaxed">
                    WARNING: The dashboard will vanish. If you leave the tab you will instantly lose <span className="text-red-400 font-bold">25 Discipline Points!</span><br/> Completely distraction-free.
                  </p>
                  <form onSubmit={startExamFromSetup} className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2">
                      <label className="text-xs font-bold text-[var(--color-gold)] uppercase tracking-widest">Duration (Minutes)</label>
                      <input 
                        type="number"
                        value={examMinsInput}
                        onChange={(e) => setExamMinsInput(e.target.value)}
                        className="w-32 bg-transparent border-b-2 border-white/20 focus:border-red-500 text-center text-4xl font-light text-white px-2 py-2 outline-none transition-colors"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-4 mt-4">
                      <button type="button" onClick={() => setShowExamSetup(false)} className="flex-1 py-3 text-sm font-bold text-white/50 hover:text-white transition-colors">CANCEL</button>
                      <button type="submit" className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all">START EXAM</button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isExamMode && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden"
              >
                {/* The Smoked Glass Timer Box */}
                <h2 className="text-[var(--color-gold)]/50 tracking-[0.5em] text-sm font-bold uppercase mb-8 sm:mb-12">Exam Protocol Active</h2>
                
                <div className="relative p-8 sm:p-24 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] sm:rounded-[3rem] shadow-[0_0_100px_rgba(255,215,0,0.05)] text-center w-full max-w-4xl flex flex-col items-center justify-center overflow-hidden">
                  <h1 className="text-7xl sm:text-[140px] md:text-[200px] lg:text-[280px] leading-none font-light tracking-tighter tabular-nums drop-shadow-2xl text-white">
                    {isAlarmRinging ? "00:00" : formatMs(tmrRemainingMs)}
                  </h1>
                  
                  <div className="mt-12 sm:mt-16 flex gap-4 sm:gap-8">
                    {isAlarmRinging ? (
                      <button onClick={stopAlarm} className="text-lg sm:text-xl font-bold px-8 py-4 sm:px-12 sm:py-6 rounded-full bg-red-600 text-white animate-pulse">Silence Alarm</button>
                    ) : (
                      <button 
                      onClick={() => {
                        if (window.confirm("Abort Exam Mode? You will lose all current progress.")) {
                          setIsExamMode(false);
                          resetTimer();
                        }
                      }} 
                      className="px-6 py-3 border border-white/20 rounded-full text-white/30 hover:text-red-400 hover:border-red-500/50 transition-colors uppercase tracking-widest text-[10px] sm:text-xs font-bold"
                    >
                      Surrender / Abort
                    </button>
                    )}
                  </div>
                </div>

                {/* Red Penalty Warning Modal */}
                <AnimatePresence>
                  {examPenaltyAlert && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 50 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 50 }}
                      className="absolute bottom-8 sm:bottom-12 mx-4 bg-[#1a0505] border border-red-500/50 p-6 sm:p-8 rounded-[2rem] shadow-[0_0_100px_rgba(239,68,68,0.3)] flex flex-col items-center"
                    >
                      <span className="text-red-400 font-bold text-center text-3xl sm:text-4xl uppercase tracking-tighter mb-4">Focus Lost</span>
                      <span className="text-red-200/80 text-center text-sm sm:text-lg mb-6 max-w-sm">A massive discipline penalty <span className="text-red-400 font-bold">(-25 pts)</span> has been logged to your score. Do not navigate away from the exam constraints.</span>
                      <button onClick={() => setExamPenaltyAlert(false)} className="w-full px-8 py-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-full font-bold text-red-400 uppercase tracking-widest text-xs transition-colors">Understood</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
}
