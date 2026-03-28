'use client';

import { motion } from 'framer-motion';
import { Sparkles, Flame } from 'lucide-react';
import { useEffect } from 'react';

// Confetti snippet
import confetti from 'canvas-confetti';

interface MilestoneSplashProps {
  milestoneVal: number;
  onComplete: () => void;
}

export default function MilestoneSplash({ milestoneVal, onComplete }: MilestoneSplashProps) {
  useEffect(() => {
    // Fire confetti immediately
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#D4A127', '#E6C55A', '#FFFFFF']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#D4A127', '#E6C55A', '#FFFFFF']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Auto close after 4 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="bg-white rounded-3xl p-10 max-w-sm mx-4 text-center shadow-2xl shadow-black/20 border border-white/50 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4A127] to-[#FFF0B3]" />
        
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto w-20 h-20 bg-[var(--color-gold-dim)] rounded-full flex items-center justify-center mb-6 border border-[var(--color-gold)] shadow-[0_0_30px_rgba(212,161,39,0.3)]"
        >
          <Flame className="w-10 h-10 text-[var(--color-gold)]" />
        </motion.div>

        <h2 className="text-3xl font-extrabold text-gray-900 mb-2 font-serif">
          {milestoneVal} Day Streak!
        </h2>
        <p className="text-gray-500 text-sm mb-8 font-medium">
          Consistency is elite. Keep building your empire.
        </p>

        <button
          onClick={onComplete}
          className="w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium shadow-lg transition-colors flex justify-center items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}
