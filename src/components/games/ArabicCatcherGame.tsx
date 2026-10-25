import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PlayerConfig, ThemeConfig, AgeGroup } from '../../types/game';
import { STICKERS } from '../../data/themes';
import { ARABIC_LEARNING_ITEMS, LearningItem } from '../../data/learningData';
import { COSTUMES } from '../../data/garage';
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
const SLING_X = W / 2;
const SLING_Y = H - 120;

interface TargetBalloon {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'target_correct' | 'target_wrong' | 'star' | 'coin';
  text?: string;
  subText?: string;
  emoji?: string;
  radius: number;
  popped?: boolean;
}

export const ArabicCatcherGame: React.FC<Props> = ({
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
    return ARABIC_LEARNING_ITEMS[Math.floor(Math.random() * ARABIC_LEARNING_ITEMS.length)];
  });

  const [combo, setCombo] = useState<number>(0);
  const [coinsEarned, setCoinsEarned] = useState<number>(0);

  // Dynamic Difficulty scaling based on selectedLevel (1-5) and difficulty (0-2)
  const gravityVal = 600 + selectedLevel * 40 + difficulty * 60;
  const targetRadius = Math.max(26, 46 - selectedLevel * 3 - difficulty * 4);

  const dragRef = useRef<{ isDragging: boolean; startX: number; startY: number; currX: number; currY: number }>({
    isDragging: false,
    startX: SLING_X,
    startY: SLING_Y,
    currX: SLING_X,
    currY: SLING_Y,
  });

  const projRef = useRef<{
    active: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
  }>({
    active: false,
    x: SLING_X,
    y: SLING_Y,
    vx: 0,
    vy: 0,
    radius: 30,
  });

  const balloonsRef = useRef<TargetBalloon[]>([]);
  const nextBalloonIdRef = useRef<number>(1);
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
    const t = setTimeout(() => pronounceCurrent(), 300);
    return () => clearTimeout(t);
  }, [activeItem, pronounceCurrent]);

  const respawnBalloons = useCallback(() => {
    const arr: TargetBalloon[] = [];
    // Correct target
    arr.push({
      id: nextBalloonIdRef.current++,
      x: W * 0.25 + Math.random() * (W * 0.5),
      y: 160 + Math.random() * 80,
      vx: (Math.random() - 0.5) * (20 + selectedLevel * 8 + difficulty * 15),
      vy: (Math.random() - 0.5) * (10 + selectedLevel * 4),
      type: 'target_correct',
      text: activeItem.targetText,
      emoji: activeItem.emoji,
      radius: targetRadius,
    });

    // Wrong distractors (more distractors at higher levels)
    const wrongCount = selectedLevel >= 4 ? 4 : 3;
    const wrongList = activeItem.wrongOptions;
    wrongList.slice(0, wrongCount).forEach((w, idx) => {
      arr.push({
        id: nextBalloonIdRef.current++,
        x: ((idx + 1) * W) / (wrongCount + 1) + (Math.random() * 20 - 10),
        y: 260 + Math.random() * 90,
        vx: (Math.random() - 0.5) * (25 + selectedLevel * 8 + difficulty * 15),
        vy: (Math.random() - 0.5) * 15,
        type: 'target_wrong',
        text: w.text,
        emoji: w.emoji,
        radius: targetRadius - 4,
      });
    });

    balloonsRef.current = arr;
  }, [activeItem, selectedLevel, difficulty, targetRadius]);

  useEffect(() => {
    respawnBalloons();
  }, [activeItem, respawnBalloons]);

  const addParticles = (x: number, y: number, count: number, colors: string[]) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = 200 * (0.3 + Math.random() * 0.7);
      const life = 0.4 + Math.random() * 0.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        life,
        maxLife: life,
        color: colors[i % colors.length],
        size: 5 + Math.random() * 6,
      });
    }
  };

  const getCanvasCoords = (e: React.PointerEvent): [number, number] => {
    if (!canvasRef.current) return [SLING_X, SLING_Y];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    return [x, y];
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (projRef.current.active) return;
    const [x, y] = getCanvasCoords(e);
    if (Math.hypot(x - SLING_X, y - SLING_Y) < 90) {
      dragRef.current = { isDragging: true, startX: SLING_X, startY: SLING_Y, currX: x, currY: y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      sounds.sfxSlingshotStretch();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.isDragging) return;
    const [x, y] = getCanvasCoords(e);
    dragRef.current.currX = x;
    dragRef.current.currY = y;
  };

  const handlePointerUp = () => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;

    const dx = SLING_X - dragRef.current.currX;
    const dy = SLING_Y - dragRef.current.currY;
    const power = Math.hypot(dx, dy);

    if (power > 12) {
      sounds.sfxSlingshotRelease();
      projRef.current = {
        active: true,
        x: SLING_X,
        y: SLING_Y,
        vx: dx * 9.0,
        vy: dy * 9.0,
        radius: 30,
      };
    } else {
      dragRef.current.currX = SLING_X;
      dragRef.current.currY = SLING_Y;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    let currentWords = wordsLearned;

    const render = (time: number) => {
      const dt = Math.min(0.033, (time - lastTime) / 1000);
      lastTime = time;
      const t = time / 1000;

      const p = projRef.current;
      if (p.active) {
        p.vy += gravityVal * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.x - p.radius < 0) {
          p.x = p.radius;
          p.vx = -p.vx * 0.7;
          sounds.sfxBoing();
        } else if (p.x + p.radius > W) {
          p.x = W - p.radius;
          p.vx = -p.vx * 0.7;
          sounds.sfxBoing();
        }

        // Collision logic
        balloonsRef.current.forEach((b) => {
          if (b.popped) return;
          const dist = Math.hypot(p.x - b.x, p.y - b.y);

          // Magnetic pull only for correct target in lower difficulty modes (0, 1)
          if (b.type === 'target_correct' && difficulty < 2 && dist < 90) {
            b.x += (p.x - b.x) * 0.1;
            b.y += (p.y - b.y) * 0.1;
          }

          if (dist < p.radius + b.radius) {
            b.popped = true;

            if (b.type === 'target_correct') {
              // CORRECT HIT!
              const newCombo = combo + 1;
              setCombo(newCombo);
              currentWords += 1;
              setWordsLearned(currentWords);
              setProgressPercent(Math.min(100, (currentWords / targetsToWin) * 100));

              setCoinsEarned((prev) => prev + 20 * newCombo);
              setStarsCollected((prev) => prev + 1);

              sounds.sfxWin();
              addParticles(b.x, b.y, 40, ['#22c55e', '#ffd23f', '#38bdf8', '#ffffff']);
              speakWord(activeItem.audioText, activeItem.audioLang);

              popTextRef.current = {
                x: b.x,
                y: b.y - 20,
                time: t,
                text: `¡${b.text}! +${20 * newCombo}🪙`,
                color: '#10b981',
              };

              if (currentWords >= targetsToWin) {
                const finalScore = currentWords * 80 + starsCollected * 20 + coinsEarned + 150;
                onWin(finalScore, starsCollected, currentWords);
                return;
              }

              const rem = ARABIC_LEARNING_ITEMS.filter((i) => i.id !== activeItem.id);
              setActiveItem(rem[Math.floor(Math.random() * rem.length)]);
              p.active = false;
              p.x = SLING_X;
              p.y = SLING_Y;
            } else {
              // WRONG HIT! NO POINTS GIVEN! Combo reset and penalty
              setCombo(0);
              sounds.sfxBoing();
              addParticles(b.x, b.y, 16, ['#f472b6', '#ef4444']);
              popTextRef.current = {
                x: b.x,
                y: b.y - 20,
                time: t,
                text: '¡Incorrecto! ❌',
                color: '#ef4444',
              };
              p.active = false;
              p.x = SLING_X;
              p.y = SLING_Y;
            }
          }
        });

        if (p.y > H + 50 || p.x < -80 || p.x > W + 80) {
          p.active = false;
          p.x = SLING_X;
          p.y = SLING_Y;
        }
      }

      balloonsRef.current.forEach((b) => {
        if (b.popped) return;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x - b.radius < 15 || b.x + b.radius > W - 15) b.vx = -b.vx;
        if (b.y - b.radius < 100 || b.y + b.radius > 450) b.vy = -b.vy;
      });

      particlesRef.current = particlesRef.current.filter((pt) => {
        pt.life -= dt;
        pt.y += 90 * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        return pt.life > 0;
      });

      // RENDER
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0284c7');
      bg.addColorStop(0.5, '#38bdf8');
      bg.addColorStop(1, '#a7f3d0');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      if (dragRef.current.isDragging) {
        const dx = SLING_X - dragRef.current.currX;
        const dy = SLING_Y - dragRef.current.currY;
        let simX = SLING_X;
        let simY = SLING_Y;
        let simVx = dx * 9.0;
        let simVy = dy * 9.0;
        const simDt = 0.04;

        ctx.fillStyle = '#ffd23f';
        for (let step = 0; step < 16; step++) {
          simVy += gravityVal * simDt;
          simX += simVx * simDt;
          simY += simVy * simDt;

          ctx.beginPath();
          ctx.arc(simX, simY, Math.max(2, 6 - step * 0.25), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      balloonsRef.current.forEach((b) => {
        if (b.popped) return;
        ctx.save();
        ctx.translate(b.x, b.y);

        if (b.type === 'target_correct') {
          ctx.fillStyle = '#fde047';
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.font = '24px "Apple Color Emoji", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.emoji || '✨', 0, -8);

          ctx.fillStyle = '#78350f';
          ctx.font = '900 16px "Baloo 2", sans-serif';
          ctx.fillText(b.text || '', 0, 16);
        } else {
          ctx.fillStyle = '#f472b6';
          ctx.strokeStyle = '#be185d';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.font = '20px "Apple Color Emoji", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.emoji || '🌸', 0, -6);

          ctx.fillStyle = '#831843';
          ctx.font = '900 14px "Baloo 2", sans-serif';
          ctx.fillText(b.text || '', 0, 14);
        }

        ctx.restore();
      });

      const projX = p.active ? p.x : dragRef.current.isDragging ? dragRef.current.currX : SLING_X;
      const projY = p.active ? p.y : dragRef.current.isDragging ? dragRef.current.currY : SLING_Y;

      ctx.save();
      ctx.translate(projX, projY);

      ctx.strokeStyle = player.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.clip();

      if (playerImgRef.current) {
        ctx.drawImage(playerImgRef.current, -p.radius, -p.radius, p.radius * 2, p.radius * 2);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        ctx.font = '32px "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.fallbackEmoji, 0, 2);
      }
      ctx.restore();

      const cosObj = COSTUMES.find((c) => c.id === (player.selectedCostume || 'none'));
      if (cosObj && cosObj.id !== 'none') {
        ctx.font = '24px "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cosObj.icon, projX, projY - p.radius - 2);
      }

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

      particlesRef.current.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeItem, combo, difficulty, gravityVal, onWin, player, selectedLevel, setCoinsEarned, setProgressPercent, setStarsCollected, setWordsLearned, starsCollected, targetsToWin, wordsLearned]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-0 m-0 overflow-hidden">
      <div className="absolute top-2 inset-x-0 z-30 flex justify-center">
        <ThemeVocabularyBanner modeKey="arabic" />
      </div>

      <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-30 max-w-[94vw] flex flex-col items-center">
        <div
          onClick={pronounceCurrent}
          className="cursor-pointer px-4 py-1.5 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-900 shadow-xl border-3 border-yellow-200 flex items-center gap-2.5 animate-bounce"
        >
          <span className="text-2xl">{activeItem.emoji}</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black uppercase text-amber-900 leading-none">
              🎯 Lanza con el Tirachinas (Niv {selectedLevel}):
            </span>
            <div className="flex items-center gap-2 font-black text-slate-900 leading-tight">
              <span className="text-sm">{activeItem.es}</span>
              <span className="text-pink-700">➔</span>
              <span className="text-slate-950 text-xl font-black">{activeItem.targetText}</span>
              <Volume2 className="w-4 h-4 text-slate-900 ml-1" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-black text-white bg-black/50 px-3 py-0.5 rounded-full">
            Progreso: {wordsLearned} / {targetsToWin}
          </span>
          {combo > 1 && (
            <span className="text-[11px] font-black text-yellow-300 bg-purple-900/80 px-2 py-0.5 rounded-full border border-yellow-400 animate-pulse">
              🔥 {combo}x COMBO!
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
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
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
          🏹 Estira hacia atrás y suelta para lanzar tu personaje 🎯
        </div>
      </div>
    </div>
  );
};
