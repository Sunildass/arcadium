import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    suit: Suit;
    rank: Rank;
    value: number;
}

export interface HighLowState {
    deck: Card[];
    currentCard: Card;
    nextCard: Card | null;
    score: number;
    streak: number;
    lives: number;
    guess: 'higher' | 'lower' | null;
    revealed: boolean;
    isGameOver: boolean;
    message: string;
}

export type HighLowAction =
  | { type: 'GUESS'; guess: 'higher' | 'lower' }
  | { type: 'NEXT' };

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

export class HighLowEngine implements GameEngine<HighLowState, HighLowAction> {
    private startTimeMs = 0;

    initialize(): HighLowState {
        this.startTimeMs = Date.now();
        const deck = buildShuffledDeck();
        return {
            deck: deck.slice(2),
            currentCard: deck[0],
            nextCard: null,
            score: 0,
            streak: 0,
            lives: 3,
            guess: null,
            revealed: false,
            isGameOver: false,
            message: 'Will the next card be higher or lower?'
        };
    }

    update(state: HighLowState, action: HighLowAction): HighLowState {
        if (state.isGameOver) return state;
        
        const s = { ...state, deck: [...state.deck] };

        if (action.type === 'GUESS') {
            if (s.revealed) return s;
            const next = s.deck.shift()!;
            s.nextCard = next;
            s.guess = action.guess;
            s.revealed = true;

            const actualHigher = next.value > s.currentCard.value;
            const actualLower = next.value < s.currentCard.value;
            const isTie = next.value === s.currentCard.value;

            let correct = false;
            if (action.guess === 'higher' && actualHigher) correct = true;
            if (action.guess === 'lower' && actualLower) correct = true;

            if (isTie) {
                s.message = `It's a tie (${next.rank})! Push — no points lost.`;
            } else if (correct) {
                s.streak++;
                const points = 10 * s.streak; // streak multiplier
                s.score += points;
                s.message = `✅ Correct! +${points}pts (${s.streak}x streak!)`;
            } else {
                s.streak = 0;
                s.lives--;
                s.message = `❌ Wrong! The next card was ${next.rank}.`;
                if (s.lives <= 0) {
                    s.isGameOver = true;
                    s.message = `Game Over! Final score: ${s.score}`;
                }
            }

            if (s.deck.length === 0 && !s.isGameOver) {
                s.isGameOver = true;
                s.message = `🏆 Deck complete! Final Score: ${s.score}`;
            }
        }

        if (action.type === 'NEXT') {
            if (!s.revealed || !s.nextCard) return s;
            s.currentCard = s.nextCard;
            s.nextCard = null;
            s.guess = null;
            s.revealed = false;
            if (!s.isGameOver) s.message = 'Will the next card be higher or lower?';
        }

        return s;
    }

    evaluateWin(state: HighLowState): GameResult | null {
        if (!state.isGameOver) return null;
        return {
            winner: 'Player1',
            score: state.score,
            difficulty: 'Medium',
            playTimeMs: Date.now() - this.startTimeMs
        };
    }
}
