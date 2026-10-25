import React, { useEffect } from 'react';
import { ArrowRight, RefreshCw, Trophy, Star, BookOpen, Volume2 } from 'lucide-react';
import { PlayerResult } from '../types/game';
import { sounds } from '../audio/soundManager';

interface Props {
  result: PlayerResult;
  isLastPlayer: boolean;
  nextPlayerName?: string;
  nextPlayerEmoji?: string;
  onNext: () => void;
  onRetryTurn: () => void;
}

export const TurnResultModal: React.FC<Props> = ({
  result,
  isLastPlayer,
  nextPlayerName,
  nextPlayerEmoji,
  onNext,
  onRetryTurn,
}) => {
  const isWin = result.ok;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isWin) {
        sounds.speak(`¡Muy bien ${result.playerName}! ¡Lo has hecho genial!`, 'es-ES');
      } else {
        sounds.speak(`¡Buen intento ${result.playerName}!`, 'es-ES');
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [isWin, result.playerName]);

  const info = isWin
    ? {
        emoji: '🎉',
        title: `¡MUY BIEN, ${result.playerName.toUpperCase()}!`,
        desc: '¡Has superado todos los retos de tu turno!',
      }
    : {
        emoji: '💡',
        title: `¡CASI, ${result.playerName.toUpperCase()}!`,
        desc: '¡Inténtalo de nuevo para conseguir todas las estrellas!',
      };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-300 select-none">
      <div className="relative w-full max-w-sm bg-white rounded-[3rem] p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border-b-[12px] border-slate-200 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
        {/* Big Avatar with Badge */}
        <div className="relative mb-5">
          <div
            className="w-28 h-28 rounded-full border-8 overflow-hidden shadow-2xl flex items-center justify-center bg-white"
            style={{ borderColor: result.color }}
          >
            {result.photoUrl ? (
              <img src={result.photoUrl} alt={result.playerName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl">{result.fallbackEmoji}</span>
            )}
          </div>
          <button
            onClick={() => sounds.speak(`¡Muy bien ${result.playerName}!`, 'es-ES')}
            className="absolute -bottom-2 -right-2 p-2.5 bg-emerald-500 text-white rounded-full shadow-xl btn-squishy"
            aria-label="Repetir felicitación"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Personalized Celebration Title */}
        <div className="mb-5">
          <h3 className="text-2xl sm:text-3xl font-black text-indigo-950 uppercase tracking-tight leading-tight mb-2">
            {info.title}
          </h3>
          <p className="text-sm font-bold text-slate-500 leading-tight px-2">{info.desc}</p>
        </div>

        {/* Score Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          <div className="bg-amber-50 p-3.5 rounded-3xl border-2 border-amber-200 flex flex-col items-center">
            <Star className="w-6 h-6 text-amber-500 fill-amber-400 mb-1" />
            <div className="text-[10px] font-black text-amber-700 uppercase">Estrellas</div>
            <div className="text-2xl font-black text-amber-950 tabular-nums">{result.stars}</div>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-3xl border-2 border-emerald-200 flex flex-col items-center">
            <BookOpen className="w-6 h-6 text-emerald-600 mb-1" />
            <div className="text-[10px] font-black text-emerald-700 uppercase">Palabras</div>
            <div className="text-2xl font-black text-emerald-950 tabular-nums">
              {result.wordsLearned || result.stars}
            </div>
          </div>
          <div className="col-span-2 bg-indigo-600 p-4 rounded-3xl shadow-xl border-b-4 border-indigo-800 flex items-center justify-between px-6 text-white">
            <div className="font-black text-base uppercase tracking-tight">Puntos ganados</div>
            <div className="text-3xl font-black tabular-nums">+{result.pts}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => {
              sounds.sfxPop();
              onNext();
            }}
            className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-xl sm:text-2xl shadow-xl btn-squishy flex items-center justify-center gap-3 border-b-8 border-rose-800"
          >
            {isLastPlayer ? (
              <>
                <Trophy className="w-7 h-7" />
                <span>VER PODIO FINAL</span>
              </>
            ) : (
              <>
                <span className="tracking-tight uppercase">Turno de</span>
                <span className="bg-white/25 px-3 py-1 rounded-full text-lg flex items-center gap-1.5">
                  <span>{nextPlayerEmoji}</span>
                  <span>{nextPlayerName}</span>
                </span>
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>

          {!isWin && (
            <button
              onClick={() => {
                sounds.sfxPop();
                onRetryTurn();
              }}
              className="w-full py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm uppercase tracking-wider transition-all hover:bg-slate-200 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
