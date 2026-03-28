'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Check } from 'lucide-react';

export default function OfflineBadge() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowBadge(true);
    };
    const handleOnline = () => {
      setIsOffline(false);
      // Show "back online" briefly
      setTimeout(() => setShowBadge(false), 3000);
    };

    // Initial check
    if (!navigator.onLine) {
      setIsOffline(true);
      setShowBadge(true);
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showBadge && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[90]"
        >
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl border text-xs font-medium shadow-lg ${
              isOffline
                ? 'bg-amber-500/10 border-amber-500/30 text-[var(--color-gold)]'
                : 'bg-green-500/10 border-green-500/30 text-green-500'
            }`}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline · Changes Saved Locally</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Back Online · Syncing...</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
