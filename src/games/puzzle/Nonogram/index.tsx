import React, { useState, useEffect, useCallback } from 'react';
import { NonogramEngine, NonogramState } from './NonogramEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

export default function Nonogram() {
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [engine, setEngine] = useState(() => new NonogramEngine(difficulty));
    const [gameState, setGameState] = useState<NonogramState | null>(null);
    const [profileManager] = useState(() => new PlayerProfileManager('nonogram'));
    const [timer, setTimer] = useState<number>(0);
    
    // Tools: fill or mark (X)
    const [tool, setTool] = useState<'fill' | 'mark'>('fill');

    const startGame = useCallback((diff?: 'Easy' | 'Medium' | 'Hard') => {
        const d = diff || difficulty;
        setDifficulty(d);
        const newEngine = new NonogramEngine(d);
        setEngine(newEngine);
        setGameState(newEngine.initialize());
        setTimer(0);
    }, [difficulty]);

    useEffect(() => {
        startGame();
    }, [startGame]);

    useEffect(() => {
        if (!gameState || gameState.isGameOver) return;
        const interval = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, [gameState?.isGameOver]);

    useEffect(() => {
        if (gameState?.isGameOver) {
            const result = engine.evaluateWin(gameState);
            if (result && result.winner) {
                 profileManager.recordGameResult('win', result.score, difficulty);
            }
        }
    }, [gameState?.isGameOver, gameState, profileManager, engine, difficulty]);


    const handleCellClick = (r: number, c: number, overrideTool?: 'fill' | 'mark' | 'clear') => {
         if (!gameState || gameState.isGameOver) return;
         
         const current = gameState.grid[r][c];
         
         // Logic: if already filled, ignore unless clear.
         if (current === 'filled') return;

         let actionType: 'FILL' | 'MARK' | 'CLEAR';

         if (overrideTool) {
              actionType = overrideTool.toUpperCase() as any;
         } else {
              if (current === 'marked' && tool === 'mark') actionType = 'CLEAR';
              else if (current === 'empty') actionType = tool.toUpperCase() as any;
              else return;
         }

         setGameState(engine.update(gameState, { type: actionType, r, c }));
    };

    // Helper context menu (right click always marks/clears X)
    const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
         e.preventDefault();
         handleCellClick(r, c, gameState?.grid[r][c] === 'marked' ? 'clear' : 'mark');
    };

    if (!gameState) return null;

    // Find max hint lengths to size the header panels
    const maxRowHints = Math.max(...gameState.rowHints.map(h => h.length));
    const maxColHints = Math.max(...gameState.colHints.map(h => h.length));

    const gridSize = gameState.width;
    const gridPx = gridSize === 5 ? 250 : (gridSize === 10 ? 350 : 450); // scales visually
    const cellPx = gridPx / gridSize;

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-[#fdf6e3] font-sans text-gray-800">
            
            <div className="w-full max-w-3xl flex justify-between items-end mb-6">
                <div>
                     <h1 className="text-4xl font-black tracking-widest text-slate-800 drop-shadow-sm uppercase">Picross</h1>
                     <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-bold">Mistakes: {gameState.mistakes} / Time: {timer}s</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                     <select value={difficulty} onChange={e=>startGame(e.target.value as any)} className="bg-white text-slate-700 outline-none p-2 rounded shadow border border-slate-200 uppercase text-xs font-bold tracking-widest">
                         <option value="Easy">5x5 Grid</option>
                         <option value="Medium">10x10 Grid</option>
                         <option value="Hard">15x15 Grid</option>
                     </select>
                     <div className="flex bg-white shadow border border-slate-200 rounded overflow-hidden mt-2">
                         <button 
                             onClick={() => setTool('fill')}
                             className={`px-4 py-2 text-sm font-bold uppercase ${tool === 'fill' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                         >
                             Fill (■)
                         </button>
                         <button 
                             onClick={() => setTool('mark')}
                             className={`px-4 py-2 text-sm font-bold uppercase ${tool === 'mark' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                         >
                             Mark (X)
                         </button>
                     </div>
                </div>
            </div>

            {/* The Game Board */}
            <div className="flex bg-white p-4 sm:p-6 rounded-xl shadow-xl border border-slate-200 overflow-auto max-w-full">
                 
                 <div className="flex flex-col">
                      
                      {/* Top row: Empty Spacer + Col Hints */}
                      <div className="flex">
                           {/* Top-Left Spacer */}
                           <div 
                               className="border-r-2 border-b-2 border-slate-800 bg-slate-100"
                               style={{ width: `${maxRowHints * 1.5}rem`, height: `${maxColHints * 1.5}rem` }}
                           />
                           
                           {/* Col Hints Headers */}
                           <div className="flex border-b-2 border-slate-800 bg-slate-50" style={{ height: `${maxColHints * 1.5}rem` }}>
                                {gameState.colHints.map((hints, c) => (
                                     <div 
                                         key={c} 
                                         className={`flex flex-col justify-end items-center border-r border-slate-300 ${c % 5 === 4 && c !== gridSize-1 ? 'border-r-2 border-r-slate-800' : ''}`}
                                         style={{ width: `${cellPx}px` }}
                                     >
                                          {hints.map((hint, i) => (
                                              <span key={i} className="text-xs sm:text-sm font-bold leading-none mb-1 text-slate-700">{hint}</span>
                                          ))}
                                     </div>
                                ))}
                           </div>
                      </div>

                      {/* Remaining rows: Row Hints + Grid */}
                      <div className="flex">
                           {/* Row Hints Sidebar */}
                           <div className="flex flex-col border-r-2 border-slate-800 bg-slate-50" style={{ width: `${maxRowHints * 1.5}rem` }}>
                                {gameState.rowHints.map((hints, r) => (
                                     <div 
                                         key={r} 
                                         className={`flex justify-end items-center border-b border-slate-300 pr-2 space-x-2 ${r % 5 === 4 && r !== gridSize-1 ? 'border-b-2 border-b-slate-800' : ''}`}
                                         style={{ height: `${cellPx}px` }}
                                     >
                                          {hints.map((hint, i) => (
                                              <span key={i} className="text-xs sm:text-sm font-bold text-slate-700">{hint}</span>
                                          ))}
                                     </div>
                                ))}
                           </div>

                           {/* Interactive Grid */}
                           <div className="flex flex-col bg-slate-300" style={{ width: `${gridPx}px`, height: `${gridPx}px` }}>
                                {gameState.grid.map((row, r) => (
                                     <div key={r} className="flex flex-1 w-full">
                                          {row.map((cellState, c) => {
                                               
                                               let bg = 'bg-white hover:bg-slate-100 cursor-pointer';
                                               let content = '';
                                               
                                               if (cellState === 'filled') {
                                                    bg = 'bg-slate-800'; // Filled black pixel
                                               } else if (cellState === 'marked') {
                                                    bg = 'bg-white hover:bg-slate-100 cursor-pointer';
                                                    content = '✕';
                                               }

                                               const isBottomThick = r % 5 === 4 && r !== gridSize - 1;
                                               const isRightThick = c % 5 === 4 && c !== gridSize - 1;

                                               return (
                                                    <div 
                                                        key={c}
                                                        onClick={() => handleCellClick(r, c)}
                                                        onContextMenu={(e) => handleContextMenu(e, r, c)}
                                                        className={`flex-1 flex items-center justify-center transition-colors select-none
                                                            ${bg}
                                                            border-b border-r border-slate-300
                                                            ${isBottomThick ? 'border-b-2 border-b-slate-800' : ''}
                                                            ${isRightThick ? 'border-r-2 border-r-slate-800' : ''}
                                                        `}
                                                    >
                                                         {content && <span className="text-[10px] sm:text-xs text-amber-600 font-black">{content}</span>}
                                                    </div>
                                               );
                                          })}
                                     </div>
                                ))}
                           </div>

                      </div>

                 </div>
            </div>

            {/* Win Overlay */}
            {gameState.isGameOver && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border-4 border-slate-800">
                        <h2 className="text-4xl font-black text-slate-800 uppercase tracking-widest mb-2">Picross Solved!</h2>
                        <div className="text-slate-600 mb-6 font-bold uppercase tracking-wider text-sm space-y-2">
                             <p>Mistakes: <span className="text-red-500">{gameState.mistakes}</span></p>
                             <p>Time: {timer}s</p>
                        </div>
                        <button onClick={() => startGame()} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest rounded transition-colors shadow-none border-none">
                            Play Again
                        </button>
                    </div>
                </div>
            )}
            
        </div>
    );
}
