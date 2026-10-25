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

interface FloatingBubble {
  uid: string;
  item: LearningItem;
  lane: number;
  delay: number;
  colorClass: string;
  popped: 'none' | 'correct' | 'wrong';
}

const BUBBLE_STYLES = [
  'from-cyan-300/90 to-blue-500/90 border-cyan-200',
  'from-pink-300/90 to-rose-500/90 border-pink-200',
  'from-amber-300/90 to-orange-500/90 border-amber-200',
  'from-emerald-300/90 to-teal-500/90 border-emerald-200',
  'from-violet-300/90 to-purple-500/90 border-violet-200',
  'from-fuchsia-300/90 to-pink-600/90 border-fuchsia-200',
];

export const ArabicBubbleGame: React.FC<Props> = ({
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
  const [bubbles, setBubbles] = useState<FloatingBubble[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionUsedIds, setSessionUsedIds] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [combo, setCombo] = useState(0);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);

  const starsRef = useRef(0);
  const wordsRef = useRef(0);
  const isTransitioningRef = useRef(false);

  const numBubbles = useMemo(() => Math.min(3 + selectedLevel, 6), [selectedLevel]);
  const targetCorrect = useMemo(() => 3 + Math.min(Math.floor(selectedLevel / 2), 3), [selectedLevel]);

  const spawnRound = useCallback(
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
      setShowHint(selectedLevel === 1);
      isTransitioningRef.current = false;

      const others = items.filter((i) => i.id !== item.id).sort(() => 0.5 - Math.random());
      const roundItems = [item, ...others.slice(0, numBubbles - 1)].sort(() => 0.5 - Math.random());
      const shuffledStyles = [...BUBBLE_STYLES].sort(() => 0.5 - Math.random());

      setBubbles(
        roundItems.map((bItem, idx) => ({
          uid: `bub-${bItem.id}-${idx}-${Math.random()}`,
          item: bItem,
          lane: idx,
          delay: (idx % 3) * 0.2,
          colorClass: shuffledStyles[idx % shuffledStyles.length],
          popped: 'none',
        }))
      );

      sounds.speak(item.audioText, item.audioLang);
    },
    [items, selectedLevel, numBubbles, learnedWordIds, missedWordIds]
  );

  useEffect(() => {
    if (gameState === 'playing' && !currentChallenge) {
      spawnRound([]);
    }
  }, [gameState, currentChallenge, spawnRound]);

  const handleBubbleClick = (bubble: FloatingBubble) => {
    if (
      gameState !== 'playing' ||
      bubble.popped !== 'none' ||
      isTransitioningRef.current ||
      !currentChallenge
    ) {
      return;
    }

    if (bubble.item.id === currentChallenge.id) {
      isTransitioningRef.current = true;
      sounds.sfxBubblePop();
      sounds.sfxMagic();
      sounds.hapticSuccess();

      const nextCombo = combo + 1;
      setCombo(nextCombo);

      setBubbles((prev) =>
        prev.map((b) => (b.uid === bubble.uid ? { ...b, popped: 'correct' } : b))
      );

      confetti({
        particleCount: 55,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#fbbf24', '#38bdf8', '#f472b6'],
      });

      const nextCorrect = correctCount + 1;
      const isFinalWin = nextCorrect >= targetCorrect;
      const praise = getPersonalizedPraise(player.name, isFinalWin);
      setPraiseBanner(praise);

      const nextUsed = [...sessionUsedIds, currentChallenge.id];
      starsRef.current += 2;
      wordsRef.current += 1;

      setCorrectCount(nextCorrect);
      setSessionUsedIds(nextUsed);
      setStarsCollected(starsRef.current);
      setWordsLearned(wordsRef.current);
      setProgressPercent(Math.round((nextCorrect / targetCorrect) * 100));
      onMarkWordLearned(currentChallenge.id);

      void (async () => {
        await sounds.speakSequence(
          [
            { text: currentChallenge.audioText, lang: currentChallenge.audioLang, pauseAfterMs: 100 },
            { text: praise, lang: 'es-ES', pauseAfterMs: 150 },
          ],
          true
        );
        setPraiseBanner(null);
        if (isFinalWin) {
          setGameState('done');
          onWin(nextCorrect * 330 + nextCombo * 50, starsRef.current, wordsRef.current);
        } else {
          spawnRound(nextUsed);
        }
      })();
    } else {
      sounds.sfxError();
      sounds.hapticError();
      void sounds.speakAsync(bubble.item.es, 'es-ES', true);
      setCombo(0);
      setShowHint(true);
      if (onMarkWordMissed) {
        onMarkWordMissed(currentChallenge.id);
      }
      setBubbles((prev) =>
        prev.map((b) => (b.uid === bubble.uid ? { ...b, popped: 'wrong' } : b))
      );
      setTimeout(() => {
        setBubbles((prev) =>
          prev.map((b) => (b.uid === bubble.uid ? { ...b, popped: 'none' } : b))
        );
      }, 500);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between bg-gradient-to-b from-emerald-950 via-teal-900 to-slate-900 relative px-3 sm:px-4 pt-16 pb-20 overflow-hidden select-none">
      {/* Desert Night Stars */}
      <div className="absolute top-28 left-8 text-xl opacity-40 animate-pulse pointer-events-none">✨</div>
      <div className="absolute top-40 right-10 text-2xl opacity-40 animate-pulse pointer-events-none">🌙</div>

      {/* Top Genie Challenge Banner */}
      <div className="relative z-10 w-full max-w-md bg-white/95 rounded-[2rem] p-3.5 sm:p-4 shadow-2xl border-b-8 border-emerald-300 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-3xl shrink-0">
            🧞
          </div>
          <div className="text-left min-w-0">
            <div className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">
              Árabe Niv. {selectedLevel} · {correctCount}/{targetCorrect}
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {currentChallenge?.targetText}
              </span>
              <span className="text-xs font-black text-emerald-700">
                ({currentChallenge?.subText})
              </span>
            </div>
            {showHint && currentChallenge && (
              <div className="text-xs font-black text-amber-600 mt-0.5 truncate">
                Significado: {currentChallenge.es}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!showHint && (
            <button
              onClick={() => {
                sounds.sfxPop();
                setShowHint(true);
              }}
              className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 border-b-4 border-emerald-300 btn-squishy"
              title="Pedir deseo de pista"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() =>
              currentChallenge && sounds.speak(currentChallenge.audioText, currentChallenge.audioLang)
            }
            className="p-3.5 rounded-2xl bg-emerald-500 text-white shadow-lg border-b-4 border-emerald-700 btn-squishy"
            aria-label="Escuchar en árabe"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {praiseBanner && (
        <div className="z-20 px-5 py-1.5 bg-amber-400 text-slate-950 font-black text-sm sm:text-base rounded-full shadow-xl border-2 border-white animate-bounce">
          🧞 {praiseBanner}
        </div>
      )}

      {combo >= 2 && !praiseBanner && (
        <div className="px-4 py-1 bg-amber-400 text-amber-950 font-black text-xs rounded-full shadow-md flex items-center gap-1 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" /> ¡MAGIA X{combo}!
        </div>
      )}

      {/* Floating Iridescent Bubbles Arena */}
      <div className="w-full max-w-md my-auto grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4 place-items-center">
        {bubbles.map((b, idx) => (
          <button
            key={b.uid}
            onClick={() => handleBubbleClick(b)}
            style={{ animationDelay: `${idx * 180}ms` }}
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br ${b.colorClass} border-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center p-2.5 animate-float transition-all duration-300 btn-squishy ${
              b.popped === 'correct'
                ? 'scale-125 bg-emerald-400 border-white ring-8 ring-white/50'
                : b.popped === 'wrong'
                ? 'animate-shake ring-4 ring-red-500 opacity-60'
                : ''
            }`}
          >
            <div className="absolute top-3 left-5 w-5 h-2.5 bg-white/60 rounded-full -rotate-45 pointer-events-none" />
            <span className="text-4xl sm:text-5xl drop-shadow-md mb-1">
              {b.popped === 'correct' ? '✨' : b.item.emoji}
            </span>
            <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-tight drop-shadow px-2 py-0.5 bg-black/25 rounded-full truncate max-w-full">
              {b.item.es}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
