import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type PlayerColor = 'Red' | 'Green' | 'Yellow' | 'Blue';

export interface LudoPiece {
    id: string;
    color: PlayerColor;
    status: 'base' | 'active' | 'home';
    steps: number; // 0 to 56. 0 is entry position. 56 is home.
}

export interface LudoAction {
    type: 'ROLL' | 'MOVE';
    diceValue?: number; // Only for ROLL (if we inject value, else randomly gen)
    pieceId?: string; // Only for MOVE
}

export interface LudoState {
    players: { color: PlayerColor, pieces: LudoPiece[], isAI: boolean }[];
    turnIndex: number;
    phase: 'rolling' | 'moving';
    diceValue: number | null;
    isGameOver: boolean;
    winner: PlayerColor | null;
    consecutiveSixes: number; // Rule: 3 sixes = lost turn
    log: string[];
}

const TRACK_LENGTH = 52;
const HOME_PATH_LENGTH = 5;
const SAFE_ZONES = [0, 8, 13, 21, 26, 34, 39, 47];

const COLOR_OFFSETS: Record<PlayerColor, number> = {
    'Red': 0,
    'Green': 13,
    'Yellow': 26,
    'Blue': 39
};

export class LudoEngine implements GameEngine<LudoState, LudoAction> {
    private startTimeMs: number = 0;
    private numPlayers: number;
    private isAIArray: boolean[];

    constructor(numPlayers: number = 4, isAIArray: boolean[] = [false, true, true, true]) {
        this.numPlayers = numPlayers;
        this.isAIArray = isAIArray;
    }

    initialize(): LudoState {
        this.startTimeMs = Date.now();
        const colors: PlayerColor[] = ['Red', 'Green', 'Yellow', 'Blue'];
        const activeColors = colors.slice(0, this.numPlayers);
        
        const players = activeColors.map((color, i) => ({
            color,
            isAI: this.isAIArray[i],
            pieces: Array.from({ length: 4 }).map((_, j) => ({
                id: `${color}-${j}`,
                color,
                status: 'base' as const,
                steps: 0
            }))
        }));

        return {
            players,
            turnIndex: 0,
            phase: 'rolling',
            diceValue: null,
            isGameOver: false,
            winner: null,
            consecutiveSixes: 0,
            log: [`Game started. ${colors[0]}'s turn to roll.`]
        };
    }

    // Helper: gets the absolute track index (0-51) for a piece. Return null if in home path or base.
    public getAbsolutePosition(piece: LudoPiece): number | null {
        if (piece.status !== 'active' || piece.steps > 50) return null;
        return (COLOR_OFFSETS[piece.color] + piece.steps) % 52;
    }

    private getValidMoves(state: LudoState): LudoPiece[] {
        if (state.phase !== 'moving' || state.diceValue === null) return [];
        const activePlayer = state.players[state.turnIndex];
        const moves: LudoPiece[] = [];
        const dice = state.diceValue;

        for (const piece of activePlayer.pieces) {
            if (piece.status === 'home') continue;

            if (piece.status === 'base') {
                if (dice === 6) moves.push(piece);
            } else if (piece.status === 'active') {
                if (piece.steps + dice <= 56) {
                    moves.push(piece);
                }
            }
        }
        return moves;
    }

    update(state: LudoState, action: LudoAction): LudoState {
        if (state.isGameOver) return state;
        const s = { ...state, log: [...state.log] };
        const activePlayer = s.players[s.turnIndex];

        if (action.type === 'ROLL' && s.phase === 'rolling') {
            s.diceValue = action.diceValue || Math.floor(Math.random() * 6) + 1;
            s.log.push(`${activePlayer.color} rolled a ${s.diceValue}.`);
            
            if (s.diceValue === 6) {
                s.consecutiveSixes++;
                if (s.consecutiveSixes === 3) {
                    s.log.push(`${activePlayer.color} rolled three 6s! Turn forfeited.`);
                    this.nextTurn(s);
                    return s;
                }
            } else {
                s.consecutiveSixes = 0; // Reset
            }

            s.phase = 'moving';
            const valid = this.getValidMoves(s);
            if (valid.length === 0) {
                s.log.push(`No valid moves for ${activePlayer.color}.`);
                this.nextTurn(s);
            } else if (valid.length === 1 && activePlayer.isAI) {
                // Not actually auto-moving AI here, but maybe we could auto-move for humans if only 1 move
                // We leave it to the UI or AI hook
            }
            return s;
        }

        if (action.type === 'MOVE' && s.phase === 'moving' && action.pieceId) {
            const piece = activePlayer.pieces.find(p => p.id === action.pieceId);
            const validMoves = this.getValidMoves(s);
            if (!piece || !validMoves.find(p => p.id === piece.id)) {
                return state; // Invalid move
            }

            let earnedExtraTurn = false;

            if (piece.status === 'base') {
                piece.status = 'active';
                piece.steps = 0;
                s.log.push(`${activePlayer.color} piece entered the track.`);
            } else {
                piece.steps += s.diceValue!;
                if (piece.steps === 56) {
                    piece.status = 'home';
                    s.log.push(`${activePlayer.color} piece reached home!`);
                    earnedExtraTurn = true;
                } else {
                    // Check for captures
                    const absPos = this.getAbsolutePosition(piece);
                    if (absPos !== null && !SAFE_ZONES.includes(absPos)) {
                        for (const otherPlayer of s.players) {
                            if (otherPlayer.color === activePlayer.color) continue;
                            for (const otherPiece of otherPlayer.pieces) {
                                if (otherPiece.status === 'active' && this.getAbsolutePosition(otherPiece) === absPos) {
                                    // Capture!
                                    otherPiece.status = 'base';
                                    otherPiece.steps = 0;
                                    s.log.push(`${activePlayer.color} captured a ${otherPlayer.color} piece!`);
                                    earnedExtraTurn = true;
                                }
                            }
                        }
                    }
                }
            }

            // Check Win
            if (activePlayer.pieces.every(p => p.status === 'home')) {
                s.isGameOver = true;
                s.winner = activePlayer.color;
                s.log.push(`${activePlayer.color} wins!`);
                return s;
            }

            // Decide whose turn is next
            if (s.diceValue === 6 || earnedExtraTurn) {
                s.log.push(`${activePlayer.color} gets another turn.`);
                s.phase = 'rolling';
                s.diceValue = null;
            } else {
                this.nextTurn(s);
            }

            return s;
        }

        return state;
    }

    private nextTurn(s: LudoState) {
        s.turnIndex = (s.turnIndex + 1) % s.players.length;
        s.phase = 'rolling';
        s.diceValue = null;
        s.consecutiveSixes = 0;
    }

    evaluateWin(state: LudoState): GameResult | null {
        if (!state.isGameOver) return null;
        return {
            winner: state.winner === 'Red' ? 'Player1' : 'AI', // Assuming Red is P1
            score: state.winner === 'Red' ? 1000 : 0,
            difficulty: 'Medium',
            playTimeMs: Date.now() - this.startTimeMs
        };
    }

    public computeAIMove(state: LudoState): LudoAction | null {
         if (state.phase === 'rolling') {
             return { type: 'ROLL' };
         }
         
         const valid = this.getValidMoves(state);
         if (valid.length === 0) return null;

         // AI Heuristic:
         // 1. Prefer capturing
         // 2. Prefer moving out of base
         // 3. Prefer reaching home
         // 4. Prefer escaping unsafety if enemies nearby (too complex maybe, just pick furthest back piece for safety)

         let bestScore = -Infinity;
         let bestMove = valid[0];

         for (const piece of valid) {
             let score = 0;
             const dice = state.diceValue!;
             
             if (piece.status === 'base') {
                 score += 50; // Getting out is good
             } else {
                 const newSteps = piece.steps + dice;
                 if (newSteps === 56) score += 100; // Getting home is great
                 else if (newSteps < 51) {
                     // Check if capture
                     const futureAbs = (COLOR_OFFSETS[piece.color] + newSteps) % 52;
                     if (!SAFE_ZONES.includes(futureAbs)) {
                          for (const p of state.players) {
                              if (p.color !== piece.color) {
                                  for (const op of p.pieces) {
                                      if (this.getAbsolutePosition(op) === futureAbs) {
                                          score += 80; // Capture is great
                                      }
                                  }
                              }
                          }
                     } else {
                          score += 20; // Landing on safe zone is good
                     }
                 }

                 // Prefer moving pieces that are further back generally, or pieces that are close to home if safe
                 score += piece.steps * 0.1;
             }

             if (score > bestScore) {
                 bestScore = score;
                 bestMove = piece;
             }
         }

         return { type: 'MOVE', pieceId: bestMove.id };
    }
}
