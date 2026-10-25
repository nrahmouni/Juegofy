import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PlayerConfig } from '../../types/game';
import { LearningItem, selectAdaptiveItems, getPersonalizedPraise } from '../../data/learningData';
import { sounds } from '../../audio/soundManager';
import confetti from 'canvas-confetti';
import { Volume2, Sparkles, HelpCircle } from 'lucide-react';

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

interface TokenTile {
  id: string;
  token: string;
  color: string;
  used: boolean;
}

const BALLOON_COLORS = [
  'from-rose-400 to-rose-600 border-rose-700',
  'from-amber-400 to-orange-500 border-orange-700',
  'from-emerald-400 to-emerald-600 border-emerald-700',
  'from-sky-400 to-blue-600 border-blue-700',
  'from-violet-400 to-purple-600 border-purple-700',
  'from-pink-400 to-pink-600 border-pink-700',
];

const EXTRA_WORD_DISTRACTORS = ['HOY', 'MUY', 'AQUI', 'AZUL', 'FELIZ', 'GRAN', 'SOL'];

export const PuzzleGame: React.FC<Props> = ({
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
  const [tokenTiles, setTokenTiles] = useState<TokenTile[]>([]);
  const [filledSlots, setFilledSlots] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionUsedIds, setSessionUsedIds] = useState<string[]>([]);
  const [wrongTileId, setWrongTileId] = useState<string | null>(null);
  const [trainDeparting, setTrainDeparting] = useState(false);
  const [combo, setCombo] = useState(0);
  const [mistakesOnItem, setMistakesOnItem] = useState(0);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);

  const starsRef = useRef(0);
  const wordsRef = useRef(0);

  const targetCorrect = useMemo(() => 3 + Math.min(Math.floor(selectedLevel / 2), 3), [selectedLevel]);

  const getExpectedTokens = (item: LearningItem): string[] => {
    const upper = item.targetText.toUpperCase().trim();
    if (item.isPhrase || upper.includes(' ')) {
      return upper.split(/\s+/);
    }
    return upper.split('');
  };

  const pickNextChallenge = useCallback(
    (excludeIds: string[]) => {
      const available = items.filter((i) => !excludeIds.includes(i.id));
      const picked = selectAdaptiveItems(
        available.length > 0 ? available : items,
        selectedLevel,
        learnedWordIds,
        missedWordIds,
        1
      )[0];

      if (!picked) return;

      setCurrentChallenge(picked);
      setFilledSlots([]);
      setTrainDeparting(false);
      setWrongTileId(null);
      setMistakesOnItem(0);

      const isSentence = Boolean(picked.isPhrase || picked.targetText.includes(' '));
      const tokens = getExpectedTokens(picked);

      let distractors: string[] = [];
      if (isSentence) {
        const extraWords = selectedLevel >= 7 ? 2 : 1;
        distractors = EXTRA_WORD_DISTRACTORS.filter((w) => !tokens.includes(w))
          .sort(() => 0.5 - Math.random())
          .slice(0, extraWords);
      } else {
        const extraCount = selectedLevel >= 5 ? 3 : selectedLevel >= 3 ? 2 : selectedLevel === 2 ? 1 : 0;
        const alphabet = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('').filter((c) => !tokens.includes(c));
        distractors = alphabet.sort(() => 0.5 - Math.random()).slice(0, extraCount);
      }

      const allTokens = [...tokens, ...distractors];
      const tiles: TokenTile[] = allTokens
        .map((token, idx) => ({
          id: `tile-${idx}-${token}-${Math.random()}`,
          token,
          color: BALLOON_COLORS[idx % BALLOON_COLORS.length],
          used: false,
        }))
        .sort(() => 0.5 - Math.random());

      setTokenTiles(tiles);
      setTimeout(() => {
        sounds.speak(picked.audioText, picked.audioLang);
      }, 240);
    },
    [items, selectedLevel, learnedWordIds, missedWordIds]
  );

  useEffect(() => {
    if (gameState === 'playing' && !currentChallenge) {
      pickNextChallenge([]);
    }
  }, [gameState, currentChallenge, pickNextChallenge]);

  const handleTileClick = (tile: TokenTile) => {
    if (gameState !== 'playing' || tile.used || trainDeparting || !currentChallenge) return;

    const expectedTokens = getExpectedTokens(currentChallenge);
    const nextSlotIdx = filledSlots.length;
    const expectedToken = expectedTokens[nextSlotIdx];

    // Speak the clicked letter or word immediately
    sounds.speak(tile.token.toLowerCase(), 'es-ES');

    if (tile.token === expectedToken) {
      sounds.sfxBubblePop();
      sounds.sfxStar(nextSlotIdx + 1);

      const updatedFilled = [...filledSlots, tile.token];
      setFilledSlots(updatedFilled);
      setTokenTiles((prev) => prev.map((t) => (t.id === tile.id ? { ...t, used: true } : t)));

      if (updatedFilled.length === expectedTokens.length) {
        setTrainDeparting(true);
        const newCombo = combo + 1;
        setCombo(newCombo);
        sounds.sfxMagic();

        const nextCorrect = correctCount + 1;
        const isFinalWin = nextCorrect >= targetCorrect;
        const praise = getPersonalizedPraise(player.name, isFinalWin);
        setPraiseBanner(praise);

        setTimeout(() => {
          sounds.speak(`${praise} ${currentChallenge.audioText}`, currentChallenge.audioLang, false);
        }, 450);

        confetti({
          particleCount: 65,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#f43f5e', '#fbbf24', '#34d399', '#60a5fa'],
        });

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
            onWin(nextCorrect * 350 + newCombo * 60, starsRef.current, wordsRef.current);
          }, 1600);
        } else {
          setTimeout(() => {
            setPraiseBanner(null);
            pickNextChallenge(nextUsed);
          }, 1650);
        }
      }
    } else {
      sounds.sfxError();
      setCombo(0);
      setWrongTileId(tile.id);
      setMistakesOnItem((m) => m + 1);
      if (onMarkWordMissed) {
        onMarkWordMissed(currentChallenge.id);
      }
      setTimeout(() => setWrongTileId(null), 500);
    }
  };

  const expectedTokens = currentChallenge ? getExpectedTokens(currentChallenge) : [];
  const isSentenceMode = Boolean(currentChallenge?.isPhrase || currentChallenge?.targetText.includes(' '));
  const nextExpectedToken = expectedTokens[filledSlots.length];
  const showSmartHint = mistakesOnItem >= 2;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-100 relative px-3 sm:px-6 pt-16 pb-20 overflow-hidden select-none">
      {/* Decorative Clouds */}
      <div className="absolute top-16 left-6 text-5xl opacity-40 animate-float pointer-events-none">☁️</div>
      <div className="absolute top-24 right-8 text-4xl opacity-30 animate-float pointer-events-none">☁️</div>

      {/* Top Station Clue Card */}
      <div className="relative z-10 w-full max-w-lg bg-white/95 rounded-[2rem] p-3.5 sm:p-4 shadow-xl border-b-8 border-rose-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-4xl sm:text-5xl shadow-inner shrink-0 animate-bounce">
            {currentChallenge?.emoji || '🚂'}
          </div>
          <div className="text-left min-w-0">
            <div className="text-[11px] font-black text-rose-500 uppercase tracking-wider">
              {isSentenceMode ? 'Tren de Frases' : 'Tren de Letras'} · Niv. {selectedLevel} ({correctCount}/{targetCorrect})
            </div>
            <div className="text-base sm:text-lg font-black text-slate-800 leading-tight truncate">
              {isSentenceMode ? '¡Ordena las palabras de la frase!' : `¡Forma: ${currentChallenge?.es}!`}
            </div>
            <div className="text-xs font-bold text-slate-500 mt-0.5 truncate">
              Pista: {currentChallenge?.subText || 'Escucha y toca en orden'}
            </div>
          </div>
        </div>

        <button
          onClick={() => currentChallenge && sounds.speak(currentChallenge.audioText, currentChallenge.audioLang)}
          className="p-3.5 rounded-2xl bg-rose-500 text-white shadow-lg border-b-4 border-rose-700 btn-squishy shrink-0"
          aria-label="Escuchar palabra o frase"
        >
          <Volume2 className="w-6 h-6" />
        </button>
      </div>

      {/* Animated Train & Wagons on Tracks */}
      <div className="relative w-full max-w-2xl my-auto flex flex-col items-center">
        {praiseBanner && (
          <div className="mb-2 px-5 py-1.5 bg-emerald-400 text-slate-950 font-black text-sm sm:text-base rounded-full shadow-xl border-2 border-white animate-bounce">
            🌟 {praiseBanner}
          </div>
        )}

        {combo >= 2 && !praiseBanner && (
          <div className="mb-2 px-4 py-1 bg-amber-400 text-amber-950 font-black text-xs rounded-full shadow-md flex items-center gap-1 animate-bounce">
            <Sparkles className="w-3.5 h-3.5" /> ¡RACHA X{combo}!
          </div>
        )}

        {showSmartHint && nextExpectedToken && (
          <div className="mb-2 px-4 py-1 bg-amber-300 text-slate-950 font-black text-xs rounded-2xl shadow flex items-center gap-1.5 animate-bounce">
            <HelpCircle className="w-4 h-4" />
            <span>🦉 Profe Búho: ¡Toca ahora «{nextExpectedToken}»!</span>
          </div>
        )}

        {/* Train Assembly */}
        <div
          className={`flex items-end justify-center gap-1.5 sm:gap-2 flex-wrap px-2 transition-transform duration-700 ${
            trainDeparting ? 'translate-x-[120%] scale-105' : 'translate-x-0'
          }`}
        >
          {/* Locomotive */}
          <div className="flex flex-col items-center mr-1">
            {trainDeparting && <div className="text-2xl animate-ping -mb-2">💨</div>}
            <div className="text-4xl sm:text-6xl transform -scale-x-100 drop-shadow-md">🚂</div>
          </div>

          {/* Letter or Word Wagons */}
          {expectedTokens.map((_, idx) => {
            const token = filledSlots[idx];
            const isNext = idx === filledSlots.length;
            return (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`${
                    isSentenceMode ? 'px-3 h-12 sm:h-14 min-w-[4.5rem]' : 'w-10 h-13 sm:w-13 sm:h-16'
                  } rounded-2xl border-4 flex items-center justify-center ${
                    isSentenceMode ? 'text-sm sm:text-base' : 'text-xl sm:text-3xl'
                  } font-black shadow-lg transition-all duration-300 ${
                    token
                      ? 'bg-emerald-500 border-emerald-700 text-white scale-105'
                      : isNext
                      ? 'bg-white border-rose-400 text-slate-400 animate-pulse'
                      : 'bg-white/80 border-slate-300 text-slate-300'
                  }`}
                >
                  {token || idx + 1}
                </div>
                <div className="flex justify-between w-8 sm:w-10 -mt-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border-2 border-slate-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border-2 border-slate-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Railroad Track */}
        <div className="w-full h-3 bg-amber-900/80 rounded-full mt-1 border-t-2 border-slate-500 shadow-inner" />
      </div>

      {/* Floating Letter / Word Balloons to Tap */}
      <div className="w-full max-w-xl z-10">
        <div className="text-center text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
          {isSentenceMode
            ? `Toca la palabra número ${Math.min(filledSlots.length + 1, expectedTokens.length)}`
            : `Toca la letra número ${Math.min(filledSlots.length + 1, expectedTokens.length)}`}
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {tokenTiles.map((tile) => {
            const isHinted = showSmartHint && tile.token === nextExpectedToken;
            return (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                disabled={tile.used || trainDeparting}
                className={`${
                  isSentenceMode
                    ? 'px-4 py-3 sm:px-5 sm:py-3.5 text-base sm:text-xl'
                    : 'w-13 h-15 sm:w-16 sm:h-20 text-2xl sm:text-3xl'
                } rounded-3xl bg-gradient-to-b ${
                  tile.color
                } text-white font-black border-b-6 shadow-xl flex items-center justify-center transition-all btn-squishy ${
                  tile.used ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'
                } ${wrongTileId === tile.id ? 'animate-shake ring-4 ring-red-500' : ''} ${
                  isHinted ? 'ring-4 ring-yellow-300 scale-110' : ''
                }`}
              >
                {tile.token}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
