import React, { useCallback, useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { PlayerConfig } from '../../types/game';
import { LearningItem, SPANISH_VOCAB_ITEMS, ALPHABET_LEARNING_ITEMS } from '../../data/learningData';
import { sounds } from '../../audio/soundManager';
import { useAdaptiveRound } from '../../hooks/useAdaptiveRound';

interface Props {
  player: PlayerConfig;
  selectedLevel: number;
  learnedWordIds: string[];
  missedWordIds: string[];
  onMarkWordLearned: (id: string) => void;
  onMarkWordMissed?: (id: string) => void;
  onWin: (score: number, stars: number, words: number) => void;
  setProgressPercent: (n: number) => void;
  starsCollected: number;
  setStarsCollected: (n: number | ((p: number) => number)) => void;
  wordsLearned: number;
  setWordsLearned: (n: number | ((p: number) => number)) => void;
}

type Piece = {
  id: string;
  item: LearningItem;
  placed: boolean;
};

const POOL = [...SPANISH_VOCAB_ITEMS, ...ALPHABET_LEARNING_ITEMS];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const MagicPuzzleGame: React.FC<Props> = ({
  player,
  selectedLevel,
  learnedWordIds,
  missedWordIds,
  onMarkWordLearned,
  onMarkWordMissed,
  onWin,
  setProgressPercent,
  setStarsCollected,
  setWordsLearned,
}) => {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [slots, setSlots] = useState<LearningItem[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);

  const {
    target,
    setupRound,
    handleCorrect,
    praiseBanner,
    combo,
    isResolving,
    showSmartHint,
  } = useAdaptiveRound({
    playerName: player.name,
    selectedLevel,
    learnedWordIds,
    missedWordIds,
    pool: POOL,
    optionsCount: 4,
    totalRounds: 5,
    onMarkWordLearned,
    onMarkWordMissed,
    onWin,
    setProgressPercent,
    setStarsCollected,
    setWordsLearned,
    winScoreBase: 100,
    winScorePerLevel: 15,
    winScorePerCombo: 10,
  });

  // Build a 2x2 or 3-piece puzzle board around the target
  useEffect(() => {
    if (!target || isResolving) return;
    const n = selectedLevel >= 5 ? 4 : 3;
    const others = shuffle(POOL.filter((p) => p.id !== target.id)).slice(0, n - 1);
    const board = shuffle([target, ...others]);
    setSlots(board);
    setPieces(
      shuffle(board).map((item) => ({
        id: item.id,
        item,
        placed: false,
      }))
    );
  }, [target, isResolving, selectedLevel]);

  useEffect(() => {
    void setupRound(0, true);
  }, [setupRound]);

  const allPlaced = useMemo(() => pieces.length > 0 && pieces.every((p) => p.placed), [pieces]);

  useEffect(() => {
    if (!allPlaced || !target || isResolving) return;
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.55 } });
    void handleCorrect(target);
  }, [allPlaced, target, isResolving, handleCorrect]);

  const tryPlace = useCallback(
    (pieceId: string, slotItemId: string) => {
      if (isResolving) return;
      if (pieceId === slotItemId) {
        sounds.sfxMagic();
        setPieces((prev) => prev.map((p) => (p.id === pieceId ? { ...p, placed: true } : p)));
      } else {
        sounds.sfxError();
        const wrong = pieces.find((p) => p.id === pieceId)?.item;
        if (wrong && onMarkWordMissed && target) onMarkWordMissed(target.id);
        void sounds.speakAsync(wrong?.es || '¡Ups!', 'es-ES', true);
      }
      setDraggingId(null);
      setHoverSlot(null);
    },
    [isResolving, pieces, onMarkWordMissed, target]
  );

  const onDragStart = (id: string) => (e: React.DragEvent | React.TouchEvent) => {
    setDraggingId(id);
    if ('dataTransfer' in e) {
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col p-3 gap-3 overflow-hidden">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-white/95 rounded-2xl px-4 py-2 shadow-lg border border-violet-200">
          <span className="text-2xl">🧩</span>
          <div className="text-left">
            <div className="text-[10px] font-black uppercase text-violet-500">Puzzle mágico</div>
            <div className="text-sm font-black text-slate-800">
              {target ? `Coloca ${target.emoji} ${target.es}` : 'Preparando…'}
            </div>
          </div>
          {combo > 1 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black">
              x{combo}
            </span>
          )}
        </div>
      </div>

      {praiseBanner && (
        <div className="text-center">
          <span className="inline-block bg-emerald-500 text-white font-black px-4 py-1.5 rounded-full shadow-lg animate-bounce">
            {praiseBanner}
          </span>
        </div>
      )}

      {/* Slots board */}
      <div
        className={`grid gap-2 flex-1 max-h-[45%] ${slots.length > 3 ? 'grid-cols-2' : 'grid-cols-3'}`}
      >
        {slots.map((slot) => {
          const placed = pieces.find((p) => p.id === slot.id && p.placed);
          const isHint = showSmartHint && target && slot.id === target.id && !placed;
          return (
            <div
              key={slot.id}
              onDragOver={(e) => {
                e.preventDefault();
                setHoverSlot(slot.id);
              }}
              onDragLeave={() => setHoverSlot(null)}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain') || draggingId;
                if (id) tryPlace(id, slot.id);
              }}
              onTouchEnd={() => {
                if (draggingId) tryPlace(draggingId, slot.id);
              }}
              className={`rounded-3xl border-4 border-dashed flex flex-col items-center justify-center transition-all ${
                placed
                  ? 'bg-emerald-100 border-emerald-400'
                  : hoverSlot === slot.id
                    ? 'bg-violet-100 border-violet-400 scale-105'
                    : isHint
                      ? 'bg-amber-50 border-amber-400 animate-pulse'
                      : 'bg-white/80 border-slate-300'
              }`}
            >
              {placed ? (
                <>
                  <span className="text-4xl sm:text-5xl">{slot.emoji}</span>
                  <span className="text-xs font-black text-slate-700 mt-1">{slot.es}</span>
                </>
              ) : (
                <span className="text-3xl opacity-30">▢</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Draggable tray */}
      <div className="bg-white/90 rounded-3xl p-3 shadow-xl border border-slate-200">
        <div className="text-[10px] font-black uppercase text-slate-400 mb-2 text-center">
          Arrastra las piezas
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {pieces
            .filter((p) => !p.placed)
            .map((p) => (
              <div
                key={p.id}
                draggable
                onDragStart={onDragStart(p.id)}
                onTouchStart={() => setDraggingId(p.id)}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex flex-col items-center justify-center shadow-lg cursor-grab active:cursor-grabbing btn-squishy border-b-4 border-violet-900 ${
                  draggingId === p.id ? 'opacity-60 scale-95' : ''
                }`}
              >
                <span className="text-3xl">{p.item.emoji}</span>
                <span className="text-[10px] font-black truncate max-w-[90%]">{p.item.es}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
