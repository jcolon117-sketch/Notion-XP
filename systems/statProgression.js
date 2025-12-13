// systems/statProgression.js
import { STAT_XP } from "../config/gameConfig.js";

export function statXPForLevel(level) {
  return Math.floor(STAT_XP.base * Math.pow(level, STAT_XP.growth));
}

export function applyStatXP(stat, gainedXP) {
  let xp = stat.xp + gainedXP;
  let level = stat.level;
  let nextXP = statXPForLevel(level);

  let leveledUp = false;

  while (xp >= nextXP) {
    xp -= nextXP;
    level++;
    nextXP = statXPForLevel(level);
    leveledUp = true;
  }

  return {
    level,
    xp,
    nextXP,
    leveledUp
  };
}
