import React, { useEffect, useState } from 'react';

export type MascotMood = 'idle' | 'happy' | 'think' | 'sleep' | 'cheer';

interface Props {
  mood?: MascotMood;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

/**
 * Friendly dragon-baby mascot — pure CSS/emoji, no external assets.
 */
export const MascotBuddy: React.FC<Props> = ({
  mood = 'idle',
  size = 'md',
  className = '',
  label,
}) => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (mood === 'sleep') return;
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 3200 + Math.random() * 2000);
    return () => clearInterval(id);
  }, [mood]);

  const sizeCls =
    size === 'sm' ? 'text-3xl' : size === 'lg' ? 'text-6xl sm:text-7xl' : 'text-5xl';

  const anim =
    mood === 'cheer'
      ? 'animate-bounce'
      : mood === 'happy'
        ? 'animate-pulse-soft'
        : mood === 'sleep'
          ? 'opacity-80'
          : 'animate-float';

  const face =
    mood === 'sleep' ? '😴' : mood === 'think' ? '🧐' : mood === 'cheer' || mood === 'happy' ? '🐲' : '🐉';

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className={`relative ${sizeCls} ${anim} select-none leading-none drop-shadow-lg`}>
        <span style={{ filter: blink ? 'brightness(0.7)' : undefined }}>{face}</span>
        {mood === 'cheer' && (
          <span className="absolute -top-2 -right-3 text-lg animate-bounce">✨</span>
        )}
        {mood === 'happy' && (
          <span className="absolute -top-1 -left-2 text-sm animate-float">⭐</span>
        )}
      </div>
      {label && (
        <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-white/90 bg-slate-900/40 px-2 py-0.5 rounded-full">
          {label}
        </div>
      )}
    </div>
  );
};
