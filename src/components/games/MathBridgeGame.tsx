import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PlayerConfig, ThemeConfig, AgeGroup } from '../../types/game';
import { MATH_LEARNING_ITEMS, LearningItem } from '../../data/learningData';
import { COSTUMES } from '../../data/garage';
import { sounds } from '../../audio/soundManager';
import { speakWord } from '../../audio/speech';
import { Volume2, Trophy } from 'lucide-react';
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
const SLING_Y = H - 110;
const GRAVITY = 750;

interface LilyPadChoice {
  id: number;
  x: number;
  y: number;
  r: number;
  text: string;
  isCorrect: boolean;
}

export const MathBridgeGame: React.FC<Props> = ({
  player,
  difficulty,
  selectedLevel = 1,
  theme,
  ageGroup,
  onWin,
  onLose,
  starsCollected,
  setStarsCollected,
  wordsLearned,
  setWordsLearned,
  setProgressPercent,
}) => {
  const totalSteps = Math.min(8, 2 + selectedLevel);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [questions, setQuestions] = useState<LearningItem[]>([]);
  const [combo, setCombo] = useState<number>(0);
  const [coinsEarned, setCoinsEarned] = useState<number>(0);

  // Initialize math questions
  useEffect(() => {
    const shuffled = [...MATH_LEARNING_ITEMS].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, totalSteps));
    setCurrentStep(0);
    setProgressPercent(0);
  }, [setProgressPercent, totalSteps]);

  const activeQuestion = questions[currentStep] || MATH_LEARNING_ITEMS[0];

  const pronounceCurrent = useCallback(() => {
    if (activeQuestion) {
      speakWord(activeQuestion.audioText, activeQuestion.audioLang);
    }
  }, [activeQuestion]);

  useEffect(() => {
    if (activeQuestion) {
      const t = setTimeout(() => pronounceCurrent(), 400);
      return () => clearTimeout(t);
    }
  }, [activeQuestion, pronounceCurrent]);

  // Slingshot Drag State
  const dragRef = useRef<{ isDragging: boolean; currX: number; currY: number }>({
    isDragging: false,
    currX: SLING_X,
    currY: SLING_Y,
  });

  // Flying Frog Projectile
  const frogRef = useRef<{ active: boolean; x: number; y: number; vx: number; vy: number; r: number }>({
    active: false,
    x: SLING_X,
    y: SLING_Y,
    vx: 0,
    vy: 0,
    r: 26,
  });

  // Lilypad Choices
  const padsRef = useRef<LilyPadChoice[]>([]);
  const playerImgRef = useRef<HTMLImageElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const particlesRef = useRef<
    { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }[]
  >([]);
  const popTextRef = useRef<{ x: number; y: number; time: number; text: string; color: string } | null>(null);

  // Preload photo
  useEffect(() => {
    if (player.photoUrl) {
      const img = new Image();
      img.src = player.photoUrl;
      img.onload = () => (playerImgRef.current = img);
    } else {
      playerImgRef.current = null;
    }
  }, [player.photoUrl]);

  // Setup Lilypad targets with well-spaced coordinates
  const setupPads = useCallback(() => {
    if (!activeQuestion) return;
    const correct = { text: activeQuestion.targetText, isCorrect: true };
    const wrongList = activeQuestion.wrongOptions.map((w) => ({ text: w.text, isCorrect: false }));
    const all = [correct, ...wrongList].sort(() => Math.random() - 0.5);

    const padArr: LilyPadChoice[] = [];
    const count = all.length;
    all.forEach((item, idx) => {
      const spacingX = W / (count + 1);
      padArr.push({
        id: idx,
        x: spacingX * (idx + 1),
        y: 220 + (idx % 2) * 55,
        r: 46, // Generous radius for text fitting
        text: item.text,
        isCorrect: item.isCorrect,
      });
    });

    padsRef.current = padArr;
  }, [activeQuestion]);

  useEffect(() => {
    setupPads();
  }, [activeQuestion, setupPads]);

  const addParticles = (x: number, y: number, count: number, colors: string[]) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = 200 * (0.3 + Math.random() * 0.7);
      const life = 0.5 + Math.random() * 0.5;
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
    if (frogRef.current.active) return;
    const [x, y] = getCanvasCoords(e);
    if (Math.hypot(x - SLING_X, y - SLING_Y) < 80) {
      dragRef.current = { isDragging: true, currX: x, currY: y };
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

    if (power > 15) {
      sounds.sfxSlingshotRelease();
      const speedMult = 8.5;
      frogRef.current = {
        active: true,
        x: SLING_X,
        y: SLING_Y,
        vx: dx * speedMult,
        vy: dy * speedMult,
        r: 26,
      };
    } else {
      dragRef.current.currX = SLING_X;
      dragRef.current.currY = SLING_Y;
    }
  };

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    let currentStepIdx = currentStep;

    const render = (time: number) => {
      const dt = Math.min(0.033, (time - lastTime) / 1000);
      lastTime = time;
      const t = time / 1000;

      const frog = frogRef.current;
      if (frog.active) {
        frog.vy += GRAVITY * dt;
        frog.x += frog.vx * dt;
        frog.y += frog.vy * dt;

        // Collision with Lilypads
        padsRef.current.forEach((pad) => {
          if (difficulty < 2 && Math.hypot(frog.x - pad.x, frog.y - pad.y) < 110) {
            frog.x += (pad.x - frog.x) * 0.12;
            frog.y += (pad.y - frog.y) * 0.12;
          }

          if (Math.hypot(frog.x - pad.x, frog.y - pad.y) < frog.r + pad.r) {
            frog.active = false;
            frog.x = SLING_X;
            frog.y = SLING_Y;

            if (pad.isCorrect) {
              // CORRECT MATH TARGET!
              sounds.sfxWin();
              const nextStep = currentStepIdx + 1;
              setCurrentStep(nextStep);
              currentStepIdx = nextStep;

              const newCombo = combo + 1;
              setCombo(newCombo);
              setWordsLearned((prev) => prev + 1);
              setStarsCollected((prev) => prev + 2);
              setCoinsEarned((prev) => prev + 20 * newCombo);
              setProgressPercent(Math.min(100, (nextStep / totalSteps) * 100));

              addParticles(pad.x, pad.y, 40, ['#22c55e', '#ffd23f', '#3b82f6', '#ffffff']);

              popTextRef.current = {
                x: pad.x,
                y: pad.y - 20,
                time: t,
                text: `¡CORRECTO! +${20 * newCombo}🪙`,
                color: '#10b981',
              };

              if (nextStep >= totalSteps) {
                const finalScore = totalSteps * 80 + starsCollected * 20 + coinsEarned + 150;
                onWin(finalScore, starsCollected, totalSteps);
              }
            } else {
              // SPLASH! Zero points, combo reset
              sounds.sfxSplash();
              setCombo(0);
              addParticles(pad.x, pad.y, 25, ['#38bdf8', '#0284c7', '#ffffff']);
              popTextRef.current = {
                x: pad.x,
                y: pad.y - 15,
                time: t,
                text: '¡Incorrecto! ❌',
                color: '#ef4444',
              };
            }
          }
        });

        if (frog.y > H + 50 || frog.x < -50 || frog.x > W + 50) {
          frog.active = false;
          frog.x = SLING_X;
          frog.y = SLING_Y;
        }
      }

      particlesRef.current = particlesRef.current.filter((pt) => {
        pt.life -= dt;
        pt.y += 100 * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        return pt.life > 0;
      });

      // RENDER
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#065f46');
      bg.addColorStop(0.5, '#0284c7');
      bg.addColorStop(1, '#0369a1');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 0; i < 15; i++) {
        const rx = (i * 87 + t * 40) % W;
        const ry = (i * 123) % (H - 180) + 120;
        ctx.beginPath();
        ctx.ellipse(rx, ry, 25, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      if (dragRef.current.isDragging) {
        const dx = SLING_X - dragRef.current.currX;
        const dy = SLING_Y - dragRef.current.currY;
        let simX = SLING_X;
        let simY = SLING_Y;
        let simVx = dx * 8.5;
        let simVy = dy * 8.5;
        const simDt = 0.04;

        ctx.fillStyle = '#fde047';
        for (let step = 0; step < 18; step++) {
          simVy += GRAVITY * simDt;
          simX += simVx * simDt;
          simY += simVy * simDt;

          ctx.beginPath();
          ctx.arc(simX, simY, Math.max(2, 6 - step * 0.25), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(SLING_X - 25, SLING_Y - 20);
        ctx.lineTo(dragRef.current.currX, dragRef.current.currY);
        ctx.lineTo(SLING_X + 25, SLING_Y - 20);
        ctx.stroke();
      }

      // Draw Floating Lilypads
      padsRef.current.forEach((pad) => {
        ctx.save();
        ctx.translate(pad.x, pad.y);

        ctx.fillStyle = '#10b981';
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, pad.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        // Adaptive font size so long words like "Cuadrado" fit perfectly
        const fontSz = pad.text.length > 5 ? 16 : 22;
        ctx.font = `900 ${fontSz}px "Baloo 2", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pad.text, 0, 0);

        ctx.restore();
      });

      const frogX = frog.active ? frog.x : dragRef.current.isDragging ? dragRef.current.currX : SLING_X;
      const frogY = frog.active ? frog.y : dragRef.current.isDragging ? dragRef.current.currY : SLING_Y;

      ctx.save();
      ctx.translate(frogX, frogY);

      ctx.strokeStyle = player.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, frog.r + 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, frog.r, 0, Math.PI * 2);
      ctx.clip();

      if (playerImgRef.current) {
        ctx.drawImage(playerImgRef.current, -frog.r, -frog.r, frog.r * 2, frog.r * 2);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-frog.r, -frog.r, frog.r * 2, frog.r * 2);
        ctx.font = '28px "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.fallbackEmoji, 0, 2);
      }
      ctx.restore();

      const cosObj = COSTUMES.find((c) => c.id === (player.selectedCostume || 'none'));
      if (cosObj && cosObj.id !== 'none') {
        ctx.font = '22px "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cosObj.icon, frogX, frogY - frog.r - 2);
      }

      if (popTextRef.current) {
        const age = t - popTextRef.current.time;
        if (age < 1.1) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - age / 1.1);
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
  }, [activeQuestion, combo, currentStep, difficulty, onWin, player, setCoinsEarned, setProgressPercent, setStarsCollected, setWordsLearned, starsCollected, totalSteps]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-0 m-0 overflow-hidden">
      <div className="absolute top-2 inset-x-0 z-30 flex justify-center">
        <ThemeVocabularyBanner modeKey="math" />
      </div>

      <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-30 max-w-[94vw] flex flex-col items-center">
        <div
          onClick={pronounceCurrent}
          className="cursor-pointer px-5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl border-4 border-emerald-400 flex items-center gap-3 animate-bounce"
        >
          <span className="text-3xl">{activeQuestion?.emoji}</span>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-[10px] font-black text-slate-500 uppercase leading-none">
              🐸 Matemágica (Paso {currentStep + 1} de {totalSteps}):
            </span>
            <div className="flex items-center gap-2 font-black text-emerald-950 text-2xl leading-tight">
              <span>{activeQuestion?.es}</span>
              <Volume2 className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-black text-white bg-black/50 px-3 py-0.5 rounded-full">
            Pasos: {currentStep} / {totalSteps}
          </span>
          {combo > 1 && (
            <span className="text-[11px] font-black text-yellow-300 bg-emerald-900/80 px-2 py-0.5 rounded-full border border-yellow-400 animate-pulse">
              🔥 {combo}x SUPER FROG JUMP!
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

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-30 max-w-[92vw]">
        <div className="px-4 py-1.5 rounded-full text-xs font-black bg-white/95 text-slate-800 border border-slate-200 shadow-lg text-center">
          {activeQuestion?.es.includes('?')
            ? '🏹 Estira el tirachinas y apunta a la hoja con la respuesta correcta 🐸'
            : '🏹 Estira el tirachinas y apunta a la hoja con la figura correcta 🐸'}
        </div>
      </div>
    </div>
  );
};
