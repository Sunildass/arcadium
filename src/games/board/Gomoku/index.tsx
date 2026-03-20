import React, { useState, useEffect, useCallback } from 'react';
import { GomokuEngine, GomokuState } from './GomokuEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';
import { DifficultyManager } from '../../../core/ai/DifficultyManager';

export default function Gomoku() {
  const [mode, setMode] = useState<'1P' | '2P'>('1P');
  const [difficultyManager] = useState(() => new DifficultyManager('gomoku', 5));
  const [profileManager] = useState(() => new PlayerProfileManager('gomoku'));
  
  const [engine, setEngine] = useState(() => new GomokuEngine(mode, difficultyManager.getCurrentDifficulty()));
  const [gameState, setGameState] = useState<GomokuState | null>(null);

  const startGame = useCallback((newMode?: '1P' | '2P') => {
    const activeMode = newMode || mode;
    const diff = difficultyManager.getCurrentDifficulty();
    const newEngine = new GomokuEngine(activeMode, diff);
    setEngine(newEngine);
    setGameState(newEngine.initialize());
  }, [mode, difficultyManager]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  // Handle AI turn
  useEffect(() => {
       if (!gameState || gameState.isGameOver) return;
       
       if (mode === '1P' && gameState.turn === 'White') {
           const timer = setTimeout(() => {
               const aiMove = engine.computeAIMove(gameState);
               if (aiMove) {
                   setGameState(engine.update(gameState, aiMove));
               }
           }, 700);
           return () => clearTimeout(timer);
       }
  }, [gameState, engine, mode]);

  const handleIntersectionClick = (r: number, c: number) => {
       if (!gameState || gameState.isGameOver) return;
       if (mode === '1P' && gameState.turn === 'White') return; // AI's turn
       
       // Gomoku specific: users click the INTERSECTION, but logically it's just a board cell
       setGameState(engine.update(gameState, { r, c }));
  };

  useEffect(() => {
      if (gameState?.isGameOver) {
          const result = engine.evaluateWin(gameState);
          if (result) {
               profileManager.recordGameResult(
                   result.winner === null ? 'draw' : result.winner === 'Player1' ? 'win' : 'loss',
                   result.score,
                   result.difficulty
               );
          }
      }
  }, [gameState?.isGameOver, gameState, profileManager]);

  if (!gameState) return null;

  const size = 15;

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full text-zinc-800" style={{ fontFamily: 'var(--font-heading)' }}> 
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
            
            {/* Header Settings */}
            <div className="flex justify-between w-full max-w-lg items-center bg-white/10 p-3 rounded-2xl border border-white/20 shadow-lg backdrop-blur-md">
                <select 
                  className="bg-black/80 border bg-transparent border-white/20 text-white rounded-lg p-2 outline-none font-bold tracking-widest cursor-pointer"
                  value={mode}
                  onChange={(e) => startGame(e.target.value as '1P' | '2P')}
                >
                  <option value="1P">1 Player (Black)</option>
                  <option value="2P">2 Player</option>
                </select>
                
                <h3 className="text-xl font-black drop-shadow-md text-white">
                    {gameState.isGameOver 
                        ? <span className="text-emerald-400">{gameState.winner === 'Draw' ? 'Draw!' : `${gameState.winner} Wins!`}</span>
                        : <span>{gameState.turn}'s Turn</span>
                    }
                </h3>
            </div>

            {/* Board */}
            <div className="relative bg-[#DBA042] border-8 border-[#A67120] rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-4 md:p-6 w-full max-w-[95vw] sm:max-w-lg md:max-w-2xl">
                 
                 {/* Visual Grid Lines */}
                 <div className="absolute inset-4 md:inset-6">
                     {Array.from({ length: size - 1 }).map((_, i) => (
                         <div key={`h-${i}`} className="absolute w-full border-b border-black/40" style={{ top: `${(i + 0.5) * (100 / size)}%` }} />
                     ))}
                     {Array.from({ length: size - 1 }).map((_, i) => (
                         <div key={`v-${i}`} className="absolute h-full border-r border-black/40" style={{ left: `${(i + 0.5) * (100 / size)}%` }} />
                     ))}

                     {/* Star points (Hoshi) for 15x15 commonly at 3,3 3,11 7,7 11,3 11,11 */}
                     {[
                         {r: 3, c: 3}, {r: 3, c: 11}, 
                         {r: 7, c: 7}, 
                         {r: 11, c: 3}, {r: 11, c: 11}
                     ].map(pt => (
                         <div key={`star-${pt.r}-${pt.c}`} className="absolute w-2 h-2 bg-black rounded-full transform -translate-x-1/2 -translate-y-1/2" 
                              style={{ left: `${(pt.c) * (100 / size)}%`, top: `${(pt.r) * (100 / size)}%` }} 
                         />
                     ))}
                 </div>
                 
                 {/* Logical Click Grid & Stones */}
                 <div className="relative grid w-full aspect-square" style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, gridTemplateRows: `repeat(${size}, 1fr)` }}>
                      {gameState.board.map((row, r) => (
                          row.map((cell, c) => {
                              const isWinningStone = gameState.winningLine?.some(pos => pos.r === r && pos.c === c);
                              
                              return (
                                  <div 
                                      key={`${r}-${c}`}
                                      className={`relative flex items-center justify-center cursor-pointer group`}
                                      onClick={() => handleIntersectionClick(r, c)}
                                  >
                                      {/* Hover Preview Box (only if empty) */}
                                      {!cell && !gameState.isGameOver && (
                                          <div className={`
                                              w-[60%] h-[60%] rounded-full opacity-0 group-hover:opacity-40 transition-opacity
                                              ${gameState.turn === 'Black' ? 'bg-black' : 'bg-white'}
                                          `} />
                                      )}

                                      {/* Placed Stone */}
                                      {cell && (
                                          <div className={`
                                              w-[80%] h-[80%] rounded-full shadow-[2px_2px_4px_rgba(0,0,0,0.5)] z-10 transition-transform duration-300 transform
                                              ${cell === 'Black' ? 'bg-gradient-to-br from-zinc-700 to-black' : 'bg-gradient-to-br from-white to-zinc-300'}
                                              ${isWinningStone ? 'scale-125 ring-2 ring-emerald-500 animate-pulse' : 'scale-100'}
                                          `} />
                                      )}
                                  </div>
                              );
                          })
                      ))}
                 </div>
            </div>

            {/* End Game Overlay directly tied to UI tree underneath */}
            {gameState.isGameOver && (
               <button 
                  onClick={() => startGame()}
                  className="mt-4 bg-emerald-600 outline-none hover:-translate-y-1 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-black tracking-widest transition-transform shadow-[0_4px_15px_rgba(16,185,129,0.5)]"
               >
                   Play Again
               </button>
            )}
        </div>
    </div>
  );
}
