// resolveEncounter.js
import "dotenv/config";
import { Client } from "@notionhq/client";
import { giveRandomLoot } from "./lootTable.js";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const LOG_DB = process.env.ENCOUNTER_LOG_DB;
const CHAR_DB = process.env.NOTION_CHARACTERS_DB;

export async function resolveEncounter(characterId, encounter) {
  const props = encounter.properties;

  const xpReward = props["XP Reward"]?.number ?? 0;
  const goldReward = props["Gold Reward"]?.number ?? 0;
  const energyCost = props["Energy Cost"]?.number ?? 5;

  // 1. Fetch character
  const char = await notion.pages.retrieve({ page_id: characterId });
  const charProps = char.properties;

  const energy = charProps["Energy"]?.number ?? 100;
  if (energy < energyCost) {
    console.log("❌ Not enough energy for encounter.");
    return;
  }

  // Deduct energy
  await notion.pages.update({
    page_id: characterId,
    properties: { Energy: { number: energy - energyCost } }
  });

  let item = null;

  // Optional item drop
  if (props["Item Drop"]?.relation?.length > 0) {
    item = props["Item Drop"].relation[0].id;
    await giveRandomLoot(characterId);
  }

  // Award gold and XP
  const updatedXP = (charProps["Current XP"]?.number ?? 0) + xpReward;
  const updatedGold = (charProps["Gold"]?.number ?? 0) + goldReward;

  await notion.pages.update({
    page_id: characterId,
    properties: {
      "Current XP": { number: updatedXP },
      "Gold": { number: updatedGold }
    }
  });

  // Log it
  await notion.pages.create({
    parent: { database_id: LOG_DB },
    properties: {
      Character: { relation: [{ id: characterId }] },
      Encounter: { relation: [{ id: encounter.id }] },
      "XP Gained": { number: xpReward },
      "Gold Gained": { number: goldReward },
      "Item Gained": item ? { relation: [{ id: item }] } : undefined,
      Timestamp: { date: { start: new Date().toISOString() } }
    }
  });

  console.log("✔ Encounter resolved.");
}
