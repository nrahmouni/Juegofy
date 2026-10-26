import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerConfig, ThemeConfig, PlayerResult, GameModeId, AgeGroup } from '../types/game';
import {
  GAME_MODES,
  ARABIC_LEARNING_ITEMS,
  FLEMISH_LEARNING_ITEMS,
  FRENCH_LEARNING_ITEMS,
  ALPHABET_LEARNING_ITEMS,
  SPANISH_VOCAB_ITEMS,
  isLikelyFemaleName,
} from '../data/learningData';
import { sounds } from '../audio/soundManager';
import { PuzzleGame } from './games/PuzzleGame';
import { FlemishGardenGame } from './games/FlemishGardenGame';
import { MemoryGame } from './games/MemoryGame';
import { ArabicBubbleGame } from './games/ArabicBubbleGame';
import { FrenchChefGame } from './games/FrenchChefGame';
import { SafariPhotoGame } from './games/SafariPhotoGame';
import { MonsterFeederGame } from './games/MonsterFeederGame';
import { RocketRaceGame } from './games/RocketRaceGame';
import { SlingshotGame } from './games/SlingshotGame';
import { CatcherBasketGame } from './games/CatcherBasketGame';
import { DragMatchGame } from './games/DragMatchGame';
import { SentenceBuilderGame } from './games/SentenceBuilderGame';
import { VehiclePilotGame } from './games/VehiclePilotGame';
import { MagicPuzzleGame } from './games/MagicPuzzleGame';
import { WordDashGame } from './games/WordDashGame';
import { CrazyKitchenGame } from './games/CrazyKitchenGame';
import { FlemishWorldHub } from './games/FlemishWorldHub';
import { X, Volume2, VolumeX, Star, BookOpen, Check } from 'lucide-react';

interface Props {
  player: PlayerConfig;
  turnIndex: number;
  totalPlayers: number;
  theme: ThemeConfig;
  difficulty: number;
  selectedLevel: number;
  gameMode: GameModeId;
  ageGroup: AgeGroup;
  learnedWordIds: string[];
  missedWordIds: string[];
  onMarkWordLearned: (id: string) => void;
  onMarkWordMissed: (id: string) => void;
  onFinishTurn: (result: PlayerResult) => void;
  onExitGame: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameCanvas: React.FC<Props> = ({
  player,
  turnIndex,
  totalPlayers,
  selectedLevel,
  gameMode,
  learnedWordIds,
  missedWordIds,
  onMarkWordLearned,
  onMarkWordMissed,
  onFinishTurn,
  onExitGame,
  isMuted,
  onToggleMute,
}) => {
  const [hasConfirmedReady, setHasConfirmedReady] = useState<boolean>(false);
  const [starsCollected, setStarsCollected] = useState<number>(0);
  const [wordsLearned, setWordsLearned] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const currentMode = GAME_MODES.find((m) => m.id === gameMode) || GAME_MODES[0];
  const preparedWord = isLikelyFemaleName(player.name) ? 'preparada' : 'preparado';
  const levelTypeLabel = selectedLevel >= 6 ? 'Frases Mágicas' : 'Vocabulario';

  // Announce player's turn aloud when the "Are you ready?" screen appears
  useEffect(() => {
    if (!hasConfirmedReady) {
      const timer = setTimeout(() => {
        sounds.sfxPop(1.1);
        sounds.speak(`${player.name}, ¿estás ${preparedWord}?`, 'es-ES');
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [hasConfirmedReady, player.name, preparedWord]);

  const handleWin = (finalScore: number, finalStars: number, wordsCount = 0) => {
    sounds.sfxWin();
    confetti({
      particleCount: 140,
      spread: 95,
      origin: { y: 0.55 },
      colors: ['#ff4f8b', '#ffd23f', '#2ee6a6', '#5db8ff', '#ff9f1c', '#a855f7'],
    });

    setTimeout(() => {
      onFinishTurn({
        playerId: player.id,
        playerName: player.name,
        photoUrl: player.photoUrl,
        fallbackEmoji: player.fallbackEmoji,
        color: player.color,
        ok: true,
        time: 15,
        progress: 1,
        stars: finalStars,
        wordsLearned: wordsCount,
        shieldUsed: false,
        challengeBonus: 0,
        pts: finalScore,
        path: [],
        gameMode,
        selectedLevel,
      });
    }, 850);
  };

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col items-center overflow-hidden touch-none select-none bg-slate-950">
      {/* HUD Header */}
      <header className="fixed top-0 inset-x-0 z-40 p-2.5 sm:p-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 p-1.5 bg-white/95 rounded-full shadow-2xl border-2 border-white/50 backdrop-blur-md pointer-events-auto">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 overflow-hidden flex items-center justify-center bg-white shadow-inner"
            style={{ borderColor: player.color }}
          >
            {player.photoUrl ? (
              <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">{player.fallbackEmoji}</span>
            )}
          </div>
          <div className="pr-3">
            <div className="text-[10px] font-black text-slate-400 leading-none uppercase tracking-tight">
              Turno {turnIndex + 1}/{totalPlayers} · Niv. {selectedLevel}
            </div>
            <div className="text-sm font-black text-slate-800 leading-none uppercase">{player.name}</div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 pointer-events-auto">
          <div className="px-4 py-1.5 bg-white/95 rounded-full shadow-xl border-2 border-white/50 backdrop-blur-md flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
            <span className="text-sm font-black text-slate-800 tabular-nums">{starsCollected}</span>
          </div>
          <div className="px-4 py-1.5 bg-white/95 rounded-full shadow-xl border-2 border-white/50 backdrop-blur-md flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-black text-slate-800 tabular-nums">{wordsLearned}</span>
          </div>
          <div className="px-4 py-1.5 bg-indigo-600 rounded-full shadow-xl border-2 border-indigo-400 text-white font-black text-xs uppercase">
            NIVEL {selectedLevel} · {levelTypeLabel}
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              sounds.sfxPop();
              onToggleMute();
            }}
            className="p-2.5 sm:p-3 bg-white/95 rounded-full shadow-xl border-2 border-white/50 text-slate-600 btn-squishy"
            aria-label="Sonido"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => {
              sounds.sfxPop();
              onExitGame();
            }}
            className="p-2.5 sm:p-3 bg-rose-500 rounded-full shadow-xl border-2 border-rose-400 text-white btn-squishy"
            aria-label="Salir al menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Personalized Turn Ready Screen ("Meriem, ¿estás preparada? -> ¡SÍ!") */}
      {!hasConfirmedReady ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-5 bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 relative z-50">
          <div className="w-full max-w-sm bg-white rounded-[3rem] p-7 sm:p-8 shadow-2xl border-b-[12px] border-slate-200 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3 bg-indigo-50 px-3 py-1 rounded-full">
              {currentMode.icon} {currentMode.title} · Nivel {selectedLevel} ({levelTypeLabel})
            </div>

            <div className="relative mb-5">
              <div
                className="w-28 h-28 rounded-full border-8 overflow-hidden shadow-2xl flex items-center justify-center bg-slate-50 animate-float"
                style={{ borderColor: player.color }}
              >
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">{player.fallbackEmoji}</span>
                )}
              </div>
              <button
                onClick={() => sounds.speak(`${player.name}, ¿estás ${preparedWord}?`, 'es-ES')}
                className="absolute -bottom-1 -right-1 p-2.5 bg-indigo-600 text-white rounded-full shadow-lg btn-squishy"
                aria-label="Repetir voz"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <h2
              className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none mb-2"
              style={{ color: player.color }}
            >
              ¡{player.name}!
            </h2>
            <p className="text-xl font-black text-slate-800 uppercase mb-3">
              ¿Estás {preparedWord}?
            </p>
            <p className="text-xs font-bold text-slate-500 mb-6 px-2">{currentMode.description}</p>

            <button
              onClick={() => {
                sounds.sfxPop(1.3);
                setHasConfirmedReady(true);
              }}
              className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-black text-3xl shadow-xl border-b-8 border-emerald-800 flex items-center justify-center gap-3 btn-squishy"
            >
              <Check className="w-9 h-9 stroke-[3.5]" />
              <span>¡SÍ!</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Mini-Game Viewport */
        <main className="w-full h-full">
          {gameMode === 'monster_feeder' && (
            <MonsterFeederGame
              player={player}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
            />
          )}
          {gameMode === 'rocket_race' && (
            <RocketRaceGame
              player={player}
              items={SPANISH_VOCAB_ITEMS}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
            />
          )}
          {gameMode === 'lang_spanish_abc' && (
            <PuzzleGame
              player={player}
              items={ALPHABET_LEARNING_ITEMS}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
              title="Tren de Letras y Frases"
              instruction="¡Ordena en el tren!"
              gameColor="#f43f5e"
            />
          )}
          {gameMode === 'lang_flemish' && (
            <FlemishGardenGame
              player={player}
              items={FLEMISH_LEARNING_ITEMS}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
            />
          )}
          {gameMode === 'lang_spanish_words' && (
            <MemoryGame
              player={player}
              items={SPANISH_VOCAB_ITEMS}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
              title="Cofres del Tesoro"
              instruction="¡Encuentra las parejas!"
              gameColor="#8b5cf6"
            />
          )}
          {gameMode === 'lang_arabic' && (
            <ArabicBubbleGame
              player={player}
              items={ARABIC_LEARNING_ITEMS}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
            />
          )}
          {gameMode === 'lang_french' && (
            <FrenchChefGame
              player={player}
              items={FRENCH_LEARNING_ITEMS}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
            />
          )}
          {gameMode === 'safari_adventure' && (
            <SafariPhotoGame
              player={player}
              items={SPANISH_VOCAB_ITEMS}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
            />
          )}
          {gameMode === 'slingshot_magic' && (
            <SlingshotGame
              player={player}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
            />
          )}
          {gameMode === 'crazy_catcher' && (
            <CatcherBasketGame
              player={player}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
            />
          )}
          {gameMode === 'drag_match' && (
            <DragMatchGame
              player={player}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
            />
          )}
          {gameMode === 'sentence_builder' && (
            <SentenceBuilderGame
              player={player}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
            />
          )}
          {gameMode === 'vehicle_pilot' && (
            <VehiclePilotGame
              player={player}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
            />
          )}
          {gameMode === 'magic_puzzle' && (
            <MagicPuzzleGame
              player={player}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
            />
          )}

          {gameMode === 'word_dash' && (
            <WordDashGame
              player={player}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
            />
          )}

          {gameMode === 'crazy_kitchen' && (
            <CrazyKitchenGame
              player={player}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
            />
          )}

          {gameMode === 'flemish_world' && (
            <FlemishWorldHub
              player={player}
              selectedLevel={selectedLevel}
              learnedWordIds={learnedWordIds}
              missedWordIds={missedWordIds}
              onMarkWordLearned={onMarkWordLearned}
              onMarkWordMissed={onMarkWordMissed}
              onWin={handleWin}
              setProgressPercent={setProgressPercent}
              starsCollected={starsCollected}
              setStarsCollected={setStarsCollected}
              wordsLearned={wordsLearned}
              setWordsLearned={setWordsLearned}
            />
          )}
        </main>
      )}

      {/* Mobile Footer Progress Bar */}
      <footer className="fixed bottom-3 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <div className="flex items-center gap-3.5 px-5 py-2 bg-white/95 rounded-full shadow-2xl border-2 border-white/50 backdrop-blur-md pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
            <span className="text-base font-black text-slate-800 tabular-nums">{starsCollected}</span>
          </div>
          <div className="w-px h-5 bg-slate-200" />
          <div className="w-32 sm:w-48 h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%`, backgroundColor: currentMode.color }}
            />
          </div>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-5 h-5 text-emerald-500" />
            <span className="text-base font-black text-slate-800 tabular-nums">{wordsLearned}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
