import React, { useState, useEffect, useCallback } from 'react';
import { PlayerConfig, ThemeId, PlayerResult, GameModeId, AgeGroup, PracticeLang } from './types/game';
import { THEMES, PLAYER_COLORS } from './data/themes';
import { MAX_GAME_LEVEL } from './data/learningData';
import { PlayerSetup } from './components/PlayerSetup';
import { GameCanvas } from './components/GameCanvas';
import { TurnResultModal } from './components/TurnResultModal';
import { PodiumScreen } from './components/PodiumScreen';
import { sounds } from './audio/soundManager';

const STORAGE_KEY = 'mundo_magico_players_v2';
const LEARNED_WORDS_KEY = 'mundo_magico_learned_words_v2';
const MISSED_WORDS_KEY = 'mundo_magico_missed_words_v2';

export default function App() {
  // Active players list (defaults to Faysal and Meriem for instant turn-based play)
  const [players, setPlayers] = useState<PlayerConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    return [
      {
        id: 1,
        name: 'FAYSAL',
        photoUrl: null,
        fallbackEmoji: '🦁',
        sticker: 'crown',
        color: PLAYER_COLORS[0],
        coins: 100,
      },
      {
        id: 2,
        name: 'MERIEM',
        photoUrl: null,
        fallbackEmoji: '🦄',
        sticker: 'star',
        color: PLAYER_COLORS[1],
        coins: 100,
      },
    ];
  });

  // Track learned word IDs so learned words do not repeat unless reset
  const [learnedWordIds, setLearnedWordIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LEARNED_WORDS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Track missed word IDs for Smart Adaptive Learning reinforcement
  const [missedWordIds, setMissedWordIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(MISSED_WORDS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const numPlayers = players.length;

  // Active game mode
  const [gameMode, setGameMode] = useState<GameModeId>('monster_feeder');

  // Age group target (preschool 3-5 vs kids 6-9)
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('preschool');
  const [practiceLang, setPracticeLang] = useState<PracticeLang>(() => {
    try {
      const s = localStorage.getItem('mundo_magico_practice_lang');
      if (s === 'es' || s === 'fl' || s === 'ar' || s === 'fr') return s;
    } catch {}
    return 'es';
  });
  useEffect(() => {
    try {
      localStorage.setItem('mundo_magico_practice_lang', practiceLang);
    } catch {}
  }, [practiceLang]);

  // Save players & smart learning progress to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    } catch {}
  }, [players]);

  useEffect(() => {
    try {
      localStorage.setItem(LEARNED_WORDS_KEY, JSON.stringify(learnedWordIds));
    } catch {}
  }, [learnedWordIds]);

  useEffect(() => {
    try {
      localStorage.setItem(MISSED_WORDS_KEY, JSON.stringify(missedWordIds));
    } catch {}
  }, [missedWordIds]);

  const handleMarkWordLearned = useCallback((wordId: string) => {
    setLearnedWordIds((prev) => (prev.includes(wordId) ? prev : [...prev, wordId]));
    setMissedWordIds((prev) => prev.filter((id) => id !== wordId));
  }, []);

  const handleMarkWordMissed = useCallback((wordId: string) => {
    setMissedWordIds((prev) => (prev.includes(wordId) ? prev : [...prev, wordId]));
  }, []);

  // Theme & Difficulty & 8-Level Campaign
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('candy');
  const [difficulty, setDifficulty] = useState<number>(1);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);

  const handleResetProgress = useCallback(() => {
    setLearnedWordIds([]);
    setMissedWordIds([]);
    setSelectedLevel(1);
    try {
      localStorage.removeItem(LEARNED_WORDS_KEY);
      localStorage.removeItem(MISSED_WORDS_KEY);
    } catch {}
  }, []);

  // Game Flow State
  const [gameState, setGameState] = useState<'SETUP' | 'PLAYING' | 'PODIUM'>('SETUP');
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [turnResults, setTurnResults] = useState<PlayerResult[]>([]);
  const [activeTurnResult, setActiveTurnResult] = useState<PlayerResult | null>(null);

  // Audio & Fullscreen
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

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
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      const doc = document as any;
      setIsFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement));
    };

    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
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

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === result.playerId ? { ...p, coins: (p.coins ?? 100) + earnedCoins } : p
      )
    );

    setActiveTurnResult(updatedResult);
  };

  // Advance to next player or to podium (and advance campaign level up to 8 after all players complete the round)
  const handleNextTurnOrPodium = () => {
    if (!activeTurnResult) return;
    const updated = [...turnResults, activeTurnResult];
    setTurnResults(updated);
    setActiveTurnResult(null);

    if (currentTurn + 1 < numPlayers) {
      setCurrentTurn((prev) => prev + 1);
    } else {
      if (updated.some((r) => r.ok) && selectedLevel < MAX_GAME_LEVEL) {
        setSelectedLevel((prev) => Math.min(MAX_GAME_LEVEL, prev + 1));
      }
      setGameState('PODIUM');
      sounds.stopBGM();
    }
  };

  const handleRetryTurn = () => {
    setActiveTurnResult(null);
  };

  const currentThemeObj = THEMES[selectedTheme];
  const activePlayer = players[currentTurn] || players[0];
  const nextPlayer = players[currentTurn + 1];

  return (
    <div className="relative w-full h-screen h-[100dvh] overflow-hidden font-sans antialiased text-slate-900 p-0">
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center overflow-hidden">
        {/* 1. SETUP SCREEN */}
        {gameState === 'SETUP' && (
          <PlayerSetup
            players={players}
            setPlayers={setPlayers}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            selectedLevel={selectedLevel}
            setSelectedLevel={setSelectedLevel}
            learnedWordIds={learnedWordIds}
            missedWordIds={missedWordIds}
            onResetProgress={handleResetProgress}
            gameMode={gameMode}
            setGameMode={setGameMode}
            ageGroup={ageGroup}
            setAgeGroup={setAgeGroup}
            practiceLang={practiceLang}
            setPracticeLang={setPracticeLang}
            onStartGame={handleStartGame}
            onToggleFullscreen={handleToggleFullscreen}
            isFullscreen={isFullscreen}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            selectedTheme={selectedTheme}
            setSelectedTheme={setSelectedTheme}
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
            practiceLang={practiceLang}
            learnedWordIds={learnedWordIds}
            missedWordIds={missedWordIds}
            onMarkWordLearned={handleMarkWordLearned}
            onMarkWordMissed={handleMarkWordMissed}
            onFinishTurn={handleFinishTurn}
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

        {/* 4. PODIUM SCREEN */}
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
    </div>
  );
}
