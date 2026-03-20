import { useState, useEffect, useCallback } from 'react';
import { TicTacToeEngine } from './TicTacToeEngine';
import { TicTacToeAI } from './TicTacToeAI';
import { TicTacToeState, initialTicTacToeState } from './types';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

type GameMode = '1P' | '2P';

export default function TicTacToe() {
  const [mode, setMode] = useState<GameMode>('1P');
  const [engine, setEngine] = useState<TicTacToeEngine>(() => new TicTacToeEngine('1P'));
  const [gameState, setGameState] = useState<TicTacToeState>(initialTicTacToeState);
  const [ai] = useState<TicTacToeAI>(() => new TicTacToeAI('tic-tac-toe', 'O'));
  const [profileManager] = useState<PlayerProfileManager>(() => new PlayerProfileManager('tic-tac-toe'));

  // Metrics for AI
  const [turnStartTime, setTurnStartTime] = useState<number>(Date.now());
  const [mistakes, setMistakes] = useState(0);
  const [movesCount, setMovesCount] = useState(0);

  const resetGame = useCallback(() => {
    const newEngine = new TicTacToeEngine(mode);
    setEngine(newEngine);
    setGameState(newEngine.initialize());
    setTurnStartTime(Date.now());
    setMistakes(0);
    setMovesCount(0);
  }, [mode]);

  useEffect(() => {
    resetGame();
  }, [mode, resetGame]);

  const handleCellClick = useCallback((index: number) => {
    if (gameState.isGameOver || gameState.board[index] !== null) {
      if (!gameState.isGameOver && gameState.board[index] !== null) {
        setMistakes((m) => m + 1);
      }
      return;
    }

    // Human move
    if (gameState.currentPlayer === 'X' || mode === '2P') {
      const newState = engine.update(gameState, index);
      setGameState(newState);
      setMovesCount((c) => c + 1);
      setTurnStartTime(Date.now());

      // If game ends immediately by human move
      if (newState.isGameOver && newState.winner) {
         handleGameEnd(newState);
      }
    }
  }, [gameState, engine, mode, turnStartTime]);

  useEffect(() => {
    // Trigger AI move if it's 1P mode and it's O's turn
    if (mode === '1P' && gameState.currentPlayer === 'O' && !gameState.isGameOver) {
      const timer = setTimeout(() => {
        const aiMove = ai.determineMove(gameState);
        if (aiMove !== -1) {
          const newState = engine.update(gameState, aiMove);
          setGameState(newState);
          setTurnStartTime(Date.now());

          if (newState.isGameOver && newState.winner) {
            handleGameEnd(newState);
          }
        }
      }, 500); // Artificial delay to simulate thinking so UI doesn't stutter instantly
      return () => clearTimeout(timer);
    }
  }, [gameState, mode, engine, ai]);

  const handleGameEnd = (finalState: TicTacToeState) => {
    const isWin = finalState.winner === 'X';
    const isLoss = finalState.winner === 'O';
    
    // Calculate final time/metrics
    const result = engine.evaluateWin(finalState);
    if (result && mode === '1P') {
      // Report to AI
      ai.reportGameEnd(isWin, Date.now() - turnStartTime, mistakes, movesCount);
      // Report to profile manager
      profileManager.recordGameResult(
        isWin ? 'win' : isLoss ? 'loss' : 'draw', 
        result.playTimeMs, 
        ai.getCurrentDifficultyScore().toString()
      );
    }
  };

  const getDifficultyText = () => {
    if (mode === '2P') return 'Local PVP';
    const score = ai.getCurrentDifficultyScore();
    if (score < 4) return `Easy (${score.toFixed(1)})`;
    if (score < 7) return `Medium (${score.toFixed(1)})`;
    return `Hard (${score.toFixed(1)})`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="flex flex-col sm:flex-row justify-between w-full max-w-sm mb-6 items-center">
        <h2 className="text-3xl font-bold tracking-tight">Tic Tac Toe</h2>
        <select 
          className="bg-zinc-800 border bg-transparent border-zinc-700 text-zinc-50 rounded-lg p-2 outline-none mt-2 sm:mt-0"
          value={mode}
          onChange={(e) => setMode(e.target.value as GameMode)}
        >
          <option value="1P">1 Player (vs AI)</option>
          <option value="2P">2 Player (Local)</option>
        </select>
      </div>

      <div className="mb-4 text-zinc-400 text-sm flex gap-4">
        <span>Mode: {getDifficultyText()}</span>
        {mode === '1P' && <span>Profile Wins: {profileManager.getStats().wins}</span>}
      </div>

      <div className="grid grid-cols-3 gap-2 bg-zinc-800 p-2 rounded-xl shadow-lg border border-zinc-700">
        {gameState.board.map((cell, index) => {
          const isWinningCell = gameState.winningLine?.includes(index);
          return (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              className={`w-24 h-24 sm:w-32 sm:h-32 rounded-lg text-5xl font-black flex items-center justify-center transition-all duration-200 
                ${cell === null && !gameState.isGameOver ? 'hover:bg-zinc-700 bg-zinc-900' : 'bg-zinc-900'}
                ${isWinningCell ? 'text-green-500 animate-pulse ring-2 ring-green-500 ring-inset' : cell === 'X' ? 'text-blue-500' : 'text-rose-500'}
                ${gameState.isGameOver && !isWinningCell ? 'opacity-50' : ''}`}
            >
              {cell}
            </button>
          );
        })}
      </div>

      <div className="mt-8 text-center h-12">
        {!gameState.isGameOver ? (
          <p className="text-xl font-medium animate-pulse text-zinc-300">
            {gameState.currentPlayer === 'X' ? 'Player 1 (X) turn' : mode === '1P' ? 'AI (O) thinking...' : 'Player 2 (O) turn'}
          </p>
        ) : (
          <div className="flex flex-col items-center">
             <p className="text-2xl font-bold text-white mb-4">
              {gameState.winner === 'Draw' 
                ? "It's a Draw!" 
                : `${gameState.winner === 'X' ? 'Player 1' : mode === '1P' ? 'AI' : 'Player 2'} Wins!`}
            </p>
            <button 
              onClick={resetGame}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-md transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
