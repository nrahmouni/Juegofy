import React, { useEffect, useState } from 'react';

interface Props {
  text: string;
  /** 'swipe' | 'drag' | 'tap' | 'hold' */
  gesture?: 'swipe' | 'drag' | 'tap' | 'hold';
  show?: boolean;
  className?: string;
}

/**
 * One-shot visual hint with animated arrow for first seconds of a mode.
 */
export const TutorialHint: React.FC<Props> = ({
  text,
  gesture = 'drag',
  show = true,
  className = '',
}) => {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 4500);
    return () => clearTimeout(t);
  }, [show, text]);

  if (!visible) return null;

  const arrow =
    gesture === 'swipe' ? '👉' : gesture === 'tap' ? '👆' : gesture === 'hold' ? '✋' : '↪️';

  return (
    <div
      className={`pointer-events-none z-40 flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/85 text-white shadow-2xl border border-white/20 animate-slide-up ${className}`}
    >
      <span className="text-2xl animate-point">{arrow}</span>
      <span className="text-xs sm:text-sm font-black leading-tight">{text}</span>
    </div>
  );
};
