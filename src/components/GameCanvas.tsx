import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { PlayerConfig, ThemeConfig, PlayerResult, ControlMode, GameModeId, AgeGroup } from '../types/game';
import { GAME_MODES } from '../data/learningData';
import { sounds } from '../audio/soundManager';
import { ClassicTrackGame } from './games/ClassicTrackGame';
import { ArabicCatcherGame } from './games/ArabicCatcherGame';
import { FlemishWhackGame } from './games/FlemishWhackGame';
import { FrenchBubbleGame } from './games/FrenchBubbleGame';
import { MathBridgeGame } from './games/MathBridgeGame';
import { AlphabetMemoryGame } from './games/AlphabetMemoryGame';

interface Props {
  player: PlayerConfig;
  turnIndex: number;
  totalPlayers: number;
  theme: ThemeConfig;
  difficulty: number;
  selectedLevel: number;
  gameMode: GameModeId;
  ageGroup: AgeGroup;
  onFinishTurn: (result: PlayerResult) => void;
  onTriggerChallenge: () => void;
  challengeReward: { stars: number; shield: boolean } | null;
  clearChallengeReward: () => void;
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
  theme,
  difficulty,
  selectedLevel,
  gameMode,
  ageGroup,
  onFinishTurn,
  onTriggerChallenge,
  challengeReward,
  clearChallengeReward,
  onExitGame,
  onToggleFullscreen,
  isFullscreen,
  isMuted,
  onToggleMute,
}) => {
  const [controlMode, setControlMode] = useState<ControlMode>('offset');
  const [starsCollected, setStarsCollected] = useState<number>(0);
  const [wordsLearned, setWordsLearned] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [hasShield, setHasShield] = useState<boolean>(false);

  const currentModeConfig = GAME_MODES.find((m) => m.id === gameMode) || GAME_MODES[0];

  // Handle Win
  const handleWin = (finalScore: number, finalStars: number, wordsCount = 0, path: [number, number][] = []) => {
    sounds.sfxWin();
    confetti({
      particleCount: 150,
      spread: 90,
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
        path,
        gameMode,
        selectedLevel,
      });
    }, 1300);
  };

  // Handle Lose
  const handleLose = (
    why: 'bomb' | 'bee' | 'edge',
    finalScore: number,
    finalStars: number,
    progress: number,
    path: [number, number][] = []
  ) => {
    setTimeout(() => {
      onFinishTurn({
        playerId: player.id,
        playerName: player.name,
        photoUrl: player.photoUrl,
        fallbackEmoji: player.fallbackEmoji,
        color: player.color,
        ok: false,
        time: 12,
        progress,
        stars: finalStars,
        wordsLearned,
        shieldUsed: false,
        challengeBonus: 0,
        pts: finalScore,
        path,
        gameMode,
        selectedLevel,
        why,
      });
    }, 1100);
  };

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-between p-0 m-0 overflow-hidden select-none touch-none bg-slate-950">
      {/* 1. Floating Master HUD */}
      <header className="absolute top-2 sm:top-3 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto max-w-xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-slate-200 z-40">
        {/* Active Player Info */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="w-8 h-8 rounded-full border-2 overflow-hidden flex items-center justify-center shrink-0 shadow-xs bg-white"
            style={{ borderColor: player.color }}
          >
            {player.photoUrl ? (
              <img
                src={player.photoUrl}
                alt={player.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-base">{player.fallbackEmoji}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black truncate text-slate-800 leading-tight">
              {player.name}
            </div>
          </div>
        </div>

        {/* Game Mode Title & Level Badge */}
        <div className="flex items-center gap-1 shrink-0">
          <div
            className="px-2 py-0.5 rounded-full text-[11px] font-black text-white shrink-0 shadow-xs flex items-center gap-1"
            style={{ backgroundColor: currentModeConfig.color }}
          >
            <span>{currentModeConfig.icon}</span>
            <span className="hidden xs:inline">{currentModeConfig.shortTitle}</span>
          </div>

          <div className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white shrink-0 shadow-xs">
            Niv {selectedLevel} 👑
          </div>
        </div>

        {/* Toggle Controls (For track game) */}
        {gameMode === 'classic_bomb' && (
          <button
            onClick={() => {
              sounds.sfxPop();
              setControlMode((prev) => (prev === 'offset' ? 'direct' : 'offset'));
            }}
            className="px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-[11px] border border-amber-300 transition flex items-center gap-1 shadow-xs shrink-0"
            title="Cambiar modo de control táctil"
          >
            <span>{controlMode === 'offset' ? '🎯 Guía' : '👆 Directo'}</span>
          </button>
        )}

        {/* Stars Counter */}
        <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full font-black text-xs border border-amber-200 shrink-0">
          <span>⭐</span>
          <span>{starsCollected}</span>
        </div>

        {/* Words / Challenges Counter (for learning games) */}
        {gameMode !== 'classic_bomb' && (
          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded-full font-black text-xs border border-emerald-200 shrink-0">
            <span>📚</span>
            <span>{wordsLearned}</span>
          </div>
        )}

        {/* Actions (Sound, Fullscreen, Exit) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              sounds.sfxPop();
              onToggleMute();
            }}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition text-xs"
            title="Sonido"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={() => {
              sounds.sfxPop();
              onToggleFullscreen();
            }}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition text-xs"
            title="Pantalla Completa"
          >
            ⛶
          </button>
          <button
            onClick={() => {
              sounds.sfxPop();
              onExitGame();
            }}
            className="w-7 h-7 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold flex items-center justify-center transition text-xs"
            title="Salir al menú"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="absolute top-11 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-1.5 bg-white/40 backdrop-blur-xs rounded-full overflow-hidden shadow-xs z-30 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-pink-500 rounded-full transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 2. Main Game Screen Router (6 distinct games) */}
      <main className="relative w-full h-full flex items-center justify-center p-0 m-0 overflow-hidden">
        {gameMode === 'classic_bomb' && (
          <ClassicTrackGame
            player={player}
            turnIndex={turnIndex}
            theme={theme}
            difficulty={difficulty}
            selectedLevel={selectedLevel}
            gameMode={gameMode}
            ageGroup={ageGroup}
            controlMode={controlMode}
            onWin={(score, stars, path) => handleWin(score, stars, 0, path)}
            onLose={(why, score, stars, progress, path) => handleLose(why, score, stars, progress, path)}
            onTriggerChallenge={onTriggerChallenge}
            challengeReward={challengeReward}
            clearChallengeReward={clearChallengeReward}
            hasShield={hasShield}
            setHasShield={setHasShield}
            starsCollected={starsCollected}
            setStarsCollected={setStarsCollected}
            setProgressPercent={setProgressPercent}
          />
        )}

        {gameMode === 'lang_es_ar' && (
          <ArabicCatcherGame
            player={player}
            difficulty={difficulty}
            selectedLevel={selectedLevel}
            theme={theme}
            ageGroup={ageGroup}
            onWin={(score, stars, words) => handleWin(score, stars, words)}
            onLose={(why, score, stars, progress) => handleLose(why, score, stars, progress)}
            starsCollected={starsCollected}
            setStarsCollected={setStarsCollected}
            wordsLearned={wordsLearned}
            setWordsLearned={setWordsLearned}
            setProgressPercent={setProgressPercent}
          />
        )}

        {gameMode === 'lang_flemish' && (
          <FlemishWhackGame
            player={player}
            difficulty={difficulty}
            selectedLevel={selectedLevel}
            theme={theme}
            ageGroup={ageGroup}
            onWin={(score, stars, words) => handleWin(score, stars, words)}
            onLose={(why, score, stars, progress) => handleLose(why, score, stars, progress)}
            starsCollected={starsCollected}
            setStarsCollected={setStarsCollected}
            wordsLearned={wordsLearned}
            setWordsLearned={setWordsLearned}
            setProgressPercent={setProgressPercent}
          />
        )}

        {gameMode === 'lang_french' && (
          <FrenchBubbleGame
            player={player}
            difficulty={difficulty}
            selectedLevel={selectedLevel}
            theme={theme}
            ageGroup={ageGroup}
            onWin={(score, stars, words) => handleWin(score, stars, words)}
            onLose={(why, score, stars, progress) => handleLose(why, score, stars, progress)}
            starsCollected={starsCollected}
            setStarsCollected={setStarsCollected}
            wordsLearned={wordsLearned}
            setWordsLearned={setWordsLearned}
            setProgressPercent={setProgressPercent}
          />
        )}

        {gameMode === 'math_magic' && (
          <MathBridgeGame
            player={player}
            difficulty={difficulty}
            selectedLevel={selectedLevel}
            theme={theme}
            ageGroup={ageGroup}
            onWin={(score, stars, words) => handleWin(score, stars, words)}
            onLose={(why, score, stars, progress) => handleLose(why, score, stars, progress)}
            starsCollected={starsCollected}
            setStarsCollected={setStarsCollected}
            wordsLearned={wordsLearned}
            setWordsLearned={setWordsLearned}
            setProgressPercent={setProgressPercent}
          />
        )}

        {gameMode === 'alphabet_hunt' && (
          <AlphabetMemoryGame
            player={player}
            difficulty={difficulty}
            selectedLevel={selectedLevel}
            theme={theme}
            ageGroup={ageGroup}
            onWin={(score, stars, words) => handleWin(score, stars, words)}
            onLose={(why, score, stars, progress) => handleLose(why, score, stars, progress)}
            starsCollected={starsCollected}
            setStarsCollected={setStarsCollected}
            wordsLearned={wordsLearned}
            setWordsLearned={setWordsLearned}
            setProgressPercent={setProgressPercent}
          />
        )}
      </main>
    </div>
  );
};
