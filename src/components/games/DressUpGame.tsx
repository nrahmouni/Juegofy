import React, { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Volume2 } from 'lucide-react';
import { PlayerConfig, PracticeLang } from '../../types/game';
import { SupportedLang, getText } from '../../types/learning';
import { sounds } from '../../audio/soundManager';

/**
 * DressUpGame – Arrastrar ropa mejorado
 * - Snap al soltar en la zona correcta
 * - Rebote si es zona incorrecta
 * - Instrucciones multi-idioma
 * - Feedback visual claro
 */

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
  starsCollected?: number;
  setStarsCollected: React.Dispatch<React.SetStateAction<number>>;
  wordsLearned?: number;
  setWordsLearned: React.Dispatch<React.SetStateAction<number>>;
}

type SlotId = 'head' | 'torso' | 'legs' | 'feet';

interface ClothingItem {
  id: string;
  slot: SlotId;
  icon: string;
  translations: Record<string, string>;
}

const CLOTHES: ClothingItem[] = [
  { id: 'hat', slot: 'head', icon: '🎩', translations: { es: 'sombrero', en: 'hat', fr: 'chapeau', nl: 'hoed', ar: 'قبعة' } },
  { id: 'shirt', slot: 'torso', icon: '👕', translations: { es: 'camiseta', en: 'shirt', fr: 't-shirt', nl: 'shirt', ar: 'قميص' } },
  { id: 'pants', slot: 'legs', icon: '👖', translations: { es: 'pantalón', en: 'pants', fr: 'pantalon', nl: 'broek', ar: 'بنطال' } },
  { id: 'shoes', slot: 'feet', icon: '👟', translations: { es: 'zapatos', en: 'shoes', fr: 'chaussures', nl: 'schoenen', ar: 'حذاء' } },
];

const SLOT_LABELS: Record<SlotId, Record<string, string>> = {
  head: { es: 'Cabeza', en: 'Head', fr: 'Tête', nl: 'Hoofd', ar: 'رأس' },
  torso: { es: 'Cuerpo', en: 'Body', fr: 'Corps', nl: 'Lichaam', ar: 'جسم' },
  legs: { es: 'Piernas', en: 'Legs', fr: 'Jambes', nl: 'Benen', ar: 'أرجل' },
  feet: { es: 'Pies', en: 'Feet', fr: 'Pieds', nl: 'Voeten', ar: 'أقدام' },
};

const INSTRUCTIONS: Record<string, string> = {
  es: 'Arrastra la ropa al sitio correcto del cuerpo',
  en: 'Drag the clothes to the correct body part',
  fr: 'Glisse les vêtements au bon endroit',
  nl: 'Sleep de kleren naar het juiste lichaamsdeel',
  ar: 'اسحب الملابس إلى المكان الصحيح',
};

const LANG_MAP: Record<string, SupportedLang> = {
  es: 'es', fl: 'nl', ar: 'ar', fr: 'fr',
};

export const DressUpGame: React.FC<Props> = ({
  player,
  practiceLang = 'es',
  selectedLevel,
  onMarkWordLearned,
  onWin,
  setProgressPercent,
  setStarsCollected,
  setWordsLearned,
}) => {
  const lang = LANG_MAP[practiceLang] || 'es';

  const [equipped, setEquipped] = useState<Partial<Record<SlotId, ClothingItem>>>({});
  const [dragging, setDragging] = useState<ClothingItem | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [shakeSlot, setShakeSlot] = useState<SlotId | null>(null);
  const [available, setAvailable] = useState<ClothingItem[]>([...CLOTHES]);

  const t = useCallback(
    (item: ClothingItem) => item.translations[lang] || item.translations.es || item.id,
    [lang]
  );

  const instruction = INSTRUCTIONS[lang] || INSTRUCTIONS.es;

  const handlePointerDown = (item: ClothingItem, e: React.PointerEvent) => {
    e.preventDefault();
    sounds.sfxPop?.(1.1);
    sounds.hapticDragStart?.();
    void sounds.speakAsync?.(t(item), lang === 'nl' ? 'nl-BE' : lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'es-ES', true);
    setDragging(item);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragging || !dragPos) {
      setDragging(null);
      setDragPos(null);
      return;
    }

    // Detectar sobre qué slot se soltó
    const slots = document.querySelectorAll('[data-slot]');
    let droppedOn: SlotId | null = null;

    slots.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        droppedOn = el.getAttribute('data-slot') as SlotId;
      }
    });

    if (droppedOn && dragging.slot === droppedOn) {
      // Correcto → snap
      sounds.sfxMagic?.();
      sounds.hapticSuccess?.();
      onMarkWordLearned(dragging.id);

      setEquipped((prev) => ({ ...prev, [droppedOn!]: dragging }));
      setAvailable((prev) => prev.filter((i) => i.id !== dragging.id));

      const nextCount = Object.keys(equipped).length + 1;
      setStarsCollected((s) => s + 2);
      setWordsLearned((w) => w + 1);
      setProgressPercent((nextCount / CLOTHES.length) * 100);

      if (nextCount >= CLOTHES.length) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => {
          onWin(1400 + selectedLevel * 180, 8, CLOTHES.length);
        }, 900);
      }
    } else if (droppedOn) {
      // Incorrecto → shake
      sounds.sfxError?.();
      sounds.hapticError?.();
      setShakeSlot(droppedOn);
      setTimeout(() => setShakeSlot(null), 500);
    }

    setDragging(null);
    setDragPos(null);
  };

  const slots: SlotId[] = ['head', 'torso', 'legs', 'feet'];

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-between pt-16 pb-6 px-3 bg-gradient-to-b from-pink-950 via-fuchsia-900 to-violet-950 select-none touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Instrucción multi-idioma */}
      <div className="w-full max-w-md bg-white rounded-2xl px-4 py-2.5 shadow-xl border-b-4 border-pink-200 text-center">
        <p className="text-sm font-black text-slate-800">{instruction}</p>
      </div>

      {/* Cuerpo + slots */}
      <div className="relative w-40 sm:w-48 flex flex-col items-center gap-1 my-2">
        {slots.map((slot) => {
          const item = equipped[slot];
          const isShaking = shakeSlot === slot;
          return (
            <div
              key={slot}
              data-slot={slot}
              className={`w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                slot === 'head' ? 'h-16' : slot === 'torso' ? 'h-20' : slot === 'legs' ? 'h-20' : 'h-14'
              } ${
                item
                  ? 'bg-emerald-100 border-emerald-400'
                  : 'bg-white/15 border-white/30'
              } ${isShaking ? 'animate-shake bg-rose-200 border-rose-400' : ''}`}
            >
              {item ? (
                <>
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-[10px] font-black text-slate-700">{t(item)}</span>
                </>
              ) : (
                <span className="text-[10px] font-bold text-white/50">
                  {SLOT_LABELS[slot][lang] || SLOT_LABELS[slot].es}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Ropa disponible */}
      <div className="w-full max-w-md grid grid-cols-4 gap-2">
        {available.map((item) => (
          <button
            key={item.id}
            type="button"
            onPointerDown={(e) => handlePointerDown(item, e)}
            className="aspect-square rounded-2xl bg-white border-b-4 border-slate-200 shadow-lg flex flex-col items-center justify-center active:scale-95 transition-transform"
          >
            <span className="text-3xl">{item.icon}</span>
            <span className="text-[10px] font-black text-slate-700 mt-0.5">{t(item)}</span>
          </button>
        ))}
      </div>

      {/* Pieza flotante al arrastrar */}
      {dragging && dragPos && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: dragPos.x, top: dragPos.y }}
        >
          <div className="w-16 h-16 rounded-2xl bg-white border-4 border-yellow-400 shadow-2xl flex items-center justify-center text-3xl">
            {dragging.icon}
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black">
            {t(dragging)}
          </span>
        </div>
      )}
    </div>
  );
};
