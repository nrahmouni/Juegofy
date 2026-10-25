import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { PlayerConfig } from '../../types/game';
import { LearningItem, SPANISH_VOCAB_ITEMS, ALPHABET_LEARNING_ITEMS } from '../../data/learningData';
import { sounds } from '../../audio/soundManager';
import { useAdaptiveRound } from '../../hooks/useAdaptiveRound';

interface Props {
  player: PlayerConfig;
  selectedLevel: number;
  learnedWordIds: string[];
  missedWordIds: string[];
  onMarkWordLearned: (id: string) => void;
  onMarkWordMissed?: (id: string) => void;
  onWin: (score: number, stars: number, words: number) => void;
  setProgressPercent: (n: number) => void;
  starsCollected: number;
  setStarsCollected: (n: number | ((p: number) => number)) => void;
  wordsLearned: number;
  setWordsLearned: (n: number | ((p: number) => number)) => void;
}

type Falling = {
  id: string;
  item: LearningItem;
  x: number; // 0-100 %
  y: number; // 0-100 %
  speed: number;
  isTarget: boolean;
};

const POOL = [...SPANISH_VOCAB_ITEMS, ...ALPHABET_LEARNING_ITEMS];

export const VehiclePilotGame: React.FC<Props> = ({
  player,
  selectedLevel,
  learnedWordIds,
  missedWordIds,
  onMarkWordLearned,
  onMarkWordMissed,
  onWin,
  setProgressPercent,
  setStarsCollected,
  setWordsLearned,
}) => {
  const arenaRef = useRef<HTMLDivElement>(null);
  const vehicleX = useRef(50);
  const [vehiclePos, setVehiclePos] = useState(50);
  const [falling, setFalling] = useState<Falling[]>([]);
  const [vehicleKind, setVehicleKind] = useState<'car' | 'plane'>('car');
  const [boost, setBoost] = useState(false);
  const pointerId = useRef<number | null>(null);
  const raf = useRef<number>(0);
  const lastTs = useRef(0);

  const {
    target,
    setupRound,
    handleCorrect,
    handleWrong,
    praiseBanner,
    combo,
    isResolving,
    showSmartHint,
  } = useAdaptiveRound({
    playerName: player.name,
    selectedLevel,
    learnedWordIds,
    missedWordIds,
    pool: POOL,
    optionsCount: 4,
    totalRounds: 6,
    onMarkWordLearned,
    onMarkWordMissed,
    onWin,
    setProgressPercent,
    setStarsCollected,
    setWordsLearned,
    winScoreBase: 120,
    winScorePerLevel: 18,
    winScorePerCombo: 12,
  });

  // Spawn falling items when target is ready
  useEffect(() => {
    if (!target || isResolving) return;
    const distractors = POOL.filter((p) => p.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const items: Falling[] = [
      {
        id: `t-${target.id}-${Date.now()}`,
        item: target,
        x: 15 + Math.random() * 70,
        y: -10,
        speed: 0.018 + selectedLevel * 0.004,
        isTarget: true,
      },
      ...distractors.map((d, i) => ({
        id: `d-${d.id}-${i}-${Date.now()}`,
        item: d,
        x: 10 + Math.random() * 80,
        y: -20 - i * 18,
        speed: 0.014 + Math.random() * 0.012 + selectedLevel * 0.003,
        isTarget: false,
      })),
    ];
    setFalling(items);
  }, [target, isResolving, selectedLevel]);

  // Animation loop
  useEffect(() => {
    const tick = (ts: number) => {
      const dt = lastTs.current ? Math.min(32, ts - lastTs.current) : 16;
      lastTs.current = ts;
      setFalling((prev) => {
        if (!prev.length) return prev;
        const next = prev
          .map((f) => ({ ...f, y: f.y + f.speed * dt * (boost ? 1.35 : 1) }))
          .filter((f) => f.y < 115);
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [boost]);

  // Collision: vehicle catches item near bottom band
  useEffect(() => {
    if (!target || isResolving) return;
    setFalling((prev) => {
      let hit: Falling | null = null;
      const rest: Falling[] = [];
      for (const f of prev) {
        if (f.y > 72 && f.y < 92 && Math.abs(f.x - vehicleX.current) < 14) {
          hit = f;
        } else {
          rest.push(f);
        }
      }
      if (hit) {
        if (hit.isTarget) {
          confetti({ particleCount: 50, spread: 55, origin: { y: 0.7 } });
          void handleCorrect(hit.item);
        } else {
          void handleWrong(hit.item);
        }
        return rest.filter((f) => f.id !== hit!.id);
      }
      return prev;
    });
  }, [falling, target, isResolving, handleCorrect, handleWrong]);

  const moveToClientX = useCallback((clientX: number) => {
    const el = arenaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(8, Math.min(92, pct));
    vehicleX.current = clamped;
    setVehiclePos(clamped);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    pointerId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    moveToClientX(e.clientX);
    setBoost(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (pointerId.current !== e.pointerId) return;
    moveToClientX(e.clientX);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (pointerId.current !== e.pointerId) return;
    pointerId.current = null;
    setBoost(false);
  };

  useEffect(() => {
    void setupRound(0, true);
  }, [setupRound]);

  const emoji = vehicleKind === 'car' ? '🏎️' : '✈️';

  return (
    <div className="relative w-full h-full flex flex-col select-none touch-none overflow-hidden">
      {/* HUD */}
      <div className="absolute top-2 left-0 right-0 z-20 flex justify-center gap-2 px-3 pointer-events-none">
        <div className="pointer-events-auto flex gap-2 bg-white/90 backdrop-blur rounded-2xl px-3 py-1.5 shadow-lg border border-white/60">
          <button
            type="button"
            onClick={() => {
              sounds.sfxPop();
              setVehicleKind('car');
            }}
            className={`px-3 py-1 rounded-xl text-lg font-black ${vehicleKind === 'car' ? 'bg-amber-400' : 'bg-slate-100'}`}
          >
            🏎️
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.sfxPop();
              setVehicleKind('plane');
            }}
            className={`px-3 py-1 rounded-xl text-lg font-black ${vehicleKind === 'plane' ? 'bg-sky-400' : 'bg-slate-100'}`}
          >
            ✈️
          </button>
          {combo > 1 && (
            <span className="px-2 py-1 rounded-xl bg-rose-500 text-white text-xs font-black self-center">
              x{combo}
            </span>
          )}
        </div>
      </div>

      {target && (
        <div className="absolute top-14 left-0 right-0 z-20 flex justify-center px-4 pointer-events-none">
          <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl shadow-xl font-black text-sm sm:text-base">
            ¡Atrapa {target.emoji} {target.es}!
          </div>
        </div>
      )}

      {praiseBanner && (
        <div className="absolute top-28 left-0 right-0 z-30 flex justify-center pointer-events-none">
          <div className="bg-emerald-500 text-white px-5 py-2 rounded-full font-black shadow-2xl animate-bounce">
            {praiseBanner}
          </div>
        </div>
      )}

      {/* Arena */}
      <div
        ref={arenaRef}
        className="relative flex-1 mx-2 mb-2 mt-1 rounded-[2rem] overflow-hidden border-4 border-white/40 shadow-2xl"
        style={{
          background:
            vehicleKind === 'car'
              ? 'linear-gradient(180deg, #87ceeb 0%, #87ceeb 42%, #4ade80 42%, #22c55e 100%)'
              : 'linear-gradient(180deg, #0ea5e9 0%, #38bdf8 40%, #e0f2fe 100%)',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Road / sky lane */}
        {vehicleKind === 'car' && (
          <div className="absolute left-1/2 -translate-x-1/2 top-[42%] bottom-0 w-[55%] bg-slate-600/90">
            <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 border-l-4 border-dashed border-yellow-300/80" />
          </div>
        )}

        {/* Falling collectibles */}
        {falling.map((f) => (
          <div
            key={f.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-4xl sm:text-5xl drop-shadow-lg transition-transform"
            style={{
              left: `${f.x}%`,
              top: `${f.y}%`,
              filter: f.isTarget && showSmartHint ? 'drop-shadow(0 0 8px gold)' : undefined,
              transform: `translate(-50%, -50%) scale(${f.isTarget ? 1.15 : 1})`,
            }}
          >
            <div className="flex flex-col items-center">
              <span>{f.item.emoji}</span>
              <span className="text-[10px] font-black bg-white/90 rounded-md px-1 mt-0.5 text-slate-800">
                {f.item.es}
              </span>
            </div>
          </div>
        ))}

        {/* Vehicle */}
        <div
          className="absolute bottom-[6%] -translate-x-1/2 transition-transform duration-75 ease-out z-10"
          style={{
            left: `${vehiclePos}%`,
            transform: `translateX(-50%) scale(${boost ? 1.12 : 1})`,
          }}
        >
          <div className="text-5xl sm:text-6xl drop-shadow-2xl">{emoji}</div>
          {boost && <div className="text-center text-xs font-black text-white/90">TURBO</div>}
        </div>

        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] font-bold text-white/80 pointer-events-none">
          Desliza el dedo para pilotar · mantén para turbo
        </div>
      </div>
    </div>
  );
};
