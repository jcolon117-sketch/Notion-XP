// systems/leveling.js
export function applyXP(character, xpGained) {
  let { level, xp } = character;
  xp += xpGained;

  let leveledUp = false;

  const xpToNext = (lvl) => lvl * 100;

  while (xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level++;
    leveledUp = true;
  }

  return {
    level,
    xp,
    leveledUp,
    statPointsGained: leveledUp ? 2 : 0
  };
}
