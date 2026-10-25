import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PlayerConfig } from '../../types/game';
import { LearningItem, selectAdaptiveItems, getPersonalizedPraise } from '../../data/learningData';
import { sounds } from '../../audio/soundManager';
import confetti from 'canvas-confetti';
import { Volume2, Camera, Sparkles } from 'lucide-react';

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

interface SafariTarget {
  uid: string;
  item: LearningItem;
  spotName: string;
  snapped: 'none' | 'correct' | 'wrong';
}

const HIDING_SPOTS = ['🌿 Arbusto', '🌴 Palmera', '🪨 Roca', '🌊 Cascada', '🌺 Flores', '🪵 Tronco'];

export const SafariPhotoGame: React.FC<Props> = ({
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
  const [currentChallenge, setCurrentChallenge] = useState<LearningItem | null>(null);
  const [targets, setTargets] = useState<SafariTarget[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionUsedIds, setSessionUsedIds] = useState<string[]>([]);
  const [flashActive, setFlashActive] = useState(false);
  const [combo, setCombo] = useState(0);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);

  const starsRef = useRef(0);
  const wordsRef = useRef(0);
  const isTransitioningRef = useRef(false);

  const numTargets = useMemo(() => Math.min(3 + selectedLevel, 6), [selectedLevel]);
  const targetCorrect = useMemo(() => 3 + Math.min(Math.floor(selectedLevel / 2), 3), [selectedLevel]);

  const spawnSafariRound = useCallback(
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
      setCurrentChallenge(item);
      isTransitioningRef.current = false;

      const others = items.filter((i) => i.id !== item.id).sort(() => 0.5 - Math.random());
      const roundItems = [item, ...others.slice(0, numTargets - 1)].sort(() => 0.5 - Math.random());

      setTargets(
        roundItems.map((rItem, idx) => ({
          uid: `safari-${rItem.id}-${idx}-${Math.random()}`,
          item: rItem,
          spotName: HIDING_SPOTS[idx % HIDING_SPOTS.length],
          snapped: 'none',
        }))
      );

      sounds.speak(`Haz una foto a: ${item.es}`, 'es-ES');
    },
    [items, selectedLevel, numTargets, learnedWordIds, missedWordIds]
  );

  useEffect(() => {
    if (!currentChallenge) {
      spawnSafariRound([]);
    }
  }, [currentChallenge, spawnSafariRound]);

  const handleSnapClick = (target: SafariTarget) => {
    if (target.snapped !== 'none' || isTransitioningRef.current || !currentChallenge) return;

    sounds.sfxCameraClick();
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 180);

    // Speak the photographed item immediately
    sounds.speak(target.item.es, 'es-ES');

    if (target.item.id === currentChallenge.id) {
      isTransitioningRef.current = true;
      sounds.sfxMagic();

      const nextCombo = combo + 1;
      setCombo(nextCombo);

      setTargets((prev) =>
        prev.map((t) => (t.uid === target.uid ? { ...t, snapped: 'correct' } : t))
      );

      confetti({
        particleCount: 55,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#facc15', '#22c55e', '#38bdf8'],
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
          onWin(nextCorrect * 340 + nextCombo * 50, starsRef.current, wordsRef.current);
        }, 1600);
      } else {
        setTimeout(() => {
          setPraiseBanner(null);
          spawnSafariRound(nextUsed);
        }, 1600);
      }
    } else {
      sounds.sfxError();
      setCombo(0);
      if (onMarkWordMissed) {
        onMarkWordMissed(currentChallenge.id);
      }
      setTargets((prev) =>
        prev.map((t) => (t.uid === target.uid ? { ...t, snapped: 'wrong' } : t))
      );
      setTimeout(() => {
        setTargets((prev) =>
          prev.map((t) => (t.uid === target.uid ? { ...t, snapped: 'none' } : t))
        );
      }, 550);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between bg-gradient-to-b from-amber-200 via-emerald-100 to-lime-200 relative px-3 sm:px-4 pt-16 pb-20 overflow-hidden select-none">
      {/* Camera Flash Effect */}
      {flashActive && (
        <div className="fixed inset-0 z-50 bg-white/80 pointer-events-none transition-opacity duration-150" />
      )}

      {/* Top Safari Mission Card */}
      <div className="relative z-10 w-full max-w-md bg-white/95 rounded-[2rem] p-3.5 sm:p-4 shadow-xl border-b-8 border-orange-300 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-orange-100 border-2 border-orange-300 flex items-center justify-center text-3xl shrink-0">
            📸
          </div>
          <div className="text-left min-w-0">
            <div className="text-[11px] font-black text-orange-600 uppercase tracking-wider">
              Safari Niv. {selectedLevel} · Fotos: {correctCount}/{targetCorrect}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 uppercase truncate">
              {currentChallenge?.es}
            </div>
            <div className="text-xs font-bold text-slate-500 truncate">
              {currentChallenge?.subText || '¡Toca para fotografiar!'}
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            currentChallenge && sounds.speak(`Haz una foto a: ${currentChallenge.es}`, 'es-ES')
          }
          className="p-3.5 rounded-2xl bg-orange-500 text-white shadow-lg border-b-4 border-orange-700 btn-squishy shrink-0"
          aria-label="Escuchar misión"
        >
          <Volume2 className="w-6 h-6" />
        </button>
      </div>

      {praiseBanner && (
        <div className="z-20 px-5 py-1.5 bg-orange-500 text-white font-black text-sm sm:text-base rounded-full shadow-xl border-2 border-white animate-bounce">
          📸 {praiseBanner}
        </div>
      )}

      {combo >= 2 && !praiseBanner && (
        <div className="px-4 py-1 bg-orange-500 text-white font-black text-xs rounded-full shadow-md flex items-center gap-1 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" /> ¡FOTÓGRAFO PRO X{combo}!
        </div>
      )}

      {/* Polaroid Viewfinder Cards Grid */}
      <div className="w-full max-w-md my-auto grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 place-items-center">
        {targets.map((t) => (
          <button
            key={t.uid}
            onClick={() => handleSnapClick(t)}
            className={`relative w-30 sm:w-36 bg-white rounded-2xl p-2 pb-3.5 shadow-xl border-b-6 transition-all duration-300 flex flex-col items-center btn-squishy ${
              t.snapped === 'correct'
                ? 'border-emerald-500 bg-emerald-50 scale-110 -rotate-3 ring-4 ring-emerald-400'
                : t.snapped === 'wrong'
                ? 'border-red-400 bg-red-50 animate-shake'
                : 'border-slate-300 hover:border-orange-400'
            }`}
          >
            <div className="w-full aspect-square rounded-xl bg-gradient-to-b from-sky-100 to-emerald-100 border border-slate-200 flex items-center justify-center relative overflow-hidden mb-1.5">
              <span className="text-4xl sm:text-6xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                {t.item.emoji}
              </span>
              <div className="absolute top-1.5 right-1.5 bg-black/20 text-white rounded-full p-1">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-wider truncate max-w-full">
              {t.snapped === 'correct' ? `✅ ${t.item.es}` : t.spotName}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
