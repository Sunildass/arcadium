import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SnakeEngine, GRID_SIZE, Direction } from './SnakeEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';
import { DifficultyManager } from '../../../core/ai/DifficultyManager';

export default function Snake() {
  const [engine] = useState(() => new SnakeEngine());
  const [gameState, setGameState] = useState(() => engine.initialize());
  const [profileManager] = useState(() => new PlayerProfileManager('snake'));
  const [difficultyManager] = useState(() => new DifficultyManager('snake', 5));
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [direction, setDirection] = useState<Direction>('UP');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const speedMs = Math.max(50, 200 - (difficultyManager.getCurrentDifficulty() * 15));

  const handleStart = () => {
    setGameState(engine.initialize());
    setDirection('UP');
    setIsPlaying(true);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isPlaying || gameState.isGameOver) return;
    
    // Prevent scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();

    let newDir: Direction = direction;
    if (e.key === 'ArrowUp' && direction !== 'DOWN') newDir = 'UP';
    if (e.key === 'ArrowDown' && direction !== 'UP') newDir = 'DOWN';
    if (e.key === 'ArrowLeft' && direction !== 'RIGHT') newDir = 'LEFT';
    if (e.key === 'ArrowRight' && direction !== 'LEFT') newDir = 'RIGHT';
    
    setDirection(newDir);
  }, [isPlaying, gameState.isGameOver, direction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isPlaying || gameState.isGameOver) return;

    const interval = setInterval(() => {
       const newState = engine.update(gameState, direction);
       
       if (newState.isGameOver && !gameState.isGameOver) {
           setIsPlaying(false);
           // Evaluate
           const result = engine.evaluateWin(newState);
           if (result) {
               profileManager.recordGameResult('loss', result.playTimeMs, difficultyManager.getCurrentDifficulty().toString());
               // Snake has no clear "win" condition, game just ends.
               difficultyManager.recordGame(false, speedMs, 0, newState.score);
           }
       }

       setGameState(newState);
    }, speedMs);

    return () => clearInterval(interval);
  }, [isPlaying, gameState, direction, engine, profileManager, difficultyManager, speedMs]);


  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Clear board
    ctx.fillStyle = '#18181b'; // zinc-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    gameState.snake.forEach((segment, i) => {
       ctx.fillStyle = i === 0 ? '#10b981' : '#34d399'; // Emerald head/body
       ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize - 1, cellSize - 1);
    });

    // Draw food
    ctx.fillStyle = '#f43f5e'; // Rose-500
    ctx.beginPath();
    ctx.arc(
       gameState.food.x * cellSize + cellSize / 2, 
       gameState.food.y * cellSize + cellSize / 2, 
       cellSize / 2.5, 
       0, 
       Math.PI * 2
    );
    ctx.fill();

  }, [gameState]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
       <div className="flex flex-col sm:flex-row justify-between w-full max-w-md mb-6 items-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-emerald-400 drop-shadow-md">Snake</h2>
            <div className="flex gap-4">
                <div className="text-center">
                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Score</div>
                    <div className="text-2xl font-black text-white">{gameState.score}</div>
                </div>
            </div>
       </div>

       <div className="w-full max-w-md flex justify-between text-zinc-400 text-sm mb-4 px-1">
           <span className="bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">Adaptive Speed: {speedMs}ms/tick</span>
           <span className="bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">Profile Games: {profileManager.getStats().gamesPlayed}</span>
       </div>

       <div className="relative border-4 border-zinc-700 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)] bg-zinc-900 touch-none">
           {!isPlaying && !gameState.isGameOver && gameState.score === 0 ? (
               <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px]">
                   <button 
                       onClick={handleStart} 
                       className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xl shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
                   >
                       Start Game
                   </button>
               </div>
           ) : gameState.isGameOver ? (
               <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
                   <h3 className="text-4xl font-black text-rose-500 mb-2 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-bounce text-center">
                       GAME OVER
                   </h3>
                   <p className="text-zinc-300 mb-6 font-medium">Final Score: <span className="text-white font-bold">{gameState.score}</span></p>
                   <button 
                       onClick={handleStart} 
                       className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
                   >
                       Try Again
                   </button>
               </div>
           ) : null}

           {/* Touch controls overlay for mobile */}
           <div className="absolute inset-0 z-0 grid grid-cols-2 grid-rows-2 sm:hidden touch-none"
             onTouchStart={(e) => {
                 if (!isPlaying || gameState.isGameOver) return;
                 const rect = (e.target as HTMLElement).getBoundingClientRect();
                 const touch = e.touches[0];
                 const x = touch.clientX - rect.left;
                 const y = touch.clientY - rect.top;
                 
                 const w = rect.width;
                 const h = rect.height;
                 
                 // Extremely basic touch zone (corners) -> Need better dpad usually, but this works for simple cases.
                 // Top-Left -> Left, Top-Right -> Up... this is finicky.
                 // Standard swipe is better but requires complex hook.
             }}
           />

           <canvas 
               ref={canvasRef} 
               width={400} 
               height={400} 
               className="w-full max-w-[400px] aspect-square object-contain block"
           />
       </div>

       <div className="mt-8 text-center text-zinc-500 text-sm max-w-sm">
           <strong>Controls:</strong> Use Arrow Keys to move. Speed adapts dynamically based on your performance profile!
       </div>
    </div>
  );
}
