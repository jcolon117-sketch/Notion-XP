// systems/encounterEngine.js
// FULL SOLO-LEVELING STYLE ENCOUNTER ENGINE

import "dotenv/config";
import { notion } from "../notionClient.js";

const ENCOUNTERS_DB = process.env.NOTION_ENCOUNTERS_DB_ID;
const ENCOUNTER_LOGS_DB = process.env.NOTION_ENCOUNTER_LOGS_DB_ID;
const CHARACTER_DB = process.env.NOTION_CHARACTER_DB_ID;
const LOGS_DB = process.env.NOTION_RPG_LOGS_DB_ID;

if (!ENCOUNTERS_DB || !ENCOUNTER_LOGS_DB || !CHARACTER_DB || !LOGS_DB) {
  throw new Error("❌ Missing required DB IDs for encounter engine");
}

// ------------------------------------------------------------
// Utility: Weighted random selection
// ------------------------------------------------------------
function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  let roll = Math.random() * totalWeight;

  for (const item of items) {
    roll -= item.weight ?? 1;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

// ------------------------------------------------------------
// Fetch character
// ------------------------------------------------------------
async function fetchCharacter(charId) {
  return await notion.pages.retrieve({ page_id: charId });
}

// ------------------------------------------------------------
// Fetch eligible encounters
// ------------------------------------------------------------
async function fetchEligibleEncounters(charLevel) {
  const res = await notion.databases.query({
    database_id: ENCOUNTERS_DB,
    filter: {
      and: [
        { property: "Active", checkbox: { equals: true } },
        { property: "Min Level", number: { less_than_or_equal_to: charLevel } },
        { property: "Max Level", number: { greater_than_or_equal_to: charLevel } },
      ],
    },
  });

  return res.results.map((page) => {
    const p = page.properties;
    return {
      id: page.id,
      title: p.Title?.title?.[0]?.plain_text ?? "Unknown Encounter",
      type: p.Type?.select?.name ?? "Unknown",
      weight: p.Weight?.number ?? 1,
      xp: p["XP Reward"]?.number ?? 0,
      statCheck: p["Stat Check"]?.select?.name ?? null,
      difficulty: p["Stat Difficulty"]?.number ?? 0,
      energyCost: p["Energy Cost"]?.number ?? 0,
      tier: p["Difficulty Tier"]?.select?.name ?? "Normal",
      rank: p["Encounter Rank"]?.select?.name ?? "E",
    };
  });
}

// ------------------------------------------------------------
// Apply XP to character (simple helper)
// ------------------------------------------------------------
async function applyXP(charPage, xpGain) {
  const props = charPage.properties;

  const level = props.Level?.number ?? 1;
  const xp = props.XP?.number ?? 0;

  const xpModifier = props["XP Modifier"]?.formula?.number ?? 1;
  const fatigueModifier = props["Fatigue Modifier"]?.formula?.number ?? 1;

  const effectiveXP = Math.floor(xpGain * xpModifier * fatigueModifier);

  const newXP = xp + effectiveXP;

  await notion.pages.update({
    page_id: charPage.id,
    properties: {
      XP: { number: newXP },
      "Last Active Day": { date: { start: new Date().toISOString() } },
    },
  });

  return effectiveXP;
}

// ------------------------------------------------------------
// Log encounter result
// ------------------------------------------------------------
async function logEncounter({
  charId,
  encounterId,
  encounterTitle,
  result,
  xpDelta,
  energySpent,
  staminaSpent,
}) {
  await notion.pages.create({
    parent: { database_id: ENCOUNTER_LOGS_DB },
    properties: {
      Title: {
        title: [{ text: { content: `Encounter: ${encounterTitle}` } }],
      },
      Character: { relation: [{ id: charId }] },
      Encounter: { relation: [{ id: encounterId }] },
      Result: { select: { name: result } },
      "XP Gained": { number: xpDelta },
      "Energy Spent": { number: energySpent },
      "Stamina Spent": { number: staminaSpent },
      Timestamp: { date: { start: new Date().toISOString() } },
    },
  });

  // Also log to RPG Logs DB
  await notion.pages.create({
    parent: { database_id: LOGS_DB },
    properties: {
      Title: {
        title: [{ text: { content: `Encounter: ${encounterTitle}` } }],
      },
      Type: { select: { name: "ENCOUNTER" } },
      User: { relation: [{ id: charId }] },
      Details: {
        rich_text: [
          {
            text: {
              content: `${result} | XP: ${xpDelta} | Energy: -${energySpent}`,
            },
          },
        ],
      },
      Timestamp: { date: { start: new Date().toISOString() } },
      "XP Delta": { number: xpDelta },
      "Energy Delta": { number: -energySpent },
      "Stamina Delta": { number: -staminaSpent },
    },
  });
}

// ------------------------------------------------------------
// Main Encounter Engine
// ------------------------------------------------------------
export async function rollEncounter(charId) {
  console.log("🎲 Rolling encounter...");

  const charPage = await fetchCharacter(charId);
  const props = charPage.properties;

  const charLevel = props.Level?.number ?? 1;
  const energy = props.Energy?.number ?? 0;

  // 1️⃣ Fetch eligible encounters
  const encounters = await fetchEligibleEncounters(charLevel);

  if (!encounters.length) {
    console.log("⚠️ No encounters available for this level");
    return null;
  }

  // 2️⃣ Weighted random selection
  const encounter = weightedRandom(encounters);

  // 3️⃣ Check energy cost
  if (energy < encounter.energyCost) {
    console.log("⚠️ Not enough energy for encounter");
    return null;
  }

  // 4️⃣ Apply energy cost
  await notion.pages.update({
    page_id: charId,
    properties: {
      Energy: { number: energy - encounter.energyCost },
    },
  });

  // 5️⃣ Stat check (if any)
  let result = "Neutral";
  let xpDelta = 0;

  if (encounter.statCheck) {
    const statName = encounter.statCheck;
    const statValue = props[statName]?.number ?? 0;

    if (statValue >= encounter.difficulty) {
      result = "Success";
      xpDelta = encounter.xp;
    } else {
      result = "Failure";
      xpDelta = Math.floor(encounter.xp * 0.25);
    }
  } else {
    // No stat check → neutral XP
    xpDelta = Math.floor(encounter.xp * 0.5);
  }

  // 6️⃣ Apply XP
  const effectiveXP = await applyXP(charPage, xpDelta);

  // 7️⃣ Log encounter
  await logEncounter({
    charId,
    encounterId: encounter.id,
    encounterTitle: encounter.title,
    result,
    xpDelta: effectiveXP,
    energySpent: encounter.energyCost,
    staminaSpent: 0,
  });

  console.log(`🎯 Encounter result: ${result} (+${effectiveXP} XP)`);

  return {
    title: encounter.title,
    result,
    xp: effectiveXP,
    energyCost: encounter.energyCost,
  };
}