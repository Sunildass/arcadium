import React, { useRef, useEffect, useState } from 'react';

const W = 500, H = 500;
const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#ffffff','#000000'];

interface StrokePath { color: string; width: number; points: [number, number][]; }

export default function PatternDrawing() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState('#60a5fa');
    const [brushWidth, setBrushWidth] = useState(6);
    const [symmetry, setSymmetry] = useState<2 | 4 | 8>(4);
    const [fill, setFill] = useState(false);
    const paths = useRef<StrokePath[]>([]);
    const current = useRef<StrokePath | null>(null);
    const drawing = useRef(false);

    const getPos = (e: React.MouseEvent | React.TouchEvent): [number, number] => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const scaleX = W / rect.width, scaleY = H / rect.height;
        if ('touches' in e) {
            return [(e.touches[0].clientX - rect.left) * scaleX, (e.touches[0].clientY - rect.top) * scaleY];
        }
        return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY];
    };

    const redraw = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = fill ? '#0f172a' : '#1e1b4b';
        ctx.fillRect(0, 0, W, H);

        const allPaths = [...paths.current, ...(current.current ? [current.current] : [])];
        for (const path of allPaths) {
            if (path.points.length < 2) continue;
            ctx.strokeStyle = path.color;
            ctx.lineWidth = path.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const angles = symmetry === 2 ? [0, Math.PI] : symmetry === 4 ? [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2] : Array.from({ length: 8 }, (_, i) => i * Math.PI / 4);

            ctx.save();
            ctx.translate(W / 2, H / 2);
            for (const angle of angles) {
                ctx.save();
                ctx.rotate(angle);
                ctx.beginPath();
                const [x0, y0] = path.points[0];
                ctx.moveTo(x0 - W / 2, y0 - H / 2);
                for (const [x, y] of path.points.slice(1)) ctx.lineTo(x - W / 2, y - H / 2);
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();
        }

        // Draw symmetry guide lines
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        const guideAngles = symmetry === 2 ? [0] : symmetry === 4 ? [0, Math.PI / 4] : Array.from({ length: 4 }, (_, i) => i * Math.PI / 4);
        for (const a of guideAngles) {
            ctx.beginPath(); ctx.rotate(1);
            ctx.moveTo(Math.cos(a) * -W, Math.sin(a) * -H);
            ctx.lineTo(Math.cos(a) * W, Math.sin(a) * H);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.restore();
    };

    useEffect(() => { redraw(); }, [color, brushWidth, symmetry, fill]);

    const onDown = (e: React.MouseEvent | React.TouchEvent) => {
        const pos = getPos(e);
        current.current = { color, width: brushWidth, points: [pos] };
        drawing.current = true;
    };
    const onMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawing.current || !current.current) return;
        current.current.points.push(getPos(e));
        redraw();
    };
    const onUp = () => {
        if (current.current) { paths.current.push(current.current); current.current = null; }
        drawing.current = false;
        redraw();
    };

    const clear = () => { paths.current = []; redraw(); };
    const undo = () => { paths.current.pop(); redraw(); };

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-gradient-to-b from-violet-950 to-zinc-950 text-zinc-100 font-sans gap-4">
            <h1 className="text-4xl font-black tracking-widest uppercase text-violet-400">Pattern Drawing</h1>

            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center justify-center">
                {/* Colors */}
                <div className="flex gap-1">
                    {COLORS.map(c => (
                        <button key={c} onClick={() => setColor(c)}
                            className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-white scale-125' : 'border-transparent hover:scale-110'}`}
                            style={{ backgroundColor: c }} />
                    ))}
                </div>

                {/* Brush size */}
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <span>Width:</span>
                    {[2, 6, 12, 20].map(s => (
                        <button key={s} onClick={() => setBrushWidth(s)}
                            className={`w-7 h-7 rounded-full border flex items-center justify-center ${brushWidth === s ? 'border-violet-400 bg-violet-900' : 'border-zinc-600 bg-zinc-800 hover:border-violet-600'}`}>
                            <div className="bg-current rounded-full" style={{ width: Math.max(3, s / 2), height: Math.max(3, s / 2), backgroundColor: color }} />
                        </button>
                    ))}
                </div>

                {/* Symmetry */}
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <span>Symmetry:</span>
                    {([2, 4, 8] as const).map(s => (
                        <button key={s} onClick={() => setSymmetry(s)}
                            className={`px-2 py-1 rounded border text-xs font-bold ${symmetry === s ? 'border-violet-400 bg-violet-900 text-white' : 'border-zinc-600 bg-zinc-800 hover:border-violet-600'}`}>
                            {s}x
                        </button>
                    ))}
                </div>

                <button onClick={undo} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded text-xs font-bold uppercase">↩ Undo</button>
                <button onClick={clear} className="px-3 py-1 bg-zinc-800 hover:bg-red-900 border border-zinc-600 hover:border-red-700 rounded text-xs font-bold uppercase">🗑 Clear</button>
            </div>

            <canvas ref={canvasRef} width={W} height={H}
                className="rounded-2xl border-2 border-violet-900 cursor-crosshair shadow-2xl max-h-[60vh] w-auto"
                onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
                onTouchStart={e => { e.preventDefault(); onDown(e); }}
                onTouchMove={e => { e.preventDefault(); onMove(e); }}
                onTouchEnd={onUp}
            />
            <p className="text-zinc-600 text-xs">Draw lines that are mirrored with symmetry. Make mandalas!</p>
        </div>
    );
}
