// systems/leveling.js
// Simple leveling math helpers

export function xpNeededForLevel(level) {
  // Basic linear curve: can be swapped to match your Notion formula if desired
  return level * 100;
}

export function levelFromTotalXP(totalXP) {
  let level = 0;
  let remainingXP = totalXP;

  // Convert a "total XP pool" into (level, remainingXP)
  while (remainingXP >= xpNeededForLevel(level + 1)) {
    remainingXP -= xpNeededForLevel(level + 1);
    level++;

    // Safety guard
    if (level > 9999) break;
  }

  return {
    level,
    remainingXP,
  };
}