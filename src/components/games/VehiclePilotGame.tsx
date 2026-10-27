import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, HelpCircle } from 'lucide-react';
import { PlayerConfig } from '../../types/game';
import { VEHICLES, COSTUMES } from '../../data/garage';
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
import { TutorialHint } from '../common/TutorialHint';
import { MascotBuddy } from '../common/MascotBuddy';

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

type LangFilter = 'es' | 'fl' | 'ar' | 'fr';

const LANG_POOLS: Record<LangFilter, { label: string; flag: string; items: LearningItem[] }> = {
  es: { label: 'Español', flag: '🇪🇸', items: SPANISH_VOCAB_ITEMS },
  fl: { label: 'Flamenco', flag: '🇧🇪', items: FLEMISH_LEARNING_ITEMS },
  ar: { label: 'Árabe', flag: '🇸🇦', items: ARABIC_LEARNING_ITEMS },
  fr: { label: 'Francés', flag: '🇫🇷', items: FRENCH_LEARNING_ITEMS },
};

type LanePod = {
  item: LearningItem;
  lane: number;
  y: number;
  speed: number;
};

export const VehiclePilotGame: React.FC<Props> = ({
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
  const totalRounds = Math.min(6, 3 + Math.floor(selectedLevel / 2));
  const [langKey, setLangKey] = useState<LangFilter>('es');
  const [vehicleKind, setVehicleKind] = useState<'car' | 'plane'>('car');
  const [lane, setLane] = useState(1);
  const [pods, setPods] = useState<LanePod[]>([]);
  const [target, setTarget] = useState<LearningItem | null>(null);
  const [roundIdx, setRoundIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [flashLane, setFlashLane] = useState<'good' | 'bad' | null>(null);

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const isResolving = useRef(false);
  const laneRef = useRef(1);
  const starsRef = useRef(0);
  const wordsRef = useRef(0);
  const usedIds = useRef<Set<string>>(new Set());
  const rafRef = useRef(0);
  const lastTs = useRef(0);
  const targetRef = useRef<LearningItem | null>(null);
  const comboRef = useRef(0);
  const roundRef = useRef(0);
  const langRef = useRef<LangFilter>('es');

  useEffect(() => { laneRef.current = lane; }, [lane]);
  useEffect(() => { targetRef.current = target; }, [target]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { roundRef.current = roundIdx; }, [roundIdx]);
  useEffect(() => { langRef.current = langKey; }, [langKey]);

  const setupRound = useCallback(
    (rIdx: number, activeLang: LangFilter) => {
      isResolving.current = false;
      setFlashLane(null);
      setPraiseBanner(null);
      const pool = LANG_POOLS[activeLang].items;
      const available = pool.filter((i) => !usedIds.current.has(i.id));
      const picked = selectAdaptiveItems(
        available.length ? available : pool,
        selectedLevel,
        learnedWordIds,
        missedWordIds,
        1
      )[0];
      if (!picked) return;
      usedIds.current.add(picked.id);

      const distractors = pool
        .filter((i) => i.id !== picked.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

      const lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
      const items = [picked, ...distractors];
      const nextPods: LanePod[] = items.map((item, i) => ({
        item,
        lane: lanes[i],
        y: -10 - i * 24,
        speed: 0.02 + selectedLevel * 0.003 + Math.random() * 0.008,
      }));

      setTarget(picked);
      setPods(nextPods);
      setRoundIdx(rIdx);
      setMistakes(0);

      void (async () => {
        await new Promise((r) => setTimeout(r, 200));
        await sounds.speakPrompt(picked, 'catch');
      })();
    },
    [selectedLevel, learnedWordIds, missedWordIds]
  );

  const setupRoundRef = useRef(setupRound);
  useEffect(() => { setupRoundRef.current = setupRound; }, [setupRound]);

  useEffect(() => {
    usedIds.current.clear();
    starsRef.current = 0;
    wordsRef.current = 0;
    comboRef.current = 0;
    setCombo(0);
    setupRound(0, langKey);
  }, [langKey, setupRound]);

  const resolveCatchRef = useRef<(hit: LanePod) => Promise<void>>(async () => {});

  resolveCatchRef.current = async (hit: LanePod) => {
    if (isResolving.current || !targetRef.current) return;
    isResolving.current = true;
    const t = targetRef.current;

    if (hit.item.id === t.id) {
      setFlashLane('good');
      sounds.sfxMagic();
      try { sounds.sfxNitro(); } catch {}
      sounds.hapticSuccess();
      onMarkWordLearned(t.id);
      confetti({
        particleCount: 60,
        spread: 65,
        origin: { y: 0.75 },
        colors: ['#f59e0b', '#fbbf24', '#34d399', '#38bdf8'],
      });

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

      const isFinal = nextRound >= totalRounds;
      const praise = getPersonalizedPraise(player.name, isFinal);
      setPraiseBanner(praise);
      setPods([]);

      // Only praise — word already spoken at round start (avoids "el el perro")
      await sounds.speakPraise(praise);
      setPraiseBanner(null);
      setFlashLane(null);

      if (isFinal) {
        onWin(1600 + selectedLevel * 220 + nextCombo * 40, nextStars, nextWords);
      } else {
        setupRoundRef.current(nextRound, langRef.current);
      }
    } else {
      setFlashLane('bad');
      comboRef.current = 0;
      setCombo(0);
      sounds.sfxError();
      sounds.hapticError();
      setMistakes((m) => m + 1);
      if (onMarkWordMissed) onMarkWordMissed(t.id);
      await sounds.speakAsync(hit.item.es || hit.item.audioText, 'es-ES', true);
      setFlashLane(null);
      isResolving.current = false;
    }
  };

  useEffect(() => {
    const tick = (ts: number) => {
      const dt = lastTs.current ? Math.min(40, ts - lastTs.current) : 16;
      lastTs.current = ts;

      if (!isResolving.current) {
        setPods((prev) => {
          if (!prev.length) return prev;
          const catchY = 76;
          let caught: LanePod | null = null;
          const moved = prev.map((p) => {
            const y = p.y + p.speed * dt;
            if (!caught && y >= catchY && y < catchY + 16 && p.lane === laneRef.current) {
              caught = { ...p, y };
            }
            return { ...p, y };
          });

          if (caught) {
            const hit: LanePod = caught;
            queueMicrotask(() => void resolveCatchRef.current(hit));
            return moved.filter((p: LanePod) => !(p.item.id === hit.item.id && p.lane === hit.lane));
          }

          return moved.filter((p) => p.y < 112);
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const setLaneFromClientX = (clientX: number) => {
    const el = arenaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = (clientX - rect.left) / rect.width;
    const next = pct < 0.33 ? 0 : pct < 0.66 ? 1 : 2;
    if (next !== laneRef.current) {
      sounds.sfxPop(1.05);
      setLane(next);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setLaneFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.buttons === 0) return;
    setLaneFromClientX(e.clientX);
  };

  if (!target) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white font-black">
        Preparando pista…
      </div>
    );
  }

  const showHint = mistakes >= 2;
  const vehicleEmoji = vehicleKind === 'car'
    ? VEHICLES.find((vehicle) => vehicle.id === player.selectedVehicle)?.icon ?? '🏎️'
    : '✈️';
  const costumeEmoji = COSTUMES.find((costume) => costume.id === player.selectedCostume)?.icon;
  const lanePct = [16.66, 50, 83.33];

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden select-none touch-none">
      <div className="absolute top-2 left-0 right-0 z-30 flex flex-col items-center gap-1.5 px-2 pointer-events-none">
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5">
          {(['es', 'fl', 'ar', 'fr'] as LangFilter[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                sounds.sfxPop();
                usedIds.current.clear();
                setLangKey(k);
              }}
              className={`px-2 py-1 rounded-xl text-xs font-black border-b-2 ${
                langKey === k ? 'bg-white text-slate-900 border-slate-400' : 'bg-white/20 text-white border-transparent'
              }`}
            >
              {LANG_POOLS[k].flag}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              sounds.sfxPop();
              setVehicleKind((v) => (v === 'car' ? 'plane' : 'car'));
            }}
            className="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-900 text-sm font-black border-b-2 border-amber-700"
          >
            {vehicleKind === 'car' ? '🏎️ Coche' : '✈️ Avión'}
          </button>
          <button
            type="button"
            onClick={() => void sounds.speakAsync(target.audioText, target.audioLang, true)}
            className="p-2 rounded-full bg-indigo-600 text-white border-b-2 border-indigo-900"
            aria-label="Escuchar"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-indigo-700 text-white px-4 py-1.5 rounded-2xl font-black text-sm sm:text-base shadow-xl border-2 border-white/30">
          ¡Atrapa {target.emoji} {target.es}!
          {combo > 1 && <span className="ml-2 text-amber-300">x{combo}</span>}
        </div>

        {showHint && (
          <div className="bg-amber-400 text-slate-900 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-lg">
            <HelpCircle className="w-4 h-4" /> Ponte debajo de {target.emoji}
          </div>
        )}
        {praiseBanner && (
          <div className="bg-yellow-400 text-slate-900 px-4 py-1.5 rounded-full font-black text-sm shadow-2xl animate-bounce border-2 border-white">
            {praiseBanner}
          </div>
        )}
        {roundIdx === 0 && (
          <TutorialHint text="Desliza para mover el vehículo" gesture="swipe" />
        )}
      </div>

      <div
        ref={arenaRef}
        className="relative flex-1 mx-1 mb-1 mt-0 rounded-[1.5rem] overflow-hidden border-4 border-white/50 shadow-2xl"
        style={{
          background:
            vehicleKind === 'car'
              ? 'linear-gradient(180deg, #7dd3fc 0%, #7dd3fc 38%, #4ade80 38%, #22c55e 100%)'
              : 'linear-gradient(180deg, #0284c7 0%, #38bdf8 45%, #e0f2fe 100%)',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
      >
        <div className="absolute inset-0 flex pointer-events-none">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex-1 border-x border-white/10 transition-colors duration-200 ${
                flashLane === 'good' && lane === i
                  ? 'bg-emerald-400/35'
                  : flashLane === 'bad' && lane === i
                    ? 'bg-rose-500/35'
                    : lane === i
                      ? 'bg-white/15'
                      : ''
              }`}
            />
          ))}
        </div>

        {vehicleKind === 'car' && (
          <div className="absolute left-[6%] right-[6%] top-[38%] bottom-0 bg-slate-600/95">
            <div className="absolute inset-y-0 left-1/2 w-0 border-l-4 border-dashed border-yellow-300/90 -translate-x-1/2" />
          </div>
        )}

        {pods.map((p) => {
          const isTarget = p.item.id === target.id;
          const hint = showHint && isTarget;
          return (
            <div
              key={`${p.item.id}-${p.lane}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${lanePct[p.lane]}%`, top: `${p.y}%` }}
            >
              <div
                className={`flex flex-col items-center px-2.5 py-2 rounded-2xl shadow-xl border-b-4 bg-white ${
                  hint ? 'ring-4 ring-amber-400 scale-110' : isTarget ? 'ring-2 ring-indigo-400' : ''
                }`}
              >
                <span className="text-4xl sm:text-5xl leading-none">{p.item.emoji}</span>
                <span className="text-[11px] font-black text-slate-800 mt-0.5 max-w-[80px] truncate">
                  {p.item.es}
                </span>
              </div>
            </div>
          );
        })}

        <div
          className="absolute bottom-[3%] z-20 transition-all duration-150 ease-out -translate-x-1/2"
          style={{ left: `${lanePct[lane]}%` }}
        >
          <div className={`relative text-6xl sm:text-7xl drop-shadow-2xl leading-none ${flashLane === 'good' ? 'scale-125' : ''}`}>
            {vehicleEmoji}
            {costumeEmoji && costumeEmoji !== '✨' && (
              <span className="absolute -top-3 -right-4 text-3xl drop-shadow-lg" aria-label="Disfraz equipado">
                {costumeEmoji}
              </span>
            )}
          </div>
        </div>

        <div className="absolute inset-0 flex z-[5]">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              aria-label={`Carril ${i + 1}`}
              className="flex-1 h-full bg-transparent"
              onClick={() => {
                sounds.sfxPop(1.05);
                setLane(i);
              }}
            />
          ))}
        </div>

        <div className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-bold text-white drop-shadow-md pointer-events-none z-30">
          Desliza o toca un carril · atrapa solo la palabra correcta
        </div>
      </div>
    </div>
  );
};
