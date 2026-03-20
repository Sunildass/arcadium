import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    suit: Suit;
    rank: Rank;
    value: number; // 2-14
}

export interface Player {
    id: string;
    isAI: boolean;
    name: string;
    chips: number;
    hand: Card[];
    currentBet: number;
    folded: boolean;
    isAllIn: boolean;
    hasActed: boolean; // Has acted in this current betting round
}

export type Phase = 'ante' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown' | 'game-over';

export interface PokerState {
    players: Player[];
    deck: Card[];
    communityCards: Card[];
    pot: number;
    highestBet: number; // The amount currently required to call
    turnIndex: number;
    dealerIndex: number;
    smallBlindIndex: number;
    bigBlindIndex: number;
    phase: Phase;
    minRaise: number; // The minimum amount a player can raise by
    winners: { playerId: string, amount: number, handName: string }[];
    log: string[];
}

export type PokerAction = 
  | { type: 'FOLD' }
  | { type: 'CHECK_CALL' }
  | { type: 'RAISE'; amount: number } // Amount *to* bet total, or amount *added*? Standard is total new bet amount (e.g. raise to 100). We will treat it as the total amount the player commits to this round.
  | { type: 'NEXT_ROUND' };

const RANK_VALUES: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export const HandRank = {
    HighCard: 1, Pair: 2, TwoPair: 3, ThreeOfAKind: 4,
    Straight: 5, Flush: 6, FullHouse: 7, FourOfAKind: 8, StraightFlush: 9
} as const;
export type HandRank = typeof HandRank[keyof typeof HandRank];

export interface EvaluatedHand {
    rank: HandRank;
    name: string;
    score: number; // A comparable numeric score to definitively break ties
}

export class PokerEngine implements GameEngine<PokerState, PokerAction> {
    private startTimeMs: number = 0;
    private bigBlindAmount: number = 20;

    constructor() {}

    initialize(): PokerState {
        this.startTimeMs = Date.now();
        
        const players: Player[] = [
            { id: 'p1', isAI: false, name: 'Player 1', chips: 1000, hand: [], currentBet: 0, folded: false, isAllIn: false, hasActed: false },
            { id: 'ai1', isAI: true, name: 'Bot Alice', chips: 1000, hand: [], currentBet: 0, folded: false, isAllIn: false, hasActed: false },
            { id: 'ai2', isAI: true, name: 'Bot Bob', chips: 1000, hand: [], currentBet: 0, folded: false, isAllIn: false, hasActed: false },
            { id: 'ai3', isAI: true, name: 'Bot Charlie', chips: 1000, hand: [], currentBet: 0, folded: false, isAllIn: false, hasActed: false }
        ];

        let state: PokerState = {
            players,
            deck: [],
            communityCards: [],
            pot: 0,
            highestBet: 0,
            turnIndex: 0,
            dealerIndex: 0,
            smallBlindIndex: 1,
            bigBlindIndex: 2,
            phase: 'ante',
            minRaise: this.bigBlindAmount,
            winners: [],
            log: []
        };

        return this.startNewHand(state);
    }

    private startNewHand(state: PokerState): PokerState {
        const s = { ...state };
        
        // Remove players with 0 chips
        // (In a continuous game they'd be eliminated, for simplicity we might just skip them or respawn them. Let's just reset them if they drop).
        s.players.forEach(p => {
             if (p.chips === 0) p.chips = 1000; // Auto rebuy for arcade pacing
        });

        // Rotate dealer
        s.dealerIndex = (s.dealerIndex + 1) % s.players.length;
        s.smallBlindIndex = (s.dealerIndex + 1) % s.players.length;
        s.bigBlindIndex = (s.dealerIndex + 2) % s.players.length;

        // Reset state
        s.deck = this.createAndShuffleDeck();
        s.communityCards = [];
        s.pot = 0;
        s.highestBet = this.bigBlindAmount;
        s.minRaise = this.bigBlindAmount;
        s.phase = 'pre-flop';
        s.winners = [];
        s.log = ['New Hand Started.'];
        
        s.players.forEach(p => {
            p.hand = [s.deck.pop()!, s.deck.pop()!];
            p.currentBet = 0;
            p.folded = false;
            p.isAllIn = false;
            p.hasActed = false;
        });

        // Post blinds
        this.deductChips(s.players[s.smallBlindIndex], this.bigBlindAmount / 2, s);
        this.deductChips(s.players[s.bigBlindIndex], this.bigBlindAmount, s);

        s.turnIndex = (s.bigBlindIndex + 1) % s.players.length;

        return s;
    }

    private deductChips(p: Player, reqAmount: number, s: PokerState) {
        let amount = Math.min(p.chips, reqAmount);
        p.chips -= amount;
        p.currentBet += amount;
        if (p.chips === 0) p.isAllIn = true;
    }

    private createAndShuffleDeck(): Card[] {
        const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const deck: Card[] = [];
        for (let suit of suits) {
            for (let rank of ranks) {
                deck.push({ suit, rank, value: RANK_VALUES[rank] });
            }
        }
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    private nextTurn(state: PokerState): PokerState {
        const activePlayers = state.players.filter(p => !p.folded && !p.isAllIn);
        
        // If 1 or 0 players left who can act, or if everyone has acted and matched the highest bet
        const playersNeedingToAct = state.players.filter(p => 
            !p.folded && !p.isAllIn && (!p.hasActed || p.currentBet < state.highestBet)
        );

        if (state.players.filter(p => !p.folded).length === 1) {
            // Everyone folded to 1 guy
            return this.evaluateShowdown(state);
        }

        if (playersNeedingToAct.length === 0) {
            // Round over, advance phase
            return this.advancePhase(state);
        }

        // Just move to next valid player
        state.turnIndex = (state.turnIndex + 1) % state.players.length;
        while (state.players[state.turnIndex].folded || state.players[state.turnIndex].isAllIn) {
            state.turnIndex = (state.turnIndex + 1) % state.players.length;
        }

        return state;
    }

    private advancePhase(state: PokerState): PokerState {
        // Collect bets into pot
        state.players.forEach(p => {
             state.pot += p.currentBet;
             p.currentBet = 0;
             p.hasActed = false; // Reset for next round
        });
        state.highestBet = 0;
        state.minRaise = this.bigBlindAmount;

        if (state.phase === 'pre-flop') {
             state.phase = 'flop';
             state.communityCards.push(state.deck.pop()!, state.deck.pop()!, state.deck.pop()!);
             state.log.push('Flop dealt.');
        } else if (state.phase === 'flop') {
             state.phase = 'turn';
             state.communityCards.push(state.deck.pop()!);
             state.log.push('Turn dealt.');
        } else if (state.phase === 'turn') {
             state.phase = 'river';
             state.communityCards.push(state.deck.pop()!);
             state.log.push('River dealt.');
        } else if (state.phase === 'river') {
             return this.evaluateShowdown(state);
        }

        // Determine first to act post-flop
        state.turnIndex = (state.dealerIndex + 1) % state.players.length;
        while (state.turnIndex !== state.dealerIndex && (state.players[state.turnIndex].folded || state.players[state.turnIndex].isAllIn)) {
            state.turnIndex = (state.turnIndex + 1) % state.players.length;
        }
        // Edge case: everyone is all in.
        const active = state.players.filter(p => !p.folded && !p.isAllIn);
        if (active.length <= 1) {
             // If no one or 1 can act, we just auto-advance everything to showdown.
             // Rather than recursion, we can just jump to showdown.
             while (state.communityCards.length < 5) state.communityCards.push(state.deck.pop()!);
             return this.evaluateShowdown(state);
        }

        return state;
    }

    update(state: PokerState, action: PokerAction): PokerState {
        let s = { ...state };
        if (s.phase === 'showdown' || s.phase === 'game-over') {
            if (action.type === 'NEXT_ROUND') {
                return this.startNewHand(s);
            }
            return s;
        }

        const p = s.players[s.turnIndex];

        if (action.type === 'FOLD') {
            p.folded = true;
            s.log.push(`${p.name} folded.`);
        } 
        else if (action.type === 'CHECK_CALL') {
            const amountToCall = s.highestBet - p.currentBet;
            if (amountToCall > 0) {
                 this.deductChips(p, amountToCall, s);
                 s.log.push(`${p.name} called.`);
            } else {
                 s.log.push(`${p.name} checked.`);
            }
            p.hasActed = true;
        }
        else if (action.type === 'RAISE') {
            const amountToCall = s.highestBet - p.currentBet;
            const newTotalBet = action.amount; // total they are putting in this round
            const addAmount = newTotalBet - p.currentBet;

            this.deductChips(p, addAmount, s);
            
            const raiseDiff = newTotalBet - s.highestBet;
            if (raiseDiff > s.minRaise) s.minRaise = raiseDiff;
            s.highestBet = newTotalBet;
            
            p.hasActed = true;
            s.log.push(`${p.name} raised to ${newTotalBet}.`);
            
            // Raising re-opens action for everyone else
            s.players.forEach(pl => {
                if (pl.id !== p.id) pl.hasActed = false;
            });
        }

        return this.nextTurn(s);
    }

    // High performance strict 7-card evaluator
    // Returns a score where higher strictly means better hand. tie breaks inherently managed by cascading hex digits.
    public evaluateHand(hole: Card[], community: Card[]): EvaluatedHand {
        const cards = [...hole, ...community].sort((a,b) => b.value - a.value);
        if (cards.length < 2) return { rank: HandRank.HighCard, name: "Invalid", score: 0 }; // Should never happen unless early fold 

        // Analyze ranks and suits
        const rankCounts: Record<number, number> = {};
        const suitCounts: Record<string, Card[]> = {};
        
        cards.forEach(c => {
            rankCounts[c.value] = (rankCounts[c.value] || 0) + 1;
            if (!suitCounts[c.suit]) suitCounts[c.suit] = [];
            suitCounts[c.suit].push(c);
        });

        // 1. Flush check
        let flushCards: Card[] | null = null;
        for (let suit in suitCounts) {
             if (suitCounts[suit].length >= 5) {
                  flushCards = suitCounts[suit].slice(0, 5); // Already sorted descending
                  break;
             }
        }

        // 2. Straight check helper
        const findStraight = (cardSet: Card[]): Card[] | null => {
            const uniqueRanks = Array.from(new Set(cardSet.map(c => c.value))).sort((a,b)=>b-a);
            // Handle A-2-3-4-5
            if (uniqueRanks.includes(14)) uniqueRanks.push(1); 
            
            for (let i = 0; i <= uniqueRanks.length - 5; i++) {
                 if (uniqueRanks[i] - uniqueRanks[i+4] === 4) {
                      // Found consecutive 5
                      const straightValues = uniqueRanks.slice(i, i+5);
                      // Map back to cards
                      const straightCards: Card[] = [];
                      straightValues.forEach(v => {
                           const c = cardSet.find(card => card.value === (v === 1 ? 14 : v))!;
                           if(!straightCards.includes(c)) straightCards.push(c);
                      });
                      return straightCards;
                 }
            }
            return null;
        };

        const straightCards = findStraight(cards);
        
        // 3. Straight Flush check
        if (flushCards) {
             const sfCards = findStraight(flushCards);
             if (sfCards) {
                 return {
                     rank: HandRank.StraightFlush,
                     name: sfCards[0].value === 14 ? 'Royal Flush' : 'Straight Flush',
                     score: 9000000 + sfCards[0].value
                 };
             }
        }

        // Find Multiples
        const quads = Object.entries(rankCounts).filter(e => e[1] === 4).map(e => Number(e[0]));
        const trips = Object.entries(rankCounts).filter(e => e[1] === 3).map(e => Number(e[0])).sort((a,b)=>b-a);
        const pairs = Object.entries(rankCounts).filter(e => e[1] === 2).map(e => Number(e[0])).sort((a,b)=>b-a);

        // 4. Four of a kind
        if (quads.length > 0) {
             const kicker = cards.find(c => c.value !== quads[0])!.value;
             return {
                 rank: HandRank.FourOfAKind,
                 name: 'Four of a Kind',
                 score: 8000000 + quads[0] * 100 + kicker
             };
        }

        // 5. Full House
        if ((trips.length > 0 && pairs.length > 0) || trips.length > 1) {
             const tripValue = trips[0];
             const pairValue = trips.length > 1 ? trips[1] : pairs[0];
             return {
                 rank: HandRank.FullHouse,
                 name: 'Full House',
                 score: 7000000 + tripValue * 100 + pairValue
             };
        }

        // 6. Flush
        if (flushCards) {
             // Score based on top 5 flush cards
             let score = 6000000;
             flushCards.forEach((c, i) => {
                 score += c.value * Math.pow(15, 4 - i);
             });
             return { rank: HandRank.Flush, name: 'Flush', score };
        }

        // 7. Straight
        if (straightCards) {
             return {
                 rank: HandRank.Straight,
                 name: 'Straight',
                 score: 5000000 + (straightCards[0].value === 14 && straightCards[1].value === 5 ? 5 : straightCards[0].value) 
                 // Note: A-5 straight highest card is 5 for tiebreaking
             }
        }

        // 8. Three of a kind
        if (trips.length > 0) {
            const tripVal = trips[0];
            const kickers = cards.filter(c => c.value !== tripVal).slice(0, 2);
            let score = 4000000 + tripVal * 1000 + kickers[0].value * 15 + kickers[1].value;
            return { rank: HandRank.ThreeOfAKind, name: 'Three of a Kind', score };
        }

        // 9. Two Pair
        if (pairs.length >= 2) {
             const p1 = pairs[0];
             const p2 = pairs[1];
             const kicker = cards.find(c => c.value !== p1 && c.value !== p2)!.value;
             return {
                 rank: HandRank.TwoPair,
                 name: 'Two Pair',
                 score: 3000000 + p1 * 1000 + p2 * 15 + kicker
             };
        }

        // 10. Pair
        if (pairs.length === 1) {
             const p = pairs[0];
             const kickers = cards.filter(c => c.value !== p).slice(0, 3);
             let score = 2000000 + p * 10000 + kickers[0].value * 225 + kickers[1].value * 15 + kickers[2].value;
             return { rank: HandRank.Pair, name: 'Pair', score };
        }

        // 11. High Card
        let score = 1000000;
        const top5 = cards.slice(0, 5);
        top5.forEach((c, i) => {
             score += c.value * Math.pow(15, 4 - i);
        });
        return { rank: HandRank.HighCard, name: 'High Card', score };
    }

    private evaluateShowdown(state: PokerState): PokerState {
        // Collect remaining bets
        state.players.forEach(p => { state.pot += p.currentBet; p.currentBet = 0; });
        
        const activePlayers = state.players.filter(p => !p.folded);
        let evaluated: {p: Player, eval: EvaluatedHand}[] = [];

        if (activePlayers.length === 1) {
            // Uncontested
            evaluated.push({ p: activePlayers[0], eval: { rank: HandRank.HighCard, name: 'Uncontested', score: Number.MAX_SAFE_INTEGER }});
        } else {
            // Real Showdown
            activePlayers.forEach(p => {
                evaluated.push({ p, eval: this.evaluateHand(p.hand, state.communityCards) });
            });
        }

        evaluated.sort((a,b) => b.eval.score - a.eval.score);
        
        // Handle ties (simplification: we just deal with primary winner or exact ties)
        let maxScore = evaluated[0].eval.score;
        let winners = evaluated.filter(e => e.eval.score === maxScore);

        const winAmount = Math.floor(state.pot / winners.length);

        winners.forEach(w => {
            w.p.chips += winAmount;
            state.winners.push({ playerId: w.p.id, amount: winAmount, handName: w.eval.name });
            state.log.push(`${w.p.name} wins ${winAmount} with ${w.eval.name}.`);
        });

        const player1 = state.players[0];

        // Overall arcadium meta-game validation
        if (player1.chips === 0 && !player1.folded) {
             // Let them lose, maybe re-buy next hand but mark over.
        }

        state.phase = 'showdown';
        return state;
    }

    // Advanced Bot AI
    public getAIMove(state: PokerState): PokerAction {
        const p = state.players[state.turnIndex];
        const amountToCall = state.highestBet - p.currentBet;

        // Extreme simplification for AI:
        const holeEval = this.evaluateHand(p.hand, state.communityCards);
        
        const potOdds = amountToCall / (state.pot + amountToCall); 
        // In highly simplified terms, lower potOdds means we should call more loosely

        // AI "strength" meter 0 to 1
        let strength = 0;
        
        if (state.phase === 'pre-flop') {
            const h1 = p.hand[0].value;
            const h2 = p.hand[1].value;
            if (h1 === h2) strength = h1 > 9 ? 0.9 : 0.6; // High pair = V strong
            else if (h1 > 10 && h2 > 10) strength = 0.7; // Two face cards
            else if (h1 > 12 || h2 > 12) strength = 0.5; // Ace or King
            else if (p.hand[0].suit === p.hand[1].suit) strength = 0.4; // Suited
            else strength = 0.2; // Junk
        } else {
            // Post-flop
            // Compare hand relative to community (does our hand actually improve with community?)
            // We can just rely on absolute rank vs stage of game
            if (holeEval.rank >= HandRank.Straight) strength = 0.95;
            else if (holeEval.rank === HandRank.ThreeOfAKind) strength = 0.8;
            else if (holeEval.rank === HandRank.TwoPair) strength = 0.7;
            else if (holeEval.rank === HandRank.Pair) {
                 // Is it a high pair natively?
                 strength = 0.5; 
            } else {
                 strength = 0.1;
            }
        }

        // Inject some randomness
        strength += (Math.random() * 0.2 - 0.1); 

        if (amountToCall === 0) {
            // Checking is free
            if (strength > 0.8 && Math.random() > 0.5) {
                // Bet aggressively if strong
                return { type: 'RAISE', amount: Math.min(p.chips + p.currentBet, state.minRaise * 2) };
            }
            return { type: 'CHECK_CALL' };
        } else {
            // Must put chips in
            if (strength > 0.8) {
                // Re-raise?
                if (Math.random() > 0.5 && p.chips > amountToCall) {
                     return { type: 'RAISE', amount: Math.min(p.chips + p.currentBet, state.highestBet + state.minRaise) };
                }
                return { type: 'CHECK_CALL' };
            } else if (strength > 0.4) {
                // Call
                return { type: 'CHECK_CALL' };
            } else {
                // Fold
                return { type: 'FOLD' };
            }
        }
    }

    evaluateWin(state: PokerState): GameResult | null {
        // Poker is continuous, no specific 'win' unless 1 player left globally. Let's just return null always so it doesn't interrupt, 
        // User could "cash out" to end.
        return null; 
    }
}
