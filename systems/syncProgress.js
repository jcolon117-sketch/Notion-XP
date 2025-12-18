import { getCharacter } from "../notionClient.js";
import { applyXP } from "./progressionEngine.js";
import { regenEnergy } from "./regen.js";

export async function syncProgress(charId) {
  const character = await getCharacter(charId);

  if (!character) {
    throw new Error("Character not found");
  }

  await applyXP(character);
  await regenEnergy(character);

  return {
    level: character.level,
    xp: character.xp
  };
}
