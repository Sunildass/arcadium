import React, { useRef, useEffect, useCallback, useState } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const TS = 24, COLS = 21, ROWS = 21;
const CW = COLS * TS;        // 504
const HUD = 52;
const CH = ROWS * TS + HUD;  // 556

const T_WALL = 0, T_DOT = 1, T_PWR = 2, T_VOID = 3, T_HOME = 4;

// ─── Original maze (21×21) ────────────────────────────────────────────────────
// 0=wall  1=dot  2=power  3=void(passable,no dot)  4=ghost-house
const BASE_MAZE: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0],
  [0,2,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,2,0],
  [0,1,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0],
  [0,1,1,1,1,1,0,0,0,1,0,1,0,0,0,1,1,1,1,1,0],
  [0,0,0,0,0,1,0,0,3,3,3,3,3,0,0,1,0,0,0,0,0],
  [0,0,0,0,0,1,0,0,4,4,4,4,4,0,0,1,0,0,0,0,0],
  [0,0,0,0,0,1,0,0,4,4,4,4,4,0,0,1,0,0,0,0,0],
  [1,1,1,1,1,1,0,0,4,4,4,4,4,0,0,1,1,1,1,1,1],
  [0,0,0,0,0,1,0,0,4,4,4,4,4,0,0,1,0,0,0,0,0],
  [0,0,0,0,0,1,0,0,3,3,3,3,3,0,0,1,0,0,0,0,0],
  [0,0,0,0,0,1,0,0,0,1,1,1,0,0,0,1,0,0,0,0,0],
  [0,0,0,0,0,1,0,1,1,1,0,1,1,1,0,1,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,0,0,1,0,0,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0],
  [0,2,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,2,0],
  [0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

function cloneMaze() { return BASE_MAZE.map(r => [...r]); }
function countDots(m: number[][]) { return m.flat().filter(t => t === T_DOT || t === T_PWR).length; }

// ─── Passability ──────────────────────────────────────────────────────────────
function tileAt(maze: number[][], r: number, c: number) {
  if (r < 0 || r >= ROWS) return T_WALL;
  return maze[r][((c % COLS) + COLS) % COLS];
}
const playerPass = (t: number) => t === T_DOT || t === T_PWR || t === T_VOID;
const ghostPass  = (t: number) => t !== T_WALL;

// ─── BFS: first direction from (sr,sc) toward (tr,tc) ────────────────────────
const STEP4: [number,number][] = [[0,-1],[0,1],[-1,0],[1,0]];
function bfsDir(maze: number[][], sr: number, sc: number, tr: number, tc: number, forGhost = true): [number,number] | null {
  if (sr === tr && sc === tc) return null;
  const ok = forGhost ? ghostPass : playerPass;
  const vis = new Set([`${sr},${sc}`]);
  const q: [number,number,number,number][] = [];
  for (const [dc,dr] of STEP4) {
    const nr = sr+dr, nc = ((sc+dc)+COLS)%COLS;
    if (nr<0||nr>=ROWS||!ok(tileAt(maze,nr,nc))) continue;
    const k = `${nr},${nc}`; if (vis.has(k)) continue; vis.add(k);
    if (nr===tr && nc===tc) return [dc,dr];
    q.push([nr,nc,dc,dr]);
  }
  while (q.length) {
    const [r,c,fdc,fdr] = q.shift()!;
    for (const [dc,dr] of STEP4) {
      const nr = r+dr, nc = ((c+dc)+COLS)%COLS;
      if (nr<0||nr>=ROWS||!ok(tileAt(maze,nr,nc))) continue;
      const k = `${nr},${nc}`; if (vis.has(k)) continue; vis.add(k);
      if (nr===tr && nc===tc) return [fdc,fdr];
      q.push([nr,nc,fdc,fdr]);
    }
  }
  return null;
}

// ─── Enemy config ─────────────────────────────────────────────────────────────
const ENEMY_DEFS = [
  { color:'#ff2244', glow:'#ff0033', sr:9,  sc:9,  sRow:1,  sCol:19, relDots:0  },
  { color:'#ff88cc', glow:'#ff44aa', sr:9,  sc:11, sRow:1,  sCol:1,  relDots:10 },
  { color:'#00ffff', glow:'#00ccff', sr:10, sc:9,  sRow:19, sCol:1,  relDots:20 },
  { color:'#ffaa00', glow:'#ff8800', sr:10, sc:11, sRow:19, sCol:19, relDots:30 },
];

interface Enemy {
  row: number; col: number;
  px: number;  py: number;   // smooth pixel pos
  tpx: number; tpy: number;  // target pixel pos
  dc: number;  dr: number;   // current move direction
  mode: 'house'|'exit'|'chase'|'scatter'|'frightened'|'eaten';
  color: string; glow: string;
  sRow: number; sCol: number; // scatter corner
  frightenFrames: number;
  timer: number; delay: number;
  relDots: number;
}

interface Player {
  px: number; py: number;
  row: number; col: number;
  dc: number; dr: number;   // moving direction
  ndc: number; ndr: number; // buffered next
  speed: number;
  mouthA: number; mouthDir: number;
}

interface GS {
  maze: number[][];
  player: Player;
  enemies: Enemy[];
  dotCount: number;
  score: number;
  lives: number;
  level: number;
  powerFrames: number;
  eatenCombo: number;
  phase: 'attract'|'playing'|'dying'|'win'|'over';
  phaseTimer: number;
  modeTimer: number;
  globalMode: 'chase'|'scatter';
  frame: number;
}

function makeMaze(level: number): GS {
  const maze = cloneMaze();
  const speed = Math.min(2.5 + level * 0.2, 4.5);
  const delay  = Math.max(4, 8 - level);

  const player: Player = {
    px: 10*TS+TS/2, py: 15*TS+TS/2,
    row:15, col:10, dc:0, dr:0, ndc:-1, ndr:0,
    speed, mouthA: 0.2, mouthDir: 1,
  };

  const enemies: Enemy[] = ENEMY_DEFS.map(d => {
    const px = d.sc*TS+TS/2, py = d.sr*TS+TS/2;
    return {
      row:d.sr, col:d.sc, px, py, tpx:px, tpy:py,
      dc:0, dr:0,
      mode:'house' as const,
      color:d.color, glow:d.glow,
      sRow:d.sRow, sCol:d.sCol,
      frightenFrames:0,
      timer:0, delay: delay + Math.floor(Math.random()*3),
      relDots:d.relDots,
    };
  });

  return {
    maze, player, enemies,
    dotCount: countDots(maze),
    score:0, lives:3, level,
    powerFrames:0, eatenCombo:1,
    phase:'attract', phaseTimer:90,
    modeTimer:300, globalMode:'scatter',
    frame:0,
  };
}

// ─── Ghost drawing ────────────────────────────────────────────────────────────
function drawGhost(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, glow: string, frightened: boolean, frame: number, eaten: boolean) {
  const cx = x, cy = y, r = TS/2 - 2;
  if (eaten) {
    // Just eyes
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(cx-4, cy-2, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+4, cy-2, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0055ff';
    ctx.beginPath(); ctx.arc(cx-3, cy-2, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+5, cy-2, 2, 0, Math.PI*2); ctx.fill();
    return;
  }
  const flash = frightened && Math.floor(frame/8)%2===0;
  const fill = frightened ? (flash ? '#aaaaff' : '#2233ff') : color;
  ctx.shadowColor = frightened ? '#0000ff' : glow;
  ctx.shadowBlur = 12;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy-2, r, Math.PI, 0);
  // wavy bottom
  const bw = (r*2)/3;
  ctx.lineTo(cx+r, cy+r-4);
  ctx.arc(cx+r-bw/2, cy+r-2, bw/2, 0, Math.PI);
  ctx.arc(cx, cy+r-2, bw/2, 0, Math.PI);
  ctx.arc(cx-r+bw/2, cy+r-2, bw/2, 0, Math.PI);
  ctx.lineTo(cx-r, cy-2);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  if (!frightened) {
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(cx-4, cy-4, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+4, cy-4, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0033aa';
    ctx.beginPath(); ctx.arc(cx-3, cy-4, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+5, cy-4, 2, 0, Math.PI*2); ctx.fill();
  } else if (!flash) {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('>.<', cx, cy+2);
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function NeonMazeRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GS>(makeMaze(1));
  const rafRef = useRef(0);
  const [ui, setUi] = useState({ score:0, lives:3, level:1, phase:'attract' as string, hiScore:0 });
  const hiRef = useRef(0);

  const emitUi = useCallback(() => {
    const g = gsRef.current;
    setUi({ score:g.score, lives:g.lives, level:g.level, phase:g.phase, hiScore:hiRef.current });
  }, []);

  // ── Update enemy ──────────────────────────────────────────────────────────
  function stepEnemy(e: Enemy, g: GS) {
    e.timer++;
    if (e.timer < e.delay) return;
    e.timer = 0;

    const { maze, player } = g;
    const totalDots = countDots(BASE_MAZE as number[][]);

    // Release from house?
    const eatenSoFar = totalDots - g.dotCount;
    if (e.mode === 'house') {
      if (eatenSoFar >= e.relDots) e.mode = 'exit';
      else return;
    }

    // Exit ghost house: head to (row=7, col=10) exit corridor
    if (e.mode === 'exit') {
      const dir = bfsDir(maze, e.row, e.col, 7, 10);
      if (dir) { e.dc = dir[0]; e.dr = dir[1]; }
      const nr = e.row + e.dr, nc = ((e.col+e.dc)+COLS)%COLS;
      if (nr >= 0 && nr < ROWS && ghostPass(tileAt(maze,nr,nc))) {
        e.row = nr; e.col = nc;
        e.tpx = e.col*TS+TS/2; e.tpy = e.row*TS+TS/2;
      }
      if (e.row === 7 && e.col === 10) e.mode = g.globalMode;
      return;
    }

    if (e.mode === 'frightened') {
      // Random direction, no reversals
      const opts = STEP4.filter(([dc,dr]) => {
        if (dc === -e.dc && dr === -e.dr) return false;
        const nr = e.row+dr, nc = ((e.col+dc)+COLS)%COLS;
        return nr >= 0 && nr < ROWS && ghostPass(tileAt(maze,nr,nc)) && tileAt(maze,nr,nc) !== T_HOME;
      });
      if (opts.length) {
        const [dc,dr] = opts[Math.floor(Math.random()*opts.length)];
        e.dc=dc; e.dr=dr;
      }
    } else {
      const [tr,tc] = e.mode==='scatter'
        ? [e.sRow, e.sCol]
        : [player.row, player.col];
      const dir = bfsDir(maze, e.row, e.col, tr, tc);
      if (dir) { e.dc=dir[0]; e.dr=dir[1]; }
    }

    const nr = e.row + e.dr, nc = ((e.col+e.dc)+COLS)%COLS;
    if (nr >= 0 && nr < ROWS && ghostPass(tileAt(maze,nr,nc))) {
      e.row = nr; e.col = nc;
    }
    e.tpx = e.col*TS+TS/2; e.tpy = e.row*TS+TS/2;
  }

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    function tick() {
      const g = gsRef.current;
      g.frame++;

      // ── Phase timers ────────────────────────────────────────────────────
      if (g.phase === 'attract') {
        if (--g.phaseTimer <= 0) { g.phase = 'playing'; emitUi(); }
      }

      if (g.phase === 'dying') {
        if (--g.phaseTimer <= 0) {
          if (g.lives <= 0) { g.phase = 'over'; }
          else { gsRef.current = { ...makeMaze(g.level), score:g.score, lives:g.lives, phase:'playing' }; }
          emitUi();
        }
      }

      if (g.phase === 'win') {
        if (--g.phaseTimer <= 0) {
          const nl = g.level + 1;
          gsRef.current = { ...makeMaze(nl), score:g.score, lives:g.lives, phase:'playing' };
          emitUi();
        }
      }

      if (g.phase !== 'playing') { draw(ctx, g); rafRef.current = requestAnimationFrame(tick); return; }

      // ── Mode timer (chase/scatter) ──────────────────────────────────────
      if (--g.modeTimer <= 0) {
        g.globalMode = g.globalMode === 'chase' ? 'scatter' : 'chase';
        g.modeTimer = g.globalMode === 'chase' ? 400 : 200;
        g.enemies.forEach(e => { if (e.mode==='chase'||e.mode==='scatter') e.mode=g.globalMode; });
      }

      // ── Frightened countdown ────────────────────────────────────────────
      if (g.powerFrames > 0) {
        g.powerFrames--;
        if (g.powerFrames === 0) {
          g.enemies.forEach(e => { if (e.mode==='frightened') e.mode=g.globalMode; });
          g.eatenCombo = 1;
        }
      }

      // ── Player movement ─────────────────────────────────────────────────
      const p = g.player;
      p.mouthA += 0.07 * p.mouthDir;
      if (p.mouthA > 0.35) p.mouthDir = -1;
      if (p.mouthA < 0.02) p.mouthDir = 1;

      // Try buffered direction
      if (p.ndc !== 0 || p.ndr !== 0) {
        const tr = p.row + p.ndr, tc = ((p.col+p.ndc)+COLS)%COLS;
        const atCenter = Math.abs(p.px - (p.col*TS+TS/2)) < p.speed+1 &&
                         Math.abs(p.py - (p.row*TS+TS/2)) < p.speed+1;
        if (atCenter && playerPass(tileAt(g.maze, tr, tc))) {
          p.px = p.col*TS+TS/2; p.py = p.row*TS+TS/2;
          p.dc = p.ndc; p.dr = p.ndr; p.ndc=0; p.ndr=0;
        }
      }

      // Move
      if (p.dc !== 0 || p.dr !== 0) {
        const npx = p.px + p.dc * p.speed;
        const npy = p.py + p.dr * p.speed;
        const nextCol = Math.round((npx-TS/2)/TS);
        const nextRow = Math.round((npy-TS/2)/TS);
        if (playerPass(tileAt(g.maze, nextRow, nextCol))) {
          p.px = npx; p.py = npy;
        } else {
          p.px = p.col*TS+TS/2; p.py = p.row*TS+TS/2;
          p.dc = 0; p.dr = 0;
        }
      }

      // Snap grid pos
      p.col = Math.round((p.px-TS/2)/TS);
      p.row = Math.round((p.py-TS/2)/TS);

      // Tunnel wrap
      if (p.px < TS/2) { p.px = CW - TS/2; p.col = COLS-1; }
      if (p.px > CW - TS/2) { p.px = TS/2; p.col = 0; }

      // Eat dot
      const pt = tileAt(g.maze, p.row, p.col);
      if (pt === T_DOT) {
        g.maze[p.row][p.col] = T_VOID;
        g.score += 10; g.dotCount--;
        if (g.dotCount <= 0) { g.phase='win'; g.phaseTimer=120; emitUi(); }
      } else if (pt === T_PWR) {
        g.maze[p.row][p.col] = T_VOID;
        g.score += 50; g.dotCount--;
        g.powerFrames = 300;
        g.eatenCombo = 1;
        g.enemies.forEach(e => { if (e.mode!=='house'&&e.mode!=='exit'&&e.mode!=='eaten') e.mode='frightened'; });
      }

      // ── Enemy step & collision ──────────────────────────────────────────
      for (const e of g.enemies) {
        // Track frighten frames per enemy
        if (e.mode==='frightened' && g.powerFrames<=0) e.mode=g.globalMode;

        stepEnemy(e, g);

        // Smooth px/py toward target
        const lspd = 0.3;
        e.px += (e.tpx - e.px) * lspd;
        e.py += (e.tpy - e.py) * lspd;

        // Collision with player
        const dx = Math.abs(e.px - p.px), dy = Math.abs(e.py - p.py);
        if (dx < TS*0.6 && dy < TS*0.6) {
          if (e.mode === 'frightened') {
            e.mode = 'eaten';
            e.tpx = 10*TS+TS/2; e.tpy = 9*TS+TS/2; // back to house
            g.score += 200 * g.eatenCombo;
            g.eatenCombo = Math.min(g.eatenCombo * 2, 16);
            setTimeout(() => { e.mode = 'exit'; e.row=9; e.col=10; e.px=e.tpx; e.py=e.tpy; }, 2000);
          } else if (e.mode!=='eaten') {
            g.lives--;
            g.phase = 'dying';
            g.phaseTimer = 120;
            emitUi();
            break;
          }
        }
      }

      if (g.score > hiRef.current) { hiRef.current = g.score; emitUi(); }
      draw(ctx, g);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [emitUi]);

  // ── Keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const g = gsRef.current;
      if (g.phase === 'over') { gsRef.current = makeMaze(1); gsRef.current.phase='playing'; emitUi(); return; }
      if (g.phase === 'attract') { g.phase='playing'; emitUi(); return; }
      const map: Record<string,[number,number]> = {
        ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1],
        KeyA:[-1,0], KeyD:[1,0], KeyW:[0,-1], KeyS:[0,1],
      };
      const d = map[e.code];
      if (d) { e.preventDefault(); g.player.ndc=d[0]; g.player.ndr=d[1]; }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [emitUi]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] gap-3 select-none"
        style={{ background:'#050510', fontFamily:'monospace' }}>
      <h1 className="text-3xl font-black tracking-widest"
          style={{ color:'#00ffff', textShadow:'0 0 20px #00ffff,0 0 40px #0088ff' }}>
        NEON MAZE RUNNER
      </h1>

      <div className="flex gap-8 text-sm font-bold" style={{ color:'#aaaaff' }}>
        <span>HI <span style={{ color:'#ffff00' }}>{ui.hiScore}</span></span>
        <span>SCORE <span style={{ color:'#00ffff' }}>{ui.score}</span></span>
        <span>LV <span style={{ color:'#ff66ff' }}>{ui.level}</span></span>
        <span>{'❤️'.repeat(Math.max(0,ui.lives))}</span>
      </div>

      <canvas ref={canvasRef} width={CW} height={CH}
        className="rounded-lg cursor-pointer"
        style={{ border:'2px solid #00ffff', boxShadow:'0 0 30px #00ffff44' }}
        onClick={() => {
          const g = gsRef.current;
          if (g.phase==='over') { gsRef.current=makeMaze(1); gsRef.current.phase='playing'; emitUi(); }
          else if (g.phase==='attract') { g.phase='playing'; emitUi(); }
        }}
      />

      <p className="text-xs" style={{ color:'#556677' }}>
        Arrow Keys / WASD — navigate · collect all pellets · power up to eat chasers!
      </p>

      {/* Mobile buttons */}
      <div className="flex flex-col items-center gap-1 md:hidden">
        <button className="px-8 py-3 rounded font-black" style={{ background:'#001133', color:'#00ffff', border:'2px solid #00ffff' }}
          onPointerDown={() => { gsRef.current.player.ndc=0; gsRef.current.player.ndr=-1; }}>▲</button>
        <div className="flex gap-2">
          {([[-1,0,'◄'],[1,0,'►']] as [number,number,string][]).map(([dc,dr,lbl],i) => (
            <button key={i} className="px-6 py-3 rounded font-black" style={{ background:'#001133', color:'#00ffff', border:'2px solid #00ffff' }}
              onPointerDown={() => { gsRef.current.player.ndc=dc; gsRef.current.player.ndr=dr; }}>{lbl}</button>
          ))}
        </div>
        <button className="px-8 py-3 rounded font-black" style={{ background:'#001133', color:'#00ffff', border:'2px solid #00ffff' }}
          onPointerDown={() => { gsRef.current.player.ndc=0; gsRef.current.player.ndr=1; }}>▼</button>
      </div>
    </div>
  );
}

// ─── Drawing ──────────────────────────────────────────────────────────────────
function draw(ctx: CanvasRenderingContext2D, g: GS) {
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, CW, CH);

  // ── HUD ──
  ctx.fillStyle = '#0a0a22';
  ctx.fillRect(0, 0, CW, HUD);
  ctx.fillStyle = '#00ffff33';
  ctx.fillRect(0, HUD-1, CW, 1);

  const OY = HUD; // maze offset Y

  // ── Maze tiles ──
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = g.maze[r][c];
      const x = c*TS, y = OY + r*TS;

      if (t === T_WALL) {
        ctx.fillStyle = '#001144';
        ctx.fillRect(x, y, TS, TS);
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 6;
        ctx.strokeRect(x+1, y+1, TS-2, TS-2);
        ctx.shadowBlur = 0;
      } else if (t === T_DOT) {
        ctx.fillStyle = '#aaaacc';
        ctx.shadowColor = '#aaaaff';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(x+TS/2, y+TS/2, 2.5, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (t === T_PWR) {
        const pulse = 0.7 + 0.3 * Math.sin(g.frame * 0.12);
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 14 * pulse;
        ctx.beginPath();
        ctx.arc(x+TS/2, y+TS/2, 5.5 * pulse, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (t === T_HOME) {
        ctx.fillStyle = '#110022';
        ctx.fillRect(x, y, TS, TS);
      }
    }
  }

  // ── Enemies ──
  for (const e of g.enemies) {
    if (e.mode === 'house' || e.mode === 'exit') {
      drawGhost(ctx, e.px, OY + e.py, e.color, e.glow, false, g.frame, false);
    } else {
      drawGhost(ctx, e.px, OY + e.py, e.color, e.glow,
        e.mode==='frightened', g.frame, e.mode==='eaten');
    }
  }

  // Ghost score popup (eaten combo)
  if (g.eatenCombo > 1) {
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${200*(g.eatenCombo/2)}`, CW/2, OY + ROWS*TS/2 - 20);
  }

  // ── Player ──
  const { px, py, dc, dr, mouthA } = g.player;
  const angle = Math.atan2(dr, dc); // direction angle
  ctx.fillStyle = '#ffdd00';
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  if (g.phase === 'dying') {
    // Death animation: shrink
    const t = Math.max(0, 1 - g.phaseTimer / 120);
    const r = (TS/2-1) * (1-t);
    if (r > 0) { ctx.arc(px, OY+py, r, 0, Math.PI*2); ctx.fill(); }
  } else {
    ctx.arc(px, OY+py, TS/2-1, angle+mouthA, angle+Math.PI*2-mouthA);
    ctx.lineTo(px, OY+py);
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // ── Overlay messages ──
  if (g.phase === 'attract') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, OY, CW, ROWS*TS);
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NEON MAZE RUNNER', CW/2, OY + ROWS*TS/2 - 30);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffff00';
    ctx.font = '14px monospace';
    ctx.fillText('Press SPACE or tap to start', CW/2, OY + ROWS*TS/2 + 10);
    ctx.fillStyle = '#aaaaff';
    ctx.font='11px monospace';
    ctx.fillText('Collect all pellets. Eat power pellets to hunt chasers!', CW/2, OY+ROWS*TS/2+36);
  }

  if (g.phase === 'win') {
    ctx.fillStyle = 'rgba(0,0,30,0.7)';
    ctx.fillRect(0, OY, CW, ROWS*TS);
    ctx.fillStyle = '#00ff88'; ctx.shadowColor='#00ff88'; ctx.shadowBlur=20;
    ctx.font='bold 24px monospace'; ctx.textAlign='center';
    ctx.fillText('LEVEL CLEAR!', CW/2, OY+ROWS*TS/2);
    ctx.shadowBlur=0;
  }

  if (g.phase === 'over') {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, OY, CW, ROWS*TS);
    ctx.fillStyle = '#ff2244'; ctx.shadowColor='#ff0033'; ctx.shadowBlur=24;
    ctx.font='bold 26px monospace'; ctx.textAlign='center';
    ctx.fillText('GAME OVER', CW/2, OY+ROWS*TS/2-20);
    ctx.shadowBlur=0;
    ctx.fillStyle='#ffff00'; ctx.font='14px monospace';
    ctx.fillText(`Final Score: ${g.score}`, CW/2, OY+ROWS*TS/2+14);
    ctx.fillStyle='#aaaaff'; ctx.font='11px monospace';
    ctx.fillText('Press SPACE or click to retry', CW/2, OY+ROWS*TS/2+36);
  }
}
