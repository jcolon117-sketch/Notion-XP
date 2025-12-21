// utils.js
// XP curve utilities matching Character DB + questBatchProcessor

export function xpNeededForLevel(level) {
  if (level <= 1) return 100;
  return Math.floor(100 * Math.pow(1.25, level - 1));
}

// Convert cumulative XP → Level + leftover XP
export function levelFromTotalXP(totalXP) {
  let level = 1;
  let remaining = totalXP;

  let next = xpNeededForLevel(level);

  while (remaining >= next) {
    remaining -= next;
    level++;
    next = xpNeededForLevel(level);
  }

  return {
    level,
    leftoverXP: remaining,
  };
}