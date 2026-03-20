import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export interface NumberMatchState {
    grid: (number | null)[];
    selected: number[]; // indices
    matched: number[];  // matched indices (cleared)
    score: number;
    moves: number;
    isGameOver: boolean;
    message: string;
    gridSize: number; // 4x4 = 16, 6x6 = 36
}

export type NumberMatchAction =
  | { type: 'SELECT'; index: number }
  | { type: 'CLEAR_WRONG' };

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export class NumberMatchEngine implements GameEngine<NumberMatchState, NumberMatchAction> {
    private startTimeMs = 0;
    private gridSize: number;

    constructor(difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium') {
        this.gridSize = difficulty === 'Easy' ? 16 : (difficulty === 'Hard' ? 36 : 16);
    }

    initialize(): NumberMatchState {
        this.startTimeMs = Date.now();
        const pairCount = this.gridSize / 2;
        const numbers = Array.from({ length: pairCount }, (_, i) => i + 1);
        const grid = shuffle([...numbers, ...numbers]);
        return {
            grid,
            selected: [],
            matched: [],
            score: 0,
            moves: 0,
            isGameOver: false,
            message: 'Find and click matching number pairs!',
            gridSize: this.gridSize
        };
    }

    update(state: NumberMatchState, action: NumberMatchAction): NumberMatchState {
        if (state.isGameOver) return state;

        const s = { ...state, selected: [...state.selected], matched: [...state.matched], grid: [...state.grid] };

        if (action.type === 'SELECT') {
            const idx = action.index;
            if (s.matched.includes(idx) || s.selected.includes(idx)) return state;
            if (s.selected.length >= 2) return state; // blocking extra clicks

            s.selected.push(idx);
            s.moves++;

            if (s.selected.length === 2) {
                const [a, b] = s.selected;
                if (s.grid[a] === s.grid[b]) {
                    // Match!
                    s.matched.push(a, b);
                    s.selected = [];
                    s.score += 100;
                    s.message = `✅ Match! Found ${s.grid[a]}`;
                    if (s.matched.length === s.grid.length) {
                        s.isGameOver = true;
                        s.message = `🎉 Complete in ${s.moves} moves! Score: ${s.score}`;
                    }
                }
                // If no match, leave selected for CLEAR_WRONG action
            }
        }

        if (action.type === 'CLEAR_WRONG') {
            if (s.selected.length === 2) {
                const [a, b] = s.selected;
                if (s.grid[a] !== s.grid[b]) {
                    s.selected = [];
                    s.message = 'Not a match! Try again.';
                }
            }
        }

        return s;
    }

    evaluateWin(state: NumberMatchState): GameResult | null {
        if (!state.isGameOver) return null;
        return {
            winner: 'Player1',
            score: state.score,
            difficulty: 'Medium',
            playTimeMs: Date.now() - this.startTimeMs
        };
    }
}
