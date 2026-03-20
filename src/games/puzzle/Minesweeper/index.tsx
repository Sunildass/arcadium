import React, { useState, useEffect, useCallback } from 'react';
import { MinesweeperEngine, MinesweeperState } from './MinesweeperEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

export default function Minesweeper() {
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
    const [engine, setEngine] = useState(() => new MinesweeperEngine(difficulty));
    const [gameState, setGameState] = useState<MinesweeperState | null>(null);
    const [timer, setTimer] = useState<number>(0);
    const [profileManager] = useState(() => new PlayerProfileManager('minesweeper'));

    const startGame = useCallback((diff?: 'Easy' | 'Medium' | 'Hard') => {
        const d = diff || difficulty;
        setDifficulty(d);
        const newEngine = new MinesweeperEngine(d);
        setEngine(newEngine);
        setGameState(newEngine.initialize());
        setTimer(0);
    }, [difficulty]);

    useEffect(() => {
        startGame();
    }, [startGame]);

    useEffect(() => {
        if (!gameState || !gameState.hasStarted || gameState.isGameOver) return;
        const interval = setInterval(() => {
            setTimer(t => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState?.hasStarted, gameState?.isGameOver]);

    // Handle end of game recording
    useEffect(() => {
        if (gameState?.isGameOver) {
            const result = engine.evaluateWin(gameState);
            if (result && result.winner) {
                 profileManager.recordGameResult('win', result.score, difficulty);
            } else if (result && !result.winner) {
                 profileManager.recordGameResult('loss', 0, difficulty);
            }
        }
    }, [gameState?.isGameOver, gameState, profileManager, engine, difficulty]);


    const handleLeftClick = (r: number, c: number) => {
         if (!gameState) return;
         setGameState(engine.update(gameState, { type: 'REVEAL', r, c }));
    };

    const handleRightClick = (e: React.MouseEvent, r: number, c: number) => {
         e.preventDefault();
         if (!gameState) return;
         setGameState(engine.update(gameState, { type: 'FLAG', r, c }));
    };

    if (!gameState) return null;

    const getNumberColor = (num: number) => {
        const colors = ['', 'text-blue-500', 'text-green-500', 'text-red-500', 'text-purple-600', 'text-red-800', 'text-cyan-500', 'text-black', 'text-gray-500'];
        return colors[num] || '';
    };

    // Calculate dynamic scaling for the grid container to ensure it stays strictly proportional
    // The grid should look like a block of uninset buttons until clicked
    
    // Windows 95 UI styling
    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-[#008080] font-sans">
            
            {/* Window Container */}
            <div className="bg-[#c0c0c0] p-[2px] border-l-2 border-t-2 border-l-white border-t-white border-r-2 border-b-2 border-r-black border-b-black lg:scale-125 inline-block">
                 
                 {/* Title Bar */}
                 <div className="bg-[#000080] text-white px-2 py-1 font-bold flex justify-between items-center text-sm">
                      <span>Minesweeper</span>
                      <div className="flex gap-1">
                           <button onClick={()=>startGame('Easy')} className="text-[10px] bg-[#c0c0c0] text-black border-l-white border-t-white border-r-black border-b-black border p-1 active:border-inset focus:outline-none">EASY</button>
                           <button onClick={()=>startGame('Medium')} className="text-[10px] bg-[#c0c0c0] text-black border-l-white border-t-white border-r-black border-b-black border p-1 active:border-inset focus:outline-none">MED</button>
                           <button onClick={()=>startGame('Hard')} className="text-[10px] bg-[#c0c0c0] text-black border-l-white border-t-white border-r-black border-b-black border p-1 active:border-inset focus:outline-none">HARD</button>
                      </div>
                 </div>

                 {/* Game Area */}
                 <div className="p-2">
                     
                     {/* Header Display */}
                     <div className="border-l-2 border-t-2 border-gray-600 border-r-white border-b-white p-2 mb-2 flex justify-between items-center bg-[#c0c0c0]">
                          <div className="bg-black text-red-500 font-mono text-2xl px-1 tracking-tighter w-14 text-right border-inset border-2 border-gray-500">
                               {gameState.minesLeft.toString().padStart(3, '0')}
                          </div>
                          
                          <button 
                              onClick={() => startGame()}
                              className="w-8 h-8 flex items-center justify-center text-xl bg-[#c0c0c0] border-l-2 border-t-2 border-l-white border-t-white border-r-gray-600 border-b-gray-600 active:border-inset focus:outline-none"
                          >
                              {gameState.isGameOver && gameState.winner ? '😎' : (gameState.isGameOver ? '😵' : (gameState.hasStarted ? '😮' : '🙂'))}
                          </button>

                          <div className="bg-black text-red-500 font-mono text-2xl px-1 tracking-tighter w-14 text-right border-inset border-2 border-gray-500">
                               {timer.toString().padStart(3, '0')}
                          </div>
                     </div>

                     {/* Mine Grid */}
                     <div className="border-l-4 border-t-4 border-gray-600 border-r-white border-b-white inline-block bg-[#c0c0c0] select-none">
                          <div 
                              className="grid"
                              style={{ 
                                  gridTemplateColumns: `repeat(${gameState.cols}, minmax(0, 1fr))`,
                                  gridTemplateRows: `repeat(${gameState.rows}, minmax(0, 1fr))`
                              }}
                          >
                               {gameState.grid.map((row) => 
                                   row.map((cell) => {
                                        // Cell styling based on state
                                        let cellContent: React.ReactNode = '';
                                        let cellStyle = "w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm font-black";

                                        if (!cell.isRevealed) {
                                            // Unrevealed state (raised button)
                                            cellStyle += " bg-[#c0c0c0] border-l-2 border-t-2 border-l-white border-t-white border-r-gray-600 border-b-gray-600";
                                            // Handle flagging
                                            if (cell.isFlagged) {
                                                 cellContent = <span className="text-red-600 drop-shadow-sm scale-125">⚑</span>;
                                            } else if (gameState.isGameOver && !gameState.winner && cell.isMine && !cell.isFlagged) {
                                                 // Should logically reveal it since game over, but engine handles that natively.
                                            } else if (gameState.isGameOver && !gameState.winner && !cell.isMine && cell.isFlagged) {
                                                 // Incorrect flag denoted
                                                 cellContent = '❌';
                                                 cellStyle = "bg-[#c0c0c0] border border-gray-400";
                                            }
                                        } else {
                                            // Revealed State (inset flat)
                                            cellStyle += " bg-[#c0c0c0] border-t border-l border-gray-500 border-r-transparent border-b-transparent";
                                            if (cell.isMine) {
                                                // Did they click this mine? We don't track the exact loss point natively, but generally red bg
                                                cellContent = '💣';
                                                if (!gameState.winner) cellStyle += " bg-red-500"; 
                                            } else if (cell.neighborMines > 0) {
                                                cellContent = cell.neighborMines;
                                                cellStyle += ` ${getNumberColor(cell.neighborMines)}`;
                                            }
                                        }

                                        return (
                                            <div 
                                                key={`${cell.r}-${cell.c}`}
                                                className={cellStyle}
                                                onClick={() => handleLeftClick(cell.r, cell.c)}
                                                onContextMenu={(e) => handleRightClick(e, cell.r, cell.c)}
                                            >
                                                {cellContent}
                                            </div>
                                        );
                                   })
                               )}
                          </div>
                     </div>
                     
                 </div>
            </div>
        </div>
    );
}
