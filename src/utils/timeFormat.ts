/**
 * Format total seconds into a play-time label following these rules:
 *  - < 1s            → "0m played"
 *  - 1s – 59s        → "1m played"   (rounds UP to 1m)
 *  - 60s – 119s      → "1m played"
 *  - 120s – 179s     → "2m played"  … etc (always ceiling to next full minute)
 *  - exactly 1h      → "1h played"
 *  - 1h 30m          → "1h 30m played"
 *  - exactly 2h      → "2h played"
 */
export function formatPlaytime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 1) return '0m played';

  // Ceiling to the nearest full minute (1s → 1m, 60s → 1m, 61s → 2m …)
  const totalMinutes = Math.ceil(totalSeconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes}m played`;
  }

  const hours   = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) return `${hours}h played`;
  return `${hours}h ${minutes}m played`;
}

/**
 * Legacy shim — kept so existing callers that pass seconds don't break.
 * New code should use formatPlaytime() directly.
 */
export function formatMinutes(seconds: number): string {
  return formatPlaytime(seconds);
}
