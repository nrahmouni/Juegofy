import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, HelpCircle } from 'lucide-react';
import { PlayerConfig } from '../../types/game';
import {
  LearningItem,
  selectAdaptiveItems,
  getPersonalizedPraise,
} from '../../data/learningData';
import { PracticeLang } from '../../types/game';
import { getKitchenPool } from '../../data/languagePools';
import { sounds } from '../../audio/soundManager';
import { TutorialHint } from '../common/TutorialHint';

interface Props {
  player: PlayerConfig;
  practiceLang?: PracticeLang;
  selectedLevel: number;
  learnedWordIds: string[];
  missedWordIds?: string[];
  onMarkWordLearned: (id: string) => void;
  onMarkWordMissed?: (id: string) => void;
  onWin: (score: number, stars: number, words: number) => void;
  setProgressPercent: (p: number) => void;
  starsCollected: number;
  setStarsCollected: React.Dispatch<React.SetStateAction<number>>;
  wordsLearned: number;
  setWordsLearned: React.Dispatch<React.SetStateAction<number>>;
}

type OrderStep = { item: LearningItem; done: boolean };

/**
 * Cocina Loca — real sequence game:
 * Chef orders 2–4 ingredients in order. Drag each to the pan in the right sequence.
 */
export const CrazyKitchenGame: React.FC<Props> = ({
  player,
  practiceLang = 'es',
  selectedLevel,
  learnedWordIds,
  missedWordIds = [],
  onMarkWordLearned,
  onMarkWordMissed,
  onWin,
  setProgressPercent,
  setStarsCollected,
  setWordsLearned,
}) => {
  const totalRounds = Math.min(5, 3 + Math.floor(selectedLevel / 3));
  const stepsPerOrder = Math.min(4, 2 + Math.floor(selectedLevel / 3));

  const [order, setOrder] = useState<OrderStep[]>([]);
  const [tray, setTray] = useState<LearningItem[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [roundIdx, setRoundIdx] = useState(0);
  const [chefMood, setChefMood] = useState<'wait' | 'happy' | 'oops'>('wait');
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);
  const [dragging, setDragging] = useState<LearningItem | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [panHot, setPanHot] = useState(false);

  const panRef = useRef<HTMLDivElement | null>(null);
  const isResolving = useRef(false);
  const starsRef = useRef(0);
  const wordsRef = useRef(0);
  const usedIds = useRef<Set<string>>(new Set());
  const roundRef = useRef(0);

  useEffect(() => { roundRef.current = roundIdx; }, [roundIdx]);

  const setupOrder = useCallback(
    (rIdx: number) => {
      isResolving.current = false;
      setChefMood('wait');
      setPraiseBanner(null);
      setDragging(null);
      setStepIdx(0);

      const pool = getKitchenPool(practiceLang);
      const available = pool.filter((i) => !usedIds.current.has(i.id));
      const picks: LearningItem[] = [];
      let src = available.length ? available : pool;
      for (let i = 0; i < stepsPerOrder; i++) {
        const picked = selectAdaptiveItems(
          src.filter((x) => !picks.find((p) => p.id === x.id)),
          selectedLevel,
          learnedWordIds,
          missedWordIds,
          1
        )[0];
        if (picked) {
          picks.push(picked);
          usedIds.current.add(picked.id);
        }
      }
      if (!picks.length) return;

      // distractors on tray
      const distractors = pool
        .filter((i) => !picks.find((p) => p.id === i.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(3, picks.length + 1));

      setOrder(picks.map((item) => ({ item, done: false })));
      setTray([...picks, ...distractors].sort(() => Math.random() - 0.5));
      setRoundIdx(rIdx);

      const names = picks.map((p) => p.es).join(', luego ');
      void (async () => {
        await new Promise((r) => setTimeout(r, 200));
        await sounds.speakAsync(`¡Pedido! ${names}`, 'es-ES', true);
      })();
    },
    [selectedLevel, learnedWordIds, missedWordIds, stepsPerOrder, practiceLang]
  );

  useEffect(() => {
    usedIds.current.clear();
    starsRef.current = 0;
    wordsRef.current = 0;
    setupOrder(0);
  }, [setupOrder]);

  const completeRound = async () => {
    if (isResolving.current) return;
    isResolving.current = true;
    setChefMood('happy');
    setPanHot(true);
    sounds.sfxMagic();
    confetti({ particleCount: 55, spread: 60, origin: { y: 0.55 } });

    order.forEach((s) => onMarkWordLearned(s.item.id));
    const nextRound = roundRef.current + 1;
    const nextStars = starsRef.current + 3;
    const nextWords = wordsRef.current + order.length;
    starsRef.current = nextStars;
    wordsRef.current = nextWords;
    setStarsCollected(nextStars);
    setWordsLearned(nextWords);
    setProgressPercent((nextRound / totalRounds) * 100);

    const isFinal = nextRound >= totalRounds;
    const praise = getPersonalizedPraise(player.name, isFinal);
    setPraiseBanner(praise);
    await sounds.speakPraise(praise);
    setPraiseBanner(null);
    setPanHot(false);

    if (isFinal) {
      onWin(1700 + selectedLevel * 200, nextStars, nextWords);
    } else {
      setupOrder(nextRound);
    }
  };

  const dropOnPan = async (piece: LearningItem) => {
    if (isResolving.current || !order.length) return;
    const need = order[stepIdx];
    if (!need || need.done) return;

    if (piece.id === need.item.id) {
      sounds.sfxPop(1.15);
      sounds.hapticSuccess();
      setPanHot(true);
      setTimeout(() => setPanHot(false), 300);
      const nextOrder = order.map((s, i) => (i === stepIdx ? { ...s, done: true } : s));
      setOrder(nextOrder);
      setTray((t) => t.filter((x) => x.id !== piece.id));
      setDragging(null);
      setDragPos(null);
      const nextStep = stepIdx + 1;
      setStepIdx(nextStep);
      await sounds.speakAsync(piece.audioText || piece.es, piece.audioLang || 'es-ES', true);
      if (nextStep >= nextOrder.length) {
        await completeRound();
      }
    } else {
      setChefMood('oops');
      sounds.sfxError();
      sounds.hapticError();
      if (onMarkWordMissed) onMarkWordMissed(need.item.id);
      await sounds.speakAsync(`¡No! Primero ${need.item.es}`, 'es-ES', true);
      setChefMood('wait');
      setDragging(null);
      setDragPos(null);
    }
  };

  const onPieceDown = (item: LearningItem) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    sounds.sfxPop(1.05);
    setDragging(item);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const onUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    const pan = panRef.current;
    if (pan) {
      const r = pan.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        void dropOnPan(dragging);
        return;
      }
    }
    setDragging(null);
    setDragPos(null);
  };

  const currentNeed = order[stepIdx];

  return (
    <div
      className="w-full h-full flex flex-col p-2 gap-2 select-none touch-none overflow-hidden bg-gradient-to-b from-orange-100 via-amber-50 to-rose-100"
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => {
        setDragging(null);
        setDragPos(null);
      }}
    >
      {/* Chef order — compact */}
      <div className="shrink-0 bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 shadow-xl border-b-6 border-orange-200 flex items-center gap-2">
        <div className="text-4xl sm:text-5xl shrink-0">{chefMood === 'happy' ? '🤩' : chefMood === 'oops' ? '😤' : '👨‍🍳'}</div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase text-orange-500">Pedido {roundIdx + 1}/{totalRounds} · comida real</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {order.map((s, i) => (
              <span
                key={s.item.id}
                className={`px-1.5 py-0.5 rounded-lg text-[11px] sm:text-xs font-black border-2 ${
                  s.done
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                    : i === stepIdx
                      ? 'bg-amber-200 border-amber-500 text-slate-900 ring-2 ring-amber-400'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {s.item.emoji} {s.item.es}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="p-2.5 rounded-2xl bg-orange-500 text-white shadow shrink-0"
          onClick={() =>
            currentNeed &&
            void sounds.speakAsync(currentNeed.item.audioText || currentNeed.item.es, currentNeed.item.audioLang || 'es-ES', true)
          }
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      {roundIdx === 0 && stepIdx === 0 && (
        <div className="flex justify-center">
          <TutorialHint text="Arrastra al sartén en el orden del pedido" gesture="drag" />
        </div>
      )}
      {praiseBanner && (
        <div className="text-center font-black text-sm bg-yellow-400 rounded-full px-4 py-1.5 animate-bounce">
          {praiseBanner}
        </div>
      )}

      {/* Pan drop zone — not oversized on phones */}
      <div className="flex-1 flex items-center justify-center min-h-0 py-1">
        <div
          ref={panRef}
          className={`relative w-[70%] max-w-[240px] aspect-square max-h-[min(42vh,240px)] rounded-full border-[6px] border-slate-700 bg-gradient-to-b from-slate-500 to-slate-800 shadow-2xl flex flex-col items-center justify-center transition-transform ${
            panHot ? 'scale-105 ring-4 ring-orange-400' : ''
          }`}
        >
          <div className="text-5xl sm:text-6xl">{panHot ? '🔥' : '🍳'}</div>
          <div className="text-white font-black text-sm sm:text-base mt-1 px-2 text-center">
            {currentNeed ? `Echa: ${currentNeed.item.emoji} ${currentNeed.item.es}` : '¡Listo!'}
          </div>
          <div className="flex gap-1 mt-1.5 min-h-[28px]">
            {order.filter((s) => s.done).map((s) => (
              <span key={s.item.id} className="text-xl sm:text-2xl">{s.item.emoji}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Ingredient tray */}
      <div className="shrink-0 bg-white/95 rounded-3xl p-3 shadow-xl border-2 border-orange-100">
        <div className="text-[10px] font-black uppercase text-orange-400 text-center mb-2">Ingredientes</div>
        <div className="flex flex-wrap justify-center gap-2">
          {tray.map((item) => (
            <button
              key={item.id}
              type="button"
              onPointerDown={onPieceDown(item)}
              className={`w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-white flex flex-col items-center justify-center shadow-lg border-b-4 border-orange-800 ${
                dragging?.id === item.id ? 'opacity-30' : ''
              }`}
            >
              <span className="text-3xl leading-none">{item.emoji}</span>
              <span className="text-[9px] font-black truncate max-w-[90%]">{item.es}</span>
            </button>
          ))}
        </div>
      </div>

      {dragging && dragPos && (
        <div
          className="fixed z-[200] pointer-events-none -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-white flex flex-col items-center justify-center shadow-2xl border-b-4 border-orange-800 scale-110"
          style={{ left: dragPos.x, top: dragPos.y }}
        >
          <span className="text-3xl">{dragging.emoji}</span>
          <span className="text-[10px] font-black">{dragging.es}</span>
        </div>
      )}
    </div>
  );
};
