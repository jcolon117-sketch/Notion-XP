// scheduler.js
import "dotenv/config";
import cron from "node-cron";
import { processAllCompletedQuests } from "./awardXP.js";
import { generateEncounter } from "./encounterGenerator.js";
import { resolveEncounter } from "./resolveEncounter.js";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

console.log("Scheduler starting...");

// ------------------------------
// 1) XP + Quest Processing Job
// ------------------------------
cron.schedule("*/5 * * * *", async () => {
  console.log("⏱ Running XP/Quest processing job...");
  try {
    await processAllCompletedQuests();
    console.log("✅ XP job complete.");
  } catch (err) {
    console.error("❌ XP job error:", err.body ?? err);
  }
});

// ------------------------------
// 2) Random Encounter Roll
// ------------------------------
cron.schedule("*/30 * * * *", async () => {
  console.log("⏳ Rolling for random encounter...");

  const characterId = process.env.MAIN_CHARACTER_ID;
  if (!characterId) return console.error("❌ MAIN_CHARACTER_ID missing");

  try {
    // Pull character to get their level
    const character = await notion.pages.retrieve({ page_id: characterId });
    const level = character.properties["Current Level"]?.number ?? 1;

    // Roll encounter from Encounter Templates DB
    const encounter = await generateEncounter(level);
    if (!encounter) {
      console.log("No encounter triggered.");
      return;
    }

    console.log(
      "🔥 Encounter triggered:",
      encounter.properties.Name.title[0].plain_text
    );

    // Resolve encounter + log it
    await resolveEncounter(characterId, encounter);

  } catch (err) {
    console.error("❌ Encounter roll error:", err.body ?? err);
  }
});

console.log("Scheduler is running.");
