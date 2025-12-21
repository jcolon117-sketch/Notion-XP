// systems/updateUser.js
// Generic XP applier for a character page (optional helper)

import { notion } from "../notionClient.js";

/**
 * XP curve: matches the curve used in questBatchProcessor
 * Next Level XP = floor(100 * 1.25^(level - 1))
 */
function nextLevelXpFor(level) {
  if (level <= 1) return 100;
  return Math.floor(100 * Math.pow(1.25, level - 1));
}

/**
 * Reconstruct total XP from (level, currentXP) using the same curve
 */
function totalXpFromLevelAndCurrent(level, currentXp) {
  let total = currentXp;
  for (let i = 1; i < level; i++) {
    total += nextLevelXpFor(i);
  }
  return total;
}

/**
 * Applies XP to a character and updates Level, XP, and Stat Points in Notion.
 * NOTE: Your main flow already uses questBatchProcessor; this is an optional helper.
 */
export async function updateUser(charPage, xpGained = 0) {
  const p = charPage.properties;

  const currentLevel = p.Level?.number ?? 1;
  const currentXP = p.XP?.number ?? 0;
  const unspent = p["Unspent Stat Points"]?.number ?? 0;

  // Convert to total XP with the curve
  const totalXP = xpGained + totalXpFromLevelAndCurrent(currentLevel, currentXP);

  // Recalculate progression
  let newLevel = 1;
  let remainingXP = totalXP;
  let next = nextLevelXpFor(newLevel);

  while (remainingXP >= next) {
    remainingXP -= next;
    newLevel += 1;
    next = nextLevelXpFor(newLevel);
  }

  const leveledUp = newLevel > currentLevel;
  const levelsGained = newLevel - currentLevel;
  const statPointsEarned = levelsGained * 5;

  const updates = {
    Level: { number: newLevel },
    XP: { number: remainingXP },
  };

  if (leveledUp) {
    updates["Unspent Stat Points"] = {
      number: unspent + statPointsEarned,
    };
    if (p["Level Up Trigger"]?.checkbox !== undefined) {
      updates["Level Up Trigger"] = { checkbox: true };
    }
  }

  await notion.pages.update({
    page_id: charPage.id,
    properties: updates,
  });

  return {
    leveledUp,
    newLevel,
    levelsGained,
    statPointsEarned,
  };
}
