import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export interface GameObject {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    status: 'active' | 'destroyed';
}

export interface Alien extends GameObject {
    type: 'squid' | 'crab' | 'octopus';
    points: number;
}

export interface Projectile extends GameObject {
    owner: 'player' | 'alien';
    dy: number;
}

export interface SpaceInvadersState {
    player: GameObject & { dx: number };
    aliens: Alien[];
    projectiles: Projectile[];
    shields: GameObject[];
    
    // Alien movement orchestration
    alienDir: 1 | -1;
    alienSpeed: number;
    alienDropAccumulator: number;

    score: number;
    lives: number;
    isGameOver: boolean;
    hasWon: boolean;
    isPaused: boolean;
}

export type SpaceInvadersAction = 
  | { type: 'MOVE_PLAYER'; dx: number }
  | { type: 'SHOOT' }
  | { type: 'TICK'; deltaMs: number }
  | { type: 'TOGGLE_PAUSE' };

export class SpaceInvadersEngine implements GameEngine<SpaceInvadersState, SpaceInvadersAction> {
    private startTimeMs: number = 0;
    public readonly width = 800;
    public readonly height = 600;
    private difficulty: 'Easy' | 'Medium' | 'Hard';

    constructor(difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium') {
        this.difficulty = difficulty;
    }

    initialize(): SpaceInvadersState {
        this.startTimeMs = Date.now();
        
        const aliens: Alien[] = [];
        const rows = this.difficulty === 'Easy' ? 4 : (this.difficulty === 'Medium' ? 5 : 6);
        const cols = 11; // Standard SI width
        
        const startX = 100;
        const startY = 80;
        const spacingX = 45;
        const spacingY = 40;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let type: 'squid' | 'crab' | 'octopus' = 'octopus';
                let points = 10;
                
                if (r === 0) { type = 'squid'; points = 30; }
                else if (r === 1 || r === 2) { type = 'crab'; points = 20; }
                
                aliens.push({
                    id: `a-${r}-${c}`,
                    x: startX + c * spacingX,
                    y: startY + r * spacingY,
                    width: 30,
                    height: 24,
                    status: 'active',
                    type,
                    points
                });
            }
        }

        const shields: GameObject[] = [];
        const shieldCount = 4;
        const shieldSpace = this.width / shieldCount;
        
        // Build shields out of mini blocks so they destruct piecemeal
        for (let i = 0; i < shieldCount; i++) {
             const cx = (i * shieldSpace) + (shieldSpace / 2);
             const cy = this.height - 120;
             
             for (let sr = 0; sr < 4; sr++) {
                 for (let sc = 0; sc < 6; sc++) {
                      // Carve arch
                      if (sr === 3 && (sc === 2 || sc === 3)) continue;
                      
                      shields.push({
                           id: `s-${i}-${sr}-${sc}`,
                           x: (cx - 30) + (sc * 10),
                           y: cy + (sr * 10),
                           width: 10,
                           height: 10,
                           status: 'active'
                      });
                 }
             }
        }

        return {
            player: {
                id: 'player',
                x: this.width / 2 - 20,
                y: this.height - 40,
                width: 40,
                height: 20,
                status: 'active',
                dx: 0
            },
            aliens,
            projectiles: [],
            shields,
            alienDir: 1,
            alienSpeed: this.difficulty === 'Hard' ? 30 : 20, // Pixels per second base
            alienDropAccumulator: 0,
            score: 0,
            lives: 3,
            isGameOver: false,
            hasWon: false,
            isPaused: true
        };
    }

    private rectIntersect(r1: GameObject, r2: GameObject) {
         if (r1.status !== 'active' || r2.status !== 'active') return false;
         return !(r2.x > r1.x + r1.width || 
                  r2.x + r2.width < r1.x || 
                  r2.y > r1.y + r1.height ||
                  r2.y + r2.height < r1.y);
    }

    update(state: SpaceInvadersState, action: SpaceInvadersAction): SpaceInvadersState {
        if (state.isGameOver) return state;

        if (action.type === 'TOGGLE_PAUSE') {
            return { ...state, isPaused: !state.isPaused };
        }

        if (state.isPaused) return state;

        // Clone state for mutation
        const s = { 
            ...state, 
            player: { ...state.player },
            aliens: state.aliens.map(a => ({...a})),
            projectiles: state.projectiles.map(p => ({...p})),
            shields: state.shields.map(sh => ({...sh}))
        };

        if (action.type === 'MOVE_PLAYER') {
             // action.dx is treated as setting velocity here for simpler control logic from UI
             s.player.dx = action.dx;
             return s;
        }

        if (action.type === 'SHOOT') {
             // Max 1 player projectile
             if (!s.projectiles.find(p => p.owner === 'player' && p.status === 'active')) {
                  s.projectiles.push({
                       id: `p-${Date.now()}`,
                       x: s.player.x + s.player.width / 2 - 2,
                       y: s.player.y - 15,
                       width: 4,
                       height: 15,
                       status: 'active',
                       owner: 'player',
                       dy: -400 // Pixels per second
                  });
             }
             return s;
        }

        if (action.type === 'TICK') {
             const dt = action.deltaMs / 1000; // seconds

             // 1. Player Movement
             if (s.player.dx !== 0) {
                 s.player.x += s.player.dx * 300 * dt; // 300px/s speed
                 // Bounds
                 s.player.x = Math.max(10, Math.min(s.player.x, this.width - s.player.width - 10));
             }

             // 2. Alien Movement Orchestration
             // They move together. Find bounds.
             let minX = this.width;
             let maxX = 0;
             let maxY = 0;
             let activeAliensCount = 0;

             s.aliens.forEach(a => {
                  if (a.status === 'active') {
                       activeAliensCount++;
                       if (a.x < minX) minX = a.x;
                       if (a.x + a.width > maxX) maxX = a.x + a.width;
                       if (a.y + a.height > maxY) maxY = a.y + a.height;
                  }
             });

             if (activeAliensCount === 0) {
                  s.isGameOver = true;
                  s.hasWon = true;
                  return s;
             }

             // Speed increases as count decreases
             const speedMultiplier = 1 + (1 - (activeAliensCount / (s.aliens.length))) * 3;
             const currentAlienSpeed = s.alienSpeed * speedMultiplier;

             // Check border bounce
             let hitBorder = false;
             if (s.alienDir === 1 && maxX > this.width - 20) hitBorder = true;
             else if (s.alienDir === -1 && minX < 20) hitBorder = true;

             if (hitBorder) {
                  s.alienDir *= -1;
                  s.alienDropAccumulator += 20; // 20px drop
                  // Fix them inside bounds
                  s.aliens.forEach(a => { a.x += s.alienDir * 5; });
             } else {
                  // Horizontal move
                  s.aliens.forEach(a => {
                       a.x += s.alienDir * currentAlienSpeed * dt;
                       // Apply vertical drop gradually so it looks like traditional SI snapping if we want,
                       // or smooth. We'll do smooth drop accumulation to avoid huge jumps visually.
                       if (s.alienDropAccumulator > 0) {
                            const dropStep = Math.min(s.alienDropAccumulator, 50 * dt);
                            a.y += dropStep;
                       }
                  });
                  if (s.alienDropAccumulator > 0) {
                      s.alienDropAccumulator = Math.max(0, s.alienDropAccumulator - (50 * dt));
                  }
             }

             // Alien reach bottom?
             if (maxY > s.player.y) {
                  s.lives = 0;
                  s.isGameOver = true;
                  s.hasWon = false;
                  return s;
             }

             // 3. Alien Shooting
             // Randomly front-line aliens shoot
             if (Math.random() < (0.01 * speedMultiplier * (this.difficulty === 'Easy' ? 0.5 : 1))) {
                 // Build columns
                 const cols: Record<number, Alien> = {};
                 s.aliens.forEach(a => {
                      if (a.status === 'active') {
                           // Approx column by X
                           const cId = Math.floor(a.x / 40);
                           if (!cols[cId] || a.y > cols[cId].y) cols[cId] = a; // Lowest
                      }
                 });
                 const activeCols = Object.values(cols);
                 if (activeCols.length > 0) {
                      const shooter = activeCols[Math.floor(Math.random() * activeCols.length)];
                      s.projectiles.push({
                           id: `ap-${Date.now()}`,
                           x: shooter.x + shooter.width / 2 - 2,
                           y: shooter.y + shooter.height,
                           width: 4,
                           height: 15,
                           status: 'active',
                           owner: 'alien',
                           dy: 200 * (this.difficulty === 'Hard' ? 1.5 : 1)
                      });
                 }
             }

             // 4. Projectiles Physics & Collisions
             for (let i = 0; i < s.projectiles.length; i++) {
                 const p = s.projectiles[i];
                 if (p.status !== 'active') continue;

                 p.y += p.dy * dt;
                 if (p.y < -20 || p.y > this.height + 20) {
                      p.status = 'destroyed';
                      continue;
                 }

                 // Check hits
                 if (p.owner === 'player') {
                      // Player hits Alien
                      const hitAlien = s.aliens.find(a => this.rectIntersect(p, a));
                      if (hitAlien) {
                           hitAlien.status = 'destroyed';
                           p.status = 'destroyed';
                           s.score += hitAlien.points;
                           continue;
                      }

                      // Player hits Shield
                      const hitShield = s.shields.find(sh => this.rectIntersect(p, sh));
                      if (hitShield) {
                           hitShield.status = 'destroyed';
                           p.status = 'destroyed';
                           continue;
                      }
                 } else {
                      // Alien hits Player
                      if (this.rectIntersect(p, s.player)) {
                           p.status = 'destroyed';
                           s.lives--;
                           if (s.lives <= 0) {
                                s.isGameOver = true;
                                s.hasWon = false;
                           } else {
                                // Reset player & clear alien projectiles
                                s.player.x = this.width / 2 - s.player.width / 2;
                                s.projectiles = s.projectiles.filter(pr => pr.owner === 'player');
                                s.isPaused = true; 
                           }
                           continue;
                      }

                      // Alien hits Shield
                      const hitShield = s.shields.find(sh => this.rectIntersect(p, sh));
                      if (hitShield) {
                           hitShield.status = 'destroyed';
                           p.status = 'destroyed';
                           continue;
                      }
                 }
                 
                 // Projectile hits Projectile
                 const hitProj = s.projectiles.find(other => other !== p && other.status === 'active' && other.owner !== p.owner && this.rectIntersect(p, other));
                 if (hitProj) {
                      hitProj.status = 'destroyed';
                      p.status = 'destroyed';
                 }
             }

             // Clean up dead objects to save mem loops
             s.projectiles = s.projectiles.filter(p => p.status === 'active');
             s.shields = s.shields.filter(sh => sh.status === 'active');
             s.aliens = s.aliens.filter(a => a.status === 'active');

             return s;
        }

        return state;
    }

    evaluateWin(state: SpaceInvadersState): GameResult | null {
        if (!state.isGameOver) return null;

        const lifeBonus = state.hasWon ? state.lives * 1000 : 0;
        
        return {
            winner: state.hasWon ? 'Player1' : null,
            score: state.score + lifeBonus,
            difficulty: this.difficulty,
            playTimeMs: Date.now() - this.startTimeMs
        };
    }
}
