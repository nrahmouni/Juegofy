import {
  LearningItem,
  SPANISH_VOCAB_ITEMS,
  FLEMISH_LEARNING_ITEMS,
  ARABIC_LEARNING_ITEMS,
  FRENCH_LEARNING_ITEMS,
  ALPHABET_LEARNING_ITEMS,
} from './learningData';

/** Languages available for mechanic games (monster, race, kitchen, etc.) */
export type PracticeLang = 'es' | 'fl' | 'ar' | 'fr';

export const PRACTICE_LANG_OPTIONS: {
  id: PracticeLang;
  label: string;
  flag: string;
  short: string;
}[] = [
  { id: 'es', label: 'Español', flag: '🇪🇸', short: 'ES' },
  { id: 'fl', label: 'Flamenco', flag: '🇧🇪', short: 'NL' },
  { id: 'ar', label: 'Árabe', flag: '🇸🇦', short: 'AR' },
  { id: 'fr', label: 'Francés', flag: '🇫🇷', short: 'FR' },
];

export function getLangPool(lang: PracticeLang): LearningItem[] {
  switch (lang) {
    case 'fl':
      return FLEMISH_LEARNING_ITEMS;
    case 'ar':
      return ARABIC_LEARNING_ITEMS;
    case 'fr':
      return FRENCH_LEARNING_ITEMS;
    case 'es':
    default:
      return SPANISH_VOCAB_ITEMS;
  }
}

/** Spanish letters + phrases for builder-style modes when lang is ES */
export function getBuilderPool(lang: PracticeLang): LearningItem[] {
  if (lang === 'es') {
    return [...ALPHABET_LEARNING_ITEMS, ...SPANISH_VOCAB_ITEMS];
  }
  return getLangPool(lang);
}

/** Modes that are locked to one language theme (no global switch) */
export const LANG_LOCKED_MODES = new Set([
  'lang_spanish_abc',
  'lang_spanish_words',
  'lang_flemish',
  'lang_arabic',
  'lang_french',
  'flemish_world',
]);


const USEFUL_CATS = new Set(['Familia', 'Modales', 'Comida', 'Colegio', 'Deporte', 'Hogar', 'Cuerpo', 'Animales']);

/** Prefer real-life categories; fall back to full pool */
export function getUsefulPool(lang: PracticeLang): LearningItem[] {
  const all = getLangPool(lang).filter((i) => !i.isPhrase);
  const useful = all.filter((i) => i.category && USEFUL_CATS.has(i.category));
  return useful.length >= 8 ? useful : all;
}

/** Food-only for cooking games */
export function getKitchenPool(lang: PracticeLang): LearningItem[] {
  const all = getLangPool(lang).filter((i) => !i.isPhrase);
  const food = all.filter((i) => i.category === 'Comida');
  return food.length >= 4 ? food : getUsefulPool(lang);
}

/** Single words only (no long phrases) for balloon-style games */
export function getWordOnlyPool(lang: PracticeLang): LearningItem[] {
  return getLangPool(lang).filter((i) => !i.isPhrase && (i.targetText || i.es || '').split(/\s+/).length <= 3);
}
