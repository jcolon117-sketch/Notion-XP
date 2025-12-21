// systems/gameEngine.js
// CLEAN, FULLY PATCHED VERSION

import { applyInactivityPenalties } from "./dailyInactivityCheck.js";
import { runQuestBatch } from "./questBatchProcessor.js";
import { evaluateGates } from "./evaluateGates.js";
import { generateDailyQuests } from "./generateDailyQuests.js";
import { rollEncounter } from "./encounterEngine.js";
import { notion } from "../notionClient.js";

/**
 * Core RPG tick
 * Triggered by:
 * - Local engine (index.js)
 * - Scheduler (future)
 * - Manual testing
 */
export async function runGameTick(charId, options = {}) {
  const {
    generateDailies = false,
    allowEncounters = true,
  } = options;

  console.log(`\n🎮 Running Game Tick for Character: ${charId}`);

  // 1️⃣ Inactivity penalties (Notion formulas handle the math)
  await applyInactivityPenalties();

  // 2️⃣ Daily quests (only on daily reset)
  if (generateDailies) {
    await generateDailyQuests(charId);
  }

  // 3️⃣ Process completed quests
  await runQuestBatch();

  // 4️⃣ Evaluate gates
  const unlockedGates = await evaluateGates(charId);

  // 5️⃣ Encounters
  let encounterResult = null;
  if (allowEncounters) {
    try {
      encounterResult = await rollEncounter(charId);
    } catch (err) {
      console.warn("⚠️ Encounter engine error:", err.message);
    }
  }

  console.log("🎯 Game Tick Complete");

  return {
    unlockedGates,
    encounterResult,
  };
}
