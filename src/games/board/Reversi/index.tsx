import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ReversiEngine, ReversiState, Position } from './ReversiEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';
import { DifficultyManager } from '../../../core/ai/DifficultyManager';

export default function Reversi() {
  const [mode, setMode] = useState<'1P' | '2P'>('1P');
  const [difficultyManager] = useState(() => new DifficultyManager('reversi', 5));
  const [profileManager] = useState(() => new PlayerProfileManager('reversi'));
  
  const [engine, setEngine] = useState(() => new ReversiEngine(mode, difficultyManager.getCurrentDifficulty()));
  const [gameState, setGameState] = useState<ReversiState | null>(null);

  const startGame = useCallback((newMode?: '1P' | '2P') => {
    const activeMode = newMode || mode;
    const diff = difficultyManager.getCurrentDifficulty();
    const newEngine = new ReversiEngine(activeMode, diff);
    setEngine(newEngine);
    setGameState(newEngine.initialize());
  }, [mode, difficultyManager]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  // AI Turn Handling
  useEffect(() => {
    if (!gameState || gameState.isGameOver) return;
    
    // Auto-pass logic if NO valid moves for the current player
    if (gameState.validMoves.length === 0) {
        const timer = setTimeout(() => {
            setGameState(engine.update(gameState, 'PASS'));
        }, 1500); // Give user a moment to see they are passing
        // Or if it's AI, just pass
        return () => clearTimeout(timer);
    }

    if (mode === '1P' && gameState.turn === 'White') {
      const timer = setTimeout(() => {
          const aiMove = engine.computeAIMove(gameState);
          if (aiMove) {
              const newState = engine.update(gameState, aiMove);
              setGameState(newState);
          }
      }, 700); // Artificial thinking delay
      return () => clearTimeout(timer);
    }
  }, [gameState, engine, mode]);

  const handleSquareClick = (x: number, y: number) => {
    if (!gameState || gameState.isGameOver) return;
    if (mode === '1P' && gameState.turn === 'White') return; // AI's turn

    // Check if it's a valid move
    const isValid = gameState.validMoves.some(m => m.x === x && m.y === y);
    if (isValid) {
        const newState = engine.update(gameState, { x, y });
        setGameState(newState);
    }
  };

  useEffect(() => {
      if (gameState?.isGameOver && gameState.winner) {
          const result = engine.evaluateWin(gameState);
          if (result) {
               const isWin = result.winner === 'Player1';
               profileManager.recordGameResult(
                   result.winner === null ? 'draw' : isWin ? 'win' : 'loss',
                   result.score,
                   result.difficulty
               );
               if (mode === '1P' && result.winner !== null) {
                   difficultyManager.recordGame(isWin, result.score, 0, 100);
               }
          }
      }
  }, [gameState?.isGameOver, engine, gameState, mode, profileManager, difficultyManager]);

  if (!gameState) return null;

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full"> 
        <div className="flex flex-col items-center gap-6">
            <div className="flex justify-between w-full max-w-md items-center bg-zinc-900/50 p-3 rounded-2xl border border-white/5 shadow-lg">
                <select 
                  className="bg-zinc-800 border bg-transparent border-zinc-700 text-zinc-50 rounded-lg p-2 outline-none font-bold tracking-wide shadow-inner"
                  value={mode}
                  onChange={(e) => {
                      setMode(e.target.value as '1P' | '2P');
                      startGame(e.target.value as '1P' | '2P');
                  }}
                >
                  <option value="1P">1 Player (vs AI)</option>
                  <option value="2P">2 Player (Local)</option>
                </select>
                
                <div className="flex flex-col items-end">
                    <h3 className="text-xl font-black drop-shadow-md">
                        {gameState.isGameOver 
                            ? <span className="text-emerald-400">{gameState.winner === 'Draw' ? 'Draw' : `${gameState.winner} Wins!`}</span>
                            : gameState.validMoves.length === 0 
                                ? <span className="text-amber-400 animate-pulse">NO MOVES - PASSING</span>
                                : <span className={gameState.turn === 'Black' ? 'text-zinc-300' : 'text-zinc-100'}>{gameState.turn}'s Turn</span>
                        }
                    </h3>
                    <div className="flex gap-3 mt-1 text-sm font-bold">
                        <span className="bg-black text-white px-2 py-1 rounded-md border border-zinc-700">Black: {gameState.blackCount}</span>
                        <span className="bg-white text-black px-2 py-1 rounded-md border border-zinc-300">White: {gameState.whiteCount}</span>
                    </div>
                </div>
            </div>

            {/* Board */}
            <div className="w-full max-w-md aspect-square grid grid-cols-8 grid-rows-8 border-[12px] border-emerald-900 rounded-lg shadow-2xl relative overflow-hidden bg-emerald-700">
                {Array(8).fill(null).map((_, y) => (
                    Array(8).fill(null).map((_, x) => {
                        const piece = gameState.board[y][x];
                        const isValid = gameState.validMoves.some(m => m.x === x && m.y === y);
                        
                        return (
                            <div 
                                key={`${x}-${y}`} 
                                className={`relative flex items-center justify-center border border-emerald-800/50 transition-colors duration-300
                                  ${isValid && gameState.turn === 'Black' ? 'cursor-pointer hover:bg-emerald-600' : ''}
                                  ${isValid && gameState.turn === 'White' && mode === '2P' ? 'cursor-pointer hover:bg-emerald-600' : ''}
                                `}
                                onClick={() => handleSquareClick(x, y)}
                            >
                                {/* Valid move indicator */}
                                {isValid && (!piece) && (
                                    <div className="w-[30%] h-[30%] rounded-full bg-black/20" />
                                )}

                                {/* Piece */}
                                {piece && (
                                    <div className={`
                                        w-[80%] h-[80%] rounded-full shadow-lg flex items-center justify-center transition-all duration-500
                                        ${piece === 'Black' ? 'bg-black text-white' : 'bg-white text-black'}
                                    `}>
                                        <div className={`
                                            w-full h-full rounded-full border border-white/10
                                            ${piece === 'Black' ? 'shadow-[inset_0_-2px_4px_rgba(255,255,255,0.3)]' : 'shadow-[inset_0_-2px_6px_rgba(0,0,0,0.2)]'}
                                        `} />
                                    </div>
                                )}
                            </div>
                        );
                    })
                ))}

                {/* Game Over Overlay */}
                {gameState.isGameOver && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in z-20">
                        <span className="text-4xl font-black text-white mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                            {gameState.winner === 'Draw' ? "IT'S A TIE!" : `${gameState.winner?.toUpperCase()} WINS!`}
                        </span>
                        <span className="text-lg text-emerald-300 mb-8 font-mono">
                            {gameState.blackCount} - {gameState.whiteCount}
                        </span>
                        <button 
                            onClick={(() => startGame()) as React.MouseEventHandler}
                            className="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold hover:scale-105 hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
