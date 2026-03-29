"use client";

import React, { forwardRef } from 'react';

interface FlexCardProps {
  timeString: string;
  disciplinePoints: number;
  username: string;
}

const FlexCard = forwardRef<HTMLDivElement, FlexCardProps>(
  ({ timeString, disciplinePoints, username }, ref) => {
    return (
      <div 
        ref={ref}
        // Use a fixed high-res mobile aspect ratio
        className="absolute -left-[9999px] top-0 w-[1080px] h-[1920px] bg-[#0a0f16] flex flex-col items-center justify-center overflow-hidden"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Atmospheric Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[1000px] h-[1000px] bg-emerald-900/30 rounded-full blur-[200px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[1000px] h-[1000px] bg-[var(--color-gold)]/10 rounded-full blur-[200px]" />
        
        {/* Core Smoked Glass Container */}
        <div className="relative z-10 w-[900px] bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-24 flex flex-col items-center shadow-[0_20px_100px_rgba(0,0,0,0.8)]">
          
          <div className="w-full flex justify-center mb-16">
            <div className="px-8 py-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
              <span className="text-white/70 text-2xl font-bold tracking-[0.3em] uppercase">
                Midnight Grind
              </span>
            </div>
          </div>

          <p className="text-white/90 text-4xl mb-24 text-center leading-snug font-medium">
            <span className="font-bold text-white text-5xl block mb-4">{username}</span> 
            completed a brutal deep work session.
          </p>
          
          <div className="text-[170px] text-white font-light tracking-tighter leading-none mb-24 drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] flex justify-center w-full">
            {timeString}
          </div>
          
          <div className="bg-[#14120c] border border-[var(--color-gold)]/30 px-16 py-8 rounded-full flex items-center justify-center gap-8 shadow-[0_0_50px_rgba(207,166,96,0.15)] w-full">
            <span className="text-[var(--color-gold)] text-4xl font-bold tracking-widest uppercase">
              Yield:
            </span>
            <span className="text-white text-6xl font-black tabular-nums">
              +{disciplinePoints}
            </span>
            <span className="text-[var(--color-gold)]/50 text-3xl font-bold uppercase tracking-widest">
              Gold
            </span>
          </div>

        </div>

        {/* Footer Branding */}
        <div className="absolute bottom-32 w-full flex flex-col items-center z-10">
          <p className="text-white/40 text-3xl tracking-[0.4em] uppercase font-bold mb-6 text-center">
            Earn your crown
          </p>
          <div className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <p className="text-white/60 text-2xl tracking-widest font-mono">
              genzdailyplanner.vercel.app
            </p>
          </div>
        </div>
      </div>
    );
  }
);

FlexCard.displayName = 'FlexCard';
export default FlexCard;
