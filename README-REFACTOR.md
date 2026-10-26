# Juegofy – Refactor Fase 1 + Juego Point-and-Click

## Qué incluye este pack

### Fase 1 – Arquitectura Multi-idioma
- `src/types/learning.ts` → tipos unificados con `translations: { es, en, fr, ar, nl }`
- `src/hooks/useGameContent.ts` → hook central con fallback automático
- `src/data/vocabV2.ts` → vocabulario de ejemplo multi-idioma

### Fase 2 – Juego real (no quiz)
- `src/components/games/SchoolMysteryGame.tsx`
  - Point-and-click: "Misterio en la Escuela"
  - El jugador explora el aula, toca objetos, aprende el vocabulario del entorno
  - Encuentra la llave → abre la puerta
  - Feedback mecánico (puerta cerrada / llave encontrada / puerta abierta)
  - Sin botones de opción múltiple

## Cómo integrar

1. Copia los archivos nuevos.
2. En `GameCanvas.tsx` añade:

```tsx
import { SchoolMysteryGame } from './games/SchoolMysteryGame';

// Dentro del main:
{gameMode === 'school_mystery' && (
  <SchoolMysteryGame
    player={player}
    practiceLang={practiceLang}
    selectedLevel={selectedLevel}
    learnedWordIds={learnedWordIds}
    onMarkWordLearned={onMarkWordLearned}
    onWin={handleWin}
    setProgressPercent={setProgressPercent}
    setStarsCollected={setStarsCollected}
    setWordsLearned={setWordsLearned}
  />
)}
```

3. Añade `'school_mystery'` al tipo `GameModeId`.

## Próximos pasos recomendados
- Migrar MonsterFeeder / Slingshot / etc. a `useGameContent`
- Eliminar `langKey` local de todos los juegos
- Implementar Juego 2 (Pet Shop) y Juego 3 (Word-Builder)
