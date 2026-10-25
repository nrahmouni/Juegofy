import React from 'react';
import { ArrowRight, RefreshCw, Trophy } from 'lucide-react';
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

  const messages = {
    bomb: { emoji: '💥', title: '¡BUM! Una bomba', desc: '¡Vaya explosión! La próxima la esquivas seguro.' },
    bee: { emoji: '🐝', title: '¡Bzzz! Una picadura', desc: '¡Esas abejitas vuelan muy rápido!' },
    edge: { emoji: '😵', title: '¡Te saliste del camino!', desc: '¡Mantente firme dentro del sendero!' },
    lift: { emoji: '✋', title: '¡Soltaste el dedito!', desc: 'Recuerda no levantar el dedo mientras avanzas.' },
  };

  const info = isWin
    ? { emoji: '🎉', title: '¡META CONSEGUIDA!', desc: '¡Increíble recorrido! ¡Has llegado al final!' }
    : messages[result.why || 'edge'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-300 text-slate-800 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* Big Avatar with Badge */}
        <div className="relative mb-3">
          <div
            className="w-24 h-24 rounded-full border-4 overflow-hidden shadow-lg flex items-center justify-center bg-slate-100"
            style={{ borderColor: result.color }}
          >
            {result.photoUrl ? (
              <img
                src={result.photoUrl}
                alt={result.playerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-5xl">{result.fallbackEmoji}</span>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 text-3xl filter drop-shadow">
            {info.emoji}
          </div>
        </div>

        {/* Player Name */}
        <h2 className="text-xl font-black text-slate-700">{result.playerName}</h2>
        <h3 className="text-2xl font-black text-pink-600 mt-0.5 mb-1">{info.title}</h3>
        <p className="text-xs font-semibold text-slate-500 mb-4">{info.desc}</p>

        {/* Score Card */}
        <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-600">Progreso recorrido:</span>
            <span className="font-black text-slate-800">
              {Math.round(result.progress * 100)} %
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-600">Estrellas recogidas:</span>
            <span className="font-black text-amber-500 flex items-center gap-1">
              <span>⭐</span> {result.stars}
            </span>
          </div>

          {result.wordsLearned !== undefined && result.wordsLearned > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-600">Palabras / Retos:</span>
              <span className="font-black text-emerald-600 flex items-center gap-1">
                <span>📚</span> {result.wordsLearned}
              </span>
            </div>
          )}

          <div className="h-px bg-slate-200 my-1" />

          <div className="flex items-center justify-between">
            <span className="font-black text-base text-slate-800">Puntos Totales:</span>
            <span className="text-2xl font-black text-pink-600">{result.pts} pts</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2">
          <button
            onClick={() => {
              sounds.sfxPop();
              onNext();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-black text-lg shadow-md active:scale-95 transition flex items-center justify-center gap-2"
          >
            {isLastPlayer ? (
              <>
                <Trophy className="w-6 h-6" />
                <span>¡Ver quién gana! 🏆</span>
              </>
            ) : (
              <>
                <span>Turno de {nextPlayerName}</span>
                <span className="text-xl">{nextPlayerEmoji}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {!isLastPlayer && (
            <button
              onClick={() => {
                sounds.sfxPop();
                onRetryTurn();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Repetir mi turno</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
