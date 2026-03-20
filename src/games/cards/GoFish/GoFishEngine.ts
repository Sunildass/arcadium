import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    suit: Suit;
    rank: Rank;
    value: number;
}

export interface GoFishState {
    playerHand: Card[];
    opponentHand: Card[];
    deck: Card[];
    playerBooks: Rank[];   // completed sets of 4
    opponentBooks: Rank[];
    isPlayerTurn: boolean;
    message: string;
    lastAsked: Rank | null;
    isGameOver: boolean;
    waitingForOpponent: boolean; // small delay flag for UX
}

export type GoFishAction =
  | { type: 'ASK'; rank: Rank }   // Player asks opponent for a rank
  | { type: 'OPPONENT_TURN' };    // Trigger AI opponent move

function buildShuffledDeck(): Card[] {
    const suits: Suit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const ranks: Rank[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const values = [2,3,4,5,6,7,8,9,10,11,12,13,14];
    const deck: Card[] = [];
    for (const suit of suits) {
        for (let i = 0; i < ranks.length; i++) {
            deck.push({ suit, rank: ranks[i], value: values[i] });
        }
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function checkAndRemoveBooks(hand: Card[]): { hand: Card[]; books: Rank[] } {
    const books: Rank[] = [];
    const rankCounts: Partial<Record<Rank, number>> = {};
    hand.forEach(c => { rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1; });
    const newHand = hand.filter(c => rankCounts[c.rank]! < 4);
    Object.entries(rankCounts).forEach(([r, count]) => {
        if (count === 4) books.push(r as Rank);
    });
    return { hand: newHand, books };
}

export class GoFishEngine implements GameEngine<GoFishState, GoFishAction> {
    private startTimeMs = 0;

    initialize(): GoFishState {
        this.startTimeMs = Date.now();
        const deck = buildShuffledDeck();
        const playerHand = deck.splice(0, 7);
        const opponentHand = deck.splice(0, 7);

        const playerResult = checkAndRemoveBooks(playerHand);
        const opponentResult = checkAndRemoveBooks(opponentHand);

        return {
            playerHand: playerResult.hand,
            opponentHand: opponentResult.hand,
            deck,
            playerBooks: playerResult.books,
            opponentBooks: opponentResult.books,
            isPlayerTurn: true,
            message: 'Pick a card rank from your hand to ask the opponent for.',
            lastAsked: null,
            isGameOver: false,
            waitingForOpponent: false
        };
    }

    update(state: GoFishState, action: GoFishAction): GoFishState {
        if (state.isGameOver) return state;

        const s: GoFishState = {
            ...state,
            playerHand: [...state.playerHand],
            opponentHand: [...state.opponentHand],
            deck: [...state.deck],
            playerBooks: [...state.playerBooks],
            opponentBooks: [...state.opponentBooks],
        };

        if (action.type === 'ASK' && s.isPlayerTurn) {
            const rank = action.rank;
            s.lastAsked = rank;
            const received = s.opponentHand.filter(c => c.rank === rank);

            if (received.length > 0) {
                s.opponentHand = s.opponentHand.filter(c => c.rank !== rank);
                s.playerHand.push(...received);
                
                const result = checkAndRemoveBooks(s.playerHand);
                s.playerHand = result.hand;
                s.playerBooks.push(...result.books);

                s.message = `Got it! Opponent gave you ${received.length} ${rank}(s). Go again!`;
                // Player gets another turn
            } else {
                // Go Fish
                const drawn = s.deck.shift();
                if (drawn) {
                    s.playerHand.push(drawn);
                    const result = checkAndRemoveBooks(s.playerHand);
                    s.playerHand = result.hand;
                    s.playerBooks.push(...result.books);
                    s.message = `Go Fish! Drew: ${drawn.rank} of ${drawn.suit}.`;
                } else {
                    s.message = `Go Fish! No cards left to draw.`;
                }
                s.isPlayerTurn = false;
                s.waitingForOpponent = true;
            }

            s.isGameOver = this.checkGameOver(s);
            return s;
        }

        // AI Opponent Turn
        if (action.type === 'OPPONENT_TURN' && !s.isPlayerTurn) {
            s.waitingForOpponent = false;
            
            if (s.opponentHand.length === 0) {
                const drawn = s.deck.shift();
                if (drawn) s.opponentHand.push(drawn);
                s.isPlayerTurn = true;
                s.message = 'Opponent had no cards, drew one. Your turn!';
                return s;
            }
            
            // AI asks for a random rank it holds
            const distinctRanks = [...new Set(s.opponentHand.map(c => c.rank))];
            const askRank = distinctRanks[Math.floor(Math.random() * distinctRanks.length)];

            const received = s.playerHand.filter(c => c.rank === askRank);
            if (received.length > 0) {
                s.playerHand = s.playerHand.filter(c => c.rank !== askRank);
                s.opponentHand.push(...received);
                const result = checkAndRemoveBooks(s.opponentHand);
                s.opponentHand = result.hand;
                s.opponentBooks.push(...result.books);
                s.message = `Opponent asked for "${askRank}" and got ${received.length} card(s) from you!`;
                // Opponent gets another turn - but we auto-do 1 extra turn max
                s.waitingForOpponent = true;
            } else {
                const drawn = s.deck.shift();
                if (drawn) s.opponentHand.push(drawn);
                const result = checkAndRemoveBooks(s.opponentHand);
                s.opponentHand = result.hand;
                s.opponentBooks.push(...result.books);
                s.message = `Opponent asked for "${askRank}" — Go Fish! Your turn.`;
                s.isPlayerTurn = true;
            }

            s.isGameOver = this.checkGameOver(s);
            return s;
        }

        return state;
    }

    private checkGameOver(s: GoFishState): boolean {
        const totalBooks = 13;
        if (s.playerBooks.length + s.opponentBooks.length >= totalBooks) return true;
        if (s.deck.length === 0 && s.playerHand.length === 0 && s.opponentHand.length === 0) return true;
        return false;
    }

    evaluateWin(state: GoFishState): GameResult | null {
        if (!state.isGameOver) return null;
        const playerWon = state.playerBooks.length >= state.opponentBooks.length;
        return {
            winner: playerWon ? 'Player1' : 'AI',
            score: state.playerBooks.length * 100,
            difficulty: 'Medium',
            playTimeMs: Date.now() - this.startTimeMs
        };
    }
}
