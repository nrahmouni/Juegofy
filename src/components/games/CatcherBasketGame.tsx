import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Sparkles, HelpCircle, MoveHorizontal } from 'lucide-react';
import { PlayerConfig } from '../../types/game';
import {
  LearningItem,
  selectAdaptiveItems,
  getPersonalizedPraise,
  SPANISH_VOCAB_ITEMS,
  FLEMISH_LEARNING_ITEMS,
  ARABIC_LEARNING_ITEMS,
  FRENCH_LEARNING_ITEMS,
} from '../../data/learningData';
import { sounds } from '../../audio/soundManager';

interface Props {
  player: PlayerConfig;
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

type LangFilter = 'es' | 'fl' | 'ar' | 'fr';

const LANG_POOLS: Record<LangFilter, { label: string; flag: string; items: LearningItem[] }> = {
  es: { label: 'Español', flag: '🇪🇸', items: SPANISH_VOCAB_ITEMS },
  fl: { label: 'Flamenco', flag: '🇧🇪', items: FLEMISH_LEARNING_ITEMS },
  ar: { label: 'Árabe', flag: '🇸🇦', items: ARABIC_LEARNING_ITEMS },
  fr: { label: 'Francés', flag: '🇫🇷', items: FRENCH_LEARNING_ITEMS },
};

export const CatcherBasketGame: React.FC<Props> = ({
  player,
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
  const totalRounds = Math.min(6, 3 + Math.floor(selectedLevel / 2));
  const laneCount = 3;

  const [langKey, setLangKey] = useState<LangFilter>('es');
  const [roundIdx, setRoundIdx] = useState(0);
  const [target, setTarget] = useState<LearningItem | null>(null);
  const [laneItems, setLaneItems] = useState<LearningItem[]>([]);
  const [basketXPercent, setBasketXPercent] = useState<number>(50);
  const [activeLane, setActiveLane] = useState<number>(1);
  const [caughtItemId, setCaughtItemId] = useState<string | null>(null);
  const [wrongItemId, setWrongItemId] = useState<string | null>(null);
  const [mistakesOnRound, setMistakesOnRound] = useState(0);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);

  // Also allow dragging a falling parachute directly into the basket
  const [draggedParachute, setDraggedParachute] = useState<LearningItem | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const isResolvingRef = useRef(false);
  const roundRef = useRef(0);
  const starsRef = useRef(0);
  const wordsRef = useRef(0);
  const usedIdsRef = useRef<Set<string>>(new Set());

  const setupRound = useCallback(
    (rIdx: number, activeLang: LangFilter) => {
      const pool = LANG_POOLS[activeLang].items;
      const available = pool.filter((i) => !usedIdsRef.current.has(i.id));
      const picked = selectAdaptiveItems(
        available.length > 0 ? available : pool,
        selectedLevel,
        learnedWordIds,
        missedWordIds,
        1
      )[0];

      if (!picked) return;
      usedIdsRef.current.add(picked.id);

      const distractors = pool
        .filter((i) => i.id !== picked.id)
        .sort((a, b) => Math.abs(a.level - selectedLevel) - Math.abs(b.level - selectedLevel) || Math.random() - 0.5)
        .slice(0, laneCount - 1);

      const roundChutes = [picked, ...distractors].sort(() => Math.random() - 0.5);

      roundRef.current = rIdx;
      isResolvingRef.current = false;
      setRoundIdx(rIdx);
      setTarget(picked);
      setLaneItems(roundChutes);
      setCaughtItemId(null);
      setWrongItemId(null);
      setMistakesOnRound(0);
      setDraggedParachute(null);
      setDragPos(null);

      void sounds.speakAsync(picked.audioText, picked.audioLang, true);
    },
    [selectedLevel, learnedWordIds, missedWordIds]
  );

  useEffect(() => {
    usedIdsRef.current.clear();
    setupRound(0, langKey);
  }, [langKey, setupRound]);

  const handleCatchItem = async (item: LearningItem, laneIdx: number) => {
    if (!target || isResolvingRef.current) return;

    const laneCenters = [16.66, 50, 83.33];
    setBasketXPercent(laneCenters[laneIdx] ?? 50);
    setActiveLane(laneIdx);

    if (item.id === target.id) {
      isResolvingRef.current = true;
      setCaughtItemId(item.id);
      sounds.sfxCatch();
      sounds.sfxMagic();
      onMarkWordLearned(target.id);

      const nextCombo = combo + 1;
      setCombo(nextCombo);

      confetti({
        particleCount: 60,
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#14b8a6', '#facc15', '#ec4899', '#38bdf8'],
      });

      const nextRound = roundRef.current + 1;
      const nextStars = starsRef.current + 3;
      const nextWords = wordsRef.current + 1;
      starsRef.current = nextStars;
      wordsRef.current = nextWords;

      setStarsCollected(nextStars);
      setWordsLearned(nextWords);
      setProgressPercent((nextRound / totalRounds) * 100);

      const isFinalWin = nextRound >= totalRounds;
      const praise = getPersonalizedPraise(player.name, isFinalWin);
      setPraiseBanner(praise);

      await sounds.speakSequence(
        [
          { text: item.audioText, lang: item.audioLang, pauseAfterMs: 120 },
          { text: praise, lang: 'es-ES', pauseAfterMs: 180 },
        ],
        true
      );

      setPraiseBanner(null);
      if (isFinalWin) {
        onWin(1680 + selectedLevel * 250 + nextCombo * 75, nextStars, nextWords);
      } else {
        setupRound(nextRound, langKey);
      }
    } else {
      sounds.sfxError();
      setCombo(0);
      setWrongItemId(item.id);
      setMistakesOnRound((m) => m + 1);
      if (onMarkWordMissed) {
        onMarkWordMissed(target.id);
      }
      void sounds.speakAsync(item.es, 'es-ES', true);
      setTimeout(() => {
        setWrongItemId(null);
      }, 600);
    }
  };

  // Dragging the skateboard/basket horizontally across the arena
  const updateBasketFromPointer = (clientX: number) => {
    if (!arenaRef.current || isResolvingRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const relX = Math.max(0.08, Math.min(0.92, (clientX - rect.left) / rect.width));
    setBasketXPercent(relX * 100);
    const computedLane = Math.min(2, Math.max(0, Math.floor(relX * 3)));
    setActiveLane(computedLane);
  };

  const handleArenaPointerMove = (e: React.PointerEvent) => {
    if (draggedParachute) {
      setDragPos({ x: e.clientX, y: e.clientY });
      updateBasketFromPointer(e.clientX);
      return;
    }
    if (e.buttons > 0 || e.pointerType === 'touch') {
      updateBasketFromPointer(e.clientX);
    }
  };

  const handleArenaPointerUp = () => {
    if (draggedParachute) {
      const item = draggedParachute;
      const laneIdx = laneItems.findIndex((i) => i.id === item.id);
      setDraggedParachute(null);
      setDragPos(null);
      void handleCatchItem(item, laneIdx >= 0 ? laneIdx : activeLane);
    }
  };

  if (!target) return null;

  const isReviewWord = missedWordIds.includes(target.id);
  const showSmartHint = mistakesOnRound >= 2;

  return (
    <div
      ref={arenaRef}
      onPointerMove={handleArenaPointerMove}
      onPointerUp={handleArenaPointerUp}
      className="w-full h-full flex flex-col items-center justify-between pt-16 pb-16 px-3 sm:px-6 bg-gradient-to-b from-sky-400 via-teal-600 to-emerald-900 relative overflow-hidden select-none touch-none"
    >
      {/* Language Switcher + Round Dots */}
      <div className="w-full max-w-xl flex items-center justify-between gap-1.5 z-10">
        <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md p-1 rounded-2xl border border-white/30">
          {(Object.keys(LANG_POOLS) as LangFilter[]).map((key) => {
            const active = langKey === key;
            return (
              <button
                key={key}
                onClick={() => {
                  sounds.sfxPop();
                  setLangKey(key);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                  active ? 'bg-yellow-400 text-slate-950 shadow-md scale-105' : 'text-white hover:bg-white/10'
                }`}
              >
                <span>{LANG_POOLS[key].flag}</span>
                <span className="hidden sm:inline">{LANG_POOLS[key].label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-2xl border border-white/30">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                i < roundIdx
                  ? 'bg-emerald-300 scale-110 shadow'
                  : i === roundIdx
                  ? 'bg-yellow-300 animate-pulse'
                  : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Mission Prompt Card */}
      <div className="w-full max-w-xl flex flex-col items-center z-10 my-1">
        <div className="w-full bg-white rounded-3xl p-3 sm:p-4 shadow-2xl border-b-8 border-teal-200 flex items-center justify-between gap-3">
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-black text-teal-600 uppercase tracking-wider flex items-center gap-1">
                <MoveHorizontal className="w-3.5 h-3.5" /> ¡Desliza tu Cesta o Arrastra el Paracaídas!
              </span>
              {isReviewWord && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-black uppercase flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Repaso Inteligente
                </span>
              )}
            </div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 leading-tight truncate">
              « {target.targetText} »
            </div>
            <div className="text-xs font-bold text-slate-500 truncate">
              {langKey === 'es'
                ? target.subText || `Categoría: ${target.category || 'Vocabulario'}`
                : `Significa: ${target.es}${target.subText ? ` · ${target.subText}` : ''}`}
            </div>
          </div>

          <button
            onClick={() => void sounds.speakAsync(target.audioText, target.audioLang, true)}
            className="p-3.5 rounded-2xl bg-teal-500 text-white shadow-lg border-b-4 border-teal-700 btn-squishy shrink-0"
            aria-label="Escuchar palabra objetivo"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>

        {showSmartHint && (
          <div className="mt-1.5 px-4 py-1 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 animate-bounce">
            <HelpCircle className="w-4 h-4" />
            <span>🦉 Profe Búho: ¡Mueve la cesta debajo de {target.emoji} ({target.es})!</span>
          </div>
        )}

        {praiseBanner && (
          <div className="mt-1.5 px-5 py-1.5 rounded-full bg-yellow-400 text-slate-950 font-black text-sm sm:text-base shadow-2xl border-2 border-white animate-bounce">
            🛹 {praiseBanner}
          </div>
        )}
      </div>

      {/* 3 Sky Chutes with Descending Parachute Treasures */}
      <div className="w-full max-w-2xl grid grid-cols-3 gap-2.5 sm:gap-4 my-auto z-10">
        {laneItems.map((item, laneIdx) => {
          const isCaught = caughtItemId === item.id;
          const isWrong = wrongItemId === item.id;
          const isAligned = activeLane === laneIdx;
          const isHinted = showSmartHint && item.id === target.id;

          return (
            <div key={item.id} className="flex flex-col items-center">
              {/* Parachute Canopy */}
              <div
                className={`text-3xl sm:text-4xl -mb-2 z-10 transition-transform duration-300 pointer-events-none ${
                  isCaught ? 'scale-0 opacity-0' : 'animate-float'
                }`}
                style={{ animationDelay: `${laneIdx * 180}ms` }}
              >
                🪂
              </div>

              {/* Draggable / Tappable Parachute Pod */}
              <div
                onPointerDown={(e) => {
                  if (isResolvingRef.current) return;
                  sounds.sfxPop(1.08);
                  setDraggedParachute(item);
                  setDragPos({ x: e.clientX, y: e.clientY });
                  updateBasketFromPointer(e.clientX);
                }}
                className={`w-full cursor-grab active:cursor-grabbing rounded-3xl p-3 sm:p-5 bg-white/95 border-b-8 shadow-2xl flex flex-col items-center justify-center transition-all duration-300 btn-squishy ${
                  isCaught
                    ? 'bg-emerald-100 border-emerald-500 translate-y-20 scale-75 opacity-0'
                    : isWrong
                    ? 'bg-rose-100 border-rose-500 animate-shake'
                    : isHinted
                    ? 'border-amber-400 ring-4 ring-amber-400 animate-bounce'
                    : isAligned
                    ? 'border-yellow-400 ring-4 ring-yellow-300/70 -translate-y-1'
                    : 'border-slate-200 hover:border-teal-400'
                }`}
              >
                <span className="text-4xl sm:text-6xl mb-1 pointer-events-none">{item.emoji}</span>
                <span className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight text-center leading-tight line-clamp-2 pointer-events-none">
                  {item.es}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Draggable Skateboard & Catcher Basket Track at Bottom */}
      <div
        onPointerDown={(e) => updateBasketFromPointer(e.clientX)}
        className="relative w-full max-w-2xl h-24 sm:h-28 bg-slate-950/45 rounded-[2.5rem] border-2 border-white/25 flex items-center overflow-hidden cursor-ew-resize z-20 shadow-inner"
      >
        <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-2 bg-white/15 rounded-full pointer-events-none" />

        {/* Player's Sliding Skateboard + Basket */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-150 flex flex-col items-center"
          style={{ left: `${basketXPercent}%` }}
        >
          <button
            onClick={() => {
              const currentItem = laneItems[activeLane];
              if (currentItem) {
                void handleCatchItem(currentItem, activeLane);
              }
            }}
            className="px-5 py-2 rounded-3xl bg-gradient-to-b from-yellow-300 to-amber-500 border-4 border-white shadow-2xl flex items-center gap-2 btn-squishy"
          >
            <span className="text-2xl sm:text-3xl">{player.fallbackEmoji}</span>
            <span className="text-2xl sm:text-3xl">🧺</span>
            <span className="text-xs font-black text-slate-950 uppercase hidden sm:inline">¡ATRAPAR!</span>
          </button>
          <div className="text-2xl -mt-1.5 drop-shadow">🛹💨</div>
        </div>
      </div>

      {/* Floating Parachute when dragged directly */}
      {draggedParachute && dragPos && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: dragPos.x, top: dragPos.y }}
        >
          <div className="w-20 h-20 rounded-full bg-white border-4 border-yellow-400 shadow-2xl flex items-center justify-center text-5xl animate-bounce">
            {draggedParachute.emoji}
          </div>
        </div>
      )}
    </div>
  );
};
