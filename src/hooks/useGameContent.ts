import { useMemo } from 'react';
import {
  LearningItemV2,
  SupportedLang,
  getText,
  getAudioText,
  AUDIO_LANG_MAP,
} from '../types/learning';
import { VOCAB_ITEMS } from '../data/vocabV2';

/**
 * Hook central de contenido.
 * - Recibe el idioma activo desde el contexto global (practiceLang).
 * - Devuelve items ya resueltos al idioma correcto.
 * - Fallback automático: idioma pedido → es → en.
 */
export function useGameContent(lang: SupportedLang = 'es', level = 1) {
  const items = useMemo(() => {
    return VOCAB_ITEMS
      .filter((i) => i.level <= level + 1)
      .map((item) => ({
        ...item,
        label: getText(item, lang),
        audioText: getAudioText(item, lang),
        audioLang: AUDIO_LANG_MAP[lang] || 'es-ES',
        fallbackLabel: getText(item, 'es'),
      }));
  }, [lang, level]);

  const getItemText = (item: LearningItemV2) => getText(item, lang);
  const getItemAudio = (item: LearningItemV2) => ({
    text: getAudioText(item, lang),
    lang: AUDIO_LANG_MAP[lang] || 'es-ES',
  });

  return {
    items,
    getItemText,
    getItemAudio,
    lang,
  };
}

export type ResolvedItem = ReturnType<typeof useGameContent>['items'][number];
