import React, { useState } from 'react';
import { PlayerConfig, VehicleId, CostumeId } from '../types/game';
import { VEHICLES, COSTUMES } from '../data/garage';
import { sounds } from '../audio/soundManager';

interface GarageShopModalProps {
  players: PlayerConfig[];
  setPlayers: React.Dispatch<React.SetStateAction<PlayerConfig[]>>;
  activePlayerId: number;
  setActivePlayerId: (id: number) => void;
  onClose: () => void;
}

export const GarageShopModal: React.FC<GarageShopModalProps> = ({
  players,
  setPlayers,
  activePlayerId,
  setActivePlayerId,
  onClose,
}) => {
  const [tab, setTab] = useState<'vehicles' | 'costumes'>('vehicles');
  const [purchaseMsg, setPurchaseMsg] = useState<string | null>(null);

  const activePlayer = players.find((p) => p.id === activePlayerId) || players[0];
  const coins = activePlayer.coins ?? 100; // Default gift coins for testing
  const unlockedVehicles = activePlayer.unlockedVehicles || ['kart'];
  const unlockedCostumes = activePlayer.unlockedCostumes || ['none'];
  const selectedVehicle = activePlayer.selectedVehicle || 'kart';
  const selectedCostume = activePlayer.selectedCostume || 'none';

  const showMsg = (msg: string) => {
    setPurchaseMsg(msg);
    setTimeout(() => setPurchaseMsg(null), 2500);
  };

  const handleUnlockVehicle = (vehId: VehicleId, cost: number) => {
    if (coins < cost) {
      sounds.sfxOops();
      showMsg('¡Necesitas más monedas! Juega para ganar 🪙');
      return;
    }

    sounds.sfxPowerup();
    showMsg('¡Vehículo Desbloqueado! 🎉');

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== activePlayer.id) return p;
        const currUnlocked = p.unlockedVehicles || ['kart'];
        return {
          ...p,
          coins: (p.coins ?? 100) - cost,
          unlockedVehicles: [...currUnlocked, vehId],
          selectedVehicle: vehId,
        };
      })
    );
  };

  const handleSelectVehicle = (vehId: VehicleId) => {
    sounds.sfxPop();
    setPlayers((prev) =>
      prev.map((p) => (p.id === activePlayer.id ? { ...p, selectedVehicle: vehId } : p))
    );
  };

  const handleUnlockCostume = (cosId: CostumeId, cost: number) => {
    if (coins < cost) {
      sounds.sfxOops();
      showMsg('¡Necesitas más monedas! Juega para ganar 🪙');
      return;
    }

    sounds.sfxPowerup();
    showMsg('¡Disfraz Desbloqueado! 🎉');

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== activePlayer.id) return p;
        const currUnlocked = p.unlockedCostumes || ['none'];
        return {
          ...p,
          coins: (p.coins ?? 100) - cost,
          unlockedCostumes: [...currUnlocked, cosId],
          selectedCostume: cosId,
        };
      })
    );
  };

  const handleSelectCostume = (cosId: CostumeId) => {
    sounds.sfxPop();
    setPlayers((prev) =>
      prev.map((p) => (p.id === activePlayer.id ? { ...p, selectedCostume: cosId } : p))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 text-white rounded-3xl p-5 border-4 border-yellow-400/80 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-bounce">🏰</span>
            <div>
              <h2 className="text-2xl font-black text-yellow-300 tracking-wide">
                La Tienda Mágica
              </h2>
              <p className="text-xs text-indigo-200">
                ¡Gana monedas jugando y desbloquea naves, coches y disfraces!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.sfxPop();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-xl flex items-center justify-center shadow-lg transition-transform active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Player Switcher & Coins Display */}
        <div className="my-4 p-3 bg-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-indigo-200">Jugador:</span>
            <div className="flex gap-1.5 overflow-x-auto py-1">
              {players.map((p) => {
                const isSel = p.id === activePlayer.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      sounds.sfxPop();
                      setActivePlayerId(p.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSel
                        ? 'bg-yellow-400 text-slate-900 shadow-md scale-105 ring-2 ring-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <span>{p.fallbackEmoji}</span>
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 px-4 py-1.5 rounded-2xl text-slate-900 font-black text-base shadow-lg animate-pulse">
            <span>🪙</span>
            <span>{coins} Monedas</span>
          </div>
        </div>

        {/* Floating feedback message */}
        {purchaseMsg && (
          <div className="mb-3 p-2 text-center bg-yellow-400 text-slate-900 font-bold text-xs rounded-xl animate-bounce shadow-md">
            {purchaseMsg}
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 bg-black/30 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => {
              sounds.sfxPop();
              setTab('vehicles');
            }}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              tab === 'vehicles'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg scale-102 ring-2 ring-pink-300'
                : 'text-indigo-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🏎️</span>
            <span>Vehículos y Naves</span>
          </button>
          <button
            onClick={() => {
              sounds.sfxPop();
              setTab('costumes');
            }}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              tab === 'costumes'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg scale-102 ring-2 ring-emerald-300'
                : 'text-indigo-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>👑</span>
            <span>Disfraces y Gorros</span>
          </button>
        </div>

        {/* Items Grid */}
        {tab === 'vehicles' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {VEHICLES.map((v) => {
              const isUnlocked = unlockedVehicles.includes(v.id);
              const isEquipped = selectedVehicle === v.id;
              const canAfford = coins >= v.cost;

              return (
                <div
                  key={v.id}
                  className={`relative p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                    isEquipped
                      ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400 ring-2 ring-yellow-400/50'
                      : isUnlocked
                      ? 'bg-white/10 border-white/20 hover:bg-white/15'
                      : 'bg-black/40 border-white/5 opacity-80'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl shadow-inner shrink-0">
                    {v.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white truncate">{v.name}</h4>
                      {isEquipped && (
                        <span className="text-[10px] font-black bg-yellow-400 text-slate-900 px-2 py-0.5 rounded-full">
                          EQUIPADO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-indigo-200 line-clamp-1">{v.description}</p>
                    <span className="inline-block mt-1 text-[10px] text-emerald-300 font-medium">
                      ⚡ {v.speedBonus}
                    </span>
                  </div>

                  <div className="shrink-0">
                    {isUnlocked ? (
                      <button
                        onClick={() => handleSelectVehicle(v.id)}
                        disabled={isEquipped}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-transform active:scale-95 ${
                          isEquipped
                            ? 'bg-gray-600 text-gray-300 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                        }`}
                      >
                        {isEquipped ? 'En uso' : 'Equipar'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnlockVehicle(v.id, v.cost)}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs transition-transform active:scale-95 flex items-center gap-1 ${
                          canAfford
                            ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-900 shadow-md animate-pulse'
                            : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                      >
                        <span>🪙</span>
                        <span>{v.cost}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'costumes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {COSTUMES.map((c) => {
              const isUnlocked = unlockedCostumes.includes(c.id);
              const isEquipped = selectedCostume === c.id;
              const canAfford = coins >= c.cost;

              return (
                <div
                  key={c.id}
                  className={`relative p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                    isEquipped
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400 ring-2 ring-emerald-400/50'
                      : isUnlocked
                      ? 'bg-white/10 border-white/20 hover:bg-white/15'
                      : 'bg-black/40 border-white/5 opacity-80'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl shadow-inner shrink-0">
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white truncate">{c.name}</h4>
                      {isEquipped && (
                        <span className="text-[10px] font-black bg-emerald-400 text-slate-900 px-2 py-0.5 rounded-full">
                          PUESTO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-indigo-200 line-clamp-1">{c.description}</p>
                  </div>

                  <div className="shrink-0">
                    {isUnlocked ? (
                      <button
                        onClick={() => handleSelectCostume(c.id)}
                        disabled={isEquipped}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-transform active:scale-95 ${
                          isEquipped
                            ? 'bg-gray-600 text-gray-300 cursor-default'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                        }`}
                      >
                        {isEquipped ? 'En uso' : 'Poner'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnlockCostume(c.id, c.cost)}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs transition-transform active:scale-95 flex items-center gap-1 ${
                          canAfford
                            ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-900 shadow-md animate-pulse'
                            : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                      >
                        <span>🪙</span>
                        <span>{c.cost}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={() => {
              sounds.sfxPop();
              onClose();
            }}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-black text-sm shadow-xl transition-transform active:scale-95 flex items-center gap-2"
          >
            <span>¡Listo para Jugar!</span>
            <span>🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
};
