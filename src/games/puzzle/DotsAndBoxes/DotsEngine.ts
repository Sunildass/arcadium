import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type PlayerLabel = 'P1' | 'P2';

// We specify lines. A grid of NxN boxes means (N+1)x(N+1) dots.
// Horizontal lines are Nx(N+1)
// Vertical lines are (N+1)xN
export interface DotsState {
    widthBoxes: number; // e.g. 5
    heightBoxes: number; // e.g. 5
    // Horizontal lines are indexed row * widthBoxes + col
    // A grid has heightBoxes + 1 rows of horizontal lines, each with widthBoxes lines.
    hLines: boolean[];
    
    // Vertical lines are indexed row * (widthBoxes + 1) + col
    // A grid has heightBoxes rows of vertical lines, each with widthBoxes + 1 lines.
    vLines: boolean[];

    // Boxes are indexed row * widthBoxes + col
    boxes: (PlayerLabel | null)[];
    
    turn: PlayerLabel;
    isGameOver: boolean;
    winner: PlayerLabel | 'Draw' | null;
    scores: { P1: number, P2: number };
}

export type DotsAction = { type: 'DRAW_HLINE' | 'DRAW_VLINE', index: number };

export class DotsEngine implements GameEngine<DotsState, DotsAction> {
    private startTimeMs: number = 0;
    private mode: '1P' | '2P';
    private width: number;
    private height: number;

    constructor(mode: '1P' | '2P', width: number = 5, height: number = 5) {
        this.mode = mode;
        this.width = width;
        this.height = height;
    }

    initialize(): DotsState {
        this.startTimeMs = Date.now();
        // 5x5 boxes 
        // Horizontal lines: 6 rows of 5 = 30
        // Vertical lines: 5 rows of 6 = 30
        const hLines = Array((this.height + 1) * this.width).fill(false);
        const vLines = Array(this.height * (this.width + 1)).fill(false);
        const boxes = Array(this.width * this.height).fill(null);

        return {
            widthBoxes: this.width,
            heightBoxes: this.height,
            hLines,
            vLines,
            boxes,
            turn: 'P1',
            isGameOver: false,
            winner: null,
            scores: { P1: 0, P2: 0 }
        };
    }

    private checkBoxes(state: DotsState, action: DotsAction): { state: DotsState, boxesCompleted: number } {
        const s = { ...state, boxes: [...state.boxes], scores: {...state.scores} };
        let completed = 0;
        
        const { widthBoxes, heightBoxes } = s;

        if (action.type === 'DRAW_HLINE') {
            const row = Math.floor(action.index / widthBoxes);
            const col = action.index % widthBoxes;

            // Check box above
            if (row > 0) {
                const bIdx = (row - 1) * widthBoxes + col;
                if (!s.boxes[bIdx] && 
                    state.hLines[(row - 1) * widthBoxes + col] && 
                    state.vLines[(row - 1) * (widthBoxes + 1) + col] && 
                    state.vLines[(row - 1) * (widthBoxes + 1) + col + 1] &&
                    s.hLines[action.index] // The one just drawn
                ) {
                    s.boxes[bIdx] = s.turn;
                    s.scores[s.turn]++;
                    completed++;
                }
            }

            // Check box below
            if (row < heightBoxes) {
                const bIdx = row * widthBoxes + col;
                if (!s.boxes[bIdx] &&
                    state.hLines[(row + 1) * widthBoxes + col] && 
                    state.vLines[row * (widthBoxes + 1) + col] && 
                    state.vLines[row * (widthBoxes + 1) + col + 1] &&
                    s.hLines[action.index]
                ) {
                    s.boxes[bIdx] = s.turn;
                    s.scores[s.turn]++;
                    completed++;
                }
            }
        } 
        else if (action.type === 'DRAW_VLINE') {
            const row = Math.floor(action.index / (widthBoxes + 1));
            const col = action.index % (widthBoxes + 1);

            // Check box to the left
            if (col > 0) {
                const bIdx = row * widthBoxes + (col - 1);
                if (!s.boxes[bIdx] &&
                    state.vLines[row * (widthBoxes + 1) + (col - 1)] &&
                    state.hLines[row * widthBoxes + (col - 1)] &&
                    state.hLines[(row + 1) * widthBoxes + (col - 1)] &&
                    s.vLines[action.index]
                ) {
                    s.boxes[bIdx] = s.turn;
                    s.scores[s.turn]++;
                    completed++;
                }
            }

            // Check box to the right
            if (col < widthBoxes) {
                const bIdx = row * widthBoxes + col;
                if (!s.boxes[bIdx] &&
                    state.vLines[row * (widthBoxes + 1) + col + 1] &&
                    state.hLines[row * widthBoxes + col] &&
                    state.hLines[(row + 1) * widthBoxes + col] &&
                    s.vLines[action.index]
                ) {
                    s.boxes[bIdx] = s.turn;
                    s.scores[s.turn]++;
                    completed++;
                }
            }
        }

        return { state: s, boxesCompleted: completed };
    }

    update(state: DotsState, action: DotsAction): DotsState {
        if (state.isGameOver) return state;

        const s = { ...state, hLines: [...state.hLines], vLines: [...state.vLines] };

        if (action.type === 'DRAW_HLINE') {
            if (s.hLines[action.index]) return state; // Already drawn
            s.hLines[action.index] = true;
        } else {
            if (s.vLines[action.index]) return state;
            s.vLines[action.index] = true;
        }

        const { state: newState, boxesCompleted } = this.checkBoxes(s, action);
        
        let turn = newState.turn;
        if (boxesCompleted === 0) {
            turn = turn === 'P1' ? 'P2' : 'P1';
        }

        newState.turn = turn;

        // Check Win
        if (!newState.boxes.includes(null)) {
            newState.isGameOver = true;
            if (newState.scores.P1 > newState.scores.P2) newState.winner = 'P1';
            else if (newState.scores.P2 > newState.scores.P1) newState.winner = 'P2';
            else newState.winner = 'Draw';
        }

        return newState;
    }

    evaluateWin(state: DotsState): GameResult | null {
         if (!state.isGameOver) return null;
         return {
             winner: state.winner === 'Draw' ? null : state.winner === 'P1' ? 'Player1' : (this.mode === '1P' ? 'AI' : 'Player2'),
             score: state.scores.P1 * 10,
             difficulty: 'Easy', // Constant for now
             playTimeMs: Date.now() - this.startTimeMs
         };
    }

    public computeAIMove(state: DotsState): DotsAction | null {
        // AI Logic:
        // 1. Can we immediately close a box? Do it.
        // 2. Will a move leave a box with 3 lines? Avoid it at all costs.
        // 3. Just pick a safe line.
        // 4. If all lines give away a box, pick randomly (sacrifice).

        // For simplicity, we define a helper to count lines on a box.
        const boxLinesCount = (s: DotsState, r: number, c: number) => {
             let ct = 0;
             if (s.hLines[r * s.widthBoxes + c]) ct++; // top
             if (s.hLines[(r+1) * s.widthBoxes + c]) ct++; // bottom
             if (s.vLines[r * (s.widthBoxes + 1) + c]) ct++; // left
             if (s.vLines[r * (s.widthBoxes + 1) + c + 1]) ct++; // right
             return ct;
        };

        const getBoxNeighborsOfHLine = (r: number, c: number) => {
             const n = [];
             if (r > 0) n.push([r-1, c]);
             if (r < state.heightBoxes) n.push([r, c]);
             return n;
        };

        const getBoxNeighborsOfVLine = (r: number, c: number) => {
             const n = [];
             if (c > 0) n.push([r, c-1]);
             if (c < state.widthBoxes) n.push([r, c]);
             return n;
        };

        const closableMoves: DotsAction[] = [];
        const safeMoves: DotsAction[] = [];
        const allMoves: DotsAction[] = [];

        // Check all H lines
        for (let r = 0; r <= state.heightBoxes; r++) {
            for (let c = 0; c < state.widthBoxes; c++) {
                const idx = r * state.widthBoxes + c;
                if (!state.hLines[idx]) {
                    const act: DotsAction = { type: 'DRAW_HLINE', index: idx };
                    allMoves.push(act);
                    
                    const neighbors = getBoxNeighborsOfHLine(r, c);
                    let cl = false;
                    let unsafe = false;
                    for (const [nr, nc] of neighbors) {
                        const ct = boxLinesCount(state, nr, nc);
                        if (ct === 3) cl = true;
                        if (ct === 2) unsafe = true; 
                        // If it has 2 lines, pushing this line makes it 3, giving it to opponent.
                    }
                    if (cl) closableMoves.push(act);
                    else if (!unsafe) safeMoves.push(act);
                }
            }
        }

        // Check all V lines
        for (let r = 0; r < state.heightBoxes; r++) {
            for (let c = 0; c <= state.widthBoxes; c++) {
                const idx = r * (state.widthBoxes + 1) + c;
                if (!state.vLines[idx]) {
                    const act: DotsAction = { type: 'DRAW_VLINE', index: idx };
                    allMoves.push(act);
                    
                    const neighbors = getBoxNeighborsOfVLine(r, c);
                    let cl = false;
                    let unsafe = false;
                    for (const [nr, nc] of neighbors) {
                        const ct = boxLinesCount(state, nr, nc);
                        if (ct === 3) cl = true;
                        if (ct === 2) unsafe = true;
                    }
                    if (cl) closableMoves.push(act);
                    else if (!unsafe) safeMoves.push(act);
                }
            }
        }

        if (closableMoves.length > 0) return closableMoves[Math.floor(Math.random() * closableMoves.length)];
        if (safeMoves.length > 0) return safeMoves[Math.floor(Math.random() * safeMoves.length)];
        if (allMoves.length > 0) return allMoves[Math.floor(Math.random() * allMoves.length)];

        return null;
    }
}
