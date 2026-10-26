import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Sparkles } from 'lucide-react';
import { PlayerConfig, PracticeLang } from '../../types/game';
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

type LangFilter = 'es' | 'fl' | 'ar' | 'fr';

const LANG_POOLS: Record<LangFilter, { label: string; flag: string; items: LearningItem[] }> = {
  es: { label: 'Español', flag: '🇪🇸', items: SPANISH_VOCAB_ITEMS },
  fl: { label: 'Flamenco', flag: '🇧🇪', items: FLEMISH_LEARNING_ITEMS },
  ar: { label: 'Árabe', flag: '🇸🇦', items: ARABIC_LEARNING_ITEMS },
  fr: { label: 'Francés', flag: '🇫🇷', items: FRENCH_LEARNING_ITEMS },
};

export const BubblePopGame: React.FC<Props> = ({
  player,
  practiceLang = 'es',
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
  const optionsCount = Math.min(5, 3 + Math.floor(selectedLevel / 3));

  const [langKey, setLangKey] = useState<LangFilter>((practiceLang as LangFilter) || 'es');
  useEffect(() => {
    if (practiceLang) setLangKey(practiceLang as LangFilter);
  }, [practiceLang]);

  const [roundIdx, setRoundIdx] = useState(0);
  const [target, setTarget] = useState<LearningItem | null>(null);
  const [bubbles, setBubbles] = useState<LearningItem[]>([]);
  const [poppedId, setPoppedId] = useState<string | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);

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
        .sort(() => Math.random() - 0.5)
        .slice(0, optionsCount - 1);

      const all = [picked, ...distractors].sort(() => Math.random() - 0.5);

      roundRef.current = rIdx;
      setRoundIdx(rIdx);
      setTarget(picked);
      setBubbles(all);
      setPoppedId(null);
      setWrongId(null);
      setMistakes(0);

      void (async () => {
        await new Promise((r) => setTimeout(r, 250));
        await sounds.speakAsync(picked.audioText, picked.audioLang, true);
      })();
    },
    [selectedLevel, learnedWordIds, missedWordIds, optionsCount]
  );

  useEffect(() => {
    usedIdsRef.current.clear();
    setupRound(0, langKey);
  }, [langKey, setupRound]);

  const handlePop = async (item: LearningItem) => {
    if (!target || poppedId) return;

    if (item.id === target.id) {
      setPoppedId(item.id);
      sounds.sfxMagic();
      sounds.hapticSuccess();
      onMarkWordLearned(target.id);

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#14b8a6', '#2dd4bf', '#facc15', '#f472b6'],
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
      await sounds.speakPraise(praise);
      setPraiseBanner(null);

      if (isFinal) {
        onWin(1500 + selectedLevel * 200, nextStars, nextWords);
      } else {
        setupRound(nextRound, langKey);
      }
    } else {
      sounds.sfxError();
      sounds.hapticError();
      setWrongId(item.id);
      setMistakes((m) => m + 1);
      if (onMarkWordMissed) onMarkWordMissed(target.id);
      setTimeout(() => setWrongId(null), 600);
    }
  };

  if (!target) return null;

  const showHint = mistakes >= 2;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between pt-16 pb-14 px-3 bg-gradient-to-b from-teal-950 via-cyan-900 to-emerald-950 relative overflow-hidden select-none">
      {/* Language + Progress */}
      <div className="w-full max-w-xl flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-1 bg-white/15 backdrop-blur-md p-1 rounded-2xl border border-white/20">
          {(Object.keys(LANG_POOLS) as LangFilter[]).map((key) => (
            <button
              key={key}
              onClick={() => {
                sounds.sfxPop();
                setLangKey(key);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                langKey === key ? 'bg-yellow-400 text-slate-950 scale-105' : 'text-white/80'
              }`}
            >
              {LANG_POOLS[key].flag}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-2xl">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < roundIdx ? 'bg-emerald-400' : i === roundIdx ? 'bg-yellow-400 animate-pulse' : 'bg-white/25'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Prompt */}
      <div className="w-full max-w-xl bg-white rounded-3xl p-4 shadow-2xl border-b-8 border-teal-200 flex items-center justify-between gap-3 z-10">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black text-teal-600 uppercase mb-0.5">
            🫧 ¡Escucha y explota la burbuja!
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 truncate">
            « {target.targetText} »
          </div>
          <div className="text-xs font-bold text-slate-500">
            {langKey === 'es' ? target.subText || target.category : `= ${target.es}`}
          </div>
        </div>
        <button
          onClick={() => void sounds.speakAsync(target.audioText, target.audioLang, true)}
          className="p-3.5 rounded-2xl bg-teal-500 text-white shadow-lg border-b-4 border-teal-700 btn-squishy"
        >
          <Volume2 className="w-6 h-6" />
        </button>
      </div>

      {showHint && (
        <div className="px-4 py-1.5 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          🦉 ¡Toca la burbuja con {target.emoji}!
        </div>
      )}

      {praiseBanner && (
        <div className="px-5 py-1.5 rounded-full bg-emerald-400 text-slate-950 font-black text-sm shadow-2xl animate-bounce">
          🌟 {praiseBanner}
        </div>
      )}

      {/* Bubbles */}
      <div className="w-full max-w-lg grid grid-cols-2 sm:grid-cols-3 gap-3 z-10">
        {bubbles.map((item, idx) => {
          const isPopped = poppedId === item.id;
          const isWrong = wrongId === item.id;
          const isHinted = showHint && item.id === target.id;
          return (
            <button
              key={item.id}
              onClick={() => handlePop(item)}
              className={`relative aspect-square rounded-full bg-white/95 border-4 shadow-xl flex flex-col items-center justify-center transition-all btn-squishy ${
                isPopped
                  ? 'scale-0 opacity-0 duration-300'
                  : isWrong
                  ? 'border-rose-500 bg-rose-100 animate-shake'
                  : isHinted
                  ? 'border-amber-400 ring-4 ring-amber-300 animate-bounce'
                  : 'border-cyan-200 hover:border-teal-400'
              }`}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <span className="text-4xl sm:text-5xl drop-shadow">{item.emoji}</span>
              <span className="text-[11px] font-black text-slate-700 mt-1 uppercase">{item.es}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
