/** Free local progress: island stars, daily mission, streak */

const ISLAND_STARS_KEY = 'mundo_magico_island_stars_v1';
const STREAK_KEY = 'mundo_magico_streak_v1';
const MISSION_KEY = 'mundo_magico_daily_mission_v1';

export type IslandId = 'action' | 'words' | 'world' | 'flanders' | 'kitchen';

export function loadIslandStars(): Record<string, number> {
  try {
    const raw = localStorage.getItem(ISLAND_STARS_KEY);
    if (raw) return JSON.parse(raw) || {};
  } catch {}
  return {};
}

export function addIslandStar(islandId: string, n = 1): Record<string, number> {
  const cur = loadIslandStars();
  cur[islandId] = Math.min(99, (cur[islandId] || 0) + n);
  try {
    localStorage.setItem(ISLAND_STARS_KEY, JSON.stringify(cur));
  } catch {}
  return cur;
}

export function modeToIsland(modeId: string): IslandId {
  if (['monster_feeder', 'slingshot_magic', 'word_dash', 'rocket_race', 'circuit_path'].includes(modeId))
    return 'action';
  if (['lang_spanish_words', 'lang_spanish_abc', 'drag_match', 'sentence_builder', 'magic_puzzle'].includes(modeId))
    return 'words';
  if (['lang_arabic', 'lang_french', 'safari_adventure'].includes(modeId)) return 'world';
  if (['flemish_world', 'lang_flemish'].includes(modeId)) return 'flanders';
  if (['crazy_kitchen', 'dress_up'].includes(modeId)) return 'kitchen';
  return 'action';
}

export function loadStreak(): { count: number; lastDate: string } {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { count: 0, lastDate: '' };
}

export function touchStreak(): { count: number; lastDate: string } {
  const today = new Date().toISOString().slice(0, 10);
  const prev = loadStreak();
  let count = prev.count;
  if (prev.lastDate === today) {
    // already counted
  } else {
    const yday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    count = prev.lastDate === yday ? prev.count + 1 : 1;
  }
  const next = { count, lastDate: today };
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export type DailyMission = {
  date: string;
  goal: number;
  progress: number;
  label: string;
};

const MISSION_LABELS = [
  'Aprende 3 palabras hoy',
  'Gana 1 partida en Acción',
  'Juega 2 partidas seguidas',
  'Prueba un juego de Cocina',
];

export function getDailyMission(): DailyMission {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(MISSION_KEY);
    if (raw) {
      const m = JSON.parse(raw) as DailyMission;
      if (m.date === today) return m;
    }
  } catch {}
  const label = MISSION_LABELS[new Date().getDate() % MISSION_LABELS.length];
  const m: DailyMission = { date: today, goal: 3, progress: 0, label };
  try {
    localStorage.setItem(MISSION_KEY, JSON.stringify(m));
  } catch {}
  return m;
}

export function bumpDailyMission(amount = 1): DailyMission {
  const m = getDailyMission();
  m.progress = Math.min(m.goal, m.progress + amount);
  try {
    localStorage.setItem(MISSION_KEY, JSON.stringify(m));
  } catch {}
  return m;
}
