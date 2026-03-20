import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PongEngine, PongState, PongInput, CANVAS_HEIGHT, CANVAS_WIDTH, PADDLE_HEIGHT, PADDLE_WIDTH, BALL_SIZE, WIN_SCORE } from './PongEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';
import { DifficultyManager } from '../../../core/ai/DifficultyManager';

type GameMode = '1P' | '2P';

export default function Pong() {
  const [mode, setMode] = useState<GameMode>('1P');
  const [difficultyManager] = useState(() => new DifficultyManager('pong', 5));
  const [profileManager] = useState(() => new PlayerProfileManager('pong'));
  
  const [engine, setEngine] = useState(() => new PongEngine(mode, difficultyManager.getCurrentDifficulty()));
  const [gameState, setGameState] = useState<PongState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);

  const keys = useRef<{ [key: string]: boolean }>({});

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keys.current[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keys.current[e.code] = false;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Restart handler
  const handleStart = useCallback(() => {
    const newEngine = new PongEngine(mode, mode === '1P' ? difficultyManager.getCurrentDifficulty() : 5);
    setEngine(newEngine);
    setGameState(newEngine.initialize());
    setIsPlaying(true);
  }, [mode, difficultyManager]);

  useEffect(() => {
      handleStart();
      setIsPlaying(false);
  }, [mode, handleStart])


  const [mouseY, setMouseY] = useState<number | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      // Calculate logical Y based on internal CANVAS_HEIGHT bounds vs rendered height
      const scaleY = CANVAS_HEIGHT / rect.height;
      setMouseY((e.clientY - rect.top) * scaleY);
  }, []);

  // Game Loop
  const gameLoop = useCallback(() => {
    if (!isPlaying || !gameState) return;

    const input: PongInput = {
      p1Up: keys.current['KeyW'] || false,
      p1Down: keys.current['KeyS'] || false,
      p2Up: keys.current['ArrowUp'] || false,
      p2Down: keys.current['ArrowDown'] || false,
      mouseY: mouseY // Inject specific mouse position tracking
    };

    const newState = engine.update(gameState, input);

    if (newState.isGameOver && !gameState.isGameOver) {
       setIsPlaying(false);
       if (mode === '1P') {
         const isWin = newState.winner === 'Player1';
         profileManager.recordGameResult(isWin ? 'win' : 'loss', 0, difficultyManager.getCurrentDifficulty().toString());
         difficultyManager.recordGame(isWin, 1000, 0, newState.score.p1 + newState.score.p2);
       }
    }

    setGameState(newState);
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, gameState, engine, mode, profileManager, difficultyManager]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, gameLoop]);

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#18181b'; // zinc-900
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Center Line
    ctx.strokeStyle = '#3f3f46'; // zinc-700
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddle 1
    ctx.fillStyle = '#60a5fa'; // blue 400
    ctx.fillRect(0, gameState.paddle1.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Paddle 2
    ctx.fillStyle = mode === '1P' ? '#f87171' : '#a78bfa'; // red 400 / purple 400
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, gameState.paddle2.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Ball
    ctx.fillStyle = '#fcd34d'; // amber 300
    ctx.beginPath();
    ctx.arc(gameState.ball.x + BALL_SIZE/2, gameState.ball.y + BALL_SIZE/2, BALL_SIZE/2, 0, Math.PI * 2);
    ctx.fill();

  }, [gameState, mode]);

  if (!gameState) return null;

  return (
    <div className="flex flex-col items-center justify-center p-4">
       <div className="flex flex-col sm:flex-row justify-between w-full max-w-4xl mb-6 items-center">
            <h2 className="text-4xl font-black tracking-tight drop-shadow-md pb-2 bg-gradient-to-r from-blue-400 to-rose-400 text-transparent bg-clip-text">PONG</h2>
            <select 
              className="bg-zinc-800 border bg-transparent border-zinc-700 text-zinc-50 rounded-lg p-2 outline-none mt-2 sm:mt-0 font-bold tracking-wide shadow-inner"
              value={mode}
              onChange={(e) => setMode(e.target.value as GameMode)}
            >
              <option value="1P">1 Player (vs AI)</option>
              <option value="2P">2 Player (Local)</option>
            </select>
       </div>

       <div className="w-full max-w-4xl flex justify-between text-zinc-400 text-sm mb-4 px-2 tracking-wide font-mono">
           <div className="flex items-center gap-2">
             <span className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"></span>
             P1 (W/S): <span className="text-2xl text-white font-black">{gameState.score.p1}</span>
           </div>
           
           {mode === '1P' ? (
                <span className="text-zinc-500">AI Difficulty: {difficultyManager.getCurrentDifficulty().toFixed(1)}/10</span>
           ) : <span className="text-zinc-500">First to {WIN_SCORE}</span>}

           <div className="flex items-center gap-2">
             <span className="text-2xl text-white font-black">{gameState.score.p2}</span>
             :P2 P2 {mode === '1P' ? '(AI)' : '(Up/Down)'}
             <span className={`w-3 h-3 rounded-full ${mode === '1P' ? 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,113,0.8)]' : 'bg-purple-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]'}`}></span>
           </div>
       </div>

       <div className="relative border-[8px] border-zinc-700 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-zinc-900 touch-none w-full max-w-4xl aspect-[2/1]">
           {!isPlaying && !gameState.isGameOver && gameState.score.p1 === 0 && gameState.score.p2 === 0 ? (
               <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px]">
                   <button 
                       onClick={() => setIsPlaying(true)} 
                       className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-2xl shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all hover:scale-105 active:scale-95 uppercase tracking-widest border border-indigo-400"
                   >
                       Start Game
                   </button>
               </div>
           ) : gameState.isGameOver ? (
               <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                   <h3 className={`text-6xl font-black mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] bg-gradient-to-t ${gameState.winner === 'Player1' ? 'from-blue-600 to-blue-300' : 'from-rose-600 to-rose-300'} text-transparent bg-clip-text animate-bounce`}>
                       {gameState.winner} WINS
                   </h3>
                   <button 
                       onClick={handleStart} 
                       className="px-8 py-4 bg-zinc-200 hover:bg-white text-zinc-900 rounded-full font-black text-xl shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
                   >
                       Play Again
                   </button>
               </div>
           ) : null}

           {/* Pause overlay if focus lost, omitted for brevity, logic plays constantly unless game over */}

           <canvas 
               ref={canvasRef} 
               width={CANVAS_WIDTH} 
               height={CANVAS_HEIGHT} 
               onMouseMove={handleMouseMove}
               onMouseLeave={() => setMouseY(null)}
               className="w-full h-full block"
           />
       </div>
    </div>
  );
}
