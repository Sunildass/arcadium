import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export interface MineCell {
    r: number;
    c: number;
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    neighborMines: number;
}

export interface MinesweeperState {
    grid: MineCell[][];
    rows: number;
    cols: number;
    mineCount: number;
    minesLeft: number;
    isGameOver: boolean;
    hasStarted: boolean; // First click always safe
    winner: 'Player' | 'AI' | null;
}

export type MinesweeperAction = 
  | { type: 'REVEAL'; r: number; c: number }
  | { type: 'FLAG'; r: number; c: number };

export class MinesweeperEngine implements GameEngine<MinesweeperState, MinesweeperAction> {
    private startTimeMs: number = 0;
    private rows: number;
    private cols: number;
    private mineCount: number;

    constructor(difficulty: 'Easy' | 'Medium' | 'Hard') {
        if (difficulty === 'Easy') {
            this.rows = 9; this.cols = 9; this.mineCount = 10;
        } else if (difficulty === 'Medium') {
            this.rows = 16; this.cols = 16; this.mineCount = 40;
        } else {
            this.rows = 16; this.cols = 30; this.mineCount = 99;
        }
    }

    initialize(): MinesweeperState {
        this.startTimeMs = Date.now();
        const grid: MineCell[][] = Array(this.rows).fill(null).map((_, r) => 
            Array(this.cols).fill(null).map((_, c) => ({
                r, c, isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0
            }))
        );

        return {
            grid,
            rows: this.rows,
            cols: this.cols,
            mineCount: this.mineCount,
            minesLeft: this.mineCount,
            isGameOver: false,
            hasStarted: false,
            winner: null
        };
    }

    private placeMines(state: MinesweeperState, firstR: number, firstC: number) {
        let placed = 0;
        while (placed < this.mineCount) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);
            
            // Don't place on first click or already placed
            if (!state.grid[r][c].isMine && Math.abs(r - firstR) > 1 && Math.abs(c - firstC) > 1) {
                 state.grid[r][c].isMine = true;
                 placed++;
            }
        }

        // Calculate neighbors
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!state.grid[r][c].isMine) {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const nr = r + dr, nc = c + dc;
                            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && state.grid[nr][nc].isMine) {
                                count++;
                            }
                        }
                    }
                    state.grid[r][c].neighborMines = count;
                }
            }
        }
    }

    private revealSafeZeros(state: MinesweeperState, r: number, c: number) {
        const stack = [[r, c]];
        while (stack.length > 0) {
            const [currR, currC] = stack.pop()!;
            const cell = state.grid[currR][currC];
            
            if (cell.isRevealed || cell.isFlagged) continue;
            
            cell.isRevealed = true;

            if (cell.neighborMines === 0) {
                 for (let dr = -1; dr <= 1; dr++) {
                     for (let dc = -1; dc <= 1; dc++) {
                         const nr = currR + dr, nc = currC + dc;
                         if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                             if (!state.grid[nr][nc].isRevealed) {
                                 stack.push([nr, nc]);
                             }
                         }
                     }
                 }
            }
        }
    }

    private checkWin(state: MinesweeperState): boolean {
        let unrevealedSafe = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!state.grid[r][c].isMine && !state.grid[r][c].isRevealed) unrevealedSafe++;
            }
        }
        return unrevealedSafe === 0;
    }

    update(state: MinesweeperState, action: MinesweeperAction): MinesweeperState {
        if (state.isGameOver) return state;
        const s = { ...state, grid: state.grid.map(row => row.map(cell => ({...cell}))) };
        const { r, c } = action;
        const cell = s.grid[r][c];

        if (action.type === 'FLAG') {
            if (cell.isRevealed) return state; // Already revealed
            cell.isFlagged = !cell.isFlagged;
            s.minesLeft += cell.isFlagged ? -1 : 1;
            return s;
        }

        if (action.type === 'REVEAL') {
            if (cell.isFlagged || cell.isRevealed) return state;

            if (!s.hasStarted) {
                 this.placeMines(s, r, c);
                 s.hasStarted = true;
            }

            if (cell.isMine) {
                 // Game Over: Lose
                 cell.isRevealed = true;
                 s.isGameOver = true;
                 
                 // Reveal all mines visually
                 for (let rr = 0; rr < this.rows; rr++) {
                     for (let cc = 0; cc < this.cols; cc++) {
                          if (s.grid[rr][cc].isMine) s.grid[rr][cc].isRevealed = true;
                     }
                 }
                 return s;
            }

            // Safe reveal
            if (cell.neighborMines > 0) {
                 cell.isRevealed = true;
            } else {
                 this.revealSafeZeros(s, r, c);
            }

            if (this.checkWin(s)) {
                 s.isGameOver = true;
                 s.winner = 'Player';
                 
                 // Auto flag remaining
                 s.minesLeft = 0;
                 for (let rr = 0; rr < this.rows; rr++) {
                     for (let cc = 0; cc < this.cols; cc++) {
                          if (s.grid[rr][cc].isMine) s.grid[rr][cc].isFlagged = true;
                     }
                 }
            }

            return s;
        }

        return state;
    }

    evaluateWin(state: MinesweeperState): GameResult | null {
         if (!state.isGameOver) return null;
         
         let diffRank: 'Easy' | 'Medium' | 'Hard' = 'Easy';
         if (this.mineCount === 40) diffRank = 'Medium';
         if (this.mineCount === 99) diffRank = 'Hard';

         return {
             winner: state.winner === 'Player' ? 'Player1' : null,
             score: state.winner === 'Player' ? (diffRank === 'Hard' ? 5000 : diffRank === 'Medium' ? 2000 : 500) : 0,
             difficulty: diffRank,
             playTimeMs: Date.now() - this.startTimeMs
         };
    }
}
