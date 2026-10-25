import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Sparkles, Settings, Star, BookOpen, Target } from 'lucide-react';
import { PlayerResult } from '../types/game';
import { sounds } from '../audio/soundManager';

interface Props {
  results: PlayerResult[];
  onPlayAgainSame: () => void;
  onPlayAgainNew: () => void;
  onGoToMenu: () => void;
}

export const PodiumScreen: React.FC<Props> = ({
  results,
  onPlayAgainSame,
  onPlayAgainNew,
  onGoToMenu,
}) => {
  // Sort by points descending
  const sorted = [...results].sort((a, b) => b.pts - a.pts);
  const winner = sorted[0];

  useEffect(() => {
    sounds.sfxWin();
    // Continuous confetti for 3 seconds
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const medals = ['🥇', '🥈', '🥉', '🏅'];

  return (
    <div className="w-full max-w-lg mx-auto p-4 flex flex-col items-center select-none animate-in fade-in zoom-in-95 duration-500 h-screen overflow-hidden">
      
      {/* 🏆 Grand Trophy Header */}
      <div className="text-center mb-4 relative shrink-0">
        <div className="absolute inset-0 bg-yellow-400/20 blur-[60px] rounded-full animate-pulse-soft" />
        <div className="inline-block p-4 sm:p-6 bg-gradient-to-b from-yellow-300 to-amber-500 rounded-[2rem] sm:rounded-[3rem] shadow-[0_20px_50px_rgba(245,158,11,0.4)] border-b-[8px] sm:border-b-[12px] border-amber-700 mb-2 animate-float relative z-10">
          <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-white fill-white/20" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tighter drop-shadow-xl uppercase">
          {sorted.length > 1 ? `¡GANA ${winner.playerName.toUpperCase()}!` : '¡PUNTUACIÓN ÉPICA!'}
        </h1>
        <p className="text-white/60 font-black uppercase tracking-[0.2em] text-[8px] sm:text-[10px]">
          ¡SOIS UNOS CAMPEONES! 🌟
        </p>
      </div>

      {/* 📊 Ranking List */}
      <div className="w-full flex-1 flex flex-col gap-2 sm:gap-3 overflow-y-auto px-2 pb-24 no-scrollbar">
        {sorted.map((res, index) => {
          const isFirst = index === 0;
          return (
            <div
              key={`podium-res-${res.playerId}-${index}`}
              className={`relative flex items-center gap-3 p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2.5rem] border-b-4 sm:border-b-[8px] transition-all bg-white shadow-xl ${
                isFirst ? 'scale-105 z-20 border-amber-400' : 'opacity-90 border-slate-200'
              }`}
            >
              {/* Rank Badge */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm sm:text-lg shadow-lg border-2 border-indigo-400">
                {index + 1}
              </div>

              {/* Avatar Photo */}
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 sm:border-4 overflow-hidden shadow-inner shrink-0 flex items-center justify-center bg-slate-50 ml-4 sm:ml-6"
                style={{ borderColor: res.color }}
              >
                {res.photoUrl ? (
                  <img src={res.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl sm:text-3xl">{res.fallbackEmoji}</span>
                )}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm sm:text-lg text-slate-800 truncate uppercase tracking-tight">
                    {res.playerName}
                  </span>
                  {res.ok && (
                    <span className="text-[6px] sm:text-[8px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded-full uppercase">
                      FIN 🏁
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1 text-amber-500 font-black text-[10px] sm:text-xs">
                    <Star className="w-3 h-3 fill-amber-400" /> {res.stars}
                  </div>
                  {res.wordsLearned !== undefined && res.wordsLearned > 0 && (
                    <div className="flex items-center gap-1 text-emerald-600 font-black text-[10px] sm:text-xs">
                      <BookOpen className="w-3 h-3" /> {res.wordsLearned}
                    </div>
                  )}
                </div>
              </div>

              {/* Final Score */}
              <div className="text-right pr-1">
                <div className="font-black text-lg sm:text-2xl text-pink-600 leading-none">{res.pts}</div>
                <div className="text-[6px] sm:text-[8px] font-black text-slate-400 uppercase tracking-tighter">PUNTOS</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🏁 Sticky Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto flex flex-col gap-2">
          <button
            onClick={() => { sounds.sfxPop(); onPlayAgainNew(); }}
            className="w-full py-3 sm:py-4 rounded-[1.5rem] bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-sm sm:text-lg shadow-xl btn-squishy border-b-4 border-indigo-800 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span className="tracking-tight uppercase">NUEVA AVENTURA</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => { sounds.sfxPop(); onPlayAgainSame(); }}
              className="flex-1 py-3 rounded-xl bg-white text-slate-700 font-black text-[10px] sm:text-xs shadow-lg btn-squishy border-b-2 border-slate-200 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> REVANCHA
            </button>
            <button
              onClick={() => { sounds.sfxPop(); onGoToMenu(); }}
              className="flex-1 py-3 rounded-xl bg-white text-slate-700 font-black text-[10px] sm:text-xs shadow-lg btn-squishy border-b-2 border-slate-200 flex items-center justify-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" /> MENÚ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
