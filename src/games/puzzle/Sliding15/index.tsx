import React, { useState, useEffect, useCallback } from 'react';
import { SlidingEngine, SlidingState } from './SlidingEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

export default function Sliding15() {
    const [engine, setEngine] = useState(() => new SlidingEngine('Medium'));
    const [gameState, setGameState] = useState<SlidingState | null>(null);
    const [timer, setTimer] = useState<number>(0);
    const [profileManager] = useState(() => new PlayerProfileManager('sliding-15'));

    const startGame = useCallback(() => {
        const newEngine = new SlidingEngine('Medium');
        setEngine(newEngine);
        setGameState(newEngine.initialize());
        setTimer(0);
    }, []);

    useEffect(() => {
        startGame();
    }, [startGame]);

    useEffect(() => {
        if (!gameState || gameState.isGameOver) return;
        const interval = setInterval(() => {
            setTimer(t => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState?.isGameOver]);

    // Handle game end tracking
    useEffect(() => {
        if (gameState?.isGameOver) {
            const result = engine.evaluateWin(gameState);
            if (result && result.winner) {
                 profileManager.recordGameResult('win', result.score, 'Medium');
            }
        }
    }, [gameState?.isGameOver, gameState, profileManager, engine]);


    const handleTileClick = (index: number) => {
        if (!gameState || gameState.isGameOver) return;
        setGameState(engine.update(gameState, { type: 'MOVE', index }));
    };

    if (!gameState) return null;

    // We can animate the tiles by rendering them absolutely within a relative wrapper.
    // The exact position corresponds to their index on the 4x4 grid.

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-fuchsia-950 font-sans text-fuchsia-100">
            
            <div className="w-full max-w-sm flex justify-between items-end mb-6">
                <div>
                     <h1 className="text-3xl font-black tracking-widest text-fuchsia-400">15 PUZZLE</h1>
                     <p className="text-fuchsia-300 text-sm mt-1">Order tiles 1 to 15.</p>
                </div>
                <div className="text-right">
                     <span className="block text-2xl font-bold">{timer}s</span>
                     <span className="block text-sm text-fuchsia-400">{gameState.moves} Moves</span>
                </div>
            </div>

            <div className="relative w-full max-w-sm aspect-square bg-fuchsia-900 border-8 border-fuchsia-800 rounded-2xl p-2 shadow-2xl flex items-center justify-center">
                 
                 {/* The 4x4 Grid Container */}
                 <div className="relative w-full h-full">
                     {gameState.board.map((tileValue, index) => {
                          if (tileValue === 0) return null; // Don't render empty space explicitly, just leave a hole.

                          // Calculate coordinates
                          const row = Math.floor(index / 4);
                          const col = index % 4;

                          // 25% per cell
                          const top = `${row * 25}%`;
                          const left = `${col * 25}%`;

                          // Base style
                          const isCorrect = tileValue === index + 1; // It's in the right spot
                          
                            return (
                               <div 
                                   key={tileValue} // Crucial for layout animation matching
                                   onClick={() => handleTileClick(index)}
                                   className="absolute w-1/4 h-1/4 p-1 transition-all duration-200 ease-in-out cursor-pointer"
                                   style={{ top, left }}
                               >
                                   <div className={`w-full h-full rounded-xl flex items-center justify-center text-4xl font-black shadow-md border-b-4 
                                        ${isCorrect ? 'bg-fuchsia-500 border-fuchsia-700 text-white shadow-fuchsia-500/50' : 'bg-fuchsia-200 border-fuchsia-400 text-fuchsia-900'}
                                   `}>
                                        {tileValue}
                                   </div>
                               </div>
                          );
                     })}
                 </div>

                 {gameState.isGameOver && (
                     <div className="absolute inset-0 z-50 bg-fuchsia-950/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center animate-fade-in text-center p-4">
                          <h2 className="text-4xl font-black text-white mb-2">Solved!</h2>
                          <p className="text-fuchsia-300 mb-6 font-bold">Took {gameState.moves} moves in {timer} seconds.</p>
                          <button onClick={() => startGame()} className="px-8 py-3 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black tracking-widest uppercase rounded shadow-[0_4px_0_rgba(162,28,175,1)] active:shadow-none active:translate-y-1 transition-all">
                              Play Again
                          </button>
                     </div>
                 )}
            </div>

            <div className="mt-8">
                 <button onClick={() => startGame()} className="text-fuchsia-400 hover:text-white uppercase tracking-widest text-sm font-bold opacity-70 hover:opacity-100 transition-opacity">
                      Restart Puzzle
                 </button>
            </div>
            
        </div>
    );
}
