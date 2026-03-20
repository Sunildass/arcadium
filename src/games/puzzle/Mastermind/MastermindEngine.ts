import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type PegColor = 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Orange' | 'Purple' | 'Pink' | 'Cyan';

export interface GuessResult {
    guess: PegColor[];
    exactHits: number;   // Black pegs (correct color and position)
    colorHits: number;   // White pegs (correct color, wrong position)
}

export interface MastermindState {
    secretCode: PegColor[];
    guesses: GuessResult[];
    currentGuess: (PegColor | null)[];
    currentRow: number;
    maxRows: number;
    isGameOver: boolean;
    hasWon: boolean;
    availableColors: PegColor[];
}

export type MastermindAction = 
  | { type: 'PLACE_PEG'; colIndex: number; color: PegColor }
  | { type: 'REMOVE_PEG'; colIndex: number }
  | { type: 'SUBMIT_GUESS' };

export class MastermindEngine implements GameEngine<MastermindState, MastermindAction> {
    private startTimeMs: number = 0;
    private difficulty: 'Easy' | 'Medium' | 'Hard';

    constructor(difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium') {
        this.difficulty = difficulty;
    }

    initialize(): MastermindState {
        this.startTimeMs = Date.now();
        
        // Difficulty tweaking
        // Easy: 4 pegs, 6 colors, 10 guesses, no duplicates
        // Medium: 4 pegs, 8 colors, 10 guesses, duplicates allowed
        // Hard: 5 pegs, 8 colors, 12 guesses, duplicates allowed

        const pegCount = this.difficulty === 'Hard' ? 5 : 4;
        const maxRows = this.difficulty === 'Hard' ? 12 : 10;
        
        const allColors: PegColor[] = ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Cyan'];
        const availableColors = this.difficulty === 'Easy' ? allColors.slice(0, 6) : allColors;

        const secretCode: PegColor[] = [];
        const pool = [...availableColors];
        
        for (let i = 0; i < pegCount; i++) {
             if (this.difficulty === 'Easy') {
                  const idx = Math.floor(Math.random() * pool.length);
                  secretCode.push(pool[idx]);
                  pool.splice(idx, 1); // No duplicates
             } else {
                  secretCode.push(availableColors[Math.floor(Math.random() * availableColors.length)]);
             }
        }

        return {
            secretCode,
            guesses: [],
            currentGuess: Array(pegCount).fill(null),
            currentRow: 0,
            maxRows,
            isGameOver: false,
            hasWon: false,
            availableColors
        };
    }

    private evaluateGuess(guess: PegColor[], secret: PegColor[]): { exactHits: number, colorHits: number } {
        let exactHits = 0;
        let colorHits = 0;
        
        const secretMocks = [...secret];
        const guessMocks = [...guess];

        // 1. Pass for exact hits
        for (let i = 0; i < secret.length; i++) {
             if (guess[i] === secret[i]) {
                  exactHits++;
                  secretMocks[i] = null as any; // consume
                  guessMocks[i] = null as any;
             }
        }

        // 2. Pass for color hits
        for (let i = 0; i < guess.length; i++) {
             if (guessMocks[i] === null) continue;
             
             const matchIdx = secretMocks.indexOf(guessMocks[i]);
             if (matchIdx !== -1) {
                  colorHits++;
                  secretMocks[matchIdx] = null as any; // consume
             }
        }

        return { exactHits, colorHits };
    }

    update(state: MastermindState, action: MastermindAction): MastermindState {
        if (state.isGameOver) return state;

        const s = { ...state, currentGuess: [...state.currentGuess], guesses: [...state.guesses] };

        if (action.type === 'PLACE_PEG') {
             s.currentGuess[action.colIndex] = action.color;
             return s;
        }

        if (action.type === 'REMOVE_PEG') {
             s.currentGuess[action.colIndex] = null;
             return s;
        }

        if (action.type === 'SUBMIT_GUESS') {
             // Validate full
             if (s.currentGuess.includes(null)) return state;

             const fullGuess = s.currentGuess as PegColor[];
             const { exactHits, colorHits } = this.evaluateGuess(fullGuess, s.secretCode);

             s.guesses.push({
                  guess: fullGuess,
                  exactHits,
                  colorHits
             });

             s.currentRow++;
             s.currentGuess = Array(s.secretCode.length).fill(null);

             // Check Win
             if (exactHits === s.secretCode.length) {
                  s.isGameOver = true;
                  s.hasWon = true;
             } else if (s.currentRow >= s.maxRows) {
                  s.isGameOver = true;
                  s.hasWon = false;
             }

             return s;
        }

        return state;
    }

    evaluateWin(state: MastermindState): GameResult | null {
        if (!state.isGameOver) return null;

        const baseScore = state.hasWon ? 1000 : 0;
        const rowBonus = state.hasWon ? (state.maxRows - state.guesses.length) * 100 : 0;

        return {
            winner: state.hasWon ? 'Player1' : null,
            score: baseScore + rowBonus,
            difficulty: this.difficulty,
            playTimeMs: Date.now() - this.startTimeMs
        };
    }
}
