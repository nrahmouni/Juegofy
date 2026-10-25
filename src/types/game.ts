export type ThemeId = 'candy' | 'jungle' | 'space' | 'ocean' | 'volcano';

export type StickerId = 'crown' | 'party' | 'cat' | 'star' | 'glasses' | 'astronaut' | 'pirate' | 'hero' | 'cape' | 'magic' | 'none';

export type PowerUpType = 'magnet' | 'shield' | 'doublePoints' | 'superJump' | 'nitro' | 'plasma';

export type ControlMode = 'offset' | 'joystick' | 'direct';

export type AgeGroup = 'preschool' | 'kids'; // 'preschool': 3-5 years, 'kids': 6-8 years

export type GameModeId =
  | 'classic_bomb'
  | 'lang_es_ar'
  | 'lang_flemish'
  | 'lang_french'
  | 'math_magic'
  | 'alphabet_hunt';

export type VehicleId = 'kart' | 'rocket' | 'ufo' | 'dragon' | 'broom' | 'cyber';

export type CostumeId = 'none' | 'crown' | 'hero_cape' | 'pirate' | 'astronaut' | 'dino' | 'rainbow_shades';

export interface PlayerConfig {
  id: number;
  name: string;
  photoUrl: string | null;
  fallbackEmoji: string;
  sticker: StickerId;
  color: string;
  activePowerUp?: PowerUpType | null;
  comboCount?: number;
  selectedLevel?: number; // 1 to 5
  coins?: number;
  unlockedVehicles?: VehicleId[];
  unlockedCostumes?: CostumeId[];
  selectedVehicle?: VehicleId;
  selectedCostume?: CostumeId;
}

export interface PlayerResult {
  playerId: number;
  playerName: string;
  photoUrl: string | null;
  fallbackEmoji: string;
  color: string;
  ok: boolean;
  time: number;
  progress: number;
  stars: number;
  coinsEarned?: number;
  maxCombo?: number;
  wordsLearned?: number;
  shieldUsed: boolean;
  challengeBonus: number;
  pts: number;
  path: [number, number][];
  gameMode?: GameModeId;
  selectedLevel?: number;
  why?: 'bomb' | 'bee' | 'edge' | 'lift';
}

export interface TrackItem {
  id: number;
  t: 's' | 'b' | 'm' | 'shield' | 'magnet' | 'mystery' | 'target_correct' | 'target_wrong' | 'nitro' | 'coin';
  x: number;
  y: number;
  r: number;
  nx?: number;
  ny?: number;
  am?: number;
  sp?: number;
  ph?: number;
  g?: boolean; // collected
  // Specific data for learning items
  text?: string;
  subText?: string;
  emoji?: string;
  isCorrect?: boolean;
}

export interface TrackData {
  pts: [number, number][];
  it: TrackItem[];
  w: number;
  decorations: { x: number; y: number; emoji: string; size: number; rot?: number }[];
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  icon: string;
  subtitle: string;
  bgColor1: string;
  bgColor2: string;
  roadColor: string;
  roadBorder: string;
  roadDash: string;
  accentColor: string;
  decorations: string[];
  movingObstacleEmoji: string;
  movingObstacleName: string;
  bombStyle: 'candy' | 'jungle' | 'space' | 'ocean' | 'volcano';
  musicScale: number[];
}

export type GameState =
  | 'SETUP'
  | 'THEME_SELECT'
  | 'READY'
  | 'PLAYING'
  | 'PAUSED'
  | 'CHALLENGE'
  | 'RESULT'
  | 'PODIUM';

