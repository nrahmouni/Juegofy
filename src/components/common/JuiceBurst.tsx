import React, { useEffect, useState } from 'react';

interface Props {
  x?: number; // % or px if fixed
  y?: number;
  trigger: number; // increment to fire
  kind?: 'stars' | 'hearts' | 'spark';
}

const GLYPHS: Record<string, string[]> = {
  stars: ['⭐', '✨', '🌟', '💫'],
  hearts: ['💖', '💗', '💕'],
  spark: ['✨', '⚡', '✦'],
};

/**
 * Lightweight particle burst for correct answers (no canvas dependency).
 */
export const JuiceBurst: React.FC<Props> = ({ x = 50, y = 50, trigger, kind = 'stars' }) => {
  const [bits, setBits] = useState<{ id: number; g: string; dx: number; dy: number }[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const glyphs = GLYPHS[kind] || GLYPHS.stars;
    const next = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      g: glyphs[i % glyphs.length],
      dx: (Math.random() - 0.5) * 120,
      dy: -40 - Math.random() * 80,
    }));
    setBits(next);
    const t = setTimeout(() => setBits([]), 700);
    return () => clearTimeout(t);
  }, [trigger, kind]);

  if (!bits.length) return null;

  return (
    <div
      className="pointer-events-none fixed z-[180]"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {bits.map((b) => (
        <span
          key={b.id}
          className="absolute text-xl animate-juice"
          style={
            {
              ['--dx' as string]: `${b.dx}px`,
              ['--dy' as string]: `${b.dy}px`,
            } as React.CSSProperties
          }
        >
          {b.g}
        </span>
      ))}
    </div>
  );
};
