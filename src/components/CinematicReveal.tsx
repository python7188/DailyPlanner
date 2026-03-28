'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface CinematicRevealProps {
  text: string;
  onComplete: () => void;
}

export default function CinematicReveal({ text, onComplete }: CinematicRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Simple gold particle canvas for the final burst
  useEffect(() => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
      color: string;
    }

    const particles: Particle[] = [];
    const COLORS = ['#D4A853', '#E8C87A', '#FFE4A0', '#B8942E', '#F0D88A'];

    // Delayed burst
    const burstTimer = setTimeout(() => {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      for (let i = 0; i < 80; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: 1 + Math.random() * 3,
          alpha: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }

      let frame: number;
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        for (const p of particles) {
          if (p.alpha <= 0) continue;
          alive = true;
          p.vy += 0.08;
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.012;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.shadowBlur = 12;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.restore();
        }
        if (alive) frame = requestAnimationFrame(draw);
      };
      draw();
      return () => cancelAnimationFrame(frame);
    }, 2200);

    return () => clearTimeout(burstTimer);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      {/* Dim background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black"
      />

      {/* Letterbox bars */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: '12vh' }}
        exit={{ height: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute top-0 left-0 right-0 bg-black z-10"
      />
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: '12vh' }}
        exit={{ height: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute bottom-0 left-0 right-0 bg-black z-10"
      />

      {/* Goal text — cinematic zoom */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 1.5, opacity: 0 }}
        transition={{
          scale: { duration: 2.5, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 1.5, delay: 0.3 },
        }}
        className="relative z-20 max-w-2xl px-8 text-center"
      >
        <p className="text-xs uppercase tracking-[0.4em] text-[var(--color-gold)] mb-4 font-semibold">
          🏆 Goal Achieved
        </p>
        <h1
          className="text-3xl md:text-5xl font-bold text-white leading-tight"
          style={{
            textShadow: '0 0 40px rgba(212, 168, 83, 0.5), 0 0 80px rgba(212, 168, 83, 0.2)',
          }}
        >
          {text}
        </h1>
      </motion.div>

      {/* Particle canvas */}
      <canvas className="absolute inset-0 z-30 pointer-events-none" />
    </motion.div>
  );
}
