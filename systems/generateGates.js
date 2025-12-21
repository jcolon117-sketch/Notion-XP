// systems/generateGates.js
// Character-bound Gates with progression support

import "dotenv/config";
import { notion } from "../notionClient.js";

const GATES_DB = process.env.NOTION_GATES_DB_ID;
const PLAYER_ID = process.env.NOTION_PLAYER_ID;

if (!GATES_DB || !PLAYER_ID) {
  throw new Error("❌ Missing NOTION_GATES_DB_ID or NOTION_PLAYER_ID in .env");
}

// --------------------------------------------------
// Gate Templates (ORDERED)
// --------------------------------------------------
const GATE_TEMPLATES = [
  { rank: "E", xp: 100, energy: 5, boss: ["Training Drone", 5, "Persistence"] },
  { rank: "D", xp: 250, energy: 10, boss: ["Iron Sentinel", 20, "Technique"] },
  { rank: "C", xp: 500, energy: 15, boss: ["Shadow Stalker", 45, "Awareness"] },
  { rank: "B", xp: 1000, energy: 20, boss: ["Abyss Knight", 80, "Discipline"] },
  { rank: "A", xp: 2000, energy: 30, boss: ["Dominion Warden", 140, "Focus"] },
  { rank: "S", xp: 4000, energy: 50, boss: ["Eclipse Sovereign", 250, "Transcendence"] },
];

// --------------------------------------------------
// Helpers
// --------------------------------------------------
async function gateExists(rank) {
  const res = await notion.databases.query({
    database_id: GATES_DB,
    filter: {
      and: [
        { property: "Rank", select: { equals: rank } },
        { property: "User", relation: { contains: PLAYER_ID } },
      ],
    },
  });
  return res.results.length > 0;
}

// --------------------------------------------------
// Main Generator
// --------------------------------------------------
export async function generateGates() {
  console.log("🚪 Generating Gates for Character...");

  for (let i = 0; i < GATE_TEMPLATES.length; i++) {
    const gate = GATE_TEMPLATES[i];

    if (await gateExists(gate.rank)) {
      console.log(`⏭ Gate ${gate.rank} already exists`);
      continue;
    }

    const isFirst = i === 0;

    await notion.pages.create({
      parent: { database_id: GATES_DB },
      properties: {
        // Title property in Gates DB is "Title"
        Title: {
          title: [{ text: { content: `Gate ${gate.rank}` } }],
        },

        // Ownership (relation to Character DB)
        User: {
          relation: [{ id: PLAYER_ID }],
        },

        // Core progression
        Rank: { select: { name: gate.rank } },
        Tier: { select: { name: gate.rank } },
        "Gate Type": {
          select: { name: i === GATE_TEMPLATES.length - 1 ? "Boss" : "Normal" },
        },

        // Rewards / requirements
        "XP Reward": { number: gate.xp },
        "Energy Cost": { number: gate.energy },

        // State
        Active: { checkbox: isFirst }, // only E starts active
        State: { status: { name: isFirst ? "Unlocking" : "Locked" } },

        // Cycle
        Cycle: { number: 1 },

        // Boss metadata
        "Boss Name": {
          rich_text: [{ text: { content: gate.boss[0] } }],
        },
        "Boss Power": { number: gate.boss[1] },
        "Boss Weakness": { select: { name: gate.boss[2] } },
      },
    });

    console.log(`✅ Gate ${gate.rank} created`);
  }

  console.log("🎉 Gate generation complete");
}

// --------------------------------------------------
// CLI (local)
// --------------------------------------------------
if (process.argv[1] && process.argv[1].includes("generateGates.js")) {
  generateGates().catch(console.error);
}