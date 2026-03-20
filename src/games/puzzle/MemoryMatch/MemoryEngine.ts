import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type MemoryCard = {
    id: number;
    symbol: string;
    isFlipped: boolean;
    isMatched: boolean;
};

export interface MemoryState {
    cards: MemoryCard[];
    flippedIndices: number[];
    matchedCount: number;
    movesCount: number;
    turn: 'P1' | 'P2'; // For Vs mode
    scores: { P1: number, P2: number };
    isGameOver: boolean;
    winner: 'P1' | 'P2' | 'Draw' | null;
    phase: 'waiting' | 'evaluating';
}

export type MemoryAction = 
  | { type: 'FLIP'; index: number }
  | { type: 'EVALUATE' }; // Triggered automatically by UI after delay

const EMOJIS = [
    '🍎', '🍌', '🍇', '🍉', '🍓', '🍒', '🍑', '🍍',
    '🥥', '🥝', '🍅', '🥑', '🍔', '🍕', '🌮', '🥗',
    '🍩', '🍦', '🍰', '🍫', '🍬', '🍭', '☕', '🍺',
    '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🏓'
];

export class MemoryEngine implements GameEngine<MemoryState, MemoryAction> {
    private startTimeMs: number = 0;
    private mode: '1P_SOLO' | '1P_VS_AI' | '2P_LOCAL';
    private size: number; // e.g. 16 for 4x4, 36 for 6x6, 64 for 8x8

    constructor(mode: '1P_SOLO' | '1P_VS_AI' | '2P_LOCAL', pairsCount: number = 8) {
        this.mode = mode;
        this.size = pairsCount * 2;
    }

    initialize(): MemoryState {
        this.startTimeMs = Date.now();
        
        const pairsCount = this.size / 2;
        const selectedEmojis = [...EMOJIS].sort(() => 0.5 - Math.random()).slice(0, pairsCount);
        
        const deck: string[] = [...selectedEmojis, ...selectedEmojis];
        
        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        const cards = deck.map((symbol, idx) => ({
            id: idx,
            symbol,
            isFlipped: false,
            isMatched: false
        }));

        return {
            cards,
            flippedIndices: [],
            matchedCount: 0,
            movesCount: 0,
            turn: 'P1',
            scores: { P1: 0, P2: 0 },
            isGameOver: false,
            winner: null,
            phase: 'waiting'
        };
    }

    update(state: MemoryState, action: MemoryAction): MemoryState {
        if (state.isGameOver) return state;

        const s = { ...state, cards: [...state.cards], scores: {...state.scores}, flippedIndices: [...state.flippedIndices] };

        if (action.type === 'FLIP' && s.phase === 'waiting') {
            const idx = action.index;
            if (s.cards[idx].isMatched || s.cards[idx].isFlipped) return state;
            
            if (s.flippedIndices.length < 2) {
                 s.cards[idx] = { ...s.cards[idx], isFlipped: true };
                 s.flippedIndices.push(idx);

                 if (s.flippedIndices.length === 2) {
                      s.movesCount++;
                      s.phase = 'evaluating';
                 }
            }
            return s;
        }

        if (action.type === 'EVALUATE' && s.phase === 'evaluating') {
            const [idx1, idx2] = s.flippedIndices;
            const c1 = s.cards[idx1];
            const c2 = s.cards[idx2];

            if (c1.symbol === c2.symbol) {
                 // Match!
                 s.cards[idx1] = { ...c1, isMatched: true };
                 s.cards[idx2] = { ...c2, isMatched: true };
                 s.matchedCount += 2;
                 
                 if (this.mode !== '1P_SOLO') {
                      s.scores[s.turn]++;
                 }

                 // Check Win
                 if (s.matchedCount === this.size) {
                      s.isGameOver = true;
                      if (this.mode !== '1P_SOLO') {
                           if (s.scores.P1 > s.scores.P2) s.winner = 'P1';
                           else if (s.scores.P2 > s.scores.P1) s.winner = 'P2';
                           else s.winner = 'Draw';
                      } else {
                           s.winner = 'P1';
                      }
                 } else {
                      // Player gets another turn on match (typically in Vs mode)
                 }
            } else {
                 // No match
                 s.cards[idx1] = { ...c1, isFlipped: false };
                 s.cards[idx2] = { ...c2, isFlipped: false };
                 if (this.mode !== '1P_SOLO') {
                     s.turn = s.turn === 'P1' ? 'P2' : 'P1';
                 }
            }

            s.flippedIndices = [];
            s.phase = 'waiting';
            return s;
        }

        return state;
    }

    evaluateWin(state: MemoryState): GameResult | null {
        if (!state.isGameOver) return null;
        
        let score = 0;
        if (this.mode === '1P_SOLO') {
             // Score based on moves count relative to size
             const idealMoves = this.size / 2;
             const excess = state.movesCount - idealMoves;
             score = Math.max(10, 1000 - excess * 20);
        } else {
             score = state.winner === 'P1' ? 1000 : 0;
        }

        const difficultyRank = this.size <= 16 ? 'Easy' : (this.size <= 36 ? 'Medium' : 'Hard');

        return {
            winner: state.winner === 'Draw' ? null : state.winner === 'P1' ? 'Player1' : (this.mode === '1P_VS_AI' ? 'AI' : 'Player2'),
            score,
            difficulty: difficultyRank as any,
            playTimeMs: Date.now() - this.startTimeMs
        };
    }

    // AI memory tracker (cheat slightly, or perfectly remember)
    public computeAIMove(state: MemoryState, memoryTracker: Record<string, number[]>): MemoryAction | null {
         if (state.phase !== 'waiting') return null;

         // Identify if the AI knows any pairs internally using external memory Tracker maintained by the UI hook
         for (const symbol in memoryTracker) {
              const indices = memoryTracker[symbol];
              if (indices.length >= 2) {
                   const idx1 = indices[0];
                   const idx2 = indices[1];
                   if (!state.cards[idx1].isMatched && !state.cards[idx2].isMatched) {
                        // We found a match in memory!
                        if (!state.flippedIndices.includes(idx1)) return { type: 'FLIP', index: idx1 };
                        if (!state.flippedIndices.includes(idx2)) return { type: 'FLIP', index: idx2 };
                   }
              }
         }

         // If one card is already flipped by AI, check if we know its pair
         if (state.flippedIndices.length === 1) {
              const flippedIdx = state.flippedIndices[0];
              const symbol = state.cards[flippedIdx].symbol;
              const knownIndices = memoryTracker[symbol] || [];
              const knownPairIdx = knownIndices.find(i => i !== flippedIdx);
              if (knownPairIdx !== undefined && !state.cards[knownPairIdx].isMatched) {
                  return { type: 'FLIP', index: knownPairIdx };
              }
         }

         // Otherwise, flip a random unflipped, unmatched card
         const available = state.cards.filter(c => !c.isFlipped && !c.isMatched).map(c => c.id);
         if (available.length > 0) {
              const randomIdx = available[Math.floor(Math.random() * available.length)];
              return { type: 'FLIP', index: randomIdx };
         }

         return null;
    }
}
