// systems/generateDailyQuests.js

import "dotenv/config";
import { notion } from "../notionClient.js";

const DAILY_DB = process.env.NOTION_DAILY_QUESTS_DB_ID;
const GATES_DB = process.env.NOTION_GATES_DB_ID;
const PLAYER_ID = process.env.NOTION_PLAYER_ID;

if (!DAILY_DB || !GATES_DB) {
  throw new Error("❌ Missing NOTION_DAILY_QUESTS_DB_ID or NOTION_GATES_DB_ID in .env");
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// ---------------------------
// Prevent duplicates per character per day
// ---------------------------
async function dailyAlreadyGenerated(charId) {
  const res = await notion.databases.query({
    database_id: DAILY_DB,
    filter: {
      and: [
        {
          property: "Character",
          relation: { contains: charId },
        },
        {
          property: "Date",
          date: { equals: todayISO() },
        },
      ],
    },
  });

  return res.results.length > 0;
}

// ---------------------------
// Fetch active gates for this character
// ---------------------------
async function fetchActiveGates(charId) {
  const res = await notion.databases.query({
    database_id: GATES_DB,
    filter: {
      and: [
        { property: "Active", checkbox: { equals: true } },
        { property: "User", relation: { contains: charId } },
        {
          property: "State",
          status: { does_not_equal: "Cleared" },
        },
      ],
    },
  });

  return res.results;
}

// ---------------------------
// Generator
// ---------------------------
export async function generateDailyQuests(charId) {
  console.log("📅 Daily Quest Generator running...");

  if (!charId) {
    throw new Error("❌ generateDailyQuests called without charId");
  }

  if (await dailyAlreadyGenerated(charId)) {
    console.log("⏭ Daily quests already exist for today");
    return;
  }

  const gates = await fetchActiveGates(charId);

  if (!gates.length) {
    console.log("⚠️ No active gates found");
    return;
  }

  for (const gate of gates) {
    const category = gate.properties.Category?.select?.name;
    if (!category) continue;

    // Decide quest template based on gate category
    const quest =
      category === "Workout"
        ? {
            title: "Daily Training Session",
            questType: "Workout",
            metric: "Time",
            xp: 20,
            energy: 15,
            devMinutes: 0,
            muayThaiMinutes: 30,
            notes: "Complete today's workout session.",
          }
        : {
            title: "Daily Game Dev Task",
            questType: "Game Dev",
            metric: "Task",
            xp: 25,
            energy: 10,
            devMinutes: 0,
            muayThaiMinutes: 0,
            notes: "Advance your game development work.",
          };

    const properties = {
      // Title property in Daily Quests DB is "Title"
      Title: {
        title: [{ text: { content: quest.title } }],
      },

      Status: {
        status: { name: "Available" },
      },

      Character: {
        relation: [{ id: charId }],
      },

      Gate: {
        relation: [{ id: gate.id }],
      },

      "Quest Type": {
        select: { name: quest.questType },
      },

      "Metric Type": {
        select: { name: quest.metric },
      },

      "XP Reward": {
        number: quest.xp,
      },

      "Energy Cost": {
        number: quest.energy,
      },

      Date: {
        date: { start: todayISO() },
      },

      Notes: {
        rich_text: [{ text: { content: quest.notes } }],
      },
    };

    // Only set metric fields that should exist;
    // Progress Value is a formula in Notion and must not be written directly.
    if (quest.metric === "Time") {
      properties["Dev Minutes"] = {
        number: quest.devMinutes,
      };
      properties["Muay Thai Minutes"] = {
        number: quest.muayThaiMinutes,
      };
    }

    await notion.pages.create({
      parent: { database_id: DAILY_DB },
      properties,
    });

    console.log(`✅ Daily quest created: ${quest.title}`);
  }

  console.log("🎯 Daily Quest Generation Complete");
}

// ---------------------------
// CLI support (local testing)
// ---------------------------
if (process.argv[1] && process.argv[1].includes("generateDailyQuests.js")) {
  const charId = PLAYER_ID;
  if (!charId) throw new Error("❌ NOTION_PLAYER_ID not set");
  generateDailyQuests(charId).catch(console.error);
}
