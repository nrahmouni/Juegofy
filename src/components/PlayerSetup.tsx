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
import { PlayerConfig, ThemeId, StickerId, GameModeId, AgeGroup } from '../types/game';
import { STICKERS, PLAYER_COLORS, DEFAULT_AVATARS } from '../data/themes';
import { GAME_MODES, MAX_GAME_LEVEL } from '../data/learningData';
import { CameraCaptureModal } from './CameraCaptureModal';
import { GarageShopModal } from './GarageShopModal';
import { SmartLearningModal } from './SmartLearningModal';
import { sounds } from '../audio/soundManager';

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
  onStartGame,
  onToggleFullscreen,
  isFullscreen,
  isMuted,
  onToggleMute,
}) => {
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isSmartModalOpen, setIsSmartModalOpen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

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
    <div className="relative w-full h-[100dvh] flex flex-col justify-between bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 overflow-hidden px-2.5 py-2.5 sm:px-6 sm:py-4 select-none">
      {/* 1. Compact Header */}
      <div className="flex justify-between items-center w-full max-w-4xl mx-auto shrink-0">
        <div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white leading-none">
            MUNDO <span className="text-yellow-400">MÁGICO</span>
          </h1>
          <p className="text-[10px] sm:text-xs font-bold text-indigo-200/80">
            Nivel {selectedLevel}/{MAX_GAME_LEVEL} · {selectedLevel >= 6 ? '✨ Frases y Oraciones' : '📚 Vocabulario'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => {
              sounds.sfxPop();
              setIsSmartModalOpen(true);
            }}
            className="px-2.5 py-2 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-black text-xs flex items-center gap-1.5 btn-squishy"
            title="Aprendizaje Inteligente y Diccionario"
          >
            <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">IA Progreso</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px]">
              {learnedWordIds.length}
            </span>
          </button>
          <button
            onClick={() => {
              sounds.sfxPop();
              onToggleMute();
            }}
            className="p-2 sm:p-2.5 rounded-2xl bg-white/10 text-white border border-white/15 btn-squishy"
            aria-label="Silenciar o activar audio"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
          <button
            onClick={() => {
              sounds.sfxPop();
              setIsShopOpen(true);
            }}
            className="p-2 sm:p-2.5 rounded-2xl bg-white/10 text-yellow-400 border border-white/15 btn-squishy"
            aria-label="Tienda"
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              sounds.sfxPop();
              setShowSettings(true);
            }}
            className="p-2 sm:p-2.5 rounded-2xl bg-white/10 text-white border border-white/15 btn-squishy"
            aria-label="Ajustes"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Players Turn Order & Profile Editor */}
      <div className="w-full max-w-4xl mx-auto my-1 shrink-0">
        <div className="flex items-center justify-between mb-1 px-1">
          <span className="text-[10px] sm:text-[11px] font-black text-indigo-200 uppercase tracking-wider">
            Jugadores ({players.length}/4) — Toca el nombre para cambiarlo
          </span>
          {players.length < 4 && (
            <button
              onClick={handleAddPlayer}
              className="px-2.5 py-1 rounded-xl bg-emerald-500 text-white font-black text-[11px] flex items-center gap-1 shadow-md btn-squishy"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {players.map((player, idx) => (
            <div
              key={player.id}
              className="relative bg-white rounded-2xl sm:rounded-3xl p-2 shadow-xl border-b-4 flex items-center sm:flex-col gap-2 sm:gap-1 transition-all"
              style={{ borderBottomColor: player.color }}
            >
              {/* Turn Badge */}
              <div
                className="absolute -top-1.5 -left-1 px-2 py-0.5 rounded-full text-[9px] font-black text-white shadow z-10"
                style={{ backgroundColor: player.color }}
              >
                {idx + 1}º
              </div>

              {/* Delete Player Button */}
              {players.length > 1 && (
                <button
                  onClick={() => handleRemovePlayer(player.id)}
                  className="absolute top-1 right-1 p-1 bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white rounded-full transition-colors btn-squishy z-10"
                  aria-label={`Eliminar a ${player.name}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}

              {/* Avatar & Camera Trigger */}
              <button
                onClick={() => {
                  sounds.sfxPop();
                  setEditingPlayerIndex(idx);
                }}
                className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-2xl overflow-hidden shrink-0 btn-squishy"
              >
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{player.fallbackEmoji}</span>
                )}
                {player.sticker !== 'none' && (
                  <span className="absolute -top-1 -right-1 text-sm">
                    {STICKERS.find((s) => s.id === player.sticker)?.icon}
                  </span>
                )}
                <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-0.5 rounded-tl-md">
                  <Camera className="w-2.5 h-2.5" />
                </div>
              </button>

              <div className="flex-1 min-w-0 w-full flex flex-col">
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => handleUpdateName(idx, e.target.value)}
                  aria-label="Nombre del jugador"
                  className="w-full bg-slate-100 py-0.5 px-1.5 rounded-lg text-center font-black text-xs text-slate-900 uppercase outline-none border-2 border-transparent focus:border-indigo-500 focus:bg-white"
                />

                <div className="flex items-center justify-between w-full mt-1">
                  <button
                    onClick={() => handleMovePlayer(idx, 'left')}
                    disabled={idx === 0}
                    className="p-0.5 rounded bg-slate-100 text-slate-600 disabled:opacity-20 btn-squishy"
                    aria-label="Mover antes"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <span className="text-[8px] font-black text-slate-400 uppercase">Turno {idx + 1}</span>
                  <button
                    onClick={() => handleMovePlayer(idx, 'right')}
                    disabled={idx === players.length - 1}
                    className="p-0.5 rounded bg-slate-100 text-slate-600 disabled:opacity-20 btn-squishy"
                    aria-label="Mover después"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 8-Level Selector (1-5 Words, 6-8 Phrases) & 8 Mini-Games Grid */}
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-between min-h-0 my-1">
        {/* Level Selector Bar */}
        <div className="flex items-center justify-between bg-white/10 rounded-2xl px-2.5 py-1.5 mb-1.5 border border-white/10 shrink-0 gap-1 overflow-x-auto">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black text-yellow-400 uppercase mr-0.5">Nivel:</span>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => {
              const isPhraseLvl = lvl >= 6;
              const isSelected = selectedLevel === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => {
                    sounds.sfxPop();
                    setSelectedLevel(lvl);
                    sounds.speak(
                      isPhraseLvl ? `Nivel ${lvl}, Frases Mágicas` : `Nivel ${lvl}`,
                      'es-ES'
                    );
                  }}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl font-black text-xs transition-all btn-squishy flex items-center justify-center ${
                    isSelected
                      ? isPhraseLvl
                        ? 'bg-pink-500 text-white scale-110 shadow-md ring-2 ring-yellow-300'
                        : 'bg-yellow-400 text-slate-950 scale-110 shadow-md'
                      : isPhraseLvl
                      ? 'bg-pink-500/25 text-pink-200 hover:bg-pink-500/40'
                      : 'bg-white/10 text-white/75 hover:bg-white/20'
                  }`}
                  title={isPhraseLvl ? `Nivel ${lvl}: Frases y Oraciones` : `Nivel ${lvl}: Vocabulario`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              sounds.sfxPop();
              onResetProgress();
              sounds.speak('Palabras y nivel reiniciados', 'es-ES');
            }}
            className="px-2 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 font-bold text-[10px] flex items-center gap-1 btn-squishy shrink-0"
            title="Reiniciar palabras aprendidas y volver al Nivel 1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset ({learnedWordIds.length})</span>
          </button>
        </div>

        {/* Premium horizontal game carousel (slide) */}
        <div className="flex-1 min-h-0 flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-1">
            <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/70">
              Desliza y elige tu aventura
            </div>
            <div className="text-[10px] font-bold text-white/50">
              {GAME_MODES.findIndex((m) => m.id === gameMode) + 1}/{GAME_MODES.length}
            </div>
          </div>
          <div
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 pt-1 px-1 -mx-1"
            style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
          >
            {GAME_MODES.map((mode) => {
              const isSelected = mode.id === gameMode;
              return (
                <button
                  key={mode.id}
                  onClick={() => handleSelectGame(mode.id, mode.title)}
                  className={`snap-center shrink-0 w-[78%] sm:w-[240px] max-w-[280px] rounded-[1.75rem] p-4 text-left transition-all border-b-8 btn-squishy relative overflow-hidden ${
                    isSelected
                      ? 'ring-4 ring-yellow-300 scale-[1.03] shadow-2xl border-yellow-400'
                      : 'opacity-90 hover:opacity-100 border-black/20'
                  }`}
                  style={{
                    background: `linear-gradient(145deg, ${mode.color} 0%, ${mode.color}cc 55%, #0f172a 140%)`,
                  }}
                >
                  <div className="absolute -right-4 -top-4 text-7xl opacity-20 pointer-events-none">
                    {mode.icon}
                  </div>
                  <div className="relative z-10 flex flex-col gap-2 min-h-[132px]">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center text-3xl shadow-inner border border-white/30">
                        {mode.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-wide text-white/80 truncate">
                          {mode.badge}
                        </div>
                        <div className="text-lg font-black text-white leading-tight drop-shadow">
                          {mode.title}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-white/90 leading-snug line-clamp-2">
                      {mode.tagline}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase bg-white/20 text-white px-2 py-1 rounded-lg">
                        {mode.mechanicBadge}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-black bg-yellow-300 text-slate-900 px-2 py-1 rounded-lg">
                          ✓ ELEGIDO
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Giant Start Button */}
      <div className="w-full max-w-4xl mx-auto pt-1 shrink-0">
        <button
          onClick={() => {
            sounds.sfxPop();
            onStartGame();
          }}
          className="w-full py-3.5 sm:py-4.5 rounded-3xl bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-600 text-white font-black text-xl sm:text-3xl shadow-2xl btn-squishy border-b-8 border-indigo-950 flex items-center justify-center gap-3"
        >
          <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white" />
          <span className="tracking-tight uppercase">
            ¡JUGAR ({players[0]?.name})!
          </span>
        </button>
      </div>

      {/* Settings Modal */}
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
          activePlayerId={players[0]?.id || 0}
          setActivePlayerId={() => {}}
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
