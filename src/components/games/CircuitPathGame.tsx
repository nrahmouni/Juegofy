import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Volume2 } from 'lucide-react';
import { PlayerConfig, PracticeLang } from '../../types/game';
import { LearningItem, selectAdaptiveItems, getPersonalizedPraise } from '../../data/learningData';
import { getUsefulPool } from '../../data/languagePools';
import { sounds } from '../../audio/soundManager';
import { TutorialHint } from '../common/TutorialHint';

interface Props {
  player: PlayerConfig;
  practiceLang?: PracticeLang;
  selectedLevel: number;
  learnedWordIds: string[];
  missedWordIds?: string[];
  onMarkWordLearned: (id: string) => void;
  onMarkWordMissed?: (id: string) => void;
  onWin: (score: number, stars: number, words: number) => void;
  setProgressPercent: (p: number) => void;
  starsCollected: number;
  setStarsCollected: React.Dispatch<React.SetStateAction<number>>;
  wordsLearned: number;
  setWordsLearned: React.Dispatch<React.SetStateAction<number>>;
}

type Pt = { x: number; y: number };

/** Build a simple curved circuit of checkpoints */
function makePath(n: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1);
    const x = 12 + t * 76 + Math.sin(t * Math.PI * 2) * 8;
    const y = 18 + Math.sin(t * Math.PI) * 55 + (i % 2) * 6;
    pts.push({ x, y });
  }
  return pts;
}

/**
 * Circuito mágico — hold and follow the path through word checkpoints.
 * Skill = tracing, learning = hear word at each checkpoint.
 */
export const CircuitPathGame: React.FC<Props> = ({
  player,
  practiceLang = 'es',
  selectedLevel,
  learnedWordIds,
  missedWordIds = [],
  onMarkWordLearned,
  onWin,
  setProgressPercent,
  setStarsCollected,
  setWordsLearned,
}) => {
  const checkpoints = Math.min(6, 3 + Math.floor(selectedLevel / 2));
  const [path] = useState(() => makePath(checkpoints));
  const [words, setWords] = useState<LearningItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [trail, setTrail] = useState<Pt[]>([]);
  const [done, setDone] = useState(false);
  const stars = useRef(0);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const pool = getUsefulPool(practiceLang);
    const picks: LearningItem[] = [];
    for (let i = 0; i < checkpoints; i++) {
      const p = selectAdaptiveItems(
        pool.filter((x) => !picks.find((y) => y.id === x.id)),
        selectedLevel,
        learnedWordIds,
        missedWordIds,
        1
      )[0];
      if (p) picks.push(p);
    }
    setWords(picks);
    setIdx(0);
    if (picks[0]) void sounds.speakAsync(picks[0].audioText, picks[0].audioLang, true);
  }, [practiceLang, selectedLevel, learnedWordIds, missedWordIds, checkpoints]);

  const toPct = (clientX: number, clientY: number): Pt | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * 100,
      y: ((clientY - r.top) / r.height) * 100,
    };
  };

  const near = (a: Pt, b: Pt, d = 10) => Math.hypot(a.x - b.x, a.y - b.y) < d;

  const onMove = async (clientX: number, clientY: number) => {
    if (!drawing || done || !words.length) return;
    const p = toPct(clientX, clientY);
    if (!p) return;
    setTrail((t) => [...t.slice(-40), p]);
    const target = path[idx];
    if (target && near(p, target, 11)) {
      const w = words[idx];
      if (w) {
        sounds.sfxPop(1.1);
        onMarkWordLearned(w.id);
        stars.current += 1;
        await sounds.speakAsync(w.audioText, w.audioLang, true);
      }
      const n = idx + 1;
      setIdx(n);
      setProgressPercent((n / checkpoints) * 100);
      if (n >= checkpoints) {
        setDone(true);
        setDrawing(false);
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        setStarsCollected(stars.current);
        setWordsLearned(checkpoints);
        const praise = getPersonalizedPraise(player.name, true);
        await sounds.speakPraise(praise);
        onWin(1500 + selectedLevel * 180, stars.current, checkpoints);
      } else if (words[n]) {
        // soft prompt for next — only once
        void sounds.speakAsync(words[n].audioText, words[n].audioLang, true);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-cyan-200 to-blue-500 p-2 overflow-hidden select-none touch-none">
      <div className="shrink-0 bg-white rounded-2xl p-2 shadow flex items-center gap-2 border-b-4 border-cyan-300">
        <div className="text-2xl">🛤️</div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black text-cyan-700 uppercase">Sigue el camino</div>
          <div className="text-sm font-black text-slate-900 truncate">
            {words[idx] ? `${words[idx].emoji} ${words[idx].es}` : done ? '¡Meta!' : '…'}
          </div>
        </div>
        <button
          type="button"
          className="p-2 rounded-xl bg-cyan-600 text-white"
          onClick={() => words[idx] && void sounds.speakAsync(words[idx].audioText, words[idx].audioLang, true)}
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>
      {idx === 0 && !done && (
        <div className="flex justify-center my-1">
          <TutorialHint text="Mantén pulsado y sigue los puntos" gesture="drag" />
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="flex-1 w-full min-h-0 rounded-2xl bg-slate-800/40 touch-none"
        onPointerDown={(e) => {
          (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
          setDrawing(true);
          void onMove(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => void onMove(e.clientX, e.clientY)}
        onPointerUp={() => setDrawing(false)}
        onPointerCancel={() => setDrawing(false)}
      >
        {/* path guide */}
        <polyline
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="2"
          strokeDasharray="2 2"
          points={path.map((p) => `${p.x},${p.y}`).join(' ')}
        />
        {/* trail */}
        {trail.length > 1 && (
          <polyline
            fill="none"
            stroke="#fde047"
            strokeWidth="2.2"
            strokeLinecap="round"
            points={trail.map((p) => `${p.x},${p.y}`).join(' ')}
          />
        )}
        {path.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={i === idx ? 5 : 3.5}
              fill={i < idx ? '#34d399' : i === idx ? '#fbbf24' : '#94a3b8'}
              stroke="#fff"
              strokeWidth="0.6"
            />
            {words[i] && (
              <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="5" fill="#fff">
                {words[i].emoji}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="text-center text-[10px] font-bold text-white/90 py-1">
        Punto {Math.min(idx + 1, checkpoints)}/{checkpoints}
      </div>
    </div>
  );
};
