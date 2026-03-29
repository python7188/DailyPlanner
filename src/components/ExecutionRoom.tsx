'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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
    
    // Init the timeout
    timerRef.current = setTimeout(() => setIsAmbient(true), timeoutMs);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeoutMs]);

  return isAmbient;
}

export default function ExecutionRoom() {
  const isAmbient = useAmbientMode(10000); // 10s Trigger

  // --- TOP: STOPWATCH (75%) ---
  const [swRunning, setSwRunning] = useState(false);
  const [swElapsed, setSwElapsed] = useState(0); // in MS
  const swRafRef = useRef<number | null>(null);
  const swLastTickRef = useRef<number>(0);

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
    if (swRunning) {
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
  }, [swRunning]); // Removed swElapsed to prevent infinite teardown/reinstantiation loop

  const toggleStopwatch = () => setSwRunning(!swRunning);
  const resetStopwatch = () => {
    setSwRunning(false);
    setSwElapsed(0);
    localStorage.removeItem('ghost_stopwatch');
  };

  // --- BOTTOM: CUSTOM TIMER (25%) ---
  const [tmrRunning, setTmrRunning] = useState(false);
  const [tmrInputStr, setTmrInputStr] = useState('');
  const [tmrTotalMs, setTmrTotalMs] = useState(0);
  const [tmrRemainingMs, setTmrRemainingMs] = useState(0);
  const tmrRafRef = useRef<number | null>(null);
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

  const triggerAlarm = () => {
    if (typeof window === 'undefined') return;
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
    
    // Try native HTML5 audio if possible (fallback generic beep using oscillator if audio context exists)
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
      
      // pulse volume
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.1);
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
    <div className="flex flex-col w-full h-full bg-[var(--color-bg)]">
      {/* 75% TOP: PREMIUM STOPWATCH */}
      <div className="flex-[3] flex flex-col items-center justify-center relative p-4 sm:p-8">
        <h1 className="text-7xl sm:text-[120px] md:text-[180px] font-light tracking-tighter tabular-nums drop-shadow-sm transition-colors duration-1000" style={{ color: isAmbient && swRunning ? 'var(--color-gold)' : 'var(--color-text-primary)' }}>
          {formatMs(swElapsed)}
        </h1>
        
        <motion.div 
          className="flex items-center gap-6 mt-8"
          initial={false}
          animate={{ opacity: isAmbient && swRunning ? 0.2 : 1 }}
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
              onClick={resetStopwatch}
              className="w-36 py-4 rounded-full text-lg font-semibold bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:text-white transition-all active:scale-95"
            >
              Reset
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* 25% BOTTOM: CUSTOM TIMER */}
      <motion.div 
        className="flex-[1] bg-[var(--color-bg-sidebar)]/80 backdrop-blur-md border-t border-[var(--color-border)] flex flex-col items-center justify-center p-8 transition-opacity duration-1000 relative"
        initial={false}
        animate={{ opacity: isAmbient && (swRunning || tmrRunning) ? 0.2 : 1 }}
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
                className={`w-32 py-2 rounded-full text-sm font-bold transition-all shadow-md active:scale-95 ${tmrRunning ? 'bg-[var(--color-bg-card)] border border-[var(--color-border)] text-red-400' : 'btn-gold text-white'}`}
              >
                {tmrRunning ? 'Pause' : 'Resume'}
              </button>
              
              {!tmrRunning && (
                <button 
                  onClick={resetTimer}
                  className="w-32 py-2 rounded-full text-sm font-semibold bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:text-white transition-all active:scale-95"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
