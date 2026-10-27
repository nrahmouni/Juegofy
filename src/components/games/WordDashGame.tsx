import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Heart } from 'lucide-react';
import { PlayerConfig } from '../../types/game';
import {
  LearningItem,
  selectAdaptiveItems,
  getPersonalizedPraise,
  SPANISH_VOCAB_ITEMS,
} from '../../data/learningData';
import { sounds } from '../../audio/soundManager';
import { TutorialHint } from '../common/TutorialHint';

interface Props {
  player: PlayerConfig;
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

type Entity =
  | { kind: 'word'; id: string; item: LearningItem; lane: number; y: number; isTarget: boolean }
  | { kind: 'rock'; id: string; lane: number; y: number };

/**
 * Word Dash — endless-style skill game:
 * world scrolls toward you, change lanes, dodge rocks, catch ONLY the target word.
 * Lives, speed ramp, real fail states. Not a multiple-choice quiz.
 */
export const WordDashGame: React.FC<Props> = ({
  player,
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
  const targetsToWin = Math.min(6, 3 + Math.floor(selectedLevel / 2));
  const maxLives = 3;

  const [lane, setLane] = useState(1);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [target, setTarget] = useState<LearningItem | null>(null);
  const [lives, setLives] = useState(maxLives);
  const [caught, setCaught] = useState(0);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(0.028 + selectedLevel * 0.003);
  const [running, setRunning] = useState(true);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [distance, setDistance] = useState(0);

  const laneRef = useRef(1);
  const targetRef = useRef<LearningItem | null>(null);
  const speedRef = useRef(speed);
  const runningRef = useRef(true);
  const livesRef = useRef(maxLives);
  const caughtRef = useRef(0);
  const scoreRef = useRef(0);
  const usedIds = useRef<Set<string>>(new Set());
  const spawnAcc = useRef(0);
  const lastTs = useRef(0);
  const raf = useRef(0);
  const invulnUntil = useRef(0);
  const starsRef = useRef(0);
  const wordsRef = useRef(0);

  useEffect(() => { laneRef.current = lane; }, [lane]);
  useEffect(() => { targetRef.current = target; }, [target]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { caughtRef.current = caught; }, [caught]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const pickNewTarget = useCallback(() => {
    const pool = SPANISH_VOCAB_ITEMS;
    const available = pool.filter((i) => !usedIds.current.has(i.id));
    const picked = selectAdaptiveItems(
      available.length ? available : pool,
      selectedLevel,
      learnedWordIds,
      missedWordIds,
      1
    )[0];
    if (!picked) return null;
    usedIds.current.add(picked.id);
    return picked;
  }, [selectedLevel, learnedWordIds, missedWordIds]);

  useEffect(() => {
    const t = pickNewTarget();
    if (t) {
      setTarget(t);
      void (async () => {
        await new Promise((r) => setTimeout(r, 250));
        await sounds.speakPrompt(t, 'catch');
      })();
    }
  }, [pickNewTarget]);

  const finishWin = useCallback(async () => {
    runningRef.current = false;
    setRunning(false);
    const t = targetRef.current;
    if (t) onMarkWordLearned(t.id);
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    const praise = getPersonalizedPraise(player.name, true);
    setPraiseBanner(praise);
    starsRef.current = Math.max(starsRef.current, 3 + caughtRef.current);
    wordsRef.current = Math.max(1, Math.floor(caughtRef.current / 2) + 1);
    setStarsCollected(starsRef.current);
    setWordsLearned(wordsRef.current);
    setProgressPercent(100);
    await sounds.speakPraise(praise);
    onWin(1800 + scoreRef.current + selectedLevel * 200, starsRef.current, wordsRef.current);
  }, [onMarkWordLearned, onWin, player.name, selectedLevel, setProgressPercent, setStarsCollected, setWordsLearned]);

  const finishLose = useCallback(async () => {
    runningRef.current = false;
    setRunning(false);
    sounds.sfxError();
    setPraiseBanner('¡Sin vidas! Inténtalo otra vez');
    await sounds.speakPraise('¡Casi! Prueba otra vez');
    // Still report a soft result so the turn flow continues
    onWin(Math.max(200, scoreRef.current), Math.max(0, starsRef.current), wordsRef.current);
  }, [onWin]);

  // Main loop
  useEffect(() => {
    const tick = (ts: number) => {
      const dt = lastTs.current ? Math.min(40, ts - lastTs.current) : 16;
      lastTs.current = ts;

      if (runningRef.current) {
        setDistance((d) => d + speedRef.current * dt * 0.15);
        spawnAcc.current += dt;

        // Spawn cadence
        const spawnEvery = Math.max(420, 900 - selectedLevel * 40);
        if (spawnAcc.current >= spawnEvery) {
          spawnAcc.current = 0;
          setEntities((prev) => {
            const lanePick = Math.floor(Math.random() * 3);
            const roll = Math.random();
            const t = targetRef.current;
            let next: Entity;
            const id = `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            if (roll < 0.28 || !t) {
              next = { kind: 'rock', id, lane: lanePick, y: -12 };
            } else if (roll < 0.55) {
              // target word
              next = {
                kind: 'word',
                id,
                item: t,
                lane: lanePick,
                y: -12,
                isTarget: true,
              };
            } else {
              // distractor
              const pool = SPANISH_VOCAB_ITEMS.filter((i) => i.id !== t.id);
              const item = pool[Math.floor(Math.random() * pool.length)] || t;
              next = {
                kind: 'word',
                id,
                item,
                lane: lanePick,
                y: -12,
                isTarget: false,
              };
            }
            return [...prev, next].slice(-18);
          });
        }

        // Move + collide
        setEntities((prev) => {
          const catchY = 78;
          const hitY = 74;
          let hitRock = false;
          let collected: Entity | null = null;
          const moved = prev.map((e) => ({ ...e, y: e.y + speedRef.current * dt }));

          for (const e of moved) {
            if (e.y < hitY || e.y > hitY + 18) continue;
            if (e.lane !== laneRef.current) continue;
            if (e.kind === 'rock') hitRock = true;
            if (e.kind === 'word' && !collected) collected = e;
          }

          if (hitRock && Date.now() > invulnUntil.current) {
            invulnUntil.current = Date.now() + 900;
            queueMicrotask(() => {
              sounds.sfxError();
              sounds.hapticError();
              setShake(true);
              setTimeout(() => setShake(false), 400);
              setLives((L) => {
                const n = L - 1;
                livesRef.current = n;
                if (n <= 0) void finishLose();
                return n;
              });
              setSpeed((s) => Math.max(0.02, s * 0.92));
            });
          }

          if (collected && collected.kind === 'word' && Date.now() > invulnUntil.current - 400) {
            const c = collected;
            queueMicrotask(() => {
              if (c.isTarget) {
                sounds.sfxMagic();
                sounds.hapticSuccess();
                confetti({ particleCount: 30, spread: 50, origin: { y: 0.75 } });
                const nCaught = caughtRef.current + 1;
                caughtRef.current = nCaught;
                setCaught(nCaught);
                const nScore = scoreRef.current + 100 + Math.floor(speedRef.current * 1000);
                scoreRef.current = nScore;
                setScore(nScore);
                setProgressPercent(Math.min(99, (nCaught / targetsToWin) * 100));
                setSpeed((s) => s + 0.0025);
                starsRef.current += 1;
                setStarsCollected(starsRef.current);

                if (nCaught >= targetsToWin) {
                  void finishWin();
                } else {
                  // New target mid-run
                  const nt = pickNewTarget();
                  if (nt) {
                    setTarget(nt);
                    void sounds.speakPrompt(nt, 'catch');
                  }
                }
              } else {
                sounds.sfxPop(0.8);
                // wrong word: small penalty, no life loss
                setScore((s) => Math.max(0, s - 15));
                if (targetRef.current && onMarkWordMissed) onMarkWordMissed(targetRef.current.id);
              }
            });
            return moved.filter((e) => e.id !== c.id && e.y < 115);
          }

          return moved.filter((e) => e.y < 115);
        });
      }

      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [finishLose, finishWin, onMarkWordMissed, pickNewTarget, selectedLevel, setProgressPercent, setStarsCollected, targetsToWin]);

  const shift = (dir: -1 | 1) => {
    setLane((L) => {
      const n = Math.max(0, Math.min(2, L + dir));
      if (n !== L) sounds.sfxPop(1.08);
      return n;
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const next = pct < 0.33 ? 0 : pct < 0.66 ? 1 : 2;
    if (next !== laneRef.current) {
      sounds.sfxPop(1.05);
      setLane(next);
    }
  };

  const lanePct = [16.66, 50, 83.33];

  return (
    <div className={`w-full h-full flex flex-col relative overflow-hidden select-none touch-none ${shake ? 'shake' : ''}`}>
      {/* HUD */}
      <div className="absolute top-2 left-0 right-0 z-30 flex flex-col items-center gap-1 px-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/80 text-white rounded-2xl px-3 py-1.5 shadow-xl border border-white/20">
          <div className="flex gap-0.5">
            {Array.from({ length: maxLives }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 ${i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-600'}`}
              />
            ))}
          </div>
          <div className="text-xs font-black tabular-nums">⭐ {score}</div>
          <div className="text-xs font-black tabular-nums text-emerald-300">
            {caught}/{targetsToWin}
          </div>
          <button
            type="button"
            className="p-1.5 rounded-full bg-indigo-600"
            onClick={() => target && void sounds.speakPrompt(target, 'catch')}
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        {target && (
          <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-2xl font-black text-sm shadow-lg border-2 border-white/20">
            ¡Atrapa {target.emoji} {target.es}! · esquiva 🪨
          </div>
        )}
        {praiseBanner && (
          <div className="bg-yellow-400 text-slate-900 px-4 py-1.5 rounded-full font-black text-sm animate-bounce">
            {praiseBanner}
          </div>
        )}
        {caught === 0 && running && (
          <TutorialHint text="Cambia de carril · esquiva rocas · atrapa solo la palabra" gesture="swipe" />
        )}
      </div>

      {/* Track */}
      <div
        className="relative flex-1 mx-1 mb-1 rounded-[1.5rem] overflow-hidden border-4 border-white/40 shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #38bdf8 0%, #7dd3fc 36%, #4ade80 36%, #22c55e 100%)',
        }}
        onPointerDown={onPointerDown}
      >
        {/* scrolling road */}
        <div className="absolute left-[10%] right-[10%] top-[36%] bottom-0 bg-slate-700">
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 border-l-4 border-dashed border-yellow-300/90 road-dash-anim"
            style={{ backgroundSize: '100% 40px' }}
          />
        </div>

        {/* lane highlights */}
        <div className="absolute inset-0 flex pointer-events-none">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex-1 ${lane === i ? 'bg-white/10' : ''}`}
            />
          ))}
        </div>

        {/* entities */}
        {entities.map((e) => (
          <div
            key={e.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: `${lanePct[e.lane]}%`, top: `${e.y}%` }}
          >
            {e.kind === 'rock' ? (
              <div className="text-4xl sm:text-5xl drop-shadow-lg">🪨</div>
            ) : (
              <div
                className={`flex flex-col items-center px-2 py-1.5 rounded-2xl bg-white shadow-xl border-b-4 ${
                  e.isTarget ? 'border-indigo-500 ring-2 ring-amber-300' : 'border-slate-300 opacity-90'
                }`}
              >
                <span className="text-3xl sm:text-4xl leading-none">{e.item.emoji}</span>
                <span className="text-[10px] font-black text-slate-800 max-w-[72px] truncate">
                  {e.item.es}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* player */}
        <div
          className="absolute bottom-[4%] z-20 -translate-x-1/2 transition-all duration-100"
          style={{ left: `${lanePct[lane]}%` }}
        >
          <div className="text-6xl sm:text-7xl drop-shadow-2xl leading-none">🏃</div>
        </div>

        {/* side controls */}
        <div className="absolute inset-x-0 bottom-16 flex justify-between px-3 z-30 pointer-events-none">
          <button
            type="button"
            className="pointer-events-auto w-14 h-14 rounded-full bg-white/90 text-2xl font-black shadow-xl border-b-4 border-slate-300 active:scale-95"
            onClick={() => shift(-1)}
          >
            ◀
          </button>
          <button
            type="button"
            className="pointer-events-auto w-14 h-14 rounded-full bg-white/90 text-2xl font-black shadow-xl border-b-4 border-slate-300 active:scale-95"
            onClick={() => shift(1)}
          >
            ▶
          </button>
        </div>

        <div className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-bold text-white drop-shadow z-20 pointer-events-none">
          Distancia {Math.floor(distance)}m · velocidad {(speed * 100).toFixed(0)}
        </div>
      </div>
    </div>
  );
};
