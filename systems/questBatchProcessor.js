// systems/questBatchProcessor.js
// Processes completed quests: applies XP, stats, logs, and prevents double-processing

import "dotenv/config";
import { notion } from "../notionClient.js";

// -----------------------------
// ENV & DB IDs
// -----------------------------
const QUESTS_DB = process.env.NOTION_QUESTS_DB_ID;
const CHARACTER_DB = process.env.NOTION_CHARACTER_DB_ID;
const STATS_DB = process.env.NOTION_STATS_DB_ID;
const LOGS_DB = process.env.NOTION_RPG_LOGS_DB_ID;

if (!QUESTS_DB || !CHARACTER_DB || !STATS_DB || !LOGS_DB) {
  throw new Error(
    "❌ Missing one or more DB IDs: NOTION_QUESTS_DB_ID, NOTION_CHARACTER_DB_ID, NOTION_STATS_DB_ID, NOTION_RPG_LOGS_DB_ID"
  );
}

// -----------------------------
// XP curve helper (matches Notion-ish curve if needed)
// If you want to match your Character DB "Next Level XP" exactly,
// you can copy that formula here. For now, we use the same base formula:
// floor(100 * 1.25^(level - 1))
// -----------------------------
function nextLevelXpFor(level) {
  if (level <= 1) return 100;
  return Math.floor(100 * Math.pow(1.25, level - 1));
}

// -----------------------------
// Fetch quests that are completed but not yet processed
// Condition:
//   Status == "Completed"
//   AND (XP Earned is empty OR XP Earned == 0)
// -----------------------------
async function fetchPendingQuests() {
  const res = await notion.databases.query({
    database_id: QUESTS_DB,
    filter: {
      and: [
        {
          property: "Status",
          status: { equals: "Completed" },
        },
        {
          or: [
            {
              property: "XP Earned",
              number: { is_empty: true },
            },
            {
              property: "XP Earned",
              number: { equals: 0 },
            },
          ],
        },
      ],
    },
  });

  return res.results;
}

// -----------------------------
// Fetch a character by ID
// -----------------------------
async function fetchCharacter(charId) {
  const page = await notion.pages.retrieve({ page_id: charId });
  return page;
}

// -----------------------------
// Apply XP to a character:
// - Read Level, XP, XP Modifier, Fatigue Modifier, Next Level XP
// - Compute XP gain with modifiers
// - Loop through level-ups
// - Update XP, Level, Unspent Stat Points, Last Active Day
// Returns { xpGain, levelsGained, newLevel }
// -----------------------------
async function applyQuestXpToCharacter(characterPage, baseXpGain) {
  const props = characterPage.properties;

  const level = props.Level?.number ?? 1;
  const xp = props.XP?.number ?? 0;

  // Formula fields
  const xpModifier = props["XP Modifier"]?.formula?.number ?? 1;
  const fatigueModifier = props["Fatigue Modifier"]?.formula?.number ?? 1;

  const unspent = props["Unspent Stat Points"]?.number ?? 0;

  // Effective XP gain
  const effectiveXpGain = Math.floor(baseXpGain * xpModifier * fatigueModifier);

  let newLevel = level;
  let newXp = xp + effectiveXpGain;

  // Use same curve as Notion's Next Level XP formula
  let nextLevelXp = nextLevelXpFor(newLevel);

  let levelsGained = 0;
  while (newXp >= nextLevelXp) {
    newXp -= nextLevelXp;
    newLevel += 1;
    levelsGained += 1;
    nextLevelXp = nextLevelXpFor(newLevel);
  }

  const newUnspent = unspent + levelsGained * 5;

  // Update character
  const todayISO = new Date().toISOString().split("T")[0];

  await notion.pages.update({
    page_id: characterPage.id,
    properties: {
      XP: { number: newXp },
      Level: { number: newLevel },
      "Unspent Stat Points": { number: newUnspent },
      "Last Active Day": { date: { start: todayISO } },
    },
  });

  return {
    xpGain: effectiveXpGain,
    levelsGained,
    newLevel,
  };
}

// -----------------------------
// Apply stat reward to Stats DB
// - Finds Stat row by Name (Strength, Agility, etc.)
// - Increments Allocated Points by Stat Amount
// Returns { statName, statAmount } or null if no stat reward
// -----------------------------
async function applyStatReward(statName, statAmount) {
  if (!statName || !statAmount || statAmount <= 0) {
    return null;
  }

  // Find the stat row by Name
  const res = await notion.databases.query({
    database_id: STATS_DB,
    filter: {
      property: "Name",
      title: {
        equals: statName,
      },
    },
  });

  if (!res.results.length) {
    console.warn(`⚠️ No Stat row found for "${statName}" in Stats DB`);
    return null;
  }

  const statPage = res.results[0];
  const props = statPage.properties;
  const currentAllocated = props["Allocated Points"]?.number ?? 0;

  const newAllocated = currentAllocated + statAmount;

  await notion.pages.update({
    page_id: statPage.id,
    properties: {
      "Allocated Points": { number: newAllocated },
    },
  });

  return {
    statName,
    statAmount,
  };
}

// -----------------------------
// Log quest resolution in RPG Logs DB
// -----------------------------
async function logQuestResolution({
  characterId,
  questId,
  questTitle,
  xpDelta,
  levelsGained,
  statName,
  statAmount,
}) {
  const detailsParts = [];

  if (xpDelta > 0) {
    detailsParts.push(`+${xpDelta} XP`);
  }
  if (levelsGained > 0) {
    detailsParts.push(`Level up x${levelsGained}`);
  }
  if (statName && statAmount) {
    detailsParts.push(`+${statAmount} ${statName}`);
  }

  const detailsText =
    detailsParts.length > 0
      ? detailsParts.join(" | ")
      : "Quest processed. No rewards applied.";

  const timestamp = new Date().toISOString();

  await notion.pages.create({
    parent: { database_id: LOGS_DB },
    properties: {
      Title: {
        title: [
          {
            text: {
              content: `Quest Reward: ${questTitle}`,
            },
          },
        ],
      },
      Type: {
        select: {
          name: "XP_GAIN",
        },
      },
      User: {
        relation: [{ id: characterId }],
      },
      Quests: {
        relation: [{ id: questId }],
      },
      Details: {
        rich_text: [
          {
            text: {
              content: detailsText,
            },
          },
        ],
      },
      Timestamp: {
        date: {
          start: timestamp,
        },
      },
      "XP Delta": {
        number: xpDelta,
      },
      "Energy Delta": {
        number: 0,
      },
      "Stamina Delta": {
        number: 0,
      },
      "Stat Affected": {
        select: {
          name: statName || "None",
        },
      },
      "Stat Delta": {
        number: statAmount || 0,
      },
    },
  });
}

// -----------------------------
// Process a single quest
// -----------------------------
async function processQuest(questPage) {
  const props = questPage.properties;

  const questTitle =
    props.Title?.title?.[0]?.plain_text ?? props.Name?.title?.[0]?.plain_text ?? "Quest";

  const xpReward = props["XP Reward"]?.number ?? 0;

  const difficultyModifier =
    props["Difficulty XP Modifier"]?.formula?.number ?? 1;

  const baseXpGain = Math.floor(xpReward * difficultyModifier);

  // Assigned To (Character relation)
  const assigned = props["Assigned To"]?.relation ?? [];
  if (!assigned.length) {
    console.warn(`⚠️ Quest "${questTitle}" has no Assigned To relation, skipping`);
    return;
  }

  const characterId = assigned[0].id;

  // Fetch character
  const characterPage = await fetchCharacter(characterId);

  // Apply XP
  const xpResult = await applyQuestXpToCharacter(characterPage, baseXpGain);

  // Stat reward
  const statName = props["Stat Reward"]?.select?.name ?? null;
  const statAmount = props["Stat Amount"]?.number ?? 0;

  let statResult = null;
  if (statName && statAmount > 0) {
    statResult = await applyStatReward(statName, statAmount);
  }

  // Mark quest as processed:
  // - XP Earned = xpResult.xpGain
  // - Completed At = now (if not already set)
  const nowISO = new Date().toISOString();

  await notion.pages.update({
    page_id: questPage.id,
    properties: {
      "XP Earned": { number: xpResult.xpGain },
      "Completed At": props["Completed At"]?.date
        ? props["Completed At"]
        : { date: { start: nowISO } },
    },
  });

  // Log
  await logQuestResolution({
    characterId,
    questId: questPage.id,
    questTitle,
    xpDelta: xpResult.xpGain,
    levelsGained: xpResult.levelsGained,
    statName: statResult?.statName ?? statName,
    statAmount: statResult?.statAmount ?? statAmount,
  });

  console.log(
    `✅ Processed quest "${questTitle}" → +${xpResult.xpGain} XP, +${statAmount || 0} ${
      statName || ""
    }`
  );
}

// -----------------------------
// Public entry point
// -----------------------------
export async function runQuestBatch() {
  console.log("📦 Running quest batch processor...");

  const pendingQuests = await fetchPendingQuests();

  if (!pendingQuests.length) {
    console.log("ℹ️ No completed quests pending processing");
    return;
  }

  console.log(`🎯 Found ${pendingQuests.length} quest(s) to process`);

  for (const questPage of pendingQuests) {
    try {
      await processQuest(questPage);
    } catch (err) {
      console.error(
        `❌ Failed to process quest ${questPage.id}`,
        err
      );
    }
  }

  console.log("✅ Quest batch processing complete");
}

// -----------------------------
// CLI support (local testing)
// -----------------------------
if (process.argv[1] && process.argv[1].includes("questBatchProcessor.js")) {
  runQuestBatch().catch(console.error);
}

