// systems/questBatchProcessor.js
import "dotenv/config";
import { Client } from "@notionhq/client";
import { processQuest } from "./processQuest.js";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const NOTION_QUESTS_DB_ID = process.env.NOTION_QUESTS_DB_ID;

if (!NOTION_QUESTS_DB_ID) {
  throw new Error("❌ NOTION_QUESTS_DB_ID environment variable not set");
}

async function fetchCompletedQuests() {
  const response = await notion.databases.query({
    database_id: NOTION_QUESTS_DB_ID,
    filter: {
      property: "Status",
      status: { equals: "Completed" },
    },
  });

  return response.results;
}

export async function runQuestBatch() {
  console.log("🔄 Running Quest Batch Processor...");

  const quests = await fetchCompletedQuests();

  if (!quests.length) {
    console.log("✅ No completed quests found.");
    return;
  }

  console.log(`📌 Found ${quests.length} completed quest(s).`);

  for (const quest of quests) {
    await processQuest(quest);
  }

  console.log("🎉 Quest batch processing complete.");
}

/* ─────────────────────────────── */
/* CLI ENTRY                        */
/* ─────────────────────────────── */

runQuestBatch().catch(err => {
  console.error("❌ Quest batch processor failed");
  console.error(err);
});
