import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type UnoColor = 'Red' | 'Yellow' | 'Green' | 'Blue' | 'Wild';
export type UnoValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'Skip' | 'Reverse' | 'DrawTwo' | 'Wild' | 'WildDrawFour';

export interface UnoCard {
    id: string;
    color: UnoColor;
    value: UnoValue;
}

export interface UnoPlayer {
    id: string; // 'Player1' or 'AI-1', 'AI-2', etc.
    name: string;
    hand: UnoCard[];
    isAI: boolean;
}

export interface UnoState {
    deck: UnoCard[];
    discardPile: UnoCard[];
    players: UnoPlayer[];
    turnIndex: number;
    direction: 1 | -1;
    activeColor: UnoColor;
    isGameOver: boolean;
    winner: string | null;
    drawPending: number; // For cascading draw twos / draw fours
    awaitingColorChoice: boolean; // True when a player played a wild and needs to pick a color
}

export type UnoAction = 
    | { type: 'PLAY_CARD'; cardId: string; chosenColor?: UnoColor }
    | { type: 'DRAW_CARD' }
    | { type: 'CHOOSE_COLOR'; color: UnoColor };

export class UnoEngine implements GameEngine<UnoState, UnoAction> {
    private startTimeMs: number = 0;
    private aiCount: number;

    constructor(aiCount: number = 3) {
        this.aiCount = aiCount;
    }

    initialize(): UnoState {
        this.startTimeMs = Date.now();
        let deck = this.generateDeck();
        deck = this.shuffle(deck);

        const players: UnoPlayer[] = [
            { id: 'P1', name: 'You', hand: [], isAI: false }
        ];

        for (let i = 0; i < this.aiCount; i++) {
            players.push({ id: `AI-${i + 1}`, name: `Bot ${i + 1}`, hand: [], isAI: true });
        }

        // Deal 7 cards each
        for (let i = 0; i < 7; i++) {
            for (const p of players) {
                p.hand.push(deck.pop()!);
            }
        }

        // First discard
        let firstCard = deck.pop()!;
        while (firstCard.color === 'Wild') {
            deck.unshift(firstCard);
            firstCard = deck.pop()!;
        }

        const discardPile = [firstCard];
        
        const state: UnoState = {
            deck,
            discardPile,
            players,
            turnIndex: 0,
            direction: 1,
            activeColor: firstCard.color,
            isGameOver: false,
            winner: null,
            drawPending: 0,
            awaitingColorChoice: false
        };

        // If first card is action
        if (firstCard.value === 'Reverse') {
            state.direction = -1;
            state.turnIndex = (players.length - 1) % players.length; // Player before P1
        } else if (firstCard.value === 'Skip') {
            state.turnIndex = 1;
        } else if (firstCard.value === 'DrawTwo') {
            state.drawPending = 2; // Next player must draw 2
        }

        return state;
    }

    private generateDeck(): UnoCard[] {
        const deck: UnoCard[] = [];
        let id = 0;
        const colors: UnoColor[] = ['Red', 'Yellow', 'Green', 'Blue'];
        
        for (const color of colors) {
            deck.push({ id: `c-${id++}`, color, value: '0' });
            for (const val of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Skip', 'Reverse', 'DrawTwo'] as UnoValue[]) {
                deck.push({ id: `c-${id++}`, color, value: val });
                deck.push({ id: `c-${id++}`, color, value: val });
            }
        }

        for (let i = 0; i < 4; i++) {
            deck.push({ id: `c-${id++}`, color: 'Wild', value: 'Wild' });
            deck.push({ id: `c-${id++}`, color: 'Wild', value: 'WildDrawFour' });
        }

        return deck;
    }

    private shuffle(deck: UnoCard[]): UnoCard[] {
        const arr = [...deck];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    public canPlayCard(card: UnoCard, state: UnoState): boolean {
        if (state.awaitingColorChoice) return false;
        
        if (card.color === 'Wild') {
            // Standard rule: Can play wild anytime (Draw 4 technically restricted but we simplify here)
            return true;
        }

        const topCard = state.discardPile[state.discardPile.length - 1];
        
        if (state.drawPending > 0) {
            // Stack draw rules simplify to: if pending, you cannot play unless it's another draw to stack.
            // Simplified rule: if pending, you must draw. (Strict Uno rules). 
            return false;
        }

        return card.color === state.activeColor || card.value === topCard.value;
    }

    private drawCards(state: UnoState, playerIndex: number, count: number) {
        const player = state.players[playerIndex];
        for (let i = 0; i < count; i++) {
            if (state.deck.length === 0) {
                // Reshuffle discard
                const top = state.discardPile.pop()!;
                state.deck = this.shuffle(state.discardPile);
                state.discardPile = [top];
            }
            if (state.deck.length > 0) {
                player.hand.push(state.deck.pop()!);
            }
        }
    }

    private nextTurn(state: UnoState) {
        state.turnIndex = (state.turnIndex + state.direction + state.players.length) % state.players.length;
    }

    update(state: UnoState, action: UnoAction): UnoState {
        if (state.isGameOver) return state;

        // Clone completely
        const s: UnoState = JSON.parse(JSON.stringify(state)); // Safe simple deep clone for basic types
        const currentPlayer = s.players[s.turnIndex];

        if (action.type === 'CHOOSE_COLOR') {
            if (!s.awaitingColorChoice) return state;
            s.activeColor = action.color;
            s.awaitingColorChoice = false;
            this.nextTurn(s);
            return s;
        }

        if (action.type === 'DRAW_CARD') {
            if (s.awaitingColorChoice) return state; // Invalid
            
            if (s.drawPending > 0) {
                this.drawCards(s, s.turnIndex, s.drawPending);
                s.drawPending = 0;
                this.nextTurn(s);
            } else {
                this.drawCards(s, s.turnIndex, 1);
                // Standard Uno: if drawn card is playable, can play immediately. We skip this for UI simplicity -> next turn.
                this.nextTurn(s);
            }
            return s;
        }

        if (action.type === 'PLAY_CARD') {
            if (s.awaitingColorChoice || s.drawPending > 0) return state;

            const cardIndex = currentPlayer.hand.findIndex(c => c.id === action.cardId);
            if (cardIndex === -1) return state;

            const card = currentPlayer.hand[cardIndex];
            if (!this.canPlayCard(card, s)) return state;

            // Execute play
            currentPlayer.hand.splice(cardIndex, 1);
            s.discardPile.push(card);
            s.activeColor = card.color !== 'Wild' ? card.color : s.activeColor;

            // Check Win
            if (currentPlayer.hand.length === 0) {
                s.isGameOver = true;
                s.winner = currentPlayer.id;
                return s;
            }

            // Handle Action Cards
            if (card.color === 'Wild') {
                if (action.chosenColor) {
                    s.activeColor = action.chosenColor;
                    if (card.value === 'WildDrawFour') {
                        s.drawPending = 4;
                    }
                    this.nextTurn(s);
                } else if (!currentPlayer.isAI) {
                    s.awaitingColorChoice = true;
                    if (card.value === 'WildDrawFour') {
                        s.drawPending = 4;
                    }
                } else {
                    // AI auto color select (will be overridden by AI engine wrapper if needed, but handled safely here)
                    s.activeColor = ['Red', 'Yellow', 'Green', 'Blue'][Math.floor(Math.random() * 4)] as UnoColor;
                    if (card.value === 'WildDrawFour') {
                        s.drawPending = 4;
                    }
                    this.nextTurn(s);
                }
            } else {
                if (card.value === 'Reverse') {
                    s.direction = (s.direction * -1) as 1 | -1;
                    if (s.players.length === 2) {
                        this.nextTurn(s); // Acts like skip in 2P
                    }
                } else if (card.value === 'Skip') {
                    this.nextTurn(s);
                } else if (card.value === 'DrawTwo') {
                    s.drawPending = 2;
                }
                
                this.nextTurn(s);
            }
        }

        return s;
    }

    evaluateWin(state: UnoState): GameResult | null {
        if (!state.isGameOver) return null;
        return {
            winner: state.winner === 'P1' ? 'Player1' : 'AI', // Simple map
            score: state.winner === 'P1' ? 500 : 0, // In standard Uno, score is sum of opponents hands, simplified
            difficulty: 'Medium',
            playTimeMs: Date.now() - this.startTimeMs
        };
    }

    public getAIBestMove(state: UnoState): UnoAction {
        const s = state;
        const ai = s.players[s.turnIndex];

        if (s.awaitingColorChoice) {
            // Pick color most common in hand
            const counts = { Red: 0, Blue: 0, Green: 0, Yellow: 0 };
            for (const c of ai.hand) {
                if (c.color !== 'Wild') counts[c.color as 'Red'|'Blue'|'Green'|'Yellow']++;
            }
            let bestColor: UnoColor = 'Red';
            let max = -1;
            for (const [col, count] of Object.entries(counts)) {
                if (count > max) { max = count; bestColor = col as UnoColor; }
            }
            return { type: 'CHOOSE_COLOR', color: bestColor };
        }

        if (s.drawPending > 0) {
            return { type: 'DRAW_CARD' };
        }

        // Find playable
        const playable = ai.hand.filter(c => this.canPlayCard(c, s));
        if (playable.length === 0) {
            return { type: 'DRAW_CARD' };
        }

        // Simple heuristic: play high value or action cards first to dump points
        // Play Wilds only if necessary
        const nonWilds = playable.filter(c => c.color !== 'Wild');
        
        let cardToPlay: UnoCard;
        if (nonWilds.length > 0) {
            // Just pick the first. Could optimize.
            cardToPlay = nonWilds[Math.floor(Math.random() * nonWilds.length)];
        } else {
            cardToPlay = playable[0]; // Wild
        }

        if (cardToPlay.color === 'Wild') {
            const counts = { Red: 0, Blue: 0, Green: 0, Yellow: 0 };
            for (const c of ai.hand) {
                if (c.color !== 'Wild') counts[c.color as 'Red'|'Blue'|'Green'|'Yellow']++;
            }
            let bestColor: UnoColor = 'Red';
            let max = -1;
            for (const [col, count] of Object.entries(counts)) {
                if (count > max) { max = count; bestColor = col as UnoColor; }
            }
            return { type: 'PLAY_CARD', cardId: cardToPlay.id, chosenColor: bestColor };
        }

        return { type: 'PLAY_CARD', cardId: cardToPlay.id };
    }
}
