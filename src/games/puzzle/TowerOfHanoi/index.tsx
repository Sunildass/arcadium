import React, { useState, useEffect, useCallback } from 'react';
import { HanoiEngine, HanoiState } from './HanoiEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

export default function TowerOfHanoi() {
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [engine, setEngine] = useState(() => new HanoiEngine(difficulty));
    const [gameState, setGameState] = useState<HanoiState | null>(null);
    const [timer, setTimer] = useState<number>(0);
    const [profileManager] = useState(() => new PlayerProfileManager('tower-of-hanoi'));
    
    const [selectedPeg, setSelectedPeg] = useState<number | null>(null);

    const startGame = useCallback((diff?: 'Easy' | 'Medium' | 'Hard') => {
        const d = diff || difficulty;
        setDifficulty(d);
        const newEngine = new HanoiEngine(d);
        setEngine(newEngine);
        setGameState(newEngine.initialize());
        setSelectedPeg(null);
        setTimer(0);
    }, [difficulty]);

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

    useEffect(() => {
        if (gameState?.isGameOver) {
            const result = engine.evaluateWin(gameState);
            if (result && result.winner) {
                 profileManager.recordGameResult('win', result.score, difficulty);
            }
        }
    }, [gameState?.isGameOver, gameState, profileManager, engine, difficulty]);

    const handlePegClick = (pegIndex: number) => {
         if (!gameState || gameState.isGameOver) return;

         if (selectedPeg === null) {
              // Select from
              if (gameState.towers[pegIndex].length > 0) {
                   setSelectedPeg(pegIndex);
              }
         } else {
              // Move to
              if (selectedPeg === pegIndex) {
                   setSelectedPeg(null); // Deselect
              } else {
                   const fromTower = gameState.towers[selectedPeg];
                   const diskInfo = fromTower[fromTower.length - 1];
                   const toTower = gameState.towers[pegIndex];
                   
                   if (toTower.length === 0 || toTower[toTower.length - 1] > diskInfo) {
                       setGameState(engine.update(gameState, { type: 'MOVE', from: selectedPeg, to: pegIndex }));
                   }
                   setSelectedPeg(null);
              }
         }
    };

    if (!gameState) return null;

    const baseWidth = 100;
    const colors = [
        'bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 
        'bg-yellow-400', 'bg-orange-500', 'bg-red-500', 'bg-pink-500'
    ]; // Up to 7 for Hard

    const optimalMoves = Math.pow(2, gameState.totalDisks) - 1;

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-indigo-950 font-sans text-indigo-100">
            
            <div className="w-full max-w-4xl flex justify-between items-center mb-8 bg-indigo-900/50 p-4 rounded-xl shadow-lg border border-indigo-800">
                <div>
                     <h1 className="text-3xl font-black tracking-widest text-indigo-300 drop-shadow-md">Tower of Hanoi</h1>
                     <p className="text-indigo-400 text-sm mt-1">Move all disks to the third peg.</p>
                </div>
                
                <div className="flex gap-6 items-center">
                     <select value={difficulty} onChange={e=>startGame(e.target.value as any)} className="bg-indigo-800 text-indigo-200 outline-none p-2 rounded shadow-inner border border-indigo-700">
                         <option value="Easy">Easy (3 Disks)</option>
                         <option value="Medium">Medium (5 Disks)</option>
                         <option value="Hard">Hard (7 Disks)</option>
                     </select>
                     
                     <div className="text-right flex gap-4">
                         <div className="bg-indigo-800 px-4 py-2 rounded shadow-inner text-center min-w-[80px]">
                              <span className="block text-xs uppercase text-indigo-400 font-bold mb-1">Time</span>
                              <span className="block text-xl font-bold">{timer}s</span>
                         </div>
                         <div className="bg-indigo-800 px-4 py-2 rounded shadow-inner text-center min-w-[80px]">
                              <span className="block text-xs uppercase text-indigo-400 font-bold mb-1">Moves</span>
                              <span className={`block text-xl font-bold ${gameState.movesCount > optimalMoves ? 'text-orange-400' : 'text-white'}`}>
                                  {gameState.movesCount}
                              </span>
                         </div>
                     </div>
                </div>
            </div>

            {/* The Game Board */}
            <div className="relative w-full max-w-4xl h-96 flex items-end justify-between px-8 bg-indigo-900/30 rounded-3xl border-b-[16px] border-indigo-900 shadow-[inset_0_-20px_50px_rgba(0,0,0,0.5)] pt-12">
                 
                 {/* 3 Pegs */}
                 {[0, 1, 2].map((pegIndex) => (
                      <div 
                          key={pegIndex} 
                          className="relative flex flex-col-reverse items-center justify-start w-1/3 h-full cursor-pointer group"
                          onClick={() => handlePegClick(pegIndex)}
                      >
                           {/* Peg Pole */}
                           <div className={`absolute bottom-0 w-4 h-[80%] rounded-t-full transition-colors z-0
                               ${selectedPeg === pegIndex ? 'bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)]' : 'bg-indigo-800 group-hover:bg-indigo-600'}
                           `} />
                           
                           {/* Disks on this peg */}
                           {gameState.towers[pegIndex].map((diskSize, idx) => {
                                const isTop = idx === gameState.towers[pegIndex].length - 1;
                                const isSelected = selectedPeg === pegIndex && isTop;
                                
                                // Calculate width based on max size (100% bounds)
                                const widthPct = 30 + (diskSize / 7) * 60; // Scale 30% to 90%
                                
                                return (
                                     <div 
                                         key={diskSize}
                                         className={`relative z-10 h-8 rounded-full mb-1 transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
                                             ${colors[diskSize - 1]} 
                                             ${isSelected ? '-translate-y-8 scale-105 shadow-[0_15px_30px_rgba(0,0,0,0.5),_inset_0_4px_6px_rgba(255,255,255,0.4)]' : 'shadow-[0_4px_6px_rgba(0,0,0,0.4),_inset_0_4px_6px_rgba(255,255,255,0.3)]'}
                                             border-b-4 border-black/20
                                         `}
                                         style={{ 
                                             width: `${widthPct}%`,
                                         }}
                                     />
                                );
                           })}

                           {/* Hitbox enhancer */}
                           <div className="absolute inset-0 z-20" />
                      </div>
                 ))}

                 {/* Win Overlay */}
                 {gameState.isGameOver && (
                     <div className="absolute inset-0 z-50 bg-indigo-950/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center animate-fade-in text-center shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                          <h2 className="text-6xl font-black text-white mb-4 drop-shadow-xl text-emerald-400">Complete!</h2>
                          
                          <div className="bg-black/40 p-6 rounded-xl border border-white/10 mb-8 max-w-md w-full">
                               <div className="flex justify-between items-center mb-2">
                                   <span className="text-indigo-300 font-bold uppercase tracking-wide">Time:</span>
                                   <span className="text-2xl font-black text-white">{timer}s</span>
                               </div>
                               <div className="flex justify-between items-center mb-2">
                                   <span className="text-indigo-300 font-bold uppercase tracking-wide">Moves:</span>
                                   <span className="text-2xl font-black text-white">{gameState.movesCount}</span>
                               </div>
                               <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-2">
                                   <span className="text-indigo-300 font-bold uppercase tracking-wide">Optimal Moves:</span>
                                   <span className="text-xl font-black text-emerald-400">{optimalMoves}</span>
                               </div>
                          </div>

                          <button onClick={() => startGame()} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black tracking-widest uppercase rounded-full shadow-[0_10px_30px_rgba(79,70,229,0.5)] hover:shadow-[0_15px_40px_rgba(79,70,229,0.7)] hover:-translate-y-1 transition-all active:translate-y-0 text-xl border border-indigo-400">
                              Play Again
                          </button>
                     </div>
                 )}
            </div>

            <div className="mt-12 text-center text-indigo-400 max-w-lg">
                <p className="font-bold mb-2 uppercase tracking-widest text-sm">Rules</p>
                <p className="text-sm opacity-80 leading-relaxed">Only one disk may be moved at a time. Each move consists of taking the upper disk from one of the stacks and placing it on top of another stack or on an empty rod. No larger disk may be placed on top of a smaller disk.</p>
            </div>
            
        </div>
    );
}
