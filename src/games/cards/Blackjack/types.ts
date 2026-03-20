export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // For aces, we store 11, handle 1 dynamically
  isHidden?: boolean;
}

export interface BlackjackState {
  deck: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  gameState: 'betting' | 'playerTurn' | 'dealerTurn' | 'gameOver';
  winner: 'Player' | 'Dealer' | 'Push' | null;
  message: string;
}

// Moves valid in playerTurn
export type BlackjackMove = 'hit' | 'stand' | 'start';

export const SUITS: Suit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      let value = parseInt(rank);
      if (['J', 'Q', 'K'].includes(rank)) value = 10;
      if (rank === 'A') value = 11;
      deck.push({ suit, rank, value });
    }
  }
  return shuffleDeck(deck);
}

function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export function calculateHandValue(hand: Card[]): number {
  let value = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.isHidden) continue;
    value += card.value;
    if (card.rank === 'A') aces += 1;
  }

  while (value > 21 && aces > 0) {
    value -= 10; // Convert 11 to 1
    aces -= 1;
  }

  return value;
}

export const initialBlackjackState: BlackjackState = {
  deck: [],
  playerHand: [],
  dealerHand: [],
  gameState: 'betting',
  winner: null,
  message: 'Place your bet (Phase 1 uses no chips just start)'
};
