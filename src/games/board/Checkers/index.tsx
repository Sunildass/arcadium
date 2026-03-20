import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckersEngine, CheckersState, Move, Position } from './CheckersEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';
import { DifficultyManager } from '../../../core/ai/DifficultyManager';

export default function Checkers() {
  const [mode, setMode] = useState<'1P' | '2P'>('1P');
  const [difficultyManager] = useState(() => new DifficultyManager('checkers', 5));
  const [profileManager] = useState(() => new PlayerProfileManager('checkers'));
  
  const [engine, setEngine] = useState(() => new CheckersEngine(mode, difficultyManager.getCurrentDifficulty()));
  const [gameState, setGameState] = useState<CheckersState | null>(null);

  const startGame = useCallback((newMode?: '1P' | '2P') => {
    const activeMode = newMode || mode;
    const diff = difficultyManager.getCurrentDifficulty();
    const newEngine = new CheckersEngine(activeMode, diff);
    setEngine(newEngine);
    setGameState(newEngine.initialize());
  }, [mode, difficultyManager]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  // AI Turn Handling
  useEffect(() => {
    if (!gameState || gameState.isGameOver) return;
    if (mode === '1P' && gameState.turn === 'Black') {
      const timer = setTimeout(() => {
          const aiMove = engine.computeAIMove(gameState);
          if (aiMove) {
              const newState = engine.update(gameState, aiMove);
              setGameState(newState);
          }
      }, 500); // 500ms delay for human visual pacing
      return () => clearTimeout(timer);
    }
  }, [gameState, engine, mode]);

  const handleSquareClick = (x: number, y: number) => {
    if (!gameState || gameState.isGameOver) return;
    if (mode === '1P' && gameState.turn === 'Black') return; // AI's turn block

    const piece = gameState.board[y][x];

    // Get all valid moves globally to enforce forced jumps
    const allValidMoves = engine.getAllValidMoves(gameState.board, gameState.turn, gameState.mustJumpPos);

    if (gameState.selectedPos) {
       // Check if clicked square is a valid target cell
       const move = allValidMoves.find(m => 
           m.from.x === gameState.selectedPos!.x && 
           m.from.y === gameState.selectedPos!.y && 
           m.to.x === x && 
           m.to.y === y
       );

       if (move) {
           const newState = engine.update(gameState, move);
           setGameState(newState);
       } else if (piece && piece.player === gameState.turn) {
           // Reselect another piece
           if (!gameState.mustJumpPos && allValidMoves.some(m => m.from.x === x && m.from.y === y)) {
                setGameState({ ...gameState, selectedPos: { x, y } });
           } else {
                setGameState(engine.update(gameState, 'CANCEL_SELECTION'));
           }
       } else {
           // Clicked empty invalid cell, deselect
           if (!gameState.mustJumpPos) {
               setGameState(engine.update(gameState, 'CANCEL_SELECTION'));
           }
       }
    } else {
        // Selecting a piece
        if (piece && piece.player === gameState.turn) {
            // Is this piece legally allowed to move? (Enforce forced jump)
            if (allValidMoves.some(m => m.from.x === x && m.from.y === y)) {
                setGameState({ ...gameState, selectedPos: { x, y } });
            }
        }
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

  const getValidTargets = useMemo(() => {
      if (!gameState || !gameState.selectedPos) return [];
      return engine.getAllValidMoves(gameState.board, gameState.turn, gameState.mustJumpPos)
                   .filter(m => m.from.x === gameState.selectedPos!.x && m.from.y === gameState.selectedPos!.y)
                   .map(m => m.to);
  }, [gameState, engine]);

  if (!gameState) return null;

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full"> 
        <div className="flex flex-col items-center gap-6">
            <div className="flex justify-between w-full max-w-md items-center bg-zinc-900/50 p-3 rounded-2xl border border-white/5">
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
                
                <h3 className="text-xl font-black drop-shadow-md">
                     {gameState.isGameOver 
                         ? <span className={gameState.winner === 'Red' ? 'text-rose-400' : 'text-zinc-400'}>{gameState.winner} Wins!</span>
                         : <span className={gameState.turn === 'Red' ? 'text-rose-400' : 'text-zinc-400'}>{gameState.turn}'s Turn</span>
                     }
                </h3>
            </div>

            {/* Board */}
            <div className="w-full max-w-md aspect-square grid grid-cols-8 grid-rows-8 border-[12px] border-zinc-800 rounded-lg shadow-2xl relative overflow-hidden bg-amber-100">
                {Array(8).fill(null).map((_, y) => (
                    Array(8).fill(null).map((_, x) => {
                        const isDark = (x + y) % 2 === 1;
                        const cellColor = isDark ? 'bg-amber-900' : 'bg-amber-100';
                        const piece = gameState.board[y][x];
                        
                        const isSelected = gameState.selectedPos?.x === x && gameState.selectedPos?.y === y;
                        const isTarget = getValidTargets.some(t => t.x === x && t.y === y);
                        const isMustJump = gameState.mustJumpPos?.x === x && gameState.mustJumpPos?.y === y;

                        return (
                            <div 
                                key={`${x}-${y}`} 
                                className={`relative flex items-center justify-center ${cellColor} transition-colors ${isDark ? 'cursor-pointer hover:brightness-110' : ''}`}
                                onClick={() => isDark && handleSquareClick(x, y)}
                            >
                                {/* Highlight Overlay for Targets */}
                                {isTarget && (
                                    <div className="absolute inset-0 bg-green-500/40 rounded-full scale-50 transition-transform animate-pulse" />
                                )}

                                {/* Highlight Selected or Must Jump */}
                                {(isSelected || isMustJump) && piece && (
                                    <div className="absolute inset-0 bg-yellow-500/30 animate-pulse border-2 border-yellow-400/50" />
                                )}

                                {/* Piece */}
                                {piece && (
                                    <div className={`
                                        w-[80%] h-[80%] rounded-full shadow-[0_4px_6px_rgba(0,0,0,0.5)] flex items-center justify-center
                                        transition-transform duration-300 hover:scale-105 active:scale-95
                                        ${piece.player === 'Red' ? 'bg-rose-600' : 'bg-zinc-800'}
                                    `}>
                                        <div className={`w-[70%] h-[70%] rounded-full border-2 ${piece.player === 'Red' ? 'border-rose-700/50' : 'border-zinc-700/50'} flex items-center justify-center`}>
                                            {piece.isKing && (
                                                <svg className="w-1/2 h-1/2 text-white/50" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ))}

                {/* Game Over Overlay */}
                {gameState.isGameOver && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in z-20">
                        <span className="text-4xl font-black text-white mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">GAME OVER</span>
                        <button 
                            onClick={(() => startGame()) as React.MouseEventHandler}
                            className="bg-white text-black px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
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
