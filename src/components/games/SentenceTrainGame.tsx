import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Check, RotateCcw } from 'lucide-react';
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

// Simple sentence templates by level
const SENTENCE_TEMPLATES = [
  { level: 1, words: ['El', 'gato', 'come'], target: 'El gato come' },
  { level: 1, words: ['La', 'niña', 'salta'], target: 'La niña salta' },
  { level: 2, words: ['El', 'perro', 'corre', 'rápido'], target: 'El perro corre rápido' },
  { level: 2, words: ['Yo', 'quiero', 'un', 'helado'], target: 'Yo quiero un helado' },
  { level: 3, words: ['El', 'sol', 'brilla', 'mucho'], target: 'El sol brilla mucho' },
  { level: 3, words: ['Mi', 'mamá', 'cocina', 'bien'], target: 'Mi mamá cocina bien' },
  { level: 4, words: ['El', 'cohete', 'vuela', 'al', 'espacio'], target: 'El cohete vuela al espacio' },
  { level: 5, words: ['Los', 'niños', 'juegan', 'en', 'el', 'parque'], target: 'Los niños juegan en el parque' },
  { level: 6, words: ['Me', 'gusta', 'aprender', 'palabras', 'nuevas'], target: 'Me gusta aprender palabras nuevas' },
  { level: 7, words: ['Hoy', 'voy', 'a', 'jugar', 'con', 'mis', 'amigos'], target: 'Hoy voy a jugar con mis amigos' },
];

export const SentenceTrainGame: React.FC<Props> = ({
  player,
  selectedLevel,
  onMarkWordLearned,
  onWin,
  setProgressPercent,
  setStarsCollected,
  setWordsLearned,
}) => {
  const totalRounds = Math.min(5, 2 + Math.floor(selectedLevel / 2));

  const [roundIdx, setRoundIdx] = useState(0);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [available, setAvailable] = useState<string[]>([]);
  const [targetSentence, setTargetSentence] = useState('');
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const roundRef = useRef(0);
  const starsRef = useRef(0);
  const wordsRef = useRef(0);

  const setupRound = useCallback(
    (rIdx: number) => {
      const candidates = SENTENCE_TEMPLATES.filter((t) => t.level <= selectedLevel + 1);
      const template = candidates[Math.floor(Math.random() * candidates.length)] || SENTENCE_TEMPLATES[0];

      const words = [...template.words];
      const shuffled = [...words].sort(() => Math.random() - 0.5);

      roundRef.current = rIdx;
      setRoundIdx(rIdx);
      setCorrectWords(words);
      setTargetSentence(template.target);
      setSlots(Array(words.length).fill(null));
      setAvailable(shuffled);
      setIsComplete(false);

      void sounds.speakAsync(template.target, 'es-ES', true);
    },
    [selectedLevel]
  );

  useEffect(() => {
    setupRound(0);
  }, [setupRound]);

  const handlePlaceWord = (word: string, slotIndex: number) => {
    if (slots[slotIndex] !== null) return;

    sounds.sfxPop();
    const newSlots = [...slots];
    newSlots[slotIndex] = word;
    setSlots(newSlots);
    setAvailable((prev) => prev.filter((w) => w !== word));

    // Check if complete
    if (newSlots.every((s) => s !== null)) {
      const isCorrect = newSlots.every((w, i) => w === correctWords[i]);
      if (isCorrect) {
        setIsComplete(true);
        sounds.sfxMagic();
        sounds.hapticSuccess();
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.55 } });

        const nextRound = roundRef.current + 1;
        const nextStars = starsRef.current + 4;
        const nextWords = wordsRef.current + 1;
        starsRef.current = nextStars;
        wordsRef.current = nextWords;

        setStarsCollected(nextStars);
        setWordsLearned(nextWords);
        setProgressPercent((nextRound / totalRounds) * 100);

        const isFinal = nextRound >= totalRounds;
        const praise = getPersonalizedPraise(player.name, isFinal);
        setPraiseBanner(praise);

        setTimeout(async () => {
          await sounds.speakPraise(praise);
          setPraiseBanner(null);
          if (isFinal) {
            onWin(1800 + selectedLevel * 220, nextStars, nextWords);
          } else {
            setupRound(nextRound);
          }
        }, 900);
      } else {
        sounds.sfxError();
        // shake and reset after delay
        setTimeout(() => {
          setSlots(Array(correctWords.length).fill(null));
          setAvailable([...correctWords].sort(() => Math.random() - 0.5));
        }, 700);
      }
    }
  };

  const handleRemoveFromSlot = (index: number) => {
    const word = slots[index];
    if (!word || isComplete) return;
    sounds.sfxPop();
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
    setAvailable((prev) => [...prev, word]);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between pt-16 pb-14 px-3 bg-gradient-to-b from-rose-950 via-orange-900 to-amber-950 relative overflow-hidden select-none">
      {/* Progress */}
      <div className="w-full max-w-xl flex justify-center gap-1.5 z-10">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full ${
              i < roundIdx ? 'bg-emerald-400' : i === roundIdx ? 'bg-yellow-400 animate-pulse' : 'bg-white/25'
            }`}
          />
        ))}
      </div>

      {/* Prompt */}
      <div className="w-full max-w-xl bg-white rounded-3xl p-4 shadow-2xl border-b-8 border-rose-200 flex items-center justify-between gap-3 z-10">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black text-rose-600 uppercase mb-0.5">
            🚂 ¡Ordena las palabras del tren!
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-800">
            Forma: « {targetSentence} »
          </div>
        </div>
        <button
          onClick={() => void sounds.speakAsync(targetSentence, 'es-ES', true)}
          className="p-3 rounded-2xl bg-rose-500 text-white shadow-lg border-b-4 border-rose-700 btn-squishy"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      {praiseBanner && (
        <div className="px-5 py-1.5 rounded-full bg-emerald-400 text-slate-950 font-black text-sm shadow-2xl animate-bounce z-20">
          🌟 {praiseBanner}
        </div>
      )}

      {/* Train slots */}
      <div className="w-full max-w-xl flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 z-10">
        {/* Locomotive */}
        <div className="shrink-0 w-16 h-16 rounded-2xl bg-red-500 border-b-4 border-red-700 flex items-center justify-center text-3xl shadow-lg">
          🚂
        </div>
        {slots.map((word, idx) => (
          <button
            key={idx}
            onClick={() => handleRemoveFromSlot(idx)}
            className={`shrink-0 min-w-[70px] h-16 px-2 rounded-2xl border-b-4 flex items-center justify-center font-black text-sm transition-all ${
              word
                ? isComplete
                  ? 'bg-emerald-400 border-emerald-600 text-slate-900'
                  : 'bg-white border-slate-300 text-slate-800'
                : 'bg-white/20 border-white/30 text-white/40 border-dashed'
            }`}
          >
            {word || `•`}
          </button>
        ))}
      </div>

      {/* Available words */}
      <div className="w-full max-w-xl grid grid-cols-3 gap-2 z-10">
        {available.map((word) => (
          <button
            key={word}
            onClick={() => {
              const emptyIdx = slots.findIndex((s) => s === null);
              if (emptyIdx !== -1) handlePlaceWord(word, emptyIdx);
            }}
            className="py-3 px-2 rounded-2xl bg-white border-b-6 border-slate-200 shadow-lg font-black text-sm text-slate-800 btn-squishy active:scale-95"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
};
