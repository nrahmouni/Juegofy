import { useMemo } from 'react';
import { LearningItem, SupportedLang, getText, getAudioLang } from '../types/learning';

export function useGameContent(items: LearningItem[], lang: SupportedLang = 'es') {
  return useMemo(() => {
    return items.map((item) => ({
      ...item,
      label: getText(item, lang),
      fallbackLabel: getText(item, 'es'),
      audioLang: getAudioLang(lang),
    }));
  }, [items, lang]);
}

export type ResolvedItem = ReturnType<typeof useGameContent>[number];
