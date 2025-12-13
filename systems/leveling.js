// systems/leveling.js
import { LEVEL_XP } from "../config/gameConfig.js";

export function xpForLevel(level) {
  return Math.floor(LEVEL_XP.base * Math.pow(level, LEVEL_XP.growth));
}

export function applyXP(character, gainedXP) {
  let level = character.level;
  let xp = character.xp + gainedXP;
  let nextXP = xpForLevel(level);

  let leveledUp = false;

  while (xp >= nextXP) {
    xp -= nextXP;
    level++;
    nextXP = xpForLevel(level);
    leveledUp = true;
  }

  return {
    level,
    xp,
    nextXP,
    leveledUp
  };
}
