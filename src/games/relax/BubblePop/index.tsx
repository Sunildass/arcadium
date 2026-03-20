import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BubblePopEngine, BubblePopState, Bubble, COLORS } from './BubblePopEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

export default function BubblePop() {
  const [engine] = useState(() => new BubblePopEngine());
  const [gameState, setGameState] = useState<BubblePopState | null>(null);
  const [profileManager] = useState(() => new PlayerProfileManager('bubble-pop'));
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 second mode
  
  const requestRef = useRef<number | null>(null);

  const startGame = useCallback(() => {
    setGameState(engine.initialize());
    setIsPlaying(true);
    setTimeRemaining(60);
  }, [engine]);

  useEffect(() => {
      startGame();
      setIsPlaying(false);
  }, [startGame]);


  const createRipple = (x: number, y: number) => {
    const ripple = document.createElement('div');
    ripple.className = 'absolute rounded-full border-2 border-white/50 animate-ping pointer-events-none z-50';
    ripple.style.left = `${x - 20}px`;
    ripple.style.top = `${y - 20}px`;
    ripple.style.width = '40px';
    ripple.style.height = '40px';
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  };

  const popBubble = useCallback((id: string, e: React.MouseEvent | React.TouchEvent) => {
    if (!isPlaying || !gameState) return;
    e.preventDefault();

    // Visual pop effect (simple element injection)
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.type.includes('touch') ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const y = e.type.includes('touch') ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    
    createRipple(x, y);

    setGameState(prev => {
        if (!prev) return prev;
        const newState = engine.update(prev, id);
        return newState;
    });
  }, [isPlaying, gameState, engine]);


  // Game Tick
  const gameLoop = useCallback(() => {
    if (!isPlaying || !gameState) return;
    
    setGameState(prev => {
      if (!prev) return prev;
      return engine.update(prev, 'tick');
    });

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, gameState, engine]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, gameLoop]);

  // Timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
        setTimeRemaining(t => {
            if (t <= 1) {
                setIsPlaying(false);
                if (gameState) {
                    profileManager.recordGameResult('win', 60000, 'Easy'); // Just record time spent playing
                }
                return 0;
            }
            return t - 1;
        });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, gameState, profileManager]);

  if (!gameState) return null;

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full relative overflow-hidden">
       <div className="flex justify-between w-full max-w-4xl z-10 p-4 bg-zinc-900/80 backdrop-blur-md rounded-2xl shadow-lg border border-zinc-700/50 mb-4 h-24 items-center">
            
            <div className="flex flex-col items-start min-w-[120px]">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-xs shadow-sm">Score</span>
                <span className="text-4xl font-black text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,113,0.3)]">{gameState.score}</span>
            </div>

            <div className="flex flex-col items-center flex-1">
                 <h2 className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md pb-1 bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 text-transparent bg-clip-text">
                     Bubble Pop
                 </h2>
                 <p className="text-zinc-400 text-sm hidden sm:block">Relax and pop the bubbles!</p>
            </div>

            <div className="flex flex-col items-end min-w-[120px]">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-xs shadow-sm">Time</span>
                <span className="text-4xl font-black text-white drop-shadow-md font-mono">{timeRemaining}s</span>
            </div>
       </div>

       {/* Game Area */}
       <div className="relative w-full max-w-4xl flex-1 min-h-[500px] border border-zinc-700/50 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] bg-gradient-to-b from-zinc-900 to-zinc-800 touch-none">
           {!isPlaying && timeRemaining === 60 ? (
               <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                   <button 
                       onClick={startGame} 
                       className="px-8 py-4 bg-white hover:bg-zinc-200 text-zinc-900 rounded-full font-black text-2xl shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
                   >
                       Start Popping
                   </button>
               </div>
           ) : !isPlaying && timeRemaining <= 0 ? (
               <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
                   <h3 className={`text-6xl font-black mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] bg-gradient-to-t from-emerald-600 to-emerald-300 text-transparent bg-clip-text animate-bounce`}>
                       Relaxed
                   </h3>
                   <p className="text-2xl text-zinc-300 mb-6 font-medium">Popped <span className="text-rose-400 font-bold">{gameState.bubblesPopped}</span> Bubbles</p>
                   <button 
                       onClick={startGame} 
                       className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-black text-xl shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-zinc-600 transition-all hover:-translate-y-1 active:scale-95 uppercase tracking-widest"
                   >
                       Play Again
                   </button>
               </div>
           ) : null}

           {/* Bubbles */}
           {gameState.bubbles.map(bubble => {
                if (bubble.popped) return null;
                return (
                    <div 
                        key={bubble.id}
                        onMouseDown={(e) => popBubble(bubble.id, e)}
                        onTouchStart={(e) => popBubble(bubble.id, e)}
                        className={`absolute rounded-full cursor-pointer shadow-[inset_-5px_-5px_15px_rgba(0,0,0,0.2),0_5px_15px_rgba(0,0,0,0.4)] transition-transform active:scale-50 animate-float`}
                        style={{
                            left: `${bubble.x}%`,
                            bottom: `${bubble.y}%`,
                            width: `${bubble.radius * 2}px`,
                            height: `${bubble.radius * 2}px`,
                            backgroundColor: bubble.color,
                            opacity: 0.85,
                        }}
                    >
                        {/* Bubble shine effect */}
                        <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] bg-white rounded-full opacity-60 backdrop-blur-sm rotate-[-45deg]" />
                    </div>
                );
           })}
       </div>
    </div>
  );
}
