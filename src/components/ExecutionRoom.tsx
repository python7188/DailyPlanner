'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface ExecutionRoomProps {
  userId?: string | null;
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

export default function ExecutionRoom({ userId }: ExecutionRoomProps) {
  const isAmbient = useAmbientMode(10000); 

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

  const toggleStopwatch = () => setSwRunning(!swRunning);
  
  // Triggers Debrief Modal
  const initiateDebrief = () => {
    setSwRunning(false);
    setFinalSessionTime(Math.floor(swElapsed / 1000));
    setShowDebrief(true);
  };

  const discardSession = () => {
    setSwRunning(false);
    setSwElapsed(0);
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

  // --- BOTTOM: CUSTOM TIMER (25%) ---
  const [tmrRunning, setTmrRunning] = useState(false);
  const [tmrInputStr, setTmrInputStr] = useState('');
  const [tmrTotalMs, setTmrTotalMs] = useState(0);
  const [tmrRemainingMs, setTmrRemainingMs] = useState(0);
  const tmrLastTickRef = useRef<number>(0);

  // Load Ghost State for Timer
  useEffect(() => {
    const ghostTimer = localStorage.getItem('ghost_timer');
    if (ghostTimer) {
      try {
        const parsed = JSON.parse(ghostTimer);
        setTmrTotalMs(parsed.total);
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

  // Cinematic Bell Ringtone
  const triggerAlarm = () => {
    if (typeof window === 'undefined') return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playTone = (freq: number, startTime: number, duration: number, vol = 0.3) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        
        // Soft envelope
        gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
        
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };
      
      // Serene D-Major 9 Chord progression (Cinematic Bell effect)
      playTone(587.33, 0, 3, 0.4);    // D5
      playTone(739.99, 0.1, 3, 0.3);  // F#5
      playTone(880.00, 0.2, 3, 0.2);  // A5
      playTone(1108.73, 0.3, 3, 0.2); // C#6
      playTone(1318.51, 0.5, 4, 0.1); // E6
      
    } catch(e) {}
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
          localStorage.setItem('ghost_timer', JSON.stringify({ total: tmrTotalMs, remaining: next, running: true, lastTick: now }));
          if (next === 0) {
            setTmrRunning(false);
            triggerAlarm();
          }
          return next;
        });
      }, 50);
    } else {
      setTmrRemainingMs(prev => {
        localStorage.setItem('ghost_timer', JSON.stringify({ total: tmrTotalMs, remaining: prev, running: false, lastTick: Date.now() }));
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
      }
    } else if (tmrRemainingMs > 0) {
      if (tmrRemainingMs === 0 && !tmrRunning) {
         // Reset block instead
      }
      setTmrRunning(!tmrRunning);
    }
  };

  const resetTimer = () => {
    setTmrRunning(false);
    setTmrRemainingMs(0);
    setTmrTotalMs(0);
    setTmrInputStr('');
    localStorage.removeItem('ghost_timer');
  };

  // Format MS -> HH:MM:SS or MM:SS
  const formatMs = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    
    const hStr = h > 0 ? String(h).padStart(2, '0') + ':' : '';
    const mStr = String(m).padStart(2, '0');
    const sStr = String(s).padStart(2, '0');
    
    return `${hStr}${mStr}:${sStr}`;
  };

  return (
    <div className="flex flex-col w-full h-full bg-[var(--color-bg)] relative">

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
            Session Logged to Vault
          </motion.div>
        )}
      </AnimatePresence>

      {/* 75% TOP: PREMIUM STOPWATCH */}
      <div className="flex-[3] flex flex-col items-center justify-center relative p-4 sm:p-8">
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

      {/* 25% BOTTOM: CUSTOM TIMER */}
      <motion.div 
        className="flex-[1] bg-[var(--color-bg-sidebar)]/80 backdrop-blur-md border-t border-[var(--color-border)] flex flex-col items-center justify-center p-8 transition-opacity duration-1000 relative"
        initial={false}
        animate={{ opacity: isAmbient && (swRunning || tmrRunning) && !showDebrief ? 0.2 : 1 }}
      >
        <div className="absolute top-4 left-6 text-xs font-bold uppercase tracking-widest text-[var(--color-gold)] opacity-50">Custom Timer</div>
        
        {!tmrRunning && tmrRemainingMs === 0 ? (
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
        ) : (
          <div className="flex flex-col items-center">
            <h2 className="text-4xl sm:text-5xl font-light tracking-tight tabular-nums relative">
              {formatMs(tmrRemainingMs)}
            </h2>
            <div className="flex items-center gap-4 mt-6">
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
            </div>
          </div>
        )}
      </motion.div>

      {/* =========================================
          EXECUTIVE DEBRIEF MODAL (Framer Motion) 
          ========================================= */}
      <AnimatePresence>
        {showDebrief && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[var(--color-bg)]/80 backdrop-blur-2xl border border-[var(--color-gold)]/20 rounded-3xl p-8 sm:p-12 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden"
            >
              {/* Subtle Ambient Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--color-gold)]/10 blur-[80px] pointer-events-none" />

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
                  className="w-full h-28 bg-black/20 border border-white/5 focus:border-[var(--color-gold)]/50 rounded-xl p-4 text-[var(--color-text-primary)] placeholder-white/20 outline-none resize-none transition-colors text-sm"
                />
              </div>

              <div className="flex items-center gap-4 mt-auto">
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
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black font-bold shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLogging ? (
                    <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    'Log to Vault'
                  )}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
