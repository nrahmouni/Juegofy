import React, { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Search, Key, CheckCircle2 } from 'lucide-react';
import { PlayerConfig, PracticeLang } from '../../types/game';
import { SupportedLang, getText } from '../../types/learning';
import { useGameContent } from '../../hooks/useGameContent';
import { sounds } from '../../audio/soundManager';

/**
 * JUEGO 1 — Aventura Point-and-Click
 * "Misterio en la Escuela"
 *
 * Mecánica real:
 * - El jugador explora un aula.
 * - Debe encontrar la llave escondida y abrir la puerta.
 * - Al interactuar con objetos, escucha/lee el vocabulario en el idioma activo.
 * - No hay quiz de opciones. El idioma es el entorno.
 */

interface Props {
  player: PlayerConfig;
  practiceLang?: PracticeLang;
  selectedLevel: number;
  learnedWordIds: string[];
  onMarkWordLearned: (id: string) => void;
  onWin: (score: number, stars: number, words: number) => void;
  setProgressPercent: (p: number) => void;
  setStarsCollected: React.Dispatch<React.SetStateAction<number>>;
  setWordsLearned: React.Dispatch<React.SetStateAction<number>>;
}

type ObjectId = 'backpack' | 'book' | 'pencil' | 'desk' | 'window' | 'chair' | 'key' | 'door';

interface SceneObject {
  id: ObjectId;
  x: number; // % 
  y: number;
  w: number;
  h: number;
  labelKey: string;
  revealKey?: boolean; // si al tocarlo se encuentra la llave
  isDoor?: boolean;
}

const SCENE: SceneObject[] = [
  { id: 'window', x: 8, y: 12, w: 28, h: 22, labelKey: 'window' },
  { id: 'desk', x: 38, y: 48, w: 32, h: 22, labelKey: 'desk', revealKey: true },
  { id: 'chair', x: 42, y: 68, w: 18, h: 18, labelKey: 'chair' },
  { id: 'backpack', x: 72, y: 55, w: 20, h: 24, labelKey: 'backpack' },
  { id: 'book', x: 20, y: 58, w: 16, h: 14, labelKey: 'book' },
  { id: 'pencil', x: 55, y: 42, w: 12, h: 10, labelKey: 'pencil' },
  { id: 'door', x: 78, y: 18, w: 18, h: 40, labelKey: 'door', isDoor: true },
];

const LANG_MAP: Record<string, SupportedLang> = {
  es: 'es',
  fl: 'nl',
  ar: 'ar',
  fr: 'fr',
};

export const SchoolMysteryGame: React.FC<Props> = ({
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
  const { items, getItemText, getItemAudio } = useGameContent(lang, selectedLevel);

  const [foundKey, setFoundKey] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [inspected, setInspected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [activeObject, setActiveObject] = useState<SceneObject | null>(null);

  const wordsFound = inspected.size;

  const speakItem = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      const { text, lang: audioLang } = getItemAudio(item);
      void sounds.speakAsync?.(text, audioLang, true);
    },
    [items, getItemAudio]
  );

  const handleTapObject = (obj: SceneObject) => {
    sounds.sfxPop?.(1.1);
    setActiveObject(obj);

    // Marcar como inspeccionado
    setInspected((prev) => {
      const next = new Set(prev);
      next.add(obj.id);
      return next;
    });

    const item = items.find((i) => i.id === obj.labelKey);
    if (item) {
      onMarkWordLearned(item.id);
      speakItem(item.id);
      setMessage(getItemText(item));
    }

    // ¿Esconde la llave?
    if (obj.revealKey && !foundKey) {
      setTimeout(() => {
        setFoundKey(true);
        sounds.sfxMagic?.();
        setMessage(lang === 'es' ? '¡Has encontrado la llave!' : 'Key found!');
        setStarsCollected((s) => s + 2);
        setProgressPercent(50);
      }, 600);
    }

    // ¿Es la puerta?
    if (obj.isDoor) {
      if (foundKey && !doorOpen) {
        setDoorOpen(true);
        sounds.sfxWin?.();
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });
        setMessage(lang === 'es' ? '¡Puerta abierta! ¡Misión cumplida!' : 'Door open! Mission complete!');
        setStarsCollected((s) => s + 3);
        setWordsLearned(wordsFound + 1);
        setProgressPercent(100);
        setTimeout(() => {
          onWin(1200 + selectedLevel * 150, 5, wordsFound + 1);
        }, 1400);
      } else if (!foundKey) {
        setMessage(lang === 'es' ? 'La puerta está cerrada. Busca la llave.' : 'The door is locked. Find the key.');
        sounds.sfxError?.();
      }
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-sky-200 via-amber-50 to-amber-100 select-none touch-none">
      {/* Cielo + paredes del aula */}
      <div className="absolute inset-0">
        {/* Pared */}
        <div className="absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-sky-300 to-sky-100" />
        {/* Suelo */}
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-b from-amber-200 to-amber-400" />
        {/* Pizarra */}
        <div className="absolute left-[18%] top-[14%] w-[42%] h-[22%] rounded-xl bg-emerald-800 border-4 border-amber-800 shadow-xl flex items-center justify-center">
          <span className="text-white/90 font-black text-sm sm:text-base tracking-wide">
            {lang === 'es' ? '¡Busca la llave!' : 'Find the key!'}
          </span>
        </div>
      </div>

      {/* Inventario / estado */}
      <div className="absolute top-16 left-3 right-3 z-20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-2xl px-3 py-1.5 shadow-lg border border-white/50">
          <Search className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-black text-slate-700">
            {wordsFound} objetos
          </span>
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 shadow-lg border ${
            foundKey
              ? 'bg-amber-300 border-amber-500'
              : 'bg-white/80 border-white/50'
          }`}
        >
          <Key className={`w-4 h-4 ${foundKey ? 'text-amber-800' : 'text-slate-400'}`} />
          <span className="text-xs font-black text-slate-800">
            {foundKey ? (lang === 'es' ? 'Llave' : 'Key') : '???'}
          </span>
        </div>
      </div>

      {/* Objetos interactivos */}
      {SCENE.map((obj) => {
        const isActive = activeObject?.id === obj.id;
        const wasInspected = inspected.has(obj.id);
        const item = items.find((i) => i.id === obj.labelKey);

        return (
          <button
            key={obj.id}
            type="button"
            onClick={() => handleTapObject(obj)}
            className={`absolute z-10 rounded-2xl transition-all duration-200 flex flex-col items-center justify-center ${
              isActive ? 'scale-110 ring-4 ring-yellow-300' : 'hover:scale-105'
            } ${wasInspected ? 'opacity-100' : 'opacity-95'}`}
            style={{
              left: `${obj.x}%`,
              top: `${obj.y}%`,
              width: `${obj.w}%`,
              height: `${obj.h}%`,
            }}
          >
            {/* Representación visual simple del objeto */}
            <div
              className={`w-full h-full rounded-2xl flex flex-col items-center justify-center shadow-lg border-2 ${
                obj.isDoor
                  ? doorOpen
                    ? 'bg-emerald-400 border-emerald-600'
                    : 'bg-amber-700 border-amber-900'
                  : obj.revealKey && foundKey
                  ? 'bg-amber-200 border-amber-400'
                  : 'bg-white/90 border-white/60'
              }`}
            >
              <span className="text-2xl sm:text-3xl leading-none">
                {obj.isDoor ? (doorOpen ? '✅' : '🚪') : item?.icon || '📦'}
              </span>
              {wasInspected && item && (
                <span className="text-[9px] sm:text-[10px] font-black text-slate-800 mt-0.5 px-1 text-center leading-tight">
                  {getItemText(item)}
                </span>
              )}
            </div>
          </button>
        );
      })}

      {/* Mensaje / feedback */}
      {message && (
        <div className="absolute bottom-20 left-3 right-3 z-30 flex justify-center">
          <div className="bg-white rounded-2xl px-4 py-2.5 shadow-2xl border-b-4 border-indigo-200 flex items-center gap-2 max-w-sm">
            <Volume2 className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-sm font-black text-slate-800">{message}</span>
          </div>
        </div>
      )}

      {/* Instrucción inicial */}
      {!foundKey && wordsFound === 0 && (
        <div className="absolute bottom-6 left-3 right-3 z-20 text-center">
          <p className="text-xs font-bold text-slate-700 bg-white/80 rounded-full px-4 py-2 inline-block shadow">
            {lang === 'es'
              ? 'Toca los objetos del aula. Encuentra la llave y abre la puerta.'
              : 'Tap the objects. Find the key and open the door.'}
          </p>
        </div>
      )}

      {doorOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-3 animate-bounce">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <p className="text-xl font-black text-slate-800">
              {lang === 'es' ? '¡Misión cumplida!' : 'Mission complete!'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
