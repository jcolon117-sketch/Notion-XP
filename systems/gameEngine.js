import { processQuest } from "./questEngine.js";
import { updateProgression } from "./progressionEngine.js";
import { updateEnergy } from "./energySystem.js";
import { evaluateGates } from "./gateEngine.js";
import { generateQuestsFromGates } from "./generateQuestsFromGates.js";

export async function runGameTick(notion, charId, questId = null) {
  // 1. Process quest (if provided)
  if (questId) {
    await processQuest(notion, questId, charId);
  }

  // 2. Update XP / Level
  const progression = await updateProgression(notion, charId);

  // 3. Update Energy / Stamina
  await updateEnergy(notion, charId);

  // 4. Check gates
  const unlockedGates = await evaluateGates(notion, charId);

  // 5. Generate quests from gates
  if (unlockedGates.length > 0) {
    await generateQuestsFromGates(notion, unlockedGates, charId);
  }

  return {
    progression,
    unlockedGates
  };
}
