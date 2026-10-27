import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Volume2 } from 'lucide-react';
import { PlayerConfig, PracticeLang } from '../../types/game';
import { getPersonalizedPraise } from '../../data/learningData';
import { sounds } from '../../audio/soundManager';
import { TutorialHint } from '../common/TutorialHint';

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

type Slot = 'head' | 'top' | 'bottom' | 'feet';

type Cloth = {
  id: string;
  slot: Slot;
  emoji: string;
  es: string;
  fl: string;
  ar: string;
  fr: string;
  audio: Record<PracticeLang, { text: string; lang: string }>;
};

const CLOTHES: Cloth[] = [
  { id: 'hat', slot: 'head', emoji: '🎩', es: 'Sombrero', fl: 'Hoed', ar: 'قبعة', fr: 'Chapeau',
    audio: { es: { text: 'Sombrero', lang: 'es-ES' }, fl: { text: 'De hoed', lang: 'nl-BE' }, ar: { text: 'قبعة', lang: 'ar-SA' }, fr: { text: 'Le chapeau', lang: 'fr-FR' } } },
  { id: 'cap', slot: 'head', emoji: '🧢', es: 'Gorra', fl: 'Pet', ar: 'كاب', fr: 'Casquette',
    audio: { es: { text: 'Gorra', lang: 'es-ES' }, fl: { text: 'De pet', lang: 'nl-BE' }, ar: { text: 'كاب', lang: 'ar-SA' }, fr: { text: 'La casquette', lang: 'fr-FR' } } },
  { id: 'shirt', slot: 'top', emoji: '👕', es: 'Camiseta', fl: 'T-shirt', ar: 'تيشيرت', fr: 'T-shirt',
    audio: { es: { text: 'Camiseta', lang: 'es-ES' }, fl: { text: 'De t-shirt', lang: 'nl-BE' }, ar: { text: 'تيشيرت', lang: 'ar-SA' }, fr: { text: 'Le t-shirt', lang: 'fr-FR' } } },
  { id: 'coat', slot: 'top', emoji: '🧥', es: 'Abrigo', fl: 'Jas', ar: 'معطف', fr: 'Manteau',
    audio: { es: { text: 'Abrigo', lang: 'es-ES' }, fl: { text: 'De jas', lang: 'nl-BE' }, ar: { text: 'معطف', lang: 'ar-SA' }, fr: { text: 'Le manteau', lang: 'fr-FR' } } },
  { id: 'pants', slot: 'bottom', emoji: '👖', es: 'Pantalón', fl: 'Broek', ar: 'بنطلون', fr: 'Pantalon',
    audio: { es: { text: 'Pantalón', lang: 'es-ES' }, fl: { text: 'De broek', lang: 'nl-BE' }, ar: { text: 'بنطلون', lang: 'ar-SA' }, fr: { text: 'Le pantalon', lang: 'fr-FR' } } },
  { id: 'skirt', slot: 'bottom', emoji: '👗', es: 'Vestido', fl: 'Jurk', ar: 'فستان', fr: 'Robe',
    audio: { es: { text: 'Vestido', lang: 'es-ES' }, fl: { text: 'De jurk', lang: 'nl-BE' }, ar: { text: 'فستان', lang: 'ar-SA' }, fr: { text: 'La robe', lang: 'fr-FR' } } },
  { id: 'shoes', slot: 'feet', emoji: '👟', es: 'Zapatillas', fl: 'Sneakers', ar: 'حذاء', fr: 'Baskets',
    audio: { es: { text: 'Zapatillas', lang: 'es-ES' }, fl: { text: 'De sneakers', lang: 'nl-BE' }, ar: { text: 'حذاء', lang: 'ar-SA' }, fr: { text: 'Les baskets', lang: 'fr-FR' } } },
  { id: 'boots', slot: 'feet', emoji: '👢', es: 'Botas', fl: 'Laarzen', ar: 'جزمة', fr: 'Bottes',
    audio: { es: { text: 'Botas', lang: 'es-ES' }, fl: { text: 'De laarzen', lang: 'nl-BE' }, ar: { text: 'جزمة', lang: 'ar-SA' }, fr: { text: 'Les bottes', lang: 'fr-FR' } } },
];

function label(c: Cloth, lang: PracticeLang) {
  if (lang === 'fl') return c.fl;
  if (lang === 'ar') return c.ar;
  if (lang === 'fr') return c.fr;
  return c.es;
}

/**
 * Vestir al amigo — drag clothes onto body slots. Real dress-up, not multiple choice.
 */
export const DressUpGame: React.FC<Props> = ({
  player,
  practiceLang = 'es',
  selectedLevel,
  onMarkWordLearned,
  onMarkWordMissed,
  onWin,
  setProgressPercent,
  setStarsCollected,
  setWordsLearned,
}) => {
  const needSlots: Slot[] = selectedLevel <= 2 ? ['top', 'feet'] : ['head', 'top', 'bottom', 'feet'];
  const [worn, setWorn] = useState<Partial<Record<Slot, Cloth>>>({});
  const [target, setTarget] = useState<Cloth | null>(null);
  const [tray, setTray] = useState<Cloth[]>([]);
  const [drag, setDrag] = useState<Cloth | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [round, setRound] = useState(0);
  const total = Math.min(6, 3 + Math.floor(selectedLevel / 2));
  const stars = useRef(0);
  const words = useRef(0);
  const used = useRef<Set<string>>(new Set());
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<Partial<Record<Slot, HTMLDivElement | null>>>({});

  const speakCloth = (c: Cloth) => {
    const a = c.audio[practiceLang] || c.audio.es;
    return sounds.speakAsync(a.text, a.lang, true);
  };

  const setup = useCallback(
    (r: number) => {
      setWorn({});
      const pool = CLOTHES.filter((c) => needSlots.includes(c.slot));
      const nextTarget =
        pool.filter((c) => !used.current.has(c.id))[Math.floor(Math.random() * Math.max(1, pool.filter((c) => !used.current.has(c.id)).length))] ||
        pool[Math.floor(Math.random() * pool.length)];
      used.current.add(nextTarget.id);
      const distractors = pool
        .filter((c) => c.id !== nextTarget.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(4, pool.length - 1));
      setTarget(nextTarget);
      setTray([nextTarget, ...distractors].sort(() => Math.random() - 0.5));
      setRound(r);
      void speakCloth(nextTarget);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [needSlots.join(','), practiceLang]
  );

  useEffect(() => {
    used.current.clear();
    stars.current = 0;
    words.current = 0;
    setup(0);
  }, [setup]);

  const tryDrop = async (cloth: Cloth, clientX: number, clientY: number) => {
    if (!target) return;
    let hit: Slot | null = null;
    for (const s of needSlots) {
      const el = slotRefs.current[s];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        hit = s;
        break;
      }
    }
    setDrag(null);
    setPos(null);
    if (!hit) return;

    if (cloth.id === target.id && cloth.slot === hit) {
      sounds.sfxMagic();
      setWorn((w) => ({ ...w, [hit!]: cloth }));
      setTray((t) => t.filter((x) => x.id !== cloth.id));
      onMarkWordLearned(`cloth_${cloth.id}`);
      stars.current += 2;
      words.current += 1;
      confetti({ particleCount: 40, spread: 55, origin: { y: 0.55 } });
      await speakCloth(cloth);
      const n = round + 1;
      setProgressPercent((n / total) * 100);
      if (n >= total) {
        setStarsCollected(stars.current);
        setWordsLearned(words.current);
        const praise = getPersonalizedPraise(player.name, true);
        await sounds.speakPraise(praise);
        onWin(1600 + selectedLevel * 150, stars.current, words.current);
      } else {
        setup(n);
      }
    } else {
      sounds.sfxError();
      if (onMarkWordMissed) onMarkWordMissed(`cloth_${target.id}`);
      await speakCloth(target);
    }
  };

  const onDown = (c: Cloth) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    sounds.sfxPop(1.05);
    setDrag(c);
    setPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className="w-full h-full flex flex-col bg-gradient-to-b from-pink-200 via-rose-100 to-violet-200 p-2 overflow-hidden select-none touch-none"
      onPointerMove={(e) => drag && setPos({ x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => drag && void tryDrop(drag, e.clientX, e.clientY)}
      onPointerCancel={() => {
        setDrag(null);
        setPos(null);
      }}
    >
      <div className="shrink-0 flex items-center gap-2 bg-white rounded-2xl p-2 shadow-lg border-b-4 border-pink-300">
        <div className="text-3xl">👗</div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase text-pink-600">Pon la prenda · {round + 1}/{total}</div>
          <div className="text-base font-black text-slate-900 truncate">
            {target ? `${target.emoji} ${label(target, practiceLang)}` : '…'}
          </div>
        </div>
        <button
          type="button"
          className="p-2.5 rounded-xl bg-pink-500 text-white"
          onClick={() => target && void speakCloth(target)}
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      {round === 0 && <div className="flex justify-center my-1"><TutorialHint text="Arrastra la ropa al sitio del cuerpo" gesture="drag" /></div>}

      {/* Body */}
      <div ref={bodyRef} className="flex-1 flex items-center justify-center min-h-0">
        <div className="relative w-[200px] h-[280px] sm:w-[220px] sm:h-[300px]">
          <div className="absolute inset-0 flex flex-col items-center">
            <div
              ref={(el) => {
                slotRefs.current.head = el;
              }}
              className="w-16 h-16 rounded-full bg-amber-100 border-4 border-dashed border-amber-400 flex items-center justify-center text-3xl"
            >
              {worn.head?.emoji || '🙂'}
            </div>
            <div
              ref={(el) => {
                slotRefs.current.top = el;
              }}
              className="w-28 h-24 mt-1 rounded-2xl bg-sky-100 border-4 border-dashed border-sky-400 flex items-center justify-center text-4xl"
            >
              {worn.top?.emoji || '⬜'}
            </div>
            <div
              ref={(el) => {
                slotRefs.current.bottom = el;
              }}
              className="w-24 h-20 mt-1 rounded-2xl bg-indigo-100 border-4 border-dashed border-indigo-400 flex items-center justify-center text-4xl"
            >
              {worn.bottom?.emoji || '⬜'}
            </div>
            <div
              ref={(el) => {
                slotRefs.current.feet = el;
              }}
              className="w-28 h-12 mt-1 rounded-xl bg-emerald-100 border-4 border-dashed border-emerald-400 flex items-center justify-center text-2xl gap-2"
            >
              {worn.feet?.emoji || '⬜'}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 bg-white/95 rounded-2xl p-2 shadow-xl">
        <div className="text-[10px] font-black text-pink-500 text-center uppercase mb-1">Ropa</div>
        <div className="flex flex-wrap justify-center gap-2">
          {tray.map((c) => (
            <button
              key={c.id}
              type="button"
              onPointerDown={onDown(c)}
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-violet-500 text-white flex flex-col items-center justify-center border-b-4 border-violet-800 ${
                drag?.id === c.id ? 'opacity-30' : ''
              }`}
            >
              <span className="text-2xl leading-none">{c.emoji}</span>
              <span className="text-[8px] font-black truncate max-w-[90%]">{label(c, practiceLang)}</span>
            </button>
          ))}
        </div>
      </div>

      {drag && pos && (
        <div
          className="fixed z-[200] pointer-events-none -translate-x-1/2 -translate-y-1/2 text-5xl"
          style={{ left: pos.x, top: pos.y }}
        >
          {drag.emoji}
        </div>
      )}
    </div>
  );
};
