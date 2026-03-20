import React, { useState, useEffect, useRef, useCallback } from 'react';

const W = 400, H = 600;
const PLAYER_W = 40, PLAYER_H = 40;
const OBSTACLE_H = 25;

interface Obstacle { x: number; y: number; w: number; color: string; }

const OBS_COLORS = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6'];

export default function DodgeObstacles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef({
        playerX: W / 2 - PLAYER_W / 2,
        obstacles: [] as Obstacle[],
        score: 0, speed: 1.5, frame: 0, lastObs: 0,
        dead: false, started: false,
        keys: { left: false, right: false },
    });
    const [display, setDisplay] = useState({ score: 0, dead: false, started: false });
    const rafRef = useRef<number>(0);

    const restart = useCallback(() => {
        stateRef.current = {
            playerX: W / 2 - PLAYER_W / 2,
            obstacles: [], score: 0, speed: 1.5, frame: 0, lastObs: 0,
            dead: false, started: false,
            keys: { left: false, right: false },
        };
        setDisplay({ score: 0, dead: false, started: false });
    }, []);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const s = stateRef.current;
            if (!s.started && !s.dead) s.started = true;
            if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); s.keys.left = true; }
            if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); s.keys.right = true; }
        };
        const up = (e: KeyboardEvent) => {
            const s = stateRef.current;
            if (e.key === 'ArrowLeft' || e.key === 'a') s.keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd') s.keys.right = false;
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        const tick = () => {
            const s = stateRef.current;

            ctx.fillStyle = '#0f0f1a';
            ctx.fillRect(0, 0, W, H);

            if (s.started && !s.dead) {
                // Move player
                const SPEED = 5;
                if (s.keys.left) s.playerX = Math.max(0, s.playerX - SPEED);
                if (s.keys.right) s.playerX = Math.min(W - PLAYER_W, s.playerX + SPEED);

                // Spawn obstacles — gap shrinks only as speed increases
                if (s.frame - s.lastObs > Math.max(50, 120 - s.speed * 8)) {
                    const obsW = 40 + Math.random() * 100;
                    const obsX = Math.random() * (W - obsW);
                    s.obstacles.push({ x: obsX, y: -OBSTACLE_H, w: obsW, color: OBS_COLORS[Math.floor(Math.random() * OBS_COLORS.length)] });
                    s.lastObs = s.frame;
                }

                s.obstacles.forEach(o => { o.y += s.speed; });
                s.obstacles = s.obstacles.filter(o => o.y < H);

                s.score++;
                if (s.frame % 500 === 0) s.speed = Math.min(s.speed + 0.2, 9);

                // Collision
                const py = H - 80 - PLAYER_H;
                for (const o of s.obstacles) {
                    if (s.playerX < o.x + o.w && s.playerX + PLAYER_W > o.x && py < o.y + OBSTACLE_H && py + PLAYER_H > o.y) {
                        s.dead = true; setDisplay({ score: Math.floor(s.score / 10), dead: true, started: true }); break;
                    }
                }
                if (s.frame % 10 === 0) setDisplay({ score: Math.floor(s.score / 10), dead: false, started: true });
            }

            // Draw obstacles
            s.obstacles.forEach(o => {
                ctx.fillStyle = o.color;
                ctx.beginPath();
                ctx.roundRect(o.x, o.y, o.w, OBSTACLE_H, 6);
                ctx.fill();
            });

            // Draw player ship
            const py = H - 80 - PLAYER_H;
            ctx.fillStyle = '#60a5fa';
            ctx.beginPath();
            ctx.moveTo(s.playerX + PLAYER_W / 2, py);
            ctx.lineTo(s.playerX, py + PLAYER_H);
            ctx.lineTo(s.playerX + PLAYER_W, py + PLAYER_H);
            ctx.closePath(); ctx.fill();
            // Thruster flame
            ctx.fillStyle = '#fb923c';
            ctx.beginPath();
            const flame = Math.sin(s.frame * 0.5) * 6;
            ctx.moveTo(s.playerX + 8, py + PLAYER_H);
            ctx.lineTo(s.playerX + PLAYER_W - 8, py + PLAYER_H);
            ctx.lineTo(s.playerX + PLAYER_W / 2, py + PLAYER_H + 14 + flame);
            ctx.closePath(); ctx.fill();

            // Score
            ctx.fillStyle = '#d1d5db';
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`Score: ${Math.floor(s.score / 10)}`, 12, 28);

            s.frame++;
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[90vh] bg-[#0f0f1a] font-sans gap-4">
            <h1 className="text-4xl font-black tracking-widest text-blue-400 uppercase">Dodge!</h1>
            <div className="text-zinc-500 text-sm">Arrow Keys / A,D to move. Dodge the falling blocks!</div>

            <div className="relative">
                <canvas ref={canvasRef} width={W} height={H}
                    className="rounded-2xl shadow-2xl border-4 border-blue-900 max-h-[70vh] w-auto" />

                {!display.started && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl pointer-events-none">
                        <div className="text-2xl font-black text-white">Press Arrow Key to Start!</div>
                    </div>
                )}
                {display.dead && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-2xl">
                        <div className="text-4xl font-black text-red-400 mb-2">Hit!</div>
                        <div className="text-white font-bold text-2xl mb-6">Score: {display.score}</div>
                        <button onClick={restart} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl">
                            🔄 Try Again
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile touch controls */}
            <div className="flex gap-4 md:hidden">
                {(['left','right'] as const).map(dir => (
                    <button key={dir}
                        onPointerDown={() => { stateRef.current.started = true; stateRef.current.keys[dir] = true; }}
                        onPointerUp={() => stateRef.current.keys[dir] = false}
                        onPointerLeave={() => stateRef.current.keys[dir] = false}
                        className="w-20 h-16 bg-blue-900 border-2 border-blue-600 rounded-xl text-2xl active:bg-blue-700">
                        {dir === 'left' ? '⬅' : '➡'}
                    </button>
                ))}
            </div>
        </div>
    );
}
