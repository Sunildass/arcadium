import { formatMinutes } from './timeFormat';
import { describe, it, expect } from 'vitest';

describe('formatMinutes', () => {
  it('formats valid seconds to minutes', () => {
    expect(formatMinutes(60)).toBe('1m');
    expect(formatMinutes(125)).toBe('2m');
    expect(formatMinutes(59)).toBe('0m');
  });

  it('handles zero safely', () => {
    expect(formatMinutes(0)).toBe('0m');
  });

  it('handles negative numbers safely', () => {
    expect(formatMinutes(-10)).toBe('0m');
  });

  it('handles undefined safely', () => {
    // @ts-ignore - testing runtime safety
    expect(formatMinutes(undefined)).toBe('0m');
  });

  it('handles null safely', () => {
    // @ts-ignore - testing runtime safety
    expect(formatMinutes(null)).toBe('0m');
  });

  it('handles NaN safely', () => {
    expect(formatMinutes(NaN)).toBe('0m');
  });
});
