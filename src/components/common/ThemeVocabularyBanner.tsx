import React from 'react';
import { Volume2, BookOpen } from 'lucide-react';
import { speakWord } from '../../audio/speech';

interface VocabItem {
  es: string;
  target: string;
  audio?: string;
  lang?: 'es-ES' | 'ar-SA' | 'nl-BE' | 'fr-FR';
  emoji: string;
}

interface Props {
  modeKey: 'flemish' | 'french' | 'arabic' | 'math' | 'alphabet' | 'classic';
}

const VOCAB_MAP: Record<string, VocabItem[]> = {
  flemish: [
    { emoji: '🍎', es: 'Manzana', target: 'Appel', audio: 'De appel', lang: 'nl-BE' },
    { emoji: '🐶', es: 'Perro', target: 'Hond', audio: 'De hond', lang: 'nl-BE' },
    { emoji: '🐱', es: 'Gato', target: 'Kat', audio: 'De kat', lang: 'nl-BE' },
    { emoji: '☀️', es: 'Sol', target: 'Zon', audio: 'De zon', lang: 'nl-BE' },
    { emoji: '🧀', es: 'Queso', target: 'Kaas', audio: 'De kaas', lang: 'nl-BE' },
    { emoji: '🚲', es: 'Bici', target: 'Fiets', audio: 'De fiets', lang: 'nl-BE' },
  ],
  french: [
    { emoji: '🍎', es: 'Manzana', target: 'Pomme', audio: 'La pomme', lang: 'fr-FR' },
    { emoji: '🐱', es: 'Gato', target: 'Chat', audio: 'Le chat', lang: 'fr-FR' },
    { emoji: '🐶', es: 'Perro', target: 'Chien', audio: 'Le chien', lang: 'fr-FR' },
    { emoji: '⭐', es: 'Estrella', target: 'Étoile', audio: "L'étoile", lang: 'fr-FR' },
    { emoji: '🥐', es: 'Cruasán', target: 'Croissant', audio: 'Le croissant', lang: 'fr-FR' },
    { emoji: '🦋', es: 'Mariposa', target: 'Papillon', audio: 'Le papillon', lang: 'fr-FR' },
  ],
  arabic: [
    { emoji: '🍎', es: 'Manzana', target: 'تفاحة', audio: 'تفاحة', lang: 'ar-SA' },
    { emoji: '🦁', es: 'León', target: 'أسد', audio: 'أسد', lang: 'ar-SA' },
    { emoji: '🐱', es: 'Gato', target: 'قطة', audio: 'قطة', lang: 'ar-SA' },
    { emoji: '🚗', es: 'Coche', target: 'سيارة', audio: 'سيارة', lang: 'ar-SA' },
    { emoji: '☀️', es: 'Sol', target: 'شمس', audio: 'شمس', lang: 'ar-SA' },
    { emoji: '🌙', es: 'Luna', target: 'قمر', audio: 'قمر', lang: 'ar-SA' },
  ],
  math: [
    { emoji: '➕', es: 'Suma', target: 'Adición', audio: 'Suma', lang: 'es-ES' },
    { emoji: '➖', es: 'Resta', target: 'Sustracción', audio: 'Resta', lang: 'es-ES' },
    { emoji: '🔺', es: 'Triángulo', target: 'Geometría', audio: 'Triángulo', lang: 'es-ES' },
    { emoji: '🔵', es: 'Círculo', target: 'Figura', audio: 'Círculo', lang: 'es-ES' },
    { emoji: '⭐', es: 'Estrella', target: 'Contar', audio: 'Estrella', lang: 'es-ES' },
  ],
  alphabet: [
    { emoji: '✈️', es: 'Avión', target: 'Letra A', audio: 'Avión letra A', lang: 'es-ES' },
    { emoji: '🍌', es: 'Plátano', target: 'Letra P', audio: 'Plátano letra P', lang: 'es-ES' },
    { emoji: '🐘', es: 'Elefante', target: 'Letra E', audio: 'Elefante letra E', lang: 'es-ES' },
    { emoji: '🦁', es: 'León', target: 'Letra L', audio: 'León letra L', lang: 'es-ES' },
    { emoji: '☀️', es: 'Sol', target: 'Letra S', audio: 'Sol letra S', lang: 'es-ES' },
  ],
  classic: [
    { emoji: '🚀', es: 'Velocidad', target: 'Reflejos', audio: 'Velocidad', lang: 'es-ES' },
    { emoji: '⭐', es: 'Estrellas', target: 'Premio', audio: 'Estrellas', lang: 'es-ES' },
    { emoji: '🛡️', es: 'Escudo', target: 'Protección', audio: 'Escudo', lang: 'es-ES' },
    { emoji: '🏁', es: 'Meta', target: 'Victoria', audio: 'Meta', lang: 'es-ES' },
  ],
};

export const ThemeVocabularyBanner: React.FC<Props> = ({ modeKey }) => {
  const items = VOCAB_MAP[modeKey] || VOCAB_MAP['classic'];

  return (
    <div className="w-full max-w-xl mx-auto px-2 py-1 z-20 pointer-events-auto">
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-2 shadow-lg border border-white/20 flex flex-col gap-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Vocabulario Temático (Toca para escuchar)</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (item.audio && item.lang) {
                  speakWord(item.audio, item.lang);
                }
              }}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 px-2.5 py-1 rounded-xl border border-white/10 shrink-0 transition cursor-pointer"
            >
              <span className="text-sm">{item.emoji}</span>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[10px] font-black text-white">{item.target}</span>
                <span className="text-[9px] text-amber-200/80">{item.es}</span>
              </div>
              <Volume2 className="w-3 h-3 text-amber-300 ml-0.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
