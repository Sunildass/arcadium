import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export interface PatternCell {
    id: number;
    isLit: boolean;
}

export type PatternPhase = 'watching' | 'recall' | 'intermission' | 'gameover';

export interface PatternRecallState {
    phase: PatternPhase;
    gridSize: number; // e.g. 3 = 3x3 grid
    pattern: boolean[];         // the lit pattern to memorize
    playerSelection: boolean[]; // what player has tapped so far
    round: number;
    score: number;
    lives: number;
    isGameOver: boolean;
    message: string;
    litCount: number; // how many cells are lit
}

export type PatternRecallAction =
  | { type: 'TOGGLE_CELL'; index: number }
  | { type: 'SUBMIT' }
  | { type: 'START_ROUND' };

function generatePattern(size: number, litCount: number): boolean[] {
    const total = size * size;
    const arr = Array(total).fill(false);
    const indices = Array.from({ length: total }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    indices.slice(0, litCount).forEach(i => { arr[i] = true; });
    return arr;
}

export class PatternRecallEngine implements GameEngine<PatternRecallState, PatternRecallAction> {
    private startTimeMs = 0;
    private difficulty: 'Easy' | 'Medium' | 'Hard';

    constructor(difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium') {
        this.difficulty = difficulty;
    }

    initialize(): PatternRecallState {
        this.startTimeMs = Date.now();
        const gridSize = this.difficulty === 'Easy' ? 3 : (this.difficulty === 'Hard' ? 5 : 4);
        const litCount = this.difficulty === 'Easy' ? 3 : (this.difficulty === 'Hard' ? 8 : 5);
        const total = gridSize * gridSize;
        return {
            phase: 'intermission',
            gridSize,
            pattern: generatePattern(gridSize, litCount),
            playerSelection: Array(total).fill(false),
            round: 1,
            score: 0,
            lives: 3,
            isGameOver: false,
            message: 'Study the lit cells, then recreate the pattern from memory!',
            litCount
        };
    }

    update(state: PatternRecallState, action: PatternRecallAction): PatternRecallState {
        if (state.isGameOver) return state;
        const s = { ...state, playerSelection: [...state.playerSelection], pattern: [...state.pattern] };

        if (action.type === 'START_ROUND') {
            const litCount = Math.min(s.litCount + (s.round > 1 ? 1 : 0), s.gridSize * s.gridSize - 2);
            const total = s.gridSize * s.gridSize;
            return {
                ...s,
                phase: 'watching',
                pattern: generatePattern(s.gridSize, litCount),
                playerSelection: Array(total).fill(false),
                litCount,
                message: 'Memorize the pattern...'
            };
        }

        if (action.type === 'TOGGLE_CELL' && s.phase === 'recall') {
            s.playerSelection[action.index] = !s.playerSelection[action.index];
            return s;
        }

        if (action.type === 'SUBMIT' && s.phase === 'recall') {
            // Compare selections
            const correct = s.pattern.every((v, i) => v === s.playerSelection[i]);
            if (correct) {
                const pts = s.litCount * 100;
                s.score += pts;
                s.round++;
                s.phase = 'intermission';
                s.message = `✅ Perfect! +${pts} pts. Round ${s.round} coming up!`;
            } else {
                s.lives--;
                s.phase = 'intermission';
                s.message = `❌ Not quite! ${s.lives} live(s) remaining.`;
                if (s.lives <= 0) {
                    s.isGameOver = true;
                    s.message = `Game Over! Reached Round ${s.round}. Score: ${s.score}`;
                }
            }
        }

        return s;
    }

    evaluateWin(state: PatternRecallState): GameResult | null {
        if (!state.isGameOver) return null;
        return {
            winner: 'Player1',
            score: state.score,
            difficulty: this.difficulty,
            playTimeMs: Date.now() - this.startTimeMs
        };
    }
}
