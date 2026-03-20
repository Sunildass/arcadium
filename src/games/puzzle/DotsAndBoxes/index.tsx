import React, { useState, useEffect, useCallback } from 'react';
import { DotsEngine, DotsState } from './DotsEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

export default function DotsAndBoxes() {
    const [mode, setMode] = useState<'1P' | '2P'>('1P');
    const [size, setSize] = useState<number>(5); // 5x5 boxes
    const [engine, setEngine] = useState(() => new DotsEngine(mode, size, size));
    const [gameState, setGameState] = useState<DotsState | null>(null);
    const [profileManager] = useState(() => new PlayerProfileManager('dots'));

    const startGame = useCallback((newMode?: '1P' | '2P', newSize?: number) => {
        const targetMode = newMode || mode;
        const targetSize = newSize || size;
        const newEngine = new DotsEngine(targetMode, targetSize, targetSize);
        setEngine(newEngine);
        setGameState(newEngine.initialize());
    }, [mode, size]);

    useEffect(() => {
        startGame();
    }, [startGame]);

    // Handle AI Logic
    useEffect(() => {
         if (!gameState || gameState.isGameOver) return;
         if (mode === '1P' && gameState.turn === 'P2') {
             const timer = setTimeout(() => {
                  const move = engine.computeAIMove(gameState);
                  if (move) {
                      setGameState(engine.update(gameState, move));
                  }
             }, 800);
             return () => clearTimeout(timer);
         }
    }, [gameState, engine, mode]);

    const handleLineClick = (type: 'H' | 'V', index: number) => {
         if (!gameState || gameState.isGameOver) return;
         if (mode === '1P' && gameState.turn === 'P2') return;

         if (type === 'H') {
             if (gameState.hLines[index]) return;
             setGameState(engine.update(gameState, { type: 'DRAW_HLINE', index }));
         } else {
             if (gameState.vLines[index]) return;
             setGameState(engine.update(gameState, { type: 'DRAW_VLINE', index }));
         }
    };

    if (!gameState) return null;

    // Renders the dot grid natively using a responsive layout approach
    // We will render dots as little absolute divs, and lines as absolute divs spanning between them
    
    // Instead of absolute, a precise CSS grid is actually perfect for this.
    // A 5x5 box grid uses 11x11 CSS grid (dots, H-lines, V-lines, and Boxes interweaved)
    
    const gridRows = size * 2 + 1;
    const gridCols = size * 2 + 1;

    // We can map linear indices to grid
    // Dots are at (even, even)
    // H-Lines are at (even, odd) -> e.g. row 0, col 1 is H-line 0 for row 0.
    // V-Lines are at (odd, even)
    // Boxes are at (odd, odd)

    const renderGridPattern = () => {
        const cells = [];
        
        let hLineCounter = 0;
        let vLineCounter = 0;
        let boxCounter = 0;

        for (let r = 0; r < gridRows; r++) {
            for (let c = 0; c < gridCols; c++) {
                 const isDot = (r % 2 === 0) && (c % 2 === 0);
                 const isHLine = (r % 2 === 0) && (c % 2 === 1);
                 const isVLine = (r % 2 === 1) && (c % 2 === 0);
                 const isBox = (r % 2 === 1) && (c % 2 === 1);

                 if (isDot) {
                     cells.push(
                         <div key={`d-${r}-${c}`} className="w-full h-full flex items-center justify-center">
                             <div className="w-3/4 h-3/4 bg-white/50 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                         </div>
                     );
                 } 
                 else if (isHLine) {
                     const currIdx = hLineCounter++;
                     const drawn = gameState.hLines[currIdx];
                     cells.push(
                          <div 
                              key={`h-${r}-${c}`} 
                              onClick={() => handleLineClick('H', currIdx)}
                              className={`w-full py-2 flex items-center justify-center cursor-pointer group px-1
                                  ${drawn ? 'pointer-events-none' : ''}
                              `}
                          >
                               <div className={`h-2 w-full transition-all rounded-full 
                                   ${drawn ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]' : 'bg-transparent group-hover:bg-cyan-900/40'}
                               `} />
                          </div>
                     );
                 }
                 else if (isVLine) {
                     const currIdx = vLineCounter++;
                     const drawn = gameState.vLines[currIdx];
                     cells.push(
                          <div 
                              key={`v-${r}-${c}`} 
                              onClick={() => handleLineClick('V', currIdx)}
                              className={`h-full w-full flex items-center justify-center cursor-pointer group py-1
                                  ${drawn ? 'pointer-events-none' : ''}
                              `}
                          >
                               <div className={`w-2 h-full transition-all rounded-full 
                                   ${drawn ? 'bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.8)]' : 'bg-transparent group-hover:bg-indigo-900/40'}
                               `} />
                          </div>
                     );
                 }
                 else if (isBox) {
                     const currIdx = boxCounter++;
                     const owner = gameState.boxes[currIdx];
                     cells.push(
                          <div key={`b-${r}-${c}`} className="w-full h-full flex items-center justify-center p-1">
                               <div className={`w-full h-full rounded transition-all duration-500
                                   ${owner === 'P1' ? 'bg-cyan-500/80 shadow-[inset_0_0_20px_rgba(6,182,212,0.6)] animate-fade-in text-white' : ''}
                                   ${owner === 'P2' ? 'bg-indigo-500/80 shadow-[inset_0_0_20px_rgba(79,70,229,0.6)] animate-fade-in text-white' : ''}
                                   ${!owner ? 'bg-black/10' : 'flex items-center justify-center font-black text-2xl lg:text-4xl'}
                               `}>
                                   {owner && (owner === 'P1' ? (mode === '1P' ? 'U' : '1') : (mode === '1P' ? 'C' : '2'))}
                               </div>
                          </div>
                     );
                 }
            }
        }
        return cells;
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-slate-950 font-sans">
            
            <div className="w-full max-w-2xl flex flex-col md:flex-row justify-between items-center bg-slate-900 border border-slate-700 p-4 rounded-xl mb-8 shadow-xl">
                 <div className="flex gap-4">
                     <select value={mode} onChange={e=>startGame(e.target.value as '1P' | '2P')} className="bg-slate-800 text-slate-200 outline-none p-2 rounded">
                         <option value="1P">vs AI</option>
                         <option value="2P">Local 2P</option>
                     </select>
                     <select value={size} onChange={e=>startGame(mode, Number(e.target.value))} className="bg-slate-800 text-slate-200 outline-none p-2 rounded">
                         <option value={4}>4x4 Grid</option>
                         <option value={5}>5x5 Grid</option>
                         <option value={6}>6x6 Grid</option>
                     </select>
                 </div>

                 <div className="text-xl font-bold flex gap-8 items-center mt-4 md:mt-0">
                     <div className={`flex flex-col items-center p-2 px-6 rounded-lg border-b-4 ${gameState.turn === 'P1' ? 'border-cyan-400 bg-slate-800 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'border-transparent text-slate-500'}`}>
                         <span className="text-cyan-400 tracking-widest uppercase">Player 1</span>
                         <span className="text-3xl font-black text-white">{gameState.scores.P1}</span>
                     </div>
                     <div className={`flex flex-col items-center p-2 px-6 rounded-lg border-b-4 ${gameState.turn === 'P2' ? 'border-indigo-400 bg-slate-800 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'border-transparent text-slate-500'}`}>
                         <span className="text-indigo-400 tracking-widest uppercase">{mode === '1P' ? 'Computer' : 'Player 2'}</span>
                         <span className="text-3xl font-black text-white">{gameState.scores.P2}</span>
                     </div>
                 </div>
            </div>

            <div className="relative w-full max-w-lg lg:max-w-2xl aspect-square bg-slate-900 border-[8px] border-slate-800 rounded-3xl p-4 shadow-[inset_0_0_50px_rgba(0,0,0,0.5),_0_20px_40px_rgba(0,0,0,0.5)]">
                 <div 
                      className="w-full h-full grid"
                      style={{ 
                          // The columns and rows need distinct sizing. 
                          // Dots (even indices) are small fixed sizes, lines (odd) are flexible `1fr`.
                          gridTemplateColumns: Array(gridCols).fill(0).map((_, i) => i % 2 === 0 ? '12px' : '1fr').join(' '),
                          gridTemplateRows: Array(gridRows).fill(0).map((_, i) => i % 2 === 0 ? '12px' : '1fr').join(' ')
                      }}
                 >
                      {renderGridPattern()}
                 </div>

                 {gameState.isGameOver && (
                     <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center rounded-xl">
                          <h1 className="text-6xl font-black text-white mb-2 drop-shadow-xl">
                              {gameState.winner === 'Draw' ? 'Draw!' : (gameState.winner === 'P1' ? 'Player 1 Wins!' : (mode === '1P' ? 'Computer Wins' : 'Player 2 Wins!'))}
                          </h1>
                          <p className="text-slate-400 mb-8 font-bold tracking-widest">{gameState.scores.P1} - {gameState.scores.P2}</p>
                          <button onClick={() => startGame()} className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black tracking-widest uppercase rounded shadow-[0_4px_20px_rgba(34,211,238,0.4)] transition-all hover:scale-105 active:scale-95">
                              Play Again
                          </button>
                     </div>
                 )}
            </div>
            
        </div>
    );
}
