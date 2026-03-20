import React, { useRef, useEffect, useState, useCallback } from 'react';

// Chrome Offline Dino — faithful recreation
const W = 600, H = 180;
const GY = H - 30;    // ground y = 150
const DX = 70;        // dino fixed x

const GRAVITY = 0.65;
const JUMP_V  = -13.5;

// DARK / BG match Chrome game exactly
const DARK = '#535353';
const BG   = '#f7f7f7';

// ─── Pixel-faithful T-Rex drawing ────────────────────────────────────────────
// Each numeric call is a fillRect(x+rx, y+ry, w, h).
// Origin (x, y) = top-left of the dino bounding box.
// Standing bounding box:  46px wide × 52px tall
// Ducking bounding box:   74px wide × 30px tall

function drawDino(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    frame: number,
    ducking: boolean,
    dead: boolean,
) {
    const dx = Math.round(x);
    const dy = Math.round(y);
    const fill = (rx: number, ry: number, w: number, h: number) =>
        ctx.fillRect(dx + rx, dy + ry, w, h);

    ctx.fillStyle = DARK;

    if (ducking) {
        // ── Ducking form ──────────────────────────────────────────────
        // Head (front-facing, low)
        fill(42, 0,  28, 12);   // top of head
        fill(52, 10, 20,  8);   // snout continuation
        fill(54, 16, 14,  4);   // chin
        // Eye socket
        ctx.fillStyle = BG;
        fill(58, 2, 8, 6);
        ctx.fillStyle = DARK;
        fill(61, 3, 4, 4);      // pupil
        // Neck
        ctx.fillStyle = DARK;
        fill(36, 4, 10, 10);
        // Body
        fill(4, 4, 34, 18);
        // Tail
        fill(0, 8,  6, 12);
        fill(-6, 12, 8, 8);
        fill(-10,16, 6, 4);
        // Legs — animate
        const L = Math.floor(frame / 6) % 2;
        const lx = [10, 22];
        fill(lx[L],    22, 8, ducking ? 12 : 0);
        fill(lx[1-L],  22, 8, 8);
        fill(lx[L],    34, 12, 4);
        return;
    }

    // ── Standing / running form ───────────────────────────────────────
    ctx.fillStyle = DARK;

    // Tail (leftmost)
    fill(-8, 26, 6, 8);
    fill(-4, 22, 8, 8);
    fill( 0, 18, 8, 10);

    // Body (main mass)
    fill(4, 14, 22, 20);

    // Neck
    fill(18,  6, 12, 14);

    // ── Head (the most important part — horizontal T-Rex snout) ──────
    fill(14,  0, 18, 14);   // back of skull (vertical rectangle)
    fill(24,  8, 22,  8);   // upper snout (horizontal)
    fill(24, 14, 16,  6);   // lower jaw
    fill(34, 18,  8,  3);   // chin tip

    // Eye
    ctx.fillStyle = BG;
    fill(26, 2, 8, 7);      // white of eye
    ctx.fillStyle = DARK;
    if (dead) {
        // X eyes
        fill(27, 3, 2, 2); fill(30, 3, 2, 2);
        fill(28, 5, 2, 2); fill(27, 7, 2, 2); fill(30, 7, 2, 2);
    } else {
        fill(29, 3, 4, 4);  // pupil
        ctx.fillStyle = BG;
        fill(31, 4, 2, 2);  // pupil highlight
        ctx.fillStyle = DARK;
    }

    // Small arm / claw
    fill(24, 14, 8, 4);
    fill(28, 17, 6, 3);

    if (!dead) {
        // Legs — two-frame alternation
        const L = Math.floor(frame / 7) % 2;
        // Front leg (L=0: full stride; L=1: shorter step)
        const frontFull = L === 0;
        fill(14, 34, 8, frontFull ? 18 : 10);    // front thigh+shin
        if (frontFull) fill(12, 52, 12, 4);      // front foot
        // Back leg
        fill( 6, 34, 8, frontFull ? 10 : 18);    // back thigh+shin
        if (!frontFull) fill(4, 52, 12, 4);      // back foot
    } else {
        // Death — both legs hanging
        fill( 6, 34, 8, 18);
        fill(14, 34, 8, 18);
    }
}

// ─── Cactus drawing ───────────────────────────────────────────────────────────
type OType = 's' | 'm' | 'l' | 'x2' | 'x3' | 'bird';
interface Obs { x: number; y: number; w: number; h: number; t: OType; }
interface Cld { x: number; y: number; }

function drawCactus(ctx: CanvasRenderingContext2D, o: Obs) {
    ctx.fillStyle = '#636363';
    const x = Math.round(o.x);
    const y = Math.round(o.y);
    if (o.t === 'bird') {
        // Pterodactyl — wing flap based on x position
        const wing = Math.floor(x / 12) % 2;
        ctx.fillRect(x,      y + 6,  30, 10);   // body
        ctx.fillRect(x + 20, y + 2,  10,  6);   // head
        ctx.fillRect(x + 28, y + 4,  8,  4);    // beak
        if (wing === 0) {
            ctx.fillRect(x + 2,  y - 10, 22, 10); // wing up
        } else {
            ctx.fillRect(x + 2,  y + 14, 22, 10); // wing down
        }
        return;
    }
    // Stem height varies by type
    const sh = o.t === 'l' ? 64 : o.t === 'm' ? 48 : 36;
    if (o.t === 'x2' || o.t === 'x3') {
        const count = o.t === 'x2' ? 2 : 3;
        for (let i = 0; i < count; i++) {
            const cx = x + i * 18;
            ctx.fillRect(cx + 6, GY - sh, 8, sh);
            ctx.fillRect(cx,     GY - 22, 6, 14);
            ctx.fillRect(cx + 14,GY - 28, 6, 14);
            ctx.fillRect(cx,     GY - 26, 6,  6);
            ctx.fillRect(cx + 14,GY - 32, 6,  6);
        }
        return;
    }
    ctx.fillRect(x + 6, GY - sh, 8, sh);  // main stem
    ctx.fillRect(x,     GY - 22, 6, 14);  // left arm
    ctx.fillRect(x + 14,GY - 28, 6, 14);  // right arm
    ctx.fillRect(x,     GY - 26, 6,  6);  // left arm top
    ctx.fillRect(x + 14,GY - 32, 6,  6);  // right arm top
}

function drawCloud(ctx: CanvasRenderingContext2D, c: Cld) {
    ctx.fillStyle = '#e0e0e0';
    const x = Math.round(c.x);
    const y = Math.round(c.y);
    ctx.fillRect(x + 14, y + 4, 46, 8);
    ctx.fillRect(x + 24, y,     30, 6);
    ctx.fillRect(x + 36, y + 2, 18, 4);
    ctx.fillRect(x,      y + 6, 18, 6);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ChromeDino() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef  = useRef({
        dinoY: GY - 52, vy: 0, onGround: true, ducking: false,
        obs: [] as Obs[],
        clouds: [{ x: 80, y: 24 }, { x: 340, y: 16 }] as Cld[],
        score: 0, hiScore: 0, speed: 2.5,
        frame: 0, lastObs: 0,
        dead: false, started: false, groundX: 0,
        lastDispScore: 0,
    });
    const [disp, setDisp] = useState({ score: 0, hi: 0, dead: false, started: false });
    const rafRef = useRef<number>(0);

    const tryJump = useCallback((duck = false) => {
        const s = stateRef.current;
        if (s.dead) return;
        if (!s.started) { s.started = true; return; }
        if (duck) { if (!s.onGround) s.ducking = true; return; }
        if (s.onGround) { s.vy = JUMP_V; s.onGround = false; s.ducking = false; }
    }, []);

    const restart = useCallback(() => {
        const s = stateRef.current;
        const hi = Math.max(s.hiScore, Math.floor(s.score / 10));
        Object.assign(s, {
            dinoY: GY - 52, vy: 0, onGround: true, ducking: false,
            obs: [], clouds: [{ x: 80, y: 24 }, { x: 340, y: 16 }],
            score: 0, hiScore: hi, speed: 2.5,
            frame: 0, lastObs: 0, dead: false, started: true, groundX: 0,
            lastDispScore: 0,
        });
        setDisp({ score: 0, hi, dead: false, started: true });
    }, []);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (['Space','ArrowUp'].includes(e.code)) { e.preventDefault(); if (stateRef.current.dead) restart(); else tryJump(false); }
            if (e.code === 'ArrowDown') { e.preventDefault(); tryJump(true); }
        };
        const up = (e: KeyboardEvent) => { if (e.code === 'ArrowDown') stateRef.current.ducking = false; };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, [tryJump, restart]);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx    = canvas.getContext('2d')!;

        function spawnObs() {
            const s = stateRef.current;
            const types: OType[] = ['s','s','m','m','l','x2','x3'];
            if (s.score > 2500) types.push('bird','bird');
            const t = types[Math.floor(Math.random() * types.length)];
            const isBird = t === 'bird';
            const w = t === 'x3' ? 54 : t === 'x2' ? 36 : isBird ? 36 : 20;
            const h = t === 'l'  ? 64 : t === 'm'  ? 48 : isBird ? 24 : 36;
            const birdY = [GY - 60, GY - 42, GY - 26][Math.floor(Math.random() * 3)];
            s.obs.push({ x: W + 10, y: isBird ? birdY : GY - h, w, h, t });
        }

        let lastTime = performance.now();
        const tick = (time: DOMHighResTimeStamp) => {
            const dt = time - lastTime;
            lastTime = time;
            // step represents virtual 60fps frames passed since last tick
            const step = Math.min(dt, 50) / 16.666; 

            const s = stateRef.current;
            ctx.fillStyle = BG;
            ctx.fillRect(0, 0, W, H);

            if (s.started && !s.dead) {
                // Speed — very gradual continuous ramp: starts at 2.5, caps at 9
                s.speed = Math.min(2.5 + s.score * 0.0003, 9);

                // Physics (scaled by dt step)
                s.vy += GRAVITY * step;
                s.dinoY = Math.min(s.dinoY + s.vy * step, GY - 52);
                s.onGround = s.dinoY >= GY - 52;
                if (s.onGround) { s.vy = 0; if (s.ducking) {} }

                s.groundX = (s.groundX + s.speed * step) % W;
                s.score += step;
                s.frame += step;

                // Spawn check
                const gap = Math.max(55, 110 - s.speed * 4);
                if (s.frame - s.lastObs > gap + Math.random() * 55) {
                    spawnObs(); s.lastObs = s.frame;
                }
                s.obs.forEach(o => { o.x -= s.speed * step; });
                s.obs = s.obs.filter(o => o.x > -80);

                // Clouds drift slowly
                s.clouds.forEach(c => { c.x -= 0.4 * step; if (c.x < -80) c.x = W; });

                // Collision — tight hitboxes
                const DINO_W = s.ducking ? 42 : 30;
                const DINO_HH = s.ducking ? 24 : 46;
                const dinoTop = s.ducking ? GY - 28 : s.dinoY;
                const hb = { x: DX + 6, y: dinoTop + 4, r: DX + 6 + DINO_W - 10, b: dinoTop + 4 + DINO_HH - 8 };
                for (const o of s.obs) {
                    const OR = o.t === 'bird' ? { x: o.x + 4, y: o.y + 2, r: o.x + 30, b: o.y + 14 }
                                              : { x: o.x + 4, y: o.y + 6, r: o.x + o.w - 4, b: GY - 2 };
                    if (hb.r > OR.x && hb.x < OR.r && hb.b > OR.y && hb.y < OR.b) {
                        s.dead = true;
                        s.hiScore = Math.max(s.hiScore, Math.floor(s.score / 10));
                        setDisp({ score: Math.floor(s.score / 10), hi: s.hiScore, dead: true, started: true });
                    }
                }
                
                // Update React state only when score digit changes
                const sc = Math.floor(s.score / 10);
                if (!s.dead && s.lastDispScore !== sc) {
                    s.lastDispScore = sc;
                    setDisp(d => ({ ...d, score: sc, started: true }));
                }
            }

            // Clouds
            s.clouds.forEach(c => drawCloud(ctx, c));

            // Ground
            ctx.fillStyle = DARK;
            ctx.fillRect(0, GY, W, 1);
            ctx.fillStyle = '#aaa';
            for (let i = 0; i < 12; i++) {
                const px = ((i * 52 + W - Math.round(s.groundX)) % W);
                // use Math.round to avoid subpixel shimmer
                ctx.fillRect(Math.round(px), GY + 4, 6, 2);
                ctx.fillRect(Math.round((px + 28) % W), GY + 8, 3, 2);
            }

            // Obstacles
            for (const o of s.obs) drawCactus(ctx, o);

            // Dino
            const dinoTop = s.ducking ? GY - 28 : s.dinoY;
            drawDino(ctx, DX, dinoTop, s.frame, s.ducking, s.dead);

            // HUD — Chrome-style right-aligned
            ctx.fillStyle = '#9e9e9e';
            ctx.font = 'bold 14px "Courier New"';
            ctx.textAlign = 'right';
            const sc_str = String(Math.floor(s.score / 10)).padStart(5, '0');
            const hi_str = `HI ${String(s.hiScore).padStart(5, '0')}`;
            ctx.fillText(`${hi_str}   ${sc_str}`, W - 8, 20);

            if (!s.started) {
                ctx.fillStyle = '#999'; ctx.textAlign = 'center';
                ctx.font = '13px "Courier New"';
                ctx.fillText('Press SPACE or ↑ to start', W / 2, GY - 10);
            }
            if (s.dead) {
                ctx.fillStyle = DARK; ctx.textAlign = 'center';
                ctx.font = 'bold 15px "Courier New"';
                ctx.fillText('G A M E   O V E R', W / 2, GY / 2 - 6);
                ctx.fillStyle = '#888';
                ctx.font = '12px "Courier New"';
                ctx.fillText('↺  press SPACE to replay', W / 2, GY / 2 + 14);
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[90vh] gap-4 select-none"
            style={{ background: BG, fontFamily: '"Courier New", monospace' }}>
            <h1 className="text-3xl font-black tracking-widest uppercase" style={{ color: DARK }}>
                Chrome Dino
            </h1>

            <div className="relative cursor-pointer"
                onClick={() => stateRef.current.dead ? restart() : tryJump(false)}>
                <canvas ref={canvasRef} width={W} height={H}
                    className="border-b-2" style={{ borderColor: '#ccc', imageRendering: 'pixelated' }} />
            </div>

            <div className="text-xs text-center" style={{ color: '#9e9e9e' }}>
                SPACE / ↑ jump &nbsp;·&nbsp; ↓ duck mid-air &nbsp;·&nbsp; Avoid cacti and birds!
            </div>

            <div className="flex gap-4 md:hidden">
                <button onPointerDown={() => tryJump(false)}
                    className="px-8 py-4 font-black rounded text-base border-2 select-none"
                    style={{ backgroundColor: DARK, color: BG }}>↑ Jump</button>
                <button onPointerDown={() => tryJump(true)} onPointerUp={() => stateRef.current.ducking = false}
                    className="px-8 py-4 font-black rounded text-base border-2 select-none"
                    style={{ backgroundColor: DARK, color: BG }}>↓ Duck</button>
            </div>
        </div>
    );
}
