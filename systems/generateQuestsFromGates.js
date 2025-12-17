// systems/generateQuestsFromGates.js
import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const NOTION_GATES_DB_ID = process.env.NOTION_GATES_DB_ID;
const NOTION_QUESTS_DB_ID = process.env.NOTION_QUESTS_DB_ID;
if (!NOTION_GATES_DB_ID || !NOTION_QUESTS_DB_ID) {
  throw new Error("❌ Missing NOTION_GATES_DB_ID or NOTION_QUESTS_DB_ID environment variables");
}

// ---------------------------
// Fetch active Gates
// ---------------------------
async function fetchActiveGates() {
  const res = await notion.databases.query({
    database_id: NOTION_GATES_DB_ID,
    filter: {
      property: "Active",
      checkbox: { equals: true },
    },
  });

  return res.results;
}

// ---------------------------
// Quest templates per Gate
// ---------------------------
function buildMilestoneQuest(rank) {
  const templates = {
    E: {
      title: "Foundation of Discipline",
      difficulty: "Easy",
      xp: 100,
      metrics: "Complete 5 workouts in one week",
    },
    D: {
      title: "Strength Takes Shape",
      difficulty: "Normal",
      xp: 250,
      metrics: "Lift a total of 8,000 lb",
    },
    C: {
      title: "Endurance Forged",
      difficulty: "Hard",
      xp: 500,
      metrics: "Complete 150 calisthenics reps",
    },
    B: {
      title: "Combat Conditioning",
      difficulty: "Elite",
      xp: 800,
      metrics: "Train Muay Thai for 120 minutes",
    },
    A: {
      title: "Warrior Developer Balance",
      difficulty: "Elite",
      xp: 1200,
      metrics: "Complete workouts AND 10 hours of game dev",
    },
    S: {
      title: "Mastery of the Path",
      difficulty: "Legendary",
      xp: 2000,
      metrics: "Complete all 2-week Gates consecutively",
    },
  };

  return templates[rank] || null;
}

// ---------------------------
// Generator
// ---------------------------
export async function generateQuestsFromGates() {
  console.log("📜 Generating milestone Quests from Gates...");

  const gates = await fetchActiveGates();

  if (!gates.length) {
    console.log("⚠️ No active Gates found");
    return;
  }

  for (const gate of gates) {
    const rank = gate.properties.Rank?.select?.name;
    if (!rank) continue;

    const quest = buildMilestoneQuest(rank);
    if (!quest) continue;

    await notion.pages.create({
      parent: {
        database_id: NOTION_QUESTS_DB_ID,
      },
      properties: {
        Title: {
          title: [{ text: { content: quest.title } }],
        },

        Type: {
          select: { name: "Milestone" },
        },

        Difficulty: {
          select: { name: quest.difficulty },
        },

        Gate: {
          relation: [{ id: gate.id }],
        },

        Status: {
          status: { name: "Not Started" },
        },

        "XP Reward": {
          number: quest.xp,
        },

        "Required Metrics": {
          rich_text: [{ text: { content: quest.metrics } }],
        },

        Date: {
          date: {
            start: new Date().toISOString().split("T")[0],
          },
        },
      },
    });

    console.log(`✅ Quest created for Gate ${rank}`);
  }

  console.log("🎉 All milestone Quests generated");
}

// ---------------------------
// CLI support
// ---------------------------
if (process.argv[1].includes("generateQuestsFromGates.js")) {
  generateQuestsFromGates().catch((err) => {
    console.error("❌ Quest generation failed");
    console.error(err);
  });
}
