import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Flame, Sparkles, HelpCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { PlayerConfig } from '../../types/game';
import {
  LearningItem,
  selectAdaptiveItems,
  getPersonalizedPraise,
  SPANISH_VOCAB_ITEMS,
} from '../../data/learningData';
import { sounds } from '../../audio/soundManager';

interface Props {
  player: PlayerConfig;
  items?: LearningItem[];
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

const PLANET_STOPS = [
  { name: 'Luna de Queso', emoji: '🌙' },
  { name: 'Marte Rojo', emoji: '🔴' },
  { name: 'Saturno Anillado', emoji: '🪐' },
  { name: 'Galaxia Arcoíris', emoji: '🌌' },
  { name: 'Estrella Dorada', emoji: '🌟' },
  { name: 'Supernova Solar', emoji: '☀️' },
];

export const RocketRaceGame: React.FC<Props> = ({
  player,
  items = SPANISH_VOCAB_ITEMS,
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
  const totalStops = Math.min(6, 3 + Math.floor(selectedLevel / 2));

  const [stopIdx, setStopIdx] = useState(0);
  const [target, setTarget] = useState<LearningItem | null>(null);
  const [lanePods, setLanePods] = useState<LearningItem[]>([]); // 3 lanes (left=0, center=1, right=2)
  const [rocketLane, setRocketLane] = useState<number>(1);
  const [isBoosting, setIsBoosting] = useState(false);
  const [laserActive, setLaserActive] = useState(false);
  const [wrongPodId, setWrongPodId] = useState<string | null>(null);
  const [mistakesOnStop, setMistakesOnStop] = useState(0);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);

  const stopRef = useRef(0);
  const starsRef = useRef(0);
  const wordsRef = useRef(0);
  const usedIdsRef = useRef<Set<string>>(new Set());

  const setupStop = useCallback(
    (sIdx: number) => {
      const available = items.filter((i) => !usedIdsRef.current.has(i.id));
      const picked = selectAdaptiveItems(
        available.length > 0 ? available : items,
        selectedLevel,
        learnedWordIds,
        missedWordIds,
        1
      )[0];

      if (!picked) return;
      usedIdsRef.current.add(picked.id);

      const distractors = items
        .filter((i) => i.id !== picked.id)
        .sort((a, b) => Math.abs(a.level - selectedLevel) - Math.abs(b.level - selectedLevel) || Math.random() - 0.5)
        .slice(0, 2);

      const pods = [picked, ...distractors].sort(() => Math.random() - 0.5);

      stopRef.current = sIdx;
      setStopIdx(sIdx);
      setTarget(picked);
      setLanePods(pods);
      setIsBoosting(false);
      setLaserActive(false);
      setWrongPodId(null);
      setMistakesOnStop(0);

      setTimeout(() => {
        sounds.speak(`¡Pilota hacia: ${picked.es}!`, 'es-ES');
      }, 260);
    },
    [items, selectedLevel, learnedWordIds, missedWordIds]
  );

  useEffect(() => {
    usedIdsRef.current.clear();
    setupStop(0);
  }, [setupStop]);

  const handleSelectLane = (laneIndex: number, pod: LearningItem) => {
    if (!target || isBoosting) return;

    // Move the rocket to the selected lane & fire laser beam!
    setRocketLane(laneIndex);
    setLaserActive(true);
    sounds.sfxWhoosh();
    // Immediately pronounce the selected orb aloud!
    sounds.speak(pod.audioText, pod.audioLang);

    if (pod.id === target.id) {
      setIsBoosting(true);
      sounds.sfxNitro();
      sounds.sfxMagic();
      onMarkWordLearned(target.id);

      confetti({
        particleCount: 55,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#06b6d4', '#facc15', '#ec4899', '#34d399'],
      });

      const nextStop = stopRef.current + 1;
      const nextStars = starsRef.current + 3;
      const nextWords = wordsRef.current + 1;
      starsRef.current = nextStars;
      wordsRef.current = nextWords;

      setStarsCollected(nextStars);
      setWordsLearned(nextWords);
      setProgressPercent((nextStop / totalStops) * 100);

      const praise = getPersonalizedPraise(player.name, nextStop >= totalStops);
      setPraiseBanner(praise);

      setTimeout(() => {
        sounds.speak(praise, 'es-ES', false);
      }, 650);

      setTimeout(() => {
        setPraiseBanner(null);
        if (nextStop >= totalStops) {
          onWin(1750 + selectedLevel * 250, nextStars, nextWords);
        } else {
          setupStop(nextStop);
        }
      }, 1750);
    } else {
      sounds.sfxError();
      setWrongPodId(pod.id);
      setMistakesOnStop((m) => m + 1);
      if (onMarkWordMissed) {
        onMarkWordMissed(target.id);
      }
      setTimeout(() => {
        setWrongPodId(null);
        setLaserActive(false);
      }, 600);
    }
  };

  if (!target) return null;

  const isReviewWord = missedWordIds.includes(target.id);
  const showSmartHint = mistakesOnStop >= 2;
  const rocketProgressPct = Math.min(92, 8 + (stopIdx / totalStops) * 84);
  const lanePositionsPct = [16.66, 50, 83.33];

  return (
    <div className="w-full h-full flex flex-col items-center justify-between pt-16 pb-16 px-3 sm:px-6 bg-gradient-to-b from-slate-950 via-indigo-950 to-cyan-950 relative overflow-hidden select-none">
      {/* Top Planetary Progress Map */}
      <div className="w-full max-w-2xl bg-slate-900/90 border-2 border-cyan-400/40 rounded-3xl p-2.5 sm:p-3.5 shadow-2xl relative z-10">
        <div className="flex items-center justify-between text-[10px] font-black text-cyan-300 uppercase tracking-wider mb-1.5">
          <span>🚀 Comandante: {player.name}</span>
          <span>
            Planeta {stopIdx + 1} de {totalStops}
          </span>
        </div>

        <div className="relative h-11 sm:h-12 flex items-center justify-between px-4 bg-slate-950/80 rounded-2xl border border-white/10 overflow-hidden">
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-cyan-400 via-yellow-400 to-pink-500 rounded-full transition-all duration-700"
            style={{ width: `${rocketProgressPct}%` }}
          />
          {PLANET_STOPS.slice(0, totalStops).map((planet, idx) => {
            const reached = idx < stopIdx;
            const current = idx === stopIdx;
            return (
              <div
                key={planet.name}
                className={`relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-lg sm:text-xl transition-all ${
                  reached
                    ? 'bg-emerald-500 scale-105 shadow-lg'
                    : current
                    ? 'bg-yellow-400 scale-120 ring-4 ring-yellow-300/50 animate-pulse'
                    : 'bg-slate-800 opacity-60'
                }`}
              >
                {planet.emoji}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mission Control Prompt */}
      <div className="w-full max-w-xl flex flex-col items-center z-10 my-1">
        <div className="w-full bg-white rounded-3xl p-3 sm:p-4 shadow-2xl border-b-8 border-cyan-200 flex items-center justify-between gap-3">
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest">
                ⚡ Mueve el Cohete al Astro Correcto
              </span>
              {isReviewWord && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-black uppercase flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Repaso Inteligente
                </span>
              )}
            </div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 uppercase leading-tight truncate">
              « {target.targetText} »
            </div>
            {target.subText && (
              <div className="text-xs font-bold text-slate-500 truncate">Pista: {target.subText}</div>
            )}
          </div>

          <button
            onClick={() => sounds.speak(target.audioText, target.audioLang)}
            className="p-3.5 rounded-2xl bg-cyan-500 text-white shadow-lg border-b-4 border-cyan-700 btn-squishy shrink-0"
            aria-label="Escuchar misión espacial"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>

        {showSmartHint && (
          <div className="mt-1.5 px-4 py-1 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 animate-bounce">
            <HelpCircle className="w-4 h-4" />
            <span>🦉 Profe Búho: ¡Lleva el cohete al carril de {target.emoji} ({target.es})!</span>
          </div>
        )}

        {praiseBanner && (
          <div className="mt-1.5 px-5 py-1.5 rounded-full bg-emerald-400 text-slate-950 font-black text-sm sm:text-base shadow-2xl border-2 border-white animate-bounce">
            🚀 {praiseBanner}
          </div>
        )}
      </div>

      {/* 3-Lane Interactive Space Cockpit & Floating Astros */}
      <div className="w-full max-w-2xl flex-1 flex flex-col justify-between min-h-0 my-1 z-10">
        {/* 3 Space Lanes with Astros */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 my-auto">
          {lanePods.map((pod, laneIdx) => {
            const isChosenCorrect = isBoosting && pod.id === target.id;
            const isWrong = wrongPodId === pod.id;
            const isHinted = showSmartHint && pod.id === target.id;
            const isRocketHere = rocketLane === laneIdx;
            return (
              <button
                key={pod.id}
                onClick={() => handleSelectLane(laneIdx, pod)}
                className={`relative rounded-3xl p-3 sm:p-5 bg-white/95 border-b-8 shadow-2xl flex flex-col items-center justify-center transition-all btn-squishy ${
                  isChosenCorrect
                    ? 'bg-emerald-100 border-emerald-500 scale-110 ring-4 ring-emerald-400 -translate-y-2'
                    : isWrong
                    ? 'bg-rose-100 border-rose-500 animate-shake'
                    : isHinted
                    ? 'border-amber-400 ring-4 ring-amber-400 animate-bounce'
                    : isRocketHere
                    ? 'border-cyan-400 ring-2 ring-cyan-300/60'
                    : 'border-slate-300 hover:border-cyan-400'
                }`}
              >
                <span className="text-4xl sm:text-6xl mb-1 animate-float">{pod.emoji}</span>
                <span className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight text-center leading-tight line-clamp-2">
                  {pod.es}
                </span>
              </button>
            );
          })}
        </div>

        {/* Steerable Player Rocket Ship at Bottom of Lanes */}
        <div className="relative w-full h-20 sm:h-24 bg-slate-900/60 rounded-3xl border border-cyan-500/30 flex items-center overflow-hidden">
          {/* Left / Right Steering Buttons for extra tactile fun */}
          <button
            onClick={() => {
              sounds.sfxPop();
              setRocketLane((l) => Math.max(0, l - 1));
            }}
            className="z-20 ml-2 p-2.5 rounded-2xl bg-white/10 text-cyan-300 hover:bg-white/20 btn-squishy"
            aria-label="Mover cohete a la izquierda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Animated Rocket Ship */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 flex flex-col items-center ${
              isBoosting ? '-translate-y-14 scale-125' : ''
            }`}
            style={{ left: `${lanePositionsPct[rocketLane]}%` }}
          >
            {/* Laser beam when firing */}
            {laserActive && (
              <div className="w-2 h-16 bg-gradient-to-t from-cyan-400 via-yellow-300 to-transparent rounded-full -mt-14 animate-pulse" />
            )}
            <div className="px-3.5 py-1.5 rounded-full bg-gradient-to-b from-white to-cyan-100 shadow-2xl border-4 border-cyan-400 flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl">{player.fallbackEmoji}</span>
              <span className="text-2xl sm:text-3xl -rotate-45">🚀</span>
            </div>
            <div className="flex items-center -mt-1">
              <Flame
                className={`w-6 h-6 text-orange-500 fill-yellow-300 ${
                  isBoosting ? 'scale-150 animate-ping' : 'animate-pulse'
                }`}
              />
            </div>
          </div>

          <button
            onClick={() => {
              sounds.sfxPop();
              setRocketLane((l) => Math.min(2, l + 1));
            }}
            className="z-20 mr-2 ml-auto p-2.5 rounded-2xl bg-white/10 text-cyan-300 hover:bg-white/20 btn-squishy"
            aria-label="Mover cohete a la derecha"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
