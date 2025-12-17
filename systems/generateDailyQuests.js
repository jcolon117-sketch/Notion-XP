// systems/generateDailyQuests.js
import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const NOTION_DAILY_QUESTS_DB_ID = process.env.NOTION_DAILY_QUESTS_DB_ID;

if (!NOTION_DAILY_QUESTS_DB_ID) {
  throw new Error("❌ NOTION_DAILY_QUESTS_DB_ID environment variable not set");
}

// ---------------------------
// Daily Quest Templates
// ---------------------------
const workoutRotation = [
  "Push",
  "Pull",
  "Legs",
  "Calisthenics",
  "Muay Thai",
];

const gameDevTasks = [
  "Implement third-person camera movement",
  "Refactor player movement controller",
  "Prototype enemy AI behavior",
  "Implement shooting mechanics",
  "Fix animation blending issues",
];

// ---------------------------
// Generator
// ---------------------------
export async function generateDailyQuests() {
  console.log("📅 Running Daily Quest Generator...");
  console.log("📘 Generating Daily Quests...");

  const today = new Date().toISOString().split("T")[0];
  const dayIndex = new Date().getDay();

  const workoutType = workoutRotation[dayIndex % workoutRotation.length];
  const gameDevTask = gameDevTasks[dayIndex % gameDevTasks.length];

  const quests = [
    {
      title: `Workout — ${workoutType}`,
      xp: 20,
      energy: 15,
      notes: `Complete today's ${workoutType} training session.`,
    },
    {
      title: `Game Dev — ${gameDevTask}`,
      xp: 25,
      energy: 10,
      notes: `Progress third-person shooter development task.`,
    },
  ];

  for (const quest of quests) {
    await notion.pages.create({
      parent: {
        database_id: NOTION_DAILY_QUESTS_DB_ID,
      },
      properties: {
        /* 🔑 TITLE PROPERTY — MUST MATCH NOTION EXACTLY */
        Title: {
          title: [
            {
              text: { content: quest.title },
            },
          ],
        },

        Status: {
          status: { name: "Not Started" },
        },

        "XP Reward": {
          number: quest.xp,
        },

        "Energy Cost": {
          number: quest.energy,
        },

        Date: {
          date: { start: today },
        },

        Notes: {
          rich_text: [
            {
              text: { content: quest.notes },
            },
          ],
        },
      },
    });
  }

  console.log("✅ Daily quests generated successfully");
}

// Allow direct CLI execution
if (process.argv[1].includes("generateDailyQuests.js")) {
  generateDailyQuests().catch((err) => {
    console.error("❌ Daily quest generation failed");
    console.error(err);
  });
}
