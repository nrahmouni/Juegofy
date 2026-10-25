import React, { useState } from 'react';
import { Camera, Users, Sparkles, Play, Maximize, Volume2, VolumeX, Music, BookOpen, Baby, Rocket, ShoppingBag } from 'lucide-react';
import { PlayerConfig, ThemeId, StickerId, GameModeId, AgeGroup } from '../types/game';
import { THEMES, STICKERS } from '../data/themes';
import { GAME_MODES } from '../data/learningData';
import { VEHICLES, COSTUMES } from '../data/garage';
import { CameraCaptureModal } from './CameraCaptureModal';
import { GarageShopModal } from './GarageShopModal';
import { sounds } from '../audio/soundManager';

interface Props {
  players: PlayerConfig[];
  setPlayers: React.Dispatch<React.SetStateAction<PlayerConfig[]>>;
  numPlayers: number;
  setNumPlayers: (n: number) => void;
  selectedTheme: ThemeId;
  setSelectedTheme: (t: ThemeId) => void;
  difficulty: number;
  setDifficulty: (d: number) => void;
  selectedLevel: number;
  setSelectedLevel: (l: number) => void;
  gameMode: GameModeId;
  setGameMode: (m: GameModeId) => void;
  ageGroup: AgeGroup;
  setAgeGroup: (a: AgeGroup) => void;
  onStartGame: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  isMusicEnabled: boolean;
  onToggleMusic: () => void;
}

export const PlayerSetup: React.FC<Props> = ({
  players,
  setPlayers,
  numPlayers,
  setNumPlayers,
  selectedTheme,
  setSelectedTheme,
  difficulty,
  setDifficulty,
  selectedLevel,
  setSelectedLevel,
  gameMode,
  setGameMode,
  ageGroup,
  setAgeGroup,
  onStartGame,
  onToggleFullscreen,
  isFullscreen,
  isMuted,
  onToggleMute,
  isMusicEnabled,
  onToggleMusic,
}) => {
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [shopActivePlayerId, setShopActivePlayerId] = useState<number>(0);

  const activePlayers = players.slice(0, numPlayers);

  const handleUpdateName = (index: number, newName: string) => {
    setPlayers((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, name: newName } : p))
    );
  };

  const handleSavePhoto = (photoUrl: string | null, sticker: StickerId) => {
    if (editingPlayerIndex === null) return;
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === editingPlayerIndex ? { ...p, photoUrl, sticker } : p
      )
    );
    setEditingPlayerIndex(null);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto flex flex-col items-center p-3 sm:p-5 select-none animate-in fade-in duration-300">
      {/* Top Header Controls */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              sounds.sfxPop();
              onToggleFullscreen();
            }}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 shadow-sm font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition active:scale-95"
            title="Pantalla Completa"
          >
            <Maximize className="w-4 h-4 text-pink-600" />
            <span className="hidden sm:inline">
              {isFullscreen ? 'Salir Fullscreen' : 'Pantalla Completa'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Shop Button in Header */}
          <button
            onClick={() => {
              sounds.sfxPowerup();
              setIsShopOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-black text-xs shadow-md border border-yellow-300 flex items-center gap-1.5 transition active:scale-95 animate-pulse"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Tienda 🪙</span>
          </button>

          <button
            onClick={() => {
              sounds.sfxPop();
              onToggleMusic();
            }}
            className={`p-2 rounded-xl shadow-sm text-xs font-bold border transition active:scale-95 flex items-center gap-1 ${
              isMusicEnabled
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-white/70 border-slate-200 text-slate-400'
            }`}
            title="Música de fondo"
          >
            <Music className="w-4 h-4" />
            <span className="hidden sm:inline">Música</span>
          </button>

          <button
            onClick={() => {
              sounds.sfxPop();
              onToggleMute();
            }}
            className={`p-2 rounded-xl shadow-sm text-xs font-bold border transition active:scale-95 flex items-center gap-1 ${
              !isMuted
                ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                : 'bg-rose-100 border-rose-300 text-rose-700'
            }`}
            title="Efectos de sonido"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isMuted ? 'Silencio' : 'Sonido'}</span>
          </button>
        </div>
      </div>

      {/* Main Title Card */}
      <div className="text-center mb-3">
        <h1 className="text-4xl sm:text-5xl font-black text-pink-600 tracking-tight drop-shadow-sm flex items-center justify-center gap-2">
          <span>💣</span>
          <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">
            Camino Bombástico
          </span>
          <span>⭐</span>
        </h1>
        <p className="text-sm font-bold text-indigo-950 mt-0.5 max-w-md mx-auto">
          ¡Juegos de acción y aprendizaje para niños con tu foto en el circuito!
        </p>
      </div>

      {/* AGE SELECTOR CARD */}
      <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border-2 border-indigo-200 mb-4">
        <label className="text-xs font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1.5 mb-2">
          <Baby className="w-4 h-4" /> Adaptación por Edad
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              sounds.sfxPop();
              setAgeGroup('preschool');
            }}
            className={`p-2.5 rounded-2xl border-3 text-left transition flex items-center gap-3 ${
              ageGroup === 'preschool'
                ? 'border-indigo-500 bg-indigo-50 shadow-md scale-[1.02]'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <span className="text-3xl">🐣</span>
            <div>
              <div className="text-xs font-black text-indigo-950 flex items-center gap-1">
                <span>Pequeños</span>
                <span className="text-[10px] text-indigo-600 bg-indigo-100 px-1.5 py-0.2 rounded-full">3-5 años</span>
              </div>
              <div className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">
                Ilustraciones gigantes, conteo de frutas y guía por voz
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              sounds.sfxPop();
              setAgeGroup('kids');
            }}
            className={`p-2.5 rounded-2xl border-3 text-left transition flex items-center gap-3 ${
              ageGroup === 'kids'
                ? 'border-pink-500 bg-pink-50 shadow-md scale-[1.02]'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <span className="text-3xl">🚀</span>
            <div>
              <div className="text-xs font-black text-rose-950 flex items-center gap-1">
                <span>Mayores</span>
                <span className="text-[10px] text-pink-600 bg-pink-100 px-1.5 py-0.2 rounded-full">6-8 años</span>
              </div>
              <div className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">
                Palabras completas, ritmo ágil y desafíos interactivos
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 1. SIX LEARNING & ARCADE GAMES SELECTOR */}
      <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border-2 border-pink-200 mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-black uppercase text-pink-600 tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> Elige tu Juego (6 Juegos Disponibles)
          </label>
          <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            ⭐ 6 en 1
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {GAME_MODES.map((mode) => {
            const isSelected = gameMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  sounds.sfxPop();
                  setGameMode(mode.id);
                }}
                className={`p-2.5 rounded-2xl border-3 text-left transition relative flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? 'border-pink-500 bg-gradient-to-b from-pink-50 to-amber-50 shadow-md scale-[1.02]'
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {/* Active check ribbon */}
                {isSelected && (
                  <div className="absolute top-0 right-0 w-6 h-6 bg-pink-500 text-white text-[11px] font-black rounded-bl-xl flex items-center justify-center">
                    ✓
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-2xl">{mode.icon}</span>
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded-md text-white truncate max-w-[85px]"
                      style={{ backgroundColor: mode.color }}
                    >
                      {mode.badge}
                    </span>
                  </div>
                  <div className="text-xs font-black text-slate-800 leading-tight">
                    {mode.shortTitle}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-semibold mt-1 leading-tight line-clamp-2">
                  {mode.tagline}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Number of Players Selector */}
      <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border-2 border-pink-200 mb-4">
        <label className="text-xs font-black uppercase text-pink-600 tracking-wider flex items-center gap-1.5 mb-2">
          <Users className="w-4 h-4" /> ¿Cuántos jugáis hoy?
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => {
                sounds.sfxPop();
                setNumPlayers(n);
              }}
              className={`py-2 rounded-xl font-black text-lg transition flex items-center justify-center gap-1.5 border-3 ${
                numPlayers === n
                  ? 'bg-amber-400 border-amber-500 text-amber-950 scale-105 shadow-md'
                  : 'bg-slate-100 border-transparent text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{n}</span>
              <span className="text-xs font-bold text-slate-500">
                {n === 1 ? 'jugador' : 'jugadores'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Players Setup Cards (Photo & Name & Vehicle/Costume Badge) */}
      <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border-2 border-pink-200 mb-4">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-black uppercase text-pink-600 tracking-wider flex items-center gap-1.5">
            <Camera className="w-4 h-4" /> Nombres y Equipamiento
          </label>
          <button
            onClick={() => {
              sounds.sfxPowerup();
              setShopActivePlayerId(0);
              setIsShopOpen(true);
            }}
            className="text-[11px] font-black text-amber-700 hover:underline flex items-center gap-1"
          >
            <span>Tienda Mágica 🏰</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activePlayers.map((player, idx) => {
            const stickerObj = STICKERS.find((s) => s.id === player.sticker);
            const vehObj = VEHICLES.find((v) => v.id === (player.selectedVehicle || 'kart'));
            const cosObj = COSTUMES.find((c) => c.id === (player.selectedCostume || 'none'));
            const coins = player.coins ?? 100;

            return (
              <div
                key={player.id}
                className="relative flex items-center gap-2.5 p-2.5 rounded-2xl border-2 transition shadow-xs"
                style={{
                  borderColor: player.color,
                  backgroundColor: `${player.color}15`,
                }}
              >
                {/* Avatar with photo & sticker & costume badge */}
                <div className="relative group shrink-0">
                  <div
                    className="w-14 h-14 rounded-full border-3 overflow-hidden shadow-md flex items-center justify-center bg-white"
                    style={{ borderColor: player.color }}
                  >
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl select-none">{player.fallbackEmoji}</span>
                    )}
                  </div>

                  {/* Costume or Sticker Overlay */}
                  {cosObj && cosObj.id !== 'none' && (
                    <div className="absolute -top-2 -left-1 text-xl select-none filter drop-shadow">
                      {cosObj.icon}
                    </div>
                  )}

                  {player.sticker !== 'none' && stickerObj && (
                    <div className="absolute -top-1 -right-1 text-lg select-none filter drop-shadow">
                      {stickerObj.icon}
                    </div>
                  )}

                  {/* Camera Quick Button */}
                  <button
                    onClick={() => {
                      sounds.sfxPop();
                      setEditingPlayerIndex(idx);
                    }}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center shadow-md active:scale-95 transition"
                    title="Hacer foto o cambiar adorno"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>

                {/* Player Name & Vehicle / Coins info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Jugador {idx + 1}
                    </span>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.2 rounded-full">
                      🪙 {coins}
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={14}
                    value={player.name}
                    onChange={(e) => handleUpdateName(idx, e.target.value)}
                    placeholder={`Jugador ${idx + 1}`}
                    className="w-full font-black text-sm text-slate-800 bg-white/90 border border-slate-300 rounded-lg px-2 py-0.5 focus:outline-hidden focus:ring-2 focus:ring-pink-400"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <button
                      onClick={() => {
                        sounds.sfxPop();
                        setEditingPlayerIndex(idx);
                      }}
                      className="text-[11px] font-bold text-pink-600 hover:text-pink-700 underline"
                    >
                      {player.photoUrl ? 'Foto 📸' : '¡Hacer foto! 📸'}
                    </button>
                    <button
                      onClick={() => {
                        sounds.sfxPowerup();
                        setShopActivePlayerId(player.id);
                        setIsShopOpen(true);
                      }}
                      className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1"
                    >
                      <span>{vehObj?.icon || '🏎️'}</span>
                      <span className="truncate max-w-[70px]">{vehObj?.name.split(' ')[0]}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. World Themes Selector */}
      <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border-2 border-pink-200 mb-4">
        <label className="text-xs font-black uppercase text-pink-600 tracking-wider flex items-center gap-1.5 mb-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Elige el Mundo Temático
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(Object.keys(THEMES) as ThemeId[]).map((themeId) => {
            const th = THEMES[themeId];
            const isSel = selectedTheme === themeId;
            return (
              <button
                key={themeId}
                onClick={() => {
                  sounds.sfxPop();
                  setSelectedTheme(themeId);
                }}
                className={`p-2 rounded-xl border-3 text-center transition flex flex-col items-center justify-center gap-1 ${
                  isSel
                    ? 'bg-amber-300 border-amber-500 scale-105 shadow-md text-amber-950 font-black'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold'
                }`}
              >
                <span className="text-2xl">{th.icon}</span>
                <span className="text-[11px] font-extrabold leading-tight">{th.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Difficulty & Campaign Level Selector */}
      <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border-2 border-pink-200 mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-black uppercase text-pink-600 tracking-wider flex items-center gap-1.5">
            <Rocket className="w-4 h-4 text-purple-600" /> Nivel de Campaña (Niveles 1 al 5)
          </label>
          <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
            Nivel {selectedLevel}
          </span>
        </div>

        {/* 5 Level Buttons */}
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {[
            { lvl: 1, label: 'Niv 1', badge: '🐣', desc: '3 Opciones' },
            { lvl: 2, label: 'Niv 2', badge: '⭐', desc: 'Sube velocidad' },
            { lvl: 3, label: 'Niv 3', badge: '🚀', desc: '4 Opciones' },
            { lvl: 4, label: 'Niv 4', badge: '🔥', desc: 'Bombas' },
            { lvl: 5, label: 'Niv 5', badge: '👑', desc: '5 Opciones' },
          ].map((item) => (
            <button
              key={item.lvl}
              onClick={() => {
                sounds.sfxPop();
                setSelectedLevel(item.lvl);
              }}
              className={`p-1.5 rounded-xl border-2 text-center transition flex flex-col items-center justify-center gap-0.5 ${
                selectedLevel === item.lvl
                  ? 'bg-purple-500 border-purple-700 text-white font-black scale-105 shadow-md'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold'
              }`}
            >
              <span className="text-lg">{item.badge}</span>
              <span className="text-[11px] font-black leading-none">{item.label}</span>
              <span className="text-[8px] opacity-80 leading-none truncate w-full">{item.desc}</span>
            </button>
          ))}
        </div>

        {/* Difficulty Mode Selection */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 0, label: '🐣 Modo Suave', desc: 'Ancho & Guiado' },
            { id: 1, label: '🚀 Modo Normal', desc: 'Equilibrado' },
            { id: 2, label: '🔥 Modo Desafío', desc: 'Intrusos & Curvas' },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => {
                sounds.sfxPop();
                setDifficulty(d.id);
              }}
              className={`py-1.5 px-1 rounded-xl text-center border-2 transition ${
                difficulty === d.id
                  ? 'bg-amber-400 border-amber-500 text-amber-950 font-black scale-102 shadow-sm'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 font-bold'
              }`}
            >
              <div className="text-xs font-extrabold">{d.label}</div>
              <div className="text-[9px] text-slate-500 font-semibold">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 6. START GAME BUTTON */}
      <button
        onClick={() => {
          sounds.sfxPop();
          onStartGame();
        }}
        className="w-full max-w-md py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-black text-2xl shadow-xl shadow-pink-500/30 active:scale-95 transition-transform flex items-center justify-center gap-3 border-b-6 border-rose-700"
      >
        <Play className="w-7 h-7 fill-white" />
        <span>¡A JUGAR AHORA! 🚀</span>
      </button>

      {/* Camera Capture Modal if active */}
      {editingPlayerIndex !== null && (
        <CameraCaptureModal
          playerName={players[editingPlayerIndex].name}
          initialPhoto={players[editingPlayerIndex].photoUrl}
          initialSticker={players[editingPlayerIndex].sticker}
          onSave={handleSavePhoto}
          onClose={() => setEditingPlayerIndex(null)}
        />
      )}

      {/* Garage Shop Modal if active */}
      {isShopOpen && (
        <GarageShopModal
          players={players}
          setPlayers={setPlayers}
          activePlayerId={shopActivePlayerId}
          setActivePlayerId={setShopActivePlayerId}
          onClose={() => setIsShopOpen(false)}
        />
      )}
    </div>
  );
};

