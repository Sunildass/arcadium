import React, { useRef, useEffect, useCallback, useState } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const CW = 600, CH = 300;
const GRAVITY = 0.7; // Snappier gravity
const GROUND_Y = CH - 48;
const WORLD_W = 5000;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Vec2 { x: number; y: number; }
interface Rect { x: number; y: number; w: number; h: number; }

interface Player {
  x: number; y: number; w: number; h: number;
  vx: number; vy: number;
  onGround: boolean;
  dir: number;       // 1=right -1=left
  hp: number;
  weapon: 0|1|2;    // 0=normal 1=spread 2=rapid
  weaponTimer: number;
  shootTimer: number;
  frame: number;     // animation frame
  invincible: number; // frames of invincibility after hit
}

interface Enemy {
  x: number; y: number; w: number; h: number;
  vx: number; vy: number;
  hp: number; maxHp: number;
  type: 'grunt'|'heavy'|'boss';
  state: 'patrol'|'attack'|'dead';
  dir: number;
  shootTimer: number;
  patrolLeft: number; patrolRight: number;
  onGround: boolean;
  active: boolean;
  frame: number;
  deathTimer: number;
}

interface Bullet {
  x: number; y: number; vx: number; vy: number;
  fromPlayer: boolean;
  active: boolean;
  type: 0|1|2; // weapon type
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
}

interface Platform { x: number; y: number; w: number; h: number; }

interface GS {
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  particles: Particle[];
  camera: number;
  bg1: number; bg2: number; bg3: number;
  score: number;
  lives: number;
  level: number;
  bossDefeated: boolean;
  bossArenaLocked: boolean;
  bossArenaLeft: number;
  phase: 'attract'|'playing'|'dying'|'levelclear'|'over';
  phaseTimer: number;
  frame: number;
  weaponFlash: { weapon: 1|2; timer: number } | null;
}

// ─── Platforms ────────────────────────────────────────────────────────────────
const PLATFORMS: Platform[] = [
  // ground
  { x:0,    y:GROUND_Y, w:WORLD_W, h:50 },
  // ledges
  { x:300,  y:GROUND_Y-80, w:120, h:16 },
  { x:600,  y:GROUND_Y-120, w:100, h:16 },
  { x:850,  y:GROUND_Y-70, w:140, h:16 },
  { x:1100, y:GROUND_Y-110, w:100, h:16 },
  { x:1400, y:GROUND_Y-90, w:160, h:16 },
  { x:1700, y:GROUND_Y-130, w:120, h:16 },
  { x:2000, y:GROUND_Y-80, w:100, h:16 },
  { x:2300, y:GROUND_Y-100, w:140, h:16 },
  { x:2600, y:GROUND_Y-120, w:120, h:16 },
  { x:3000, y:GROUND_Y-80, w:100, h:16 },
  { x:3300, y:GROUND_Y-110, w:140, h:16 },
  { x:3700, y:GROUND_Y-90, w:120, h:16 },
  { x:4000, y:GROUND_Y-130, w:100, h:16 },
];

// ─── Enemy spawn points ───────────────────────────────────────────────────────
function makeEnemies(level: number): Enemy[] {
  const grunts: Enemy[] = [
    500,800,1100,1400,1700,2000,2300,2600,2900,3200,3500,3800,4200
  ].map(x => ({
    x, y: GROUND_Y-36, w:28, h:36, vx:0, vy:0,
    hp: 1+Math.floor(level/2), maxHp: 1+Math.floor(level/2),
    type:'grunt' as const, state:'patrol' as const, dir:1,
    shootTimer:60+Math.floor(Math.random()*60),
    patrolLeft:x-80, patrolRight:x+80,
    onGround:true, active:true, frame:0, deathTimer:0,
  }));
  const heavies: Enemy[] = [700,1300,2100,3100,4100].map(x => ({
    x, y: GROUND_Y-44, w:34, h:44, vx:0, vy:0,
    hp: 3+level, maxHp: 3+level,
    type:'heavy' as const, state:'patrol' as const, dir:1,
    shootTimer:90+Math.floor(Math.random()*60),
    patrolLeft:x-60, patrolRight:x+60,
    onGround:true, active:true, frame:0, deathTimer:0,
  }));
  // Boss at end
  const boss: Enemy = {
    x: WORLD_W - 300, y: GROUND_Y - 80, w:70, h:80, vx:0, vy:0,
    hp:30+level*5, maxHp:30+level*5,
    type:'boss' as const, state:'patrol' as const, dir:-1,
    shootTimer:40, patrolLeft:WORLD_W-500, patrolRight:WORLD_W-100,
    onGround:true, active:true, frame:0, deathTimer:0,
  };
  return [...grunts, ...heavies, boss];
}

function makePlayer(): Player {
  return { x:80, y:GROUND_Y-40, w:24, h:40, vx:0, vy:0, onGround:true, dir:1, hp:3, weapon:0, weaponTimer:0, shootTimer:0, frame:0, invincible:0 };
}

function makeGS(level: number, keepPlayer?: Player): GS {
  return {
    player: keepPlayer ?? makePlayer(),
    enemies: makeEnemies(level),
    bullets: [], particles: [], camera: keepPlayer ? Math.max(0, keepPlayer.x - CW/3) : 0,
    bg1:0, bg2:0, bg3:0,
    score:0, lives:3, level,
    bossDefeated:false,
    bossArenaLocked: false, bossArenaLeft: 0,
    phase:'attract', phaseTimer:90, frame:0,
    weaponFlash: null,
  };
}

// ─── Physics helpers ──────────────────────────────────────────────────────────
function platformLand(obj: Rect & { vx:number; vy:number; onGround:boolean }, plats: Platform[]) {
  obj.onGround = false;
  for (const p of plats) {
    if (obj.x + obj.w > p.x && obj.x < p.x + p.w) {
      const bottom = obj.y + obj.h;
      if (bottom >= p.y && bottom <= p.y + 20 && obj.vy >= 0) {
        obj.y = p.y - obj.h;
        obj.vy = 0;
        obj.onGround = true;
        break;
      }
    }
  }
}

function spawnParticles(particles: Particle[], x: number, y: number, count: number, color: string) {
  for (let i=0; i<count; i++) {
    const a = Math.random()*Math.PI*2, spd = 1+Math.random()*4;
    particles.push({ x, y, vx:Math.cos(a)*spd, vy:Math.sin(a)*spd-2, life:30, maxLife:30, color, size:2+Math.random()*3 });
  }
}

// ─── Rendering helpers ────────────────────────────────────────────────────────
function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, frame: number) {
  const { x, y, w, h, dir, invincible, weapon } = p;
  if (invincible > 0 && Math.floor(invincible/4)%2===1) return; // blink

  const c = x + w/2, t = y;
  // Body (military green)
  ctx.fillStyle = '#3a5a2a';
  ctx.fillRect(x+2, t+16, w-4, h-22);
  // Legs
  const legOff = Math.sin(frame * 0.3) * 4;
  ctx.fillStyle = '#2a3a1a';
  ctx.fillRect(x+2, t+h-16, 8, 16); // left leg
  ctx.fillRect(x+w-10, t+h-16+legOff, 8, 16); // right leg
  // Head
  ctx.fillStyle = '#c8a060';
  ctx.fillRect(x+4, t+2, w-8, 14);
  // Helmet
  ctx.fillStyle = '#2a4a1a';
  ctx.fillRect(x+3, t, w-6, 10);
  // Eyes
  ctx.fillStyle = '#331100';
  ctx.fillRect(dir>0 ? x+w-8 : x+4, t+6, 3, 3);
  // Gun (fix operator precedence: must wrap ternary)
  ctx.fillStyle = '#555';
  const gunY = t+18;
  const gunLen = weapon===2 ? 18 : 12;
  if (dir>0) { ctx.fillRect(x+w-2, gunY, gunLen, 5); }
  else        { ctx.fillRect(x-(gunLen-2), gunY, gunLen, 5); }
  // Weapon color overlay
  if (weapon===1) { ctx.fillStyle='rgba(255,100,0,0.5)'; ctx.fillRect(x+2,t+15,w-4,h-22); }
  if (weapon===2) { ctx.fillStyle='rgba(0,200,255,0.4)'; ctx.fillRect(x+2,t+15,w-4,h-22); }
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, camX: number) {
  const sx = e.x - camX;
  if (e.state==='dead') {
    const a = e.deathTimer / 30;
    ctx.globalAlpha = 1-a;
    ctx.fillStyle = '#ff4400';
    ctx.fillRect(sx, e.y, e.w, e.h);
    ctx.globalAlpha = 1;
    return;
  }
  if (e.type==='boss') {
    // Boss: large dark mech
    ctx.fillStyle = '#334';
    ctx.fillRect(sx, e.y, e.w, e.h);
    ctx.fillStyle = '#ff2200';
    ctx.fillRect(sx+10, e.y+10, e.w-20, 20); // cockpit
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(sx+5, e.y+e.h-20, e.w-10, 20); // legs
    // Health bar
    const hpPct = e.hp / e.maxHp;
    ctx.fillStyle = '#440000';
    ctx.fillRect(sx, e.y-12, e.w, 6);
    ctx.fillStyle = hpPct>0.5?'#00ff44':'#ff2200';
    ctx.fillRect(sx, e.y-12, e.w*hpPct, 6);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth=1; ctx.strokeRect(sx, e.y-12, e.w, 6);
  } else if (e.type==='heavy') {
    ctx.fillStyle = '#553322';
    ctx.fillRect(sx, e.y, e.w, e.h);
    ctx.fillStyle = '#884433';
    ctx.fillRect(sx+4, e.y+4, e.w-8, e.h/2);
    ctx.fillStyle = '#cc6644';
    ctx.fillRect(sx+8, e.y+6, e.w-16, 14); // face
    // HP bar
    const hp = e.hp/e.maxHp;
    ctx.fillStyle='#440000'; ctx.fillRect(sx, e.y-8, e.w, 4);
    ctx.fillStyle='#ff4400'; ctx.fillRect(sx, e.y-8, e.w*hp, 4);
  } else {
    // Grunt
    const legOff = Math.sin(e.frame*0.3)*3;
    ctx.fillStyle = '#665544';
    ctx.fillRect(sx+2, e.y+14, e.w-4, e.h-20); // body
    ctx.fillStyle = '#887766';
    ctx.fillRect(sx+4, e.y, e.w-8, 14); // head
    ctx.fillStyle = '#446633';
    ctx.fillRect(sx+2, e.y+e.h-14, 8, 14);
    ctx.fillRect(sx+e.w-10, e.y+e.h-14+legOff, 8, 14);
    ctx.fillStyle='#555';
    if (e.dir>0) ctx.fillRect(sx+e.w, e.y+14, 10, 4);
    else ctx.fillRect(sx-10, e.y+14, 10, 4);
  }
}

function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet, camX: number) {
  const sx = b.x - camX;
  if (b.fromPlayer) {
    if (b.type===2) { // laser
      ctx.strokeStyle = '#00ffff';
      ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 8;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx,b.y); ctx.lineTo(sx+b.vx*4, b.y+b.vy*4); ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = b.type===1 ? '#ff8800' : '#ffff00';
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur=6;
      ctx.fillRect(sx-4, b.y-2, 10, 5);
      ctx.shadowBlur=0;
    }
  } else {
    ctx.fillStyle = '#ff2200';
    ctx.shadowColor='#ff2200'; ctx.shadowBlur=4;
    ctx.beginPath(); ctx.arc(sx, b.y, 4, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
  }
}

// ─── Background drawing ────────────────────────────────────────────────────────
function drawBg(ctx: CanvasRenderingContext2D, g: GS) {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, CH);
  sky.addColorStop(0, '#0a0018'); sky.addColorStop(1, '#1a0033');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CW, CH);

  // Stars (layer 1 - farthest)
  ctx.fillStyle = '#ffffff';
  for (let i=0; i<40; i++) {
    const sx = ((i*137 + g.bg1*0.1) % CW + CW) % CW;
    const sy = (i*73) % (CH*0.6);
    ctx.fillRect(sx, sy, 1, 1);
  }

  // Distant mountains (layer 2)
  ctx.fillStyle = '#1a0044';
  const mOff = -((g.camera * 0.2) % CW);
  for (let i=-1; i<3; i++) {
    const mx = mOff + i*CW;
    ctx.beginPath(); ctx.moveTo(mx, CH);
    for (let j=0; j<=10; j++) {
      const hx = mx + j*CW/10;
      const hy = CH - 80 - Math.abs(Math.sin(j*0.8))*100;
      ctx.lineTo(hx, hy);
    }
    ctx.lineTo(mx+CW, CH); ctx.closePath(); ctx.fill();
  }

  // Near silhouette (layer 3)
  ctx.fillStyle = '#0a001f';
  const bOff = -((g.camera * 0.5) % (CW*2));
  for (let i=-1; i<3; i++) {
    const bx = bOff + i*CW*2;
    ctx.beginPath(); ctx.moveTo(bx, CH);
    for (let j=0; j<=20; j++) {
      const hx = bx + j*CW*2/20;
      const hy = CH - 30 - Math.abs(Math.sin(j*1.3))*60;
      ctx.lineTo(hx, hy);
    }
    ctx.lineTo(bx+CW*2, CH); ctx.closePath(); ctx.fill();
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RetroCommando() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GS>(makeGS(1));
  const rafRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const [ui, setUi] = useState({ score:0, lives:3, level:1, phase:'attract' as string, hp:3, weapon:0 });
  const hiRef = useRef(0);

  const emitUi = useCallback(() => {
    const g = gsRef.current;
    setUi({ score:g.score, lives:g.lives, level:g.level, phase:g.phase, hp:g.player.hp, weapon:g.player.weapon });
  }, []);

  function shoot(g: GS) {
    const { player: p } = g;
    if (p.shootTimer > 0) return;
    const rate = p.weapon===1 ? 6 : p.weapon===2 ? 3 : 10;
    p.shootTimer = rate;
    const by = p.y + p.h/3;
    const bx = p.dir>0 ? p.x+p.w : p.x;
    if (p.weapon===1) { // spread
      for (const a of [-0.3, 0, 0.3]) {
        const sp = 12;
        g.bullets.push({ x:bx, y:by, vx:Math.cos(a)*sp*p.dir, vy:Math.sin(a)*sp, fromPlayer:true, active:true, type:1 });
      }
    } else if (p.weapon===2) { // laser
      g.bullets.push({ x:bx, y:by, vx:18*p.dir, vy:0, fromPlayer:true, active:true, type:2 });
    } else {
      g.bullets.push({ x:bx, y:by, vx:12*p.dir, vy:0, fromPlayer:true, active:true, type:0 });
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const K = keysRef.current;

    function tick() {
      const g = gsRef.current;
      g.frame++;

      // Phase control
      if (g.phase==='attract') {
        if (--g.phaseTimer<=0) { g.phase='playing'; emitUi(); }
        drawFrame(ctx,g); rafRef.current=requestAnimationFrame(tick); return;
      }
      if (g.phase==='dying') {
        if (--g.phaseTimer<=0) {
          // No continues — 3 hearts are the only 3 lives; losing all = game over
          g.phase='over';
          emitUi();
        }
        drawFrame(ctx,g); rafRef.current=requestAnimationFrame(tick); return;
      }
      // levelclear: show flash, then reset world with next-level enemies (score/lives preserved)
      if (g.phase==='levelclear') {
        if (--g.phaseTimer<=0) {
          const nextLevel = g.level + 1;
          // Full world reset so enemies spawn at valid positions — score & lives carry over
          gsRef.current = {
            ...makeGS(nextLevel),
            score: g.score,
            lives: g.lives,
            level: nextLevel,
            phase: 'playing',
          };
          emitUi();
        }
        drawFrame(ctx,g); rafRef.current=requestAnimationFrame(tick); return;
      }
      if (g.phase!=='playing') { drawFrame(ctx,g); rafRef.current=requestAnimationFrame(tick); return; }

      const { player:p, enemies, bullets, particles } = g;

      // Input
      const spd = 3.5;
      p.vx = 0;
      if (K.has('ArrowLeft')||K.has('KeyA')) { p.vx=-spd; p.dir=-1; }
      if (K.has('ArrowRight')||K.has('KeyD')) { p.vx=spd; p.dir=1; }
      if ((K.has('ArrowUp')||K.has('KeyW')||K.has('Space')) && p.onGround) { p.vy=-12; p.onGround=false; } // Stronger initial jump pulse
      if (K.has('KeyZ')||K.has('KeyJ')||K.has('ControlLeft')) shoot(g);

      // Player physics
      if (p.vy > 0) {
        p.vy += GRAVITY * 1.6; // fall faster
      } else if (p.vy < 0 && !(K.has('ArrowUp')||K.has('KeyW')||K.has('Space'))) {
        p.vy += GRAVITY * 2.5; // short hop (variable jump height)
      } else {
        p.vy += GRAVITY; 
      }
      p.x += p.vx; p.y += p.vy;
      if (p.y > CH) { g.phase='dying'; g.phaseTimer=90; emitUi(); }
      p.x = Math.max(0, Math.min(WORLD_W-p.w, p.x));
      platformLand(p, PLATFORMS);
      if (p.shootTimer>0) p.shootTimer--;
      if (p.invincible>0) p.invincible--;
      if (p.weaponTimer>0) { p.weaponTimer--; if(p.weaponTimer===0) p.weapon=0; }
      p.frame++;

      // Camera — hard-lock during boss fight, smooth-follow otherwise
      if (g.bossArenaLocked) {
        // Keep camera still; clamp player so they can't walk off-screen
        g.camera = g.bossArenaLeft;
        p.x = Math.max(g.bossArenaLeft + 4, Math.min(g.bossArenaLeft + CW - p.w - 4, p.x));
      } else {
        const boss = g.enemies.find(e => e.type==='boss' && e.active && e.state!=='dead');
        // Lock only once the boss's left edge enters the visible viewport
        if (boss && (boss.x - g.camera) < CW) {
          g.bossArenaLocked = true;
          g.bossArenaLeft = g.camera;
        } else {
          const targetCam = Math.min(WORLD_W - CW, Math.max(0, p.x - CW/3));
          g.camera += (targetCam - g.camera) * 0.12;
        }
      }

      // Bullets
      for (const b of bullets) {
        if (!b.active) continue;
        b.x += b.vx; b.y += b.vy;
        if (b.x<g.camera-50||b.x>g.camera+CW+50||b.y<0||b.y>CH) { b.active=false; continue; }

        if (b.fromPlayer) {
          for (const e of enemies) {
            if (!e.active||e.state==='dead') continue;
            if (b.x>e.x&&b.x<e.x+e.w&&b.y>e.y&&b.y<e.y+e.h) {
              const dmg = b.type===2 ? 2 : 1;
              e.hp -= dmg;
              spawnParticles(particles, b.x, b.y, 5, '#ff6600');
              b.active = false;
              if (e.hp<=0) {
                e.state='dead'; e.deathTimer=30;
                g.score += e.type==='boss' ? 5000 : e.type==='heavy' ? 500 : 100;
                spawnParticles(particles, e.x+e.w/2, e.y+e.h/2, 20, '#ff4400');
                if (e.type==='boss') {
                  g.bossDefeated=true;
                  g.bossArenaLocked=false; // release the arena
                  g.phase='levelclear'; g.phaseTimer=150; emitUi();
                }
                // Drop weapon pickup (higher chance, always notified)
                if (Math.random()<0.45 && e.type!=='boss') {
                  const w = (Math.floor(Math.random()*2)+1) as 1|2;
                  p.weapon=w; p.weaponTimer=600;
                  g.weaponFlash = { weapon: w, timer: 160 };
                }
              }
              break;
            }
          }
        } else {
          if (p.invincible===0 && b.x>p.x&&b.x<p.x+p.w&&b.y>p.y&&b.y<p.y+p.h) {
            p.hp--;
            p.invincible=90;
            b.active=false;
            spawnParticles(particles, p.x+p.w/2, p.y+p.h/2, 8, '#ff0000');
            if (p.hp<=0) { g.phase='dying'; g.phaseTimer=90; emitUi(); }
          }
        }
      }
      g.bullets = g.bullets.filter(b=>b.active);

      // Enemies
      for (const e of enemies) {
        if (!e.active) continue;
        if (e.state==='dead') {
          e.deathTimer--;
          if (e.deathTimer<=0) e.active=false;
          continue;
        }
        // Physics
        e.vy += GRAVITY;
        e.y += e.vy;
        platformLand(e, PLATFORMS);
        e.frame++;

        const dist = Math.abs((e.x+e.w/2)-(p.x+p.w/2));
        const inView = Math.abs(e.x-g.camera)<CW+200;
        if (!inView) continue;

        if (e.type==='boss') {
          // ── Phased boss AI ──────────────────────────────────────────────
          const hpPct = e.hp / e.maxHp;
          e.dir = p.x > e.x ? 1 : -1;
          // Speed increases each phase
          const bossSpd = hpPct > 0.66 ? 1.2 : hpPct > 0.33 ? 2.0 : 2.8;
          e.x += e.dir * bossSpd;
          // Phase 3: jump occasionally
          if (hpPct <= 0.33 && e.onGround && Math.random() < 0.012) { e.vy = -11; }
          e.shootTimer--;
          if (e.shootTimer <= 0) {
            if (hpPct > 0.66) {
              // Phase 1: methodical 3-way
              e.shootTimer = 35;
              for (const dy of [-3,0,3])
                g.bullets.push({x:e.x+e.w/2, y:e.y+e.h/2, vx:-5*e.dir, vy:dy, fromPlayer:false, active:true, type:0});
            } else if (hpPct > 0.33) {
              // Phase 2: aggressive 5-way fan
              e.shootTimer = 22;
              for (const dy of [-5,-2,0,2,5])
                g.bullets.push({x:e.x+e.w/2, y:e.y+e.h/2, vx:-6*e.dir, vy:dy, fromPlayer:false, active:true, type:0});
            } else {
              // Phase 3: enraged — rotating circular spray
              e.shootTimer = 10;
              const base = g.frame * 0.18;
              for (let i=0; i<6; i++) {
                const a = base + i * Math.PI/3;
                g.bullets.push({x:e.x+e.w/2, y:e.y+e.h/2, vx:Math.cos(a)*5.5, vy:Math.sin(a)*5.5, fromPlayer:false, active:true, type:0});
              }
            }
          }
        } else {
          // ── Grunt / Heavy AI ────────────────────────────────────────────
          const aggroRange = e.type==='heavy' ? 320 : 280;
          if (dist < aggroRange && inView) e.state='attack'; else e.state='patrol';

          if (e.state==='attack') {
            e.dir = p.x > e.x ? 1 : -1;
            // Sinusoidal zigzag speed for grunts; heavies charge at close range
            const baseSpd = e.type==='heavy' ? (dist < 100 ? 2.2 : 0.7) : (1.3 + Math.sin(g.frame * 0.14 + e.patrolLeft * 0.01) * 0.5);
            e.x += e.dir * baseSpd;

            // Reactive dodge: jump away from incoming player bullets
            if (e.onGround && Math.random() < 0.35) {
              for (const b of g.bullets) {
                if (!b.active || !b.fromPlayer) continue;
                if (b.vx > 0 && b.x < e.x && e.x - b.x < 200 && Math.abs(b.y - (e.y + e.h/2)) < 30) {
                  e.vy = -10; break;
                }
              }
            }

            e.shootTimer--;
            if (e.shootTimer <= 0 && dist > 55) {
              if (e.type === 'heavy') {
                // Heavy fires a burst of 2 aimed shots
                e.shootTimer = 45;
                for (let s=0; s<2; s++) {
                  const dx = p.x+p.w/2-(e.x+e.w/2), dy = p.y+p.h/2-(e.y+e.h/2);
                  const len = Math.sqrt(dx*dx+dy*dy);
                  const spread = (s-0.5)*1.5;
                  g.bullets.push({x:e.x+e.w/2, y:e.y+e.h/2, vx:7*dx/len, vy:7*dy/len+spread, fromPlayer:false, active:true, type:0});
                }
              } else {
                // Grunt fires aimed shot with slight random spread
                e.shootTimer = 60 + Math.random()*20;
                const dx = p.x+p.w/2-(e.x+e.w/2), dy = p.y+p.h/2-(e.y+e.h/2);
                const len = Math.sqrt(dx*dx+dy*dy);
                g.bullets.push({x:e.x+e.w/2, y:e.y+e.h/2, vx:7*dx/len, vy:7*dy/len+(Math.random()-0.5)*2, fromPlayer:false, active:true, type:0});
              }
            }
          } else {
            // Patrol with occasional random hop
            e.x += e.dir * 0.8;
            if (e.x < e.patrolLeft) e.dir = 1;
            if (e.x > e.patrolRight) e.dir = -1;
            if (e.onGround && Math.random() < 0.003) e.vy = -8; // random hop
          }
        }
        e.x = Math.max(0, Math.min(WORLD_W-e.w, e.x));

        // Enemy touching player
        if (p.invincible===0 && e.x<p.x+p.w && e.x+e.w>p.x && e.y<p.y+p.h && e.y+e.h>p.y) {
          p.hp--; p.invincible=90; spawnParticles(particles, p.x+p.w/2, p.y+p.h/2, 8, '#ff0000');
          if (p.hp<=0) { g.phase='dying'; g.phaseTimer=90; emitUi(); }
        }
      }

      // Particles
      for (const pt of particles) { pt.x+=pt.vx; pt.y+=pt.vy; pt.vy+=0.15; pt.life--; }
      g.particles = particles.filter(pt=>pt.life>0);
      // Weapon flash timer
      if (g.weaponFlash && g.weaponFlash.timer > 0) g.weaponFlash.timer--;
      if (g.weaponFlash && g.weaponFlash.timer <= 0) g.weaponFlash = null;

      if (g.score>hiRef.current) { hiRef.current=g.score; }
      if (g.frame%10===0) emitUi();
      drawFrame(ctx, g);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [emitUi]);

  useEffect(() => {
    const K = keysRef.current;
    const dn = (e: KeyboardEvent) => {
      K.add(e.code); e.preventDefault();
      const g = gsRef.current;
      if (g.phase==='attract'||g.phase==='over') { gsRef.current=makeGS(1); gsRef.current.phase='playing'; emitUi(); }
    };
    const up = (e: KeyboardEvent) => K.delete(e.code);
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, [emitUi]);

  const weaponNames = ['Rifle', 'Spread', 'Laser'];
  const weaponColors = ['#ffff00','#ff8800','#00ffff'];

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] gap-3 select-none"
        style={{ background:'#080012', fontFamily:'monospace' }}>
      <h1 className="text-3xl font-black tracking-widest"
          style={{ color:'#ff4400', textShadow:'0 0 16px #ff4400, 0 0 30px #ff2200' }}>
        RETRO COMMANDO
      </h1>

      <div className="flex gap-6 text-sm font-bold" style={{ color:'#aaa' }}>
        <span>HI <span style={{ color:'#ffff00' }}>{hiRef.current}</span></span>
        <span>SCORE <span style={{ color:'#ff8800' }}>{ui.score}</span></span>
        <span>LV <span style={{ color:'#ff4400' }}>{ui.level}</span></span>
        <span>HP {'❤️'.repeat(Math.max(0,ui.hp))}</span>
        <span style={{ color: weaponColors[ui.weapon] }}>
          ⚡ {weaponNames[ui.weapon]}
        </span>
      </div>

      <div className="relative">
        <canvas ref={canvasRef} width={CW} height={CH}
          className="rounded-lg"
          style={{ border:'2px solid #ff4400', boxShadow:'0 0 30px #ff440033', display:'block' }}
        />

        {/* Game Over overlay — rendered as React DOM so it always shows on every run */}
        {ui.phase === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg"
               style={{ background:'rgba(0,0,0,0.88)' }}>
            <div className="text-4xl font-black mb-1"
                 style={{ color:'#ff2200', textShadow:'0 0 20px #ff2200, 0 0 40px #ff440088', fontFamily:'monospace' }}>
              MISSION FAILED
            </div>
            <div className="text-lg font-bold mb-1" style={{ color:'#ffff00', fontFamily:'monospace' }}>
              Score: {ui.score}
            </div>
            <div className="text-sm mb-5" style={{ color:'#aaa', fontFamily:'monospace' }}>
              Level {ui.level} reached
            </div>
            <button
              onClick={() => { gsRef.current=makeGS(1); gsRef.current.phase='playing'; emitUi(); }}
              className="px-8 py-3 font-black uppercase tracking-widest rounded-lg transition-all hover:scale-105 active:scale-95"
              style={{ background:'linear-gradient(135deg,#ff2200,#ff6600)', color:'#fff', fontFamily:'monospace', fontSize:'0.8rem', boxShadow:'0 0 20px #ff440066' }}>
              ▶ Deploy Again
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-center" style={{ color:'#556077' }}>
        A/D or ← → move · W/↑/SPACE jump · Z/Ctrl shoot · Collect weapon drops!
      </div>

      {/* Mobile controls */}
      <div className="flex gap-3 md:hidden">
        {([['KeyA','◄'],['Space','▲'],['KeyD','►'],['KeyZ','🔫']] as [string,string][]).map(([code,lbl]) => (
          <button key={code}
            className="px-5 py-3 rounded font-black text-base"
            style={{ background:'#1a001f', color:'#ff4400', border:'2px solid #ff4400' }}
            onPointerDown={() => keysRef.current.add(code)}
            onPointerUp={() => keysRef.current.delete(code)}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Draw frame ───────────────────────────────────────────────────────────────
function drawFrame(ctx: CanvasRenderingContext2D, g: GS) {
  drawBg(ctx, g);
  const cam = g.camera;

  // Platforms
  for (const p of PLATFORMS) {
    const sx = p.x - cam;
    if (sx > CW+50 || sx+p.w < -50) continue;
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(sx, p.y, p.w, p.h);
    ctx.fillStyle = '#2a4a2a';
    ctx.fillRect(sx, p.y, p.w, 4); // top edge highlight
    ctx.strokeStyle='#3a6a3a'; ctx.lineWidth=1;
    ctx.strokeRect(sx, p.y, p.w, p.h);
  }

  // Boss approach indicator
  const boss = g.enemies.find(e=>e.type==='boss');
  if (boss && boss.active && boss.state!=='dead') {
    const dist = boss.x - (g.camera+CW);
    if (dist>0 && dist<WORLD_W) {
      ctx.fillStyle='#ff2200';
      ctx.font='bold 13px monospace';
      ctx.textAlign='right';
      ctx.fillText(`⚠ BOSS ${Math.floor(dist/50)*50}m`, CW-10, 20);
    }
  }

  // Enemies
  for (const e of g.enemies) {
    if (!e.active) continue;
    const sx = e.x - cam;
    if (sx>CW+50||sx+e.w<-50) continue;
    drawEnemy(ctx, e, cam);
  }

  // Particles
  for (const pt of g.particles) {
    ctx.globalAlpha = pt.life / pt.maxLife;
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x-cam-pt.size/2, pt.y-pt.size/2, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;

  // Bullets
  for (const b of g.bullets) drawBullet(ctx, b, cam);

  // Player
  drawPlayer(ctx, { ...g.player, x: g.player.x-cam }, g.frame);

  // Weapon pickup indicator
  if (g.player.weapon>0 && g.player.weaponTimer>0) {
    const pct = g.player.weaponTimer/600;
    ctx.fillStyle = ['','#ff8800','#00ffff'][g.player.weapon];
    ctx.fillRect(g.player.x-cam, g.player.y-12, g.player.w*pct, 4);
  }

  // ── Weapon pickup notification banner ────────────────────────────────────────
  if (g.weaponFlash && g.weaponFlash.timer > 0) {
    const wf = g.weaponFlash;
    const alpha = Math.min(1, wf.timer / 40);          // fade out last 40 frames
    const colors: Record<number,string> = { 1:'#ff8800', 2:'#00ffff' };
    const names:  Record<number,string> = { 1:'SPREAD SHOT ACQUIRED!', 2:'LASER RIFLE ACQUIRED!' };
    const col = colors[wf.weapon];
    // Semi-transparent tinted bar
    ctx.globalAlpha = alpha * 0.35;
    ctx.fillStyle = col;
    ctx.fillRect(0, CH/2 - 26, CW, 52);
    ctx.globalAlpha = alpha;
    // Glow text
    ctx.shadowColor = col; ctx.shadowBlur = 18;
    ctx.fillStyle = col;
    ctx.font = 'bold 17px monospace'; ctx.textAlign = 'center';
    ctx.fillText(`⚡ ${names[wf.weapon]}`, CW/2, CH/2 + 6);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  // Overlay
  if (g.phase==='attract') {
    ctx.fillStyle='rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,CW,CH);
    ctx.fillStyle='#ff4400'; ctx.shadowColor='#ff4400'; ctx.shadowBlur=20;
    ctx.font='bold 28px monospace'; ctx.textAlign='center';
    ctx.fillText('RETRO COMMANDO', CW/2, CH/2-20);
    ctx.shadowBlur=0;
    ctx.fillStyle='#ffff00'; ctx.font='13px monospace';
    ctx.fillText('Press any key to deploy', CW/2, CH/2+14);
    ctx.fillStyle='#aaa'; ctx.font='11px monospace';
    ctx.fillText('Reach the end · Defeat the Boss · Collect weapon drops', CW/2, CH/2+36);
  }
  if (g.phase==='levelclear') {
    ctx.fillStyle='rgba(0,10,0,0.65)'; ctx.fillRect(0,0,CW,CH);
    ctx.fillStyle='#00ff44'; ctx.shadowColor='#00ff44'; ctx.shadowBlur=24;
    ctx.font='bold 22px monospace'; ctx.textAlign='center';
    ctx.fillText(`LEVEL ${g.level} CLEAR!`, CW/2, CH/2-10);
    ctx.shadowBlur=0; ctx.fillStyle='#ffff00'; ctx.font='13px monospace';
    ctx.fillText(`Score: ${g.score}  ─  Next wave incoming...`, CW/2, CH/2+18);
  }
  if (g.phase==='over') {
    ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(0,0,CW,CH);
    ctx.fillStyle='#ff2200'; ctx.shadowColor='#ff2200'; ctx.shadowBlur=24;
    ctx.font='bold 28px monospace'; ctx.textAlign='center';
    ctx.fillText('MISSION FAILED', CW/2, CH/2-18);
    ctx.shadowBlur=0; ctx.fillStyle='#ffff00'; ctx.font='14px monospace';
    ctx.fillText(`Score: ${g.score}`, CW/2, CH/2+14);
    ctx.fillStyle='#aaa'; ctx.font='11px monospace';
    ctx.fillText('Click or press key to retry', CW/2, CH/2+36);
  }
}
