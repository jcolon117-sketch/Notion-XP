// systems/processQuest.js
import "dotenv/config";
import { Client } from "@notionhq/client";

import { rollDrop } from "./loot.js";
import { addItemToInventory } from "./inventory.js";

import { applyXP } from "./leveling.js";
import { applyStatXP } from "./statProgression.js";
import { regenResource } from "./regen.js";
import { logEvent } from "./logger.js";
import { LOG_TYPES } from "../config/gameConfig.js";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// ------------------------
// Helpers
// ------------------------
async function getCharacter(id) {
  return await notion.pages.retrieve({ page_id: id });
}

async function updateCharacter(id, properties) {
  await notion.pages.update({
    page_id: id,
    properties,
  });
}

// ------------------------
// MAIN QUEST PROCESSOR
// ------------------------
export async function processQuest(quest) {
  const props = quest.properties;

  // --------------------------------
  // Validate assignment
  // --------------------------------
  const assigned = props["Assigned To"]?.relation?.[0];
  if (!assigned) return;

  const charId = assigned.id;
  const charPage = await getCharacter(charId);
  const c = charPage.properties;

  // --------------------------------
  // Regen Energy & Stamina
  // --------------------------------
  const lastRegen =
    c["Last Regen Timestamp"]?.date?.start ??
    new Date().toISOString();

  const energyRegen = regenResource(
    c["Current Energy"]?.number ?? 0,
    c["Max Energy"]?.number ?? 0,
    c["Energy Regen Rate"]?.number ?? 0,
    lastRegen
  );

  const staminaRegen = regenResource(
    c["Current Stamina"]?.number ?? 0,
    c["Max Stamina"]?.number ?? 0,
    c["Stamina Regen Rate"]?.number ?? 0,
    lastRegen
  );

  // --------------------------------
  // Energy cost
  // --------------------------------
  const energyCost = props["Energy Cost"]?.number ?? 0;
  if (energyRegen.value < energyCost) {
    console.log("❌ Not enough energy to complete quest.");
    return;
  }

  // --------------------------------
  // Apply XP + Leveling
  // --------------------------------
  const xpReward = props["XP Reward"]?.number ?? 0;

  const xpResult = applyXP(
    {
      level: c["Current Level"]?.number ?? 1,
      xp: c["Current XP"]?.number ?? 0,
    },
    xpReward
  );

  // --------------------------------
  // Gold
  // --------------------------------
  const goldReward = props["Gold Reward"]?.number ?? 0;
  const newGold = (c["Gold"]?.number ?? 0) + goldReward;

  // --------------------------------
// Item Drop
// --------------------------------
const itemRel = props["Item Reward"]?.relation?.[0];
const dropChance = props["Item Drop Chance"]?.number ?? 0;

if (itemRel && dropChance > 0) {
  if (rollDrop(dropChance)) {
    await addItemToInventory({
      characterId: charId,
      itemId: itemRel.id,
      quantity: 1,
      questId: quest.id
    });

    await logEvent({
      name: "Item Acquired",
      type: LOG_TYPES.ITEM,
      userId: charId,
      questId: quest.id,
      details: `Received item from quest`
    });
  }
}

  // --------------------------------
  // Update character
  // --------------------------------
  await updateCharacter(charId, {
    "Current Level": { number: xpResult.level },
    "Current XP": { number: xpResult.xp },
    "XP Progress": { number: xpResult.xp },
    Gold: { number: newGold },
    "Current Energy": { number: energyRegen.value - energyCost },
    "Current Stamina": { number: staminaRegen.value },
    "Last Regen Timestamp": {
      date: { start: new Date().toISOString() },
    },
  });

  // --------------------------------
  // Stat reward
  // --------------------------------
  const statName = props["Stat Reward"]?.select?.name;
  const statXP = props["Stat Amount"]?.number ?? 0;

  if (statName && statXP > 0) {
    const statRelation = props["Reward -> Stats"]?.relation?.[0];

    if (statRelation) {
      const statPage = await notion.pages.retrieve({
        page_id: statRelation.id,
      });

      const statProps = statPage.properties;

      const statResult = applyStatXP(
        {
          level: statProps["Level"]?.number ?? 1,
          xp: statProps["XP"]?.number ?? 0,
        },
        statXP
      );

      await notion.pages.update({
        page_id: statRelation.id,
        properties: {
          Level: { number: statResult.level },
          XP: { number: statResult.xp },
        },
      });

      await logEvent({
        name: `${statName} Improved`,
        type: LOG_TYPES.STAT_UP,
        userId: charId,
        questId: quest.id,
        details: `+${statXP} ${statName} XP`,
      });
    }
  }

  // --------------------------------
  // Quest log
  // --------------------------------
  const questName =
    props.Name?.title?.[0]?.plain_text ?? "Quest Completed";

  await logEvent({
    name: questName,
    type: LOG_TYPES.QUEST,
    userId: charId,
    questId: quest.id,
    details: `+${xpReward} XP, +${goldReward} Gold`,
  });

  if (xpResult.leveledUp) {
    await logEvent({
      name: "Level Up!",
      type: LOG_TYPES.LEVEL_UP,
      userId: charId,
      details: `Reached level ${xpResult.level}`,
    });
  }

  // --------------------------------
  // Mark quest rewarded
  // --------------------------------
  await notion.pages.update({
    page_id: quest.id,
    properties: {
      Status: { status: { name: "Rewarded" } },
    },
  });
}
