# Magic Island – Prototipo Main Game (Phaser 3 + React)

## Qué es
El núcleo del juego principal de Juegofy: un RPG 2D top-down donde el idioma es la mecánica, no un quiz.

## Archivos nuevos
- `src/game/EventBus.ts` → puente React ↔ Phaser
- `src/game/scenes/MainScene.ts` → escena con jugador, manzano, panadero, colisiones
- `src/components/games/MagicIslandGame.tsx` → componente React que embebe Phaser

## Dependencia
```bash
bun add phaser
# o
npm install phaser
```

## Cómo probar
1. Instala phaser
2. Añade en GameCanvas o en un botón de prueba:
```tsx
import { MagicIslandGame } from './games/MagicIslandGame';

// ...
{showIsland && (
  <MagicIslandGame
    player={player}
    practiceLang={practiceLang}
    onExit={() => setShowIsland(false)}
  />
)}
```

## Controles
- Flechas / WASD → mover
- Espacio o botón "A" → interactuar
- Toca manzanas en el inventario cuando la misión esté activa → entregar al panadero

## Próximos pasos
- Mapa con Tiled
- Sprites reales
- Más NPCs y quests
- Joystick virtual mejorado
- SRS integrado en diálogos
