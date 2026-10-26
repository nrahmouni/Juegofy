/**
 * Puente React ↔ Phaser
 * Usa un EventEmitter simple para que el inventario (React)
 * y el mundo (Phaser) se comuniquen sin acoplamiento fuerte.
 */
type Handler = (...args: any[]) => void;

class GameEventBus {
  private listeners = new Map<string, Set<Handler>>();

  on(event: string, handler: Handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: Handler) {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach((h) => h(...args));
  }

  clear() {
    this.listeners.clear();
  }
}

export const eventBus = new GameEventBus();

// Eventos tipados
export type GameEvents = {
  'item:collected': { id: string; name: string; icon: string };
  'item:used': { id: string; target: string };
  'quest:updated': { id: string; status: 'active' | 'completed' };
  'dialogue:show': { speaker: string; text: string };
  'dialogue:hide': void;
  'coins:earned': { amount: number };
};
