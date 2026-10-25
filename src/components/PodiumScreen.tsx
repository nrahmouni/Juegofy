import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Sparkles, Settings } from 'lucide-react';
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
    // Confetti shower
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#ff4f8b', '#ffd23f', '#2ee6a6', '#5db8ff', '#f97316'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const medals = ['🥇', '🥈', '🥉', '🏅'];

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center select-none animate-in fade-in zoom-in-95 duration-300">
      {/* Trophy Header */}
      <div className="text-center mb-4">
        <div className="inline-block p-4 bg-amber-400 rounded-full shadow-lg border-4 border-yellow-200 mb-2 animate-bounce">
          <Trophy className="w-12 h-12 text-amber-950 fill-amber-300" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-pink-600 tracking-tight">
          {sorted.length > 1 ? `¡Gana ${winner.playerName}!` : '¡Gran Puntuación!'}
        </h1>
        <p className="text-xs font-bold text-slate-600">
          ¡Sois unos auténticos campeones del camino! 🌟
        </p>
      </div>

      {/* Podium Cards */}
      <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-xl border-2 border-pink-200 mb-4 flex flex-col gap-2.5">
        {sorted.map((res, index) => {
          const isFirst = index === 0;
          return (
            <div
              key={`podium-res-${res.playerId}-${index}`}
              className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition ${
                isFirst
                  ? 'bg-amber-100/70 border-amber-400 shadow-sm'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              {/* Medal */}
              <div className="text-2xl shrink-0 w-8 text-center">{medals[index]}</div>

              {/* Avatar Photo */}
              <div
                className="w-14 h-14 rounded-full border-3 overflow-hidden shadow-xs shrink-0 flex items-center justify-center bg-white"
                style={{ borderColor: res.color }}
              >
                {res.photoUrl ? (
                  <img
                    src={res.photoUrl}
                    alt={res.playerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">{res.fallbackEmoji}</span>
                )}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base text-slate-800 truncate">
                    {res.playerName}
                  </span>
                  {res.ok && (
                    <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded-full">
                      ¡Meta! 🏁
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span>⭐ {res.stars}</span>
                  {res.wordsLearned !== undefined && res.wordsLearned > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-emerald-700 font-bold">📚 {res.wordsLearned} retos</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{Math.round(res.progress * 100)}%</span>
                </div>
              </div>

              {/* Final Score */}
              <div className="text-right shrink-0">
                <div className="font-black text-xl text-pink-600">{res.pts}</div>
                <div className="text-[10px] font-bold text-slate-400">puntos</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col gap-2.5">
        <button
          onClick={() => {
            sounds.sfxPop();
            onPlayAgainSame();
          }}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-black text-lg shadow-md active:scale-95 transition flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Revancha (mismo circuito) 🔁</span>
        </button>

        <button
          onClick={() => {
            sounds.sfxPop();
            onPlayAgainNew();
          }}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-amber-950 font-black text-base shadow-md active:scale-95 transition flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-amber-950" />
          <span>¡Nuevo Circuito Mágico! 🎲</span>
        </button>

        <button
          onClick={() => {
            sounds.sfxPop();
            onGoToMenu();
          }}
          className="w-full py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-sm border border-slate-200 transition flex items-center justify-center gap-1.5"
        >
          <Settings className="w-4 h-4 text-slate-500" />
          <span>Cambiar juego o jugadores 🎨</span>
        </button>
      </div>
    </div>
  );
};
