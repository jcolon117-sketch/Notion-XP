// systems/resetDailyQuests.js
import "dotenv/config";
import { Client } from "@notionhq/client";

console.log("🔥 resetDailyQuests.js loaded");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DAILY_QUESTS_DB = process.env.DAILY_QUESTS_DB;

// -----------------------------
// Safe database query wrapper
// -----------------------------
async function queryDatabase(databaseId) {
  // New SDK (v2+)
  if (notion.databases?.query) {
    return notion.databases.query({
      database_id: databaseId,
    });
  }

  // Old SDK (fallback)
  if (notion.queryDatabase) {
    return notion.queryDatabase({
      database_id: databaseId,
    });
  }

  throw new Error("Unsupported Notion SDK version");
}

// -----------------------------
// Fetch daily quests
// -----------------------------
async function fetchDailyQuests() {
  const response = await queryDatabase(DAILY_QUESTS_DB);
  return response.results ?? [];
}

// -----------------------------
// Reset logic
// -----------------------------
async function resetDailyQuests() {
  console.log("🔄 Resetting daily quests...");

  const quests = await fetchDailyQuests();

  if (!quests.length) {
    console.log("⚠️ No daily quests found.");
    return;
  }

  for (const quest of quests) {
    await notion.pages.update({
      page_id: quest.id,
      properties: {
        Status: {
          status: { name: "Not Started" },
        },
      },
    });
  }

  console.log(`✅ Reset ${quests.length} daily quest(s).`);
}

// -----------------------------
// Run immediately
// -----------------------------
resetDailyQuests().catch((err) => {
  console.error("❌ Daily reset failed:", err?.body ?? err);
});
