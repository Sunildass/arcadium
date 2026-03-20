import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LudoEngine, LudoState, LudoPiece, PlayerColor } from './LudoEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

const PLAYER_COLORS: Record<PlayerColor, string> = {
    'Red': '#dc2626',
    'Green': '#16a34a',
    'Yellow': '#eab308',
    'Blue': '#2563eb'
};

export default function Ludo() {
    const [mode, setMode] = useState<number>(2); // 2, 3, 4 players
    const [engine, setEngine] = useState(() => new LudoEngine(mode, [false, true, true, true]));
    const [gameState, setGameState] = useState<LudoState | null>(null);
    const [profileManager] = useState(() => new PlayerProfileManager('ludo'));

    const startGame = useCallback((players: number = mode) => {
         const isAI = [false, true, true, true];
         const newEngine = new LudoEngine(players, isAI.slice(0, players));
         setEngine(newEngine);
         setGameState(newEngine.initialize());
    }, [mode]);

    useEffect(() => {
        startGame();
    }, [startGame]);

    // AI Loop
    useEffect(() => {
         if (!gameState || gameState.isGameOver) return;
         const activePlayer = gameState.players[gameState.turnIndex];
         
         if (activePlayer.isAI) {
             const t = setTimeout(() => {
                 const move = engine.computeAIMove(gameState);
                 if (move) {
                     setGameState(engine.update(gameState, move));
                 } else {
                     // Failsafe if stuck
                     if (gameState.phase === 'rolling') {
                         setGameState(engine.update(gameState, { type: 'ROLL' }));
                     }
                 }
             }, 800);
             return () => clearTimeout(t);
         }
    }, [gameState, engine]);

    const handleRoll = () => {
         if (!gameState || gameState.isGameOver) return;
         const activePlayer = gameState.players[gameState.turnIndex];
         if (activePlayer.isAI || gameState.phase !== 'rolling') return;
         
         setGameState(engine.update(gameState, { type: 'ROLL' }));
    };

    const handlePieceClick = (piece: LudoPiece) => {
         if (!gameState || gameState.isGameOver) return;
         const activePlayer = gameState.players[gameState.turnIndex];
         if (activePlayer.isAI || gameState.phase !== 'moving') return;
         if (piece.color !== activePlayer.color) return;

         setGameState(engine.update(gameState, { type: 'MOVE', pieceId: piece.id }));
    };

    if (!gameState) return null;

    // Build the grid mapping for rendering the track.
    // Ludo is a 15x15 grid. We can hardcode the track path mapping.
    // 0-4 is bottom-left path going UP towards center, etc. We will just use absolutely positioned divs for a simpler fluid response.
    
    // Instead of a 15x15 CSS grid, absolutely positioning the 52 track spaces + home paths is robust.
    const mapAbsoluteToCoordinate = (abs: number) => {
        // Red track (starts at bottom left column, goes up, around clockwise)
        const cellPercent = 100 / 15;
        let c = 0, r = 0;
        
        // Let's define the 52 perimeter steps by grid (x,y) from 0 to 14
        const trackPts: [number, number][] = [
            // Bottom-Left (Red start area) - going up
            [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
            // Top-Left (Going left)
            [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
            [0, 7], // Corner
            // Top-Left (Going right on top)
            [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
            // Top-Right (Going up)
            [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
            [7, 0], // Corner
            // Top-Right (Going down)
            [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
            // Bottom-Right (Going right)
            [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
            [14, 7], // Corner
            // Bottom-Right (Going left)
            [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
            // Bottom-Left (Going down)
            [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
            [7, 14] // Corner, goes back to 0 ([6,13])
        ];

        if (abs >= 0 && abs < 52) {
            c = trackPts[abs][0];
            r = trackPts[abs][1];
        }

        return { x: `${c * cellPercent}%`, y: `${r * cellPercent}%`, size: `${cellPercent}%` };
    };

    const mapHomePathToCoordinate = (color: PlayerColor, step: number) => {
        // step is 0 to 4 (5 is home center)
        const cellPercent = 100 / 15;
        let c = 0, r = 0;
        if (color === 'Red') { c = 7; r = 13 - step; }       // Bottom going up
        else if (color === 'Green') { c = 1 + step; r = 7; } // Left going right
        else if (color === 'Yellow') { c = 7; r = 1 + step; } // Top going down
        else if (color === 'Blue') { c = 13 - step; r = 7; } // Right going left
        return { x: `${c * cellPercent}%`, y: `${r * cellPercent}%`, size: `${cellPercent}%` };
    };

    const mapBaseCoordinate = (color: PlayerColor, idx: number) => {
        // Coordinates for the 4 spaces in the 4 large corners
        const qx = [2.5, 4.5, 2.5, 4.5];
        const qy = [2.5, 2.5, 4.5, 4.5];
        let c = qx[idx], r = qy[idx];
        
        if (color === 'Green') { r += 0; c += 0; } // Top Left
        else if (color === 'Yellow') { r += 0; c += 9; } // Top Right
        else if (color === 'Blue') { r += 9; c += 9; } // Bottom Right
        else if (color === 'Red') { r += 9; c += 0; } // Bottom Left

        return { x: `${c * (100/15)}%`, y: `${r * (100/15)}%`, size: `${100/15}%` };
    };

    const activePlayer = gameState.players[gameState.turnIndex];
    const isHumanTurn = !activePlayer.isAI;

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-zinc-950 text-white font-sans">
            
            <div className="flex flex-col xl:flex-row gap-8 items-center justify-center w-full max-w-6xl">
                
                {/* Board Container */}
                <div className="relative w-full max-w-2xl aspect-square bg-zinc-100 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border-[12px] border-zinc-800 p-2 overflow-hidden flex-shrink-0">
                    
                    {/* Background Grid Pattern (15x15 visual aid) */}
                    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)' }}>
                        {Array.from({length: 225}).map((_, i) => (
                           <div key={i} className="border-[0.5px] border-black/5" />
                        ))}
                    </div>

                    {/* Colored Corners / Bases */}
                    <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-green-500 rounded-2xl shadow-inner border-4 border-black/20" />
                    <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-yellow-400 rounded-2xl shadow-inner border-4 border-black/20" />
                    <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-blue-600 rounded-2xl shadow-inner border-4 border-black/20" />
                    <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-red-600 rounded-2xl shadow-inner border-4 border-black/20" />

                    {/* Central Home Triangle */}
                    <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%]">
                        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                            <polygon points="0,0 50,50 0,100" fill="#16a34a" /> {/* Green left */}
                            <polygon points="0,0 100,0 50,50" fill="#eab308" /> {/* Yellow top */}
                            <polygon points="100,0 100,100 50,50" fill="#2563eb" /> {/* Blue right */}
                            <polygon points="0,100 100,100 50,50" fill="#dc2626" /> {/* Red bottom */}
                        </svg>
                    </div>

                    {/* Safe zone stars and entry arrows visually mapped manually would go here in deep styling, abbreviated for MVP logic */}
                    
                    {/* Render Pieces */}
                    {gameState.players.map(player => (
                        player.pieces.map((piece, idx) => {
                            if (piece.status === 'home') return null; // Don't render once they win
                            
                            let posProps;
                            if (piece.status === 'base') {
                                posProps = mapBaseCoordinate(piece.color, idx);
                            } else if (piece.status === 'active' && piece.steps < 51) {
                                const abs = engine.getAbsolutePosition(piece);
                                posProps = mapAbsoluteToCoordinate(abs!);
                            } else {
                                posProps = mapHomePathToCoordinate(piece.color, piece.steps - 51);
                            }

                            // If multiple pieces share same track spot, we could offset them. Skipping cluster logic for minimalism, 
                            // they will stack perfectly on top. Users can click top one.
                            const canMove = isHumanTurn && gameState.phase === 'moving' && player.color === activePlayer.color;

                            return (
                                <div 
                                    key={piece.id}
                                    onClick={() => handlePieceClick(piece)}
                                    className={`absolute rounded-full border-2 border-white/80 shadow-[0_4px_6px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-500 ease-out transform
                                        ${canMove ? 'cursor-pointer hover:scale-125 ring-2 ring-white/50 animate-pulse z-20' : 'z-10'}
                                    `}
                                    style={{
                                        left: posProps.x, top: posProps.y, width: posProps.size, height: posProps.size,
                                        backgroundColor: PLAYER_COLORS[piece.color],
                                    }}
                                >
                                    <div className="w-[40%] h-[40%] bg-white/30 rounded-full inset-shadow" />
                                </div>
                            );
                        })
                    ))}
                </div>

                {/* Side Panel UI */}
                <div className="flex flex-col gap-6 w-full max-w-sm h-full justify-between">
                    
                    {/* Game Status */}
                    <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl shadow-xl space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-black uppercase tracking-widest text-zinc-300">Ludo</h2>
                            <select 
                                value={mode} onChange={e => setMode(Number(e.target.value))}
                                className="bg-black text-xs text-white p-2 rounded outline-none border border-zinc-600"
                            >
                                <option value={2}>2 Player</option>
                                <option value={3}>3 Player</option>
                                <option value={4}>4 Player</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="w-6 h-6 rounded-full shadow-inner border border-white/20" style={{ backgroundColor: PLAYER_COLORS[activePlayer.color] }} />
                            <div className="flex-1">
                                <h3 className="font-bold text-lg leading-tight">{activePlayer.color}'s Turn</h3>
                                <div className="text-xs text-zinc-500 uppercase tracking-wider">{activePlayer.isAI ? 'Computer is thinking...' : 'Your move'}</div>
                            </div>
                        </div>

                        {/* Dice */}
                        <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded-xl border-2 border-zinc-800 min-h-[140px]">
                            {gameState.diceValue ? (
                                <div className="text-6xl font-black text-white animate-[bounce_0.5s_ease-out] drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                    {gameState.diceValue}
                                </div>
                            ) : (
                                <button 
                                    disabled={!isHumanTurn || gameState.phase !== 'rolling'}
                                    onClick={handleRoll}
                                    className={`
                                        w-24 h-24 rounded-2xl flex items-center justify-center text-xl font-bold transition-all shadow-xl
                                        ${isHumanTurn && gameState.phase === 'rolling' 
                                            ? 'bg-zinc-100 text-black hover:scale-110 hover:bg-white animate-pulse shadow-[0_0_20px_rgba(255,255,255,0.4)]' 
                                            : 'bg-zinc-800 text-zinc-600 border-2 border-zinc-700 cursor-not-allowed'}
                                    `}
                                >
                                    ROLL
                                </button>
                            )}
                        </div>

                        {gameState.phase === 'moving' && isHumanTurn && (
                             <div className="text-center text-amber-500 font-bold animate-pulse text-sm">
                                 Select a piece to move...
                             </div>
                        )}
                    </div>

                    {/* Event Log */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex-1 max-h-48 overflow-y-auto text-xs text-zinc-400 font-mono space-y-1 shadow-inner">
                        <div className="font-bold text-zinc-500 mb-2 uppercase tracking-widest sticky top-0 bg-zinc-900 pb-1">Activity Log</div>
                        {[...gameState.log].reverse().map((entry, idx) => (
                            <div key={idx} className={`${idx === 0 ? 'text-zinc-200' : ''}`}>• {entry}</div>
                        ))}
                    </div>

                </div>
            </div>

            {/* Game Over Overlay */}
            {gameState.isGameOver && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] mb-8"
                        style={{ color: PLAYER_COLORS[gameState.winner!] }}
                    >
                        {gameState.winner} Wins!
                    </h1>
                    <button 
                        onClick={() => startGame()}
                        className="px-8 py-3 bg-white text-black font-black uppercase rounded shadow-xl hover:scale-105 transition-transform"
                    >
                        Play Again
                    </button>
                </div>
            )}
        </div>
    );
}
