// systems/processQuest.js

import "dotenv/config";
import { Client } from "@notionhq/client";

import { applyXP } from "./leveling.js";
import { applyStatXP } from "./statProgression.js";
import { regenResource } from "./regen.js";
import { logEvent } from "./logger.js";
import { LOG_TYPES } from "../config/gameConfig.js";

import { increaseFatigue, calculateFatigueModifier } from "./fatigueEngine.js";
import { getWeekIndex } from "./weekUtils.js";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// ------------------------
// Helpers
// ------------------------
async function getCharacter(id) {
  return notion.pages.retrieve({ page_id: id });
}

async function updateCharacter(id, properties) {
  return notion.pages.update({
    page_id: id,
    properties,
  });
}

// ------------------------
// MAIN QUEST PROCESSOR
// ------------------------
export async function processQuest(quest) {
  const props = quest.properties;

  const assigned = props["Assigned To"]?.relation?.[0];
  if (!assigned) return;

  const charId = assigned.id;
  const charPage = await getCharacter(charId);
  const c = charPage.properties;

  /* ───── Weekly fatigue reset ───── */
  const currentWeek = getWeekIndex();
  const storedWeek = c["Week Index"]?.number ?? currentWeek;

  let fatigue = c["Weekly Fatigue"]?.number ?? 0;

  if (storedWeek !== currentWeek) {
    fatigue = 0;
  }

  /* ───── Fatigue modifier ───── */
  const fatigueModifier = calculateFatigueModifier(fatigue);

  /* ───── Regen ───── */
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

  const energyCost = props["Energy Cost"]?.number ?? 0;
  if (energyRegen.value < energyCost) return;

  /* ───── XP (fatigue scaled) ───── */
  const baseXP = props["XP Reward"]?.number ?? 0;
  const finalXP = Math.floor(baseXP * fatigueModifier);

  const xpResult = applyXP(
    {
      level: c["Current Level"]?.number ?? 1,
      xp: c["Current XP"]?.number ?? 0,
    },
    finalXP
  );

  /* ───── Update fatigue ───── */
  const newFatigue = increaseFatigue(fatigue);
  const newFatigueModifier = calculateFatigueModifier(newFatigue);

  /* ───── Update character ───── */
  await updateCharacter(charId, {
    "Current Level": { number: xpResult.level },
    "Current XP": { number: xpResult.xp },
    "XP Progress": { number: xpResult.xp },

    "Current Energy": { number: energyRegen.value - energyCost },
    "Current Stamina": { number: staminaRegen.value },

    "Weekly Fatigue": { number: newFatigue },
    "Fatigue Modifier": { number: newFatigueModifier },
    "Week Index": { number: currentWeek },

    "Last Active Date": {
      date: { start: new Date().toISOString() },
    },

    "Last Regen Timestamp": {
      date: { start: new Date().toISOString() },
    },
  });

  /* ───── Logging ───── */
  await logEvent({
    name: "Quest Completed",
    type: LOG_TYPES.QUEST,
    userId: charId,
    questId: quest.id,
    details: `XP ${finalXP} (Fatigue x${fatigueModifier})`,
  });

  await notion.pages.update({
    page_id: quest.id,
    properties: {
      Status: { status: { name: "Rewarded" } },
    },
  });
}
