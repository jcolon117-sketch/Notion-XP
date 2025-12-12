// energySystem.js
import { Client } from "@notionhq/client";
import "dotenv/config";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

/**
 * Regenerates energy/stamina based on time passed.
 */
export async function regenerateEnergy(characterId) {
  const page = await notion.pages.retrieve({ page_id: characterId });
  const props = page.properties;

  // Extract fields
  const maxEnergy = props["Max Energy"]?.number ?? 100;
  const currentEnergy = props["Current Energy"]?.number ?? 0;
  const energyRegenRate = props["Energy Regen Rate"]?.number ?? 2;

  const maxStamina = props["Max Stamina"]?.number ?? 100;
  const currentStamina = props["Current Stamina"]?.number ?? 0;
  const staminaRegenRate = props["Stamina Regen Rate"]?.number ?? 1;

  const lastRegen = props["Last Regen Timestamp"]?.date?.start;
  const now = new Date();

  let hoursPassed = 0;

  if (lastRegen) {
    const then = new Date(lastRegen);
    const diffMs = now - then;
    hoursPassed = diffMs / (1000 * 60 * 60); // ms → hours
  }

  // Only regenerate if time passed
  if (hoursPassed <= 0) return;

  const energyToAdd = Math.floor(energyRegenRate * hoursPassed);
  const staminaToAdd = Math.floor(staminaRegenRate * hoursPassed);

  const newEnergy = Math.min(maxEnergy, currentEnergy + energyToAdd);
  const newStamina = Math.min(maxStamina, currentStamina + staminaToAdd);

  await notion.pages.update({
    page_id: characterId,
    properties: {
      "Current Energy": { number: newEnergy },
      "Current Stamina": { number: newStamina },
      "Last Regen Timestamp": {
        date: { start: now.toISOString() }
      }
    }
  });

  return {
    energyAdded: energyToAdd,
    staminaAdded: staminaToAdd,
    finalEnergy: newEnergy,
    finalStamina: newStamina
  };
}