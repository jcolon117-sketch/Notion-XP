// systems/dailyInactivityCheck.js

import "dotenv/config";
import { notion } from "../notionClient.js";
import { INACTIVITY } from "../config/gameConfig.js";

const CHARACTER_DB = process.env.NOTION_CHARACTER_DB_ID;

if (!CHARACTER_DB) {
  throw new Error("❌ NOTION_CHARACTER_DB_ID environment variable not set");
}

function daysBetween(a, b) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((b - a) / MS_PER_DAY);
}

export async function applyInactivityPenalties() {
  console.log("🕒 Running inactivity penalty check...");

  const today = new Date();

  const characters = await notion.databases.query({
    database_id: CHARACTER_DB,
  });

  for (const char of characters.results) {
    const props = char.properties;
    const name = props.Name?.title?.[0]?.plain_text ?? "Character";

    const lastActive = props["Last Active Day"]?.date?.start;

    if (!lastActive) {
      console.log(`⚠️ ${name} has no Last Active Day — skipping`);
      continue;
    }

    const daysInactive = daysBetween(new Date(lastActive), today);

    if (daysInactive <= 0) {
      console.log(`🟢 ${name} active today — no penalty`);
      continue;
    }

    // Penalties are computed by formulas in Notion:
    // - Inactivity Penalty Stack
    // - XP Penalty %
    // - XP Modifier
    // - Energy Modifier
    // - Stamina Modifier
    // So we just log here.
    console.log(
      `⚠️ ${name} inactive for ${daysInactive} day(s) — Notion formulas will apply penalty`
    );
  }

  console.log("✅ Inactivity penalty pass complete");
}

// CLI
if (process.argv[1] && process.argv[1].includes("dailyInactivityCheck.js")) {
  applyInactivityPenalties().catch(console.error);
}