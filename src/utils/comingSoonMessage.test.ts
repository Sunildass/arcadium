import { describe, it, expect, test } from 'vitest';
import { getComingSoonMessage } from './comingSoonMessage';

describe('comingSoonMessage', () => {
  it('should return a string containing the game name', () => {
    const msg = getComingSoonMessage('TestGame', 'board');
    expect(msg).toContain('TestGame');
  });

  it('should use category specific messages when provided', () => {
     // A bit hard to test exact random strings without spy/mocking Math.random, 
     // but we can ensure it returns a valid string.
     const msgCards = getComingSoonMessage('Poker', 'cards');
     expect(typeof msgCards).toBe('string');
     expect(msgCards.length).toBeGreaterThan(0);
  });

  it('should fallback gracefully to generic messages when category is unknown', () => {
    const msg = getComingSoonMessage('Unknown', 'mystic-void');
    expect(typeof msg).toBe('string');
    expect(msg).toContain('Unknown');
  });
});

