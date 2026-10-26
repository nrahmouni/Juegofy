import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Sparkles, HelpCircle, Crosshair } from 'lucide-react';
import { PlayerConfig } from '../../types/game';
import type { PracticeLang } from '../../types/game';
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

export const SlingshotGame: React.FC<Props> = ({
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
  const optionsCount = Math.min(4, 3 + Math.floor(selectedLevel / 4));

  const [langKey, setLangKey] = useState<LangFilter>((practiceLang as LangFilter) || 'es');
  useEffect(() => {
    if (practiceLang) setLangKey(practiceLang as LangFilter);
  }, [practiceLang]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [target, setTarget] = useState<LearningItem | null>(null);
  const [clouds, setClouds] = useState<LearningItem[]>([]);
  const [hitCloudId, setHitCloudId] = useState<string | null>(null);
  const [wrongCloudId, setWrongCloudId] = useState<string | null>(null);
  const [mistakesOnRound, setMistakesOnRound] = useState(0);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [aimedIndex, setAimedIndex] = useState<number | null>(null);

  // Slingshot pull-and-release physics state
  const [isPulling, setIsPulling] = useState(false);
  const [pullOffset, setPullOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [flyingShot, setFlyingShot] = useState<{ targetIndex: number } | null>(null);

  const slingBaseRef = useRef<HTMLDivElement | null>(null);
  const cloudRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isResolvingRef = useRef(false);
  const roundRef = useRef(0);
  const starsRef = useRef(0);
  const wordsRef = useRef(0);
  const usedIdsRef = useRef<Set<string>>(new Set());
  const lastStretchSoundRef = useRef(0);

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
        .sort((a, b) => Math.abs(a.level - selectedLevel) - Math.abs(b.level - selectedLevel) || Math.random() - 0.5)
        .slice(0, optionsCount - 1);

      const roundClouds = [picked, ...distractors].sort(() => Math.random() - 0.5);

      roundRef.current = rIdx;
      isResolvingRef.current = false;
      setRoundIdx(rIdx);
      setTarget(picked);
      setClouds(roundClouds);
      setHitCloudId(null);
      setWrongCloudId(null);
      setMistakesOnRound(0);
      setIsPulling(false);
      setPullOffset({ dx: 0, dy: 0 });
      setFlyingShot(null);
      setAimedIndex(null);

      void sounds.speakAsync(picked.audioText, picked.audioLang, true);
    },
    [selectedLevel, learnedWordIds, missedWordIds, optionsCount]
  );

  useEffect(() => {
    usedIdsRef.current.clear();
    setupRound(0, langKey);
  }, [langKey, setupRound]);

  const fireAtCloud = async (cloudIndex: number) => {
    const chosen = clouds[cloudIndex];
    if (!chosen || !target || isResolvingRef.current) return;

    sounds.sfxSlingshotRelease();
    setFlyingShot({ targetIndex: cloudIndex });

    // Brief travel time for projectile animation (220ms)
    await new Promise((r) => setTimeout(r, 220));
    setFlyingShot(null);

    if (chosen.id === target.id) {
      isResolvingRef.current = true;
      setHitCloudId(chosen.id);
      sounds.sfxPinataHit();
      sounds.sfxMagic();
      onMarkWordLearned(target.id);

      const nextCombo = combo + 1;
      setCombo(nextCombo);

      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.42 },
        colors: ['#d946ef', '#facc15', '#34d399', '#38bdf8'],
      });

      const nextRound = roundRef.current + 1;
      const nextStars = starsRef.current + 3;
      const nextWords = wordsRef.current + 1;
      starsRef.current = nextStars;
      wordsRef.current = nextWords;

      setStarsCollected(nextStars);
      setWordsLearned(nextWords);
      setProgressPercent((nextRound / totalRounds) * 100);

      const isFinalWin = nextRound >= totalRounds;
      const praise = getPersonalizedPraise(player.name, isFinalWin);
      setPraiseBanner(praise);

      // Wait for the word + personalized praise to finish speaking before advancing!
      await sounds.speakSequence(
        [
          { text: chosen.audioText, lang: chosen.audioLang, pauseAfterMs: 120 },
          { text: praise, lang: 'es-ES', pauseAfterMs: 180 },
        ],
        true
      );

      setPraiseBanner(null);
      if (isFinalWin) {
        onWin(1700 + selectedLevel * 250 + nextCombo * 75, nextStars, nextWords);
      } else {
        setupRound(nextRound, langKey);
      }
    } else {
      sounds.sfxError();
      setCombo(0);
      setWrongCloudId(chosen.id);
      setMistakesOnRound((m) => m + 1);
      if (onMarkWordMissed) {
        onMarkWordMissed(target.id);
      }
      // Pronounce the item they hit so they learn what it is
      void sounds.speakAsync(chosen.es, 'es-ES', true);
      setTimeout(() => {
        setWrongCloudId(null);
      }, 600);
    }
  };

  // Compute which cloud the slingshot is currently aiming at based on pull angle / horizontal position
  const computeAimedCloudIndex = (dx: number, dy: number): number => {
    if (clouds.length === 0) return 0;
    // Pulling left aims right, OR dragging finger directly toward the desired side:
    // For young kids, we support intuitive aiming: if they pull down-left, aim right; or if they drag toward a cloud above, aim at that cloud!
    const horizontalSignal = dy > 15 ? -dx : dx;
    const normalized = Math.max(-1, Math.min(1, horizontalSignal / 95)); // -1 (leftmost) to +1 (rightmost)
    const ratio = (normalized + 1) / 2; // 0 to 1
    const idx = Math.min(clouds.length - 1, Math.max(0, Math.floor(ratio * clouds.length)));
    return idx;
  };

  const handleSlingshotPointerDown = (e: React.PointerEvent) => {
    if (isResolvingRef.current || flyingShot) return;
    e.stopPropagation();
    sounds.sfxPop(1.1);
    setIsPulling(true);
    setPullOffset({ dx: 0, dy: 20 });
    setAimedIndex(Math.floor(clouds.length / 2));
  };

  const handleContainerPointerMove = (e: React.PointerEvent) => {
    if (!isPulling || !slingBaseRef.current) return;
    const rect = slingBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rawDx = e.clientX - centerX;
    const rawDy = e.clientY - centerY;

    const maxPull = 95;
    const dist = Math.hypot(rawDx, rawDy);
    const scale = dist > maxPull ? maxPull / dist : 1;
    const clampedDx = rawDx * scale;
    const clampedDy = Math.max(-35, rawDy * scale);

    setPullOffset({ dx: clampedDx, dy: clampedDy });

    // Check if pointer is directly hovering over one of the clouds
    let hoveredCloudIdx: number | null = null;
    cloudRefs.current.forEach((el, idx) => {
      if (!el) return;
      const cRect = el.getBoundingClientRect();
      if (
        e.clientX >= cRect.left - 15 &&
        e.clientX <= cRect.right + 15 &&
        e.clientY >= cRect.top - 15 &&
        e.clientY <= cRect.bottom + 15
      ) {
        hoveredCloudIdx = idx;
      }
    });

    const nextAim = hoveredCloudIdx !== null ? hoveredCloudIdx : computeAimedCloudIndex(clampedDx, clampedDy);
    setAimedIndex(nextAim);

    const now = Date.now();
    if (now - lastStretchSoundRef.current > 120 && dist > 18) {
      lastStretchSoundRef.current = now;
      sounds.sfxSlingshotStretch(Math.min(1, dist / maxPull));
    }
  };

  const handleContainerPointerUp = () => {
    if (!isPulling) return;
    const targetIdx = aimedIndex ?? Math.floor(clouds.length / 2);
    setIsPulling(false);
    setPullOffset({ dx: 0, dy: 0 });
    setAimedIndex(null);
    void fireAtCloud(targetIdx);
  };

  if (!target) return null;

  const isReviewWord = missedWordIds.includes(target.id);
  const showSmartHint = mistakesOnRound >= 2;

  return (
    <div
      onPointerMove={handleContainerPointerMove}
      onPointerUp={handleContainerPointerUp}
      className="w-full h-full flex flex-col items-center justify-between pt-16 pb-16 px-3 sm:px-6 bg-gradient-to-b from-indigo-950 via-fuchsia-900 to-purple-950 relative overflow-hidden select-none touch-none"
    >
      {/* Language Switcher + Round Dots */}
      <div className="w-full max-w-xl flex items-center justify-between gap-1.5 z-10">
        <div className="flex items-center gap-1 bg-white/15 backdrop-blur-md p-1 rounded-2xl border border-white/20">
          {(Object.keys(LANG_POOLS) as LangFilter[]).map((key) => {
            const active = langKey === key;
            return (
              <button
                key={key}
                onClick={() => {
                  sounds.sfxPop();
                  setLangKey(key);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                  active ? 'bg-yellow-400 text-slate-950 shadow-md scale-105' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span>{LANG_POOLS[key].flag}</span>
                <span className="hidden sm:inline">{LANG_POOLS[key].label}</span>
              </button>
            );
          })}
        </div>

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

      {/* Target Mission Prompt Card */}
      <div className="w-full max-w-xl flex flex-col items-center z-10 my-1">
        <div className="w-full bg-white rounded-3xl p-3 sm:p-4 shadow-2xl border-b-8 border-fuchsia-200 flex items-center justify-between gap-3">
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-black text-fuchsia-600 uppercase tracking-wider flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5" /> ¡Estira el Tirachinas y Apunta!
              </span>
              {isReviewWord && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-black uppercase flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Repaso Inteligente
                </span>
              )}
            </div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 leading-tight truncate">
              « {target.targetText} »
            </div>
            <div className="text-xs font-bold text-slate-500 truncate">
              {langKey === 'es'
                ? target.subText || `Categoría: ${target.category || 'Vocabulario'}`
                : `Significa: ${target.es}${target.subText ? ` · ${target.subText}` : ''}`}
            </div>
          </div>

          <button
            onClick={() => void sounds.speakAsync(target.audioText, target.audioLang, true)}
            className="p-3.5 rounded-2xl bg-fuchsia-500 text-white shadow-lg border-b-4 border-fuchsia-700 btn-squishy shrink-0"
            aria-label="Escuchar objetivo"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>

        {showSmartHint && (
          <div className="mt-1.5 px-4 py-1 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 animate-bounce">
            <HelpCircle className="w-4 h-4" />
            <span>🦉 Profe Búho: ¡Dispara a la nube de {target.emoji} ({target.es})!</span>
          </div>
        )}

        {praiseBanner && (
          <div className="mt-1.5 px-5 py-1.5 rounded-full bg-emerald-400 text-slate-950 font-black text-sm sm:text-base shadow-2xl border-2 border-white animate-bounce">
            🏹 {praiseBanner}
          </div>
        )}
      </div>

      {/* Floating Piñata Clouds Target Row */}
      <div
        className={`w-full max-w-2xl grid gap-2.5 sm:gap-4 my-auto z-10 ${
          clouds.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'
        }`}
      >
        {clouds.map((cloud, idx) => {
          const isHit = hitCloudId === cloud.id;
          const isWrong = wrongCloudId === cloud.id;
          const isAimed = aimedIndex === idx;
          const isHinted = showSmartHint && cloud.id === target.id;
          const isFlyingTarget = flyingShot?.targetIndex === idx;

          return (
            <button
              key={cloud.id}
              ref={(el) => {
                cloudRefs.current[idx] = el;
              }}
              onClick={() => {
                if (!isPulling) {
                  void fireAtCloud(idx);
                }
              }}
              className={`relative rounded-[2rem] p-3 sm:p-4 bg-white/95 border-b-8 shadow-2xl flex flex-col items-center justify-center transition-all duration-300 btn-squishy ${
                isHit
                  ? 'bg-emerald-100 border-emerald-500 scale-115 ring-8 ring-emerald-400/60'
                  : isWrong
                  ? 'bg-rose-100 border-rose-500 animate-shake'
                  : isAimed
                  ? 'border-yellow-400 ring-4 ring-yellow-300 scale-105 -translate-y-1.5 bg-yellow-50'
                  : isHinted
                  ? 'border-amber-400 ring-4 ring-amber-400 animate-bounce'
                  : 'border-fuchsia-200 hover:border-fuchsia-400 animate-float'
              }`}
              style={{ animationDelay: `${idx * 160}ms` }}
            >
              {/* Aim Crosshair Indicator when Slingshot is pointed at this cloud */}
              {isAimed && (
                <div className="absolute -top-3 px-2.5 py-0.5 rounded-full bg-yellow-400 text-slate-950 font-black text-[10px] uppercase shadow-md flex items-center gap-1 animate-bounce">
                  🎯 ¡SUELTA AQUÍ!
                </div>
              )}

              {/* Flying Star Projectile hitting the cloud */}
              {isFlyingTarget && (
                <div className="absolute inset-0 flex items-center justify-center z-30 animate-ping text-5xl">
                  🌟
                </div>
              )}

              <span className="text-4xl sm:text-6xl mb-1.5 drop-shadow-sm">
                {isHit ? '🪅✨' : cloud.emoji}
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight text-center leading-tight line-clamp-2">
                {cloud.es}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Pull-and-Release Slingshot Launcher at Bottom */}
      <div className="relative w-full max-w-md h-32 sm:h-36 flex flex-col items-center justify-end z-20">
        {/* Aiming Trajectory Dots when pulling */}
        {isPulling && aimedIndex !== null && (
          <div className="absolute bottom-24 flex flex-col items-center gap-2 pointer-events-none">
            <div
              className="flex flex-col items-center gap-2 transition-transform duration-150"
              style={{
                transform: `rotate(${(aimedIndex - (clouds.length - 1) / 2) * 18}deg)`,
              }}
            >
              <div className="w-3 h-3 rounded-full bg-yellow-300 shadow-lg animate-ping" />
              <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 shadow-lg" />
              <div className="w-4 h-4 rounded-full bg-fuchsia-400 shadow-lg" />
            </div>
          </div>
        )}

        {/* Slingshot Y-Frame + Draggable Star Ball */}
        <div
          ref={slingBaseRef}
          onPointerDown={handleSlingshotPointerDown}
          className="relative w-40 h-28 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
        >
          {/* Slingshot Forks */}
          <div className="flex items-center justify-between w-24 px-2">
            <div className="w-3.5 h-12 bg-amber-600 rounded-t-full border-2 border-amber-800 -rotate-12 shadow-md" />
            <div className="w-3.5 h-12 bg-amber-600 rounded-t-full border-2 border-amber-800 rotate-12 shadow-md" />
          </div>
          <div className="w-5 h-10 bg-amber-700 rounded-b-xl border-2 border-amber-900 -mt-2 shadow-md" />

          {/* Draggable Star Projectile inside the Slingshot */}
          <div
            className={`absolute top-1 w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-fuchsia-500 border-4 border-white shadow-[0_0_25px_rgba(250,204,21,0.8)] flex items-center justify-center text-3xl sm:text-4xl transition-transform ${
              isPulling ? 'scale-115 duration-0' : ' duration-200 animate-bounce'
            }`}
            style={{
              transform: `translate(${pullOffset.dx}px, ${pullOffset.dy}px)`,
            }}
          >
            🌟
          </div>
        </div>

        <div className="text-[11px] font-black text-fuchsia-200 uppercase tracking-wider mt-0.5">
          {isPulling ? '🎯 ¡Mueve para apuntar y suelta para disparar!' : '👇 ¡Estira la estrella con el dedo o toca una nube!'}
        </div>
      </div>
    </div>
  );
};
