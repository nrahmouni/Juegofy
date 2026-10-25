import { ThemeConfig, ThemeId } from '../types/game';

export const THEMES: Record<ThemeId, ThemeConfig> = {
  candy: {
    id: 'candy',
    name: 'Mundo Dulces 🍭',
    icon: '🍭',
    subtitle: 'Nubes de algodón y caramelos saltarines',
    bgColor1: '#db2777',
    bgColor2: '#7e22ce',
    roadColor: '#ffffff',
    roadBorder: '#be123c',
    roadDash: '#f472b6',
    accentColor: '#f43f5e',
    decorations: ['🧁', '🍩', '🍬', '🍭', '🍓', '🎂', '🍧', '🍫'],
    movingObstacleEmoji: '🧁',
    movingObstacleName: 'Pastelito volador',
    bombStyle: 'candy',
    musicScale: [523, 659, 784, 880]
  },
  jungle: {
    id: 'jungle',
    name: 'Selva Encantada 🌴',
    icon: '🌴',
    subtitle: 'Lianas mágicas, mariposas y abejitas',
    bgColor1: '#15803d',
    bgColor2: '#14532d',
    roadColor: '#fef08a',
    roadBorder: '#c2410c',
    roadDash: '#ffffff',
    accentColor: '#16a34a',
    decorations: ['🌳', '🌴', '🌸', '🍄', '🌼', '🌷', '🍎', '🦋'],
    movingObstacleEmoji: '🐝',
    movingObstacleName: 'Abeja zumbadora',
    bombStyle: 'jungle',
    musicScale: [440, 523, 659, 784]
  },
  space: {
    id: 'space',
    name: 'Galaxia Cósmica 🚀',
    icon: '🚀',
    subtitle: 'Nebulosas brillantes y platillos voladores',
    bgColor1: '#090d16',
    bgColor2: '#1e1b4b',
    roadColor: '#ffffff',
    roadBorder: '#6366f1',
    roadDash: '#a5b4fc',
    accentColor: '#6366f1',
    decorations: ['⭐', '🪐', '🌙', '✨', '🛸', '☄️', '🌌', '👾'],
    movingObstacleEmoji: '🛸',
    movingObstacleName: 'Mini OVNI',
    bombStyle: 'space',
    musicScale: [587, 740, 880, 987]
  },
  ocean: {
    id: 'ocean',
    name: 'Fondo Marino 🐬',
    icon: '🐬',
    subtitle: 'Corales de fantasía y medusas flotantes',
    bgColor1: '#0369a1',
    bgColor2: '#082f49',
    roadColor: '#fef9c3',
    roadBorder: '#0891b2',
    roadDash: '#38bdf8',
    accentColor: '#0284c7',
    decorations: ['🪸', '🐠', '🫧', '🐚', '🦀', '🐙', '🌊', '🌟'],
    movingObstacleEmoji: '🪼',
    movingObstacleName: 'Medusa curiosa',
    bombStyle: 'ocean',
    musicScale: [493, 659, 784, 880]
  },
  volcano: {
    id: 'volcano',
    name: 'Isla Lava Alegre 🌋',
    icon: '🌋',
    subtitle: 'Rocas chispeantes y fueguitos traviesos',
    bgColor1: '#7c2d12',
    bgColor2: '#431407',
    roadColor: '#ffedd5',
    roadBorder: '#b91c1c',
    roadDash: '#f97316',
    accentColor: '#ea580c',
    decorations: ['🔥', '💎', '🌋', '🪨', '⚡', '✨', '🦎', '🌟'],
    movingObstacleEmoji: '🔥',
    movingObstacleName: 'Chispita saltarina',
    bombStyle: 'volcano',
    musicScale: [523, 622, 698, 784]
  }
};

export const STICKERS = [
  { id: 'none', label: 'Sin adorno', icon: '✨' },
  { id: 'crown', label: 'Corona Real', icon: '👑' },
  { id: 'party', label: 'Fiesta', icon: '🥳' },
  { id: 'cat', label: 'Gatito', icon: '🐱' },
  { id: 'star', label: 'Estrella', icon: '⭐' },
  { id: 'glasses', label: 'Gafas Cool', icon: '😎' },
  { id: 'astronaut', label: 'Astronauta', icon: '🧑‍🚀' },
  { id: 'pirate', label: 'Pirata', icon: '🏴‍☠️' },
  { id: 'hero', label: 'Superhéroe', icon: '🦸' },
] as const;

export const PLAYER_COLORS = [
  '#10b981', // Verde esmeralda
  '#f97316', // Naranja soleado
  '#ec4899', // Rosa chicle
  '#3b82f6', // Azul eléctrico
];

export const DEFAULT_AVATARS = [
  { emoji: '🐸', name: 'Rana' },
  { emoji: '🐥', name: 'Pollito' },
  { emoji: '🦄', name: 'Unicornio' },
  { emoji: '🐼', name: 'Panda' },
  { emoji: '🦁', name: 'León' },
  { emoji: '🐶', name: 'Perrito' },
  { emoji: '🐰', name: 'Conejito' },
  { emoji: '🐯', name: 'Tigre' },
];
