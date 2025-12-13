// systems/questBatchProcessor.js
import "dotenv/config";
import { Client } from "@notionhq/client";
import { processQuest } from "./processQuest.js";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const QUESTS_DB = process.env.QUESTS_DB;

if (!QUESTS_DB) {
  throw new Error("❌ QUESTS_DB environment variable not set");
}

async function fetchCompletedQuests() {
  const response = await notion.databases.query({
    database_id: QUESTS_DB,
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
