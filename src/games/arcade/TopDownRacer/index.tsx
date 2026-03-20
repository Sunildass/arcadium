import React, { useRef, useEffect, useState, useCallback } from 'react';

const W = 400, H = 600;
const TRACK_LEFT = 80, TRACK_RIGHT = 320;
const TRACK_W = TRACK_RIGHT - TRACK_LEFT;
const PLAYER_W = 30, PLAYER_H = 50;
const LANE_COUNT = 3;
const LANE_W = TRACK_W / LANE_COUNT;

interface CarEntity { x: number; y: number; w: number; h: number; lane: number; color: string; speed: number; }
interface RoadMark { y: number; }

const AI_COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#ec4899'];

function laneX(lane: number) {
    return TRACK_LEFT + lane * LANE_W + LANE_W / 2 - PLAYER_W / 2;
}

export default function TopDownRacer() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef({
        player: { x: laneX(1), y: H - 100, w: PLAYER_W, h: PLAYER_H, lane: 1, color: '#22d3ee', speed: 0 },
        aiCars: [] as CarEntity[],
        marks: Array.from({ length: 10 }, (_, i) => ({ y: i * 70 })) as RoadMark[],
        score: 0,
        speed: 3,
        frame: 0,
        dead: false,
        started: false,
        targetLane: 1,
    });
    const [display, setDisplay] = useState({ score: 0, dead: false, started: false });
    const rafRef = useRef<number>(0);

    const restart = useCallback(() => {
        const s = stateRef.current;
        s.player = { x: laneX(1), y: H - 100, w: PLAYER_W, h: PLAYER_H, lane: 1, color: '#22d3ee', speed: 0 };
        s.aiCars = []; s.marks = Array.from({ length: 10 }, (_, i) => ({ y: i * 70 }));
        s.score = 0; s.speed = 3; s.frame = 0; s.dead = false; s.started = false; s.targetLane = 1;
        setDisplay({ score: 0, dead: false, started: false });
    }, []);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const s = stateRef.current;
            if (!s.started && !s.dead) s.started = true;
            if (e.key === 'ArrowLeft') { e.preventDefault(); s.targetLane = Math.max(0, s.targetLane - 1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); s.targetLane = Math.min(LANE_COUNT - 1, s.targetLane + 1); }
        };
        window.addEventListener('keydown', down);
        return () => window.removeEventListener('keydown', down);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        function spawnAI(speed: number) {
            const lane = Math.floor(Math.random() * LANE_COUNT);
            const color = AI_COLORS[Math.floor(Math.random() * AI_COLORS.length)];
            stateRef.current.aiCars.push({ x: laneX(lane), y: -60, w: PLAYER_W, h: PLAYER_H, lane, color, speed: speed * (0.4 + Math.random() * 0.3) });
        }

        function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, w = PLAYER_W, h = PLAYER_H) {
            // Body
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.roundRect(x, y + 8, w, h - 16, 4); ctx.fill();
            // Roof
            ctx.fillStyle = color + 'cc';
            ctx.beginPath(); ctx.roundRect(x + 4, y + 12, w - 8, h - 28, 3); ctx.fill();
            // Windows
            ctx.fillStyle = '#93c5fd44';
            ctx.fillRect(x + 5, y + 14, w - 10, 10);
            // Wheels
            ctx.fillStyle = '#111';
            ctx.fillRect(x - 3, y + 8, 5, 10);
            ctx.fillRect(x + w - 2, y + 8, 5, 10);
            ctx.fillRect(x - 3, y + h - 20, 5, 10);
            ctx.fillRect(x + w - 2, y + h - 20, 5, 10);
            // Headlights / taillights
            ctx.fillStyle = '#fef9c3';
            ctx.fillRect(x + 3, y + 4, 5, 4); ctx.fillRect(x + w - 8, y + 4, 5, 4);
            ctx.fillStyle = '#f87171';
            ctx.fillRect(x + 3, y + h - 10, 5, 4); ctx.fillRect(x + w - 8, y + h - 10, 5, 4);
        }

        const tick = () => {
            const s = stateRef.current;
            const p = s.player;

            // Road background
            ctx.fillStyle = '#374151';
            ctx.fillRect(0, 0, W, H);
            // Grass
            ctx.fillStyle = '#15803d';
            ctx.fillRect(0, 0, TRACK_LEFT, H);
            ctx.fillRect(TRACK_RIGHT, 0, W - TRACK_RIGHT, H);
            // Road surface
            ctx.fillStyle = '#4b5563';
            ctx.fillRect(TRACK_LEFT, 0, TRACK_W, H);
            // Curbs
            const curbW = 8;
            for (let y = 0; y < H; y += 30) {
                ctx.fillStyle = y % 60 < 30 ? '#ef4444' : '#fff';
                ctx.fillRect(TRACK_LEFT, y, curbW, 30);
                ctx.fillRect(TRACK_RIGHT - curbW, y, curbW, 30);
            }
            // Lane markings
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 3;
            ctx.setLineDash([30, 20]);
            for (let lane = 1; lane < LANE_COUNT; lane++) {
                const lx = TRACK_LEFT + lane * LANE_W;
                ctx.lineDashOffset = -((s.frame * s.speed) % 50);
                ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
            }
            ctx.setLineDash([]);

            if (s.started && !s.dead) {
                // Move player toward target lane
                const targetX = laneX(s.targetLane);
                p.x += (targetX - p.x) * 0.15;
                p.lane = s.targetLane;

                // Spawn AI — less frequent at start
                const spawnInterval = Math.max(60, 120 - Math.floor(s.speed * 6));
                if (s.frame % spawnInterval === 0) spawnAI(s.speed);
                s.aiCars.forEach(c => { c.y += s.speed - c.speed; });
                s.aiCars = s.aiCars.filter(c => c.y < H + 80);

                s.score++;
                // Smooth continuous ramp: starts at 3, caps at 9
                s.speed = Math.min(3 + s.score * 0.0005, 9);

                // Collision
                for (const c of s.aiCars) {
                    if (c.y + c.h > p.y && c.y < p.y + p.h &&
                        c.x + c.w - 6 > p.x + 4 && c.x + 6 < p.x + p.w - 4) {
                        s.dead = true; setDisplay({ score: Math.floor(s.score / 10), dead: true, started: true });
                    }
                }

                if (s.frame % 10 === 0) setDisplay({ score: Math.floor(s.score / 10), dead: false, started: true });
            }

            // Draw AI cars
            for (const c of s.aiCars) drawCar(ctx, c.x, c.y, c.color);

            // Draw player car
            drawCar(ctx, p.x, p.y, p.color);

            // Speed indicator
            ctx.fillStyle = '#cbd5e1'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'right';
            ctx.fillText(`${Math.floor(s.speed * 40)} km/h`, W - 10, 24);
            ctx.textAlign = 'left';
            ctx.fillText(`${Math.floor(s.score / 10)}m`, 10, 24);

            if (!s.started && !s.dead) {
                ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
                ctx.fillStyle = '#22d3ee'; ctx.textAlign = 'center'; ctx.font = 'bold 22px monospace';
                ctx.fillText('TOP-DOWN RACER', W / 2, H / 2 - 20);
                ctx.fillStyle = '#aaa'; ctx.font = '13px monospace';
                ctx.fillText('← → Arrow Keys to change lane', W / 2, H / 2 + 10);
            }

            s.frame++;
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[90vh] bg-gray-950 font-mono gap-4">
            <h1 className="text-4xl font-black tracking-widest text-cyan-400 uppercase">Top-Down Racer</h1>

            <div className="relative">
                <canvas ref={canvasRef} width={W} height={H}
                    className="rounded-xl border-2 border-gray-700 shadow-2xl max-h-[70vh] w-auto" />

                {display.dead && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl">
                        <div className="text-3xl font-black text-red-400 mb-2">Crash!</div>
                        <div className="text-white font-bold text-2xl mb-5">{display.score}m driven</div>
                        <button onClick={restart} className="px-8 py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-black uppercase tracking-widest rounded-xl">
                            🔄 Race Again
                        </button>
                    </div>
                )}
            </div>

            <div className="text-zinc-600 text-xs">← → Arrow Keys to switch lanes. Avoid other cars!</div>

            {/* Mobile controls */}
            <div className="flex gap-4 md:hidden">
                <button className="w-16 h-12 bg-gray-800 border border-cyan-900 rounded-xl text-white text-xl font-black"
                    onClick={() => { const s = stateRef.current; if (!s.started) s.started = true; s.targetLane = Math.max(0, s.targetLane - 1); }}>⬅</button>
                <button className="w-16 h-12 bg-gray-800 border border-cyan-900 rounded-xl text-white text-xl font-black"
                    onClick={() => { const s = stateRef.current; if (!s.started) s.started = true; s.targetLane = Math.min(LANE_COUNT - 1, s.targetLane + 1); }}>➡</button>
            </div>
        </div>
    );
}
