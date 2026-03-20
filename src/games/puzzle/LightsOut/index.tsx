import React, { useState, useEffect, useCallback } from 'react';
import { LightsOutEngine, LightsOutState } from './LightsOutEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

export default function LightsOut() {
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [engine, setEngine] = useState(() => new LightsOutEngine(difficulty));
    const [gameState, setGameState] = useState<LightsOutState | null>(null);
    const [profileManager] = useState(() => new PlayerProfileManager('lights-out'));

    const startGame = useCallback((diff?: 'Easy' | 'Medium' | 'Hard') => {
        const d = diff || difficulty;
        setDifficulty(d);
        const newEngine = new LightsOutEngine(d);
        setEngine(newEngine);
        setGameState(newEngine.initialize());
    }, [difficulty]);

    useEffect(() => {
        startGame();
    }, [startGame]);

    useEffect(() => {
        if (gameState?.isGameOver) {
            const result = engine.evaluateWin(gameState);
            if (result && result.winner) {
                 profileManager.recordGameResult('win', result.score, difficulty);
            }
        }
    }, [gameState?.isGameOver, gameState, profileManager, engine, difficulty]);


    const handleToggle = (r: number, c: number) => {
         if (!gameState || gameState.isGameOver) return;
         setGameState(engine.update(gameState, { type: 'TOGGLE', r, c }));
    };

    if (!gameState) return null;

    const gridClass = gameState.size === 4 ? 'grid-cols-4' : (gameState.size === 5 ? 'grid-cols-5' : 'grid-cols-6');

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-black font-sans text-cyan-100 relative overflow-hidden">
            
            {/* Cyberpunk Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-20"
                 style={{
                     backgroundImage: 'linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)',
                     backgroundSize: '40px 40px',
                     transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)'
                 }}
            />

            <div className="relative z-10 w-full max-w-lg mb-8 text-center flex flex-col items-center">
                 <h1 className="text-4xl md:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] mb-2 uppercase">Lights Out</h1>
                 <p className="text-cyan-600/80 mb-6 font-mono">Turn off all the lights to proceed.</p>
                 
                 <div className="flex justify-between w-full items-center bg-cyan-950/50 p-4 border border-cyan-800/50 rounded-xl backdrop-blur-md">
                      <select value={difficulty} onChange={e=>startGame(e.target.value as any)} className="bg-black/50 text-cyan-300 outline-none p-2 rounded border border-cyan-800 focus:border-cyan-400 font-mono tracking-widest uppercase text-sm">
                          <option value="Easy">4x4 Sector</option>
                          <option value="Medium">5x5 Sector</option>
                          <option value="Hard">6x6 Sector</option>
                      </select>
                      
                      <div className="font-mono text-cyan-400 text-lg">
                           Moves: <span className="font-bold text-white tracking-widest">{gameState.moves.toString().padStart(3, '0')}</span>
                      </div>
                 </div>
            </div>

            {/* The Main Grid */}
            <div className="relative z-10 w-full max-w-sm sm:max-w-md aspect-square bg-cyan-950/20 p-4 sm:p-6 rounded-3xl border border-cyan-900/40 backdrop-blur-lg shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                 <div className={`grid ${gridClass} gap-2 sm:gap-4 w-full h-full`}>
                      {gameState.grid.map((row, r) => 
                          row.map((isOn, c) => (
                              <button
                                  key={`${r}-${c}`}
                                  onClick={() => handleToggle(r, c)}
                                  className={`w-full h-full rounded-lg transition-all duration-300 focus:outline-none flex items-center justify-center
                                      ${isOn 
                                          ? 'bg-cyan-400 border border-cyan-200 scale-100' 
                                          : 'bg-black/60 border border-cyan-900/50 hover:bg-cyan-950 scale-95 hover:scale-100'
                                      }
                                  `}
                                  style={{
                                      boxShadow: isOn ? '0 0 20px rgba(34,211,238,0.6), inset 0 0 15px rgba(255,255,255,0.9)' : 'inset 0 0 10px rgba(0,0,0,0.8)'
                                  }}
                              >
                                   {/* Inner glow element for the ON state */}
                                   <div className={`w-1/2 h-1/2 rounded-full transition-opacity duration-300 bg-white ${isOn ? 'opacity-100 blur-[2px]' : 'opacity-0'}`} />
                              </button>
                          ))
                      )}
                 </div>

                 {/* Win Overlay */}
                 {gameState.isGameOver && (
                     <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center border border-cyan-500 shadow-[0_0_50px_rgba(34,211,238,0.3)]">
                          <h2 className="text-4xl text-cyan-400 font-black mb-2 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">System offline.</h2>
                          <p className="text-cyan-600 font-mono mb-8">Protocol resolved in {gameState.moves} operations.</p>
                          <button onClick={() => startGame()} className="px-8 py-3 bg-cyan-950 border border-cyan-400 hover:bg-cyan-900 text-cyan-300 hover:text-cyan-100 font-mono tracking-widest uppercase rounded shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all">
                              Reboot System
                          </button>
                     </div>
                 )}
            </div>

            <div className="relative z-10 mt-12 text-center text-cyan-800 font-mono max-w-sm text-sm p-4 bg-cyan-950/30 rounded border border-cyan-900/30">
                 Clicking any light toggles it and its adjacent neighbors (up, down, left, right).
            </div>
            
        </div>
    );
}
