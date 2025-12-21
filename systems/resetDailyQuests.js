// systems/resetDailyQuests.js

import "dotenv/config";
import { notion } from "../notionClient.js";

const DAILY_DB = process.env.NOTION_DAILY_QUESTS_DB_ID;

if (!DAILY_DB) {
  throw new Error("❌ NOTION_DAILY_QUESTS_DB_ID not set");
}

// ---------------------------
// Helpers
// ---------------------------
function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// ---------------------------
// Main Reset Logic
// ---------------------------
export async function resetDailyQuests() {
  console.log("🔄 Resetting Daily Quests...");

  const today = todayISO();

  const response = await notion.databases.query({
    database_id: DAILY_DB,
    filter: {
      property: "Date",
      date: { equals: today },
    },
  });

  console.log(`📘 Found ${response.results.length} daily quests for today`);

  let resetCount = 0;

  for (const page of response.results) {
    const props = page.properties;
    const status = props.Status?.status?.name;

    // If already in base state (Available), skip
    if (status === "Available") continue;

    await notion.pages.update({
      page_id: page.id,
      properties: {
        Status: { status: { name: "Available" } },
        Completed: { checkbox: false },
      },
    });

    resetCount++;

    const title =
      props.Title?.title?.[0]?.plain_text ??
      props.Name?.title?.[0]?.plain_text ??
      "(Untitled Quest)";

    console.log(`♻️ Reset: ${title}`);
  }

  console.log(`✅ Daily Quest Reset Complete — ${resetCount} reset`);
}

// ---------------------------
// CLI Support
// ---------------------------
if (process.argv[1] && process.argv[1].includes("resetDailyQuests.js")) {
  resetDailyQuests().catch((err) => {
    console.error("❌ Daily quest reset failed");
    console.error(err);
  });
}