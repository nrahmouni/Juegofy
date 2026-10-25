import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PlayerConfig } from '../../types/game';
import { LearningItem, selectAdaptiveItems, getPersonalizedPraise } from '../../data/learningData';
import { sounds } from '../../audio/soundManager';
import confetti from 'canvas-confetti';
import { Sparkles } from 'lucide-react';

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
  title: string;
  instruction: string;
  gameColor: string;
}

interface MemoryCard {
  uid: string;
  pairId: string;
  item: LearningItem;
  content: string;
  type: 'emoji' | 'text';
  flipped: boolean;
  matched: boolean;
}

export const MemoryGame: React.FC<Props> = ({
  player,
  items,
  selectedLevel = 1,
  learnedWordIds,
  missedWordIds = [],
  onMarkWordLearned,
  onWin,
  setProgressPercent,
  setStarsCollected,
  setWordsLearned,
  title,
}) => {
  const [gameState, setGameState] = useState<'playing' | 'done'>('playing');
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchesCount, setMatchesCount] = useState(0);
  const [movesCount, setMovesCount] = useState(0);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);

  const isProcessingRef = useRef(false);
  const matchesRef = useRef(0);
  const starsRef = useRef(0);
  const wordsRef = useRef(0);

  // Number of pairs scales with level: Level 1 = 3 pairs (6 chests), Level 2 = 4 pairs (8), Level 3 = 5 pairs (10), Level 4-8 = 6 pairs (12)
  const numPairs = useMemo(() => Math.min(2 + selectedLevel, 6), [selectedLevel]);

  const initGame = useCallback(() => {
    const selected = selectAdaptiveItems(items, selectedLevel, learnedWordIds, missedWordIds, numPairs);
    const cardSet: MemoryCard[] = [];

    selected.forEach((item, idx) => {
      cardSet.push({
        uid: `emoji-${item.id}-${idx}`,
        pairId: item.id,
        item,
        content: item.emoji,
        type: 'emoji',
        flipped: false,
        matched: false,
      });
      cardSet.push({
        uid: `text-${item.id}-${idx}`,
        pairId: item.id,
        item,
        content: item.targetText,
        type: 'text',
        flipped: false,
        matched: false,
      });
    });

    setCards(cardSet.sort(() => 0.5 - Math.random()));
    setMatchesCount(0);
    matchesRef.current = 0;
    setMovesCount(0);
    setFlippedIndices([]);
    isProcessingRef.current = false;
  }, [items, numPairs, selectedLevel, learnedWordIds, missedWordIds]);

  useEffect(() => {
    if (gameState === 'playing' && cards.length === 0) {
      initGame();
    }
  }, [gameState, cards.length, initGame]);

  const handleCardClick = (index: number) => {
    if (
      gameState !== 'playing' ||
      isProcessingRef.current ||
      cards[index]?.flipped ||
      cards[index]?.matched
    ) {
      return;
    }

    const clickedCard = cards[index];
    sounds.sfxPop(clickedCard.type === 'emoji' ? 1.1 : 0.95);
    // Speak the exact word or phrase (e.g. "Casa", "Perro") immediately when clicked!
    sounds.speak(clickedCard.item.es, clickedCard.item.audioLang);

    const nextCards = cards.map((c, idx) => (idx === index ? { ...c, flipped: true } : c));
    setCards(nextCards);

    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      isProcessingRef.current = true;
      setMovesCount((m) => m + 1);
      const [firstIdx, secondIdx] = nextFlipped;
      const firstCard = nextCards[firstIdx];
      const secondCard = nextCards[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        setTimeout(() => {
          sounds.sfxCoin();
          sounds.sfxMagic();

          setCards((prev) =>
            prev.map((c, idx) =>
              idx === firstIdx || idx === secondIdx ? { ...c, matched: true, flipped: true } : c
            )
          );
          setFlippedIndices([]);

          const nextMatches = matchesRef.current + 1;
          matchesRef.current = nextMatches;
          starsRef.current += 2;
          wordsRef.current += 1;

          setMatchesCount(nextMatches);
          setStarsCollected(starsRef.current);
          setWordsLearned(wordsRef.current);
          setProgressPercent(Math.round((nextMatches / numPairs) * 100));
          onMarkWordLearned(firstCard.pairId);

          const isFinalWin = nextMatches >= numPairs;
          const praise = getPersonalizedPraise(player.name, isFinalWin);
          setPraiseBanner(praise);
          sounds.speak(praise, 'es-ES', false);

          confetti({
            particleCount: 45,
            spread: 65,
            origin: { y: 0.6 },
            colors: ['#a855f7', '#fbbf24', '#34d399'],
          });

          isProcessingRef.current = false;

          if (isFinalWin) {
            setGameState('done');
            setTimeout(() => {
              setPraiseBanner(null);
              onWin(nextMatches * 450, starsRef.current, wordsRef.current);
            }, 1300);
          } else {
            setTimeout(() => setPraiseBanner(null), 1100);
          }
        }, 550);
      } else {
        setTimeout(() => {
          sounds.sfxBoing();
          setCards((prev) =>
            prev.map((c, idx) =>
              idx === firstIdx || idx === secondIdx ? { ...c, flipped: false } : c
            )
          );
          setFlippedIndices([]);
          isProcessingRef.current = false;
        }, 950);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between bg-gradient-to-b from-indigo-950 via-purple-900 to-slate-900 relative px-3 sm:px-4 pt-16 pb-20 overflow-hidden select-none">
      {/* Top Pirate Banner */}
      <div className="relative z-10 w-full max-w-md bg-white/95 rounded-[2rem] p-3.5 sm:p-4 shadow-xl border-b-8 border-violet-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 border-2 border-violet-300 flex items-center justify-center text-3xl">
            👑
          </div>
          <div className="text-left">
            <div className="text-[11px] font-black text-violet-600 uppercase tracking-wider">
              Nivel {selectedLevel} · Parejas: {matchesCount}/{numPairs}
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 leading-tight">{title}</div>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-black text-xs flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-amber-500" /> Turnos: {movesCount}
        </div>
      </div>

      {praiseBanner && (
        <div className="z-20 px-5 py-1.5 bg-emerald-400 text-slate-950 font-black text-sm sm:text-base rounded-full shadow-xl border-2 border-white animate-bounce">
          💎 {praiseBanner}
        </div>
      )}

      {/* Treasure Chest Grid */}
      <div
        className={`w-full max-w-md my-auto grid gap-2 sm:gap-3 ${
          numPairs > 4 ? 'grid-cols-4' : 'grid-cols-3'
        }`}
      >
        {cards.map((card, i) => {
          const isRevealed = card.flipped || card.matched;
          return (
            <button
              key={card.uid}
              onClick={() => handleCardClick(i)}
              disabled={isRevealed}
              className={`relative h-22 sm:h-28 rounded-3xl shadow-xl border-b-6 transition-all duration-300 flex flex-col items-center justify-center p-2 btn-squishy ${
                card.matched
                  ? 'bg-emerald-100 border-emerald-500 scale-95 ring-4 ring-emerald-400/50'
                  : card.flipped
                  ? 'bg-white border-violet-300 scale-105'
                  : 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-800 hover:brightness-105'
              }`}
            >
              {isRevealed ? (
                card.type === 'emoji' ? (
                  <>
                    <span className="text-3xl sm:text-5xl leading-none">{card.content}</span>
                    {card.matched && (
                      <span className="text-[9px] font-black text-emerald-700 uppercase mt-1 truncate max-w-full">
                        {card.item.es}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] sm:text-sm font-black text-indigo-950 uppercase break-words leading-tight text-center line-clamp-2">
                      {card.content}
                    </span>
                    {card.matched && <span className="text-lg mt-0.5">{card.item.emoji}</span>}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-3xl sm:text-4xl drop-shadow">🧰</span>
                  <span className="text-[9px] font-black text-amber-950/70 uppercase tracking-wider mt-0.5">
                    ABRIR
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
