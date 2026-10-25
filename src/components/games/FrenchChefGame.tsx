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

interface DishPlate {
  uid: string;
  item: LearningItem;
  status: 'idle' | 'served' | 'wrong';
}

export const FrenchChefGame: React.FC<Props> = ({
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
  const [currentOrder, setCurrentOrder] = useState<LearningItem | null>(null);
  const [plates, setPlates] = useState<DishPlate[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionUsedIds, setSessionUsedIds] = useState<string[]>([]);
  const [chefMood, setChefMood] = useState<'waiting' | 'happy' | 'oops'>('waiting');
  const [showHint, setShowHint] = useState(false);
  const [combo, setCombo] = useState(0);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);

  const starsRef = useRef(0);
  const wordsRef = useRef(0);
  const isTransitioningRef = useRef(false);

  const numPlates = useMemo(() => Math.min(3 + selectedLevel, 6), [selectedLevel]);
  const targetCorrect = useMemo(() => 3 + Math.min(Math.floor(selectedLevel / 2), 3), [selectedLevel]);

  const nextOrder = useCallback(
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
      setCurrentOrder(item);
      setChefMood('waiting');
      setShowHint(selectedLevel === 1);
      isTransitioningRef.current = false;

      const others = items.filter((i) => i.id !== item.id).sort(() => 0.5 - Math.random());
      const menuItems = [item, ...others.slice(0, numPlates - 1)].sort(() => 0.5 - Math.random());

      setPlates(
        menuItems.map((mItem, idx) => ({
          uid: `plate-${mItem.id}-${idx}-${Math.random()}`,
          item: mItem,
          status: 'idle',
        }))
      );

      sounds.speak(item.audioText, item.audioLang);
    },
    [items, selectedLevel, numPlates, learnedWordIds, missedWordIds]
  );

  useEffect(() => {
    if (gameState === 'playing' && !currentOrder) {
      nextOrder([]);
    }
  }, [gameState, currentOrder, nextOrder]);

  const handlePlateClick = (plate: DishPlate) => {
    if (
      gameState !== 'playing' ||
      plate.status !== 'idle' ||
      isTransitioningRef.current ||
      !currentOrder
    ) {
      return;
    }

    if (plate.item.id === currentOrder.id) {
      isTransitioningRef.current = true;
      setChefMood('happy');
      sounds.sfxMagic();
      sounds.speak(currentOrder.audioText, currentOrder.audioLang);

      const nextCombo = combo + 1;
      setCombo(nextCombo);

      setPlates((prev) =>
        prev.map((p) => (p.uid === plate.uid ? { ...p, status: 'served' } : p))
      );

      confetti({
        particleCount: 55,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#3b82f6', '#ef4444', '#ffffff', '#fbbf24'],
      });

      const nextCorrect = correctCount + 1;
      const isFinalWin = nextCorrect >= targetCorrect;
      const praise = getPersonalizedPraise(player.name, isFinalWin);
      setPraiseBanner(praise);

      setTimeout(() => {
        sounds.speak(praise, 'es-ES', false);
      }, 650);

      const nextUsed = [...sessionUsedIds, currentOrder.id];
      starsRef.current += 2;
      wordsRef.current += 1;

      setCorrectCount(nextCorrect);
      setSessionUsedIds(nextUsed);
      setStarsCollected(starsRef.current);
      setWordsLearned(wordsRef.current);
      setProgressPercent(Math.round((nextCorrect / targetCorrect) * 100));
      onMarkWordLearned(currentOrder.id);

      if (isFinalWin) {
        setTimeout(() => {
          setPraiseBanner(null);
          setGameState('done');
          onWin(nextCorrect * 330 + nextCombo * 50, starsRef.current, wordsRef.current);
        }, 1600);
      } else {
        setTimeout(() => {
          setPraiseBanner(null);
          nextOrder(nextUsed);
        }, 1600);
      }
    } else {
      sounds.sfxError();
      sounds.speak(plate.item.es, 'es-ES');
      setChefMood('oops');
      setCombo(0);
      setShowHint(true);
      if (onMarkWordMissed) {
        onMarkWordMissed(currentOrder.id);
      }
      setPlates((prev) =>
        prev.map((p) => (p.uid === plate.uid ? { ...p, status: 'wrong' } : p))
      );
      setTimeout(() => {
        setChefMood('waiting');
        setPlates((prev) =>
          prev.map((p) => (p.uid === plate.uid ? { ...p, status: 'idle' } : p))
        );
      }, 550);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between bg-gradient-to-b from-blue-100 via-rose-50 to-amber-100 relative px-3 sm:px-4 pt-16 pb-20 overflow-hidden select-none">
      {/* Top Chef Order Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-[2rem] p-3.5 sm:p-4 shadow-xl border-b-8 border-blue-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-3xl sm:text-4xl shrink-0 transition-transform ${
              chefMood === 'happy'
                ? 'scale-125 rotate-12 bg-emerald-100'
                : chefMood === 'oops'
                ? 'animate-shake bg-red-100'
                : ''
            }`}
          >
            {chefMood === 'happy' ? '🤩' : chefMood === 'oops' ? '🙈' : '👨‍🍳'}
          </div>
          <div className="text-left min-w-0">
            <div className="text-[11px] font-black text-blue-600 uppercase tracking-wider">
              Francés Niv. {selectedLevel} · {correctCount}/{targetCorrect}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
              {currentOrder?.targetText}
            </div>
            <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 truncate">
              <span>{currentOrder?.subText}</span>
              {showHint && currentOrder && (
                <span className="text-blue-700 font-black">· ({currentOrder.es})</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!showHint && (
            <button
              onClick={() => {
                sounds.sfxPop();
                setShowHint(true);
              }}
              className="p-3 rounded-2xl bg-blue-50 text-blue-700 border-b-4 border-blue-200 btn-squishy"
              title="Ver traducción"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() =>
              currentOrder && sounds.speak(currentOrder.audioText, currentOrder.audioLang)
            }
            className="p-3.5 rounded-2xl bg-blue-600 text-white shadow-lg border-b-4 border-blue-800 btn-squishy"
            aria-label="Escuchar en francés"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {praiseBanner && (
        <div className="z-20 px-5 py-1.5 bg-blue-600 text-white font-black text-sm sm:text-base rounded-full shadow-xl border-2 border-white animate-bounce">
          🥐 {praiseBanner}
        </div>
      )}

      {combo >= 2 && !praiseBanner && (
        <div className="px-4 py-1 bg-rose-500 text-white font-black text-xs rounded-full shadow-md flex items-center gap-1 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" /> ¡CHEF ESTRELLA X{combo}!
        </div>
      )}

      {/* Parisian Serving Plates Grid */}
      <div className="w-full max-w-md my-auto grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 place-items-center">
        {plates.map((plate) => (
          <button
            key={plate.uid}
            onClick={() => handlePlateClick(plate)}
            className={`relative w-30 h-30 sm:w-36 sm:h-36 rounded-full bg-white shadow-xl border-8 flex flex-col items-center justify-center p-2.5 transition-all duration-300 btn-squishy ${
              plate.status === 'served'
                ? 'border-emerald-400 bg-emerald-50 -translate-y-4 scale-110'
                : plate.status === 'wrong'
                ? 'border-red-400 bg-red-50 animate-shake'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="w-full h-full rounded-full border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
              <span className="text-4xl sm:text-5xl mb-1">
                {plate.status === 'served' ? '🍽️✨' : plate.item.emoji}
              </span>
              <span className="text-[10px] sm:text-[11px] font-black text-slate-700 uppercase tracking-tight truncate max-w-[90%]">
                {plate.item.es}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
