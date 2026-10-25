import { useCallback, useRef, useState } from 'react';
import {
  LearningItem,
  selectAdaptiveItems,
  getPersonalizedPraise,
} from '../data/learningData';
import { sounds } from '../audio/soundManager';

export interface AdaptiveRoundConfig {
  pool: LearningItem[];
  selectedLevel: number;
  learnedWordIds: string[];
  missedWordIds: string[];
  optionsCount: number;
  totalRounds: number;
  playerName: string;
  onMarkWordLearned: (id: string) => void;
  onMarkWordMissed?: (id: string) => void;
  onWin: (score: number, stars: number, words: number) => void;
  setProgressPercent: (p: number) => void;
  setStarsCollected: React.Dispatch<React.SetStateAction<number>>;
  setWordsLearned: React.Dispatch<React.SetStateAction<number>>;
  /** Base score multiplier when finishing all rounds */
  winScoreBase?: number;
  winScorePerLevel?: number;
  winScorePerCombo?: number;
}

/**
 * Shared adaptive-round logic used by every mini-game.
 * Guarantees speech is fully finished before advancing.
 */
export function useAdaptiveRound(cfg: AdaptiveRoundConfig) {
  const {
    pool,
    selectedLevel,
    learnedWordIds,
    missedWordIds,
    optionsCount,
    totalRounds,
    playerName,
    onMarkWordLearned,
    onMarkWordMissed,
    onWin,
    setProgressPercent,
    setStarsCollected,
    setWordsLearned,
    winScoreBase = 1600,
    winScorePerLevel = 250,
    winScorePerCombo = 75,
  } = cfg;

  const [roundIdx, setRoundIdx] = useState(0);
  const [target, setTarget] = useState<LearningItem | null>(null);
  const [options, setOptions] = useState<LearningItem[]>([]);
  const [mistakesOnRound, setMistakesOnRound] = useState(0);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [isResolving, setIsResolving] = useState(false);

  const roundRef = useRef(0);
  const starsRef = useRef(0);
  const wordsRef = useRef(0);
  const usedIdsRef = useRef<Set<string>>(new Set());
  const comboRef = useRef(0);

  const setupRound = useCallback(
    async (rIdx: number, speakTarget = true) => {
      const available = pool.filter((i) => !usedIdsRef.current.has(i.id));
      const picked = selectAdaptiveItems(
        available.length > 0 ? available : pool,
        selectedLevel,
        learnedWordIds,
        missedWordIds,
        1
      )[0];

      if (!picked) return null;

      usedIdsRef.current.add(picked.id);

      const distractors = pool
        .filter((i) => i.id !== picked.id)
        .sort(
          (a, b) =>
            Math.abs(a.level - selectedLevel) - Math.abs(b.level - selectedLevel) ||
            Math.random() - 0.5
        )
        .slice(0, Math.max(0, optionsCount - 1));

      const all = [picked, ...distractors].sort(() => Math.random() - 0.5);

      roundRef.current = rIdx;
      setRoundIdx(rIdx);
      setTarget(picked);
      setOptions(all);
      setMistakesOnRound(0);
      setIsResolving(false);
      setPraiseBanner(null);

      if (speakTarget) {
        // Small pause so UI paints first, then speak and wait
        await new Promise((r) => setTimeout(r, 180));
        await sounds.speakAsync(picked.audioText, picked.audioLang, true);
      }

      return { target: picked, options: all };
    },
    [pool, selectedLevel, learnedWordIds, missedWordIds, optionsCount]
  );

  const resetCampaign = useCallback(() => {
    usedIdsRef.current.clear();
    starsRef.current = 0;
    wordsRef.current = 0;
    comboRef.current = 0;
    setCombo(0);
    setRoundIdx(0);
  }, []);

  const handleCorrect = useCallback(
    async (chosen: LearningItem) => {
      if (!target || isResolving) return false;
      setIsResolving(true);

      sounds.sfxMagic();
      sounds.hapticSuccess();
      onMarkWordLearned(target.id);

      const nextCombo = comboRef.current + 1;
      comboRef.current = nextCombo;
      setCombo(nextCombo);

      const nextRound = roundRef.current + 1;
      const nextStars = starsRef.current + 3;
      const nextWords = wordsRef.current + 1;
      starsRef.current = nextStars;
      wordsRef.current = nextWords;

      setStarsCollected(nextStars);
      setWordsLearned(nextWords);
      setProgressPercent((nextRound / totalRounds) * 100);

      const isFinalWin = nextRound >= totalRounds;
      const praise = getPersonalizedPraise(playerName, isFinalWin);
      setPraiseBanner(praise);

      // CRITICAL: wait until both the word and the praise have finished speaking
      await sounds.speakSequence(
        [
          { text: chosen.audioText, lang: chosen.audioLang, pauseAfterMs: 100 },
          { text: praise, lang: 'es-ES', pauseAfterMs: 150 },
        ],
        true
      );

      setPraiseBanner(null);

      if (isFinalWin) {
        onWin(
          winScoreBase + selectedLevel * winScorePerLevel + nextCombo * winScorePerCombo,
          nextStars,
          nextWords
        );
      } else {
        await setupRound(nextRound, true);
      }
      return true;
    },
    [
      target,
      isResolving,
      onMarkWordLearned,
      playerName,
      totalRounds,
      selectedLevel,
      onWin,
      setProgressPercent,
      setStarsCollected,
      setWordsLearned,
      setupRound,
      winScoreBase,
      winScorePerLevel,
      winScorePerCombo,
    ]
  );

  const handleWrong = useCallback(
    async (chosen: LearningItem) => {
      if (!target || isResolving) return;
      sounds.sfxError();
      sounds.hapticError();
      comboRef.current = 0;
      setCombo(0);
      setMistakesOnRound((m) => m + 1);
      if (onMarkWordMissed) onMarkWordMissed(target.id);
      // Teach the word they actually touched
      await sounds.speakAsync(chosen.es || chosen.audioText, 'es-ES', true);
    },
    [target, isResolving, onMarkWordMissed]
  );

  return {
    roundIdx,
    target,
    options,
    mistakesOnRound,
    praiseBanner,
    combo,
    isResolving,
    setIsResolving,
    setupRound,
    resetCampaign,
    handleCorrect,
    handleWrong,
    totalRounds,
    showSmartHint: mistakesOnRound >= 2,
    isReviewWord: target ? missedWordIds.includes(target.id) : false,
  };
}
