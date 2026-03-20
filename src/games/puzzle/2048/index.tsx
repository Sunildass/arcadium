import React, { useState, useEffect, useCallback } from 'react';
import { Engine2048 } from './Engine2048';
import { State2048, Direction } from './types';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

export default function Game2048() {
  const [engine] = useState(() => new Engine2048());
  const [gameState, setGameState] = useState<State2048>(() => engine.initialize());
  const [profileManager] = useState(() => new PlayerProfileManager('2048'));

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) > -1
      ) {
        e.preventDefault();
      }

      let direction: Direction | null = null;
      if (e.key === 'ArrowUp') direction = 'UP';
      else if (e.key === 'ArrowDown') direction = 'DOWN';
      else if (e.key === 'ArrowLeft') direction = 'LEFT';
      else if (e.key === 'ArrowRight') direction = 'RIGHT';

      if (direction) {
        const newState = engine.update(gameState, direction);
        if (newState.grid !== gameState.grid) {
            setGameState({ ...newState });
        }
      }
    },
    [gameState, engine]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleNewGame = () => {
    setGameState(engine.initialize());
  };

  useEffect(() => {
    if (gameState.isGameOver) {
      profileManager.recordGameResult('loss', 0, 'Medium');
    }
    // We record win instantly at 2048, but allow continuing
    if (gameState.hasWon && !gameState.gameWonAcknowledged) {
         profileManager.recordGameResult('win', 0, 'Medium');
         setGameState(prev => ({...prev, gameWonAcknowledged: true}));
    }
  }, [gameState.isGameOver, gameState.hasWon]);


  const getTileColor = (val: number | null) => {
    if (val === null) return 'bg-zinc-800 bg-opacity-40';
    switch (val) {
      case 2: return 'bg-zinc-200 text-zinc-900 shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)]';
      case 4: return 'bg-stone-200 text-zinc-900 shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)]';
      case 8: return 'bg-orange-300 text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] text-shadow';
      case 16: return 'bg-orange-500 text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] text-shadow';
      case 32: return 'bg-red-400 text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] text-shadow';
      case 64: return 'bg-red-600 text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] text-shadow';
      case 128: return 'bg-yellow-400 text-white shadow-[0_0_10px_rgba(250,204,21,0.5),inset_0_-4px_0_rgba(0,0,0,0.2)] text-shadow-sm';
      case 256: return 'bg-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.6),inset_0_-4px_0_rgba(0,0,0,0.2)] text-shadow-sm';
      case 512: return 'bg-yellow-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.7),inset_0_-4px_0_rgba(0,0,0,0.2)] text-shadow-sm';
      case 1024: return 'bg-yellow-600 text-white shadow-[0_0_25px_rgba(202,138,4,0.8),inset_0_-4px_0_rgba(0,0,0,0.2)] text-shadow-md';
      case 2048: return 'bg-yellow-600 text-white shadow-[0_0_30px_rgba(202,138,4,1),inset_0_-4px_0_rgba(0,0,0,0.2)] text-shadow-lg ring-4 ring-yellow-300';
      default: return 'bg-zinc-900 text-white shadow-[0_0_40px_rgba(255,255,255,0.5),inset_0_-4px_0_rgba(0,0,0,0.4)] text-shadow-lg'; // > 2048
    }
  };

  const getFontSize = (val: number | null) => {
      if (!val) return 'text-3xl';
      if (val < 100) return 'text-4xl sm:text-5xl';
      if (val < 1000) return 'text-3xl sm:text-4xl';
      return 'text-2xl sm:text-3xl';
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="flex justify-between w-full max-w-sm mb-6 items-center">
        <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">2048</h2>
        <div className="flex gap-2">
            <div className="bg-zinc-800 rounded-lg p-2 text-center min-w-[80px] border border-zinc-700 shadow-inner">
                <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Score</div>
                <div className="text-xl font-bold text-white">{gameState.score}</div>
            </div>
             <button 
                onClick={handleNewGame}
                className="bg-indigo-600 hover:bg-indigo-500 rounded-lg px-4 font-bold text-white shadow text-sm transition-colors uppercase tracking-wider h-full"
            >
                New
            </button>
        </div>
      </div>
      
       <div className="w-full max-w-sm text-zinc-400 text-sm mb-4 px-1">
           Join the numbers and get to the <strong>2048 tile!</strong>
       </div>

      <div className="relative bg-zinc-700/50 backdrop-blur-sm p-3 rounded-2xl shadow-2xl border border-zinc-600/30 overflow-hidden touch-none">
          {/* Game Over / Win Overlay */}
          {(gameState.isGameOver || (gameState.hasWon && !gameState.gameWonAcknowledged)) && (
              <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center backdrop-blur-sm rounded-2xl animate-fade-in">
                  <h3 className={`text-5xl font-black mb-4 ${gameState.hasWon ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'text-zinc-100'}`}>
                      {gameState.hasWon ? 'You Win!' : 'Game Over'}
                  </h3>
                   <button 
                        onClick={() => gameState.hasWon && !gameState.isGameOver ? setGameState(prev => ({...prev, gameWonAcknowledged: true})) : handleNewGame()}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white shadow-xl transition-transform active:scale-95"
                    >
                        {gameState.hasWon && !gameState.isGameOver ? 'Keep Playing' : 'Try Again'}
                    </button>
              </div>
          )}

          <div className="grid grid-cols-4 gap-2 sm:gap-3 relative z-0">
             {gameState.grid.map((row, r) => (
               row.map((cell, c) => (
                  <div 
                    key={`${r}-${c}`}
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-800/40 rounded-xl flex items-center justify-center overflow-hidden"
                  >
                     {cell !== null && (
                         <div className={`w-full h-full rounded-xl flex items-center justify-center font-black transition-all transform scale-in duration-150 ease-out
                         ${getTileColor(cell)} ${getFontSize(cell)}`}>
                             {cell}
                         </div>
                     )}
                  </div>
               ))
             ))}
          </div>
      </div>
      
      <p className="mt-8 text-zinc-500 text-sm text-center">
          <strong>HOW TO PLAY:</strong> Use your <strong>arrow keys</strong> to move the tiles. Tiles with the same number merge into one when they touch. Add them up to reach <strong>2048!</strong>
      </p>
    </div>
  );
}
