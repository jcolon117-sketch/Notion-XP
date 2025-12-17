// systems/generateGates.js
// FULL PATCH — Gates + Bosses
// --------------------------------------------------
// Creates progression Gates (E → S) with Boss metadata
// Safe to re-run (skips existing gates by Name)

import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const NOTION_GATES_DB_ID = process.env.NOTION_GATES_DB_ID;

if (!NOTION_GATES_DB_ID) {
  throw new Error("❌ NOTION_GATES_DB_ID environment variable not set");
}

// --------------------------------------------------
// Gate Templates (ORDERED)
// --------------------------------------------------
// IMPORTANT: Property names MUST match Notion EXACTLY
// Required properties in Gates DB:
// - Name (title)
// - Rank (select)
// - Required XP (number)
// - Required Stat (select)
// - Energy Cost (number)
// - Cooldown (number)
// - Boss Name (rich_text)
// - Boss Power (number)
// - Boss Weakness (select)
// - State (status)  -> LOCKED | UNLOCKING | CLEARED

const GATE_TEMPLATES = [
  {
    rank: "E",
    requiredXP: 0,
    requiredStat: "None",
    energyCost: 5,
    cooldown: 0,
    boss: {
      name: "Training Drone",
      power: 5,
      weakness: "Persistence",
    },
  },
  {
    rank: "D",
    requiredXP: 100,
    requiredStat: "Strength",
    energyCost: 10,
    cooldown: 2,
    boss: {
      name: "Iron Sentinel",
      power: 20,
      weakness: "Technique",
    },
  },
  {
    rank: "C",
    requiredXP: 300,
    requiredStat: "Agility",
    energyCost: 15,
    cooldown: 4,
    boss: {
      name: "Shadow Stalker",
      power: 45,
      weakness: "Awareness",
    },
  },
  {
    rank: "B",
    requiredXP: 700,
    requiredStat: "Endurance",
    energyCost: 20,
    cooldown: 8,
    boss: {
      name: "Abyss Knight",
      power: 80,
      weakness: "Discipline",
    },
  },
  {
    rank: "A",
    requiredXP: 1500,
    requiredStat: "Willpower",
    energyCost: 30,
    cooldown: 16,
    boss: {
      name: "Dominion Warden",
      power: 140,
      weakness: "Focus",
    },
  },
  {
    rank: "S",
    requiredXP: 3000,
    requiredStat: "Mastery",
    energyCost: 50,
    cooldown: 24,
    boss: {
      name: "Eclipse Sovereign",
      power: 250,
      weakness: "Transcendence",
    },
  },
];

// --------------------------------------------------
// Helpers
// --------------------------------------------------
async function gateExists(rank) {
  const res = await notion.databases.query({
    database_id: NOTION_GATES_DB_ID,
    filter: {
      property: "Rank",
      select: { equals: rank },
    },
  });
  return res.results.length > 0;
}

// --------------------------------------------------
// Main Generator
// --------------------------------------------------
export async function generateGates() {
  console.log("🚪 Checking Gates database...");

  let createdAny = false;

  for (const gate of GATE_TEMPLATES) {
    const exists = await gateExists(gate.rank);
    if (exists) {
      console.log(`⏭️  Gate ${gate.rank} already exists — skipping`);
      continue;
    }

    console.log(`🧱 Creating Gate ${gate.rank}...`);

    await notion.pages.create({
      parent: { database_id: NOTION_GATES_DB_ID },
      properties: {
        // Title
        title: {
          title: [{ text: { content: `Gate ${gate.rank}` } }],
        },

        // Rank
        Rank: {
          select: { name: gate.rank },
        },

        // Requirements
        "Required XP": { number: gate.requiredXP },
        "Required Stat": { select: { name: gate.requiredStat } },
        "Energy Cost": { number: gate.energyCost },
        Cooldown: { number: gate.cooldown },

        // Boss Metadata
        "Boss Name": {
          rich_text: [{ text: { content: gate.boss.name } }],
        },
        "Boss Power": { number: gate.boss.power },
        "Boss Weakness": { select: { name: gate.boss.weakness } },

        // State
        State: {
          status: { name: "LOCKED" },
        },
      },
    });

    console.log(`✅ Gate ${gate.rank} created`);
    createdAny = true;
  }

  if (!createdAny) {
    console.log("✔️ All Gates already exist — nothing to generate");
  } else {
    console.log("🎉 All Gates generated successfully");
  }
}

// --------------------------------------------------
// CLI Support
// --------------------------------------------------
if (process.argv[1].includes("generateGates.js")) {
  generateGates().catch((err) => {
    console.error("❌ Gate generation failed");
    console.error(err);
  });
}
