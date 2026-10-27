import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Sparkles, HelpCircle, Blocks } from 'lucide-react';
import { PlayerConfig, PracticeLang } from '../../types/game';
import {
  LearningItem,
  selectAdaptiveItems,
  getPersonalizedPraise,
  SPANISH_VOCAB_ITEMS,
  ALPHABET_LEARNING_ITEMS,
} from '../../data/learningData';
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

/**
 * Builder of short phrases / multi-letter words.
 * Player drags word tokens into ordered slots. Fully speech-synced.
 */
export const SentenceBuilderGame: React.FC<Props> = ({
  player,
  practiceLang,
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
  // Prefer phrase items (level 6+) when available, otherwise split targetText into tokens
  const pool = useMemo(() => {
    const phrases = [...ALPHABET_LEARNING_ITEMS, ...SPANISH_VOCAB_ITEMS].filter(
      (i) => i.level >= Math.max(1, selectedLevel - 1)
    );
    return phrases.length > 0 ? phrases : SPANISH_VOCAB_ITEMS;
  }, [selectedLevel]);

  const totalRounds = Math.min(5, 3 + Math.floor(selectedLevel / 3));

  const [roundIdx, setRoundIdx] = useState(0);
  const [target, setTarget] = useState<LearningItem | null>(null);
  const [tokens, setTokens] = useState<string[]>([]); // correct order
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [placed, setPlaced] = useState<(string | null)[]>([]);
  const [dragToken, setDragToken] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [combo, setCombo] = useState(0);

  const starsRef = React.useRef(0);
  const wordsRef = React.useRef(0);
  const usedIdsRef = React.useRef<Set<string>>(new Set());
  const slotRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  const tokenize = (item: LearningItem): string[] => {
    // Prefer explicit subText letter split "S - O - L", else split targetText by spaces
    if (item.subText && item.subText.includes(' - ')) {
      return item.subText.split(/\s*-\s*/).map((t) => t.trim()).filter(Boolean);
    }
    const parts = item.targetText.trim().split(/\s+/);
    if (parts.length >= 2) return parts;
    // Single word → split into syllables/letters for young kids (max 6 pieces)
    const letters = item.targetText.replace(/\s/g, '').split('');
    if (letters.length <= 6) return letters;
    // Chunk into pairs
    const chunks: string[] = [];
    for (let i = 0; i < letters.length; i += 2) {
      chunks.push(letters.slice(i, i + 2).join(''));
    }
    return chunks;
  };

  const setupRound = async (rIdx: number) => {
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
    const toks = tokenize(picked);
    const shuffledToks = [...toks].sort(() => Math.random() - 0.5);
    // Avoid accidental correct order on shuffle
    if (shuffledToks.join('|') === toks.join('|') && toks.length > 1) {
      shuffledToks.reverse();
    }

    setRoundIdx(rIdx);
    setTarget(picked);
    setTokens(toks);
    setShuffled(shuffledToks);
    setPlaced(Array(toks.length).fill(null));
    setIsResolving(false);
    setPraiseBanner(null);
    setMistakes(0);
    setDragToken(null);
    setDragPos(null);

    await new Promise((r) => setTimeout(r, 200));
    await sounds.speakAsync(picked.audioText, picked.audioLang, true);
  };

  useEffect(() => {
    usedIdsRef.current.clear();
    starsRef.current = 0;
    wordsRef.current = 0;
    void setupRound(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel]);

  const remainingPool = shuffled.filter((t) => {
    // Count how many times t appears in placed vs shuffled
    const placedCount = placed.filter((p) => p === t).length;
    const totalCount = shuffled.filter((s) => s === t).length;
    return placedCount < totalCount;
  });

  // Unique display of remaining (keep duplicates if needed)
  const remainingDisplay: string[] = [];
  const usedLocal = new Map<string, number>();
  for (const t of shuffled) {
    const placedCount = placed.filter((p) => p === t).length;
    const alreadyShown = usedLocal.get(t) || 0;
    if (alreadyShown < (shuffled.filter((s) => s === t).length - placedCount)) {
      remainingDisplay.push(t);
      usedLocal.set(t, alreadyShown + 1);
    }
  }

  const checkComplete = async (nextPlaced: (string | null)[]) => {
    if (!target || nextPlaced.some((p) => p === null)) return;

    const isCorrect = nextPlaced.every((p, i) => p === tokens[i]);
    if (!isCorrect) {
      sounds.sfxError();
      sounds.hapticError();
      setMistakes((m) => m + 1);
      if (onMarkWordMissed) onMarkWordMissed(target.id);
      // Shake and clear last wrong token after a beat
      setTimeout(() => {
        // Clear all to try again
        setPlaced(Array(tokens.length).fill(null));
      }, 450);
      return;
    }

    // Success path — wait for full speech sequence
    setIsResolving(true);
    sounds.sfxMagic();
    sounds.sfxCatch();
    sounds.hapticSuccess();
    onMarkWordLearned(target.id);

    const nextCombo = combo + 1;
    setCombo(nextCombo);

    confetti({
      particleCount: 90,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#0ea5e9', '#facc15', '#34d399', '#a855f7'],
    });

    const nextRound = roundIdx + 1;
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

    await sounds.speakPraise(praise);

    setPraiseBanner(null);
    if (isFinal) {
      onWin(1800 + selectedLevel * 280 + nextCombo * 80, nextStars, nextWords);
    } else {
      await setupRound(nextRound);
    }
  };

  const onPointerDownToken = (token: string, e: React.PointerEvent) => {
    if (isResolving) return;
    sounds.sfxPop(1.05);
    setDragToken(token);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragToken) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragToken) return;
    const token = dragToken;
    setDragToken(null);
    setDragPos(null);

    // Find empty slot under finger, or first empty slot
    let hitIdx = -1;
    slotRefs.current.forEach((el, idx) => {
      if (!el || placed[idx] !== null) return;
      const r = el.getBoundingClientRect();
      if (
        e.clientX >= r.left - 6 &&
        e.clientX <= r.right + 6 &&
        e.clientY >= r.top - 6 &&
        e.clientY <= r.bottom + 6
      ) {
        hitIdx = idx;
      }
    });
    if (hitIdx < 0) {
      hitIdx = placed.findIndex((p) => p === null);
    }
    if (hitIdx < 0) return;

    const next = [...placed];
    next[hitIdx] = token;
    setPlaced(next);
    sounds.sfxPop(1.2);
    void checkComplete(next);
  };

  if (!target) return null;

  const showHint = mistakes >= 2;

  return (
    <div
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="w-full h-full flex flex-col items-center justify-between pt-16 pb-16 px-3 sm:px-6 bg-gradient-to-b from-sky-950 via-indigo-900 to-slate-950 relative overflow-hidden select-none touch-none"
    >
      {/* Progress dots */}
      <div className="w-full max-w-xl flex items-center justify-center z-10">
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

      {/* Mission */}
      <div className="w-full max-w-xl flex flex-col items-center z-10 my-1">
        <div className="w-full bg-white rounded-3xl p-3 sm:p-4 shadow-2xl border-b-8 border-sky-200 flex items-center justify-between gap-3">
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-black text-sky-600 uppercase tracking-wider flex items-center gap-1">
                <Blocks className="w-3.5 h-3.5" /> ¡Ordena las piezas!
              </span>
              {missedWordIds.includes(target.id) && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-black uppercase flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Repaso
                </span>
              )}
            </div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 leading-tight truncate">
              {target.emoji} « {target.targetText} »
            </div>
            <div className="text-xs font-bold text-slate-500 truncate">
              {target.subText || target.es}
            </div>
          </div>
          <button
            onClick={() => void sounds.speakAsync(target.audioText, target.audioLang, true)}
            className="p-3.5 rounded-2xl bg-sky-500 text-white shadow-lg border-b-4 border-sky-700 btn-squishy shrink-0"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>

        {showHint && (
          <div className="mt-1.5 px-4 py-1 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 animate-bounce">
            <HelpCircle className="w-4 h-4" />
            <span>🦉 Orden: {tokens.join(' → ')}</span>
          </div>
        )}

        {praiseBanner && (
          <div className="mt-1.5 px-5 py-1.5 rounded-full bg-emerald-400 text-slate-950 font-black text-sm shadow-2xl border-2 border-white animate-bounce">
            🧱 {praiseBanner}
          </div>
        )}
      </div>

      {/* Ordered slots */}
      <div className="w-full max-w-xl flex flex-wrap items-center justify-center gap-2 my-3 z-10">
        {tokens.map((_, idx) => (
          <div
            key={idx}
            ref={(el) => {
              slotRefs.current[idx] = el;
            }}
            className={`min-w-[3.2rem] h-14 sm:h-16 px-3 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shadow-lg border-4 border-dashed transition-all ${
              placed[idx]
                ? 'bg-sky-400 border-sky-200 text-white border-solid scale-105'
                : 'bg-white/20 border-white/40 text-white/50'
            }`}
          >
            {placed[idx] ?? idx + 1}
          </div>
        ))}
      </div>

      {/* Draggable token pool */}
      <div className="w-full max-w-xl flex flex-wrap items-center justify-center gap-2.5 z-10 pb-2">
        {remainingDisplay.map((token, i) => {
          const isDragging = dragToken === token;
          return (
            <button
              key={`${token}-${i}`}
              onPointerDown={(e) => onPointerDownToken(token, e)}
              className={`min-w-[3.5rem] px-4 py-3 rounded-2xl bg-gradient-to-b from-sky-400 to-indigo-600 text-white font-black text-base sm:text-lg shadow-xl border-b-4 border-indigo-800 btn-squishy ${
                isDragging ? 'opacity-40 scale-95' : ''
              }`}
              style={{ touchAction: 'none' }}
            >
              {token}
            </button>
          );
        })}
      </div>

      {dragToken && dragPos && (
        <div
          className="fixed z-50 pointer-events-none min-w-[3.5rem] px-4 py-3 rounded-2xl bg-gradient-to-b from-sky-400 to-indigo-600 text-white font-black text-lg shadow-2xl border-2 border-white scale-110"
          style={{
            left: dragPos.x,
            top: dragPos.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {dragToken}
        </div>
      )}
    </div>
  );
};
