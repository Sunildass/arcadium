import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type ReactionColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export interface ReactionMemoryState {
    phase: 'watching' | 'recall' | 'intermission' | 'gameover';
    sequence: ReactionColor[];
    playerInput: ReactionColor[];
    round: number;
    score: number;
    lives: number;
    isGameOver: boolean;
    message: string;
    activeColor: ReactionColor | null; // currently flashing color
    flashIndex: number; // which index in sequence is being shown
}

export type ReactionMemoryAction =
  | { type: 'INPUT'; color: ReactionColor }
  | { type: 'FLASH_NEXT' }          // show next color in sequence
  | { type: 'START_RECALL' }        // done flashing, player's turn
  | { type: 'START_ROUND' };        // begin showing next round's sequence

const COLORS: ReactionColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

function randColor(): ReactionColor {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export class ReactionMemoryEngine implements GameEngine<ReactionMemoryState, ReactionMemoryAction> {
    private startTimeMs = 0;
    private difficulty: 'Easy' | 'Medium' | 'Hard';

    constructor(difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium') {
        this.difficulty = difficulty;
    }

    initialize(): ReactionMemoryState {
        this.startTimeMs = Date.now();
        return {
            phase: 'intermission',
            sequence: [randColor()],
            playerInput: [],
            round: 1,
            score: 0,
            lives: 3,
            isGameOver: false,
            message: 'Watch the flashing sequence, then repeat it!',
            activeColor: null,
            flashIndex: 0
        };
    }

    update(state: ReactionMemoryState, action: ReactionMemoryAction): ReactionMemoryState {
        if (state.isGameOver) return state;
        const s = { ...state, playerInput: [...state.playerInput], sequence: [...state.sequence] };

        if (action.type === 'START_ROUND') {
            if (s.round > 1) {
                s.sequence.push(randColor());
            }
            s.playerInput = [];
            s.flashIndex = 0;
            s.activeColor = null;
            s.phase = 'watching';
            s.message = 'Watch carefully...';
            return s;
        }

        if (action.type === 'FLASH_NEXT' && s.phase === 'watching') {
            if (s.flashIndex < s.sequence.length) {
                s.activeColor = s.sequence[s.flashIndex];
                s.flashIndex++;
            } else {
                s.activeColor = null;
            }
            return s;
        }

        if (action.type === 'START_RECALL') {
            s.phase = 'recall';
            s.activeColor = null;
            s.flashIndex = 0;
            s.message = `Your turn! Repeat the ${s.sequence.length}-color sequence.`;
            return s;
        }

        if (action.type === 'INPUT' && s.phase === 'recall') {
            const inputIdx = s.playerInput.length;
            s.playerInput.push(action.color);

            if (action.color !== s.sequence[inputIdx]) {
                // Wrong!
                s.lives--;
                s.phase = 'intermission';
                s.message = `❌ Wrong! This round resets. ${s.lives} live(s) left.`;
                s.playerInput = [];
                if (s.lives <= 0) {
                    s.isGameOver = true;
                    s.message = `Game Over! Reached Round ${s.round}. Score: ${s.score}`;
                }
                return s;
            }

            if (s.playerInput.length === s.sequence.length) {
                // Completed!
                const pts = s.sequence.length * 50;
                s.score += pts;
                s.round++;
                s.phase = 'intermission';
                s.message = `✅ Correct! +${pts} pts. Round ${s.round} coming up!`;
            }
        }

        return s;
    }

    evaluateWin(state: ReactionMemoryState): GameResult | null {
        if (!state.isGameOver) return null;
        return {
            winner: 'Player1',
            score: state.score,
            difficulty: this.difficulty,
            playTimeMs: Date.now() - this.startTimeMs
        };
    }
}
