import { useState, useEffect, useCallback } from 'react';
import { ConnectFourEngine } from './ConnectFourEngine';
import { ConnectFourAI } from './ConnectFourAI';
import { ConnectFourState, initialConnectFourState, ROWS, COLS } from './types';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';
import { formatMinutes } from '../../../utils/timeFormat';

type GameMode = '1P' | '2P';

export default function ConnectFour() {
  const [mode, setMode] = useState<GameMode>('1P');
  const [engine, setEngine] = useState<ConnectFourEngine>(() => new ConnectFourEngine('1P'));
  const [gameState, setGameState] = useState<ConnectFourState>(initialConnectFourState);
  const [ai] = useState<ConnectFourAI>(() => new ConnectFourAI('connect-four', 'Yellow'));
  const [profileManager] = useState<PlayerProfileManager>(() => new PlayerProfileManager('connect-four'));

  // Metrics for AI
  const [turnStartTime, setTurnStartTime] = useState<number>(Date.now());
  const [mistakes, setMistakes] = useState(0); // For connect four, maybe clicking full col
  const [movesCount, setMovesCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (gameState.isGameOver) return;
    const interval = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.isGameOver]);

  const resetGame = useCallback(() => {
    const newEngine = new ConnectFourEngine(mode);
    setEngine(newEngine);
    setGameState(newEngine.initialize());
    setTurnStartTime(Date.now());
    setMistakes(0);
    setMovesCount(0);
    setElapsedSeconds(0);
  }, [mode]);

  useEffect(() => {
    resetGame();
  }, [mode, resetGame]);

  const handleColClick = useCallback((colIndex: number) => {
    if (gameState.isGameOver) return;
    if (gameState.board[0][colIndex] !== null) {
      if (!gameState.isGameOver) setMistakes((m) => m + 1); // Full column clicked
      return; 
    }

    // Human move
    if (gameState.currentPlayer === 'Red' || mode === '2P') {
      const newState = engine.update(gameState, colIndex);
      setGameState(newState);
      setMovesCount((c) => c + 1);
      setTurnStartTime(Date.now());

      if (newState.isGameOver && newState.winner) {
        handleGameEnd(newState);
      }
    }
  }, [gameState, engine, mode, turnStartTime]);

  // AI Turn effect
  useEffect(() => {
    if (mode === '1P' && gameState.currentPlayer === 'Yellow' && !gameState.isGameOver) {
      // Small timeout to allow render and simulate simple thinking
      const timer = setTimeout(() => {
        // Warning: ConnectFour minimax can be slow. Using WebWorkers is optimal.
        // For Phase 1 we run it on main thread since maxDepth is 6.
        const aiMove = ai.determineMove(gameState);
        if (aiMove !== -1) {
          const newState = engine.update(gameState, aiMove);
          setGameState(newState);
          setTurnStartTime(Date.now());
          
          if (newState.isGameOver && newState.winner) {
            handleGameEnd(newState);
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [gameState, mode, engine, ai]);

  const handleGameEnd = (finalState: ConnectFourState) => {
    const isWin = finalState.winner === 'Red';
    const isLoss = finalState.winner === 'Yellow';
    
    const result = engine.evaluateWin(finalState);
    if (result && mode === '1P') {
      ai.reportGameEnd(isWin, Date.now() - turnStartTime, mistakes, movesCount);
      const safePlayTimeMs = Math.floor(elapsedSeconds * 1000) || 0;
      profileManager.recordGameResult(
        isWin ? 'win' : isLoss ? 'loss' : 'draw', 
        safePlayTimeMs, 
        ai.getCurrentDifficultyScore().toString()
      );
    }
  };

  const isWinningCell = (r: number, c: number) => {
    return gameState.winningCells?.some(cell => cell.r === r && cell.c === c) ?? false;
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
      <div className="flex flex-col sm:flex-row justify-between w-full max-w-2xl mb-6 items-center">
        <h2 className="text-3xl font-bold tracking-tight">Connect Four</h2>
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
        <span>Time: {formatMinutes(elapsedSeconds)}</span>
        {mode === '1P' && <span>Profile Wins: {profileManager.getStats().wins}</span>}
      </div>

      <div className="bg-blue-800 p-4 rounded-2xl shadow-2xl relative">
        <div className="flex gap-2">
            {/* Clickable Columns */}
            {Array.from({ length: COLS }).map((_, colIndex) => (
              <div 
                key={`col-${colIndex}`} 
                onClick={() => handleColClick(colIndex)}
                className={`flex flex-col gap-2 group outline-none ${!gameState.isGameOver ? 'cursor-pointer' : ''}`}
              >
                {/* Visual hover indicator */}
                 <div className={`h-4 w-full rounded-t-full transition-colors 
                    ${!gameState.isGameOver && gameState.currentPlayer === 'Red' ? 'group-hover:bg-red-500/50' : ''}
                    ${!gameState.isGameOver && gameState.currentPlayer === 'Yellow' && mode === '2P' ? 'group-hover:bg-yellow-500/50' : ''}
                  `} 
                 />
                 
                {Array.from({ length: ROWS }).map((_, rowIndex) => {
                  const cell = gameState.board[rowIndex][colIndex];
                  const isWinning = isWinningCell(rowIndex, colIndex);
                  
                  return (
                    <div 
                      key={`cell-${rowIndex}-${colIndex}`}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-900 border-4 border-blue-900 overflow-hidden shadow-inner flex items-center justify-center"
                    >
                      <div className={`w-full h-full rounded-full transition-all duration-300 transform
                        ${cell === 'Red' ? 'bg-red-500 scale-100 shadow-[inset_0_-8px_0_rgba(0,0,0,0.2)]' : ''}
                        ${cell === 'Yellow' ? 'bg-yellow-400 scale-100 shadow-[inset_0_-8px_0_rgba(0,0,0,0.2)]' : ''}
                        ${cell === null ? 'bg-transparent scale-0' : ''}
                        ${isWinning ? 'animate-pulse ring-4 ring-white ring-inset' : ''}
                      `} />
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
      </div>

      <div className="mt-8 text-center h-16 flex flex-col items-center">
        {!gameState.isGameOver ? (
           <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full shadow-md ${gameState.currentPlayer === 'Red' ? 'bg-red-500' : 'bg-yellow-400'}`} />
              <p className="text-xl font-medium animate-pulse text-zinc-300">
                {gameState.currentPlayer === 'Red' ? 'Player 1 (Red)' : mode === '1P' ? 'AI (Yellow) thinking...' : 'Player 2 (Yellow)'} turn
              </p>
           </div>
        ) : (
          <div className="flex flex-col items-center">
             <p className="text-2xl font-bold text-white mb-4">
              {gameState.winner === 'Draw' 
                ? "It's a Draw!" 
                : `${gameState.winner === 'Red' ? 'Player 1 (Red)' : mode === '1P' ? 'AI (Yellow)' : 'Player 2 (Yellow)'} Wins!`}
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
