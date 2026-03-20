import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    suit: Suit;
    rank: Rank;
    value: number; // 2-14 (Ace=14)
}

export interface WarState {
    playerDeck: Card[];
    opponentDeck: Card[];
    playerBattleCards: Card[];  // Cards on the table from player side
    opponentBattleCards: Card[]; // Cards on table from opponent side
    message: string;
    result: 'playing' | 'war' | 'player_wins' | 'opponent_wins';
    isGameOver: boolean;
    roundsPlayed: number;
}

export type WarAction = 
  | { type: 'FLIP' }    // Both flip top cards
  | { type: 'NEXT' };   // Continue after reading result

function buildDeck(): Card[] {
    const suits: Suit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const ranks: Rank[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const values = [2,3,4,5,6,7,8,9,10,11,12,13,14];
    const deck: Card[] = [];
    for (const suit of suits) {
        for (let i = 0; i < ranks.length; i++) {
            deck.push({ suit, rank: ranks[i], value: values[i] });
        }
    }
    return deck;
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export class WarEngine implements GameEngine<WarState, WarAction> {
    private startTimeMs = 0;

    initialize(): WarState {
        this.startTimeMs = Date.now();
        const deck = shuffle(buildDeck());
        const half = Math.ceil(deck.length / 2);
        return {
            playerDeck: deck.slice(0, half),
            opponentDeck: deck.slice(half),
            playerBattleCards: [],
            opponentBattleCards: [],
            message: 'Press FLIP to battle! Each player reveals their top card.',
            result: 'playing',
            isGameOver: false,
            roundsPlayed: 0
        };
    }

    update(state: WarState, action: WarAction): WarState {
        if (state.isGameOver) return state;

        const s: WarState = {
            ...state,
            playerDeck: [...state.playerDeck],
            opponentDeck: [...state.opponentDeck],
            playerBattleCards: [...state.playerBattleCards],
            opponentBattleCards: [...state.opponentBattleCards],
        };

        if (action.type === 'FLIP') {
            // Both players flip top card
            const pCard = s.playerDeck.shift();
            const oCard = s.opponentDeck.shift();

            if (!pCard || !oCard) {
                s.isGameOver = true;
                s.result = s.playerDeck.length > 0 ? 'player_wins' : 'opponent_wins';
                s.message = s.result === 'player_wins' ? '🎉 You win the war!' : '💀 Opponent wins the war!';
                return s;
            }

            s.playerBattleCards.push(pCard);
            s.opponentBattleCards.push(oCard);
            s.roundsPlayed++;

            if (pCard.value > oCard.value) {
                // Player wins the round
                const won = [...s.playerBattleCards, ...s.opponentBattleCards];
                s.playerDeck.push(...shuffle(won));
                s.playerBattleCards = [];
                s.opponentBattleCards = [];
                s.result = 'playing';
                s.message = `You win! ${pCard.rank} beats ${oCard.rank}. You have ${s.playerDeck.length} cards.`;
            } else if (oCard.value > pCard.value) {
                // Opponent wins
                const won = [...s.playerBattleCards, ...s.opponentBattleCards];
                s.opponentDeck.push(...shuffle(won));
                s.playerBattleCards = [];
                s.opponentBattleCards = [];
                s.result = 'playing';
                s.message = `Opponent wins! ${oCard.rank} beats ${pCard.rank}. You have ${s.playerDeck.length} cards.`;
            } else {
                // WAR!
                s.result = 'war';
                s.message = `⚔️ WAR! Both played ${pCard.rank}! Each player adds 3 face-down cards, then flip again!`;
                // Auto-add 3 face-down war cards from each player
                for (let i = 0; i < 3; i++) {
                    const p3 = s.playerDeck.shift();
                    const o3 = s.opponentDeck.shift();
                    if (p3) s.playerBattleCards.push(p3);
                    if (o3) s.opponentBattleCards.push(o3);
                }
            }

            // Check end of deck
            if (s.playerDeck.length === 0 && s.playerBattleCards.length === 0) {
                s.isGameOver = true;
                s.result = 'opponent_wins';
                s.message = '💀 You ran out of cards. Opponent wins!';
            } else if (s.opponentDeck.length === 0 && s.opponentBattleCards.length === 0) {
                s.isGameOver = true;
                s.result = 'player_wins';
                s.message = '🏆 Opponent ran out of cards. You win!';
            }

            return s;
        }

        return state;
    }

    evaluateWin(state: WarState): GameResult | null {
        if (!state.isGameOver) return null;
        return {
            winner: state.result === 'player_wins' ? 'Player1' : 'AI',
            score: state.result === 'player_wins' ? state.roundsPlayed * 10 : 0,
            difficulty: 'Medium',
            playTimeMs: Date.now() - this.startTimeMs
        };
    }
}
