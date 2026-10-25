import React, { useState, useEffect, useCallback } from 'react';
import { PlayerConfig, ThemeId, PlayerResult, GameModeId, AgeGroup } from './types/game';
import { THEMES, PLAYER_COLORS, DEFAULT_AVATARS } from './data/themes';
import { PlayerSetup } from './components/PlayerSetup';
import { GameCanvas } from './components/GameCanvas';
import { TurnResultModal } from './components/TurnResultModal';
import { InteractiveChallengeModal } from './components/InteractiveChallengeModal';
import { PodiumScreen } from './components/PodiumScreen';
import { sounds } from './audio/soundManager';

const STORAGE_KEY = 'camino_bombastico_players_v1';

export default function App() {
  // Number of players
  const [numPlayers, setNumPlayers] = useState<number>(2);

  // Active game mode (out of the 6 educational & arcade games)
  const [gameMode, setGameMode] = useState<GameModeId>('classic_bomb');

  // Age group target (preschool 3-5 vs kids 6-8)
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('preschool');

  // Initial Player configs with default cute names
  const [players, setPlayers] = useState<PlayerConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 4) {
          return parsed;
        }
      }
    } catch {}

    const defaultNames = ['Lucas', 'Sofia', 'Mateo', 'Emma'];
    return [0, 1, 2, 3].map((i) => ({
      id: i,
      name: defaultNames[i],
      photoUrl: null,
      fallbackEmoji: DEFAULT_AVATARS[i % DEFAULT_AVATARS.length].emoji,
      sticker: 'none',
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
    }));
  });

  // Save players to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    } catch {}
  }, [players]);

  // Theme & Difficulty & 5-Level Campaign
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('candy');
  const [difficulty, setDifficulty] = useState<number>(1); // Normal by default
  const [selectedLevel, setSelectedLevel] = useState<number>(1); // 1 to 5

  // Game Flow State
  const [gameState, setGameState] = useState<'SETUP' | 'PLAYING' | 'PODIUM'>('SETUP');
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [turnResults, setTurnResults] = useState<PlayerResult[]>([]);
  const [activeTurnResult, setActiveTurnResult] = useState<PlayerResult | null>(null);

  // Interactive Mini Challenge Modal State
  const [isChallengeActive, setIsChallengeActive] = useState<boolean>(false);
  const [challengeReward, setChallengeReward] = useState<{ stars: number; shield: boolean } | null>(null);

  // Audio & Fullscreen
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState<boolean>(true);

  // Fullscreen toggle handler
  const handleToggleFullscreen = useCallback(() => {
    const doc = document as any;
    const docEl = document.documentElement as any;

    const isFull =
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement;

    if (!isFull) {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const onFsChange = () => {
      const doc = document as any;
      setIsFullscreen(
        Boolean(
          doc.fullscreenElement ||
            doc.webkitFullscreenElement ||
            doc.mozFullScreenElement ||
            doc.msFullscreenElement
        )
      );
    };

    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  // Audio Toggles
  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleMusic = () => {
    const music = sounds.toggleMusic();
    setIsMusicEnabled(music);
  };

  // Start Game
  const handleStartGame = () => {
    setCurrentTurn(0);
    setTurnResults([]);
    setActiveTurnResult(null);
    setGameState('PLAYING');
    sounds.startBGM(selectedTheme);
  };

  // When a player finishes their turn
  const handleFinishTurn = (result: PlayerResult) => {
    const earnedCoins = (result.stars || 0) * 10 + (result.wordsLearned || 0) * 15 + 25;
    const updatedResult = { ...result, coinsEarned: earnedCoins };

    // Add coins to active player profile
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === result.playerId ? { ...p, coins: (p.coins ?? 100) + earnedCoins } : p
      )
    );

    setActiveTurnResult(updatedResult);
  };

  // Advance to next player or to podium
  const handleNextTurnOrPodium = () => {
    if (!activeTurnResult) return;
    const updated = [...turnResults, activeTurnResult];
    setTurnResults(updated);
    setActiveTurnResult(null);

    if (currentTurn + 1 < numPlayers) {
      setCurrentTurn((prev) => prev + 1);
    } else {
      setGameState('PODIUM');
      sounds.stopBGM();
    }
  };

  // Retry the current player's turn
  const handleRetryTurn = () => {
    setActiveTurnResult(null);
  };

  // Complete interactive challenge
  const handleChallengeComplete = (bonusStars: number, hasShield: boolean) => {
    setIsChallengeActive(false);
    setChallengeReward({ stars: bonusStars, shield: hasShield });
  };

  const currentThemeObj = THEMES[selectedTheme];
  const activePlayer = players[currentTurn] || players[0];
  const nextPlayer = players[currentTurn + 1];

  return (
    <div
      className={`w-full font-sans antialiased text-slate-800 transition-colors duration-500 ${
        gameState === 'PLAYING'
          ? 'h-screen h-[100dvh] w-screen w-[100dvw] overflow-hidden flex flex-col items-center justify-center p-0 m-0'
          : 'min-h-screen overflow-x-hidden flex flex-col items-center justify-center p-2 sm:p-4'
      }`}
      style={{
        background: `linear-gradient(135deg, ${currentThemeObj.bgColor1}, ${currentThemeObj.bgColor2})`,
      }}
    >
      {/* 1. SETUP SCREEN */}
      {gameState === 'SETUP' && (
        <PlayerSetup
          players={players}
          setPlayers={setPlayers}
          numPlayers={numPlayers}
          setNumPlayers={setNumPlayers}
          selectedTheme={selectedTheme}
          setSelectedTheme={setSelectedTheme}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          selectedLevel={selectedLevel}
          setSelectedLevel={setSelectedLevel}
          gameMode={gameMode}
          setGameMode={setGameMode}
          ageGroup={ageGroup}
          setAgeGroup={setAgeGroup}
          onStartGame={handleStartGame}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isMusicEnabled={isMusicEnabled}
          onToggleMusic={handleToggleMusic}
        />
      )}

      {/* 2. PLAYING CANVAS */}
      {gameState === 'PLAYING' && (
        <GameCanvas
          key={`turn-${currentTurn}-${activePlayer.id}-${gameMode}-lvl${selectedLevel}`}
          player={activePlayer}
          turnIndex={currentTurn}
          totalPlayers={numPlayers}
          theme={currentThemeObj}
          difficulty={difficulty}
          selectedLevel={selectedLevel}
          gameMode={gameMode}
          ageGroup={ageGroup}
          onFinishTurn={handleFinishTurn}
          onTriggerChallenge={() => setIsChallengeActive(true)}
          challengeReward={challengeReward}
          clearChallengeReward={() => setChallengeReward(null)}
          onExitGame={() => {
            sounds.stopBGM();
            setGameState('SETUP');
          }}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 3. TURN RESULT MODAL */}
      {activeTurnResult && (
        <TurnResultModal
          result={activeTurnResult}
          isLastPlayer={currentTurn === numPlayers - 1}
          nextPlayerName={nextPlayer?.name}
          nextPlayerEmoji={nextPlayer?.fallbackEmoji}
          onNext={handleNextTurnOrPodium}
          onRetryTurn={handleRetryTurn}
        />
      )}

      {/* 4. INTERACTIVE CHALLENGE MODAL */}
      {isChallengeActive && (
        <InteractiveChallengeModal
          playerName={activePlayer.name}
          playerPhoto={activePlayer.photoUrl}
          playerEmoji={activePlayer.fallbackEmoji}
          onComplete={handleChallengeComplete}
        />
      )}

      {/* 5. PODIUM SCREEN */}
      {gameState === 'PODIUM' && (
        <PodiumScreen
          results={turnResults}
          onPlayAgainSame={() => {
            setCurrentTurn(0);
            setTurnResults([]);
            setActiveTurnResult(null);
            setGameState('PLAYING');
            sounds.startBGM(selectedTheme);
          }}
          onPlayAgainNew={() => {
            setCurrentTurn(0);
            setTurnResults([]);
            setActiveTurnResult(null);
            setGameState('PLAYING');
            sounds.startBGM(selectedTheme);
          }}
          onGoToMenu={() => {
            setGameState('SETUP');
          }}
        />
      )}
    </div>
  );
}
