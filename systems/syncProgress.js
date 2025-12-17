// systems/syncProgress.js
import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const NOTION_DAILY_QUESTS_DB_ID = process.env.NOTION_DAILY_QUESTS_DB_ID;
const NOTION_GATES_DB_ID = process.env.NOTION_GATES_DB_ID;

// Fetch completed Daily Quests that haven't been processed
async function fetchCompletedDailyQuests() {
  const res = await notion.databases.query({
    database_id: NOTION_DAILY_QUESTS_DB_ID,
    filter: {
      and: [
        { property: "Status", status: { equals: "Completed" } },
        { property: "Processed", checkbox: { equals: false } }
      ]
    }
  });
  return res.results;
}

// Apply progress to gate
async function applyProgressToGate(dailyQuest) {
  const gateRel = dailyQuest.properties.Gate.relation;
  if (!gateRel.length) return;

  const gateId = gateRel[0].id;
  const progressValue = dailyQuest.properties["Progress Value"].number || 0;

  const gatePage = await notion.pages.retrieve({ page_id: gateId });
  const current = gatePage.properties["Progress %"].number || 0;

  const updated = Math.min(100, current + progressValue);

  await notion.pages.update({
    page_id: gateId,
    properties: {
      "Progress %": { number: updated }
    }
  });

  // Mark Daily Quest processed
  await notion.pages.update({
    page_id: dailyQuest.id,
    properties: {
      Processed: { checkbox: true }
    }
  });

  console.log(`🔁 Added ${progressValue}% progress to Gate`);
}

export async function syncProgress() {
  console.log("🔄 Syncing Daily Quest progress...");
  const quests = await fetchCompletedDailyQuests();

  for (const q of quests) {
    await applyProgressToGate(q);
  }

  console.log("✅ Progress sync complete");
}

// CLI support
if (process.argv[1].includes("syncProgress.js")) {
  syncProgress().catch(console.error);
}
