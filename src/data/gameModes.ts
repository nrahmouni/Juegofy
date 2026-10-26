import { GameModeId } from '../types/game';

export interface GameModeConfig {
  id: GameModeId;
  title: string;
  shortTitle: string;
  icon: string;          // emoji grande
  color: string;
  description: string;
  mechanic: string;
  isNew?: boolean;
  isCore: boolean;       // true = aparece en la pantalla principal
}

/** SOLO 10 JUEGOS PRINCIPALES - limpios y claros */
export const CORE_GAMES: GameModeConfig[] = [
  {
    id: 'monster_feeder',
    title: '¡Come-Palabras!',
    shortTitle: 'Monstruo',
    icon: '👾',
    color: '#ec4899',
    description: 'Arrastra la comida correcta a la boca del monstruo',
    mechanic: 'Arrastra y alimenta',
    isCore: true,
  },
  {
    id: 'slingshot_magic',
    title: 'Tirachinas Mágico',
    shortTitle: 'Tirachinas',
    icon: '🏹',
    color: '#d946ef',
    description: 'Estira y lanza a la nube correcta',
    mechanic: 'Estira y dispara',
    isCore: true,
  },
  {
    id: 'word_dash',
    title: 'Carrera de Palabras',
    shortTitle: 'Carrera',
    icon: '🏃',
    color: '#10b981',
    description: 'Corre, cambia de carril y atrapa solo la palabra buena',
    mechanic: 'Corre y atrapa',
    isCore: true,
  },
  {
    id: 'drag_match',
    title: 'Empareja Mágico',
    shortTitle: 'Empareja',
    icon: '🧲',
    color: '#a855f7',
    description: 'Une cada dibujo con su palabra',
    mechanic: 'Arrastra y une',
    isCore: true,
  },
  {
    id: 'rocket_race',
    title: 'Cohete Turbo',
    shortTitle: 'Cohete',
    icon: '🚀',
    color: '#06b6d4',
    description: 'Pilota el cohete y atrapa las estrellas correctas',
    mechanic: 'Pilota y atrapa',
    isCore: true,
  },
  {
    id: 'bubble_pop',
    title: 'Burbujas Mágicas',
    shortTitle: 'Burbujas',
    icon: '🫧',
    color: '#14b8a6',
    description: 'Escucha la palabra y explota la burbuja correcta',
    mechanic: 'Escucha y explota',
    isNew: true,
    isCore: true,
  },
  {
    id: 'dress_up',
    title: 'Viste a tu Amigo',
    shortTitle: 'Vestir',
    icon: '👗',
    color: '#ec4899',
    description: 'Ponle la ropa correcta a tu amigo',
    mechanic: 'Arrastra la ropa',
    isNew: true,
    isCore: true,
  },
  {
    id: 'safari_photo',
    title: 'Safari Fotográfico',
    shortTitle: 'Safari',
    icon: '📸',
    color: '#f97316',
    description: 'Encuentra y fotografía el animal correcto',
    mechanic: 'Enfoca y dispara',
    isCore: true,
  },
  {
    id: 'sentence_train',
    title: 'El Tren de las Frases',
    shortTitle: 'Tren',
    icon: '🚂',
    color: '#f43f5e',
    description: 'Ordena las palabras para formar la frase',
    mechanic: 'Ordena el tren',
    isNew: true,
    isCore: true,
  },
  {
    id: 'crazy_kitchen',
    title: 'Cocina del Chef',
    shortTitle: 'Cocina',
    icon: '🍳',
    color: '#f97316',
    description: 'El chef pide ingredientes en orden. ¡Cocínalos!',
    mechanic: 'Arrastra al sartén',
    isCore: true,
  },
];

/** Juegos extra (van dentro de "Más Juegos") */
export const MORE_GAMES: GameModeConfig[] = [
  {
    id: 'lang_flemish',
    title: 'Topos Flamencos',
    shortTitle: 'Flamenco',
    icon: '🌻',
    color: '#eab308',
    description: 'Atrapa el topo correcto en flamenco',
    mechanic: 'Atrapa rápido',
    isCore: false,
  },
  {
    id: 'lang_arabic',
    title: 'Genio Árabe',
    shortTitle: 'Árabe',
    icon: '🧞',
    color: '#10b981',
    description: 'Burbujas del genio en árabe',
    mechanic: 'Explota burbujas',
    isCore: false,
  },
  {
    id: 'lang_french',
    title: 'Chef de París',
    shortTitle: 'Francés',
    icon: '🥐',
    color: '#3b82f6',
    description: 'Sirve los platos en francés',
    mechanic: 'Sirve el plato',
    isCore: false,
  },
  {
    id: 'magic_puzzle',
    title: 'Puzzle Mágico',
    shortTitle: 'Puzzle',
    icon: '🧩',
    color: '#8b5cf6',
    description: 'Encaja las piezas correctas',
    mechanic: 'Encaja piezas',
    isCore: false,
  },
];

export const ALL_GAMES = [...CORE_GAMES, ...MORE_GAMES];

export function getGameById(id: GameModeId): GameModeConfig | undefined {
  return ALL_GAMES.find((g) => g.id === id);
}
