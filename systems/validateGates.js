// systems/validateGates.js
import "dotenv/config";
import { Client } from "@notionhq/client";
import { applyXP } from "./leveling.js";
import { logEvent } from "./logger.js";
import { LOG_TYPES } from "../config/gameConfig.js";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const NOTION_DAILY_QUESTS_DB_ID = process.env.NOTION_DAILY_QUESTS_DB_ID;
const NOTION_GATES_DB_ID = process.env.NOTION_GATES_DB_ID;

// ------------------------
// Helpers
// ------------------------
function sum(values) {
  return values.reduce((a, b) => a + b, 0);
}

async function getDailyQuests(userId, start, end) {
  const res = await notion.databases.query({
    database_id: NOTION_DAILY_QUESTS_DB_ID,
    filter: {
      and: [
        {
          property: "User",
          relation: { contains: userId }
        },
        {
          property: "Status",
          status: { equals: "Completed" }
        },
        {
          property: "Date",
          date: {
            on_or_after: start,
            on_or_before: end
          }
        }
      ]
    }
  });

  return res.results;
}

// ------------------------
// MAIN VALIDATOR
// ------------------------
export async function validateGate(gate) {
  const props = gate.properties;

  if (props.Cleared?.checkbox) return;

  const userRel = props.User?.relation?.[0];
  if (!userRel) return;

  const userId = userRel.id;
  const start = props["Start Date"]?.date?.start;
  const end = props["End Date"]?.date?.start;

  if (!start || !end) return;

  const dailies = await getDailyQuests(userId, start, end);

  const totals = {
    dev: sum(dailies.map(q => q.properties["Dev Minutes"]?.number ?? 0)),
    muayThai: sum(dailies.map(q => q.properties["Muay Thai Minutes"]?.number ?? 0)),
    weight: sum(dailies.map(q => q.properties["Weight Lifted"]?.number ?? 0)),
    reps: sum(dailies.map(q => q.properties["Total Reps"]?.number ?? 0))
  };

  const requirements = {
    dev: props["Required Dev Minutes"]?.number,
    muayThai: props["Required Muay Thai Minutes"]?.number,
    weight: props["Required Weight Total"]?.number,
    reps: props["Required Total Reps"]?.number
  };

  const passed =
    (requirements.dev == null || totals.dev >= requirements.dev) &&
    (requirements.muayThai == null || totals.muayThai >= requirements.muayThai) &&
    (requirements.weight == null || totals.weight >= requirements.weight) &&
    (requirements.reps == null || totals.reps >= requirements.reps);

  if (!passed) return;

  // ------------------------
  // CLEAR GATE
  // ------------------------
  await notion.pages.update({
    page_id: gate.id,
    properties: {
      Cleared: { checkbox: true },
      Active: { checkbox: false },
      "Cleared On": { date: { start: new Date().toISOString() } }
    }
  });

  // ------------------------
  // AWARD XP
  // ------------------------
  const userPage = await notion.pages.retrieve({ page_id: userId });
  const c = userPage.properties;

  const xpReward = props["XP Reward"]?.number ?? 0;

  const xpResult = applyXP(
    {
      level: c["Current Level"]?.number ?? 1,
      xp: c["Current XP"]?.number ?? 0
    },
    xpReward
  );

  await notion.pages.update({
    page_id: userId,
    properties: {
      "Current Level": { number: xpResult.level },
      "Current XP": { number: xpResult.xp }
    }
  });

  await logEvent({
    name: props.Title?.title?.[0]?.plain_text ?? "Gate Cleared",
    type: LOG_TYPES.GATE,
    userId,
    details: `Gate cleared (+${xpReward} XP)`
  });
}

// ------------------------
// BATCH RUNNER
// ------------------------
export async function runGateValidation() {
  console.log("🚪 Validating Gates...");

  const res = await notion.databases.query({
    database_id: NOTION_GATES_DB_ID,
    filter: {
      property: "Active",
      checkbox: { equals: true }
    }
  });

  for (const gate of res.results) {
    await validateGate(gate);
  }

  console.log("✅ Gate validation complete");
}

// CLI support
if (process.argv[1].includes("validateGates.js")) {
  runGateValidation().catch(console.error);
}
