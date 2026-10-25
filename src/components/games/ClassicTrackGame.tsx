import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PlayerConfig, ThemeConfig, TrackData, TrackItem, ControlMode, AgeGroup, GameModeId } from '../../types/game';
import { STICKERS } from '../../data/themes';
import { VEHICLES, COSTUMES } from '../../data/garage';
import { sounds } from '../../audio/soundManager';
import { ThemeVocabularyBanner } from '../common/ThemeVocabularyBanner';

interface Props {
  player: PlayerConfig;
  turnIndex: number;
  theme: ThemeConfig;
  difficulty: number;
  selectedLevel?: number;
  gameMode?: GameModeId;
  ageGroup?: AgeGroup;
  controlMode: ControlMode;
  onWin: (score: number, stars: number, path: [number, number][]) => void;
  onLose: (why: 'bomb' | 'bee' | 'edge', score: number, stars: number, progress: number, path: [number, number][]) => void;
  onTriggerChallenge: () => void;
  challengeReward: { stars: number; shield: boolean } | null;
  clearChallengeReward: () => void;
  hasShield: boolean;
  setHasShield: React.Dispatch<React.SetStateAction<boolean>>;
  starsCollected: number;
  setStarsCollected: React.Dispatch<React.SetStateAction<number>>;
  setProgressPercent: React.Dispatch<React.SetStateAction<number>>;
}

const W = 400;
const H = 740;
const START_Y = H - 65;
const FIN_Y = 60;

export const ClassicTrackGame: React.FC<Props> = ({
  player,
  turnIndex,
  theme,
  difficulty,
  selectedLevel = 1,
  gameMode,
  ageGroup,
  controlMode,
  onWin,
  onLose,
  onTriggerChallenge,
  challengeReward,
  clearChallengeReward,
  hasShield,
  setHasShield,
  starsCollected,
  setStarsCollected,
  setProgressPercent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [playState, setPlayState] = useState<'ready' | 'draw' | 'pause' | 'done'>('ready');
  const [hintText, setHintText] = useState<string>('¡Pon tu dedo en SALIDA y sigue el camino!');

  const trackRef = useRef<TrackData | null>(null);
  const maskDataRef = useRef<Uint8ClampedArray | null>(null);
  const pathPointsRef = useRef<[number, number][]>([]);
  const lastPointRef = useRef<[number, number]>([W / 2, START_Y]);

  const touchAnchorRef = useRef<[number, number] | null>(null);
  const avatarAnchorRef = useRef<[number, number]>([W / 2, START_Y]);
  const activeTouchPointRef = useRef<[number, number] | null>(null);

  const bestProgressRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastWarningTimeRef = useRef<number>(0);
  const boomRef = useRef<{ x: number; y: number; time: number; text: string } | null>(null);
  const particlesRef = useRef<
    { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }[]
  >([]);
  const playerImgRef = useRef<HTMLImageElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isCloseToDangerRef = useRef<boolean>(false);

  useEffect(() => {
    if (player.photoUrl) {
      const img = new Image();
      img.src = player.photoUrl;
      img.onload = () => {
        playerImgRef.current = img;
      };
    } else {
      playerImgRef.current = null;
    }
  }, [player.photoUrl]);

  useEffect(() => {
    if (challengeReward) {
      if (challengeReward.stars > 0) setStarsCollected((prev) => prev + challengeReward.stars);
      if (challengeReward.shield) setHasShield(true);
      clearChallengeReward();
      setHintText('¡Reto superado! Toca tu carita para continuar 🚀');
    }
  }, [challengeReward, clearChallengeReward, setHasShield, setStarsCollected]);

  const generateTrack = useCallback(() => {
    const isPreschool = ageGroup === 'preschool';
    // Level scaling for road width (narrower as level increases)
    const baseRoadWidths = [120, 106, 92, 78, 64];
    const lvlIdx = Math.max(0, Math.min(4, selectedLevel - 1));
    const w = baseRoadWidths[lvlIdx] - difficulty * 8;

    const bCount = Math.min(7, 1 + selectedLevel + difficulty);
    const mCount = Math.min(5, Math.floor(selectedLevel / 2) + difficulty);

    const margin = w / 2 + 18;
    const N = 8;
    const controlPoints: [number, number][] = [];

    const seed = Date.now() + turnIndex * 47;
    let s = seed;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    for (let i = 0; i < N; i++) {
      const y = START_Y - ((START_Y - FIN_Y) * i) / (N - 1);
      let x = W / 2;
      if (i > 0 && i < N - 1) {
        const amplitude = 85 + rnd() * 40;
        const dir = i % 2 === 0 ? 1 : -1;
        x = W / 2 + dir * amplitude * (0.35 + 0.65 * rnd());
      } else if (i === N - 1) {
        x = W / 2 + (rnd() - 0.5) * 45;
      }
      controlPoints.push([Math.max(margin, Math.min(W - margin, x)), y]);
    }

    const q = [controlPoints[0], ...controlPoints, controlPoints[N - 1]];
    const pts: [number, number][] = [];
    const segments = 18;

    for (let i = 1; i < q.length - 2; i++) {
      for (let j = 0; j < segments; j++) {
        const t = j / segments;
        const t2 = t * t;
        const t3 = t2 * t;
        const f = (c: number) =>
          0.5 *
          (2 * q[i][c] +
            (-q[i - 1][c] + q[i + 1][c]) * t +
            (2 * q[i - 1][c] - 5 * q[i][c] + 4 * q[i + 1][c] - q[i + 2][c]) * t2 +
            (-q[i - 1][c] + 3 * q[i][c] - 3 * q[i + 1][c] + q[i + 2][c]) * t3);
        pts.push([f(0), f(1)]);
      }
    }
    pts.push(controlPoints[N - 1]);

    const getNormal = (idx: number): [number, number] => {
      const safeIdx = Math.max(1, Math.min(pts.length - 2, idx));
      const A = pts[safeIdx - 1];
      const B = pts[safeIdx + 1];
      const dx = B[0] - A[0];
      const dy = B[1] - A[1];
      const len = Math.hypot(dx, dy) || 1;
      return [-dy / len, dx / len];
    };

    const items: TrackItem[] = [];
    let itemId = 0;

    const placeHazard = (type: 'b' | 'm', count: number) => {
      for (let c = 0; c < count; c++) {
        for (let tries = 0; tries < 200; tries++) {
          const ptIdx = Math.floor(pts.length * (0.16 + 0.68 * rnd()));
          const [nx, ny] = getNormal(ptIdx);
          const rad = type === 'm' ? 12 : Math.min(13 + rnd() * 2, (w - 28) / 2);
          const offset = type === 'm' ? 0 : (rnd() * 2 - 1) * (w / 2 - rad - 4);
          const x = pts[ptIdx][0] + nx * offset;
          const y = pts[ptIdx][1] + ny * offset;

          if (y > START_Y - 70 || y < FIN_Y + 45) continue;
          if (items.some((it) => Math.hypot(it.x - x, it.y - y) < 65)) continue;

          items.push({
            id: itemId++,
            t: type,
            x,
            y,
            r: rad,
            nx,
            ny,
            am: w / 2 - rad - 3,
            sp: 1.5 + rnd() * 0.7,
            ph: rnd() * Math.PI * 2,
          });
          break;
        }
      }
    };

    placeHazard('b', bCount);
    placeHazard('m', mCount);

    const starCount = 6;
    for (let j = 1; j <= starCount; j++) {
      const ptIdx = Math.floor(((pts.length - 2) * j) / (starCount + 1));
      const [nx, ny] = getNormal(ptIdx);
      const offset = (rnd() < 0.5 ? -1 : 1) * w * 0.22;
      items.push({
        id: itemId++,
        t: 's',
        x: pts[ptIdx][0] + nx * offset,
        y: pts[ptIdx][1] + ny * offset,
        r: 10,
        g: false,
      });
    }

    const shieldPtIdx = Math.floor(pts.length * 0.35);
    items.push({
      id: itemId++,
      t: 'shield',
      x: pts[shieldPtIdx][0],
      y: pts[shieldPtIdx][1],
      r: 14,
      g: false,
    });

    const mysteryPtIdx = Math.floor(pts.length * 0.68);
    items.push({
      id: itemId++,
      t: 'mystery',
      x: pts[mysteryPtIdx][0],
      y: pts[mysteryPtIdx][1],
      r: 15,
      g: false,
    });

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = W;
    maskCanvas.height = H;
    const mCtx = maskCanvas.getContext('2d');
    if (mCtx) {
      mCtx.fillStyle = '#000000';
      mCtx.fillRect(0, 0, W, H);

      mCtx.fillStyle = '#ffffff';
      mCtx.beginPath();
      mCtx.arc(pts[0][0], START_Y, w / 2 + 40, 0, Math.PI * 2);
      mCtx.fill();
      if (mCtx.roundRect) mCtx.roundRect(pts[0][0] - 65, START_Y - 25, 130, 60, 20);
      else mCtx.rect(pts[0][0] - 65, START_Y - 25, 130, 60);
      mCtx.fill();

      const finPt = pts[pts.length - 1];
      mCtx.beginPath();
      mCtx.arc(finPt[0], FIN_Y, w / 2 + 40, 0, Math.PI * 2);
      mCtx.fill();

      mCtx.strokeStyle = '#ffffff';
      mCtx.lineWidth = w + 14;
      mCtx.lineCap = 'round';
      mCtx.lineJoin = 'round';
      mCtx.beginPath();
      pts.forEach((p, idx) => {
        if (idx === 0) mCtx.moveTo(p[0], p[1]);
        else mCtx.lineTo(p[0], p[1]);
      });
      mCtx.stroke();

      maskDataRef.current = mCtx.getImageData(0, 0, W, H).data;
    }

    const decorations: { x: number; y: number; emoji: string; size: number; rot: number }[] = [];
    for (let i = 0; i < 26; i++) {
      const decX = rnd() * W;
      const decY = rnd() * H;
      if (maskDataRef.current && maskDataRef.current[(Math.floor(decY) * W + Math.floor(decX)) * 4] > 80) {
        continue;
      }
      decorations.push({
        x: decX,
        y: decY,
        emoji: theme.decorations[Math.floor(rnd() * theme.decorations.length)],
        size: 20 + rnd() * 12,
        rot: (rnd() - 0.5) * 0.4,
      });
    }

    trackRef.current = { pts, it: items, w, decorations };
  }, [difficulty, selectedLevel, theme, turnIndex]);

  const isOnTrack = (x: number, y: number): boolean => {
    if (y >= START_Y - 30) {
      const startX = trackRef.current ? trackRef.current.pts[0][0] : W / 2;
      if (Math.hypot(x - startX, y - START_Y) < 85) return true;
    }
    if (y <= FIN_Y + 25) {
      const finX = trackRef.current ? trackRef.current.pts[trackRef.current.pts.length - 1][0] : W / 2;
      if (Math.hypot(x - finX, y - FIN_Y) < 85) return true;
    }

    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= W || iy >= H) return false;
    if (!maskDataRef.current) return true;

    return maskDataRef.current[(iy * W + ix) * 4] > 60;
  };

  const addParticles = (x: number, y: number, count: number, colors: string[], speed: number = 180) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = speed * (0.3 + Math.random() * 0.7);
      const life = 0.5 + Math.random() * 0.6;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        life,
        maxLife: life,
        color: colors[i % colors.length],
        size: 4 + Math.random() * 5,
      });
    }
  };

  useEffect(() => {
    generateTrack();
    setPlayState('ready');
    pathPointsRef.current = [];
    bestProgressRef.current = 0;
    boomRef.current = null;
    particlesRef.current = [];

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [generateTrack]);

  const handleHit = (why: 'bomb' | 'bee' | 'edge', x: number, y: number) => {
    if (hasShield && why !== 'edge') {
      setHasShield(false);
      sounds.sfxBoing();
      addParticles(x, y, 25, ['#38bdf8', '#ffffff', '#818cf8'], 180);
      boomRef.current = { x, y, time: performance.now() / 1000, text: '¡ESCUDO!' };
      setHintText('🛡️ ¡Tu escudo absorbió el golpe! ¡Sigue adelante!');
      return;
    }

    boomRef.current = {
      x,
      y,
      time: performance.now() / 1000,
      text: why === 'bomb' ? '¡BUM! 🤪' : why === 'bee' ? '¡BZZZ! 🐝' : '¡BOING! 🤪',
    };

    addParticles(
      x,
      y,
      why === 'bomb' ? 35 : 25,
      why === 'bomb' ? ['#ff4f3d', '#ffb02e', '#ffe066'] : ['#fbbf24', '#f59e0b', '#3b82f6'],
      why === 'bomb' ? 200 : 150
    );

    sounds.sfxBoing();

    // Friendly bounce back without losing!
    setHintText('¡Boing! 🤪 ¡Vuelve al camino y sigue adelante! 🚀');

    // Nudge position back slightly to safety
    if (trackRef.current && trackRef.current.pts.length > 0) {
      const closestPt = trackRef.current.pts.reduce((prev, curr) =>
        Math.hypot(curr[0] - x, curr[1] - y) < Math.hypot(prev[0] - x, prev[1] - y) ? curr : prev
      );
      lastPointRef.current = [closestPt[0], closestPt[1]];
      avatarAnchorRef.current = [closestPt[0], closestPt[1]];
    }
  };

  const getItemPos = (o: TrackItem, t: number): [number, number] => {
    if (o.t === 'm' && o.nx !== undefined && o.ny !== undefined && o.am !== undefined) {
      return [
        o.x + o.nx * Math.sin(t * (o.sp || 1.6) + (o.ph || 0)) * o.am,
        o.y + o.ny * Math.sin(t * (o.sp || 1.6) + (o.ph || 0)) * o.am,
      ];
    }
    return [o.x, o.y];
  };

  const processStep = (targetPoint: [number, number]): boolean => {
    const [x0, y0] = lastPointRef.current;
    const [x1, y1] = targetPoint;
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(dist / 2.5));
    const nowTime = performance.now() / 1000;
    const elapsedSinceStart = (Date.now() - startTimeRef.current) / 1000;

    isCloseToDangerRef.current = false;

    for (let i = 1; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps;
      const y = y0 + ((y1 - y0) * i) / steps;

      const inGraceStart = elapsedSinceStart < 1.0 || y >= START_Y - 45;

      if (!inGraceStart && !isOnTrack(x, y)) {
        handleHit('edge', x, y);
        return true;
      }

      if (trackRef.current) {
        for (const item of trackRef.current.it) {
          if (item.t === 's') {
            if (!item.g && Math.hypot(x - item.x, y - item.y) < 18) {
              item.g = true;
              setStarsCollected((prev) => {
                const next = prev + 1;
                sounds.sfxStar(next);
                return next;
              });
              addParticles(item.x, item.y, 16, ['#ffd23f', '#ffffff', '#ff9f1c'], 120);
            }
          } else if (item.t === 'shield') {
            if (!item.g && Math.hypot(x - item.x, y - item.y) < 20) {
              item.g = true;
              setHasShield(true);
              sounds.sfxPowerup();
              addParticles(item.x, item.y, 22, ['#38bdf8', '#818cf8', '#ffffff'], 140);
              setHintText('🛡️ ¡Escudo activado! Te protegerá de 1 golpe');
            }
          } else if (item.t === 'mystery') {
            if (!item.g && Math.hypot(x - item.x, y - item.y) < 22) {
              item.g = true;
              sounds.sfxPowerup();
              addParticles(item.x, item.y, 25, ['#ec4899', '#f59e0b', '#8b5cf6'], 160);
              setPlayState('pause');
              onTriggerChallenge();
              return true;
            }
          } else {
            const [ox, oy] = getItemPos(item, nowTime);
            const d = Math.hypot(x - ox, y - oy);

            if (d < item.r + 28) {
              isCloseToDangerRef.current = true;
              if (nowTime - lastWarningTimeRef.current > 0.3) {
                lastWarningTimeRef.current = nowTime;
                sounds.sfxWarning();
              }
            }

            if (d < item.r + 3) {
              handleHit(item.t === 'b' ? 'bomb' : 'bee', x, y);
              return true;
            }
          }
        }
      }

      if (
        !inGraceStart &&
        (!isOnTrack(x + 16, y) ||
          !isOnTrack(x - 16, y) ||
          !isOnTrack(x, y + 16) ||
          !isOnTrack(x, y - 16))
      ) {
        isCloseToDangerRef.current = true;
        if (nowTime - lastWarningTimeRef.current > 0.35) {
          lastWarningTimeRef.current = nowTime;
          sounds.sfxWarning();
        }
      }

      const progress = Math.max(0, (START_Y - y) / (START_Y - FIN_Y));
      bestProgressRef.current = Math.max(bestProgressRef.current, progress);
      setProgressPercent(Math.min(100, Math.round(bestProgressRef.current * 100)));

      if (y <= FIN_Y) {
        pathPointsRef.current.push([x, y]);
        setProgressPercent(100);
        setPlayState('done');
        const score = starsCollected * 15 + 150;
        onWin(score, starsCollected, pathPointsRef.current);
        return true;
      }
    }

    pathPointsRef.current.push(targetPoint);
    lastPointRef.current = targetPoint;
    return false;
  };

  const getCanvasCoords = (e: React.PointerEvent): [number, number] => {
    if (!canvasRef.current) return [0, 0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    return [Math.max(0, Math.min(W, x)), Math.max(0, Math.min(H, y))];
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const coords = getCanvasCoords(e);
    activeTouchPointRef.current = coords;
    const startX = trackRef.current ? trackRef.current.pts[0][0] : W / 2;

    if (playState === 'pause') {
      const [lx, ly] = lastPointRef.current;
      const dist = Math.hypot(coords[0] - lx, coords[1] - ly);

      if (controlMode === 'offset') {
        touchAnchorRef.current = coords;
        avatarAnchorRef.current = [lx, ly];
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setPlayState('draw');
        setHintText('¡Sigue adelante guiando tu carita! 🏃‍♂️');
        sounds.sfxPop();
        return;
      }

      if (dist > 65) {
        setHintText('¡Toca sobre tu carita donde te quedaste! 👇');
        sounds.sfxPop();
        return;
      }
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setPlayState('draw');
      setHintText('¡No sueltes el dedo y sigue el camino! 🏃‍♂️');
      sounds.sfxPop();
      return;
    }

    if (playState !== 'ready') return;

    const distToStart = Math.hypot(coords[0] - startX, coords[1] - START_Y);
    const canStart =
      controlMode === 'offset'
        ? coords[1] >= START_Y - 40 || distToStart < 75
        : distToStart < 65 || (coords[1] >= START_Y - 25 && Math.abs(coords[0] - startX) < 55);

    if (!canStart) {
      setHintText('¡Toca sobre tu carita o la zona verde de SALIDA! 👇');
      sounds.sfxPop();
      return;
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const startP: [number, number] = [startX, START_Y];
    pathPointsRef.current = [startP];
    lastPointRef.current = startP;
    avatarAnchorRef.current = startP;
    touchAnchorRef.current = coords;
    startTimeRef.current = Date.now();
    setPlayState('draw');
    setHintText('¡Desliza tu dedo hacia arriba y esquiva las bombas! 🚀');
    sounds.sfxPop();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (playState !== 'draw') return;
    const coords = getCanvasCoords(e);
    activeTouchPointRef.current = coords;

    let targetPoint: [number, number];

    if (controlMode === 'offset' && touchAnchorRef.current) {
      const dx = coords[0] - touchAnchorRef.current[0];
      const dy = coords[1] - touchAnchorRef.current[1];
      targetPoint = [
        Math.max(12, Math.min(W - 12, avatarAnchorRef.current[0] + dx)),
        Math.max(FIN_Y - 10, Math.min(START_Y + 10, avatarAnchorRef.current[1] + dy)),
      ];
    } else {
      targetPoint = coords;
    }

    processStep(targetPoint);
  };

  const handlePointerUp = () => {
    activeTouchPointRef.current = null;
    touchAnchorRef.current = null;
    if (playState === 'draw') {
      setPlayState('pause');
      setHintText('¡Pausa! Toca para continuar cuando estés listo');
      sounds.sfxPop();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      const t = time / 1000;

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life -= dt;
        p.vy += 80 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        return p.life > 0;
      });

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, theme.bgColor1);
      bgGrad.addColorStop(1, theme.bgColor2);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      for (let py = 15; py < H; py += 30) {
        for (let px = (Math.floor(py / 30) % 2) * 15; px < W; px += 30) {
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (trackRef.current) {
        trackRef.current.decorations.forEach((dec) => {
          ctx.save();
          ctx.globalAlpha = 1.0;
          ctx.translate(dec.x, dec.y);
          ctx.rotate((dec.rot || 0) + Math.sin(t * 1.5 + dec.x) * 0.05);
          ctx.font = `${dec.size}px "Noto Color Emoji", "Segoe UI Emoji", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(dec.emoji, 0, 0);
          ctx.restore();
        });

        const pts = trackRef.current.pts;
        const w = trackRef.current.w;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p[0], p[1] + 6) : ctx.lineTo(p[0], p[1] + 6)));
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.lineWidth = w + 16;
        ctx.stroke();

        ctx.beginPath();
        pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
        ctx.strokeStyle = theme.roadBorder;
        ctx.lineWidth = w + 12;
        ctx.stroke();

        ctx.beginPath();
        pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
        ctx.strokeStyle = isCloseToDangerRef.current ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.35)';
        ctx.lineWidth = w + 4;
        ctx.stroke();

        ctx.strokeStyle = theme.roadColor;
        ctx.lineWidth = w;
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
        ctx.strokeStyle = theme.roadDash;
        ctx.lineWidth = 3.5;
        ctx.setLineDash([12, 14]);
        ctx.stroke();
        ctx.restore();

        const startX = pts[0][0];
        ctx.save();
        ctx.fillStyle = '#22c55e';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(startX - 58, START_Y - 16, 116, 32, 16);
        else ctx.rect(startX - 58, START_Y - 16, 116, 32);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 16px "Baloo 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('¡SALIDA!', startX, START_Y + 1);
        ctx.restore();

        const finX = pts[pts.length - 1][0];
        ctx.font = '36px "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏁', finX, FIN_Y - 12);
      }

      if (pathPointsRef.current.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        pathPointsRef.current.forEach((p, idx) =>
          idx === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])
        );
        ctx.lineWidth = 14;
        ctx.strokeStyle = isCloseToDangerRef.current
          ? 'rgba(239, 68, 68, 0.55)'
          : 'rgba(16, 185, 129, 0.45)';
        ctx.stroke();

        ctx.lineWidth = 6.5;
        ctx.strokeStyle = isCloseToDangerRef.current ? '#ef4444' : '#10b981';
        ctx.stroke();
        ctx.restore();
      }

      if (trackRef.current) {
        trackRef.current.it.forEach((item) => {
          if (item.t === 's' && !item.g) {
            ctx.save();
            ctx.font = '22px "Apple Color Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⭐', item.x, item.y + Math.sin(t * 4 + item.x) * 3);
            ctx.restore();
          } else if (item.t === 'shield' && !item.g) {
            ctx.save();
            ctx.font = '24px "Apple Color Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🛡️', item.x, item.y + Math.sin(t * 3) * 3);
            ctx.restore();
          } else if (item.t === 'mystery' && !item.g) {
            ctx.save();
            ctx.font = '26px "Apple Color Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🎁', item.x, item.y + Math.sin(t * 5) * 3);
            ctx.restore();
          } else if (item.t === 'b') {
            ctx.save();
            ctx.font = '26px "Apple Color Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💣', item.x, item.y);
            ctx.restore();
          } else if (item.t === 'm') {
            const [mx, my] = getItemPos(item, t);
            ctx.save();
            ctx.font = '24px "Apple Color Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(theme.movingObstacleEmoji || '🐝', mx, my);
            ctx.restore();
          }
        });
      }

      const curPos =
        playState === 'draw' || playState === 'pause'
          ? lastPointRef.current
          : [trackRef.current?.pts[0][0] || W / 2, START_Y];

      const avatarRadius = 24;

      ctx.save();
      ctx.translate(curPos[0], curPos[1]);

      if (hasShield) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.rotate(t * 3);
        ctx.beginPath();
        ctx.arc(0, 0, avatarRadius + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (isCloseToDangerRef.current) {
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, avatarRadius + 6 + Math.sin(t * 16) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = '16px "Apple Color Emoji", sans-serif';
        ctx.fillText('💦', avatarRadius + 4, -avatarRadius);
        ctx.restore();
      } else {
        ctx.save();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, avatarRadius + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Equipped Vehicle
      const vehObj = VEHICLES.find((v) => v.id === (player.selectedVehicle || 'kart'));
      if (vehObj) {
        ctx.save();
        ctx.font = '32px "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(vehObj.icon, 0, avatarRadius + 8);
        ctx.restore();
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, avatarRadius, 0, Math.PI * 2);
      ctx.clip();

      if (playerImgRef.current) {
        ctx.drawImage(
          playerImgRef.current,
          -avatarRadius,
          -avatarRadius,
          avatarRadius * 2,
          avatarRadius * 2
        );
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-avatarRadius, -avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.font = '28px "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.fallbackEmoji, 0, 2);
      }
      ctx.restore();

      ctx.strokeStyle = player.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, avatarRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Costume Hat / Mask Overlay
      const cosObj = COSTUMES.find((c) => c.id === (player.selectedCostume || 'none'));
      if (cosObj && cosObj.id !== 'none') {
        ctx.font = '22px "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cosObj.icon, 0, -avatarRadius - 2);
      } else if (player.sticker !== 'none') {
        const stk = STICKERS.find((s) => s.id === player.sticker);
        if (stk) {
          ctx.font = '22px "Apple Color Emoji", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(stk.icon, 0, -avatarRadius - 2);
        }
      }

      ctx.restore();

      if (
        controlMode === 'offset' &&
        playState === 'draw' &&
        activeTouchPointRef.current
      ) {
        const [tx, ty] = activeTouchPointRef.current;
        const [ax, ay] = curPos;

        ctx.save();
        ctx.strokeStyle = player.color;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(ax, ay);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(tx, ty, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = player.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      if (playState === 'ready' && trackRef.current) {
        const startP = [trackRef.current.pts[0][0], START_Y];
        const pulse = (t * 1.5) % 1;
        ctx.save();
        ctx.strokeStyle = player.color;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 1 - pulse;
        ctx.beginPath();
        ctx.arc(startP[0], startP[1], 20 + pulse * 40, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.font = '800 18px "Baloo 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = player.color;
        ctx.strokeText(`¡Turno de ${player.name}!`, startP[0], startP[1] - 45);
        ctx.fillText(`¡Turno de ${player.name}!`, startP[0], startP[1] - 45);

        ctx.font = '28px "Apple Color Emoji", sans-serif';
        ctx.fillText('👇', startP[0], startP[1] + 36 + Math.sin(t * 6) * 4);
        ctx.restore();
      }

      if (boomRef.current) {
        const age = t - boomRef.current.time;
        if (age < 1.3) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - age / 1.3);
          ctx.translate(boomRef.current.x, boomRef.current.y - 25 - age * 20);
          ctx.font = '900 32px "Baloo 2", sans-serif';
          ctx.textAlign = 'center';
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#ffffff';
          ctx.fillStyle = '#ef4444';
          ctx.strokeText(boomRef.current.text, 0, 0);
          ctx.fillText(boomRef.current.text, 0, 0);
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
  }, [hasShield, playState, player, theme, controlMode]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-0 m-0 overflow-hidden">
      <div className="absolute top-2 inset-x-0 z-30 flex justify-center">
        <ThemeVocabularyBanner modeKey="classic" />
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
        <div
          className={`inline-block px-4 py-1.5 rounded-full text-xs font-black shadow-lg border transition ${
            isCloseToDangerRef.current
              ? 'bg-rose-600 text-white border-rose-700 animate-bounce'
              : 'bg-white/95 text-slate-800 border-slate-200 backdrop-blur-xs'
          }`}
        >
          {isCloseToDangerRef.current
            ? '⚠️ ¡CUIDADO! ¡Te estás saliendo o acercando a un obstáculo!'
            : hintText}
        </div>
      </div>
    </div>
  );
};
