import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PlayerConfig } from '../../types/game';
import { LearningItem, selectAdaptiveItems, getPersonalizedPraise } from '../../data/learningData';
import { sounds } from '../../audio/soundManager';
import confetti from 'canvas-confetti';
import { Volume2, HelpCircle, Sparkles } from 'lucide-react';

interface Props {
  player: PlayerConfig;
  items: LearningItem[];
  selectedLevel: number;
  learnedWordIds: string[];
  missedWordIds?: string[];
  onMarkWordLearned: (id: string) => void;
  onMarkWordMissed?: (id: string) => void;
  onWin: (score: number, stars: number, words: number) => void;
  setProgressPercent: React.Dispatch<React.SetStateAction<number>>;
  starsCollected: number;
  setStarsCollected: React.Dispatch<React.SetStateAction<number>>;
  wordsLearned: number;
  setWordsLearned: React.Dispatch<React.SetStateAction<number>>;
}

interface PotSlot {
  slotIndex: number;
  item: LearningItem | null;
  isUp: boolean;
  state: 'normal' | 'hit' | 'miss';
}

export const FlemishGardenGame: React.FC<Props> = ({
  player,
  items,
  selectedLevel = 1,
  learnedWordIds,
  missedWordIds = [],
  onMarkWordLearned,
  onMarkWordMissed,
  onWin,
  setProgressPercent,
  setStarsCollected,
  setWordsLearned,
}) => {
  const [gameState, setGameState] = useState<'playing' | 'done'>('playing');
  const [currentChallenge, setCurrentChallenge] = useState<LearningItem | null>(null);
  const [pots, setPots] = useState<PotSlot[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionUsedIds, setSessionUsedIds] = useState<string[]>([]);
  const [showSpanishHint, setShowSpanishHint] = useState(false);
  const [combo, setCombo] = useState(0);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);

  const starsRef = useRef(0);
  const wordsRef = useRef(0);
  const challengeRef = useRef<LearningItem | null>(null);
  const isTransitioningRef = useRef(false);

  const numPots = useMemo(() => (selectedLevel <= 1 ? 4 : selectedLevel <= 3 ? 6 : 9), [selectedLevel]);
  const targetCorrect = useMemo(() => 3 + Math.min(Math.floor(selectedLevel / 2), 3), [selectedLevel]);

  const pickNextChallenge = useCallback(
    (excludeIds: string[]) => {
      const available = items.filter((i) => !excludeIds.includes(i.id));
      const item = selectAdaptiveItems(
        available.length > 0 ? available : items,
        selectedLevel,
        learnedWordIds,
        missedWordIds,
        1
      )[0];

      if (!item) return;
      challengeRef.current = item;
      setCurrentChallenge(item);
      setShowSpanishHint(selectedLevel === 1);
      isTransitioningRef.current = false;

      const others = items.filter((i) => i.id !== item.id).sort(() => 0.5 - Math.random());
      const potItems: LearningItem[] = [item, ...others.slice(0, numPots - 1)].sort(
        () => 0.5 - Math.random()
      );

      setPots(
        potItems.map((potItem, idx) => ({
          slotIndex: idx,
          item: potItem,
          isUp: true,
          state: 'normal',
        }))
      );

      sounds.speak(item.audioText, item.audioLang);
    },
    [items, selectedLevel, numPots, learnedWordIds, missedWordIds]
  );

  useEffect(() => {
    if (gameState === 'playing' && !currentChallenge) {
      pickNextChallenge([]);
    }
  }, [gameState, currentChallenge, pickNextChallenge]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const cycleMs = Math.max(1600, 3000 - selectedLevel * 200);
    const interval = setInterval(() => {
      if (isTransitioningRef.current || !challengeRef.current) return;
      const target = challengeRef.current;

      const others = items.filter((i) => i.id !== target.id).sort(() => 0.5 - Math.random());
      const chosen = [target, ...others.slice(0, numPots - 1)].sort(() => 0.5 - Math.random());
      const targetSlotIndex = chosen.findIndex((i) => i.id === target.id);

      setPots(
        chosen.map((potItem, idx) => {
          const keepUp = idx === targetSlotIndex || Math.random() > 0.25;
          return {
            slotIndex: idx,
            item: potItem,
            isUp: keepUp,
            state: 'normal',
          };
        })
      );
      sounds.sfxPop(0.85);
    }, cycleMs);

    return () => clearInterval(interval);
  }, [gameState, items, numPots, selectedLevel]);

  const handlePotClick = (pot: PotSlot) => {
    if (
      gameState !== 'playing' ||
      !pot.isUp ||
      !pot.item ||
      isTransitioningRef.current ||
      !currentChallenge
    ) {
      return;
    }

    if (pot.item.id === currentChallenge.id) {
      isTransitioningRef.current = true;
      sounds.sfxSplash();
      sounds.sfxMagic();
      sounds.speak(currentChallenge.audioText, currentChallenge.audioLang);

      const nextCombo = combo + 1;
      setCombo(nextCombo);

      setPots((prev) =>
        prev.map((p) => (p.slotIndex === pot.slotIndex ? { ...p, state: 'hit' } : p))
      );

      confetti({
        particleCount: 50,
        spread: 65,
        origin: { y: 0.65 },
        colors: ['#eab308', '#22c55e', '#38bdf8'],
      });

      const nextCorrect = correctCount + 1;
      const isFinalWin = nextCorrect >= targetCorrect;
      const praise = getPersonalizedPraise(player.name, isFinalWin);
      setPraiseBanner(praise);

      setTimeout(() => {
        sounds.speak(praise, 'es-ES', false);
      }, 650);

      const nextUsed = [...sessionUsedIds, currentChallenge.id];
      starsRef.current += 2;
      wordsRef.current += 1;

      setCorrectCount(nextCorrect);
      setSessionUsedIds(nextUsed);
      setStarsCollected(starsRef.current);
      setWordsLearned(wordsRef.current);
      setProgressPercent(Math.round((nextCorrect / targetCorrect) * 100));
      onMarkWordLearned(currentChallenge.id);

      if (isFinalWin) {
        setTimeout(() => {
          setPraiseBanner(null);
          setGameState('done');
          onWin(nextCorrect * 320 + nextCombo * 50, starsRef.current, wordsRef.current);
        }, 1600);
      } else {
        setTimeout(() => {
          setPraiseBanner(null);
          pickNextChallenge(nextUsed);
        }, 1600);
      }
    } else {
      sounds.sfxError();
      sounds.speak(pot.item.es, 'es-ES');
      setCombo(0);
      setShowSpanishHint(true);
      if (onMarkWordMissed) {
        onMarkWordMissed(currentChallenge.id);
      }
      setPots((prev) =>
        prev.map((p) => (p.slotIndex === pot.slotIndex ? { ...p, state: 'miss' } : p))
      );
      setTimeout(() => {
        setPots((prev) =>
          prev.map((p) => (p.slotIndex === pot.slotIndex ? { ...p, state: 'normal', isUp: false } : p))
        );
      }, 450);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between bg-gradient-to-b from-amber-100 via-lime-100 to-emerald-200 relative px-3 sm:px-4 pt-16 pb-20 overflow-hidden select-none">
      {/* Top Garden Prompt Banner */}
      <div className="relative z-10 w-full max-w-md bg-white/95 rounded-[2rem] p-3.5 sm:p-4 shadow-xl border-b-8 border-amber-300 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-3xl shrink-0">
            🌻
          </div>
          <div className="text-left min-w-0">
            <div className="text-[11px] font-black text-amber-600 uppercase tracking-wider">
              Flamenco Niv. {selectedLevel} · {correctCount}/{targetCorrect}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
              {currentChallenge?.targetText}
            </div>
            <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 truncate">
              <span>{currentChallenge?.subText}</span>
              {showSpanishHint && currentChallenge && (
                <span className="text-emerald-700 font-black">· ({currentChallenge.es})</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!showSpanishHint && (
            <button
              onClick={() => {
                sounds.sfxPop();
                setShowSpanishHint(true);
              }}
              className="p-3 rounded-2xl bg-amber-100 text-amber-800 font-black text-xs border-b-4 border-amber-300 btn-squishy"
              title="Ver traducción"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() =>
              currentChallenge && sounds.speak(currentChallenge.audioText, currentChallenge.audioLang)
            }
            className="p-3.5 rounded-2xl bg-amber-500 text-white shadow-lg border-b-4 border-amber-700 btn-squishy"
            aria-label="Escuchar pronunciación"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {praiseBanner && (
        <div className="z-20 px-5 py-1.5 bg-emerald-500 text-white font-black text-sm sm:text-base rounded-full shadow-xl border-2 border-white animate-bounce">
          🌻 {praiseBanner}
        </div>
      )}

      {combo >= 2 && !praiseBanner && (
        <div className="px-4 py-1 bg-emerald-600 text-white font-black text-xs rounded-full shadow-md flex items-center gap-1 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" /> ¡SUPER JARDINERO X{combo}!
        </div>
      )}

      {/* Whack-a-Mole Flower Pots Grid */}
      <div
        className={`w-full max-w-md my-auto grid gap-2.5 sm:gap-4 ${
          numPots <= 4 ? 'grid-cols-2' : 'grid-cols-3'
        }`}
      >
        {pots.map((pot) => (
          <button
            key={pot.slotIndex}
            onClick={() => handlePotClick(pot)}
            className="relative h-28 sm:h-34 flex flex-col items-center justify-end group cursor-pointer select-none focus:outline-none"
          >
            <div
              className={`w-24 sm:w-28 rounded-3xl bg-white shadow-xl border-4 border-slate-200 px-2 py-1.5 flex flex-col items-center justify-center transition-all duration-300 ${
                pot.isUp
                  ? 'translate-y-2 opacity-100 scale-100'
                  : 'translate-y-14 opacity-0 scale-75 pointer-events-none'
              } ${
                pot.state === 'hit'
                  ? 'bg-emerald-100 border-emerald-500 scale-110 -translate-y-2'
                  : pot.state === 'miss'
                  ? 'bg-red-100 border-red-500 animate-shake'
                  : ''
              }`}
            >
              <span className="text-3xl sm:text-5xl leading-none mb-0.5">
                {pot.state === 'hit' ? '💦' : pot.item?.emoji}
              </span>
              <span className="text-[10px] sm:text-[11px] font-black text-slate-700 uppercase truncate w-full text-center">
                {pot.item?.es}
              </span>
            </div>

            <div className="relative z-10 w-26 sm:w-32 flex flex-col items-center">
              <div className="w-full h-3.5 bg-orange-600 rounded-full border-b-2 border-orange-800 shadow-md" />
              <div className="w-22 sm:w-28 h-7 bg-gradient-to-b from-orange-500 to-amber-700 rounded-b-2xl border-b-4 border-amber-900 shadow-lg flex items-center justify-center">
                <span className="text-xs opacity-60">🌿</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
