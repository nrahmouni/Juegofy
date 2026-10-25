import React, { useState, useEffect } from 'react';
import { Sparkles, Shield, Star, Award, Zap, Timer } from 'lucide-react';
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
    { id: 1, x: 20, y: 30, color: '#ec4899', size: 60, popped: false },
    { id: 2, x: 75, y: 25, color: '#3b82f6', size: 70, popped: false },
    { id: 3, x: 50, y: 55, color: '#10b981', size: 65, popped: false },
    { id: 4, x: 25, y: 80, color: '#f59e0b', size: 55, popped: false },
    { id: 5, x: 75, y: 75, color: '#8b5cf6', size: 75, popped: false },
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
        onComplete(5, true); // +5 stars and grants shield!
      }, 1500);
    } else {
      sounds.sfxOops();
      setTimeout(() => {
        onComplete(1, false);
      }, 1000);
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
      setStarPos({
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 60,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-indigo-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-white rounded-[3.5rem] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.5)] border-b-[12px] border-slate-200 flex flex-col items-center overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Animated Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-32 h-32 bg-pink-500/20 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-[-10%] right-[-10%] w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />

        {/* Glow Header */}
        <div className="flex items-center gap-3 mb-4 relative">
          <Zap className="w-8 h-8 text-yellow-500 fill-yellow-400 animate-bounce" />
          <h2 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase leading-none">
            ¡RETO RÁPIDO!
          </h2>
          <Zap className="w-8 h-8 text-yellow-500 fill-yellow-400 animate-bounce" />
        </div>

        {/* HUD Info */}
        <div className="flex items-center justify-between w-full mb-6 gap-2">
           <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-2xl border-2 border-slate-200">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm bg-white">
                {playerPhoto ? <img src={playerPhoto} alt="" className="w-full h-full object-cover" /> : <span className="text-xl flex items-center justify-center h-full">{playerEmoji}</span>}
              </div>
              <span className="text-sm font-black text-indigo-900">{playerName}</span>
           </div>
           
           <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 shadow-lg transition-colors ${timeLeft <= 3 ? 'bg-rose-500 border-rose-400 text-white animate-pulse' : 'bg-white border-slate-200 text-slate-800'}`}>
              <Timer className="w-5 h-5" />
              <span className="text-xl font-black">{timeLeft}s</span>
           </div>
        </div>

        {/* Instructions */}
        <p className="text-sm font-bold text-center text-slate-500 mb-6 uppercase tracking-widest leading-none">
          {challengeType === 'bubbles'
            ? '¡Explota todas las burbujas!'
            : '¡Atrapa la estrella 3 veces!'}
        </p>

        {/* Interactive Arena */}
        <div className="relative w-full h-64 rounded-[2.5rem] bg-slate-50 border-4 border-slate-100 overflow-hidden mb-8 shadow-inner select-none touch-none">
          {challengeType === 'bubbles' ? (
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
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-xl active:scale-75 transition-all flex items-center justify-center btn-squishy"
                >
                  <div className="w-full h-full rounded-full bg-white/20 relative">
                    <div className="absolute top-2 left-2 w-3 h-3 bg-white/60 rounded-full" />
                  </div>
                </button>
              ) : null
            )
          ) : (
            <button
              onClick={handleTapStar}
              style={{
                left: `${starPos.x}%`,
                top: `${starPos.y}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-7xl active:scale-150 transition-all duration-150 drop-shadow-2xl animate-float relative z-10"
            >
              <Star className="w-16 h-16 text-yellow-500 fill-yellow-400" />
              {starTapsNeeded < 3 && (
                <div className="absolute -top-4 -right-4 bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2 border-white shadow-lg">
                  {starTapsNeeded}
                </div>
              )}
            </button>
          )}

          {/* Victory UI */}
          {isSuccess && (
            <div className="absolute inset-0 bg-emerald-500 flex flex-col items-center justify-center p-6 animate-in zoom-in-50 duration-300 z-50">
              <div className="bg-white p-4 rounded-full mb-4 shadow-2xl animate-bounce">
                <Award className="w-16 h-16 text-emerald-600" />
              </div>
              <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">¡LO LOGRASTE!</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-white font-black text-sm">
                  <Star className="w-4 h-4 fill-white" /> +5
                </div>
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-white font-black text-sm">
                  <Shield className="w-4 h-4 fill-white" /> ESCUDO
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="w-full grid grid-cols-2 gap-3">
          <div className="flex items-center justify-center gap-2 bg-sky-50 p-3 rounded-2xl border-2 border-sky-100 text-sky-700 font-black text-xs uppercase">
            <Shield className="w-4 h-4" /> Escudo Mágico
          </div>
          <div className="flex items-center justify-center gap-2 bg-yellow-50 p-3 rounded-2xl border-2 border-yellow-100 text-yellow-700 font-black text-xs uppercase">
            <Star className="w-4 h-4 fill-yellow-400" /> +5 Estrellas
          </div>
        </div>
      </div>
    </div>
  );
};
