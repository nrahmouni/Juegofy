import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { MainScene } from '../../game/scenes/MainScene';
import { eventBus } from '../../game/EventBus';
import { PlayerConfig, PracticeLang } from '../../types/game';
import { X, Package, Coins } from 'lucide-react';

/**
 * MagicIslandGame – Componente React que embebe Phaser 3
 * - Monta/destruye el juego limpiamente
 * - Muestra inventario y diálogos encima del canvas
 * - Recibe el idioma activo y lo pasa a Phaser vía registry
 */

interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface Props {
  player: PlayerConfig;
  practiceLang?: PracticeLang;
  onExit: () => void;
  onWin?: (score: number, stars: number, words: number) => void;
}

const LANG_MAP: Record<string, string> = {
  es: 'es',
  fl: 'nl',
  ar: 'ar',
  fr: 'fr',
};

export const MagicIslandGame: React.FC<Props> = ({
  player,
  practiceLang = 'es',
  onExit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [coins, setCoins] = useState(0);
  const [dialogue, setDialogue] = useState<{ speaker: string; text: string } | null>(null);
  const [questActive, setQuestActive] = useState(false);

  const lang = LANG_MAP[practiceLang] || 'es';

  // Escuchar eventos desde Phaser
  useEffect(() => {
    const unsubCollect = eventBus.on('item:collected', (item: { id: string; name: string; icon: string }) => {
      setInventory((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          return prev.map((i) =>
            i.id === item.id ? { ...i, count: i.count + 1 } : i
          );
        }
        return [...prev, { ...item, count: 1 }];
      });
    });

    const unsubDialogue = eventBus.on(
      'dialogue:show',
      (data: { speaker: string; text: string }) => {
        setDialogue(data);
      }
    );

    const unsubQuest = eventBus.on(
      'quest:updated',
      (data: { id: string; status: string }) => {
        if (data.id === 'baker_apples' && data.status === 'active') {
          setQuestActive(true);
        }
      }
    );

    const unsubCoins = eventBus.on('coins:earned', (data: { amount: number }) => {
      setCoins((c) => c + data.amount);
    });

    return () => {
      unsubCollect();
      unsubDialogue();
      unsubQuest();
      unsubCoins();
    };
  }, []);

  // Montar Phaser
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth || 400,
      height: containerRef.current.clientHeight || 700,
      backgroundColor: '#4ade80',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      input: {
        activePointers: 2,
      },
    };

    const game = new Phaser.Game(config);
    game.registry.set('lang', lang);
    gameRef.current = game;

    return () => {
      eventBus.clear();
      game.destroy(true);
      gameRef.current = null;
    };
  }, [lang]);

  // Entregar manzanas al panadero (desde inventario React)
  const deliverApples = useCallback(() => {
    const apples = inventory.find((i) => i.id === 'apple');
    if (!apples || apples.count < 2) {
      setDialogue({
        speaker: lang === 'es' ? 'Panadero' : 'Baker',
        text:
          lang === 'es'
            ? 'Necesito 2 manzanas. ¡Tráeme más!'
            : 'I need 2 apples. Bring me more!',
      });
      return;
    }

    setInventory((prev) =>
      prev
        .map((i) => (i.id === 'apple' ? { ...i, count: i.count - 2 } : i))
        .filter((i) => i.count > 0)
    );
    setCoins((c) => c + 10);
    setQuestActive(false);
    setDialogue({
      speaker: lang === 'es' ? 'Panadero' : 'Baker',
      text:
        lang === 'es'
          ? '¡Gracias! Aquí tienes 10 monedas de oro.'
          : 'Thank you! Here are 10 gold coins.',
    });
    eventBus.emit('coins:earned', { amount: 10 });
    eventBus.emit('quest:updated', { id: 'baker_apples', status: 'completed' });
  }, [inventory, lang]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* HUD superior */}
      <header className="relative z-20 flex items-center justify-between px-3 py-2 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-sm font-black text-white">
            {player.name.charAt(0)}
          </div>
          <div>
            <div className="text-xs font-black text-white">{player.name}</div>
            <div className="text-[10px] text-white/70 flex items-center gap-1">
              <Coins className="w-3 h-3 text-yellow-400" />
              {coins}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Canvas Phaser */}
      <div ref={containerRef} className="flex-1 w-full relative" />

      {/* Inventario inferior */}
      <div className="relative z-20 bg-black/50 backdrop-blur-md px-3 py-2 border-t border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <Package className="w-4 h-4 text-amber-300" />
          <span className="text-[10px] font-black text-white/80 uppercase tracking-wider">
            Inventario
          </span>
          {questActive && (
            <span className="ml-auto text-[10px] font-bold text-amber-300 bg-amber-900/50 px-2 py-0.5 rounded-full">
              Misión: 2 manzanas
            </span>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar min-h-[52px]">
          {inventory.length === 0 && (
            <span className="text-xs text-white/40 self-center">
              Vacío — explora la isla
            </span>
          )}
          {inventory.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'apple' && questActive) deliverApples();
              }}
              className="shrink-0 w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex flex-col items-center justify-center active:scale-95 transition-transform"
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[9px] font-bold text-white mt-0.5">
                ×{item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Diálogo flotante */}
      {dialogue && (
        <div className="absolute bottom-28 left-3 right-3 z-30">
          <div className="bg-white rounded-2xl p-4 shadow-2xl border-b-4 border-amber-300">
            <div className="text-[10px] font-black text-amber-700 uppercase mb-1">
              {dialogue.speaker}
            </div>
            <p className="text-sm font-bold text-slate-800">{dialogue.text}</p>
            <button
              type="button"
              onClick={() => setDialogue(null)}
              className="mt-2 text-xs font-black text-indigo-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
