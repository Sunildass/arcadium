import React, { useRef, useEffect, useState, useCallback } from 'react';

const W = 400, H = 600;
const BALL_R = 14;
const GRAVITY = 0.4;
const DAMPING = 0.7; // bounce energy retention
const FRICTION = 0.98;
const MAX_BALLS = 60;

const BALL_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#f43f5e','#a78bfa'];

interface Ball {
    x: number; y: number;
    vx: number; vy: number;
    r: number;
    color: string;
    id: number;
}

let nextId = 0;

export default function BallDropPhysics() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ballsRef = useRef<Ball[]>([]);
    const rafRef = useRef<number>(0);
    const [count, setCount] = useState(0);
    const [pegs, setPegs] = useState<{ x: number; y: number }[]>(() => {
        // Grid of pegs
        const p: { x:number; y:number }[] = [];
        for (let row = 0; row < 7; row++) {
            const cols = row % 2 === 0 ? 6 : 5;
            const offset = row % 2 === 0 ? 0 : W / 12;
            for (let c = 0; c < cols; c++) {
                p.push({ x: offset + c * (W / 6) + W / 12, y: 120 + row * 60 });
            }
        }
        return p;
    });

    const spawnBall = useCallback((x: number) => {
        if (ballsRef.current.length >= MAX_BALLS) return;
        ballsRef.current.push({
            x, y: 20, vx: (Math.random() - 0.5) * 2, vy: 1,
            r: BALL_R, color: BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)],
            id: nextId++
        });
        setCount(ballsRef.current.length);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        const PEG_R = 6;

        const tick = () => {
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(0, 0, W, H);

            const balls = ballsRef.current;

            // Update physics
            for (const ball of balls) {
                ball.vy += GRAVITY;
                ball.vx *= FRICTION;
                ball.x += ball.vx;
                ball.y += ball.vy;

                // Wall bounce
                if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx = Math.abs(ball.vx) * DAMPING; }
                if (ball.x + ball.r > W)  { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx) * DAMPING; }
                // Floor
                if (ball.y + ball.r > H - 20) {
                    ball.y = H - 20 - ball.r;
                    ball.vy = -Math.abs(ball.vy) * DAMPING;
                    ball.vx *= 0.95;
                }

                // Peg collisions
                for (const peg of pegs) {
                    const dx = ball.x - peg.x, dy = ball.y - peg.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    const minDist = ball.r + PEG_R;
                    if (dist < minDist && dist > 0) {
                        const nx = dx / dist, ny = dy / dist;
                        ball.x = peg.x + nx * minDist;
                        ball.y = peg.y + ny * minDist;
                        const dot = ball.vx * nx + ball.vy * ny;
                        ball.vx = (ball.vx - 2 * dot * nx) * DAMPING;
                        ball.vy = (ball.vy - 2 * dot * ny) * DAMPING;
                    }
                }

                // Ball-ball collisions (simple)
                for (const other of balls) {
                    if (other.id === ball.id) continue;
                    const dx = ball.x - other.x, dy = ball.y - other.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    const minDist = ball.r + other.r;
                    if (dist < minDist && dist > 0) {
                        const nx = dx / dist, ny = dy / dist;
                        const overlap = minDist - dist;
                        ball.x += nx * overlap * 0.5; ball.y += ny * overlap * 0.5;
                        other.x -= nx * overlap * 0.5; other.y -= ny * overlap * 0.5;
                        const dvx = ball.vx - other.vx, dvy = ball.vy - other.vy;
                        const dot = dvx * nx + dvy * ny;
                        if (dot < 0) {
                            ball.vx -= dot * nx * DAMPING; ball.vy -= dot * ny * DAMPING;
                            other.vx += dot * nx * DAMPING; other.vy += dot * ny * DAMPING;
                        }
                    }
                }
            }

            // Draw pegs
            for (const peg of pegs) {
                ctx.beginPath(); ctx.arc(peg.x, peg.y, PEG_R, 0, Math.PI * 2);
                ctx.fillStyle = '#475569'; ctx.fill();
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.stroke();
            }

            // Draw balls
            for (const ball of balls) {
                ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
                ctx.fillStyle = ball.color; ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.stroke();
            }

            // Count display
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`${balls.length} balls`, 10, 20);

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [pegs]);

    const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const scaleX = W / rect.width;
        const x = (e.clientX - rect.left) * scaleX;
        spawnBall(x);
    }, [spawnBall]);

    const clear = () => { ballsRef.current = []; setCount(0); };

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-[#050508] text-zinc-100 font-sans gap-4">
            <h1 className="text-4xl font-black tracking-widest text-purple-400 uppercase">Ball Drop</h1>

            <div className="flex gap-4 items-center flex-wrap justify-center">
                <p className="text-zinc-500 text-sm">Click canvas to drop colored balls through pegs!</p>
                <button onClick={() => { for(let i=0;i<5;i++) spawnBall(60 + Math.random()*(W-120)); }}
                    className="px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded-xl text-white font-bold text-sm uppercase tracking-widest transition-all">
                    +5 Balls
                </button>
                <button onClick={clear} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-xl text-sm font-bold uppercase tracking-widest transition-all">
                    🗑 Clear
                </button>
            </div>

            <canvas ref={canvasRef} width={W} height={H}
                onClick={handleCanvasClick}
                className="rounded-xl border-2 border-zinc-900 cursor-pointer shadow-2xl max-h-[65vh] w-auto" />
        </div>
    );
}
