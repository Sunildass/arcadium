export function shouldShowRules(gameId: string): boolean {
  try {
    const data = localStorage.getItem(`game-platform/rules-preference/${gameId}`);
    if (data) {
      const parsed = JSON.parse(data);
      if (typeof parsed.hideRules === 'boolean') {
        return !parsed.hideRules;
      }
    }
  } catch (e) {
    console.error(`Failed to parse rules preference for ${gameId}`, e);
  }
  return true; // Default to showing rules
}

export function setHideRulesPreference(gameId: string, hide: boolean): void {
  try {
    localStorage.setItem(
      `game-platform/rules-preference/${gameId}`,
      JSON.stringify({ hideRules: hide })
    );
  } catch (e) {
    console.error(`Failed to save rules preference for ${gameId}`, e);
  }
}
