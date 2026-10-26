import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Sparkles, HelpCircle, Hand } from 'lucide-react';
import { PlayerConfig } from '../../types/game';
import type { PracticeLang } from '../../types/game';
import {
  LearningItem,
  SPANISH_VOCAB_ITEMS,
  FLEMISH_LEARNING_ITEMS,
  ARABIC_LEARNING_ITEMS,
  FRENCH_LEARNING_ITEMS,
} from '../../data/learningData';
import { sounds } from '../../audio/soundManager';
import { useAdaptiveRound } from '../../hooks/useAdaptiveRound';

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

type LangFilter = 'es' | 'fl' | 'ar' | 'fr';

const LANG_POOLS: Record<LangFilter, { label: string; flag: string; items: LearningItem[] }> = {
  es: { label: 'Español', flag: '🇪🇸', items: SPANISH_VOCAB_ITEMS },
  fl: { label: 'Flamenco', flag: '🇧🇪', items: FLEMISH_LEARNING_ITEMS },
  ar: { label: 'Árabe', flag: '🇸🇦', items: ARABIC_LEARNING_ITEMS },
  fr: { label: 'Francés', flag: '🇫🇷', items: FRENCH_LEARNING_ITEMS },
};

/**
 * Empareja Mágico — drag the word card onto the matching emoji slot.
 * Audio is fully awaited before the next round starts.
 */
export const DragMatchGame: React.FC<Props> = ({
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
  const totalRounds = Math.min(6, 3 + Math.floor(selectedLevel / 2));
  const optionsCount = Math.min(4, 3 + Math.floor(selectedLevel / 4));

  const [langKey, setLangKey] = useState<LangFilter>((practiceLang as LangFilter) || 'es');
  useEffect(() => {
    if (practiceLang) setLangKey(practiceLang as LangFilter);
  }, [practiceLang]);
  const [dragged, setDragged] = useState<LearningItem | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [matchedId, setMatchedId] = useState<string | null>(null);
  const [wrongSlotId, setWrongSlotId] = useState<string | null>(null);
  const [slotOrder, setSlotOrder] = useState<LearningItem[]>([]);

  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const {
    roundIdx,
    target,
    options,
    praiseBanner,
    isResolving,
    setupRound,
    resetCampaign,
    handleCorrect,
    handleWrong,
    showSmartHint,
    isReviewWord,
  } = useAdaptiveRound({
    pool: LANG_POOLS[langKey].items,
    selectedLevel,
    learnedWordIds,
    missedWordIds,
    optionsCount,
    totalRounds,
    playerName: player.name,
    onMarkWordLearned,
    onMarkWordMissed,
    onWin,
    setProgressPercent,
    setStarsCollected,
    setWordsLearned,
    winScoreBase: 1650,
  });

  // Start / restart when language changes
  useEffect(() => {
    resetCampaign();
    void setupRound(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langKey]);

  // Shuffle visual slots whenever options change
  useEffect(() => {
    if (options.length) {
      setSlotOrder([...options].sort(() => Math.random() - 0.5));
      setMatchedId(null);
      setWrongSlotId(null);
      setDragged(null);
      setDragPos(null);
    }
  }, [options]);

  const onPointerDownCard = (item: LearningItem, e: React.PointerEvent) => {
    if (isResolving || matchedId) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    sounds.sfxPop(1.1);
    void sounds.speakAsync(item.audioText, item.audioLang, true);
    setDragged(item);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragged) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const onPointerUp = async (e: React.PointerEvent) => {
    if (!dragged || !target) return;
    const item = dragged;
    setDragged(null);
    setDragPos(null);

    // Hit-test against emoji slots
    let hitIdx = -1;
    slotRefs.current.forEach((el, idx) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (
        e.clientX >= r.left - 8 &&
        e.clientX <= r.right + 8 &&
        e.clientY >= r.top - 8 &&
        e.clientY <= r.bottom + 8
      ) {
        hitIdx = idx;
      }
    });

    if (hitIdx < 0) return;

    const slotItem = slotOrder[hitIdx];
    if (!slotItem) return;

    // Correct only if the dragged card matches the TARGET and lands on the target's emoji
    if (item.id === target.id && slotItem.id === target.id) {
      setMatchedId(target.id);
      sounds.sfxCatch();
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.45 },
        colors: ['#a855f7', '#facc15', '#34d399', '#f472b6'],
      });
      await handleCorrect(item);
    } else {
      setWrongSlotId(slotItem.id);
      await handleWrong(item);
      setTimeout(() => setWrongSlotId(null), 500);
    }
  };

  if (!target) return null;

  // Word cards = options that are not yet matched
  const cards = options.filter((o) => o.id !== matchedId);

  return (
    <div
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="w-full h-full flex flex-col items-center justify-between pt-16 pb-16 px-3 sm:px-6 bg-gradient-to-b from-violet-950 via-fuchsia-900 to-purple-950 relative overflow-hidden select-none touch-none"
    >
      {/* Lang + progress */}
      <div className="w-full max-w-xl flex items-center justify-between gap-1.5 z-10">
        <div className="flex items-center gap-1 bg-white/15 backdrop-blur-md p-1 rounded-2xl border border-white/20">
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
                  active ? 'bg-yellow-400 text-slate-950 shadow-md scale-105' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span>{LANG_POOLS[key].flag}</span>
                <span className="hidden sm:inline">{LANG_POOLS[key].label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-2xl border border-white/20">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                i < roundIdx
                  ? 'bg-emerald-400 scale-110 shadow'
                  : i === roundIdx
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-white/25'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Mission card */}
      <div className="w-full max-w-xl flex flex-col items-center z-10 my-1">
        <div className="w-full bg-white rounded-3xl p-3 sm:p-4 shadow-2xl border-b-8 border-violet-200 flex items-center justify-between gap-3">
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-black text-violet-600 uppercase tracking-wider flex items-center gap-1">
                <Hand className="w-3 h-3" /> ¡Arrastra la palabra al dibujo!
              </span>
              {isReviewWord && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-black uppercase flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Repaso
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
            className="p-3.5 rounded-2xl bg-violet-500 text-white shadow-lg border-b-4 border-violet-700 btn-squishy shrink-0"
            aria-label="Escuchar"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>

        {showSmartHint && (
          <div className="mt-1.5 px-4 py-1 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 animate-bounce">
            <HelpCircle className="w-4 h-4" />
            <span>🦉 ¡Arrastra «{target.targetText}» hasta {target.emoji}!</span>
          </div>
        )}

        {praiseBanner && (
          <div className="mt-1.5 px-5 py-1.5 rounded-full bg-emerald-400 text-slate-950 font-black text-sm sm:text-base shadow-2xl border-2 border-white animate-bounce">
            🌟 {praiseBanner}
          </div>
        )}
      </div>

      {/* Emoji drop slots — compact for mobile so word cards stay visible */}
      <div className="w-full max-w-xl grid grid-cols-3 gap-2 my-1 z-10 px-1">
        {slotOrder.map((item, idx) => {
          const isMatched = matchedId === item.id;
          const isWrong = wrongSlotId === item.id;
          const isHint = showSmartHint && item.id === target.id;
          return (
            <div
              key={item.id}
              ref={(el) => {
                slotRefs.current[idx] = el;
              }}
              className={`relative aspect-square max-h-[22vh] rounded-2xl flex flex-col items-center justify-center shadow-lg border-4 transition-all duration-200 ${
                isMatched
                  ? 'bg-emerald-400 border-emerald-200 scale-105 ring-4 ring-emerald-300/60'
                  : isWrong
                  ? 'bg-rose-400 border-rose-200 animate-shake'
                  : isHint
                  ? 'bg-amber-200 border-amber-400 ring-4 ring-amber-300/50 animate-pulse'
                  : 'bg-white/90 border-violet-200'
              }`}
            >
              <span className="text-3xl sm:text-4xl drop-shadow">{item.emoji}</span>
              {isMatched && <span className="absolute top-0.5 right-0.5 text-sm">✅</span>}
            </div>
          );
        })}
      </div>

      {/* Draggable word cards — always above footer */}
      <div className="w-full max-w-xl flex flex-wrap items-center justify-center gap-2 z-10 pb-16 shrink-0">
        {cards.map((item) => {
          const isDragging = dragged?.id === item.id;
          return (
            <button
              key={item.id}
              onPointerDown={(e) => onPointerDownCard(item, e)}
              className={`px-4 py-3 rounded-2xl bg-gradient-to-b from-fuchsia-400 to-violet-600 text-white font-black text-base sm:text-lg shadow-xl border-b-4 border-violet-800 btn-squishy transition-opacity ${
                isDragging ? 'opacity-40 scale-95' : ''
              }`}
              style={{ touchAction: 'none' }}
            >
              {item.targetText}
            </button>
          );
        })}
      </div>

      {/* Floating dragged card */}
      {dragged && dragPos && (
        <div
          className="fixed z-50 pointer-events-none px-4 py-3 rounded-2xl bg-gradient-to-b from-fuchsia-400 to-violet-600 text-white font-black text-lg shadow-2xl border-2 border-white scale-110"
          style={{
            left: dragPos.x,
            top: dragPos.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {dragged.targetText}
        </div>
      )}
    </div>
  );
};
