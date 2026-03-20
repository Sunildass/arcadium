import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type ShipType = 'Carrier' | 'Battleship' | 'Cruiser' | 'Submarine' | 'Destroyer';

export interface Ship {
    id: string;
    type: ShipType;
    size: number;
    hits: number;
    placed: boolean;
    positions: Position[];
}

export interface Position {
    r: number;
    c: number;
}

export type CellState = 'empty' | 'ship' | 'hit' | 'miss';

export interface PlayerBoard {
    playerId: 'Player1' | 'AI';
    grid: CellState[][];
    ships: Ship[];
}

export interface BattleshipState {
    phase: 'setup' | 'playing' | 'gameover';
    playerBoard: PlayerBoard;
    aiBoard: PlayerBoard;
    turn: 'Player1' | 'AI';
    winner: 'Player1' | 'AI' | null;
    isGameOver: boolean;
    // AI Tracking
    aiHunting: boolean;
    aiLastHit: Position | null;
    aiFirstHit: Position | null;
    aiAxis: 'horiz' | 'vert' | null;
    aiAxisDir: 1 | -1 | null;
    aiTriedOpposite: boolean;
}

const SHIP_DEFS: { type: ShipType; size: number }[] = [
    { type: 'Carrier', size: 5 },
    { type: 'Battleship', size: 4 },
    { type: 'Cruiser', size: 3 },
    { type: 'Submarine', size: 3 },
    { type: 'Destroyer', size: 2 },
];

export type BattleshipAction = 
    | { type: 'PLACE_SHIP'; shipId: string; pos: Position; vertical: boolean }
    | { type: 'AUTO_PLACE' }
    | { type: 'START_GAME' }
    | { type: 'FIRE'; pos: Position };

export class BattleshipEngine implements GameEngine<BattleshipState, BattleshipAction> {
    private startTimeMs: number = 0;
    private difficulty: number;

    constructor(difficulty: number = 5) {
        this.difficulty = difficulty;
    }

    initialize(): BattleshipState {
        this.startTimeMs = Date.now();
        return {
            phase: 'setup',
            playerBoard: this.createEmptyBoard('Player1'),
            aiBoard: this.createEmptyBoard('AI'),
            turn: 'Player1',
            winner: null,
            isGameOver: false,
            aiHunting: false,
            aiLastHit: null,
            aiFirstHit: null,
            aiAxis: null,
            aiAxisDir: null,
            aiTriedOpposite: false
        };
    }

    private createEmptyBoard(playerId: 'Player1' | 'AI'): PlayerBoard {
        return {
            playerId,
            grid: Array(10).fill(null).map(() => Array(10).fill('empty')),
            ships: SHIP_DEFS.map((def, i) => ({
                id: `${playerId}-${def.type}-${i}`,
                type: def.type,
                size: def.size,
                hits: 0,
                placed: false,
                positions: []
            }))
        };
    }

    private cloneState(state: BattleshipState): BattleshipState {
        return JSON.parse(JSON.stringify(state)); // Safe simple clone
    }

    private canPlaceShip(board: PlayerBoard, size: number, r: number, c: number, vertical: boolean): boolean {
        if (vertical) {
            if (r + size > 10) return false;
            for (let i = 0; i < size; i++) {
                if (board.grid[r + i][c] !== 'empty') return false;
            }
        } else {
            if (c + size > 10) return false;
            for (let i = 0; i < size; i++) {
                if (board.grid[r][c + i] !== 'empty') return false;
            }
        }
        return true;
    }

    private placeShipMutating(board: PlayerBoard, shipId: string, r: number, c: number, vertical: boolean) {
        const ship = board.ships.find(s => s.id === shipId)!;
        ship.placed = true;
        ship.positions = [];
        
        for (let i = 0; i < ship.size; i++) {
            const pr = vertical ? r + i : r;
            const pc = vertical ? c : c + i;
            board.grid[pr][pc] = 'ship';
            ship.positions.push({ r: pr, c: pc });
        }
    }

    public autoPlaceShips(board: PlayerBoard) {
        // Clear board first
        board.grid = Array(10).fill(null).map(() => Array(10).fill('empty'));
        board.ships.forEach(s => { s.placed = false; s.positions = []; s.hits = 0; });

        for (const ship of board.ships) {
            let placed = false;
            while (!placed) {
                const r = Math.floor(Math.random() * 10);
                const c = Math.floor(Math.random() * 10);
                const vertical = Math.random() > 0.5;

                if (this.canPlaceShip(board, ship.size, r, c, vertical)) {
                    this.placeShipMutating(board, ship.id, r, c, vertical);
                    placed = true;
                }
            }
        }
    }

    update(state: BattleshipState, action: BattleshipAction): BattleshipState {
        if (state.isGameOver) return state;

        const s = this.cloneState(state);

        if (action.type === 'PLACE_SHIP' && s.phase === 'setup') {
            const ship = s.playerBoard.ships.find(ship => ship.id === action.shipId);
            if (ship && !ship.placed && this.canPlaceShip(s.playerBoard, ship.size, action.pos.r, action.pos.c, action.vertical)) {
                this.placeShipMutating(s.playerBoard, action.shipId, action.pos.r, action.pos.c, action.vertical);
            }
        }

        if (action.type === 'AUTO_PLACE' && s.phase === 'setup') {
            this.autoPlaceShips(s.playerBoard);
        }

        if (action.type === 'START_GAME' && s.phase === 'setup') {
            if (s.playerBoard.ships.every(sh => sh.placed)) {
                this.autoPlaceShips(s.aiBoard);
                s.phase = 'playing';
            }
        }

        if (action.type === 'FIRE' && s.phase === 'playing') {
            const targetBoard = s.turn === 'Player1' ? s.aiBoard : s.playerBoard;
            const pos = action.pos;

            // Validate shot
            if (targetBoard.grid[pos.r][pos.c] === 'hit' || targetBoard.grid[pos.r][pos.c] === 'miss') {
                return state; // Invalid shot, same state
            }

            // Execute Shot
            let isHit = false;
            if (targetBoard.grid[pos.r][pos.c] === 'ship') {
                targetBoard.grid[pos.r][pos.c] = 'hit';
                isHit = true;
                
                // Track hits for ships
                for (const ship of targetBoard.ships) {
                    if (ship.positions.some(p => p.r === pos.r && p.c === pos.c)) {
                        ship.hits++;
                        break;
                    }
                }
            } else {
                targetBoard.grid[pos.r][pos.c] = 'miss';
            }

            // Update AI Tracking logic if AI fired
            if (s.turn === 'AI') {
                this.updateAITracking(s, pos, isHit);
            }

            // Check Win
            if (targetBoard.ships.every(sh => sh.hits === sh.size)) {
                s.isGameOver = true;
                s.winner = s.turn;
                s.phase = 'gameover';
            } else {
                // Next turn
                s.turn = s.turn === 'Player1' ? 'AI' : 'Player1';
            }
        }

        return s;
    }

    private updateAITracking(s: BattleshipState, shot: Position, isHit: boolean) {
        if (!s.aiHunting && isHit) {
            // Found a new target
            s.aiHunting = true;
            s.aiFirstHit = shot;
            s.aiLastHit = shot;
            s.aiAxis = null;
            s.aiAxisDir = null;
            s.aiTriedOpposite = false;
            return;
        }

        if (s.aiHunting) {
            if (isHit) {
                // Success on active hunt
                s.aiLastHit = shot;
                if (!s.aiAxis) {
                    // We deduce axis since we have two hits now
                    if (shot.r === s.aiFirstHit!.r) s.aiAxis = 'horiz';
                    else s.aiAxis = 'vert';
                    
                    // Determine dir
                    s.aiAxisDir = (s.aiAxis === 'horiz' ? shot.c - s.aiFirstHit!.c : shot.r - s.aiFirstHit!.r) > 0 ? 1 : -1;
                }
            } else {
                // Missed on a hunt
                if (!s.aiAxis) {
                    // Haven't established axis yet, next shot around first hit will try a different direction
                } else {
                    // We established an axis but hit water/end. Flip direction.
                    if (!s.aiTriedOpposite) {
                        s.aiAxisDir = (s.aiAxisDir === 1 ? -1 : 1) as 1 | -1;
                        s.aiTriedOpposite = true;
                        s.aiLastHit = s.aiFirstHit; // Start crawling from root again
                    } else {
                        // Tried both ways, ship is dead. Stop hunting.
                        // (Technically there are Edge Cases where ships are adjacent, 
                        // but a simple AI resets here).
                        const shipSunk = this.checkIfShipAtPosIsSunk(s.playerBoard, s.aiFirstHit!);
                        if (shipSunk) {
                            s.aiHunting = false;
                        } else {
                            // If adjacent ships masquerading, just flip dir again or resort to adjacent
                            s.aiAxis = null; 
                            s.aiLastHit = s.aiFirstHit;
                        }
                    }
                }
            }

            // Post-check if ship sunk
            if (isHit && this.checkIfShipAtPosIsSunk(s.playerBoard, shot)) {
                s.aiHunting = false;
            }
        }
    }

    private checkIfShipAtPosIsSunk(board: PlayerBoard, pos: Position): boolean {
        for (const ship of board.ships) {
            if (ship.positions.some(p => p.r === pos.r && p.c === pos.c)) {
                return ship.hits === ship.size;
            }
        }
        return false;
    }

    public getAIMove(state: BattleshipState): BattleshipAction {
        const board = state.playerBoard.grid;
        
        const isValidTarget = (r: number, c: number) => {
            return r >= 0 && r < 10 && c >= 0 && c < 10 && board[r][c] !== 'hit' && board[r][c] !== 'miss';
        };

        let target: Position | null = null;

        // Hunt Mode
        if (state.aiHunting && state.aiLastHit && state.aiFirstHit) {
             if (state.aiAxis && state.aiAxisDir) {
                 // March along axis
                 let tr = state.aiLastHit.r + (state.aiAxis === 'vert' ? state.aiAxisDir : 0);
                 let tc = state.aiLastHit.c + (state.aiAxis === 'horiz' ? state.aiAxisDir : 0);

                 if (isValidTarget(tr, tc)) {
                     target = { r: tr, c: tc };
                 } else {
                     // Hit edge or prior miss, flip dir if haven't, or reset
                     // Rather than mutating state here, we just pick the opposite side of the root
                     state.aiAxisDir = (state.aiAxisDir === 1 ? -1 : 1) as 1 | -1;
                     state.aiTriedOpposite = true;
                     tr = state.aiFirstHit.r + (state.aiAxis === 'vert' ? state.aiAxisDir : 0);
                     tc = state.aiFirstHit.c + (state.aiAxis === 'horiz' ? state.aiAxisDir : 0);
                     if (isValidTarget(tr, tc)) target = { r: tr, c: tc };
                 }
             } else {
                 // Try 4 adjs around first hit
                 const adjs = [
                     { r: state.aiFirstHit.r - 1, c: state.aiFirstHit.c },
                     { r: state.aiFirstHit.r + 1, c: state.aiFirstHit.c },
                     { r: state.aiFirstHit.r, c: state.aiFirstHit.c - 1 },
                     { r: state.aiFirstHit.r, c: state.aiFirstHit.c + 1 },
                 ];
                 for (const adj of adjs) {
                     if (isValidTarget(adj.r, adj.c)) {
                         target = adj;
                         break;
                     }
                 }
             }
        }

        // Random Fire if hunt failed or no target
        if (!target) {
            let tr, tc;
            // On harder difficulties, checkerboard pattern random fire
            do {
                tr = Math.floor(Math.random() * 10);
                tc = Math.floor(Math.random() * 10);
            } while (!isValidTarget(tr, tc) || (this.difficulty >= 6 && (tr + tc) % 2 === 1)); 
            target = { r: tr, c: tc };
        }

        return { type: 'FIRE', pos: target };
    }

    evaluateWin(state: BattleshipState): GameResult | null {
        if (!state.isGameOver) return null;
        return {
            winner: state.winner === 'Player1' ? 'Player1' : 'AI',
            score: state.winner === 'Player1' ? 1000 : 0,
            difficulty: 'Medium',
            playTimeMs: Date.now() - this.startTimeMs
        }
    }
}
