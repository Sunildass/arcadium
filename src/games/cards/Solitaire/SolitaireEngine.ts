import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string; // unique identifier
  suit: Suit;
  rank: Rank;
  isFaceUp: boolean;
  color: 'Red' | 'Black';
  value: number; // 1 (A) to 13 (K)
}

export type PileType = 'Stock' | 'Waste' | 'Foundation' | 'Tableau';

export interface PileLocation {
  type: PileType;
  index: number; // For Foundation (0-3) and Tableau (0-6). 0 for Stock/Waste.
  cardIndex?: number; // Optional: index of the card within the pile (used for dragging multiple cards from Tableau)
}

export interface SolitaireState {
  stock: Card[];
  waste: Card[];
  foundations: Card[][]; // 4 piles
  tableaus: Card[][]; // 7 piles
  isGameOver: boolean;
  score: number;
  moves: number;
}

export type MoveAction =
  | { type: 'DRAW_STOCK' }
  | { type: 'RECYCLE_WASTE' }
  | { type: 'MOVE_CARD'; from: PileLocation; to: PileLocation }
  | { type: 'REVEAL_TABLEAU_CARD'; colIndex: number };

const SUITS: Suit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const RANKS: { rank: Rank; value: number }[] = [
  { rank: 'A', value: 1 }, { rank: '2', value: 2 }, { rank: '3', value: 3 },
  { rank: '4', value: 4 }, { rank: '5', value: 5 }, { rank: '6', value: 6 },
  { rank: '7', value: 7 }, { rank: '8', value: 8 }, { rank: '9', value: 9 },
  { rank: '10', value: 10 }, { rank: 'J', value: 11 }, { rank: 'Q', value: 12 }, { rank: 'K', value: 13 },
];

export class SolitaireEngine implements GameEngine<SolitaireState, MoveAction> {
  private startTimeMs: number = 0;

  initialize(): SolitaireState {
    this.startTimeMs = Date.now();
    let deck = this.generateDeck();
    deck = this.shuffle(deck);

    const tableaus: Card[][] = Array.from({ length: 7 }, () => []);
    const foundations: Card[][] = Array.from({ length: 4 }, () => []);

    // Deal to tableaus
    for (let i = 0; i < 7; i++) {
        for (let j = i; j < 7; j++) {
            const card = deck.pop()!;
            // Last card in the pile dealt gets flipped face up
            if (i === j) {
                card.isFaceUp = true;
            }
            tableaus[j].push(card);
        }
    }

    // Remaining cards go to stock
    const stock = deck.map(c => ({ ...c, isFaceUp: false }));

    return {
      stock,
      waste: [],
      foundations,
      tableaus,
      isGameOver: false,
      score: 0,
      moves: 0
    };
  }

  private generateDeck(): Card[] {
      const deck: Card[] = [];
      let idCounter = 0;
      for (const suit of SUITS) {
          const color = (suit === 'Hearts' || suit === 'Diamonds') ? 'Red' : 'Black';
          for (const rank of RANKS) {
              deck.push({
                  id: `card-${idCounter++}`,
                  suit,
                  rank: rank.rank,
                  value: rank.value,
                  color,
                  isFaceUp: false
              });
          }
      }
      return deck;
  }

  private shuffle(deck: Card[]): Card[] {
      const cloned = [...deck];
      for (let i = cloned.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
      }
      return cloned;
  }

  update(state: SolitaireState, action: MoveAction): SolitaireState {
    if (state.isGameOver) return state;
    
    // Deep clone to prevent direct mutation references inside React state
    const newState: SolitaireState = {
        stock: [...state.stock],
        waste: [...state.waste],
        foundations: state.foundations.map(f => [...f]),
        tableaus: state.tableaus.map(t => [...t]),
        isGameOver: state.isGameOver,
        score: state.score,
        moves: state.moves
    };

    let validOperation = false;

    switch (action.type) {
        case 'DRAW_STOCK':
            if (newState.stock.length > 0) {
                const card = newState.stock.pop()!;
                card.isFaceUp = true;
                newState.waste.push(card);
                validOperation = true;
            }
            break;

        case 'RECYCLE_WASTE':
            if (newState.stock.length === 0 && newState.waste.length > 0) {
                // Return waste back to stock, face down
                newState.stock = [...newState.waste].reverse().map(c => ({ ...c, isFaceUp: false }));
                newState.waste = [];
                // Standard klondike scoring penalizes recycle, but we'll ignore for casual play
                validOperation = true;
            }
            break;

        case 'REVEAL_TABLEAU_CARD':
            const tab = newState.tableaus[action.colIndex];
            if (tab.length > 0 && !tab[tab.length - 1].isFaceUp) {
                tab[tab.length - 1].isFaceUp = true;
                newState.score += 5;
                // Move not mathematically incremented for an auto-reveal, but state changes
                validOperation = true;
            }
            break;

        case 'MOVE_CARD':
            validOperation = this.executeMoveCard(newState, action.from, action.to);
            break;
    }

    if (validOperation && action.type !== 'REVEAL_TABLEAU_CARD') {
        newState.moves++;
    }

    this.checkWinCondition(newState);

    return validOperation ? newState : state; // Only return new state if move was valid to trigger render
  }

  private executeMoveCard(state: SolitaireState, from: PileLocation, to: PileLocation): boolean {
      // 1. Gather moving cards
      let movingCards: Card[] = [];
      let sourcePile: Card[] = [];

      if (from.type === 'Waste') {
          if (state.waste.length === 0) return false;
          movingCards = [state.waste[state.waste.length - 1]];
          sourcePile = state.waste;
      } else if (from.type === 'Foundation') {
          if (state.foundations[from.index].length === 0) return false;
          movingCards = [state.foundations[from.index][state.foundations[from.index].length - 1]];
          sourcePile = state.foundations[from.index];
      } else if (from.type === 'Tableau') {
          const tab = state.tableaus[from.index];
          const cardIdx = from.cardIndex ?? tab.length - 1;
          if (cardIdx < 0 || cardIdx >= tab.length || !tab[cardIdx].isFaceUp) return false;
          
          movingCards = tab.slice(cardIdx);
          sourcePile = tab;
      } else {
          return false;
      }

      const bottomMovingCard = movingCards[0];

      // 2. Validate Target
      if (to.type === 'Foundation') {
          // Can only move 1 card to Foundation
          if (movingCards.length > 1) return false;
          const targetFoundation = state.foundations[to.index];

          if (targetFoundation.length === 0) {
             if (bottomMovingCard.rank !== 'A') return false;
          } else {
             const topTarget = targetFoundation[targetFoundation.length - 1];
             if (topTarget.suit !== bottomMovingCard.suit) return false;
             if (bottomMovingCard.value !== topTarget.value + 1) return false;
          }

          state.score += 10;
          targetFoundation.push(bottomMovingCard);

      } else if (to.type === 'Tableau') {
          const targetTableau = state.tableaus[to.index];

          if (targetTableau.length === 0) {
              if (bottomMovingCard.rank !== 'K') return false;
          } else {
              const topTarget = targetTableau[targetTableau.length - 1];
              if (!topTarget.isFaceUp) return false;
              if (topTarget.color === bottomMovingCard.color) return false;
              if (bottomMovingCard.value !== topTarget.value - 1) return false;
          }

          if (from.type === 'Waste') state.score += 5;

          targetTableau.push(...movingCards);
      } else {
          return false;
      }

      // 3. Remove from Source
      if (from.type === 'Tableau' && from.cardIndex !== undefined) {
         state.tableaus[from.index].splice(from.cardIndex, movingCards.length);
      } else {
         sourcePile.pop();
      }

      return true;
  }

  private checkWinCondition(state: SolitaireState) {
      const allFoundationsFull = state.foundations.every(f => f.length === 13);
      if (allFoundationsFull) {
          state.isGameOver = true;
          state.score += 500; // Bonus for completing
      }
  }

  evaluateWin(state: SolitaireState): GameResult | null {
      if (!state.isGameOver) return null;

      return {
          winner: 'Player1',
          score: state.score,
          difficulty: 'Easy',
          playTimeMs: Date.now() - this.startTimeMs
      };
  }
}
