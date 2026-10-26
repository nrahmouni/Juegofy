/** Tipos unificados para contenido multi-idioma */

export type SupportedLang = 'es' | 'en' | 'fr' | 'ar' | 'nl';

export interface Translations {
  es: string;
  en?: string;
  fr?: string;
  ar?: string;
  nl?: string;
}

export interface LearningItemV2 {
  id: string;
  /** Icono visual (puede ser emoji temporal o id de SVG) */
  icon: string;
  /** Traducciones de la palabra/frase */
  translations: Translations;
  /** Texto para TTS por idioma */
  audio?: Partial<Record<SupportedLang, string>>;
  level: number;
  category?: string;
  isPhrase?: boolean;
}

/** Helper: obtiene el texto en el idioma activo con fallback a es → en */
export function getText(
  item: LearningItemV2 | Translations,
  lang: SupportedLang,
  fallback: SupportedLang = 'es'
): string {
  const t = 'translations' in item ? item.translations : item;
  return t[lang] || t[fallback] || t.es || t.en || Object.values(t)[0] || '';
}

export function getAudioText(item: LearningItemV2, lang: SupportedLang): string {
  return item.audio?.[lang] || getText(item, lang);
}

export const AUDIO_LANG_MAP: Record<SupportedLang, string> = {
  es: 'es-ES',
  en: 'en-US',
  fr: 'fr-FR',
  ar: 'ar-SA',
  nl: 'nl-BE',
};
