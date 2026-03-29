"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, User } from 'lucide-react';
import type { SquadMemberState } from '@/hooks/useSquadPresence';

interface WarRoomSidebarProps {
  squadMembers: SquadMemberState[];
}

export default function WarRoomSidebar({ squadMembers }: WarRoomSidebarProps) {
  // Find highest discipline points to award the Crown
  const highestScore = Math.max(...squadMembers.map(m => m.disciplinePoints), 0);

  return (
    <div className="w-full h-full bg-black/40 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col rounded-tl-3xl shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-[var(--color-gold)] text-sm font-bold tracking-widest uppercase">
          Live Squad
        </h2>
        <div className="text-xs text-[var(--color-text-ghost)] font-mono">
          {squadMembers.length} ACTIVE
        </div>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto pr-2 pb-8 scroll-smooth" id="squad-scroll">
        <AnimatePresence>
          {squadMembers.map((member) => {
            const isCrown = member.disciplinePoints > 0 && member.disciplinePoints === highestScore;

            return (
              <motion.div
                key={member.userId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md transition-all hover:bg-white/10"
              >
                <div className="flex items-center gap-4">
                  {/* Status Ring Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-black/50 transition-all ${
                    member.isRunning 
                      ? 'ring-2 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]' 
                      : 'ring-2 ring-white/10'
                  }`}>
                    <User className={`w-5 h-5 ${member.isRunning ? 'text-emerald-400' : 'text-white/30'}`} />
                  </div>
                  
                  {/* Info */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm truncate max-w-[120px]">
                        {member.username}
                      </span>
                      {isCrown && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        >
                          <Crown className="w-3.5 h-3.5 text-[var(--color-gold)] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Live Status readout */}
                    {member.isRunning ? (
                      <span className="text-emerald-400 font-mono text-xs font-bold tracking-wider mt-0.5">
                        {member.timeLeft}
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-ghost)] uppercase tracking-widest text-[10px] font-bold mt-0.5">
                        Idle / Paused
                      </span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-[var(--color-gold)] font-mono text-sm font-bold">
                    {member.disciplinePoints}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-ghost)]">
                    PTS
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {squadMembers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 opacity-50 text-center mt-8">
            <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center mb-4">
              <User className="w-5 h-5 text-white/30" />
            </div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              The room is empty.
            </p>
            <p className="text-[10px] text-[var(--color-text-ghost)] mt-1 tracking-widest uppercase">
              Waiting for squad to join...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
