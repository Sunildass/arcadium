import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SimonEngine, SimonState, SimonColor } from './SimonEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

export default function SimonSays() {
    // Difficulty in Simon primarily affects playback speed and strictness.
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [engine, setEngine] = useState(() => new SimonEngine(difficulty));
    const [gameState, setGameState] = useState<SimonState | null>(null);
    const [profileManager] = useState(() => new PlayerProfileManager('simon-says'));
    
    // UI animation overrides
    const [activeUI, setActiveUI] = useState<SimonColor | null>(null);
    const [message, setMessage] = useState<string>('Press Start');

    const audioCtxRef = useRef<AudioContext | null>(null);

    const startGame = useCallback((diff?: 'Easy' | 'Medium' | 'Hard') => {
        const d = diff || difficulty;
        setDifficulty(d);
        const newEngine = new SimonEngine(d);
        setEngine(newEngine);
        setGameState(newEngine.initialize());
        setActiveUI(null);
        setMessage('Press Start');
    }, [difficulty]);

    useEffect(() => {
        startGame();
        // Init audio context on mount
        const AudioContextCls = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextCls && !audioCtxRef.current) {
            audioCtxRef.current = new AudioContextCls();
        }
        return () => {
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(console.error);
                audioCtxRef.current = null;
            }
        };
    }, [startGame]);

    const playTone = useCallback((color: SimonColor | 'error') => {
         if (!audioCtxRef.current) return;
         if (audioCtxRef.current.state === 'suspended') {
             audioCtxRef.current.resume();
         }

         const osc = audioCtxRef.current.createOscillator();
         const gainNode = audioCtxRef.current.createGain();

         // Classic Simon Frq: G=415, R=310, Y=252, B=209
         const freqs: Record<SimonColor | 'error', number> = {
              'Green': 415.3, // G#4
              'Red': 311.1,   // D#4
              'Yellow': 254.0, // C#4
              'Blue': 207.6,  // G#3
              'error': 100.0
         };

         osc.type = color === 'error' ? 'sawtooth' : 'sine';
         osc.frequency.setValueAtTime(freqs[color], audioCtxRef.current.currentTime);
         
         gainNode.gain.setValueAtTime(0.5, audioCtxRef.current.currentTime);
         gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.5);

         osc.connect(gainNode);
         gainNode.connect(audioCtxRef.current.destination);

         osc.start();
         osc.stop(audioCtxRef.current.currentTime + 0.5);
    }, []);

    // Effect to handle the "watching" phase playback
    useEffect(() => {
        if (!gameState || gameState.phase !== 'watching') return;

        let isMounted = true;
        const speedMap = { 'Easy': 800, 'Medium': 500, 'Hard': 300 };
        const playSpeed = Math.max(200, speedMap[difficulty] - (gameState.score * 15)); // gets faster!
        const gapSpeed = playSpeed / 2;

        const playSequence = async () => {
             setMessage('Watch...');
             // Wait a tick before starting
             await new Promise(r => setTimeout(r, 1000));
             if (!isMounted) return;

             for (let i = 0; i < gameState.sequence.length; i++) {
                  const color = gameState.sequence[i];
                  
                  // Turn ON
                  setActiveUI(color);
                  playTone(color);
                  await new Promise(r => setTimeout(r, playSpeed));
                  if (!isMounted) return;

                  // Turn OFF
                  setActiveUI(null);
                  await new Promise(r => setTimeout(r, gapSpeed));
                  if (!isMounted) return;
             }

             // Done playing, switch to playing phase naturally
             setMessage('GO!');
             // Engine doesn't have an explicit 'start playing' action since input naturally validates, 
             // but we need to unlock the UI.
             setGameState(prev => prev ? { ...prev, phase: 'playing' } : null);
        };

        // If playerInput is 0, we just generated a new round or started. Play it.
        if (gameState.playerInput.length === 0) {
             playSequence();
        } else if (gameState.playerInput.length === gameState.sequence.length) {
             // We just finished a round successfully!
             setMessage('Good!');
             const timer = setTimeout(() => {
                 setGameState(engine.update(gameState, { type: 'NEXT_ROUND' }));
             }, 1000);
             return () => clearTimeout(timer);
        }

        return () => { isMounted = false; };
    }, [gameState?.phase, gameState?.sequence, gameState?.playerInput.length, gameState?.score, engine, gameState, difficulty, playTone]);

    // Handle Game Over
    useEffect(() => {
         if (gameState?.phase === 'gameover') {
             setMessage('FAIL!');
             playTone('error');
             
             // Record score
             const result = engine.evaluateWin(gameState);
             if (result) {
                  profileManager.recordGameResult('loss', result.score, difficulty); // Always loss in simon, but we want the score curve
             }
         }
    }, [gameState?.phase, engine, gameState, profileManager, difficulty, playTone]);

    const handlePress = (color: SimonColor) => {
         if (!gameState) return;
         
         // Start game if starting
         if (gameState.phase === 'starting') {
              setGameState(engine.update(gameState, { type: 'START' }));
              return;
         }

         if (gameState.phase !== 'playing') return;

         playTone(color);
         setActiveUI(color);
         setTimeout(() => setActiveUI(null), 200);

         setGameState(engine.update(gameState, { type: 'PRESS', color }));
    };

    if (!gameState) return null;

    const getSectorStyle = (color: SimonColor) => {
         const isActive = activeUI === color;

         const mapping = {
             'Green': {
                 bg: isActive ? 'bg-green-400' : 'bg-green-800',
                 border: 'border-green-600',
                 round: 'rounded-tl-full',
                 shadow: isActive ? 'shadow-[0_0_50px_rgba(74,222,128,1),_inset_0_0_20px_rgba(255,255,255,0.8)]' : 'shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]'
             },
             'Red': {
                 bg: isActive ? 'bg-red-500' : 'bg-red-800',
                 border: 'border-red-600',
                 round: 'rounded-tr-full',
                 shadow: isActive ? 'shadow-[0_0_50px_rgba(239,68,68,1),_inset_0_0_20px_rgba(255,255,255,0.8)]' : 'shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]'
             },
             'Yellow': {
                 bg: isActive ? 'bg-yellow-300' : 'bg-yellow-600',
                 border: 'border-yellow-500',
                 round: 'rounded-bl-full',
                 shadow: isActive ? 'shadow-[0_0_50px_rgba(253,224,71,1),_inset_0_0_20px_rgba(255,255,255,0.8)]' : 'shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]'
             },
             'Blue': {
                 bg: isActive ? 'bg-blue-400' : 'bg-blue-800',
                 border: 'border-blue-600',
                 round: 'rounded-br-full',
                 shadow: isActive ? 'shadow-[0_0_50px_rgba(96,165,250,1),_inset_0_0_20px_rgba(255,255,255,0.8)]' : 'shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]'
             }
         };

         return mapping[color];
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-zinc-950 font-sans">
            
            <div className="w-full max-w-lg flex justify-between items-center mb-12">
                 <h1 className="text-4xl font-black tracking-widest text-zinc-300 drop-shadow-md uppercase">Simon</h1>
                 <select value={difficulty} onChange={e=>startGame(e.target.value as any)} disabled={gameState.phase !== 'starting' && gameState.phase !== 'gameover'} className="bg-zinc-900 border border-zinc-700 text-zinc-300 outline-none p-2 rounded shadow flex-shrink-0 disabled:opacity-50">
                     <option value="Easy">Easy</option>
                     <option value="Medium">Medium</option>
                     <option value="Hard">Hard</option>
                 </select>
            </div>

            {/* The Simon Device */}
            <div className="relative w-full max-w-sm aspect-square bg-zinc-900 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.8),_inset_0_-10px_20px_rgba(0,0,0,0.5)] border-[16px] border-zinc-800 p-2 flex items-center justify-center">
                 
                 {/* 4 Quadrants Container */}
                 <div className="relative w-full h-full rounded-full bg-black overflow-hidden shadow-inner flex flex-wrap gap-2 p-2">
                     
                     {/* Green (Top Left) */}
                     <div className="flex-1 min-w-[45%] h-[45%] mb-2">
                          <button 
                              onClick={() => handlePress('Green')} 
                              disabled={gameState.phase === 'watching'}
                              className={`w-full h-full transition-all duration-[50ms] border-4 ${getSectorStyle('Green').round} ${getSectorStyle('Green').bg} ${getSectorStyle('Green').border} ${getSectorStyle('Green').shadow}
                                  active:scale-95 disabled:active:scale-100 hover:brightness-110 disabled:hover:brightness-100
                              `}
                          />
                     </div>

                     {/* Red (Top Right) */}
                     <div className="flex-1 min-w-[45%] h-[45%] mb-2">
                          <button 
                              onClick={() => handlePress('Red')} 
                              disabled={gameState.phase === 'watching'}
                              className={`w-full h-full transition-all duration-[50ms] border-4 ${getSectorStyle('Red').round} ${getSectorStyle('Red').bg} ${getSectorStyle('Red').border} ${getSectorStyle('Red').shadow}
                                  active:scale-95 disabled:active:scale-100 hover:brightness-110 disabled:hover:brightness-100
                              `}
                          />
                     </div>

                     {/* Yellow (Bottom Left) */}
                     <div className="flex-1 min-w-[45%] h-[45%] mt-2">
                          <button 
                              onClick={() => handlePress('Yellow')} 
                              disabled={gameState.phase === 'watching'}
                              className={`w-full h-full transition-all duration-[50ms] border-4 ${getSectorStyle('Yellow').round} ${getSectorStyle('Yellow').bg} ${getSectorStyle('Yellow').border} ${getSectorStyle('Yellow').shadow}
                                  active:scale-95 disabled:active:scale-100 hover:brightness-110 disabled:hover:brightness-100
                              `}
                          />
                     </div>

                     {/* Blue (Bottom Right) */}
                     <div className="flex-1 min-w-[45%] h-[45%] mt-2">
                          <button 
                              onClick={() => handlePress('Blue')} 
                              disabled={gameState.phase === 'watching'}
                              className={`w-full h-full transition-all duration-[50ms] border-4 ${getSectorStyle('Blue').round} ${getSectorStyle('Blue').bg} ${getSectorStyle('Blue').border} ${getSectorStyle('Blue').shadow}
                                  active:scale-95 disabled:active:scale-100 hover:brightness-110 disabled:hover:brightness-100
                              `}
                          />
                     </div>

                     {/* Center Console */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 aspect-square bg-zinc-200 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.8),_inset_0_2px_10px_rgba(255,255,255,0.8)] border-[8px] border-zinc-900 flex flex-col justify-center items-center z-10">
                          <span className="font-black text-3xl font-mono text-zinc-800 tracking-tighter drop-shadow-sm">SIMON</span>
                          
                          <div className="mt-2 bg-black px-4 py-1 rounded shadow-inner border border-zinc-600">
                               <span className="text-red-500 font-mono text-2xl font-bold tracking-widest">{gameState.score.toString().padStart(2, '0')}</span>
                          </div>
                          
                          <div className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-widest">Score</div>
                     </div>
                 </div>

            </div>

            <div className="mt-12 h-16 flex flex-col items-center justify-center">
                 <p className={`text-2xl font-black uppercase tracking-[0.2em] transition-opacity duration-300
                      ${message === 'FAIL!' ? 'text-red-500 animate-pulse' : (message === 'GO!' ? 'text-green-400' : 'text-zinc-500')}
                 `}>
                      {message}
                 </p>
                 
                 {gameState.phase === 'gameover' && (
                     <button onClick={() => startGame()} className="mt-4 px-8 py-2 border-2 border-zinc-500 hover:border-zinc-300 hover:text-white text-zinc-400 transition-colors uppercase tracking-widest text-sm font-bold rounded-full">
                         Restart
                     </button>
                 )}
                 {gameState.phase === 'starting' && (
                     <button onClick={() => setGameState(engine.update(gameState, { type: 'START' }))} className="mt-4 px-8 py-2 bg-zinc-200 hover:bg-white text-black transition-colors uppercase tracking-widest text-sm font-black rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                         Start Game
                     </button>
                 )}
            </div>
            
        </div>
    );
}
