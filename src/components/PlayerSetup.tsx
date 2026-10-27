import React, { useState } from 'react';
import {
  Settings,
  Play,
  ShoppingBag,
  X,
  Maximize,
  Volume2,
  VolumeX,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Camera,
  RotateCcw,
  Brain,
} from 'lucide-react';
import { PlayerConfig, ThemeId, StickerId, GameModeId, AgeGroup, PracticeLang } from '../types/game';
import { STICKERS, PLAYER_COLORS, DEFAULT_AVATARS } from '../data/themes';
import { GAME_MODES, MAX_GAME_LEVEL } from '../data/learningData';
import { PRACTICE_LANG_OPTIONS } from '../data/languagePools';
import { CameraCaptureModal } from './CameraCaptureModal';
import { GarageShopModal } from './GarageShopModal';
import { SmartLearningModal } from './SmartLearningModal';
import { sounds } from '../audio/soundManager';
import { MascotBuddy } from './common/MascotBuddy';
import { getDailyMission, loadIslandStars, loadStreak } from '../data/progress';

/** World map islands — groups modes so kids pick a place, then a game */
const WORLD_ISLANDS: {
  id: string;
  title: string;
  emoji: string;
  color: string;
  modeIds: GameModeId[];
}[] = [
  {
    id: 'action',
    title: 'Acción',
    emoji: '⚡',
    color: '#f43f5e',
    modeIds: ['monster_feeder', 'slingshot_magic', 'word_dash', 'rocket_race', 'vehicle_pilot', 'circuit_path'],
  },
  {
    id: 'words',
    title: 'Palabras',
    emoji: '📚',
    color: '#8b5cf6',
    modeIds: ['lang_spanish_words', 'lang_spanish_abc', 'drag_match', 'sentence_builder', 'magic_puzzle'],
  },
  {
    id: 'world',
    title: 'Idiomas',
    emoji: '🌍',
    color: '#0ea5e9',
    modeIds: ['lang_arabic', 'lang_french', 'safari_adventure'],
  },
  {
    id: 'flanders',
    title: 'Flandes',
    emoji: '🇧🇪',
    color: '#eab308',
    modeIds: ['flemish_world', 'lang_flemish'],
  },
  {
    id: 'kitchen',
    title: 'Cocina',
    emoji: '🍳',
    color: '#f97316',
    modeIds: ['crazy_kitchen', 'dress_up'],
  },
];


interface Props {
  players: PlayerConfig[];
  setPlayers: React.Dispatch<React.SetStateAction<PlayerConfig[]>>;
  selectedTheme: ThemeId;
  setSelectedTheme: (t: ThemeId) => void;
  difficulty: number;
  setDifficulty: (d: number) => void;
  selectedLevel: number;
  setSelectedLevel: (l: number) => void;
  learnedWordIds: string[];
  missedWordIds: string[];
  onResetProgress: () => void;
  gameMode: GameModeId;
  setGameMode: (m: GameModeId) => void;
  ageGroup: AgeGroup;
  setAgeGroup: (a: AgeGroup) => void;
  practiceLang: PracticeLang;
  setPracticeLang: (l: PracticeLang) => void;
  onStartGame: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PlayerSetup: React.FC<Props> = ({
  players,
  setPlayers,
  selectedLevel,
  setSelectedLevel,
  learnedWordIds,
  missedWordIds,
  onResetProgress,
  gameMode,
  setGameMode,
  ageGroup,
  setAgeGroup,
  practiceLang,
  setPracticeLang,
  onStartGame,
  onToggleFullscreen,
  isFullscreen,
  isMuted,
  onToggleMute,
}) => {
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [activeShopPlayerId, setActiveShopPlayerId] = useState<number>(() => players[0]?.id ?? 0);
  const [isSmartModalOpen, setIsSmartModalOpen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [islandId, setIslandId] = useState<string>(() => {
    const found = WORLD_ISLANDS.find((isl) => isl.modeIds.includes(gameMode));
    return found?.id || WORLD_ISLANDS[0].id;
  });
  const [galleryIndex, setGalleryIndex] = useState<number>(0);
  const [islandStars, setIslandStars] = useState(() => loadIslandStars());
  const mission = getDailyMission();
  const streak = loadStreak();
  const mascotMood =
    gameMode === 'word_dash' || gameMode === 'crazy_kitchen' || gameMode === 'magic_puzzle'
      ? 'cheer'
      : 'idle';

  const currentIsland = WORLD_ISLANDS.find((i) => i.id === islandId) || WORLD_ISLANDS[0];
  const islandModes = currentIsland.modeIds
    .map((id) => GAME_MODES.find((m) => m.id === id))
    .filter(Boolean) as typeof GAME_MODES;

  const handleUpdateName = (index: number, newName: string) => {
    setPlayers((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, name: newName.substring(0, 12).toUpperCase() } : p))
    );
  };

  const handleSavePhoto = (photoUrl: string | null, sticker: StickerId) => {
    if (editingPlayerIndex === null) return;
    setPlayers((prev) =>
      prev.map((p, idx) => (idx === editingPlayerIndex ? { ...p, photoUrl, sticker } : p))
    );
    setEditingPlayerIndex(null);
  };

  const handleAddPlayer = () => {
    if (players.length >= 4) return;
    sounds.sfxPop();
    const nextIdx = players.length;
    const defaultNames = ['FAYSAL', 'MERIEM', 'LEO', 'SOFÍA'];
    const newPlayer: PlayerConfig = {
      id: Date.now(),
      name: defaultNames[nextIdx] || `JUGADOR ${nextIdx + 1}`,
      photoUrl: null,
      fallbackEmoji: DEFAULT_AVATARS[nextIdx % DEFAULT_AVATARS.length].emoji,
      sticker: 'none',
      color: PLAYER_COLORS[nextIdx % PLAYER_COLORS.length],
      coins: 100,
    };
    setPlayers([...players, newPlayer]);
    sounds.speak(`Hola ${newPlayer.name}`, 'es-ES');
  };

  const handleRemovePlayer = (id: number) => {
    if (players.length <= 1) return;
    sounds.sfxPop();
    setPlayers(players.filter((p) => p.id !== id));
  };

  const handleMovePlayer = (index: number, direction: 'left' | 'right') => {
    sounds.sfxPop();
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === players.length - 1) return;

    const newPlayers = [...players];
    const swapIndex = direction === 'left' ? index - 1 : index + 1;
    [newPlayers[index], newPlayers[swapIndex]] = [newPlayers[swapIndex], newPlayers[index]];
    setPlayers(newPlayers);
  };

  const handleSelectGame = (modeId: GameModeId, title: string) => {
    sounds.sfxPop();
    setGameMode(modeId);
    sounds.speak(title, 'es-ES');
  };

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Decorative canvas-like background (CSS orbs + SVG stars) — no external images */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 -left-16 w-64 h-64 rounded-full bg-fuchsia-600/30 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-56 h-56 rounded-full bg-amber-400/20 blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="white" opacity="0.25" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
          <circle cx="12%" cy="18%" r="3" fill="#fde047" />
          <circle cx="88%" cy="22%" r="2" fill="#a5f3fc" />
          <circle cx="70%" cy="8%" r="2.5" fill="#f9a8d4" />
          <path d="M20 80 L22 86 L28 86 L23 90 L25 96 L20 92 L15 96 L17 90 L12 86 L18 86 Z" fill="#fde047" opacity="0.7" transform="translate(40, -20) scale(0.45)" />
        </svg>
      </div>

      {/* Safe area padding */}
      <div className="relative z-10 flex flex-col h-full px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] gap-2 max-w-lg mx-auto w-full">

        {/* HEADER compact */}
        <header className="flex items-center justify-between shrink-0 gap-2">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-white leading-none tracking-tight">
              Mundo <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400">Mágico</span>
            </h1>
            <p className="text-[10px] font-bold text-white/50 mt-0.5">Nivel {selectedLevel} · {learnedWordIds.length} palabras</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button type="button" onClick={() => { sounds.sfxPop(); setIsSmartModalOpen(true); }} className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-emerald-300" aria-label="Progreso">
              <Brain className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => { sounds.sfxPop(); onToggleMute(); }} className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center" aria-label="Sonido">
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button type="button" onClick={() => { sounds.sfxPop(); setIsShopOpen(true); }} className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-amber-300" aria-label="Tienda">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-[10px] font-black tabular-nums">{players[0]?.coins ?? 100}</span>
            </button>
            <button type="button" onClick={() => { sounds.sfxPop(); setShowSettings(true); }} className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white" aria-label="Ajustes">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* PLAYERS — single horizontal strip (mobile first) */}
        <section className="shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {players.map((player, idx) => (
              <div
                key={player.id}
                className="shrink-0 flex items-center gap-1.5 bg-white rounded-2xl pl-1 pr-2 py-1 shadow-lg border-b-4 min-w-0"
                style={{ borderBottomColor: player.color }}
              >
                <button
                  type="button"
                  onClick={() => { sounds.sfxPop(); setEditingPlayerIndex(idx); }}
                  className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center text-lg border border-slate-200"
                >
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{player.fallbackEmoji}</span>
                  )}
                </button>
                <input
                  value={player.name}
                  onChange={(e) => handleUpdateName(idx, e.target.value)}
                  className="w-[4.5rem] bg-transparent text-[11px] font-black text-slate-800 uppercase outline-none"
                  maxLength={12}
                  aria-label={`Nombre jugador ${idx + 1}`}
                />
                {players.length > 1 && (
                  <button type="button" onClick={() => handleRemovePlayer(player.id)} className="text-rose-400 p-0.5" aria-label="Quitar">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {players.length < 4 && (
              <button
                type="button"
                onClick={handleAddPlayer}
                className="shrink-0 w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg border-b-4 border-emerald-700"
                aria-label="Añadir jugador"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </section>

        {/* LANGUAGE — big touch targets */}
        <section className="shrink-0">
          <div className="text-[9px] font-black uppercase tracking-widest text-yellow-300/90 mb-1 px-0.5">Idioma del juego</div>
          <div className="grid grid-cols-4 gap-1.5">
            {PRACTICE_LANG_OPTIONS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  sounds.sfxPop();
                  setPracticeLang(l.id);
                }}
                className={`rounded-2xl py-2 flex flex-col items-center gap-0.5 border-b-4 transition-transform active:scale-95 ${
                  practiceLang === l.id
                    ? 'bg-yellow-300 text-slate-900 border-yellow-600 scale-[1.03] shadow-lg'
                    : 'bg-white/10 text-white border-white/10'
                }`}
              >
                <span className="text-xl leading-none">{l.flag}</span>
                <span className="text-[9px] font-black">{l.short}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Daily mission + streak (free retention) */}
        <section className="shrink-0 rounded-2xl bg-white/10 border border-white/15 px-3 py-2 flex items-center gap-2">
          <div className="text-xl">🎯</div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-black uppercase text-amber-300">Misión de hoy</div>
            <div className="text-[11px] font-bold text-white truncate">{mission.label}</div>
            <div className="h-1.5 mt-1 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (mission.progress / mission.goal) * 100)}%` }}
              />
            </div>
          </div>
          <div className="text-center shrink-0">
            <div className="text-[10px] font-black text-orange-300">🔥 {streak.count}</div>
            <div className="text-[8px] font-bold text-white/50">días</div>
          </div>
        </section>

        {/* LEVEL chips compact */}
        <section className="shrink-0 flex items-center gap-1 overflow-x-auto no-scrollbar">
          <span className="text-[9px] font-black text-white/60 uppercase shrink-0">Nivel</span>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                sounds.sfxPop();
                setSelectedLevel(lvl);
              }}
              className={`w-7 h-7 rounded-lg text-[11px] font-black shrink-0 ${
                selectedLevel === lvl
                  ? lvl >= 6
                    ? 'bg-pink-500 text-white ring-2 ring-yellow-300'
                    : 'bg-yellow-400 text-slate-900'
                  : 'bg-white/10 text-white/70'
              }`}
            >
              {lvl}
            </button>
          ))}
        </section>

        {/* ISLANDS */}
        <section className="shrink-0">
          <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
            <MascotBuddy mood={mascotMood as any} size="sm" />
            <span className="text-[10px] font-black text-white/80 uppercase tracking-wide">1. Isla · 2. Juego</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {WORLD_ISLANDS.map((isl) => {
              const active = isl.id === islandId;
              return (
                <button
                  key={isl.id}
                  type="button"
                  onClick={() => {
                    sounds.sfxPop();
                    setIslandId(isl.id);
                    setGalleryIndex(0);
                    const first = GAME_MODES.find((m) => m.id === isl.modeIds[0]);
                    if (first) setGameMode(first.id);
                  }}
                  className={`rounded-2xl py-2 px-0.5 flex flex-col items-center border-b-4 transition-all ${
                    active
                      ? 'bg-white text-slate-900 border-yellow-400 shadow-xl scale-105'
                      : 'bg-white/10 text-white border-transparent'
                  }`}
                >
                  <span className="text-xl leading-none">{isl.emoji}</span>
                  <span className="text-[8px] font-black mt-0.5 truncate max-w-full">{isl.title}</span>
                  {(islandStars[isl.id] || 0) > 0 && (
                    <span className="text-[8px] font-black text-amber-300">⭐{islandStars[isl.id]}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* GAME CARD — flex grow, center */}
        <section className="flex-1 min-h-0 flex items-center gap-2">
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => {
              sounds.sfxPop();
              setGalleryIndex((i) => {
                const next = (i - 1 + islandModes.length) % Math.max(1, islandModes.length);
                const mode = islandModes[next];
                if (mode) {
                  setGameMode(mode.id);
                  void sounds.speakAsync(mode.title, 'es-ES', true);
                }
                return next;
              });
            }}
            className="shrink-0 w-11 h-11 rounded-2xl bg-white text-slate-800 shadow-xl border-b-4 border-slate-300 flex items-center justify-center active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0 h-full max-h-[200px] flex items-stretch">
            {(() => {
              const mode = islandModes[galleryIndex] || islandModes[0];
              if (!mode) return null;
              return (
                <button
                  type="button"
                  onClick={() => handleSelectGame(mode.id, mode.title)}
                  className="w-full rounded-[1.5rem] p-3 text-left border-b-8 border-black/25 shadow-2xl relative overflow-hidden active:scale-[0.98] transition-transform"
                  style={{
                    background: `linear-gradient(145deg, ${mode.color} 0%, ${mode.color}bb 45%, #0f172a 130%)`,
                  }}
                >
                  {/* SVG decoration on card */}
                  <svg className="absolute right-0 top-0 w-28 h-28 opacity-20" viewBox="0 0 100 100" aria-hidden>
                    <circle cx="70" cy="30" r="40" fill="white" />
                    <circle cx="90" cy="70" r="25" fill="white" />
                  </svg>
                  <div className="relative z-10 flex flex-col h-full justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-14 h-14 rounded-2xl bg-white/25 border border-white/30 flex items-center justify-center text-3xl shadow-inner">
                        {mode.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-black uppercase text-white/80 truncate">{mode.badge}</div>
                        <div className="text-base font-black text-white leading-tight">{mode.title}</div>
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-white/95 leading-snug line-clamp-2">{mode.tagline}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black bg-white/20 text-white px-2 py-1 rounded-lg">{mode.mechanicBadge}</span>
                      <span className="text-[10px] font-black text-white/70 tabular-nums">
                        {galleryIndex + 1}/{islandModes.length}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })()}
          </div>

          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => {
              sounds.sfxPop();
              setGalleryIndex((i) => {
                const next = (i + 1) % Math.max(1, islandModes.length);
                const mode = islandModes[next];
                if (mode) {
                  setGameMode(mode.id);
                  void sounds.speakAsync(mode.title, 'es-ES', true);
                }
                return next;
              });
            }}
            className="shrink-0 w-11 h-11 rounded-2xl bg-white text-slate-800 shadow-xl border-b-4 border-slate-300 flex items-center justify-center active:scale-95"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </section>

        {/* dots */}
        <div className="flex justify-center gap-1.5 shrink-0">
          {islandModes.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                sounds.sfxPop();
                setGalleryIndex(i);
                setGameMode(m.id);
              }}
              className={`h-2 rounded-full transition-all ${i === galleryIndex ? 'w-5 bg-yellow-300' : 'w-2 bg-white/35'}`}
            />
          ))}
        </div>

        {/* PLAY — sticky bottom, always visible */}
        <button
          type="button"
          onClick={() => {
            sounds.sfxPop();
            onStartGame();
          }}
          className="shrink-0 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 text-white font-black text-lg shadow-2xl border-b-8 border-indigo-900 flex items-center justify-center gap-2 active:translate-y-0.5 active:border-b-4"
        >
          <Play className="w-6 h-6 fill-white" />
          ¡JUGAR{players[0]?.name ? ` (${players[0].name})` : ''}!
        </button>
      </div>


      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-[3rem] p-7 shadow-2xl relative border-b-8 border-slate-200">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute -top-3 -right-3 p-3.5 bg-rose-500 text-white rounded-2xl shadow-xl btn-squishy"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-black text-indigo-950 mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Settings className="w-6 h-6" /> Ajustes
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Edad de los Jugadores
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      sounds.sfxPop();
                      setAgeGroup('preschool');
                    }}
                    className={`p-4 rounded-2xl border-4 flex flex-col items-center gap-1 transition-all ${
                      ageGroup === 'preschool'
                        ? 'bg-indigo-50 border-indigo-500'
                        : 'bg-slate-50 border-transparent opacity-60'
                    }`}
                  >
                    <span className="text-3xl">🐣</span>
                    <span className="font-black text-indigo-900 text-xs">3 a 5 AÑOS</span>
                  </button>
                  <button
                    onClick={() => {
                      sounds.sfxPop();
                      setAgeGroup('kids');
                    }}
                    className={`p-4 rounded-2xl border-4 flex flex-col items-center gap-1 transition-all ${
                      ageGroup === 'kids'
                        ? 'bg-pink-50 border-pink-500'
                        : 'bg-slate-50 border-transparent opacity-60'
                    }`}
                  >
                    <span className="text-3xl">🚀</span>
                    <span className="font-black text-pink-900 text-xs">6 a 9 AÑOS</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onToggleFullscreen}
                  className="flex-1 py-3.5 bg-slate-100 rounded-2xl font-black text-slate-700 text-xs flex items-center justify-center gap-2 btn-squishy"
                >
                  <Maximize className="w-4 h-4" /> {isFullscreen ? 'Ventana' : 'Pantalla Completa'}
                </button>
                <button
                  onClick={onToggleMute}
                  className="flex-1 py-3.5 bg-slate-100 rounded-2xl font-black text-slate-700 text-xs flex items-center justify-center gap-2 btn-squishy"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />} Sonido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera / Avatar Picker Modal */}
      {editingPlayerIndex !== null && players[editingPlayerIndex] && (
        <CameraCaptureModal
          playerName={players[editingPlayerIndex].name}
          initialPhoto={players[editingPlayerIndex].photoUrl}
          initialSticker={players[editingPlayerIndex].sticker}
          onSave={handleSavePhoto}
          onClose={() => setEditingPlayerIndex(null)}
        />
      )}

      {/* Shop Modal */}
      {isShopOpen && (
        <GarageShopModal
          players={players}
          setPlayers={setPlayers}
          activePlayerId={activeShopPlayerId}
          setActivePlayerId={setActiveShopPlayerId}
          onClose={() => setIsShopOpen(false)}
        />
      )}

      {/* Smart Adaptive Learning Modal */}
      {isSmartModalOpen && (
        <SmartLearningModal
          learnedWordIds={learnedWordIds}
          missedWordIds={missedWordIds}
          onResetProgress={onResetProgress}
          onClose={() => setIsSmartModalOpen(false)}
        />
      )}
    </div>
  );
};
