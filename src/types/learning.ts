export type SupportedLang = 'es' | 'en' | 'fr' | 'nl' | 'ar';

export interface Translations {
  es: string;
  en?: string;
  fr?: string;
  nl?: string;
  ar?: string;
}

export interface LearningItem {
  id: string;
  icon: string;
  translations: Translations;
  level: number;
  category?: string;
  isPhrase?: boolean;
}

export function getText(
  item: LearningItem | Translations,
  lang: SupportedLang
): string {
  const t = 'translations' in item ? item.translations : item;
  return t[lang] || t.es || t.en || Object.values(t).find(Boolean) || '???';
}

export function getAudioLang(lang: SupportedLang): string {
  const map: Record<SupportedLang, string> = {
    es: 'es-ES',
    en: 'en-US',
    fr: 'fr-FR',
    nl: 'nl-BE',
    ar: 'ar-SA',
  };
  return map[lang] || 'es-ES';
}
