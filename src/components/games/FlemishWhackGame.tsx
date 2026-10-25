import React, { useState, useEffect, useCallback } from 'react';
import { PlayerConfig, ThemeConfig, AgeGroup } from '../../types/game';
import { FLEMISH_LEARNING_ITEMS, LearningItem } from '../../data/learningData';
import { COSTUMES } from '../../data/garage';
import { sounds } from '../../audio/soundManager';
import { speakWord } from '../../audio/speech';
import { Volume2, Sparkles, Star } from 'lucide-react';
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

interface FruitSpot {
  id: number;
  type: 'correct' | 'wrong' | 'bomb' | 'star' | 'empty';
  text?: string;
  emoji?: string;
  isUp: boolean;
  colorBg: string;
}

export const FlemishWhackGame: React.FC<Props> = ({
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
  const targetsToWin = Math.min(8, 2 + selectedLevel);
  const numSpots = selectedLevel <= 2 ? 4 : selectedLevel <= 4 ? 6 : 8;

  const [activeItem, setActiveItem] = useState<LearningItem>(() => {
    return FLEMISH_LEARNING_ITEMS[Math.floor(Math.random() * FLEMISH_LEARNING_ITEMS.length)];
  });

  const [spots, setSpots] = useState<FruitSpot[]>(() =>
    Array.from({ length: numSpots }).map((_, i) => ({
      id: i,
      type: 'empty',
      isUp: false,
      colorBg: 'from-amber-500/20 to-orange-600/30',
    }))
  );

  const [combo, setCombo] = useState<number>(0);
  const [popupMsg, setPopupMsg] = useState<string | null>(null);
  const [clickEffect, setClickEffect] = useState<{ x: number; y: number; text: string } | null>(null);

  const pronounceCurrent = useCallback(() => {
    speakWord(activeItem.audioText, activeItem.audioLang);
  }, [activeItem]);

  useEffect(() => {
    const t = setTimeout(() => pronounceCurrent(), 300);
    return () => clearTimeout(t);
  }, [activeItem, pronounceCurrent]);

  // Pop up fruits & items periodically
  useEffect(() => {
    const popInterval = Math.max(900, 2200 - selectedLevel * 180 - difficulty * 250);

    const timer = setInterval(() => {
      setSpots((prev) => {
        const indices = Array.from({ length: numSpots }).map((_, i) => i).sort(() => Math.random() - 0.5);
        const correctIdx = indices[0];
        const wrongIdx = indices[1];
        const bombOrStarIdx = indices[2];

        const wOpts = activeItem.wrongOptions;
        const wrongOpt = wOpts[Math.floor(Math.random() * wOpts.length)];
        const isBomb = Math.random() < (0.2 + difficulty * 0.1);

        const colors = [
          'from-pink-500/30 to-rose-600/40',
          'from-amber-400/30 to-yellow-600/40',
          'from-emerald-400/30 to-teal-600/40',
          'from-cyan-400/30 to-blue-600/40',
          'from-purple-400/30 to-indigo-600/40',
        ];

        return Array.from({ length: numSpots }).map((_, idx) => {
          const randColor = colors[Math.floor(Math.random() * colors.length)];
          if (idx === correctIdx) {
            return {
              id: idx,
              type: 'correct' as const,
              text: activeItem.targetText,
              emoji: activeItem.emoji,
              isUp: true,
              colorBg: 'from-emerald-500/40 to-green-600/50',
            };
          } else if (idx === wrongIdx) {
            return {
              id: idx,
              type: 'wrong' as const,
              text: wrongOpt.text,
              emoji: wrongOpt.emoji,
              isUp: true,
              colorBg: 'from-amber-500/35 to-orange-600/45',
            };
          } else if (idx === bombOrStarIdx && selectedLevel >= 2) {
            return {
              id: idx,
              type: (isBomb ? 'bomb' : 'star') as 'bomb' | 'star',
              text: isBomb ? '💣' : '⭐',
              emoji: isBomb ? '💣' : '⭐',
              isUp: true,
              colorBg: isBomb ? 'from-rose-500/40 to-red-700/50' : 'from-yellow-400/40 to-amber-500/50',
            };
          } else {
            return {
              id: idx,
              type: 'empty' as const,
              isUp: false,
              colorBg: randColor,
            };
          }
        });
      });
    }, popInterval);

    return () => clearInterval(timer);
  }, [activeItem, difficulty, numSpots, selectedLevel]);

  // Click / tap handler on fruit basket
  const handleSpotClick = (spot: FruitSpot, e: React.MouseEvent | React.TouchEvent) => {
    if (!spot.isUp || spot.type === 'empty') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = rect.left + rect.width / 2;
    const clickY = rect.top + rect.height / 2;

    // Hide tapped spot immediately
    setSpots((prev) =>
      prev.map((s) => (s.id === spot.id ? { ...s, isUp: false, type: 'empty' } : s))
    );

    if (spot.type === 'correct') {
      const newCombo = combo + 1;
      setCombo(newCombo);
      const nextWords = wordsLearned + 1;
      setWordsLearned(nextWords);
      setProgressPercent(Math.min(100, (nextWords / targetsToWin) * 100));

      sounds.sfxWin();
      speakWord(activeItem.audioText, activeItem.audioLang);

      setClickEffect({ x: clickX, y: clickY, text: `+${20 * newCombo} 🪙 ⭐` });
      setTimeout(() => setClickEffect(null), 800);

      setPopupMsg(`¡Goed zo! (${activeItem.targetText}) 🌟`);
      setTimeout(() => setPopupMsg(null), 900);

      setStarsCollected((prev) => prev + 1);

      if (nextWords >= targetsToWin) {
        const score = nextWords * 80 + starsCollected * 20 + 150;
        onWin(score, starsCollected, nextWords);
        return;
      }

      // Next Flemish Word
      const remaining = FLEMISH_LEARNING_ITEMS.filter((i) => i.id !== activeItem.id);
      setActiveItem(remaining[Math.floor(Math.random() * remaining.length)]);
    } else if (spot.type === 'star') {
      sounds.sfxWin();
      setStarsCollected((prev) => prev + 1);
      setClickEffect({ x: clickX, y: clickY, text: '+1 ⭐' });
      setTimeout(() => setClickEffect(null), 800);
    } else if (spot.type === 'bomb') {
      setCombo(0);
      sounds.sfxBoing();
      setPopupMsg('¡Bomba! Cuidado 💣');
      setTimeout(() => setPopupMsg(null), 900);
      onLose('bomb', wordsLearned * 50, starsCollected, (wordsLearned / targetsToWin) * 100);
    } else {
      // Wrong item
      setCombo(0);
      sounds.sfxBoing();
      setPopupMsg('¡Ups! Busca la fruta correcta ❌');
      setTimeout(() => setPopupMsg(null), 800);
    }
  };

  const cosObj = COSTUMES.find((c) => c.id === (player.selectedCostume || 'none'));

  return (
    <div className="relative w-full max-w-xl h-full flex flex-col items-center justify-between p-3 select-none">
      <ThemeVocabularyBanner modeKey="flemish" />

      {/* Top Target Prompt Banner */}
      <div className="w-full flex flex-col items-center mt-2 z-20">
        <div
          onClick={pronounceCurrent}
          className="cursor-pointer px-6 py-3 rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-2xl border-4 border-white flex items-center gap-4 animate-bounce max-w-[94vw]"
        >
          <span className="text-4xl animate-pulse">{activeItem.emoji}</span>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-[11px] font-black uppercase text-amber-950 tracking-wider">
              Vlaams Avontuur (Niv {selectedLevel}) - ¡Toca la fruta o color correcto!:
            </span>
            <div className="flex items-center gap-2 font-black text-slate-950 text-2xl leading-tight">
              <span className="bg-white/80 px-2.5 py-0.5 rounded-xl shadow-xs">{activeItem.es}</span>
              <span className="text-rose-700 text-2xl">➔</span>
              <span className="text-rose-800 text-3xl font-black underline decoration-amber-600">{activeItem.targetText}</span>
              <Volume2 className="w-6 h-6 text-slate-900 shrink-0 ml-1 hover:scale-125 transition" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs font-black text-white bg-black/60 px-4 py-1 rounded-full shadow-md backdrop-blur-xs">
            Frutas Recogidas: {wordsLearned} / {targetsToWin}
          </span>
          {combo > 1 && (
            <span className="text-xs font-black text-yellow-300 bg-amber-950/90 px-3 py-1 rounded-full border-2 border-yellow-400 shadow-lg animate-pulse">
              🔥 {combo}x COMBO!
            </span>
          )}
        </div>
      </div>

      {/* Interactive Fruit Baskets / Magic Spots Grid */}
      <div className={`w-full my-auto grid ${numSpots <= 4 ? 'grid-cols-2' : numSpots <= 6 ? 'grid-cols-3' : 'grid-cols-4'} gap-4 px-3 z-10`}>
        {spots.map((spot) => {
          return (
            <button
              key={spot.id}
              onClick={(e) => handleSpotClick(spot, e)}
              className={`relative h-32 sm:h-36 rounded-3xl bg-gradient-to-b ${spot.colorBg} border-4 border-white/60 shadow-xl flex flex-col items-center justify-center overflow-hidden cursor-pointer active:scale-95 transition hover:scale-105 group`}
            >
              {/* Magic Crate / Basket Base */}
              <div className="absolute bottom-0 w-full h-10 bg-amber-900/60 rounded-b-2xl border-t-2 border-amber-600/60 flex items-center justify-center">
                <span className="text-[10px] font-black text-amber-200 tracking-widest uppercase">🧺 Cesta Mágica</span>
              </div>

              {spot.isUp && spot.type !== 'empty' && (
                <div className="absolute inset-x-2 top-2 bottom-12 flex flex-col items-center justify-center animate-in zoom-in duration-200 z-20">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white shadow-2xl border-4 border-amber-300 flex flex-col items-center justify-center p-2 group-hover:rotate-6 transition">
                    <span className="text-4xl sm:text-5xl drop-shadow-md select-none">{spot.emoji}</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900 text-center truncate w-full mt-1 bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-300">
                      {spot.text}
                    </span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Popup Notification */}
      {popupMsg && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 px-6 py-3.5 rounded-3xl bg-white shadow-2xl border-4 border-amber-400 font-black text-xl text-amber-950 animate-bounce">
          {popupMsg}
        </div>
      )}

      {/* Click Sparkle Effect */}
      {clickEffect && (
        <div
          className="fixed pointer-events-none z-50 animate-out fade-out zoom-out duration-500 font-black text-2xl text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          style={{ left: clickEffect.x - 30, top: clickEffect.y - 30 }}
        >
          ✨ {clickEffect.text}
        </div>
      )}

      {/* Player Mascot Footer */}
      <div className="w-full flex items-center justify-center mb-2 z-10">
        <div className="flex items-center gap-2.5 bg-white/95 px-5 py-2 rounded-full shadow-xl border-2 border-amber-300">
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
          <div className="text-xs font-black text-slate-900">
            ¡Toca la fruta o color correcto, {player.name}! 🍎✨
          </div>
        </div>
      </div>
    </div>
  );
};
