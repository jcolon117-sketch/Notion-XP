// systems/syncProgress.js
// MASTER SYNC ORCHESTRATOR — Option A (Full Game Tick)

import "dotenv/config";
import { runGameTick } from "./gameEngine.js";
import { notion } from "../notionClient.js";

/**
 * syncProgress(charId)
 *
 * This is the SINGLE entry point for syncing a character’s entire RPG state.
 * It performs:
 *  - Inactivity penalty check
 *  - Daily quest generation (if needed)
 *  - Quest batch processing
 *  - Gate evaluation
 *  - Gate quest generation
 *  - Encounter roll
 *  - Weekly XP updates (via Notion formulas)
 *  - Logging
 *
 * All subsystems are handled inside runGameTick().
 */
export async function syncProgress(charId, options = {}) {
  if (!charId) {
    throw new Error("syncProgress() called without charId");
  }

  console.log(`\n🔄 SYNC START for Character: ${charId}`);

  // Run the full game tick
  const result = await runGameTick(charId, {
    generateDailies: options.generateDailies ?? false,
    allowEncounters: options.allowEncounters ?? true,
  });

  console.log("✅ SYNC COMPLETE");

  return {
    ok: true,
    ...result,
  };
}