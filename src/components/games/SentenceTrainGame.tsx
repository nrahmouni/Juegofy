import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';
import { PlayerConfig, PracticeLang } from '../../types/game';
import { getPersonalizedPraise } from '../../data/learningData';
import { sounds } from '../../audio/soundManager';

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

interface TrainSentence {
  id: string;
  words: string[];
  target: string;
  spanishMeaning: string;
  level: number;
  lang: string;
  audioLang: string;
}

const SENTENCES_BY_LANG: Record<PracticeLang, TrainSentence[]> = {
  es: [
    { id: 'es_1', level: 1, words: ['El', 'gato', 'come'], target: 'El gato come', spanishMeaning: 'El gato come', lang: 'es', audioLang: 'es-ES' },
    { id: 'es_2', level: 1, words: ['La', 'niña', 'salta'], target: 'La niña salta', spanishMeaning: 'La niña salta', lang: 'es', audioLang: 'es-ES' },
    { id: 'es_3', level: 2, words: ['El', 'perro', 'corre', 'rápido'], target: 'El perro corre rápido', spanishMeaning: 'El perro corre rápido', lang: 'es', audioLang: 'es-ES' },
    { id: 'es_4', level: 2, words: ['Yo', 'quiero', 'un', 'helado'], target: 'Yo quiero un helado', spanishMeaning: 'Yo quiero un helado', lang: 'es', audioLang: 'es-ES' },
    { id: 'es_5', level: 3, words: ['El', 'sol', 'brilla', 'mucho'], target: 'El sol brilla mucho', spanishMeaning: 'El sol brilla mucho', lang: 'es', audioLang: 'es-ES' },
    { id: 'es_6', level: 3, words: ['Mi', 'mamá', 'cocina', 'rico'], target: 'Mi mamá cocina rico', spanishMeaning: 'Mi mamá cocina muy rico', lang: 'es', audioLang: 'es-ES' },
    { id: 'es_7', level: 4, words: ['El', 'cohete', 'vuela', 'al', 'espacio'], target: 'El cohete vuela al espacio', spanishMeaning: 'El cohete vuela al espacio', lang: 'es', audioLang: 'es-ES' },
    { id: 'es_8', level: 5, words: ['Los', 'niños', 'juegan', 'en', 'el', 'parque'], target: 'Los niños juegan en el parque', spanishMeaning: 'Los niños juegan en el parque', lang: 'es', audioLang: 'es-ES' },
    { id: 'es_9', level: 6, words: ['Me', 'gusta', 'aprender', 'palabras', 'nuevas'], target: 'Me gusta aprender palabras nuevas', spanishMeaning: 'Me gusta aprender palabras nuevas', lang: 'es', audioLang: 'es-ES' },
  ],
  fl: [
    { id: 'fl_1', level: 1, words: ['De', 'kat', 'eet'], target: 'De kat eet', spanishMeaning: 'El gato come', lang: 'fl', audioLang: 'nl-BE' },
    { id: 'fl_2', level: 1, words: ['Het', 'kind', 'speelt'], target: 'Het kind speelt', spanishMeaning: 'El niño juega', lang: 'fl', audioLang: 'nl-BE' },
    { id: 'fl_3', level: 2, words: ['De', 'hond', 'rent', 'snel'], target: 'De hond rent snel', spanishMeaning: 'El perro corre rápido', lang: 'fl', audioLang: 'nl-BE' },
    { id: 'fl_4', level: 2, words: ['Ik', 'ben', 'heel', 'blij'], target: 'Ik ben heel blij', spanishMeaning: 'Estoy muy feliz', lang: 'fl', audioLang: 'nl-BE' },
    { id: 'fl_5', level: 3, words: ['De', 'zon', 'schijnt', 'warm'], target: 'De zon schijnt warm', spanishMeaning: 'El sol brilla cálido', lang: 'fl', audioLang: 'nl-BE' },
    { id: 'fl_6', level: 3, words: ['De', 'vogel', 'vliegt', 'hoog'], target: 'De vogel vliegt hoog', spanishMeaning: 'El pájaro vuela alto', lang: 'fl', audioLang: 'nl-BE' },
    { id: 'fl_7', level: 4, words: ['Ik', 'eet', 'een', 'lekkere', 'wafel'], target: 'Ik eet een lekkere wafel', spanishMeaning: 'Como un rico gofre', lang: 'fl', audioLang: 'nl-BE' },
    { id: 'fl_8', level: 5, words: ['Wij', 'spelen', 'samen', 'in', 'het', 'park'], target: 'Wij spelen samen in het park', spanishMeaning: 'Jugamos juntos en el parque', lang: 'fl', audioLang: 'nl-BE' },
  ],
  fr: [
    { id: 'fr_1', level: 1, words: ['Le', 'chat', 'mange'], target: 'Le chat mange', spanishMeaning: 'El gato come', lang: 'fr', audioLang: 'fr-FR' },
    { id: 'fr_2', level: 1, words: ["L'enfant", 'joue', 'bien'], target: "L'enfant joue bien", spanishMeaning: 'El niño juega bien', lang: 'fr', audioLang: 'fr-FR' },
    { id: 'fr_3', level: 2, words: ['Le', 'chien', 'court', 'vite'], target: 'Le chien court vite', spanishMeaning: 'El perro corre rápido', lang: 'fr', audioLang: 'fr-FR' },
    { id: 'fr_4', level: 2, words: ['Je', 'suis', 'très', 'content'], target: 'Je suis très content', spanishMeaning: 'Estoy muy feliz', lang: 'fr', audioLang: 'fr-FR' },
    { id: 'fr_5', level: 3, words: ['Le', 'soleil', 'brille', 'fort'], target: 'Le soleil brille fort', spanishMeaning: 'El sol brilla fuerte', lang: 'fr', audioLang: 'fr-FR' },
    { id: 'fr_6', level: 3, words: ["L'oiseau", 'vole', 'très', 'haut'], target: "L'oiseau vole très haut", spanishMeaning: 'El pájaro vuela muy alto', lang: 'fr', audioLang: 'fr-FR' },
    { id: 'fr_7', level: 4, words: ['Les', 'enfants', 'aiment', 'les', 'glaces'], target: 'Les enfants aiment les glaces', spanishMeaning: 'A los niños les gustan los helados', lang: 'fr', audioLang: 'fr-FR' },
    { id: 'fr_8', level: 5, words: ['Nous', 'jouons', 'tous', 'dans', 'le', 'parc'], target: 'Nous jouons tous dans le parc', spanishMeaning: 'Jugamos todos en el parque', lang: 'fr', audioLang: 'fr-FR' },
  ],
  ar: [
    { id: 'ar_1', level: 1, words: ['القط', 'يأكل', 'السمك'], target: 'القط يأكل السمك', spanishMeaning: 'El gato come pez', lang: 'ar', audioLang: 'ar-SA' },
    { id: 'ar_2', level: 1, words: ['الولد', 'يلعب', 'فرحا'], target: 'الولد يلعب فرحا', spanishMeaning: 'El niño juega alegre', lang: 'ar', audioLang: 'ar-SA' },
    { id: 'ar_3', level: 2, words: ['الكلب', 'يجري', 'بسرعة', 'كبيرة'], target: 'الكلب يجري بسرعة كبيرة', spanishMeaning: 'El perro corre rápido', lang: 'ar', audioLang: 'ar-SA' },
    { id: 'ar_4', level: 2, words: ['أنا', 'سعيد', 'جدا', 'اليوم'], target: 'أنا سعيد جدا اليوم', spanishMeaning: 'Estoy muy feliz hoy', lang: 'ar', audioLang: 'ar-SA' },
    { id: 'ar_5', level: 3, words: ['الشمس', 'تشرق', 'في', 'الصباح'], target: 'الشمس تشرق في الصباح', spanishMeaning: 'El sol brilla en la mañana', lang: 'ar', audioLang: 'ar-SA' },
    { id: 'ar_6', level: 3, words: ['العصفور', 'يطير', 'فوق', 'الشجرة'], target: 'العصفور يطير فوق الشجرة', spanishMeaning: 'El pájaro vuela sobre el árbol', lang: 'ar', audioLang: 'ar-SA' },
    { id: 'ar_7', level: 4, words: ['نحن', 'نحب', 'قراءة', 'القصص', 'الجميلة'], target: 'نحن نحب قراءة القصص الجميلة', spanishMeaning: 'Nos gusta leer historias bonitas', lang: 'ar', audioLang: 'ar-SA' },
  ],
};

const LANG_CONFIG: Record<PracticeLang, { label: string; flag: string }> = {
  es: { label: 'Español', flag: '🇪🇸' },
  fl: { label: 'Flamenco', flag: '🇧🇪' },
  fr: { label: 'Francés', flag: '🇫🇷' },
  ar: { label: 'Árabe', flag: '🇸🇦' },
};

export const SentenceTrainGame: React.FC<Props> = ({
  player,
  practiceLang = 'es',
  selectedLevel,
  onMarkWordLearned,
  onWin,
  setProgressPercent,
  setStarsCollected,
  setWordsLearned,
}) => {
  const [currentLang, setCurrentLang] = useState<PracticeLang>(practiceLang);
  const totalRounds = Math.min(5, 2 + Math.floor(selectedLevel / 2));

  const [roundIdx, setRoundIdx] = useState(0);
  const [currentSentence, setCurrentSentence] = useState<TrainSentence | null>(null);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [praiseBanner, setPraiseBanner] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [highlightSlotIdx, setHighlightSlotIdx] = useState<number | null>(null);
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const [hoveredSlotIdx, setHoveredSlotIdx] = useState<number | null>(null);
  const [shakeError, setShakeError] = useState(false);

  const roundRef = useRef(0);
  const starsRef = useRef(0);
  const wordsRef = useRef(0);
  const usedSentenceIdsRef = useRef<Set<string>>(new Set());

  // Setup a new round
  const setupRound = useCallback(
    (rIdx: number, langToUse: PracticeLang) => {
      const pool = SENTENCES_BY_LANG[langToUse] || SENTENCES_BY_LANG.es;
      const filtered = pool.filter((s) => s.level <= selectedLevel + 1 && !usedSentenceIdsRef.current.has(s.id));
      const poolCandidates = filtered.length > 0 ? filtered : pool;
      const sentence = poolCandidates[Math.floor(Math.random() * poolCandidates.length)] || pool[0];

      usedSentenceIdsRef.current.add(sentence.id);
      roundRef.current = rIdx;
      setRoundIdx(rIdx);
      setCurrentSentence(sentence);
      setSlots(Array(sentence.words.length).fill(null));
      setHighlightSlotIdx(null);
      setIsComplete(false);
      setIsChecking(false);
      setShakeError(false);

      // Shuffle available words
      const shuffled = [...sentence.words].sort(() => Math.random() - 0.5);
      setAvailableWords(shuffled);

      // Play locomotive chug sound and speak prompt cleanly
      sounds.sfxMagic();
      setTimeout(() => {
        void sounds.speakAsync(sentence.target, sentence.audioLang, true);
      }, 350);
    },
    [selectedLevel]
  );

  useEffect(() => {
    setupRound(0, currentLang);
  }, [setupRound, currentLang]);

  // Handle placing a word into a specific wagon slot
  const placeWordInSlot = (word: string, targetIndex: number) => {
    if (!currentSentence || isComplete || isChecking) return;

    sounds.sfxPop();
    sounds.hapticDrop();
    // Speak word on placement for immediate auditory reinforcement
    void sounds.speakAsync(word, currentSentence.audioLang, true);

    const oldWordInSlot = slots[targetIndex];
    const newSlots = [...slots];
    newSlots[targetIndex] = word;
    setSlots(newSlots);

    // Update available words: remove newly placed, add back old replaced word if any
    setAvailableWords((prev) => {
      const idxToRemove = prev.indexOf(word);
      const next = [...prev];
      if (idxToRemove !== -1) {
        next.splice(idxToRemove, 1);
      }
      if (oldWordInSlot) {
        next.push(oldWordInSlot);
      }
      return next;
    });

    // Check if all wagon slots are filled
    if (newSlots.every((s) => s !== null)) {
      verifyTrain(newSlots as string[], currentSentence);
    }
  };

  // Tap word to place in next empty wagon
  const handleWordTap = (word: string) => {
    const firstEmpty = slots.findIndex((s) => s === null);
    if (firstEmpty !== -1) {
      placeWordInSlot(word, firstEmpty);
    }
  };

  // Remove word from wagon slot
  const handleRemoveFromSlot = (index: number) => {
    if (isComplete || isChecking) return;
    const word = slots[index];
    if (!word) return;

    sounds.sfxPop();
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
    setAvailableWords((prev) => [...prev, word]);
  };

  // Reset current round wagons
  const handleResetWagons = () => {
    if (!currentSentence || isComplete || isChecking) return;
    sounds.sfxPop();
    setSlots(Array(currentSentence.words.length).fill(null));
    setAvailableWords([...currentSentence.words].sort(() => Math.random() - 0.5));
  };

  // Verify completed train
  const verifyTrain = async (placedWords: string[], sentence: TrainSentence) => {
    setIsChecking(true);
    const isCorrect = placedWords.every((w, i) => w === sentence.words[i]);

    if (isCorrect) {
      setIsComplete(true);
      sounds.sfxMagic();
      sounds.hapticSuccess();
      confetti({ particleCount: 90, spread: 85, origin: { y: 0.55 } });

      onMarkWordLearned(sentence.id);

      // Light up each wagon sequentially with speech synchronization!
      for (let i = 0; i < placedWords.length; i++) {
        setHighlightSlotIdx(i);
        await sounds.speakAsync(placedWords[i], sentence.audioLang, true);
        await new Promise((r) => setTimeout(r, 220));
      }
      setHighlightSlotIdx(null);

      // Read entire sentence aloud
      await new Promise((r) => setTimeout(r, 150));
      await sounds.speakAsync(sentence.target, sentence.audioLang, true);

      const nextRound = roundRef.current + 1;
      const nextStars = starsRef.current + 5;
      const nextWords = wordsRef.current + 1;
      starsRef.current = nextStars;
      wordsRef.current = nextWords;

      setStarsCollected(nextStars);
      setWordsLearned(nextWords);
      setProgressPercent((nextRound / totalRounds) * 100);

      const isFinal = nextRound >= totalRounds;
      const praise = getPersonalizedPraise(player.name, isFinal);
      setPraiseBanner(praise);

      setTimeout(async () => {
        await sounds.speakPraise(praise);
        setPraiseBanner(null);
        if (isFinal) {
          onWin(1800 + selectedLevel * 250, nextStars, nextWords);
        } else {
          setupRound(nextRound, currentLang);
        }
      }, 700);
    } else {
      // Incorrect order: shake and gentle hint
      sounds.sfxError();
      sounds.hapticError();
      setShakeError(true);
      await sounds.speakAsync('¡Casi! Escucha el orden:', 'es-ES', true);
      await sounds.speakAsync(sentence.target, sentence.audioLang, false);

      setTimeout(() => {
        setShakeError(false);
        setSlots(Array(sentence.words.length).fill(null));
        setAvailableWords([...sentence.words].sort(() => Math.random() - 0.5));
        setIsChecking(false);
      }, 900);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between pt-16 pb-14 px-3 bg-gradient-to-b from-sky-900 via-indigo-950 to-slate-950 relative overflow-hidden select-none">
      {/* Background steam clouds & railway ambiance */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute -top-10 left-10 text-8xl animate-pulse">☁️</div>
        <div className="absolute top-20 right-16 text-7xl animate-pulse delay-700">☁️</div>
        <div className="absolute bottom-24 left-1/3 text-6xl">🌲</div>
        <div className="absolute bottom-24 right-1/4 text-6xl">🌳</div>
      </div>

      {/* Top Bar: Progress and Language Switcher */}
      <div className="w-full max-w-xl flex items-center justify-between gap-2 z-10">
        <div className="flex gap-1.5 items-center bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
          <span className="text-xs font-black text-amber-300 mr-1">Ronda</span>
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                i < roundIdx
                  ? 'bg-emerald-400 scale-100 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : i === roundIdx
                  ? 'bg-amber-400 scale-125 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.9)]'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl backdrop-blur-md border border-white/10">
          {(['es', 'fl', 'fr', 'ar'] as PracticeLang[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                if (currentLang !== l) {
                  sounds.sfxPop();
                  setCurrentLang(l);
                  usedSentenceIdsRef.current.clear();
                }
              }}
              className={`px-2 py-1 rounded-xl text-xs font-black flex items-center gap-1 transition-all ${
                currentLang === l
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{LANG_CONFIG[l].flag}</span>
              <span className="hidden sm:inline">{LANG_CONFIG[l].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Target Sentence Banner */}
      {currentSentence && (
        <div className="w-full max-w-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-0.5 rounded-3xl shadow-2xl z-10">
          <div className="bg-slate-900/95 backdrop-blur-md rounded-[22px] p-4 flex items-center justify-between gap-3 border border-white/15">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-black tracking-wider uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> ¡Arma el Tren de las Frases!
                </span>
                <span className="text-[11px] font-bold text-white/50">{LANG_CONFIG[currentLang].flag} {LANG_CONFIG[currentLang].label}</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white tracking-wide drop-shadow">
                « {currentSentence.target} »
              </div>
              {currentLang !== 'es' && (
                <div className="text-xs text-amber-200/90 font-semibold mt-0.5">
                  Significa: <span className="italic">{currentSentence.spanishMeaning}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                sounds.sfxPop();
                void sounds.speakAsync(currentSentence.target, currentSentence.audioLang, true);
              }}
              className="p-3.5 rounded-2xl bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95 shadow-lg border-b-4 border-amber-600 transition-transform flex items-center justify-center shrink-0"
              title="Escuchar frase"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Personalized Praise Banner */}
      {praiseBanner && (
        <div className="px-6 py-2 rounded-full bg-emerald-400 text-slate-950 font-black text-base shadow-[0_0_20px_rgba(52,211,153,0.9)] animate-bounce z-20 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-900" />
          <span>{praiseBanner}</span>
        </div>
      )}

      {/* THE TRAIN WITH WAGONS AND TRACK */}
      <div className={`w-full max-w-xl flex flex-col items-center z-10 transition-transform ${shakeError ? 'animate-shake' : ''}`}>
        <div className="w-full overflow-x-auto no-scrollbar py-3 px-2 flex items-end justify-center min-h-[140px]">
          <div className="flex items-end gap-1.5 shrink-0">
            {/* Locomotive 🚂 */}
            <div className="flex flex-col items-center mr-1">
              {/* Animated steam puffs */}
              <div className="flex gap-1 mb-0.5">
                <span className="text-xs animate-bounce">💨</span>
                <span className="text-sm animate-pulse delay-100">💨</span>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 via-rose-600 to-red-800 border-b-6 border-red-950 shadow-2xl flex flex-col items-center justify-between p-1.5 relative border-t-2 border-red-300">
                <div className="w-full flex justify-between items-center px-1">
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-300 border border-amber-500 shadow-[0_0_8px_gold]" />
                  <span className="text-[10px] font-black text-white bg-black/40 px-1.5 rounded">#1</span>
                </div>
                <div className="text-3xl filter drop-shadow">🚂</div>
                {/* Locomotive Wheels */}
                <div className="flex gap-1.5 -mb-3 z-10">
                  <div className="w-4 h-4 rounded-full bg-slate-900 border-2 border-amber-400 animate-spin [animation-duration:3s]" />
                  <div className="w-5 h-5 rounded-full bg-slate-900 border-2 border-amber-400 animate-spin [animation-duration:3s]" />
                </div>
              </div>
            </div>

            {/* Coupler chain link */}
            <div className="w-2.5 h-1.5 bg-slate-400 self-center rounded-sm -mx-0.5 mb-2" />

            {/* Train Wagons / Cars 🚃 */}
            {slots.map((word, idx) => {
              const isSlotHighlighted = highlightSlotIdx === idx;
              const isHovered = hoveredSlotIdx === idx;

              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <div className="w-2 h-1 bg-slate-400 self-center rounded-sm -mx-0.5 mb-2" />}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (hoveredSlotIdx !== idx) {
                        setHoveredSlotIdx(idx);
                        sounds.hapticDragSnap();
                      }
                    }}
                    onDragLeave={() => setHoveredSlotIdx(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setHoveredSlotIdx(null);
                      if (draggedWord) {
                        placeWordInSlot(draggedWord, idx);
                        setDraggedWord(null);
                      }
                    }}
                    onClick={() => {
                      if (word) handleRemoveFromSlot(idx);
                    }}
                    className={`group relative min-w-[85px] sm:min-w-[105px] h-20 rounded-2xl border-b-6 p-1.5 flex flex-col justify-between items-center transition-all cursor-pointer ${
                      isSlotHighlighted
                        ? 'bg-amber-300 border-amber-600 scale-110 shadow-[0_0_20px_gold] z-20'
                        : word
                        ? isComplete
                          ? 'bg-emerald-400 border-emerald-700 text-slate-950 shadow-lg'
                          : 'bg-white border-slate-300 text-slate-900 shadow-md hover:scale-105'
                        : isHovered
                        ? 'bg-amber-200/50 border-amber-400 border-dashed scale-105'
                        : 'bg-white/15 border-white/30 border-dashed hover:bg-white/25'
                    }`}
                  >
                    {/* Wagon Cargo Top Badge */}
                    <div className="w-full flex justify-between items-center text-[10px] font-black">
                      <span className={`px-1.5 py-0.2 rounded ${word ? 'bg-black/10 text-slate-700' : 'text-white/60'}`}>
                        Vagón {idx + 1}
                      </span>
                      {word && !isComplete && (
                        <span className="text-red-500 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">✕</span>
                      )}
                    </div>

                    {/* Word text inside wagon */}
                    <div className="w-full flex-1 flex items-center justify-center px-1">
                      {word ? (
                        <span className="font-black text-sm sm:text-base tracking-tight text-center break-words">
                          {word}
                        </span>
                      ) : (
                        <span className="text-xs text-white/40 font-medium">Arrastra aquí</span>
                      )}
                    </div>

                    {/* Wagon Wheels */}
                    <div className="flex justify-between w-full px-2 -mb-3.5 z-10">
                      <div className="w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-300" />
                      <div className="w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-300" />
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Railway Tracks 🛤️ */}
        <div className="w-full flex flex-col items-center -mt-2">
          {/* Steel rails */}
          <div className="w-full h-1 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 shadow-sm" />
          {/* Wooden Sleepers / Ties */}
          <div className="w-full h-2.5 flex justify-between px-1 bg-amber-950/60 overflow-hidden">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="w-1.5 h-full bg-amber-900 border-x border-amber-950 shadow-inner" />
            ))}
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 shadow-sm" />
        </div>
      </div>

      {/* Available Word Cards (Drag & Drop + Tap) */}
      <div className="w-full max-w-xl flex flex-col gap-2 z-10">
        <div className="flex items-center justify-between px-1 text-xs font-bold text-white/70">
          <span>Toca o arrastra las palabras al vagón correcto:</span>
          {slots.some((s) => s !== null) && !isComplete && (
            <button
              onClick={handleResetWagons}
              className="flex items-center gap-1 text-amber-300 hover:text-amber-200 bg-white/10 px-2 py-0.5 rounded-lg active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2.5 min-h-[64px] p-2 bg-black/30 rounded-3xl backdrop-blur-sm border border-white/10">
          {availableWords.map((word, idx) => (
            <button
              key={`${word}-${idx}`}
              draggable={!isComplete && !isChecking}
              onDragStart={() => {
                setDraggedWord(word);
                sounds.hapticDragStart();
              }}
              onDragEnd={() => setDraggedWord(null)}
              onClick={() => handleWordTap(word)}
              className="py-3 px-4 sm:px-5 rounded-2xl bg-gradient-to-b from-white to-slate-100 hover:from-amber-100 hover:to-amber-200 text-slate-900 font-black text-base sm:text-lg shadow-xl border-b-6 border-slate-300 active:border-b-2 active:translate-y-1 active:scale-95 transition-all select-none cursor-grab active:cursor-grabbing hover:shadow-amber-400/20"
            >
              {word}
            </button>
          ))}
          {availableWords.length === 0 && !isComplete && (
            <div className="text-white/60 text-sm font-medium py-2 flex items-center gap-1.5">
              <span>¡Todos los vagones están llenos! Verificando...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
