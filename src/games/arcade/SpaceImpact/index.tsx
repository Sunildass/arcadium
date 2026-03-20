import React, { useRef, useEffect, useState, useCallback } from 'react';

const W = 400, H = 280;
const PLAYER_SPEED = 3;
const BULLET_SPEED = 7;
const ENEMY_SPAWN_INTERVAL = 150; // frames — starts slow

interface Entity { x: number; y: number; w: number; h: number; alive: boolean; }
interface Enemy extends Entity { vx: number; vy: number; type: 0 | 1 | 2; hp: number; }
interface Bullet extends Entity { vx: number; }
interface Explosion { x: number; y: number; r: number; maxR: number; age: number; color: string; }
interface Star { x: number; y: number; speed: number; brightness: number; }

export default function SpaceImpact() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef({
        player: { x: 30, y: H / 2 - 10, w: 28, h: 20, alive: true },
        bullets: [] as Bullet[],
        enemies: [] as Enemy[],
        explosions: [] as Explosion[],
        stars: Array.from({ length: 50 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            speed: 0.3 + Math.random() * 1.2,
            brightness: 0.3 + Math.random() * 0.7,
        })) as Star[],
        score: 0,
        lives: 3,
        frame: 0,
        wave: 1,
        dead: false,
        started: false,
        keys: { up: false, down: false, left: false, right: false, fire: false },
        lastShot: 0,
    });
    const [display, setDisplay] = useState({ score: 0, lives: 3, dead: false, started: false, wave: 1 });
    const rafRef = useRef<number>(0);

    const restart = useCallback(() => {
        const s = stateRef.current;
        s.player = { x: 30, y: H / 2 - 10, w: 28, h: 20, alive: true };
        s.bullets = []; s.enemies = []; s.explosions = [];
        s.score = 0; s.lives = 3; s.frame = 0; s.wave = 1; s.lastShot = 0;
        s.dead = false; s.started = false;
        setDisplay({ score: 0, lives: 3, dead: false, started: false, wave: 1 });
    }, []);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const s = stateRef.current;
            if (!s.started && !s.dead) s.started = true;
            if (e.key === 'ArrowUp') { e.preventDefault(); s.keys.up = true; }
            if (e.key === 'ArrowDown') { e.preventDefault(); s.keys.down = true; }
            if (e.key === 'ArrowLeft') { e.preventDefault(); s.keys.left = true; }
            if (e.key === 'ArrowRight') { e.preventDefault(); s.keys.right = true; }
            if (e.key === ' ' || e.key === 'z' || e.key === 'Z') { e.preventDefault(); s.keys.fire = true; }
        };
        const up = (e: KeyboardEvent) => {
            const s = stateRef.current;
            if (e.key === 'ArrowUp') s.keys.up = false;
            if (e.key === 'ArrowDown') s.keys.down = false;
            if (e.key === 'ArrowLeft') s.keys.left = false;
            if (e.key === 'ArrowRight') s.keys.right = false;
            if (e.key === ' ' || e.key === 'z' || e.key === 'Z') s.keys.fire = false;
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        function spawnEnemy(wave: number) {
            const types: (0 | 1 | 2)[] = [0, 0, 0, 1, 1, 2];
            const type = types[Math.min(Math.floor(Math.random() * (2 + wave)), 2)] as 0 | 1 | 2;
            const speed = 0.7 + wave * 0.35 + Math.random() * 0.4;
            const y = 10 + Math.random() * (H - 40);
            const vy = type === 1 ? (Math.random() - 0.5) * 1.5 : 0;
            const hp = type === 2 ? 3 : 1;
            stateRef.current.enemies.push({ x: W + 10, y, w: 22, h: 16, vx: -speed, vy, type, hp, alive: true });
        }

        function collides(a: Entity, b: Entity) {
            return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
        }

        function drawPlayer(ctx: CanvasRenderingContext2D, p: typeof stateRef.current.player) {
            ctx.fillStyle = '#22d3ee';
            // Body
            ctx.fillRect(p.x, p.y + 6, 20, 8);
            // Nose
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath(); ctx.moveTo(p.x + 20, p.y + 10); ctx.lineTo(p.x + 28, p.y + 10); ctx.lineTo(p.x + 20, p.y + 6); ctx.fill();
            // Top wing
            ctx.fillStyle = '#7dd3fc';
            ctx.fillRect(p.x + 4, p.y, 14, 7);
            // Bottom wing
            ctx.fillRect(p.x + 4, p.y + 13, 14, 7);
            // Thruster glow
            ctx.fillStyle = '#fb923c';
            ctx.beginPath(); ctx.ellipse(p.x, p.y + 10, 4 + Math.random() * 3, 4, 0, 0, Math.PI * 2); ctx.fill();
        }

        function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
            const colors = ['#ef4444', '#f97316', '#8b5cf6'];
            ctx.fillStyle = colors[e.type];
            if (e.type === 0) {
                // Basic saucer
                ctx.beginPath(); ctx.ellipse(e.x + 11, e.y + 8, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff4'; ctx.beginPath(); ctx.ellipse(e.x + 11, e.y + 6, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
            } else if (e.type === 1) {
                // Fighter jet
                ctx.fillRect(e.x, e.y + 5, 22, 6);
                ctx.beginPath(); ctx.moveTo(e.x, e.y + 8); ctx.lineTo(e.x - 6, e.y + 8); ctx.lineTo(e.x, e.y + 4); ctx.fill();
                ctx.fillRect(e.x + 6, e.y, 8, 5); ctx.fillRect(e.x + 6, e.y + 11, 8, 5);
            } else {
                // Boss
                ctx.fillStyle = '#7c3aed';
                ctx.fillRect(e.x, e.y, 22, 16);
                ctx.fillStyle = '#a78bfa';
                for (let i = 0; i < e.hp; i++) ctx.fillRect(e.x + 2 + i * 7, e.y + 2, 5, 5);
            }
        }

        const tick = () => {
            const s = stateRef.current;

            // Background
            ctx.fillStyle = '#000011';
            ctx.fillRect(0, 0, W, H);

            // Stars
            for (const star of s.stars) {
                star.x -= star.speed;
                if (star.x < 0) { star.x = W; star.y = Math.random() * H; }
                ctx.fillStyle = `rgba(255,255,255,${star.brightness})`;
                ctx.fillRect(star.x, star.y, 1, 1);
            }

            if (s.started && !s.dead) {
                const p = s.player;
                // Movement
                if (s.keys.up && p.y > 0) p.y -= PLAYER_SPEED;
                if (s.keys.down && p.y < H - p.h) p.y += PLAYER_SPEED;
                if (s.keys.left && p.x > 0) p.x -= PLAYER_SPEED;
                if (s.keys.right && p.x < W - p.w - 20) p.x += PLAYER_SPEED;

                // Shoot
                if (s.keys.fire && s.frame - s.lastShot > 12) {
                    s.bullets.push({ x: p.x + p.w, y: p.y + p.h / 2 - 2, w: 10, h: 3, vx: BULLET_SPEED, alive: true });
                    s.lastShot = s.frame;
                }

                // Update bullets
                s.bullets.forEach(b => { b.x += b.vx; if (b.x > W) b.alive = false; });
                s.bullets = s.bullets.filter(b => b.alive);

                // Spawn enemies — count scales with wave (1 at wave 1, up to 5 at wave 9+)
                const spawnRate = Math.max(40, ENEMY_SPAWN_INTERVAL - s.wave * 8);
                if (s.frame % spawnRate === 0) {
                    const count = Math.min(Math.ceil(s.wave / 2), 5);
                    for (let i = 0; i < count; i++) {
                        // Stagger spawn slightly in time-equivalent vertical spread
                        setTimeout(() => spawnEnemy(s.wave), i * 120);
                    }
                }
                s.enemies.forEach(e => { e.x += e.vx; e.y += e.vy;
                    if (e.y < 0 || e.y > H) e.vy *= -1;
                    if (e.x < -30) e.alive = false;
                });

                // Bullet-enemy collision
                for (const b of s.bullets) {
                    for (const e of s.enemies) {
                        if (e.alive && b.alive && collides(b, e)) {
                            b.alive = false; e.hp--;
                            if (e.hp <= 0) {
                                e.alive = false;
                                s.score += (e.type + 1) * 100;
                                s.explosions.push({ x: e.x + 11, y: e.y + 8, r: 0, maxR: 18 + e.type * 8, age: 0, color: ['#f97316','#ef4444','#a78bfa'][e.type] });
                            }
                        }
                    }
                }

                // Player-enemy collision
                for (const e of s.enemies) {
                    if (e.alive && collides(p, { ...e, x: e.x - 2, y: e.y - 2, w: e.w + 4, h: e.h + 4, alive: true })) {
                        e.alive = false; s.lives--;
                        s.explosions.push({ x: p.x + 14, y: p.y + 10, r: 0, maxR: 30, age: 0, color: '#22d3ee' });
                        if (s.lives <= 0) { s.dead = true; setDisplay(d => ({ ...d, dead: true, score: s.score })); }
                    }
                }

                s.enemies = s.enemies.filter(e => e.alive);

                // Wave progression
                if (s.frame > 0 && s.frame % 1200 === 0) { s.wave = Math.min(s.wave + 1, 10); }

                // Update explosions
                s.explosions.forEach(ex => { ex.r = Math.min(ex.r + 2, ex.maxR); ex.age++; });
                s.explosions = s.explosions.filter(ex => ex.age < 15);

                if (s.frame % 5 === 0) setDisplay({ score: s.score, lives: s.lives, dead: s.dead, started: true, wave: s.wave });
            }

            // Draw enemies
            for (const e of s.enemies) drawEnemy(ctx, e);

            // Draw bullets
            ctx.fillStyle = '#facc15';
            for (const b of s.bullets) { ctx.fillRect(b.x, b.y, b.w, b.h); }

            // Draw explosions
            for (const ex of s.explosions) {
                ctx.globalAlpha = 1 - ex.age / 15;
                ctx.strokeStyle = ex.color; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = ex.color + '44';
                ctx.beginPath(); ctx.arc(ex.x, ex.y, ex.r * 0.5, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
            }

            // Draw player
            if (s.started && !s.dead) drawPlayer(ctx, s.player);

            // HUD
            ctx.fillStyle = '#22d3ee';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`WAVE ${s.wave}`, 8, 16);
            ctx.textAlign = 'right';
            ctx.fillText(`${s.score}`, W - 8, 16);
            ctx.textAlign = 'left';
            ctx.fillText('♥'.repeat(s.lives), 8, H - 6);

            if (!s.started && !s.dead) {
                ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
                ctx.fillStyle = '#22d3ee'; ctx.textAlign = 'center'; ctx.font = 'bold 18px monospace';
                ctx.fillText('SPACE IMPACT', W / 2, H / 2 - 20);
                ctx.fillStyle = '#aaa'; ctx.font = '12px monospace';
                ctx.fillText('Press Arrow Keys + Space to play', W / 2, H / 2 + 5);
            }

            s.frame++;
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[90vh] bg-[#000011] font-mono gap-4">
            <h1 className="text-4xl font-black tracking-widest text-cyan-400 uppercase">Space Impact</h1>

            <div className="flex gap-8 text-center">
                <div><div className="text-2xl font-black text-yellow-400">{display.score}</div><div className="text-xs text-zinc-500 uppercase">Score</div></div>
                <div><div className="text-2xl font-black text-cyan-400">Wave {display.wave}</div><div className="text-xs text-zinc-500 uppercase">Wave</div></div>
                <div><div className="text-2xl font-black text-red-400">{'♥'.repeat(display.lives)}</div><div className="text-xs text-zinc-500 uppercase">Lives</div></div>
            </div>

            <div className="relative">
                <canvas ref={canvasRef} width={W} height={H}
                    className="rounded-xl border-2 border-cyan-900 shadow-[0_0_30px_rgba(34,211,238,0.3)]" style={{ imageRendering: 'pixelated' }} />

                {display.dead && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl">
                        <div className="text-3xl font-black text-cyan-400 mb-1">GAME OVER</div>
                        <div className="text-white font-bold text-xl mb-5">Score: {display.score}</div>
                        <button onClick={restart} className="px-8 py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-black uppercase tracking-widest rounded-xl">
                            ▶ Play Again
                        </button>
                    </div>
                )}
            </div>

            <div className="text-zinc-600 text-xs text-center">Arrow Keys to move &nbsp;|&nbsp; Space / Z to shoot</div>

            {/* Mobile controls */}
            <div className="grid grid-cols-3 gap-2 md:hidden">
                {['↑','←','→','↓'].map((dir, i) => (
                    <button key={i} className={`${i === 0 ? 'col-start-2' : i === 1 ? 'col-start-1 row-start-2' : i === 2 ? 'col-start-3 row-start-2' : 'col-start-2 row-start-3'} w-12 h-12 bg-zinc-800 border border-cyan-900 rounded-lg text-white font-black text-xl`}
                        onPointerDown={() => {
                            const s = stateRef.current; if (!s.started) s.started = true;
                            if (dir === '↑') s.keys.up = true;
                            if (dir === '↓') s.keys.down = true;
                            if (dir === '←') s.keys.left = true;
                            if (dir === '→') s.keys.right = true;
                        }}
                        onPointerUp={() => {
                            const s = stateRef.current;
                            if (dir === '↑') s.keys.up = false;
                            if (dir === '↓') s.keys.down = false;
                            if (dir === '←') s.keys.left = false;
                            if (dir === '→') s.keys.right = false;
                        }}>
                        {dir}
                    </button>
                ))}
                <button className="col-start-3 row-start-3 w-12 h-12 bg-cyan-800 border border-cyan-600 rounded-lg text-white font-black"
                    onPointerDown={() => { const s = stateRef.current; if (!s.started) s.started = true; s.keys.fire = true; }}
                    onPointerUp={() => stateRef.current.keys.fire = false}>🔫</button>
            </div>
        </div>
    );
}
