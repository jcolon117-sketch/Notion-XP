// systems/dailyInactivityCheck.js

import "dotenv/config";
import { Client } from "@notionhq/client";
import { calculateInactivityPenalty } from "./inactivityPenalty.js";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const NOTION_USER_DB_ID = process.env.NOTION_USER_DB_ID;

if (!NOTION_USER_DB_ID) {
  throw new Error("❌ NOTION_USER_DB_ID environment variable not set");
}

function daysBetween(dateA, dateB) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((dateB - dateA) / MS_PER_DAY);
}

export async function applyInactivityPenalties() {
  console.log("🕒 Running inactivity penalty check...");

  const today = new Date();

  const characters = await notion.databases.query({
    database_id: NOTION_USER_DB_ID,
  });

  for (const char of characters.results) {
    const props = char.properties;

    const lastActive = props["Last Active Date"]?.date?.start;
    if (!lastActive) continue;

    const daysMissed = daysBetween(
      new Date(lastActive),
      today
    );

    if (daysMissed <= 0) continue;

    const stacks = Math.min(daysMissed, 3);
    const modifier = calculateInactivityPenalty(stacks);

    await notion.pages.update({
      page_id: char.id,
      properties: {
        "Inactivity Penalty Stacks": { number: stacks },
        "XP Modifier": { number: modifier },
        "Energy Modifier": { number: modifier },
        "Stamina Modifier": { number: modifier },
      },
    });

    console.log(
      `⚠️ ${props.Name?.title?.[0]?.plain_text ?? "Character"} missed ${stacks} day(s)`
    );
  }

  console.log("✅ Inactivity penalty pass complete");
}

/* CLI execution */
if (process.argv[1].includes("dailyInactivityCheck.js")) {
  applyInactivityPenalties().catch(console.error);
}
