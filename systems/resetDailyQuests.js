// systems/resetDailyQuests.js
import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DAILY_DB = process.env.DAILY_QUESTS_DB;

// --------------------------------
// Fetch all daily quests
// --------------------------------
async function fetchDailyQuests() {
  const res = await notion.databases.query({
    database_id: DAILY_DB
  });
  return res.results;
}

// --------------------------------
// Reset daily quests
// --------------------------------
async function resetDailyQuests() {
  console.log("🔄 Resetting daily quests...");

  const quests = await fetchDailyQuests();
  const today = new Date().toISOString().split("T")[0];

  for (const quest of quests) {
    await notion.pages.update({
      page_id: quest.id,
      properties: {
        Status: { status: { name: "To Do" } },
        Date: { date: { start: today } }
      }
    });
  }

  console.log(`✅ Reset ${quests.length} daily quests`);
}

// --------------------------------
// Run
// --------------------------------
resetDailyQuests().catch(err => {
  console.error("❌ Daily reset failed:", err.body ?? err);
  process.exit(1);
});
