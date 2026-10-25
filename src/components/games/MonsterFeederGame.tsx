import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Sparkles, HelpCircle, Hand } from 'lucide-react';
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

export const MonsterFeederGame: React.FC<Props> = ({
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
  const optionsCount = Math.min(6, 3 + Math.floor(selectedLevel / 2));

  const [langKey, setLangKey] = useState<LangFilter>('es');
  const [roundIdx, setRoundIdx] = useState(0);
  const [target, setTarget] = useState<LearningItem | null>(null);
  const [snacks, setSnacks] = useState<LearningItem[]>([]);
  const [monsterState, setMonsterState] = useState<'hungry' | 'mouth_open' | 'eating' | 'yuck'>('hungry');
  const [flyingSnackId, setFlyingSnackId] = useState<string | null>(null);
  const [wrongSnackId, setWrongSnackId] = useState<string | null>(null);
  const [mistakesOnRound, setMistakesOnRound] = useState(0);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [scorePopup, setScorePopup] = useState<string | null>(null);

  // Interactive Drag & Fling state
  const [draggedSnack, setDraggedSnack] = useState<LearningItem | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const monsterRef = useRef<HTMLDivElement | null>(null);

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
        .slice(0, optionsCount - 1);

      const allSnacks = [picked, ...distractors].sort(() => Math.random() - 0.5);

      roundRef.current = rIdx;
      setRoundIdx(rIdx);
      setTarget(picked);
      setSnacks(allSnacks);
      setMonsterState('hungry');
      setFlyingSnackId(null);
      setWrongSnackId(null);
      setMistakesOnRound(0);
      setDraggedSnack(null);
      setDragPos(null);

      // Speak target and wait so the child hears the full word
      void (async () => {
        await new Promise((r) => setTimeout(r, 200));
        await sounds.speakAsync(picked.audioText, picked.audioLang, true);
      })();
    },
    [selectedLevel, learnedWordIds, missedWordIds, optionsCount]
  );

  useEffect(() => {
    usedIdsRef.current.clear();
    setupRound(0, langKey);
  }, [langKey, setupRound]);

  const evaluateSnackChoice = async (snack: LearningItem) => {
    if (!target || monsterState === 'eating') return;

    if (snack.id === target.id) {
      setFlyingSnackId(snack.id);
      setMonsterState('eating');
      sounds.sfxChomp();
      sounds.sfxMagic();
      sounds.hapticSuccess();
      onMarkWordLearned(target.id);

      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setScorePopup(`+${300 + nextCombo * 50} ¡ÑAM ÑAM!`);
      setTimeout(() => setScorePopup(null), 1100);

      confetti({
        particleCount: 50,
        spread: 65,
        origin: { y: 0.48 },
        colors: ['#ec4899', '#facc15', '#34d399', '#60a5fa'],
      });

      const nextRound = roundRef.current + 1;
      const nextStars = starsRef.current + 3;
      const nextWords = wordsRef.current + 1;
      starsRef.current = nextStars;
      wordsRef.current = nextWords;

      setStarsCollected(nextStars);
      setWordsLearned(nextWords);
      setProgressPercent((nextRound / totalRounds) * 100);

      const isFinal = nextRound >= totalRounds;
      const praise = getPersonalizedPraise(player.name, isFinal);
      setPraiseBanner(praise);

      // CRITICAL: wait until word + praise finish speaking before advancing
      await sounds.speakSequence(
        [
          { text: snack.audioText, lang: snack.audioLang, pauseAfterMs: 100 },
          { text: praise, lang: 'es-ES', pauseAfterMs: 150 },
        ],
        true
      );

      setPraiseBanner(null);
      if (isFinal) {
        onWin(1600 + selectedLevel * 250 + nextCombo * 80, nextStars, nextWords);
      } else {
        setupRound(nextRound, langKey);
      }
    } else {
      sounds.sfxError();
      sounds.hapticError();
      setCombo(0);
      setMonsterState('yuck');
      setWrongSnackId(snack.id);
      setMistakesOnRound((m) => m + 1);
      if (onMarkWordMissed) {
        onMarkWordMissed(target.id);
      }
      void sounds.speakAsync(snack.es || snack.audioText, 'es-ES', true);
      setTimeout(() => {
        setMonsterState('hungry');
        setWrongSnackId(null);
      }, 650);
    }
  };

  // Pointer drag handlers so kids can drag snacks into the monster's mouth OR tap to fling!
  const handlePointerDownSnack = (snack: LearningItem, e: React.PointerEvent) => {
    if (monsterState === 'eating') return;
    // Immediately speak the touched item aloud!
    sounds.sfxPop(1.1);
    void sounds.speakAsync(snack.audioText, snack.audioLang, true);

    setDraggedSnack(snack);
    setDragPos({ x: e.clientX, y: e.clientY });
    setMonsterState('mouth_open');
  };

  const handlePointerMoveContainer = (e: React.PointerEvent) => {
    if (!draggedSnack) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUpContainer = (e: React.PointerEvent) => {
    if (!draggedSnack) return;
    const snack = draggedSnack;
    setDraggedSnack(null);
    setDragPos(null);

    // Check if dropped near the monster or if user tapped/flung upward
    if (monsterRef.current) {
      const rect = monsterRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
      if (dist < Math.max(rect.width, 160)) {
        sounds.sfxWhoosh();
        evaluateSnackChoice(snack);
        return;
      }
    }
    // Even on quick tap, fling snack directly to the monster so both drag AND tap work seamlessly!
    sounds.sfxWhoosh();
    evaluateSnackChoice(snack);
  };

  if (!target) return null;

  const isReviewWord = missedWordIds.includes(target.id);
  const showSmartHint = mistakesOnRound >= 2;

  return (
    <div
      onPointerMove={handlePointerMoveContainer}
      onPointerUp={handlePointerUpContainer}
      className="w-full h-full flex flex-col items-center justify-between pt-16 pb-16 px-3 sm:px-6 bg-gradient-to-b from-fuchsia-950 via-purple-900 to-rose-950 relative overflow-hidden select-none touch-none"
    >
      {/* Language Switcher Pill Bar */}
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

        {/* Round Progress Dots */}
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

      {/* Monster Stage + Speech Bubble */}
      <div className="w-full max-w-xl flex flex-col items-center my-1 z-10">
        {/* Speech Bubble */}
        <div className="relative w-full bg-white rounded-3xl p-3 sm:p-4 shadow-2xl border-b-8 border-pink-200 flex items-center justify-between gap-3 mb-2">
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-black text-pink-600 uppercase tracking-wider flex items-center gap-1">
                <Hand className="w-3 h-3" /> ¡Arrastra o lanza a mi boca!
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
            className="p-3.5 rounded-2xl bg-pink-500 text-white shadow-lg border-b-4 border-pink-700 btn-squishy shrink-0"
            aria-label="Escuchar lo que pide el monstruo"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>

        {/* Profe Búho Smart Adaptive Hint after 2 mistakes */}
        {showSmartHint && (
          <div className="mb-1.5 px-4 py-1 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 animate-bounce">
            <HelpCircle className="w-4 h-4" />
            <span>🦉 Profe Búho: ¡Arrastra {target.emoji} ({target.es}) a la boca!</span>
          </div>
        )}

        {/* Personalized Praise Floating Banner */}
        {praiseBanner && (
          <div className="mb-1.5 px-5 py-1.5 rounded-full bg-emerald-400 text-slate-950 font-black text-sm sm:text-base shadow-2xl border-2 border-white animate-bounce">
            🌟 {praiseBanner}
          </div>
        )}

        {/* Animated Hungry Monster Drop Zone */}
        <div
          ref={monsterRef}
          className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-[2.8rem] flex flex-col items-center justify-center shadow-2xl border-4 transition-all duration-300 ${
            monsterState === 'eating'
              ? 'bg-emerald-500 border-emerald-200 scale-115 rotate-3 ring-8 ring-emerald-400/50'
              : monsterState === 'mouth_open'
              ? 'bg-pink-500 border-yellow-300 scale-110 ring-8 ring-yellow-300/40'
              : monsterState === 'yuck'
              ? 'bg-rose-500 border-rose-300 animate-shake'
              : 'bg-gradient-to-b from-pink-500 to-purple-600 border-pink-300 animate-float'
          }`}
        >
          {/* Floating Score Popup */}
          {scorePopup && (
            <div className="absolute -top-9 px-3 py-1 rounded-full bg-yellow-400 text-slate-950 font-black text-xs shadow-xl animate-bounce whitespace-nowrap">
              {scorePopup}
            </div>
          )}

          {/* Monster Horns & Eyes */}
          <div className="absolute -top-4 inset-x-6 flex justify-between text-2xl pointer-events-none">
            <span>🦄</span>
            <span>👑</span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-inner">
              <div
                className={`w-3.5 h-3.5 rounded-full bg-slate-950 transition-transform ${
                  monsterState === 'mouth_open' ? 'scale-125 translate-y-0.5' : ''
                }`}
              />
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-inner">
              <div
                className={`w-3.5 h-3.5 rounded-full bg-slate-950 transition-transform ${
                  monsterState === 'mouth_open' ? 'scale-125 translate-y-0.5' : ''
                }`}
              />
            </div>
          </div>

          {/* Monster Mouth */}
          <div
            className={`w-18 sm:w-22 rounded-b-3xl bg-slate-950 border-t-4 border-white flex items-center justify-center transition-all duration-200 ${
              monsterState === 'eating' || monsterState === 'mouth_open'
                ? 'h-14 sm:h-16 scale-110'
                : monsterState === 'yuck'
                ? 'h-4 rounded-full'
                : 'h-9 sm:h-11'
            }`}
          >
            {monsterState === 'eating' ? (
              <span className="text-3xl animate-ping">{target.emoji}</span>
            ) : monsterState === 'mouth_open' ? (
              <span className="text-xs font-black text-yellow-300 uppercase animate-pulse">¡AQUÍ! 😮</span>
            ) : monsterState === 'yuck' ? (
              <span className="text-xs font-black text-rose-300">¡PUAJ!</span>
            ) : (
              <span className="text-lg">👅</span>
            )}
          </div>
        </div>
      </div>

      {/* Snack Tray (Draggable & Tappable Food/Word Cards) */}
      <div className="w-full max-w-2xl grid grid-cols-3 gap-2 sm:gap-3.5 z-10">
        {snacks.map((snack) => {
          const isFlying = flyingSnackId === snack.id;
          const isBeingDragged = draggedSnack?.id === snack.id;
          const isWrong = wrongSnackId === snack.id;
          const isHinted = showSmartHint && snack.id === target.id;
          return (
            <div
              key={snack.id}
              onPointerDown={(e) => handlePointerDownSnack(snack, e)}
              className={`relative cursor-grab active:cursor-grabbing rounded-3xl p-2.5 sm:p-4 bg-white border-b-8 shadow-xl flex flex-col items-center justify-center transition-all btn-squishy ${
                isFlying
                  ? 'bg-emerald-100 border-emerald-500 scale-50 -translate-y-24 opacity-0 duration-500'
                  : isBeingDragged
                  ? 'opacity-40 scale-95 border-pink-400'
                  : isWrong
                  ? 'bg-rose-100 border-rose-500 animate-shake'
                  : isHinted
                  ? 'border-amber-400 ring-4 ring-amber-400 animate-bounce'
                  : 'border-slate-200 hover:border-pink-400'
              }`}
            >
              <span className="text-3xl sm:text-5xl mb-1 drop-shadow-sm pointer-events-none">{snack.emoji}</span>
              <span className="text-[11px] sm:text-sm font-black text-slate-800 uppercase tracking-tight text-center leading-tight line-clamp-2 pointer-events-none">
                {snack.es}
              </span>
            </div>
          );
        })}
      </div>

      {/* Floating Dragged Snack Following Finger/Cursor */}
      {draggedSnack && dragPos && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: dragPos.x, top: dragPos.y }}
        >
          <div className="w-20 h-20 rounded-full bg-white/95 border-4 border-yellow-400 shadow-2xl flex items-center justify-center text-5xl animate-bounce">
            {draggedSnack.emoji}
          </div>
          <span className="mt-1 px-3 py-0.5 rounded-full bg-slate-900 text-white font-black text-xs uppercase shadow-lg">
            {draggedSnack.es}
          </span>
        </div>
      )}
    </div>
  );
};
