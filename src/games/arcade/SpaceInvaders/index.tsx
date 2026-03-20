import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SpaceInvadersEngine, SpaceInvadersState, Alien } from './SpaceInvadersEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

export default function SpaceInvaders() {
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [engine] = useState(() => new SpaceInvadersEngine('Medium'));
    const [gameState, setGameState] = useState<SpaceInvadersState | null>(null);
    const [profileManager] = useState(() => new PlayerProfileManager('space-invaders'));
    
    const stateRef = useRef<SpaceInvadersState | null>(null);
    const engineRef = useRef(engine);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const lastTickRef = useRef<number>(0);
    const activeDifficulty = useRef(difficulty);

    const keysMap = useRef<{ [k: string]: boolean }>({});

    const startGame = useCallback((diff?: 'Easy' | 'Medium' | 'Hard') => {
        const d = diff || activeDifficulty.current;
        setDifficulty(d);
        activeDifficulty.current = d;
        const newEngine = new SpaceInvadersEngine(d);
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

    useEffect(() => {
         const handleKeyDown = (e: KeyboardEvent) => {
              const key = e.key.toLowerCase();
              keysMap.current[key] = true;
              
              if ([' ', 'enter', 'arrowleft', 'arrowright', 'a', 'd'].includes(key)) {
                  // Prevent default scrolling for game controls
                  if (e.key === ' ' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      e.preventDefault();
                  }
              }
              
              if (key === ' ' || key === 'enter') {
                  if (!stateRef.current || stateRef.current.isGameOver) return;
                  if (stateRef.current.isPaused) {
                       stateRef.current = engineRef.current.update(stateRef.current, { type: 'TOGGLE_PAUSE' });
                       setGameState(stateRef.current); // Force UI render on unpause
                  } else {
                       stateRef.current = engineRef.current.update(stateRef.current, { type: 'SHOOT' });
                  }
              }
         };

         const handleKeyUp = (e: KeyboardEvent) => {
              keysMap.current[e.key.toLowerCase()] = false;
         };

         window.addEventListener('keydown', handleKeyDown);
         window.addEventListener('keyup', handleKeyUp);

         return () => {
             window.removeEventListener('keydown', handleKeyDown);
             window.removeEventListener('keyup', handleKeyUp);
         };
    }, []);

    // Main Game Loop
    const tick = useCallback((time: number) => {
         if (!stateRef.current) return;

         const delta = time - lastTickRef.current;
         lastTickRef.current = time;
         
         if (!stateRef.current.isPaused && !stateRef.current.isGameOver) {
              
              // Handle Movement Input Reading
              let dx = 0;
              if (keysMap.current['a'] || keysMap.current['arrowleft']) dx = -1;
              if (keysMap.current['d'] || keysMap.current['arrowright']) dx = 1;
              if ((keysMap.current['a'] || keysMap.current['arrowleft']) && 
                  (keysMap.current['d'] || keysMap.current['arrowright'])) dx = 0;

              stateRef.current = engineRef.current.update(stateRef.current, { type: 'MOVE_PLAYER', dx });
              stateRef.current = engineRef.current.update(stateRef.current, { type: 'TICK', deltaMs: Math.min(delta, 50) }); // Cap delta to prevent collision physics clipping on lag spikes
         }

         setGameState(stateRef.current); // Force React render for overlays (cheap if ref unchanged structurally? We mutate clone in engine so it re-renders. Actually better to just draw and not setState on every frame, but we need React for UI overlay, so we'll do both.)
         renderCanvas(stateRef.current, engineRef.current.width, engineRef.current.height, time);
         
         rafRef.current = requestAnimationFrame(tick);
    }, []);

    useEffect(() => {
         rafRef.current = requestAnimationFrame(tick);
         return () => cancelAnimationFrame(rafRef.current);
    }, [tick]);

    const renderCanvas = (state: SpaceInvadersState, w: number, h: number, timeMs: number) => {
         const canvas = canvasRef.current;
         if (!canvas) return;
         const ctx = canvas.getContext('2d');
         if (!ctx) return;

         // Retro CRT Background
         ctx.fillStyle = '#050510';
         ctx.fillRect(0, 0, w, h);

         // Starfield effect (pseudo-random based on coords so it's stable)
         ctx.fillStyle = '#ffffff';
         for(let i=0; i<50; i++) {
             const sy = (i * 27 + timeMs * 0.05) % h;
             const sx = (i * 137) % w;
             ctx.globalAlpha = Math.sin(timeMs / 1000 + i) * 0.5 + 0.5;
             ctx.fillRect(sx, sy, 2, 2);
         }
         ctx.globalAlpha = 1.0;

         // Draw Shields
         ctx.fillStyle = '#22c55e'; // Green shields
         state.shields.forEach(sh => {
             ctx.fillRect(sh.x, sh.y, sh.width, sh.height);
         });

         // Draw Projectiles
         state.projectiles.forEach(p => {
             ctx.fillStyle = p.owner === 'player' ? '#fde047' : '#ef4444'; // Yellow player, Red alien
             ctx.fillRect(p.x, p.y, p.width, p.height);
         });

         // Animation state toggle (every 500ms based on time)
         const animFrame = Math.floor(timeMs / 500) % 2 === 0;

         // Draw Player Ship (Base)
         ctx.fillStyle = '#3b82f6'; // Blue base
         
         const px = state.player.x;
         const py = state.player.y;
         const pw = state.player.width;
         const ph = state.player.height;

         // Simple stylized draw
         ctx.fillRect(px, py + ph - 8, pw, 8); // base
         ctx.fillRect(px + 10, py + ph - 16, pw - 20, 8); // mid
         ctx.fillRect(px + 18, py, 4, ph - 16); // nozzle

         // Draw Aliens
         state.aliens.forEach((a: Alien) => {
             ctx.fillStyle = '#eab308'; // Default yellow

             const ax = a.x;
             const ay = a.y;
             const aw = a.width;
             const ah = a.height;
             
             // Different colors based on type
             if (a.type === 'squid') ctx.fillStyle = '#ec4899'; // Pink
             else if (a.type === 'crab') ctx.fillStyle = '#06b6d4'; // Cyan
             else ctx.fillStyle = '#84cc16'; // Lime green octopus

             ctx.fillRect(ax + 4, ay, aw - 8, ah - 8); // body
             
             // Draw legs based on animFrame
             if (animFrame) {
                 ctx.fillRect(ax, ay + ah - 8, 4, 8);
                 ctx.fillRect(ax + aw - 4, ay + ah - 8, 4, 8);
                 ctx.fillRect(ax + 10, ay + ah - 8, 4, 8);
                 ctx.fillRect(ax + aw - 14, ay + ah - 8, 4, 8);
             } else {
                 ctx.fillRect(ax + 4, ay + ah - 8, 4, 8);
                 ctx.fillRect(ax + aw - 8, ay + ah - 8, 4, 8);
             }
             
             // Eyes
             ctx.fillStyle = '#050510'; // BG color for holes
             ctx.fillRect(ax + 8, ay + 4, 4, 4);
             ctx.fillRect(ax + aw - 12, ay + 4, 4, 4);
         });
    };

    if (!gameState) return null;

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-stone-950 font-sans text-stone-100 relative overflow-hidden">
            
            <div className="w-full max-w-4xl flex justify-between items-center mb-6 px-4 z-10 relative">
                 <div>
                     <h1 className="text-4xl font-black tracking-widest text-[#06b6d4] uppercase drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] font-mono">Invaders</h1>
                     <div className="flex gap-6 mt-2 font-mono font-bold text-stone-400">
                          <span className="text-[#eab308]">SCORE: {gameState.score.toString().padStart(5, '0')}</span>
                          <span className="text-[#ef4444]">LIVES: {'❤'.repeat(gameState.lives)}</span>
                     </div>
                 </div>
                 
                 <select 
                     value={difficulty} 
                     onChange={e=>{
                         startGame(e.target.value as any);
                     }} 
                     className="bg-stone-900 border border-[#06b6d4] outline-none p-2 rounded shadow text-sm uppercase tracking-widest font-bold font-mono text-[#06b6d4]"
                 >
                     <option value="Easy">Easy</option>
                     <option value="Medium">Arcade</option>
                     <option value="Hard">Hardcore</option>
                 </select>
            </div>

            {/* The CRT Output */}
            <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#050510] border-[16px] border-stone-800 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,1),_inset_0_0_80px_rgba(6,182,212,0.1)] overflow-hidden z-10">
                 
                 <canvas 
                     ref={canvasRef}
                     width={engine.width}
                     height={engine.height}
                     className="w-full h-full object-contain pointer-events-none"
                 />

                 {/* Authentic CRT CRT Scanline overlay effect */}
                 <div className="absolute inset-0 pointer-events-none opacity-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
                 
                 {/* Vignette */}
                 <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]" />

                 {/* Paused Overlay */}
                 {gameState.isPaused && !gameState.isGameOver && (
                     <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center pointer-events-none text-center">
                          <h2 className="text-4xl font-black uppercase tracking-widest text-[#eab308] font-mono animate-pulse drop-shadow-[0_0_10px_rgba(234,179,8,1)]">INSERT COIN</h2>
                          <p className="text-[#06b6d4] mt-8 font-mono tracking-[0.3em] font-bold">PRESS SPACE TO START</p>
                          <p className="text-stone-500 mt-2 font-mono text-sm">Arrows / A,D to move</p>
                     </div>
                 )}

                 {/* Game Over Overlay */}
                 {gameState.isGameOver && (
                     <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto">
                          <h2 className={`text-6xl font-black mb-4 uppercase tracking-[0.2em] font-mono animate-pulse ${gameState.hasWon ? 'text-[#22c55e] drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]' : 'text-[#ef4444] drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]'}`}>
                              {gameState.hasWon ? 'VICTORY' : 'GAME OVER'}
                          </h2>
                          <div className="text-2xl font-mono text-stone-300 mb-8 border-2 border-stone-700 p-4 bg-stone-900/50">
                               HI-SCORE: <span className="font-bold text-white tracking-widest">{gameState.score*10}</span>
                          </div>
                          <button onClick={() => startGame()} className="px-10 py-4 border-2 border-[#06b6d4] bg-[#06b6d4]/10 hover:bg-[#06b6d4] hover:text-stone-900 text-[#06b6d4] font-black uppercase tracking-widest text-xl rounded shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all font-mono">
                              RESTART SYS
                          </button>
                     </div>
                 )}

            </div>
            
            {/* Mobile Controls (Hidden on desktop via css ideally, but inline for now as fallback) */}
            <div className="mt-8 flex gap-8 z-10 md:hidden font-mono">
                 <div className="flex gap-2">
                     <button className="w-16 h-16 bg-stone-800 active:bg-stone-700 rounded-full border-b-4 border-stone-600 text-2xl" onPointerDown={()=>keysMap.current['a']=true} onPointerUp={()=>keysMap.current['a']=false}>⬅️</button>
                     <button className="w-16 h-16 bg-stone-800 active:bg-stone-700 rounded-full border-b-4 border-stone-600 text-2xl" onPointerDown={()=>keysMap.current['d']=true} onPointerUp={()=>keysMap.current['d']=false}>➡️</button>
                 </div>
                 <button className="w-24 h-16 bg-red-900 active:bg-red-700 rounded-full border-b-4 border-red-800 text-white font-black tracking-widest" onPointerDown={()=>{
                     if (!stateRef.current) return;
                     if (stateRef.current.isPaused) startGame();
                     else keysMap.current[' ']=true;
                 }} onPointerUp={()=>keysMap.current[' ']=false}>FIRE</button>
            </div>

        </div>
    );
}
