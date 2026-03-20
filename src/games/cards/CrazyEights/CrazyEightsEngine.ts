import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    suit: Suit;
    rank: Rank;
    value: number;  // 2-14
}

export interface CrazyEightsState {
    playerHand: Card[];
    opponentHand: Card[];
    deck: Card[];
    discardPile: Card[];
    currentSuit: Suit;    // The active suit (especially when 8 is played)
    isPlayerTurn: boolean;
    message: string;
    isGameOver: boolean;
    pendingWildSuit: boolean; // Player played an 8 and must choose a suit
    opponentThinking: boolean;
}

export type CrazyEightsAction =
  | { type: 'PLAY_CARD'; cardIndex: number }
  | { type: 'CHOOSE_SUIT'; suit: Suit }
  | { type: 'DRAW_CARD' }
  | { type: 'OPPONENT_TURN' };

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

function canPlay(card: Card, topCard: Card, currentSuit: Suit): boolean {
    if (card.rank === '8') return true; // 8 is always wild
    if (card.suit === currentSuit) return true;
    if (card.rank === topCard.rank) return true;
    return false;
}

export class CrazyEightsEngine implements GameEngine<CrazyEightsState, CrazyEightsAction> {
    private startTimeMs = 0;

    initialize(): CrazyEightsState {
        this.startTimeMs = Date.now();
        const deck = buildShuffledDeck();
        const playerHand = deck.splice(0, 7);
        const opponentHand = deck.splice(0, 7);
        let startCard = deck.shift()!;
        // Don't start on an 8
        while (startCard.rank === '8') {
            deck.push(startCard);
            startCard = deck.shift()!;
        }
        return {
            playerHand,
            opponentHand,
            deck,
            discardPile: [startCard],
            currentSuit: startCard.suit,
            isPlayerTurn: true,
            message: `Game starts! Top card: ${startCard.rank} of ${startCard.suit}. Match suit (${startCard.suit}) or rank.`,
            isGameOver: false,
            pendingWildSuit: false,
            opponentThinking: false
        };
    }

    update(state: CrazyEightsState, action: CrazyEightsAction): CrazyEightsState {
        if (state.isGameOver) return state;

        const s: CrazyEightsState = {
            ...state,
            playerHand: [...state.playerHand],
            opponentHand: [...state.opponentHand],
            deck: [...state.deck],
            discardPile: [...state.discardPile],
        };

        const topCard = s.discardPile[s.discardPile.length - 1];

        if (action.type === 'PLAY_CARD' && s.isPlayerTurn && !s.pendingWildSuit) {
            const card = s.playerHand[action.cardIndex];
            if (!card) return state;
            if (!canPlay(card, topCard, s.currentSuit)) {
                s.message = `❌ Can't play ${card.rank} of ${card.suit}! Must match suit (${s.currentSuit}) or rank (${topCard.rank}), or play an 8.`;
                return s;
            }
            s.playerHand.splice(action.cardIndex, 1);
            s.discardPile.push(card);
            if (card.rank === '8') {
                s.pendingWildSuit = true;
                s.message = '🪄 You played an 8! Choose a new suit.';
                return s;
            }
            s.currentSuit = card.suit;

            if (s.playerHand.length === 0) {
                s.isGameOver = true;
                s.message = '🎉 You played all your cards! You win!';
                return s;
            }
            s.isPlayerTurn = false;
            s.opponentThinking = true;
            s.message = `Played ${card.rank} of ${card.suit}. Opponent's turn...`;
            return s;
        }

        if (action.type === 'CHOOSE_SUIT' && s.pendingWildSuit) {
            s.currentSuit = action.suit;
            s.pendingWildSuit = false;
            if (s.playerHand.length === 0) {
                s.isGameOver = true;
                s.message = '🎉 You win!';
                return s;
            }
            s.isPlayerTurn = false;
            s.opponentThinking = true;
            s.message = `Changed suit to ${action.suit}. Opponent's turn...`;
            return s;
        }

        if (action.type === 'DRAW_CARD' && s.isPlayerTurn && !s.pendingWildSuit) {
            if (s.deck.length === 0) {
                // Reshuffle discard minus top
                const top = s.discardPile.pop()!;
                s.deck = [...s.discardPile].reverse();
                s.discardPile = [top];
            }
            const drawn = s.deck.shift();
            if (drawn) {
                s.playerHand.push(drawn);
                s.message = `Drew ${drawn.rank} of ${drawn.suit}.`;
                s.isPlayerTurn = false;
                s.opponentThinking = true;
            } else {
                s.message = 'No cards left to draw!';
            }
            return s;
        }

        if (action.type === 'OPPONENT_TURN' && !s.isPlayerTurn) {
            s.opponentThinking = false;
            const topCard2 = s.discardPile[s.discardPile.length - 1];
            const playable = s.opponentHand.findIndex(c => canPlay(c, topCard2, s.currentSuit));

            if (playable !== -1) {
                const card = s.opponentHand[playable];
                s.opponentHand.splice(playable, 1);
                s.discardPile.push(card);
                if (card.rank === '8') {
                    // AI picks a suit it has most of
                    const counts: Partial<Record<Suit, number>> = {};
                    s.opponentHand.forEach(c => { counts[c.suit] = (counts[c.suit] || 0) + 1; });
                    const chosen = (Object.entries(counts).sort(([,a],[,b]) => (b||0)-(a||0))[0]?.[0] as Suit) || 'Hearts';
                    s.currentSuit = chosen;
                    s.message = `Opponent played 8 and changed suit to ${chosen}!`;
                } else {
                    s.currentSuit = card.suit;
                    s.message = `Opponent played ${card.rank} of ${card.suit}.`;
                }

                if (s.opponentHand.length === 0) {
                    s.isGameOver = true;
                    s.message = '💀 Opponent played all cards! You lose.';
                    return s;
                }
            } else {
                // AI draws
                if (s.deck.length === 0) {
                    const top = s.discardPile.pop()!;
                    s.deck = [...s.discardPile].reverse();
                    s.discardPile = [top];
                }
                const drawn = s.deck.shift();
                if (drawn) {
                    s.opponentHand.push(drawn);
                    s.message = `Opponent drew a card. Your turn!`;
                }
            }
            s.isPlayerTurn = true;
            return s;
        }

        return state;
    }

    evaluateWin(state: CrazyEightsState): GameResult | null {
        if (!state.isGameOver) return null;
        const won = state.playerHand.length === 0;
        return {
            winner: won ? 'Player1' : 'AI',
            score: won ? state.opponentHand.reduce((a, c) => a + (c.rank === '8' ? 50 : Math.min(c.value, 10)), 0) : 0,
            difficulty: 'Medium',
            playTimeMs: Date.now() - this.startTimeMs
        };
    }
}
