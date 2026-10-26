export type ThemeId = 'candy' | 'jungle' | 'space' | 'ocean' | 'volcano';
export type StickerId = 'none' | 'crown' | 'glasses' | 'party' | 'pirate' | 'cat' | 'star' | 'wizard' | 'hero' | 'dino' | 'astronaut';
export type CostumeId = 'none' | 'crown' | 'hero_cape' | 'pirate' | 'astronaut' | 'dino' | 'rainbow_shades';
export type AgeGroup = 'preschool' | 'kids';
export type PracticeLang = 'es' | 'fl' | 'ar' | 'fr';

export type GameModeId =
  | 'monster_feeder'
  | 'slingshot_magic'
  | 'word_dash'
  | 'drag_match'
  | 'rocket_race'
  | 'bubble_pop'
  | 'dress_up'
  | 'safari_photo'
  | 'sentence_train'
  | 'crazy_kitchen'
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
  accentColor: string;
  decorations: string[];
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
