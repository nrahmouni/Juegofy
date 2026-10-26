import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, ArrowLeft, HelpCircle, Sparkles } from 'lucide-react';
import { PlayerConfig } from '../../types/game';
import {
  LearningItem,
  FLEMISH_LEARNING_ITEMS,
  selectAdaptiveItems,
  getPersonalizedPraise,
} from '../../data/learningData';
import { sounds } from '../../audio/soundManager';
import { TutorialHint } from '../common/TutorialHint';
import { MascotBuddy } from '../common/MascotBuddy';

interface Props {
  player: PlayerConfig;
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

type ActivityId = 'hub' | 'canal' | 'wafel' | 'molen' | 'ballon';

const POOL = FLEMISH_LEARNING_ITEMS;

function articleOf(item: LearningItem): 'de' | 'het' {
  const t = (item.targetText || item.audioText || '').toLowerCase();
  if (t.startsWith('het ')) return 'het';
  return 'de';
}

function nounOnly(item: LearningItem): string {
  return (item.targetText || item.audioText || '')
    .replace(/^(de|het)\s+/i, '')
    .trim();
}

/**
 * Special Flemish learning window — Belgium-themed hub + 4 innovative mini-games:
 * 1) Kanaalboten — de/het (the hard part of Dutch/Flemish for kids)
 * 2) Wafelwinkel — order sequence in Flemish
 * 3) Molen — spin the windmill, match sound to emoji
 * 4) Ballonnen — pop the spoken word
 */
export const FlemishWorldHub: React.FC<Props> = (props) => {
  const [activity, setActivity] = useState<ActivityId>('hub');
  const [hubStars, setHubStars] = useState(0);
  const [doneCount, setDoneCount] = useState(0);

  const goHub = () => setActivity('hub');

  const onActivityWin = (score: number, stars: number, words: number) => {
    setHubStars((s) => s + stars);
    setDoneCount((c) => c + 1);
    props.setStarsCollected((s) => s + stars);
    props.setWordsLearned((w) => w + words);
    props.setProgressPercent(Math.min(100, ((doneCount + 1) / 4) * 100));
    setActivity('hub');
    if (doneCount + 1 >= 3) {
      // finish turn after 3 different activities
      void (async () => {
        const praise = getPersonalizedPraise(props.player.name, true);
        await sounds.speakPraise(praise);
        props.onWin(2000 + score, hubStars + stars, words);
      })();
    }
  };

  if (activity === 'canal') {
    return <CanalGame {...props} onBack={goHub} onActivityWin={onActivityWin} />;
  }
  if (activity === 'wafel') {
    return <WafelGame {...props} onBack={goHub} onActivityWin={onActivityWin} />;
  }
  if (activity === 'molen') {
    return <MolenGame {...props} onBack={goHub} onActivityWin={onActivityWin} />;
  }
  if (activity === 'ballon') {
    return <BallonGame {...props} onBack={goHub} onActivityWin={onActivityWin} />;
  }

  const cards: { id: ActivityId; emoji: string; title: string; sub: string; color: string }[] = [
    { id: 'canal', emoji: '⛵', title: 'Kanaalboten', sub: '¿De of het?', color: '#0ea5e9' },
    { id: 'wafel', emoji: '🧇', title: 'Wafelwinkel', sub: 'Pedido en orden', color: '#f59e0b' },
    { id: 'molen', emoji: '🌬️', title: 'Molen Draai', sub: 'Escucha y elige', color: '#84cc16' },
    { id: 'ballon', emoji: '🎈', title: 'Ballonnen', sub: '¡Explota la buena!', color: '#ec4899' },
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-gradient-to-b from-yellow-300 via-amber-100 to-red-200 relative">
      {/* Belgian stripe accent */}
      <div className="absolute top-0 left-0 right-0 h-2 flex">
        <div className="flex-1 bg-black" />
        <div className="flex-1 bg-yellow-400" />
        <div className="flex-1 bg-red-600" />
      </div>

      <div className="pt-4 px-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MascotBuddy mood="cheer" size="sm" />
          <div>
            <div className="text-[10px] font-black uppercase text-red-700">Vlaanderen</div>
            <div className="text-lg font-black text-slate-900 leading-tight">Mundo Flamenco 🇧🇪</div>
          </div>
        </div>
        <div className="bg-white/90 rounded-2xl px-3 py-1.5 font-black text-sm shadow">
          ⭐ {hubStars + props.starsCollected}
        </div>
      </div>

      <p className="text-center text-xs font-bold text-slate-700 px-4 mt-2">
        ¡Elige una aventura! Aprende palabras flamencas jugando.
      </p>

      <div className="flex-1 grid grid-cols-2 gap-3 p-3 content-center max-w-lg mx-auto w-full">
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              sounds.sfxPop();
              void sounds.speakAsync(c.title, 'nl-BE', true);
              setActivity(c.id);
            }}
            className="rounded-[1.75rem] p-4 text-left border-b-8 border-black/20 shadow-xl btn-squishy relative overflow-hidden min-h-[120px]"
            style={{ background: `linear-gradient(145deg, ${c.color}, ${c.color}cc 60%, #1e293b)` }}
          >
            <div className="text-4xl mb-2">{c.emoji}</div>
            <div className="text-base font-black text-white">{c.title}</div>
            <div className="text-[11px] font-bold text-white/90">{c.sub}</div>
          </button>
        ))}
      </div>

      <div className="text-center text-[10px] font-bold text-slate-600 pb-3">
        Completa 3 aventuras para ganar la ronda · {doneCount}/3
      </div>
    </div>
  );
};

/* ───────── shared activity props ───────── */
type ActProps = Props & {
  onBack: () => void;
  onActivityWin: (score: number, stars: number, words: number) => void;
};

/* ───────── 1) CANAL: de / het ───────── */
const CanalGame: React.FC<ActProps> = ({
  player,
  selectedLevel,
  learnedWordIds,
  missedWordIds = [],
  onMarkWordLearned,
  onMarkWordMissed,
  onBack,
  onActivityWin,
  setProgressPercent,
}) => {
  const total = 5;
  const [idx, setIdx] = useState(0);
  const [item, setItem] = useState<LearningItem | null>(null);
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null);
  const used = useRef<Set<string>>(new Set());
  const stars = useRef(0);
  const words = useRef(0);

  const next = useCallback(
    (i: number) => {
      setFeedback(null);
      const avail = POOL.filter((x) => !used.current.has(x.id));
      const picked = selectAdaptiveItems(
        avail.length ? avail : POOL,
        selectedLevel,
        learnedWordIds,
        missedWordIds,
        1
      )[0];
      if (!picked) return;
      used.current.add(picked.id);
      setItem(picked);
      setIdx(i);
      void (async () => {
        await new Promise((r) => setTimeout(r, 150));
        await sounds.speakAsync(picked.audioText, 'nl-BE', true);
      })();
    },
    [selectedLevel, learnedWordIds, missedWordIds]
  );

  useEffect(() => {
    next(0);
  }, [next]);

  const choose = async (art: 'de' | 'het') => {
    if (!item || feedback) return;
    const correct = articleOf(item);
    if (art === correct) {
      setFeedback('ok');
      sounds.sfxMagic();
      onMarkWordLearned(item.id);
      stars.current += 2;
      words.current += 1;
      confetti({ particleCount: 40, spread: 55, origin: { y: 0.6 } });
      await sounds.speakPraise(getPersonalizedPraise(player.name, false));
      const n = idx + 1;
      setProgressPercent((n / total) * 100);
      if (n >= total) {
        onActivityWin(800, stars.current, words.current);
      } else {
        next(n);
      }
    } else {
      setFeedback('bad');
      sounds.sfxError();
      if (onMarkWordMissed) onMarkWordMissed(item.id);
      await sounds.speakAsync(`Nee… ${item.audioText}`, 'nl-BE', true);
      setFeedback(null);
    }
  };

  if (!item) return null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-sky-300 to-blue-600 p-3 overflow-hidden">
      <Header title="Kanaalboten" onBack={onBack} onSpeak={() => void sounds.speakAsync(item.audioText, 'nl-BE', true)} />
      <div className="text-center text-white font-black text-sm mb-2">
        {idx + 1}/{total} · ¿Va con <span className="text-yellow-300">de</span> o <span className="text-yellow-300">het</span>?
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className={`bg-white rounded-3xl p-6 shadow-2xl border-b-8 ${feedback === 'ok' ? 'border-emerald-500' : feedback === 'bad' ? 'border-rose-500' : 'border-slate-300'}`}>
          <div className="text-6xl text-center">{item.emoji}</div>
          <div className="text-xl font-black text-center mt-2 text-slate-800">{nounOnly(item)}</div>
          <div className="text-xs font-bold text-center text-slate-500 mt-1">{item.es}</div>
        </div>
        <div className="flex gap-4 w-full max-w-sm">
          <button
            type="button"
            onClick={() => void choose('de')}
            className="flex-1 py-5 rounded-3xl bg-amber-400 text-slate-900 font-black text-2xl border-b-8 border-amber-700 btn-squishy shadow-xl"
          >
            de ⛵
          </button>
          <button
            type="button"
            onClick={() => void choose('het')}
            className="flex-1 py-5 rounded-3xl bg-cyan-300 text-slate-900 font-black text-2xl border-b-8 border-cyan-700 btn-squishy shadow-xl"
          >
            het 🚤
          </button>
        </div>
        <TutorialHint text="En flamenco cada palabra usa de o het" gesture="tap" show={idx === 0} />
      </div>
    </div>
  );
};

/* ───────── 2) WAFEL: sequence order ───────── */
const WafelGame: React.FC<ActProps> = ({
  player,
  selectedLevel,
  learnedWordIds,
  missedWordIds = [],
  onMarkWordLearned,
  onMarkWordMissed,
  onBack,
  onActivityWin,
  setProgressPercent,
}) => {
  const stepsN = Math.min(4, 2 + Math.floor(selectedLevel / 3));
  const [order, setOrder] = useState<LearningItem[]>([]);
  const [tray, setTray] = useState<LearningItem[]>([]);
  const [step, setStep] = useState(0);
  const [round, setRound] = useState(0);
  const totalRounds = 3;
  const stars = useRef(0);
  const words = useRef(0);
  const used = useRef<Set<string>>(new Set());

  const setup = useCallback(
    (r: number) => {
      const picks: LearningItem[] = [];
      for (let i = 0; i < stepsN; i++) {
        const p = selectAdaptiveItems(
          POOL.filter((x) => !picks.find((y) => y.id === x.id) && !used.current.has(x.id)),
          selectedLevel,
          learnedWordIds,
          missedWordIds,
          1
        )[0] || POOL[Math.floor(Math.random() * POOL.length)];
        picks.push(p);
        used.current.add(p.id);
      }
      const extra = POOL.filter((x) => !picks.find((p) => p.id === x.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
      setOrder(picks);
      setTray([...picks, ...extra].sort(() => Math.random() - 0.5));
      setStep(0);
      setRound(r);
      const line = picks.map((p) => p.audioText).join(', dan ');
      void sounds.speakAsync(`Bestelling! ${line}`, 'nl-BE', true);
    },
    [selectedLevel, learnedWordIds, missedWordIds, stepsN]
  );

  useEffect(() => {
    setup(0);
  }, [setup]);

  const tap = async (item: LearningItem) => {
    const need = order[step];
    if (!need) return;
    if (item.id === need.id) {
      sounds.sfxPop(1.1);
      onMarkWordLearned(item.id);
      setTray((t) => t.filter((x) => x.id !== item.id));
      const ns = step + 1;
      setStep(ns);
      await sounds.speakAsync(item.audioText, 'nl-BE', true);
      if (ns >= order.length) {
        stars.current += 3;
        words.current += order.length;
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.55 } });
        const nr = round + 1;
        setProgressPercent((nr / totalRounds) * 100);
        if (nr >= totalRounds) {
          await sounds.speakPraise(getPersonalizedPraise(player.name, true));
          onActivityWin(900, stars.current, words.current);
        } else {
          setup(nr);
        }
      }
    } else {
      sounds.sfxError();
      if (onMarkWordMissed) onMarkWordMissed(need.id);
      await sounds.speakAsync(`Eerst ${need.audioText}`, 'nl-BE', true);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-amber-200 to-orange-400 p-3 overflow-hidden">
      <Header title="Wafelwinkel" onBack={onBack} onSpeak={() => order[step] && void sounds.speakAsync(order[step].audioText, 'nl-BE', true)} />
      <div className="bg-white/95 rounded-2xl p-3 shadow-lg mb-2">
        <div className="text-[10px] font-black text-amber-600 uppercase">Bestelling {round + 1}/{totalRounds}</div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {order.map((o, i) => (
            <span
              key={o.id}
              className={`px-2 py-1 rounded-xl text-xs font-black ${
                i < step ? 'bg-emerald-200' : i === step ? 'bg-yellow-300 ring-2 ring-amber-500' : 'bg-slate-100'
              }`}
            >
              {o.emoji} {o.targetText}
            </span>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-7xl">🧇</div>
      </div>
      <div className="flex flex-wrap justify-center gap-2 pb-2">
        {tray.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => void tap(item)}
            className="w-[76px] h-[76px] rounded-2xl bg-white shadow-lg border-b-4 border-amber-600 flex flex-col items-center justify-center btn-squishy"
          >
            <span className="text-3xl">{item.emoji}</span>
            <span className="text-[9px] font-black">{item.targetText}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ───────── 3) MOLEN: listen & pick ───────── */
const MolenGame: React.FC<ActProps> = ({
  player,
  selectedLevel,
  learnedWordIds,
  missedWordIds = [],
  onMarkWordLearned,
  onMarkWordMissed,
  onBack,
  onActivityWin,
  setProgressPercent,
}) => {
  const total = 5;
  const [idx, setIdx] = useState(0);
  const [target, setTarget] = useState<LearningItem | null>(null);
  const [opts, setOpts] = useState<LearningItem[]>([]);
  const [spin, setSpin] = useState(false);
  const stars = useRef(0);
  const words = useRef(0);
  const used = useRef<Set<string>>(new Set());

  const next = useCallback(
    (i: number) => {
      const avail = POOL.filter((x) => !used.current.has(x.id));
      const picked = selectAdaptiveItems(
        avail.length ? avail : POOL,
        selectedLevel,
        learnedWordIds,
        missedWordIds,
        1
      )[0];
      if (!picked) return;
      used.current.add(picked.id);
      const others = POOL.filter((x) => x.id !== picked.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      setTarget(picked);
      setOpts([picked, ...others].sort(() => Math.random() - 0.5));
      setIdx(i);
      setSpin(true);
      setTimeout(() => setSpin(false), 700);
      void sounds.speakAsync(picked.audioText, 'nl-BE', true);
    },
    [selectedLevel, learnedWordIds, missedWordIds]
  );

  useEffect(() => {
    next(0);
  }, [next]);

  const pick = async (item: LearningItem) => {
    if (!target) return;
    if (item.id === target.id) {
      sounds.sfxMagic();
      onMarkWordLearned(item.id);
      stars.current += 2;
      words.current += 1;
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.55 } });
      const n = idx + 1;
      setProgressPercent((n / total) * 100);
      if (n >= total) {
        await sounds.speakPraise(getPersonalizedPraise(player.name, true));
        onActivityWin(850, stars.current, words.current);
      } else next(n);
    } else {
      sounds.sfxError();
      if (onMarkWordMissed) onMarkWordMissed(target.id);
      await sounds.speakAsync(item.audioText, 'nl-BE', true);
    }
  };

  if (!target) return null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-lime-200 to-emerald-500 p-3 overflow-hidden">
      <Header title="Molen Draai" onBack={onBack} onSpeak={() => void sounds.speakAsync(target.audioText, 'nl-BE', true)} />
      <div className="flex justify-center my-2">
        <div className={`text-7xl ${spin ? 'animate-spin' : 'animate-float'}`}>🌬️</div>
      </div>
      <div className="text-center text-white font-black mb-2">
        Escucha y toca · {idx + 1}/{total}
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1 content-center max-w-md mx-auto w-full">
        {opts.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => void pick(o)}
            className="bg-white rounded-3xl p-4 shadow-xl border-b-6 border-emerald-700 btn-squishy flex flex-col items-center"
          >
            <span className="text-4xl">{o.emoji}</span>
            <span className="text-xs font-black mt-1 text-slate-700">{o.es}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ───────── 4) BALLON: pop correct ───────── */
const BallonGame: React.FC<ActProps> = ({
  player,
  selectedLevel,
  learnedWordIds,
  missedWordIds = [],
  onMarkWordLearned,
  onMarkWordMissed,
  onBack,
  onActivityWin,
  setProgressPercent,
}) => {
  const total = 5;
  const [idx, setIdx] = useState(0);
  const [target, setTarget] = useState<LearningItem | null>(null);
  const [balloons, setBalloons] = useState<LearningItem[]>([]);
  const stars = useRef(0);
  const words = useRef(0);
  const used = useRef<Set<string>>(new Set());

  const next = useCallback(
    (i: number) => {
      const avail = POOL.filter((x) => !used.current.has(x.id));
      const picked = selectAdaptiveItems(
        avail.length ? avail : POOL,
        selectedLevel,
        learnedWordIds,
        missedWordIds,
        1
      )[0];
      if (!picked) return;
      used.current.add(picked.id);
      const others = POOL.filter((x) => x.id !== picked.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);
      setTarget(picked);
      setBalloons([picked, ...others].sort(() => Math.random() - 0.5));
      setIdx(i);
      void sounds.speakAsync(picked.audioText, 'nl-BE', true);
    },
    [selectedLevel, learnedWordIds, missedWordIds]
  );

  useEffect(() => {
    next(0);
  }, [next]);

  const pop = async (item: LearningItem) => {
    if (!target) return;
    if (item.id === target.id) {
      sounds.sfxMagic();
      onMarkWordLearned(item.id);
      stars.current += 2;
      words.current += 1;
      confetti({ particleCount: 45, spread: 70, origin: { y: 0.5 } });
      const n = idx + 1;
      setProgressPercent((n / total) * 100);
      if (n >= total) {
        await sounds.speakPraise(getPersonalizedPraise(player.name, true));
        onActivityWin(800, stars.current, words.current);
      } else next(n);
    } else {
      sounds.sfxError();
      if (onMarkWordMissed) onMarkWordMissed(target.id);
      await sounds.speakAsync(`Nee, ${item.audioText}`, 'nl-BE', true);
    }
  };

  if (!target) return null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-pink-200 to-fuchsia-500 p-3 overflow-hidden">
      <Header title="Ballonnen" onBack={onBack} onSpeak={() => void sounds.speakAsync(target.audioText, 'nl-BE', true)} />
      <div className="text-center text-white font-black text-sm mb-2">
        ¡Explota {target.emoji}! · {idx + 1}/{total}
      </div>
      <div className="flex-1 flex flex-wrap content-center justify-center gap-3">
        {balloons.map((b, i) => (
          <button
            key={b.id}
            type="button"
            onClick={() => void pop(b)}
            className="w-24 h-28 rounded-[2rem] bg-white/95 shadow-xl border-b-6 border-fuchsia-700 btn-squishy flex flex-col items-center justify-center animate-float"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <span className="text-2xl">🎈</span>
            <span className="text-3xl">{b.emoji}</span>
            <span className="text-[10px] font-black">{b.targetText}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

function Header({
  title,
  onBack,
  onSpeak,
}: {
  title: string;
  onBack: () => void;
  onSpeak: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-1">
      <button
        type="button"
        onClick={onBack}
        className="p-2.5 rounded-2xl bg-white/90 shadow border-b-4 border-slate-300 btn-squishy"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="font-black text-white text-sm drop-shadow">{title}</div>
      <button
        type="button"
        onClick={onSpeak}
        className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow border-b-4 border-indigo-900 btn-squishy"
      >
        <Volume2 className="w-5 h-5" />
      </button>
    </div>
  );
}
