import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type PlayerColor = 'White' | 'Black';

export interface BackgammonState {
    board: { color: PlayerColor | null, count: number }[]; // indices 1-24
    bar: { White: number, Black: number };
    borneOff: { White: number, Black: number };
    turn: PlayerColor;
    dice: number[]; // e.g [3, 4] or [5, 5, 5, 5] for doubles
    originalDice: number[]; // To know what was rolled initially
    isGameOver: boolean;
    winner: PlayerColor | null;
    phase: 'rolling' | 'moving';
    log: string[];
}

export type BackgammonAction = 
  | { type: 'ROLL' }
  | { type: 'MOVE'; from: number | 'bar'; to: number | 'off'; dieUsed: number };

export class BackgammonEngine implements GameEngine<BackgammonState, BackgammonAction> {
    private startTimeMs: number = 0;
    private mode: '1P' | '2P';

    constructor(mode: '1P' | '2P') {
        this.mode = mode;
    }

    initialize(): BackgammonState {
        this.startTimeMs = Date.now();
        const board = Array(25).fill(null).map(() => ({ color: null as PlayerColor | null, count: 0 }));

        // Standard Setup
        // White moves 1 -> 24.
        // Black moves 24 -> 1.
        
        board[1] = { color: 'White', count: 2 };
        board[12] = { color: 'White', count: 5 };
        board[17] = { color: 'White', count: 3 };
        board[19] = { color: 'White', count: 5 };

        board[24] = { color: 'Black', count: 2 };
        board[13] = { color: 'Black', count: 5 };
        board[8] = { color: 'Black', count: 3 };
        board[6] = { color: 'Black', count: 5 };

        return {
            board,
            bar: { White: 0, Black: 0 },
            borneOff: { White: 0, Black: 0 },
            turn: 'White',
            dice: [],
            originalDice: [],
            isGameOver: false,
            winner: null,
            phase: 'rolling',
            log: ['Game started. White rolls first.']
        };
    }

    public canBearOff(state: BackgammonState, color: PlayerColor): boolean {
        // Are there any checkers outside the home board?
        if (state.bar[color] > 0) return false;
        
        const homeRange = color === 'White' ? [19, 24] : [1, 6];
        for (let i = 1; i <= 24; i++) {
             if (i >= homeRange[0] && i <= homeRange[1]) continue;
             if (state.board[i].color === color && state.board[i].count > 0) return false;
        }
        return true;
    }

    // Helper: checks if a specific move is valid (ignoring if other moves must be prioritized)
    public isValidMove(state: BackgammonState, from: number | 'bar', to: number | 'off', die: number, color: PlayerColor): boolean {
        const dir = color === 'White' ? 1 : -1;
        const fromPos = from === 'bar' ? (color === 'White' ? 0 : 25) : from;

        // Check if from has pieces
        if (from === 'bar') {
             if (state.bar[color] === 0) return false;
        } else {
             if (state.bar[color] > 0) return false; // MUST move from bar first
             if (state.board[from].color !== color || state.board[from].count === 0) return false;
        }

        if (to === 'off') {
             if (!this.canBearOff(state, color)) return false;
             // Must be exactly die distance, OR die is larger than distance but no pieces are further back
             const dist = color === 'White' ? 25 - fromPos : fromPos; // distance to off
             if (die === dist) return true;
             if (die > dist) {
                 // Check if any pieces are further back
                 const startRange = color === 'White' ? 19 : 6;
                 const step = color === 'White' ? 1 : -1;
                 // E.g. White bears off from 23 using a 5. Dist is 2. 5 > 2.
                 // Only valid if no pieces on 19, 20, 21, 22.
                 
                 let maxDist = 0;
                 for (let i = startRange; i !== fromPos; i += step) {
                     if (state.board[i].color === color && state.board[i].count > 0) {
                         return false; 
                     }
                 }
                 return true;
             }
             return false;
        }

        // Standard move
        if (fromPos + (dir * die) !== to) return false;
        if (to < 1 || to > 24) return false;

        const target = state.board[to];
        if (target.color && target.color !== color && target.count >= 2) return false; // Blocked

        return true;
    }

    public getValidMovesForDie(state: BackgammonState, die: number): {from: number | 'bar', to: number | 'off'}[] {
        const moves: {from: number | 'bar', to: number | 'off'}[] = [];
        const color = state.turn;
        
        if (state.bar[color] > 0) {
            const to = color === 'White' ? die : 25 - die;
            if (this.isValidMove(state, 'bar', to, die, color)) {
                moves.push({ from: 'bar', to });
            }
            return moves; // MUST move from bar
        }

        for (let i = 1; i <= 24; i++) {
            if (state.board[i].color === color && state.board[i].count > 0) {
                 const to = color === 'White' ? i + die : i - die;
                 if (to > 24 || to < 1) {
                      if (this.isValidMove(state, i, 'off', die, color)) {
                          moves.push({ from: i, to: 'off' });
                      }
                 } else {
                      if (this.isValidMove(state, i, to, die, color)) {
                          moves.push({ from: i, to });
                      }
                 }
            }
        }
        return moves;
    }

    public getAllValidMovesCombinations(state: BackgammonState): any[] {
         // Full backtracking to ensure we play max dice. Too heavy for UI interactions on a casual engine.
         // We'll enforce simple per-dice logic.
         return [];
    }

    public hasValidMoves(state: BackgammonState): boolean {
         for (const d of Array.from(new Set(state.dice))) {
              if (this.getValidMovesForDie(state, d).length > 0) return true;
         }
         return false;
    }

    update(state: BackgammonState, action: BackgammonAction): BackgammonState {
        if (state.isGameOver) return state;
        const s = { ...state, board: state.board.map(c => ({...c})), bar: {...state.bar}, borneOff: {...state.borneOff}, dice: [...state.dice], originalDice: [...state.originalDice], log: [...state.log] };

        if (action.type === 'ROLL' && s.phase === 'rolling') {
            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;
            
            s.dice = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
            s.originalDice = [...s.dice]; // clone
            s.phase = 'moving';
            s.log.push(`${s.turn} rolled ${d1} and ${d2}.`);

            if (!this.hasValidMoves(s)) {
                 s.log.push(`No valid moves for ${s.turn}. Turn passes.`);
                 s.turn = s.turn === 'White' ? 'Black' : 'White';
                 s.phase = 'rolling';
                 s.dice = [];
            }
            return s;
        }

        if (action.type === 'MOVE' && s.phase === 'moving') {
            const { from, to, dieUsed } = action;

            // Validate the die exists in available dice
            const dieIdx = s.dice.indexOf(dieUsed);
            if (dieIdx === -1) return state; // Invalid die choice

            if (!this.isValidMove(s, from, to, dieUsed, s.turn)) return state;

            // Execute Move
            if (from === 'bar') {
                s.bar[s.turn]--;
            } else {
                s.board[from].count--;
                if (s.board[from].count === 0) s.board[from].color = null;
            }

            if (to === 'off') {
                s.borneOff[s.turn]++;
            } else {
                const target = s.board[to];
                if (target.color && target.color !== s.turn && target.count === 1) {
                    // Hit blot
                    target.count = 0;
                    target.color = null;
                    s.bar[s.turn === 'White' ? 'Black' : 'White']++;
                    s.log.push(`${s.turn} hit a blot!`);
                }
                target.color = s.turn;
                target.count++;
            }

            // Consume die
            s.dice.splice(dieIdx, 1);

            // Check Win
            if (s.borneOff[s.turn] === 15) {
                s.isGameOver = true;
                s.winner = s.turn;
                s.log.push(`${s.turn} has borne off all checkers and wins!`);
                return s;
            }

            // Check if turn passes
            if (s.dice.length === 0 || !this.hasValidMoves(s)) {
                if (s.dice.length > 0) s.log.push(`No further valid moves for ${s.turn}.`);
                s.turn = s.turn === 'White' ? 'Black' : 'White';
                s.phase = 'rolling';
                s.dice = [];
            }

            return s;
        }

        return state;
    }

    evaluateWin(state: BackgammonState): GameResult | null {
         if (!state.isGameOver) return null;
         return {
             winner: state.winner === 'White' ? 'Player1' : (this.mode === '1P' ? 'AI' : 'Player2'),
             score: 1000,
             difficulty: 'Medium',
             playTimeMs: Date.now() - this.startTimeMs
         };
    }

    public computeAIMove(state: BackgammonState): BackgammonAction | null {
        if (state.phase === 'rolling') return { type: 'ROLL' };

        // Simple Greedy AI: Find all valid moves for unique available dice, 
        // score them, and pick the highest.

        const uniqueDice = Array.from(new Set(state.dice));
        let bestAction: BackgammonAction | null = null;
        let bestScore = -Infinity;

        for (const d of uniqueDice) {
             const validMoves = this.getValidMovesForDie(state, d);
             for (const move of validMoves) {
                  let score = 0;
                  
                  // Score Hit
                  if (move.to !== 'off' && state.board[move.to].color && state.board[move.to].count === 1) {
                      score += 100; // Hit highly preferred
                  }

                  // Score Bear off
                  if (move.to === 'off') {
                      score += 80; 
                  }

                  // Prefer moving from bar
                  if (move.from === 'bar') {
                      score += 150;
                  }

                  // Prefer making a point (protecting a blot)
                  if (move.to !== 'off' && state.board[move.to].color === state.turn && state.board[move.to].count === 1) {
                      score += 50; 
                  }

                  // Prefer moving back checkers forward
                  if (move.from !== 'bar') {
                      score += state.turn === 'White' ? (25 - move.from) : (move.from);
                  }

                  if (score > bestScore) {
                      bestScore = score;
                      bestAction = { type: 'MOVE', from: move.from, to: move.to, dieUsed: d };
                  }
             }
        }

        return bestAction;
    }
}
