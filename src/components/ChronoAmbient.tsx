'use client';

import { useEffect, useState } from 'react';

// Returns a subtle radial gradient that shifts color temperature based on time of day
function getAmbientGradient(): string {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) {
    // Morning: crisp, airy white with microscopic daylight blue
    return 'radial-gradient(ellipse at 50% 30%, rgba(220, 235, 250, 0.25) 0%, rgba(248, 247, 243, 0) 65%)';
  } else if (hour >= 12 && hour < 17) {
    // Afternoon: pure stark white/alabaster — almost invisible
    return 'radial-gradient(ellipse at 50% 40%, rgba(255, 255, 255, 0.15) 0%, rgba(248, 247, 243, 0) 60%)';
  } else if (hour >= 17 && hour < 20) {
    // Evening: subtle warm champagne undertone
    return 'radial-gradient(ellipse at 60% 50%, rgba(245, 225, 185, 0.2) 0%, rgba(248, 247, 243, 0) 70%)';
  } else {
    // Night: very subtle deep warm amber
    return 'radial-gradient(ellipse at 50% 60%, rgba(40, 35, 25, 0.08) 0%, rgba(248, 247, 243, 0) 70%)';
  }
}

export default function ChronoAmbient() {
  const [gradient, setGradient] = useState('');

  useEffect(() => {
    setGradient(getAmbientGradient());

    // Update every 10 minutes
    const interval = setInterval(() => {
      setGradient(getAmbientGradient());
    }, 600000);

    return () => clearInterval(interval);
  }, []);

  if (!gradient) return null;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none transition-all duration-[5000ms]"
      style={{ background: gradient }}
    />
  );
}
