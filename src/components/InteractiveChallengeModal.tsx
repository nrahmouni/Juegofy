import React, { useState, useEffect } from 'react';
import { Sparkles, Shield, Star, Award, Zap } from 'lucide-react';
import { sounds } from '../audio/soundManager';

interface Props {
  playerName: string;
  playerPhoto: string | null;
  playerEmoji: string;
  onComplete: (bonusStars: number, hasShield: boolean) => void;
}

interface Bubble {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  popped: boolean;
}

export const InteractiveChallengeModal: React.FC<Props> = ({
  playerName,
  playerPhoto,
  playerEmoji,
  onComplete,
}) => {
  const [challengeType] = useState<'bubbles' | 'star'>(() =>
    Math.random() > 0.5 ? 'bubbles' : 'star'
  );
  const [timeLeft, setTimeLeft] = useState<number>(7);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Bubble Challenge State
  const [bubbles, setBubbles] = useState<Bubble[]>(() => [
    { id: 1, x: 20, y: 30, color: '#ec4899', size: 54, popped: false },
    { id: 2, x: 70, y: 25, color: '#3b82f6', size: 62, popped: false },
    { id: 3, x: 45, y: 55, color: '#10b981', size: 58, popped: false },
    { id: 4, x: 25, y: 75, color: '#f59e0b', size: 50, popped: false },
    { id: 5, x: 75, y: 70, color: '#8b5cf6', size: 66, popped: false },
  ]);

  // Star Challenge State
  const [starPos, setStarPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [starTapsNeeded, setStarTapsNeeded] = useState<number>(3);

  // Timer countdown
  useEffect(() => {
    if (isSuccess) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          finish(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSuccess]);

  // Finish challenge
  const finish = (won: boolean) => {
    setIsSuccess(won);
    if (won) {
      sounds.sfxWin();
      setTimeout(() => {
        onComplete(3, true); // +3 stars and grants shield!
      }, 1200);
    } else {
      sounds.sfxOops();
      setTimeout(() => {
        onComplete(1, false);
      }, 800);
    }
  };

  // Pop a bubble
  const handlePopBubble = (id: number) => {
    sounds.sfxBubblePop();
    setBubbles((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, popped: true } : b));
      if (next.every((b) => b.popped)) {
        finish(true);
      }
      return next;
    });
  };

  // Tap bouncing star
  const handleTapStar = () => {
    sounds.sfxStar(4 - starTapsNeeded);
    const remaining = starTapsNeeded - 1;
    setStarTapsNeeded(remaining);
    if (remaining <= 0) {
      finish(true);
    } else {
      // Jitter star to new position
      setStarPos({
        x: 18 + Math.random() * 64,
        y: 20 + Math.random() * 60,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-indigo-900 to-purple-950 rounded-3xl p-6 shadow-2xl border-4 border-yellow-400 text-white flex flex-col items-center overflow-hidden">
        {/* Glow Header */}
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-bounce" />
          <h2 className="text-2xl font-black text-yellow-300 tracking-wide uppercase drop-shadow">
            ¡Reto Exprés!
          </h2>
          <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-bounce" />
        </div>

        {/* Player identifier */}
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-3">
          {playerPhoto ? (
            <img
              src={playerPhoto}
              alt={playerName}
              className="w-6 h-6 rounded-full border border-yellow-300 object-cover"
            />
          ) : (
            <span className="text-base">{playerEmoji}</span>
          )}
          <span className="text-xs font-bold text-yellow-200">¡Vamos, {playerName}!</span>
          <span className="text-xs font-black bg-rose-500 px-2 py-0.5 rounded-full ml-1">
            ⏱️ {timeLeft}s
          </span>
        </div>

        {/* Challenge Instructions */}
        <p className="text-sm font-semibold text-center text-purple-200 mb-4">
          {challengeType === 'bubbles'
            ? '¡Toca y explota todas las burbujas antes de que termine el tiempo!'
            : '¡Atrapa la estrella saltarina tocándola 3 veces!'}
        </p>

        {/* Challenge Interactive Arena */}
        <div className="relative w-full h-56 rounded-2xl bg-indigo-950/80 border-2 border-indigo-400/40 overflow-hidden mb-4 select-none touch-none">
          {challengeType === 'bubbles' ? (
            // Bubbles
            bubbles.map((b) =>
              !b.popped ? (
                <button
                  key={b.id}
                  onClick={() => handlePopBubble(b.id)}
                  style={{
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    width: `${b.size}px`,
                    height: `${b.size}px`,
                    backgroundColor: b.color,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/60 shadow-lg active:scale-75 transition-transform flex items-center justify-center animate-pulse"
                >
                  <span className="w-3 h-3 rounded-full bg-white/80 absolute top-2 left-2" />
                </button>
              ) : null
            )
          ) : (
            // Bouncing Star
            <button
              onClick={handleTapStar}
              style={{
                left: `${starPos.x}%`,
                top: `${starPos.y}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-5xl active:scale-125 transition-all duration-150 drop-shadow-xl animate-bounce"
            >
              ⭐
            </button>
          )}

          {/* Victory Overlay inside Arena */}
          {isSuccess && (
            <div className="absolute inset-0 bg-emerald-500/90 flex flex-col items-center justify-center p-4 animate-in zoom-in-75 duration-200">
              <Award className="w-16 h-16 text-yellow-300 animate-spin mb-2" />
              <h3 className="text-2xl font-black text-white">¡CONSEGUIDO!</h3>
              <p className="text-xs text-emerald-100 font-bold flex items-center gap-1 mt-1">
                <Shield className="w-4 h-4 fill-sky-300 text-sky-300" /> ¡Escudo activado + 3⭐!
              </p>
            </div>
          )}
        </div>

        {/* Reward Reminder */}
        <div className="w-full flex items-center justify-around text-xs font-bold bg-white/10 p-2.5 rounded-xl">
          <div className="flex items-center gap-1 text-sky-300">
            <Shield className="w-4 h-4" /> 1 Escudo Protector
          </div>
          <div className="flex items-center gap-1 text-yellow-300">
            <Star className="w-4 h-4 fill-yellow-300" /> +3 Estrellas
          </div>
        </div>
      </div>
    </div>
  );
};
