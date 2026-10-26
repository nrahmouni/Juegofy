import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, HelpCircle } from 'lucide-react';
import { PlayerConfig } from '../../types/game';
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const MagicPuzzleGame: React.FC<Props> = ({
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
  const totalRounds = Math.min(5, 3 + Math.floor(selectedLevel / 3));
  const pieceCount = selectedLevel >= 5 ? 4 : 3;

  const [langKey, setLangKey] = useState<LangFilter>('es');
  const [target, setTarget] = useState<LearningItem | null>(null);
  const [board, setBoard] = useState<LearningItem[]>([]);
  const [tray, setTray] = useState<LearningItem[]>([]);
  const [filled, setFilled] = useState<Record<string, boolean>>({});
  const [roundIdx, setRoundIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [dragging, setDragging] = useState<LearningItem | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);
  const [wrongSlot, setWrongSlot] = useState<string | null>(null);

  const isResolving = useRef(false);
  const starsRef = useRef(0);
  const wordsRef = useRef(0);
  const usedIds = useRef<Set<string>>(new Set());
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const comboRef = useRef(0);
  const roundRef = useRef(0);
  const langRef = useRef<LangFilter>('es');

  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { roundRef.current = roundIdx; }, [roundIdx]);
  useEffect(() => { langRef.current = langKey; }, [langKey]);

  const setupRound = useCallback(
    (rIdx: number, activeLang: LangFilter) => {
      isResolving.current = false;
      setPraiseBanner(null);
      setDragging(null);
      setDragPos(null);
      setHoverSlot(null);
      setWrongSlot(null);
      setFilled({});

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

      const others = shuffle(pool.filter((i) => i.id !== picked.id)).slice(0, pieceCount - 1);
      const slots = shuffle([picked, ...others]);
      setTarget(picked);
      setBoard(slots);
      setTray(shuffle([...slots]));
      setRoundIdx(rIdx);
      setMistakes(0);

      void (async () => {
        await new Promise((r) => setTimeout(r, 180));
        await sounds.speakPrompt(picked, 'find');
      })();
    },
    [selectedLevel, learnedWordIds, missedWordIds, pieceCount]
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

  const finishBoard = async (currentTarget: LearningItem) => {
    if (isResolving.current) return;
    isResolving.current = true;
    sounds.sfxMagic();
    sounds.hapticSuccess();
    onMarkWordLearned(currentTarget.id);
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.55 },
      colors: ['#a855f7', '#ec4899', '#fbbf24', '#34d399'],
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

    await sounds.speakPraise(praise);
    setPraiseBanner(null);

    if (isFinal) {
      onWin(1500 + selectedLevel * 200 + nextCombo * 35, nextStars, nextWords);
    } else {
      setupRoundRef.current(nextRound, langRef.current);
    }
  };

  const tryDropOnSlot = async (slotItem: LearningItem, piece: LearningItem) => {
    if (isResolving.current || filled[slotItem.id]) return;

    if (piece.id === slotItem.id) {
      sounds.sfxPop(1.12);
      sounds.hapticSuccess();
      const nextFilled = { ...filled, [slotItem.id]: true };
      setFilled(nextFilled);
      setTray((t) => t.filter((p) => p.id !== piece.id));
      setDragging(null);
      setDragPos(null);
      setHoverSlot(null);

      const done = board.every((b) => nextFilled[b.id]);
      if (done && target) await finishBoard(target);
    } else {
      sounds.sfxError();
      sounds.hapticError();
      setWrongSlot(slotItem.id);
      setMistakes((m) => m + 1);
      comboRef.current = 0;
      setCombo(0);
      if (target && onMarkWordMissed) onMarkWordMissed(target.id);
      await sounds.speakAsync(piece.es || piece.audioText, 'es-ES', true);
      setWrongSlot(null);
      setDragging(null);
      setDragPos(null);
      setHoverSlot(null);
    }
  };

  const findSlotUnderPoint = (x: number, y: number): LearningItem | null => {
    for (const slot of board) {
      const el = slotRefs.current[slot.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return slot;
    }
    return null;
  };

  const onPiecePointerDown = (piece: LearningItem) => (e: React.PointerEvent) => {
    if (isResolving.current) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    sounds.sfxPop(1.05);
    setDragging(piece);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragPos({ x: e.clientX, y: e.clientY });
    const under = findSlotUnderPoint(e.clientX, e.clientY);
    setHoverSlot(under?.id ?? null);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    const under = findSlotUnderPoint(e.clientX, e.clientY);
    if (under) void tryDropOnSlot(under, dragging);
    else {
      setDragging(null);
      setDragPos(null);
      setHoverSlot(null);
    }
  };

  if (!target) {
    return (
      <div className="w-full h-full flex items-center justify-center font-black text-slate-600">
        Preparando puzzle…
      </div>
    );
  }

  const showHint = mistakes >= 2;
  const cols = pieceCount === 4 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div
      className="w-full h-full flex flex-col p-2 sm:p-3 gap-2 select-none touch-none overflow-hidden bg-gradient-to-b from-violet-50 to-fuchsia-50"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        setDragging(null);
        setDragPos(null);
        setHoverSlot(null);
      }}
    >
      <div className="flex flex-wrap items-center justify-center gap-1.5 shrink-0">
        {(['es', 'fl', 'ar', 'fr'] as LangFilter[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              sounds.sfxPop();
              usedIds.current.clear();
              setLangKey(k);
            }}
            className={`px-2 py-1 rounded-xl text-xs font-black ${
              langKey === k ? 'bg-violet-600 text-white' : 'bg-white text-slate-700 shadow'
            }`}
          >
            {LANG_POOLS[k].flag}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void sounds.speakAsync(target.audioText, target.audioLang, true)}
          className="p-2 rounded-full bg-violet-600 text-white shadow"
          aria-label="Escuchar"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-center shrink-0">
        <div className="bg-violet-700 text-white px-4 py-1.5 rounded-2xl font-black text-sm shadow-lg">
          🧩 Encaja {target.emoji} <span className="text-amber-200">{target.es}</span>
          {combo > 1 && <span className="ml-2 text-amber-300">x{combo}</span>}
        </div>
      </div>

      {showHint && (
        <div className="flex justify-center">
          <div className="bg-amber-400 text-slate-900 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1">
            <HelpCircle className="w-4 h-4" /> Busca el hueco de {target.emoji}
          </div>
        </div>
      )}
      {praiseBanner && (
        <div className="flex justify-center">
          <div className="bg-yellow-400 text-slate-900 px-4 py-1.5 rounded-full font-black text-sm shadow-xl animate-bounce">
            {praiseBanner}
          </div>
        </div>
      )}
      {roundIdx === 0 && (
        <div className="flex justify-center">
          <TutorialHint text="Arrastra cada pieza a su hueco" gesture="drag" />
        </div>
      )}

      <div className={`grid ${cols} gap-2.5 flex-1 min-h-0 content-center px-1`}>
        {board.map((slot) => {
          const isFilled = !!filled[slot.id];
          const isHover = hoverSlot === slot.id && !!dragging;
          const isWrong = wrongSlot === slot.id;
          const isTargetSlot = showHint && slot.id === target.id && !isFilled;
          return (
            <div
              key={slot.id}
              ref={(el) => {
                slotRefs.current[slot.id] = el;
              }}
              className={`rounded-3xl border-4 flex flex-col items-center justify-center aspect-square max-h-[140px] transition-all ${
                isFilled
                  ? 'bg-emerald-100 border-emerald-500 shadow-inner'
                  : isWrong
                    ? 'bg-rose-100 border-rose-500'
                    : isHover
                      ? 'bg-violet-100 border-violet-500 scale-[1.04] shadow-lg'
                      : isTargetSlot
                        ? 'bg-amber-50 border-amber-400 border-dashed'
                        : 'bg-white border-dashed border-slate-300 shadow-sm'
              }`}
            >
              {isFilled ? (
                <>
                  <span className="text-4xl sm:text-5xl leading-none">{slot.emoji}</span>
                  <span className="text-xs font-black text-slate-800 mt-1 px-1 text-center">{slot.es}</span>
                </>
              ) : (
                <>
                  <span className="text-4xl sm:text-5xl leading-none opacity-20">{slot.emoji}</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1">¿?</span>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="shrink-0 bg-white rounded-3xl p-3 shadow-xl border-2 border-violet-200">
        <div className="text-[10px] font-black uppercase tracking-wider text-violet-500 text-center mb-2">
          Mantén y arrastra al hueco
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          {tray.map((piece) => {
            const isDrag = dragging?.id === piece.id;
            return (
              <button
                key={piece.id}
                type="button"
                onPointerDown={onPiecePointerDown(piece)}
                className={`w-[78px] h-[78px] sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex flex-col items-center justify-center shadow-lg border-b-4 border-violet-900 ${
                  isDrag ? 'opacity-25' : 'active:scale-95'
                }`}
              >
                <span className="text-3xl sm:text-4xl leading-none">{piece.emoji}</span>
                <span className="text-[10px] font-black mt-1 truncate max-w-[90%]">{piece.es}</span>
              </button>
            );
          })}
          {tray.length === 0 && (
            <div className="text-sm font-black text-emerald-600 py-3">¡Puzzle completo!</div>
          )}
        </div>
      </div>

      {dragging && dragPos && (
        <div
          className="fixed z-[200] pointer-events-none -translate-x-1/2 -translate-y-1/2 w-[84px] h-[84px] rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex flex-col items-center justify-center shadow-2xl border-b-4 border-violet-900 scale-110"
          style={{ left: dragPos.x, top: dragPos.y }}
        >
          <span className="text-3xl leading-none">{dragging.emoji}</span>
          <span className="text-[10px] font-black">{dragging.es}</span>
        </div>
      )}
    </div>
  );
};
