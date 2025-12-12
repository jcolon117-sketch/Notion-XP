// levelSystem.js
import { Client } from "@notionhq/client";
import "dotenv/config";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

/**
 * Applies XP, checks for level-ups, boosts stats, and returns results
 */
export async function applyLevelUp(characterId, xpToAdd) {
  // Fetch character page
  const page = await notion.pages.retrieve({ page_id: characterId });
  const props = page.properties;

  const currentLevel = props["Current Level"]?.number ?? 1;
  const currentXP = props["Current XP"]?.number ?? 0;
  const nextLevelXP = props["Next Level XP"]?.formula?.number ?? 999999;

  let updatedXP = currentXP + xpToAdd;
  let updatedLevel = currentLevel;
  let levelUps = 0;

  // Level-up loop (handles multiple-level jumps)
  while (updatedXP >= nextLevelXP) {
    updatedXP -= nextLevelXP;
    updatedLevel++;
    levelUps++;
  }

  // Push updates to Notion
  await notion.pages.update({
    page_id: characterId,
    properties: {
      "Current XP": { number: updatedXP },
      "Current Level": { number: updatedLevel },
      "XP Progress": { number: updatedXP }
    }
  });

  return {
    beforeLevel: currentLevel,
    afterLevel: updatedLevel,
    levelsGained: levelUps,
    finalXP: updatedXP
  };
}