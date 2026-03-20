import React, { useRef, useEffect, useState } from 'react';

const W = 400, H = 600;
const CELL = 4;
const COLS = Math.floor(W / CELL);
const ROWS = Math.floor(H / CELL);

type CellType = 0 | 1; // 0 = empty, 1 = sand

const SAND_COLORS = ['#d97706','#b45309','#f59e0b','#fbbf24','#92400e'];

export default function SandSimulation() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gridRef = useRef<Uint8Array>(new Uint8Array(COLS * ROWS));
    const colorRef = useRef<Uint32Array>(new Uint32Array(COLS * ROWS));
    const drawingRef = useRef(false);
    const mouseRef = useRef({ x: 0, y: 0 });
    const rafRef = useRef<number>(0);
    const [brushSize, setBrushSize] = useState(3);
    const [rainMode, setRainMode] = useState(false);
    const [sandCount, setSandCount] = useState(0);

    // Parse hex to uint32 RGBA
    function hexToRgba(hex: string): number {
        const r = parseInt(hex.slice(1,3),16);
        const g = parseInt(hex.slice(3,5),16);
        const b = parseInt(hex.slice(5,7),16);
        return (255 << 24) | (b << 16) | (g << 8) | r;
    }

    const sandColorsParsed = SAND_COLORS.map(hexToRgba);

    const idx = (c: number, r: number) => r * COLS + c;

    function addSand(cx: number, cy: number) {
        for (let dr = -brushSize; dr <= brushSize; dr++) {
            for (let dc = -brushSize; dc <= brushSize; dc++) {
                if (dc*dc + dr*dr > brushSize*brushSize) continue;
                const c = cx + dc, r = cy + dr;
                if (c < 0 || c >= COLS || r < 0 || r >= ROWS) continue;
                if (gridRef.current[idx(c, r)] === 0) {
                    gridRef.current[idx(c, r)] = 1;
                    colorRef.current[idx(c, r)] = sandColorsParsed[Math.floor(Math.random() * sandColorsParsed.length)];
                }
            }
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const imageData = ctx.createImageData(W, H);
        const buf = new Uint32Array(imageData.data.buffer);

        const BG_COLOR = hexToRgba('#0c0a09');

        const tick = () => {
            const grid = gridRef.current;
            const colors = colorRef.current;

            // Rain mode: spawn sand at random top positions
            if (rainMode) {
                for (let i = 0; i < 5; i++) {
                    const c = Math.floor(Math.random() * COLS);
                    if (grid[idx(c, 0)] === 0) {
                        grid[idx(c, 0)] = 1;
                        colors[idx(c, 0)] = sandColorsParsed[Math.floor(Math.random() * sandColorsParsed.length)];
                    }
                }
            }

            // Mouse draw
            if (drawingRef.current) {
                const mx = Math.floor(mouseRef.current.x / CELL);
                const my = Math.floor(mouseRef.current.y / CELL);
                addSand(mx, my);
            }

            // Simulate — iterate bottom-up
            for (let r = ROWS - 2; r >= 0; r--) {
                for (let c = 0; c < COLS; c++) {
                    if (grid[idx(c, r)] !== 1) continue;
                    // Try fall straight down
                    if (grid[idx(c, r+1)] === 0) {
                        grid[idx(c, r+1)] = 1; colors[idx(c, r+1)] = colors[idx(c, r)];
                        grid[idx(c, r)] = 0; colors[idx(c, r)] = 0;
                    } else {
                        // Try diagonal (random left or right first)
                        const dir = Math.random() > 0.5 ? 1 : -1;
                        const c2 = c + dir;
                        const c3 = c - dir;
                        if (c2 >= 0 && c2 < COLS && grid[idx(c2, r+1)] === 0) {
                            grid[idx(c2, r+1)] = 1; colors[idx(c2, r+1)] = colors[idx(c, r)];
                            grid[idx(c, r)] = 0; colors[idx(c, r)] = 0;
                        } else if (c3 >= 0 && c3 < COLS && grid[idx(c3, r+1)] === 0) {
                            grid[idx(c3, r+1)] = 1; colors[idx(c3, r+1)] = colors[idx(c, r)];
                            grid[idx(c, r)] = 0; colors[idx(c, r)] = 0;
                        }
                    }
                }
            }

            // Render
            buf.fill(BG_COLOR);
            let count = 0;
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (grid[idx(c, r)] === 1) {
                        count++;
                        const px = c * CELL, py = r * CELL;
                        for (let dy = 0; dy < CELL; dy++) {
                            for (let dx = 0; dx < CELL; dx++) {
                                buf[(py + dy) * W + (px + dx)] = colors[idx(c, r)];
                            }
                        }
                    }
                }
            }
            setSandCount(count);

            ctx.putImageData(imageData, 0, 0);
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rainMode]);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const scaleX = W / rect.width, scaleY = H / rect.height;
        if ('touches' in e) {
            return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
        }
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    const clear = () => {
        gridRef.current.fill(0);
        colorRef.current.fill(0);
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-zinc-950 text-zinc-100 font-sans gap-4">
            <h1 className="text-4xl font-black tracking-widest text-amber-400 uppercase">Sand Sim</h1>

            <div className="flex gap-6 items-center flex-wrap justify-center">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-400">Brush:</span>
                    {[1, 3, 6].map(s => (
                        <button key={s} onClick={() => setBrushSize(s)}
                            className={`w-8 h-8 rounded-full border-2 transition-colors ${brushSize === s ? 'bg-amber-600 border-amber-400' : 'bg-zinc-800 border-zinc-600 hover:border-amber-700'}`}
                            style={{ fontSize: s * 4 + 'px' }}>●</button>
                    ))}
                </div>
                <button onClick={() => setRainMode(r => !r)}
                    className={`px-4 py-2 rounded-xl border font-bold text-sm uppercase tracking-widest transition-colors ${rainMode ? 'bg-blue-700 border-blue-400 text-white' : 'bg-zinc-800 border-zinc-600 hover:border-blue-700'}`}>
                    {rainMode ? '🌧 Rain ON' : '🌧 Rain OFF'}
                </button>
                <button onClick={clear} className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-600 hover:border-red-600 font-bold text-sm uppercase tracking-widest transition-colors">
                    🗑 Clear
                </button>
                <span className="text-zinc-500 text-sm">{sandCount.toLocaleString()} grains</span>
            </div>

            <canvas ref={canvasRef} width={W} height={H}
                className="rounded-xl border-2 border-zinc-800 cursor-crosshair shadow-2xl max-h-[65vh] w-auto"
                onMouseDown={e => { drawingRef.current = true; mouseRef.current = getPos(e); }}
                onMouseMove={e => { mouseRef.current = getPos(e); }}
                onMouseUp={() => { drawingRef.current = false; }}
                onMouseLeave={() => { drawingRef.current = false; }}
                onTouchStart={e => { e.preventDefault(); drawingRef.current = true; mouseRef.current = getPos(e); }}
                onTouchMove={e => { e.preventDefault(); mouseRef.current = getPos(e); }}
                onTouchEnd={() => { drawingRef.current = false; }}
            />
            <p className="text-zinc-600 text-xs">Click & drag to pour sand. Watch it settle!</p>
        </div>
    );
}
