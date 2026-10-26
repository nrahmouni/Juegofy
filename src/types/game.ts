export type ThemeId = 'candy' | 'jungle' | 'space' | 'ocean' | 'volcano';

export type StickerId =
  | 'none'
  | 'crown'
  | 'glasses'
  | 'party'
  | 'pirate'
  | 'cat'
  | 'star'
  | 'wizard'
  | 'hero'
  | 'dino'
  | 'astronaut';

export type CostumeId =
  | 'none'
  | 'crown'
  | 'hero_cape'
  | 'pirate'
  | 'astronaut'
  | 'dino'
  | 'rainbow_shades';

export type AgeGroup = 'preschool' | 'kids';

export type PracticeLang = 'es' | 'fl' | 'ar' | 'fr';

// SOLO 10 JUEGOS PRINCIPALES + more
export type GameModeId =
  | 'monster_feeder'      // 1. Come-Palabras
  | 'slingshot_magic'     // 2. Tirachinas
  | 'word_dash'           // 3. Carrera
  | 'drag_match'          // 4. Empareja
  | 'rocket_race'         // 5. Cohete
  | 'bubble_pop'          // 6. NUEVO - Burbujas Mágicas
  | 'dress_up'            // 7. NUEVO - Viste a tu Amigo
  | 'safari_photo'        // 8. Safari Fotográfico (mejorado)
  | 'sentence_train'      // 9. NUEVO - Tren de Frases
  | 'crazy_kitchen'       // 10. Cocina del Chef
  // Los demás van a "Más Juegos"
  | 'lang_flemish'
  | 'lang_arabic'
  | 'lang_french'
  | 'magic_puzzle'
  | 'vehicle_pilot'
  | 'circuit_path'
  | 'flemish_world'
  | 'lang_spanish_abc'
  | 'lang_spanish_words';

export type VehicleId = 'kart' | 'rocket' | 'ufo' | 'dragon' | 'broom' | 'cyber';

export type TrailId = 'sparkles' | 'rainbow' | 'bubbles' | 'fire' | 'hearts' | 'lightning';

export interface PlayerConfig {
  id: number;
  name: string;
  photoUrl: string | null;
  fallbackEmoji: string;
  sticker: StickerId;
  color: string;
  coins?: number;
  vehicle?: VehicleId;
  selectedVehicle?: VehicleId;
  selectedCostume?: CostumeId;
  trail?: TrailId;
  unlockedStickers?: StickerId[];
  unlockedVehicles?: VehicleId[];
  unlockedCostumes?: CostumeId[];
  unlockedTrails?: TrailId[];
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  icon: string;
  subtitle?: string;
  bgGradient?: string;
  bgColor1?: string;
  bgColor2?: string;
  pathColor?: string;
  pathBorderColor?: string;
  roadColor?: string;
  roadBorder?: string;
  roadDash?: string;
  accentColor: string;
  decorations: string[];
  obstacleName?: string;
  obstacleEmoji?: string;
  movingObstacleEmoji?: string;
  movingObstacleName?: string;
  bombStyle?: string;
  musicScale?: number[];
}

export interface PlayerResult {
  playerId: number;
  playerName: string;
  photoUrl: string | null;
  fallbackEmoji: string;
  color: string;
  ok: boolean;
  why?: 'bomb' | 'bee' | 'edge' | 'lift';
  time: number;
  progress: number;
  stars: number;
  wordsLearned?: number;
  shieldUsed: boolean;
  challengeBonus: number;
  pts: number;
  coinsEarned?: number;
  path: { x: number; y: number }[];
  gameMode?: GameModeId;
  selectedLevel?: number;
}
