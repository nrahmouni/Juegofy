import React, { useState } from 'react';
import {
  Play,
  ShoppingBag,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Brain,
  ChevronRight,
} from 'lucide-react';
import { PlayerConfig, GameModeId, PracticeLang, AgeGroup } from '../types/game';
import { CORE_GAMES, MORE_GAMES, getGameById } from '../data/gameModes';
import { GAME_ICONS } from './common/GameIcons';
import { sounds } from '../audio/soundManager';

// Fallbacks por si faltan datos externos
const PLAYER_COLORS = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981'];
const DEFAULT_AVATARS = [
  { emoji: '🐰' },
  { emoji: '🦄' },
  { emoji: '🦁' },
  { emoji: '🐸' },
];
const PRACTICE_LANG_OPTIONS = [
  { id: 'es' as PracticeLang, flag: '🇪🇸', short: 'ES' },
  { id: 'fl' as PracticeLang, flag: '🇧🇪', short: 'NL' },
  { id: 'ar' as PracticeLang, flag: '🇸🇦', short: 'AR' },
  { id: 'fr' as PracticeLang, flag: '🇫🇷', short: 'FR' },
];

interface Props {
  players: PlayerConfig[];
  setPlayers: React.Dispatch<React.SetStateAction<PlayerConfig[]>>;
  gameMode: GameModeId;
  setGameMode: (m: GameModeId) => void;
  ageGroup: AgeGroup;
  setAgeGroup: (a: AgeGroup) => void;
  practiceLang: PracticeLang;
  setPracticeLang: (l: PracticeLang) => void;
  selectedLevel: number;
  setSelectedLevel: (l: number) => void;
  learnedWordIds: string[];
  missedWordIds: string[];
  onResetProgress: () => void;
  onStartGame: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  selectedTheme: any;
  setSelectedTheme: any;
  difficulty: number;
  setDifficulty: any;
}

export const PlayerSetup: React.FC<Props> = ({
  players,
  setPlayers,
  gameMode,
  setGameMode,
  practiceLang,
  setPracticeLang,
  selectedLevel,
  learnedWordIds,
  onStartGame,
  isMuted,
  onToggleMute,
}) => {
  const [showMoreGames, setShowMoreGames] = useState(false);

  const handleAddPlayer = () => {
    if (players.length >= 4) return;
    sounds.sfxPop?.();
    const nextIdx = players.length;
    const defaultNames = ['NAIMO', 'MARIEM', 'LEO', 'SOFÍA'];
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
  };

  const handleRemovePlayer = (id: number) => {
    if (players.length <= 1) return;
    sounds.sfxPop?.();
    setPlayers(players.filter((p) => p.id !== id));
  };

  const handleSelectGame = (id: GameModeId) => {
    sounds.sfxPop?.();
    setGameMode(id);
  };

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-fuchsia-600/25 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-64 h-64 rounded-full bg-amber-400/15 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col h-full px-3 pt-[max(0.4rem,env(safe-area-inset-top))] pb-[max(0.4rem,env(safe-area-inset-bottom))] gap-2 max-w-lg mx-auto w-full">

        {/* HEADER */}
        <header className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-black text-white leading-none tracking-tight">
              Mundo <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400">Mágico</span>
            </h1>
            <p className="text-[10px] font-bold text-white/50 mt-0.5">
              {learnedWordIds.length} palabras · Nivel {selectedLevel}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { sounds.sfxPop?.(); onToggleMute(); }}
              className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              type="button"
              className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-amber-300"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* JUGADORES */}
        <section className="shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {players.map((player, idx) => (
              <div
                key={player.id}
                className="shrink-0 flex items-center gap-2 bg-white rounded-2xl pl-1.5 pr-2.5 py-1.5 shadow-lg border-b-4"
                style={{ borderBottomColor: player.color }}
              >
                <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center text-2xl border border-slate-200">
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{player.fallbackEmoji}</span>
                  )}
                </div>
                <input
                  value={player.name}
                  onChange={(e) => {
                    setPlayers((prev) =>
                      prev.map((p, i) =>
                        i === idx ? { ...p, name: e.target.value.substring(0, 10).toUpperCase() } : p
                      )
                    );
                  }}
                  className="w-20 bg-transparent text-sm font-black text-slate-800 uppercase outline-none"
                  maxLength={10}
                />
                {players.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(player.id)}
                    className="text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {players.length < 4 && (
              <button
                type="button"
                onClick={handleAddPlayer}
                className="shrink-0 w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg border-b-4 border-emerald-700"
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </div>
        </section>

        {/* IDIOMA */}
        <section className="shrink-0">
          <div className="grid grid-cols-4 gap-2">
            {PRACTICE_LANG_OPTIONS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  sounds.sfxPop?.();
                  setPracticeLang(l.id);
                }}
                className={`rounded-2xl py-2.5 flex flex-col items-center gap-0.5 border-b-4 transition-all active:scale-95 ${
                  practiceLang === l.id
                    ? 'bg-yellow-300 text-slate-900 border-yellow-600 scale-[1.04] shadow-lg'
                    : 'bg-white/10 text-white border-white/10'
                }`}
              >
                <span className="text-2xl leading-none">{l.flag}</span>
                <span className="text-[10px] font-black">{l.short}</span>
              </button>
            ))}
          </div>
        </section>

        {/* LOS 10 JUEGOS - AHORA CON SVG */}
        <section className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1.5 px-0.5">
            Elige un juego
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {CORE_GAMES.map((game) => {
              const isSelected = gameMode === game.id;
              const IconComponent = GAME_ICONS[game.id];

              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => handleSelectGame(game.id)}
                  className={`relative rounded-2xl p-3 text-left border-b-6 transition-all active:scale-[0.97] overflow-hidden ${
                    isSelected
                      ? 'ring-4 ring-yellow-300 scale-[1.02] shadow-2xl'
                      : 'shadow-lg'
                  }`}
                  style={{
                    background: `linear-gradient(145deg, ${game.color} 0%, ${game.color}cc 50%, #0f172a 140%)`,
                    borderColor: isSelected ? '#fde047' : 'rgba(0,0,0,0.25)',
                  }}
                >
                  {game.isNew && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] font-black bg-yellow-300 text-slate-900 px-1.5 py-0.5 rounded-full z-10">
                      NUEVO
                    </span>
                  )}

                  {/* ICONO SVG ANIMADO en lugar de emoji */}
                  <div className="w-14 h-14 mb-1 flex items-center justify-center">
                    {IconComponent ? (
                      <IconComponent size={52} />
                    ) : (
                      <span className="text-4xl">{game.icon}</span>
                    )}
                  </div>

                  <div className="text-[13px] font-black text-white leading-tight">
                    {game.shortTitle}
                  </div>
                  <div className="text-[9px] font-bold text-white/70 mt-0.5 line-clamp-1">
                    {game.mechanic}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.sfxPop?.();
              setShowMoreGames(true);
            }}
            className="mt-3 w-full py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>Más juegos</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>

        {/* BOTÓN JUGAR */}
        <div className="shrink-0 pt-1">
          <button
            type="button"
            onClick={() => {
              sounds.sfxPop?.(1.2);
              onStartGame();
            }}
            className="w-full py-4 rounded-[1.6rem] bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-white font-black text-xl shadow-2xl border-b-8 border-indigo-800 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          >
            <Play className="w-7 h-7 fill-white" />
            <span>¡JUGAR ({players[0]?.name || 'YA'})!</span>
          </button>
        </div>
      </div>

      {/* Modal Más Juegos */}
      {showMoreGames && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-[2rem] p-5 border border-white/10 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white">Más Juegos</h3>
              <button
                type="button"
                onClick={() => setShowMoreGames(false)}
                className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {MORE_GAMES.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => {
                    handleSelectGame(game.id);
                    setShowMoreGames(false);
                  }}
                  className="rounded-2xl p-3 text-left border-b-4"
                  style={{
                    background: `linear-gradient(145deg, ${game.color} 0%, ${game.color}aa 60%, #0f172a 130%)`,
                    borderColor: 'rgba(0,0,0,0.3)',
                  }}
                >
                  <div className="text-3xl mb-1">{game.icon}</div>
                  <div className="text-sm font-black text-white">{game.shortTitle}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
