// utils.js

export function xpNeededForLevel(level) {
  return level * 100; // simple rule = 100 XP per level
}

// Convert cumulative XP → Level + leftover XP
export function levelFromTotalXP(totalXP) {
  let level = 0;
  let remaining = totalXP;

  while (remaining >= xpNeededForLevel(level + 1)) {
    remaining -= xpNeededForLevel(level + 1);
    level++;

    if (level > 9999) break; // infinite loop safety
  }

  return {
    level,
    leftoverXP: remaining
  };
}