import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ZenGardenEngine, ZenGardenState, ZenTool } from './ZenGardenEngine';

export default function ZenGarden() {
    const [engine] = useState(() => new ZenGardenEngine());
    const [gameState, setGameState] = useState<ZenGardenState | null>(null);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isPointerDown = useRef(false);
    const lastPos = useRef<{x: number, y: number} | null>(null);

    // Initialize game state (no routing hooks needed for simple load)
    useEffect(() => {
        setGameState(engine.initialize());
    }, [engine]);

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        isPointerDown.current = true;
        const canvas = canvasRef.current;
        if (!canvas || !gameState) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = engine.width / rect.width;
        const scaleY = engine.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        lastPos.current = { x, y };

        if (gameState.activeTool !== 'rake' && gameState.activeTool !== 'eraser') {
            setGameState(engine.update(gameState, { type: 'PLACE', x, y }));
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isPointerDown.current || !gameState || !lastPos.current) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = engine.width / rect.width;
        const scaleY = engine.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const dx = x - lastPos.current.x;
        const dy = y - lastPos.current.y;

        // If we moved enough
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
             setGameState(engine.update(gameState, { type: 'RAKE', x, y, dx, dy }));
             lastPos.current = { x, y };
        }
    };

    const handlePointerUp = () => {
        isPointerDown.current = false;
        lastPos.current = null;
    };

    // Render logic (using Canvas for dense sand grid is far more performant than React elements)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !gameState) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = engine.width;
        const h = engine.height;
        const res = engine.resolution;

        // Base sand color
        ctx.fillStyle = '#f3e8d2'; // Light sand
        ctx.fillRect(0, 0, w, h);

        // Draw sand grid texture
        const rows = gameState.sandAngles.length;
        const cols = gameState.sandAngles[0]?.length || 0;

        // We use a simplified stroke drawing technique to simulate raked sand
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                 const angle = gameState.sandAngles[r][c];
                 
                 const px = c * res;
                 const py = r * res;
                 
                 if (angle === -1) {
                      // Unraked: subtle noise
                      if ((r + c) % 3 === 0) {
                          ctx.fillStyle = '#ebdebd';
                          ctx.fillRect(px, py, res/2, res/2);
                      }
                 } else {
                      // Raked: draw a line corresponding to angle, with shadow
                      ctx.save();
                      ctx.translate(px + res/2, py + res/2);
                      ctx.rotate(angle);
                      
                      // Highlight
                      ctx.fillStyle = '#f9f1e1';
                      ctx.fillRect(-res/2, -res/4, res, res/2);
                      
                      // Shadow
                      ctx.fillStyle = '#e2d3b2';
                      ctx.fillRect(-res/2, 0, res, res/4);
                      
                      ctx.restore();
                 }
            }
        }

        // Draw static objects
        gameState.objects.forEach(obj => {
             ctx.save();
             ctx.translate(obj.x, obj.y);
             ctx.rotate(obj.rotation * Math.PI / 180);
             ctx.scale(obj.scale, obj.scale);

             if (obj.type.startsWith('rock')) {
                  // Draw rock
                  ctx.shadowColor = 'rgba(0,0,0,0.5)';
                  ctx.shadowBlur = 15;
                  ctx.shadowOffsetY = 5;
                  
                  ctx.beginPath();
                  if (obj.type === 'rock1') {
                       ctx.ellipse(0, 0, 30, 20, 0, 0, Math.PI * 2);
                       ctx.fillStyle = '#78716c'; // stone 500
                  } else if (obj.type === 'rock2') {
                       ctx.ellipse(0, 0, 20, 25, 0.5, 0, Math.PI * 2);
                       ctx.fillStyle = '#57534e'; // stone 600
                  } else {
                       ctx.ellipse(0, 0, 40, 30, -0.2, 0, Math.PI * 2);
                       ctx.fillStyle = '#a8a29e'; // stone 400
                  }
                  ctx.fill();
                  ctx.shadowColor = 'transparent'; // reset
                  
                  // Rock highlight
                  ctx.beginPath();
                  ctx.ellipse(-5, -5, 15, 10, 0, 0, Math.PI * 2);
                  ctx.fillStyle = 'rgba(255,255,255,0.1)';
                  ctx.fill();

             } else if (obj.type === 'bonsai') {
                  // Simple top-down bonsai
                  ctx.shadowColor = 'rgba(0,0,0,0.5)';
                  ctx.shadowBlur = 10;
                  ctx.shadowOffsetY = 5;
                  
                  // Pot
                  ctx.fillStyle = '#991b1b'; // red 800
                  ctx.fillRect(-15, -15, 30, 30);
                  
                  // Leaves
                  ctx.beginPath();
                  ctx.arc(-10, -10, 25, 0, Math.PI*2);
                  ctx.arc(15, -5, 20, 0, Math.PI*2);
                  ctx.arc(0, 15, 22, 0, Math.PI*2);
                  ctx.fillStyle = '#166534'; // green 800
                  ctx.fill();

                  // Highlights
                  ctx.fillStyle = 'rgba(255,255,255,0.1)';
                  ctx.beginPath();
                  ctx.arc(-15, -15, 10, 0, Math.PI*2);
                  ctx.fill();
             } else if (obj.type === 'lantern') {
                 // Pagoda lantern
                 ctx.shadowColor = 'rgba(0,0,0,0.5)';
                 ctx.shadowBlur = 15;
                 ctx.shadowOffsetY = 5;

                 ctx.fillStyle = '#44403c'; // stone 700
                 ctx.fillRect(-15, -15, 30, 30); // base
                 ctx.fillStyle = '#fcd34d'; // yellow inside
                 ctx.fillRect(-8, -8, 16, 16); // light
                 
                 // roof
                 ctx.fillStyle = '#292524'; // stone 800
                 ctx.beginPath();
                 ctx.moveTo(0, -25);
                 ctx.lineTo(20, -10);
                 ctx.lineTo(-20, -10);
                 ctx.fill();
             }

             ctx.restore();
        });

    }, [gameState, engine.width, engine.height, engine.resolution]);

    if (!gameState) return null;

    const setTool = (tool: ZenTool) => {
         setGameState(engine.update(gameState, { type: 'SET_TOOL', tool }));
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-stone-100 font-sans text-stone-800">
            
            <div className="w-full max-w-5xl flex justify-between items-center mb-6">
                 <div>
                     <h1 className="text-4xl font-black tracking-widest text-stone-700 drop-shadow-sm font-serif">Karesansui</h1>
                     <p className="text-stone-500 font-serif italic text-sm mt-1">A mindful digital zen garden.</p>
                 </div>
                 
                 <div className="flex gap-2 bg-white p-2 rounded-xl shadow border border-stone-200">
                     <button onClick={() => setTool('rake')} className={`px-4 py-2 rounded-md transition-colors ${gameState.activeTool === 'rake' ? 'bg-stone-800 text-stone-100' : 'hover:bg-stone-100'}`}>Rake</button>
                     <button onClick={() => setTool('eraser')} className={`px-4 py-2 rounded-md transition-colors ${gameState.activeTool === 'eraser' ? 'bg-stone-800 text-stone-100' : 'hover:bg-stone-100'}`}>Smooth</button>
                     <div className="w-px bg-stone-300 mx-1"></div>
                     <button onClick={() => setTool('rock1')} className={`px-4 py-2 rounded-md transition-colors ${gameState.activeTool === 'rock1' ? 'bg-stone-800 text-stone-100' : 'hover:bg-stone-100'}`}>Dark Rock</button>
                     <button onClick={() => setTool('rock2')} className={`px-4 py-2 rounded-md transition-colors ${gameState.activeTool === 'rock2' ? 'bg-stone-800 text-stone-100' : 'hover:bg-stone-100'}`}>Flat Rock</button>
                     <button onClick={() => setTool('rock3')} className={`px-4 py-2 rounded-md transition-colors ${gameState.activeTool === 'rock3' ? 'bg-stone-800 text-stone-100' : 'hover:bg-stone-100'}`}>Light Rock</button>
                     <button onClick={() => setTool('bonsai')} className={`px-4 py-2 rounded-md transition-colors ${gameState.activeTool === 'bonsai' ? 'bg-green-800 text-stone-100' : 'hover:bg-green-50 text-green-800'}`}>Bonsai</button>
                     <button onClick={() => setTool('lantern')} className={`px-4 py-2 rounded-md transition-colors ${gameState.activeTool === 'lantern' ? 'bg-amber-800 text-stone-100' : 'hover:bg-amber-50 text-amber-800'}`}>Lantern</button>
                 </div>
            </div>

            {/* Canvas Container */}
            <div className="relative w-full max-w-5xl aspect-[4/3] bg-[#f5ecda] p-4 lg:p-8 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[20px] lg:border-[40px] border-[#3e2723]">
                 {/* Wood Texture on border handled via CSS or pure color is fine. The outer div acts as the frame */}
                 
                 <canvas 
                     ref={canvasRef}
                     width={engine.width}
                     height={engine.height}
                     onPointerDown={handlePointerDown}
                     onPointerMove={handlePointerMove}
                     onPointerUp={handlePointerUp}
                     onPointerLeave={handlePointerUp} // stop drawing if mouse leaves
                     className="w-full h-full cursor-crosshair shadow-[inset_0_4px_10px_rgba(0,0,0,0.1)] bg-[#f3e8d2] touch-none"
                     style={{
                         cursor: gameState.activeTool === 'rake' ? 'crosshair' : (gameState.activeTool === 'eraser' ? 'circle' : 'copy')
                     }}
                 />

            </div>
            
            <div className="mt-8 flex gap-4 text-sm font-medium text-stone-500">
                <button onClick={() => setGameState(engine.update(gameState, { type: 'CLEAR' }))} className="px-6 py-2 border border-stone-300 rounded hover:bg-stone-200 transition-colors uppercase tracking-widest">
                     Clear Garden
                </button>
            </div>

        </div>
    );
}
