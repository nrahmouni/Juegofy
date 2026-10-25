import React, { useState, useEffect } from 'react';
import { PlayerConfig, ThemeConfig, AgeGroup } from '../../types/game';
import { ALPHABET_LEARNING_ITEMS, LearningItem } from '../../data/learningData';
import { COSTUMES } from '../../data/garage';
import { sounds } from '../../audio/soundManager';
import { speakWord } from '../../audio/speech';
import { Volume2, Sparkles, Trophy } from 'lucide-react';
import { ThemeVocabularyBanner } from '../common/ThemeVocabularyBanner';

interface Props {
  player: PlayerConfig;
  difficulty: number;
  selectedLevel?: number;
  theme: ThemeConfig;
  ageGroup?: AgeGroup;
  onWin: (score: number, stars: number, words: number) => void;
  onLose: (why: 'bomb' | 'bee' | 'edge', score: number, stars: number, progress: number) => void;
  starsCollected: number;
  setStarsCollected: React.Dispatch<React.SetStateAction<number>>;
  wordsLearned: number;
  setWordsLearned: React.Dispatch<React.SetStateAction<number>>;
  setProgressPercent: React.Dispatch<React.SetStateAction<number>>;
}

interface CardItem {
  id: number;
  pairKey: string;
  type: 'letter' | 'picture';
  letter: string;
  wordName: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
  audioText: string;
}

export const AlphabetMemoryGame: React.FC<Props> = ({
  player,
  difficulty,
  selectedLevel = 1,
  theme,
  onWin,
  onLose,
  starsCollected,
  setStarsCollected,
  wordsLearned,
  setWordsLearned,
  setProgressPercent,
}) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [matchedPairsCount, setMatchedPairsCount] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [jackpotMsg, setJackpotMsg] = useState<string | null>(null);

  const totalPairs = selectedLevel <= 1 ? 2 : selectedLevel <= 3 ? 3 : selectedLevel === 4 ? 4 : 5;

  // Initialize cards
  useEffect(() => {
    const selectedItems = [...ALPHABET_LEARNING_ITEMS]
      .sort(() => Math.random() - 0.5)
      .slice(0, totalPairs);

    const cardList: CardItem[] = [];
    let cardId = 0;

    selectedItems.forEach((item) => {
      // 1. Letter card
      cardList.push({
        id: cardId++,
        pairKey: item.id,
        type: 'letter',
        letter: item.targetText,
        wordName: item.subText || item.es,
        emoji: '🔤',
        isFlipped: false,
        isMatched: false,
        audioText: `Letra ${item.targetText}`,
      });

      // 2. Picture card
      cardList.push({
        id: cardId++,
        pairKey: item.id,
        type: 'picture',
        letter: item.targetText,
        wordName: item.subText || item.es,
        emoji: item.emoji,
        isFlipped: false,
        isMatched: false,
        audioText: item.audioText,
      });
    });

    setCards(cardList.sort(() => Math.random() - 0.5));
    setFlippedIndices([]);
    setMatchedPairsCount(0);
    setCombo(0);
    setProgressPercent(0);
  }, [difficulty, setProgressPercent, totalPairs]);

  const handleCardClick = (index: number) => {
    if (isLocked) return;
    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

    sounds.sfxPop();
    speakWord(card.audioText, 'es-ES');
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      const [firstIdx, secondIdx] = newFlipped;
      const cardA = cards[firstIdx];
      const cardB = cards[secondIdx];

      if (cardA.pairKey === cardB.pairKey) {
        // MATCH!
        const newCombo = combo + 1;
        setCombo(newCombo);
        sounds.sfxWin();
        speakWord(cardA.type === 'picture' ? cardA.audioText : cardB.audioText, 'es-ES');

        setJackpotMsg(`¡JACKPOT PAREJA! +${25 * newCombo}🪙 ⭐`);
        setTimeout(() => setJackpotMsg(null), 1200);

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, idx) =>
              idx === firstIdx || idx === secondIdx
                ? { ...c, isMatched: true, isFlipped: true }
                : c
            )
          );
          setFlippedIndices([]);
          setIsLocked(false);

          const nextMatched = matchedPairsCount + 1;
          setMatchedPairsCount(nextMatched);
          setWordsLearned(nextMatched);
          setStarsCollected((prev) => prev + 2);
          setProgressPercent(Math.min(100, (nextMatched / totalPairs) * 100));

          if (nextMatched >= totalPairs) {
            setTimeout(() => {
              const score = totalPairs * 80 + starsCollected * 20 + 150;
              onWin(score, starsCollected, nextMatched);
            }, 600);
          }
        }, 500);
      } else {
        // NO MATCH
        setCombo(0);
        sounds.sfxBoing();
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, idx) =>
              idx === firstIdx || idx === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
          setIsLocked(false);
        }, 850);
      }
    }
  };

  const cosObj = COSTUMES.find((c) => c.id === (player.selectedCostume || 'none'));

  return (
    <div className="relative w-full max-w-md h-full flex flex-col items-center justify-between p-3 select-none">
      <ThemeVocabularyBanner modeKey="alphabet" />

      {/* Top Mission Header */}
      <div className="w-full flex flex-col items-center mt-2 z-20">
        <div className="px-5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl border-3 border-cyan-400 flex items-center gap-3 animate-bounce">
          <span className="text-3xl">🎰</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black text-slate-500 uppercase leading-none">
              Memory Arcade Jackpot
            </span>
            <div className="font-black text-cyan-950 text-base leading-tight flex items-center gap-1.5">
              <span>¡Empareja la Letra con su Dibujo! 🔤</span>
              {combo > 1 && (
                <span className="text-[10px] font-black bg-yellow-400 text-slate-900 px-2 py-0.5 rounded-full animate-pulse">
                  🔥 {combo}x COMBO
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-[11px] font-black text-white bg-black/40 px-3 py-0.5 rounded-full mt-1.5 backdrop-blur-xs">
          Parejas encontradas: {matchedPairsCount} / {totalPairs}
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="w-full my-auto grid grid-cols-2 sm:grid-cols-4 gap-3 px-2 z-10">
        {cards.map((card, index) => {
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(index)}
              className={`relative h-28 sm:h-32 rounded-3xl border-4 transition-all duration-300 shadow-xl flex flex-col items-center justify-center p-2 active:scale-95 ${
                card.isMatched
                  ? 'bg-gradient-to-tr from-emerald-400 to-green-500 border-green-600 scale-95 opacity-90'
                  : card.isFlipped
                  ? 'bg-white border-amber-400 rotate-y-180'
                  : 'bg-gradient-to-tr from-cyan-500 to-blue-600 border-white hover:border-cyan-200'
              }`}
            >
              {card.isFlipped || card.isMatched ? (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-3xl sm:text-4xl">{card.emoji}</span>
                  <span
                    className={`font-black mt-1 leading-tight ${
                      card.type === 'letter' ? 'text-3xl text-pink-600' : 'text-sm text-slate-800'
                    }`}
                  >
                    {card.type === 'letter' ? card.letter : card.wordName}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-white/80">
                  <span className="text-3xl font-black">⭐</span>
                  <span className="text-[10px] font-black tracking-wider uppercase mt-1">Toca</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Jackpot Toast Banner */}
      {jackpotMsg && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 px-6 py-3 rounded-3xl bg-yellow-400 text-slate-900 shadow-2xl border-4 border-white font-black text-xl animate-bounce">
          {jackpotMsg}
        </div>
      )}

      {/* Player Avatar Mascot */}
      <div className="w-full flex flex-col items-center mb-2 z-10">
        <div className="flex items-center gap-2 bg-white/95 px-4 py-1.5 rounded-full shadow-md border border-slate-200">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full border-2 overflow-hidden shadow-xs bg-white shrink-0"
              style={{ borderColor: player.color }}
            >
              {player.photoUrl ? (
                <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl flex items-center justify-center h-full">
                  {player.fallbackEmoji}
                </span>
              )}
            </div>
            {cosObj && cosObj.id !== 'none' && (
              <div className="absolute -top-2 -left-1 text-base select-none">{cosObj.icon}</div>
            )}
          </div>
          <div className="text-xs font-black text-slate-800">
            ¡Vamos {player.name}! ¡Gana monedas encontrando las parejas! 🪙
          </div>
        </div>
      </div>
    </div>
  );
};
