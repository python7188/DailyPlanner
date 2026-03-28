'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface GoldSparksProps {
  x: number;
  y: number;
}

export default function GoldSparks({ x, y }: GoldSparksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      decay: number;
      color: string;
    }

    const particles: Particle[] = [];
    const COLORS = ['#D4A853', '#E8C87A', '#B8942E', '#F0D88A', '#FFE4A0', '#C9983A'];

    // Create particles burst from the checkbox coordinates
    for (let i = 0; i < 35; i++) {
      const angle = (Math.PI * 2 * i) / 35 + (Math.random() - 0.5) * 0.4;
      const speed = 1.5 + Math.random() * 4;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // slight upward bias
        radius: 1 + Math.random() * 2.5,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const p of particles) {
        if (p.alpha <= 0) continue;
        alive = true;

        // Gravity
        p.vy += 0.12;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.radius *= 0.995;

        // Draw glowing ember
        ctx.save();
        ctx.globalAlpha = p.alpha;

        // Glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      }

      if (alive) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [x, y]);

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 pointer-events-none"
    />
  );
}
