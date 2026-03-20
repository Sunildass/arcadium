import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BreakoutEngine, BreakoutState } from './BreakoutEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

export default function Breakout() {
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [engine] = useState(() => new BreakoutEngine('Medium'));
    const [gameState, setGameState] = useState<BreakoutState | null>(null);
    const [profileManager] = useState(() => new PlayerProfileManager('breakout'));
    
    // Use refs heavily for requestAnimationFrame game loops to avoid constant re-renders choking physics
    const stateRef = useRef<BreakoutState | null>(null);
    const engineRef = useRef(engine);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const lastTickRef = useRef<number>(0);
    const activeDifficulty = useRef(difficulty);

    const startGame = useCallback((diff?: 'Easy' | 'Medium' | 'Hard') => {
        const d = diff || activeDifficulty.current;
        setDifficulty(d);
        activeDifficulty.current = d;
        const newEngine = new BreakoutEngine(d);
        engineRef.current = newEngine;
        
        const initial = newEngine.initialize();
        stateRef.current = initial;
        setGameState(initial);
        lastTickRef.current = performance.now();
    }, []);

    useEffect(() => {
        startGame();
        return () => cancelAnimationFrame(rafRef.current);
    }, [startGame]);

    // Handle score tracking
    useEffect(() => {
        if (gameState?.isGameOver && engineRef.current) {
             const result = engineRef.current.evaluateWin(gameState);
             if (result) {
                  profileManager.recordGameResult(gameState.hasWon ? 'win' : 'loss', result.score, difficulty);
             }
        }
    }, [gameState?.isGameOver, gameState, profileManager, difficulty]);

    // Input handlers
    useEffect(() => {
         const handleMouseMove = (e: MouseEvent) => {
              if (!stateRef.current || stateRef.current.isPaused || stateRef.current.isGameOver) return;
              const canvas = canvasRef.current;
              if (!canvas) return;

              const rect = canvas.getBoundingClientRect();
              
              // Map mouse X to virtual canvas X
              const scaleX = engineRef.current.width / rect.width;
              let x = (e.clientX - rect.left) * scaleX;
              
              const pW = stateRef.current.paddle.width;
              // Center paddle on mouse
              x = x - pW / 2;

              stateRef.current = engineRef.current.update(stateRef.current, { type: 'MOVE_PADDLE', x });
         };

         const handleClick = () => {
              if (!stateRef.current || stateRef.current.isGameOver) return;
              if (stateRef.current.isPaused) {
                  stateRef.current = engineRef.current.update(stateRef.current, { type: 'TOGGLE_PAUSE' });
                  setGameState(stateRef.current);
              }
         };

         window.addEventListener('mousemove', handleMouseMove);
         window.addEventListener('click', handleClick);
         
         return () => {
             window.removeEventListener('mousemove', handleMouseMove);
             window.removeEventListener('click', handleClick);
         };
    }, []);

    // Main Game Loop
    const tick = useCallback((time: number) => {
         if (!stateRef.current) return;

         const delta = time - lastTickRef.current;
         
         // Only tick physics if unpaused and not dead
         if (!stateRef.current.isPaused && !stateRef.current.isGameOver) {
              // We run fixed physics steps regardless of delta to prevent wall clipping,
              // but we sync React state periodically so the UI can update scores
              stateRef.current = engineRef.current.update(stateRef.current, { type: 'TICK', deltaMs: delta });
         }

         setGameState(stateRef.current);
         renderCanvas(stateRef.current, engineRef.current.width, engineRef.current.height);
         
         lastTickRef.current = time;
         rafRef.current = requestAnimationFrame(tick);
    }, []);

    useEffect(() => {
         rafRef.current = requestAnimationFrame(tick);
         return () => cancelAnimationFrame(rafRef.current);
    }, [tick]);

    const renderCanvas = (state: BreakoutState, w: number, h: number) => {
         const canvas = canvasRef.current;
         if (!canvas) return;
         const ctx = canvas.getContext('2d');
         if (!ctx) return;

         // Clear
         ctx.fillStyle = '#18181b'; // zinc-900 bg
         ctx.fillRect(0, 0, w, h);

         // Draw Bricks
         state.bricks.forEach(b => {
             if (b.status === 'active') {
                 // Inner block
                 ctx.fillStyle = b.color;
                 ctx.fillRect(b.x, b.y, b.width, b.height);
                 
                 // Highlights for 3D retro look
                 ctx.fillStyle = 'rgba(255,255,255,0.4)';
                 ctx.fillRect(b.x, b.y, b.width, 2); // top shine
                 ctx.fillStyle = 'rgba(0,0,0,0.4)';
                 ctx.fillRect(b.x, b.y + b.height - 2, b.width, 2); // bottom shadow
             }
         });

         // Draw Paddle
         ctx.fillStyle = '#e4e4e7'; // zinc-200
         ctx.beginPath();
         // rounded edges
         ctx.roundRect(state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height, 8);
         ctx.fill();

         // Draw Ball
         ctx.fillStyle = '#fff';
         ctx.beginPath();
         ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
         ctx.fill();

         // Glow on ball
         ctx.shadowBlur = 10;
         ctx.shadowColor = '#fff';
         ctx.fill();
         ctx.shadowBlur = 0; // reset
    };

    if (!gameState) return null;

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-zinc-950 font-sans text-zinc-100">
            
            <div className="w-full max-w-4xl flex justify-between items-center mb-6 px-4">
                 <div>
                     <h1 className="text-4xl font-black tracking-widest text-zinc-200 uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Breakout</h1>
                     <div className="flex gap-4 mt-2 font-mono font-bold text-zinc-400">
                          <span>SCORE: {gameState.score}</span>
                          <span className="text-red-400">LIVES: {'❤'.repeat(gameState.lives)}</span>
                     </div>
                 </div>
                 
                 <select 
                     value={difficulty} 
                     onChange={e=>{
                         startGame(e.target.value as any);
                     }} 
                     className="bg-zinc-800 border border-zinc-600 outline-none p-2 rounded shadow text-sm uppercase tracking-widest font-bold"
                 >
                     <option value="Easy">Standard</option>
                     <option value="Medium">Arcade</option>
                     <option value="Hard">Extreme</option>
                 </select>
            </div>

            {/* The Arcade Cabinet Output */}
            <div className="relative w-full max-w-4xl aspect-[4/3] bg-zinc-900 border-[12px] border-zinc-800 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.9),_inset_0_0_50px_rgba(0,0,0,0.8)] overflow-hidden cursor-none">
                 
                 <canvas 
                     ref={canvasRef}
                     width={engine.width}
                     height={engine.height}
                     className="w-full h-full object-contain pointer-events-none"
                 />

                 {/* CRT Scanline overlay effect */}
                 <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

                 {/* Paused Overlay */}
                 {gameState.isPaused && !gameState.isGameOver && (
                     <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center pointer-events-none animate-pulse">
                          <p className="text-2xl font-black uppercase tracking-widest text-white">Click anywhere to launch</p>
                     </div>
                 )}

                 {/* Game Over Overlay */}
                 {gameState.isGameOver && (
                     <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto">
                          <h2 className={`text-6xl font-black mb-4 uppercase tracking-[0.2em] animate-pulse ${gameState.hasWon ? 'text-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]' : 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]'}`}>
                              {gameState.hasWon ? 'VICTORY' : 'GAME OVER'}
                          </h2>
                          <div className="text-xl font-mono text-zinc-300 mb-8 border border-zinc-700 p-4 rounded bg-zinc-900/50">
                               Final Score: <span className="font-bold text-white tracking-widest">{gameState.score}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); startGame(); }} className="px-10 py-4 bg-zinc-200 hover:bg-white text-zinc-900 font-black uppercase tracking-widest text-xl rounded shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all">
                              Play Again
                          </button>
                     </div>
                 )}

            </div>
            
        </div>
    );
}
