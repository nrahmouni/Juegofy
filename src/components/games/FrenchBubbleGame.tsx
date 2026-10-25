import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PlayerConfig, ThemeConfig, AgeGroup } from '../../types/game';
import { FRENCH_LEARNING_ITEMS, LearningItem } from '../../data/learningData';
import { VEHICLES, COSTUMES } from '../../data/garage';
import { sounds } from '../../audio/soundManager';
import { speakWord } from '../../audio/speech';
import { Volume2 } from 'lucide-react';
import { ThemeVocabularyBanner } from '../common/ThemeVocabularyBanner';

interface Props {
  player: PlayerConfig;
  difficulty: number;
  selectedLevel?: number;
  theme: ThemeConfig;
  ageGroup?: AgeGroup;
  onWin: (score: number, stars: number, words: number) => void;
  onLose: (why: 'bomb' | 'bee' | 'edge', score: number, stars: number, progress: number) => void;
  starsCollected: number;
  setStarsCollected: React.Dispatch<React.SetStateAction<number>>;
  wordsLearned: number;
  setWordsLearned: React.Dispatch<React.SetStateAction<number>>;
  setProgressPercent: React.Dispatch<React.SetStateAction<number>>;
}

const W = 400;
const H = 720;
const SHIP_Y = H - 90;

interface SpaceBubble {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  type: 'correct' | 'wrong' | 'star' | 'bomb';
  text?: string;
  emoji?: string;
  color: string;
}

interface PlasmaStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
}

export const FrenchBubbleGame: React.FC<Props> = ({
  player,
  difficulty,
  selectedLevel = 1,
  theme,
  onWin,
  onLose,
  starsCollected,
  setStarsCollected,
  wordsLearned,
  setWordsLearned,
  setProgressPercent,
}) => {
  const targetsToWin = Math.min(8, 2 + selectedLevel);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeItem, setActiveItem] = useState<LearningItem>(() => {
    return FRENCH_LEARNING_ITEMS[Math.floor(Math.random() * FRENCH_LEARNING_ITEMS.length)];
  });

  const [combo, setCombo] = useState<number>(0);
  const [coinsEarned, setCoinsEarned] = useState<number>(0);

  const shipXRef = useRef<number>(W / 2);
  const targetShipXRef = useRef<number>(W / 2);
  const starsRef = useRef<PlasmaStar[]>([]);
  const bubblesRef = useRef<SpaceBubble[]>([]);
  const nextBubbleIdRef = useRef<number>(1);
  const lastSpawnTimeRef = useRef<number>(0);

  const playerImgRef = useRef<HTMLImageElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const particlesRef = useRef<
    { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }[]
  >([]);
  const popTextRef = useRef<{ x: number; y: number; time: number; text: string; color: string } | null>(null);

  useEffect(() => {
    if (player.photoUrl) {
      const img = new Image();
      img.src = player.photoUrl;
      img.onload = () => (playerImgRef.current = img);
    } else {
      playerImgRef.current = null;
    }
  }, [player.photoUrl]);

  const pronounceCurrent = useCallback(() => {
    speakWord(activeItem.audioText, activeItem.audioLang);
  }, [activeItem]);

  useEffect(() => {
    const t = setTimeout(() => pronounceCurrent(), 400);
    return () => clearTimeout(t);
  }, [activeItem, pronounceCurrent]);

  const addParticles = (x: number, y: number, count: number, colors: string[]) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = 240 * (0.3 + Math.random() * 0.7);
      const life = 0.5 + Math.random() * 0.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        life,
        maxLife: life,
        color: colors[i % colors.length],
        size: 5 + Math.random() * 7,
      });
    }
  };

  const getCanvasCoords = (e: React.PointerEvent): [number, number] => {
    if (!canvasRef.current) return [W / 2, H / 2];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    return [x, y];
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const [clickX, clickY] = getCanvasCoords(e);
    targetShipXRef.current = Math.max(35, Math.min(W - 35, clickX));

    // Shoot Plasma Star!
    sounds.sfxPowerup();
    starsRef.current.push({
      x: shipXRef.current,
      y: SHIP_Y - 20,
      vx: (clickX - shipXRef.current) * 2,
      vy: -700,
      radius: 14,
      active: true,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons > 0) {
      const [clickX] = getCanvasCoords(e);
      targetShipXRef.current = Math.max(35, Math.min(W - 35, clickX));
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    let currentWords = wordsLearned;
    const baseSpeed = 70 + selectedLevel * 15 + difficulty * 25;

    const render = (time: number) => {
      const dt = Math.min(0.033, (time - lastTime) / 1000);
      lastTime = time;
      const t = time / 1000;

      // Smooth ship tracking
      shipXRef.current += (targetShipXRef.current - shipXRef.current) * Math.min(1, dt * 16);

      // Spawn floating French space bubbles
      if (t - lastSpawnTimeRef.current > Math.max(0.8, 1.3 - selectedLevel * 0.1)) {
        lastSpawnTimeRef.current = t;
        const rnd = Math.random();
        const spawnX = 50 + Math.random() * (W - 100);

        if (rnd < 0.44) {
          bubblesRef.current.push({
            id: nextBubbleIdRef.current++,
            x: spawnX,
            y: -35,
            vx: (Math.random() - 0.5) * 35,
            vy: baseSpeed * (0.85 + Math.random() * 0.3),
            r: Math.max(28, 40 - selectedLevel * 2),
            type: 'correct',
            text: activeItem.targetText,
            emoji: activeItem.emoji,
            color: '#3b82f6',
          });
        } else if (rnd < 0.74) {
          const wOpt = activeItem.wrongOptions[Math.floor(Math.random() * activeItem.wrongOptions.length)];
          bubblesRef.current.push({
            id: nextBubbleIdRef.current++,
            x: spawnX,
            y: -35,
            vx: (Math.random() - 0.5) * 35,
            vy: baseSpeed * (0.85 + Math.random() * 0.3),
            r: Math.max(26, 38 - selectedLevel * 2),
            type: 'wrong',
            text: wOpt.text,
            emoji: wOpt.emoji,
            color: '#ec4899',
          });
        } else if (rnd < 0.88) {
          bubblesRef.current.push({
            id: nextBubbleIdRef.current++,
            x: spawnX,
            y: -35,
            vx: (Math.random() - 0.5) * 20,
            vy: baseSpeed * 1.1,
            r: 28,
            type: 'star',
            emoji: '⭐',
            color: '#f59e0b',
          });
        }
      }

      // Update Plasma Stars
      starsRef.current.forEach((s) => {
        if (!s.active) return;
        s.y += s.vy * dt;
        s.x += s.vx * dt;

        // Collision with space bubbles (with magnetic snapping for correct target)
        bubblesRef.current.forEach((b) => {
          const dist = Math.hypot(s.x - b.x, s.y - b.y);
          if (b.type === 'correct' && difficulty < 2 && dist < 120) {
            b.x += (s.x - b.x) * 0.12;
            b.y += (s.y - b.y) * 0.12;
          }

          if (dist < s.radius + b.r) {
            s.active = false;
            b.y = H + 200; // Remove bubble

            if (b.type === 'correct') {
              const newCombo = combo + 1;
              setCombo(newCombo);
              currentWords += 1;
              setWordsLearned(currentWords);
              setProgressPercent(Math.min(100, (currentWords / targetsToWin) * 100));

              setCoinsEarned((prev) => prev + 20 * newCombo);
              setStarsCollected((prev) => prev + 1);

              addParticles(b.x, b.y, 40, ['#3b82f6', '#f59e0b', '#ec4899', '#ffffff']);
              speakWord(activeItem.audioText, activeItem.audioLang);

              popTextRef.current = {
                x: b.x,
                y: b.y,
                time: t,
                text: `¡${b.text}! +${20 * newCombo}🪙`,
                color: '#3b82f6',
              };

              if (currentWords >= targetsToWin) {
                const finalScore = currentWords * 80 + starsCollected * 20 + coinsEarned + 150;
                onWin(finalScore, starsCollected, currentWords);
                return;
              }

              const rem = FRENCH_LEARNING_ITEMS.filter((i) => i.id !== activeItem.id);
              setActiveItem(rem[Math.floor(Math.random() * rem.length)]);
            } else {
              // WRONG BUBBLE HIT: Zero points, combo reset
              setCombo(0);
              sounds.sfxBoing();
              addParticles(b.x, b.y, 18, ['#f472b6', '#ef4444']);
              popTextRef.current = {
                x: b.x,
                y: b.y,
                time: t,
                text: '¡Incorrecto! ❌',
                color: '#ef4444',
              };
            }
          }
        });
      });

      starsRef.current = starsRef.current.filter((s) => s.active && s.y > -20);

      bubblesRef.current = bubblesRef.current.filter((b) => {
        b.y += b.vy * dt;
        b.x += (b.vx + Math.sin(t * 3 + b.id) * 20) * dt;
        return b.y < H + 50;
      });

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        return p.life > 0;
      });

      // RENDER
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#090d16');
      bg.addColorStop(0.5, '#1e1b4b');
      bg.addColorStop(1, '#312e81');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Sparkling starfield
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 45; i++) {
        const sx = (i * 97) % W;
        const sy = (i * 131 + t * 15) % H;
        ctx.beginPath();
        ctx.arc(sx, sy, (i % 3) + 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Bubbles
      bubblesRef.current.forEach((b) => {
        ctx.save();
        ctx.translate(b.x, b.y);

        const orbGrad = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.3, b.r * 0.1, 0, 0, b.r);
        orbGrad.addColorStop(0, '#ffffff');
        orbGrad.addColorStop(0.7, b.color);
        orbGrad.addColorStop(1, '#1e1b4b');

        ctx.fillStyle = orbGrad;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (b.emoji) {
          ctx.font = '22px "Apple Color Emoji", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.emoji, 0, -8);
        }

        if (b.text) {
          ctx.fillStyle = '#ffffff';
          // Adaptive font size for long French words
          const fontSz = b.text.length > 7 ? 12 : 15;
          ctx.font = `900 ${fontSz}px "Baloo 2", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.text, 0, 14);
        }

        ctx.restore();
      });

      // Draw Plasma Stars
      starsRef.current.forEach((s) => {
        ctx.save();
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Spaceship
      const shipX = shipXRef.current;
      ctx.save();
      ctx.translate(shipX, SHIP_Y);

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(0, 28, 14 + Math.sin(t * 18) * 5, 0, Math.PI * 2);
      ctx.fill();

      const rRad = 28;
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, rRad, 0, Math.PI * 2);
      ctx.clip();

      if (playerImgRef.current) {
        ctx.drawImage(playerImgRef.current, -rRad, -rRad, rRad * 2, rRad * 2);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-rRad, -rRad, rRad * 2, rRad * 2);
        ctx.font = '30px "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.fallbackEmoji, 0, 2);
      }
      ctx.restore();

      ctx.strokeStyle = player.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, rRad, 0, Math.PI * 2);
      ctx.stroke();

      const vehObj = VEHICLES.find((v) => v.id === (player.selectedVehicle || 'rocket'));
      if (vehObj) {
        ctx.font = '30px "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(vehObj.icon, 0, -rRad - 4);
      }

      ctx.restore();

      if (popTextRef.current) {
        const age = t - popTextRef.current.time;
        if (age < 1.0) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - age / 1.0);
          ctx.translate(popTextRef.current.x, popTextRef.current.y - age * 25);
          ctx.font = '900 28px "Baloo 2", sans-serif';
          ctx.textAlign = 'center';
          ctx.lineWidth = 5;
          ctx.strokeStyle = '#ffffff';
          ctx.fillStyle = popTextRef.current.color;
          ctx.strokeText(popTextRef.current.text, 0, 0);
          ctx.fillText(popTextRef.current.text, 0, 0);
          ctx.restore();
        }
      }

      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeItem, combo, difficulty, onWin, player, selectedLevel, setCoinsEarned, setProgressPercent, setStarsCollected, setWordsLearned, starsCollected, targetsToWin, wordsLearned]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-0 m-0 overflow-hidden">
      <div className="absolute top-2 inset-x-0 z-30 flex justify-center">
        <ThemeVocabularyBanner modeKey="french" />
      </div>

      <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-30 max-w-[94vw] flex flex-col items-center">
        <div
          onClick={pronounceCurrent}
          className="cursor-pointer px-4 py-1.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl border-3 border-blue-300 flex items-center gap-2.5 animate-bounce"
        >
          <span className="text-2xl">{activeItem.emoji}</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black uppercase text-blue-200 leading-none">
              🚀 Nave Burbuja Francesa (Niv {selectedLevel}):
            </span>
            <div className="flex items-center gap-2 font-black text-white leading-tight">
              <span className="text-sm">{activeItem.es}</span>
              <span className="text-yellow-300">➔</span>
              <span className="text-yellow-300 text-xl font-black">{activeItem.targetText}</span>
              <Volume2 className="w-4 h-4 text-white ml-1" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-black text-white bg-black/50 px-3 py-0.5 rounded-full">
            Progreso: {wordsLearned} / {targetsToWin}
          </span>
          {combo > 1 && (
            <span className="text-[11px] font-black text-yellow-300 bg-purple-900/80 px-2 py-0.5 rounded-full border border-yellow-400 animate-pulse">
              ⚡ {combo}x PLASMA COMBO!
            </span>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{
          aspectRatio: `${W} / ${H}`,
          maxWidth: '100vw',
          maxHeight: '100dvh',
          width: 'auto',
          height: '100%',
        }}
        className="touch-none select-none rounded-2xl shadow-2xl block"
      />

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-30">
        <div className="px-4 py-1.5 rounded-full text-xs font-black bg-white/95 text-slate-800 border border-slate-200 shadow-lg">
          🚀 Mueve tu nave y toca para disparar estrellas de plasma 🚀
        </div>
      </div>
    </div>
  );
};
