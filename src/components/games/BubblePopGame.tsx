import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Sparkles, HelpCircle, CheckCircle2 } from 'lucide-react';
import { PlayerConfig, PracticeLang } from '../../types/game';
import { LearningItem, selectAdaptiveItems, getPersonalizedPraise } from '../../data/learningData';
import { getLangPool, PRACTICE_LANG_OPTIONS } from '../../data/languagePools';
import { sounds } from '../../audio/soundManager';

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

interface BubbleItem {
  uid: string;
  item: LearningItem;
  colorClass: string;
  popped: 'none' | 'correct' | 'wrong';
  sizeClass: string;
  animationDelay: string;
}

const BUBBLE_COLORS = [
  'from-cyan-400/90 to-blue-500/90 border-cyan-200 shadow-cyan-300/50',
  'from-pink-400/90 to-rose-500/90 border-pink-200 shadow-pink-300/50',
  'from-amber-400/90 to-orange-500/90 border-amber-200 shadow-amber-300/50',
  'from-emerald-400/90 to-teal-500/90 border-emerald-200 shadow-emerald-300/50',
  'from-purple-400/90 to-violet-600/90 border-purple-200 shadow-purple-300/50',
  'from-fuchsia-400/90 to-pink-500/90 border-fuchsia-200 shadow-fuchsia-300/50',
];

export const BubblePopGame: React.FC<Props> = ({
  player,
  practiceLang = 'es',
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
  const [currentLang, setCurrentLang] = useState<PracticeLang>(practiceLang);
  const [gameState, setGameState] = useState<'playing' | 'done'>('playing');
  const [currentChallenge, setCurrentChallenge] = useState<LearningItem | null>(null);
  const [bubbles, setBubbles] = useState<BubbleItem[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionUsedIds, setSessionUsedIds] = useState<string[]>([]);
  const [combo, setCombo] = useState(0);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const starsRef = useRef(0);
  const wordsRef = useRef(0);
  const isTransitioningRef = useRef(false);

  const pool = useMemo(() => getLangPool(currentLang), [currentLang]);
  const numBubbles = useMemo(() => Math.min(3 + Math.floor(selectedLevel / 2), 6), [selectedLevel]);
  const targetCorrect = useMemo(() => 3 + Math.min(Math.floor(selectedLevel / 2), 3), [selectedLevel]);

  const spawnRound = useCallback(
    (excludeIds: string[], langPool: LearningItem[]) => {
      const available = langPool.filter((i) => !excludeIds.includes(i.id));
      const poolToUse = available.length > 0 ? available : langPool;

      const item = selectAdaptiveItems(
        poolToUse,
        selectedLevel,
        learnedWordIds,
        missedWordIds,
        1
      )[0];

      if (!item) return;

      setCurrentChallenge(item);
      setShowHint(selectedLevel === 1);
      isTransitioningRef.current = false;

      const distractors = langPool
        .filter((i) => i.id !== item.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, numBubbles - 1);

      const roundItems = [item, ...distractors].sort(() => 0.5 - Math.random());

      const newBubbles: BubbleItem[] = roundItems.map((bItem, idx) => ({
        uid: `bub-${bItem.id}-${idx}-${Math.random()}`,
        item: bItem,
        colorClass: BUBBLE_COLORS[idx % BUBBLE_COLORS.length],
        popped: 'none',
        sizeClass: 'w-24 h-24 sm:w-28 sm:h-28',
        animationDelay: `${(idx * 0.15).toFixed(2)}s`,
      }));

      setBubbles(newBubbles);

      // Play audio announcement
      void sounds.speakAsync(item.audioText, item.audioLang, true);
    },
    [selectedLevel, numBubbles, learnedWordIds, missedWordIds]
  );

  // Initialize round
  useEffect(() => {
    if (gameState === 'playing' && !currentChallenge) {
      spawnRound([], pool);
    }
  }, [gameState, currentChallenge, pool, spawnRound]);

  const handleLangChange = (lang: PracticeLang) => {
    sounds.sfxPop();
    setCurrentLang(lang);
    setSessionUsedIds([]);
    setCurrentChallenge(null);
    const nextPool = getLangPool(lang);
    spawnRound([], nextPool);
  };

  const handleBubbleClick = (bubble: BubbleItem) => {
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
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#34d399', '#f472b6', '#fbbf24'],
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
        await sounds.speakPraise(praise);
        setPraiseBanner(null);
        if (isFinalWin) {
          setGameState('done');
          onWin(nextCorrect * 350 + nextCombo * 50, starsRef.current, wordsRef.current);
        } else {
          spawnRound(nextUsed, pool);
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
    }
  };

  const handleReplayAudio = () => {
    if (!currentChallenge) return;
    sounds.sfxPop();
    void sounds.speakAsync(currentChallenge.audioText, currentChallenge.audioLang, true);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-3 sm:p-5 select-none overflow-hidden bg-gradient-to-b from-sky-950 via-indigo-950 to-slate-950">
      {/* Decorative ambient bubbles in background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-10 left-8 w-20 h-20 rounded-full bg-cyan-400/10 blur-xl animate-float" />
        <div className="absolute bottom-16 right-10 w-32 h-32 rounded-full bg-pink-400/10 blur-2xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/3 w-28 h-28 rounded-full bg-indigo-400/10 blur-xl animate-float" style={{ animationDelay: '2.2s' }} />
      </div>

      {/* Language Selector + Level Bar */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/15">
          {PRACTICE_LANG_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleLangChange(opt.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                currentLang === opt.id
                  ? 'bg-yellow-400 text-slate-950 shadow-md scale-105'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{opt.flag}</span>
              <span className="text-[10px] uppercase">{opt.short}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {combo > 1 && (
            <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-xs shadow-md animate-bounce">
              🔥 x{combo}
            </div>
          )}
          <div className="px-3 py-1 rounded-xl bg-white/10 text-white/80 font-black text-xs border border-white/15">
            {correctCount}/{targetCorrect}
          </div>
        </div>
      </div>

      {/* Target Word Display & Speaker */}
      <div className="relative z-10 flex flex-col items-center mt-2 max-w-sm w-full">
        {currentChallenge && (
          <div className="w-full bg-white/15 backdrop-blur-xl border-2 border-white/30 rounded-3xl p-3.5 shadow-2xl flex flex-col items-center text-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-yellow-300 mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> ¡Explota la burbuja!
            </span>

            <div className="flex items-center justify-center gap-3 w-full">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                {currentChallenge.targetText}
              </h2>
              <button
                type="button"
                onClick={handleReplayAudio}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                aria-label="Repetir audio"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {showHint && (
              <p className="mt-1 text-xs font-bold text-emerald-300 animate-in fade-in">
                Traducción: {currentChallenge.es} {currentChallenge.emoji}
              </p>
            )}
          </div>
        )}

        {/* Praise Banner */}
        {praiseBanner && (
          <div className="mt-2 px-4 py-1.5 rounded-full bg-emerald-500 text-white font-black text-xs shadow-xl animate-in zoom-in-90 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> {praiseBanner}
          </div>
        )}
      </div>

      {/* Bubbles Floating Arena */}
      <div className="relative z-10 flex-1 w-full max-w-md flex items-center justify-center py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 place-items-center w-full">
          {bubbles.map((bub) => {
            const isCorrect = bub.popped === 'correct';
            const isWrong = bub.popped === 'wrong';

            return (
              <button
                key={bub.uid}
                type="button"
                onClick={() => handleBubbleClick(bub)}
                disabled={bub.popped !== 'none' || isTransitioningRef.current}
                style={{ animationDelay: bub.animationDelay }}
                className={`relative rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 transform active:scale-90 ${bub.sizeClass} ${
                  isCorrect
                    ? 'scale-125 opacity-0 duration-500 pointer-events-none'
                    : isWrong
                    ? 'scale-90 opacity-40 bg-rose-600/60 border-rose-400 shake'
                    : `bg-gradient-to-br ${bub.colorClass} shadow-xl hover:scale-105 animate-float`
                }`}
              >
                {/* Bubble specular highlight reflection */}
                <div className="absolute top-2 left-3 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/40 blur-[1px] pointer-events-none" />
                <div className="absolute bottom-2 right-3 w-2 h-2 rounded-full bg-white/20 blur-[1px] pointer-events-none" />

                {/* Bubble Content */}
                <span className="text-3xl sm:text-4xl leading-none select-none drop-shadow">
                  {bub.item.emoji}
                </span>
                <span className="text-[11px] sm:text-xs font-black text-white mt-1 max-w-[80%] truncate text-center drop-shadow-md">
                  {bub.item.targetText}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Hint / Helper */}
      <div className="relative z-10 mb-14">
        <button
          type="button"
          onClick={() => setShowHint((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 text-xs font-bold transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showHint ? 'Ocultar pista' : 'Ver pista'}</span>
        </button>
      </div>
    </div>
  );
};
