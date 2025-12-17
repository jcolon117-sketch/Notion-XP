import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const GATES_DB = process.env.GATES_DB;
const DAILY_QUESTS_DB = process.env.DAILY_QUESTS_DB;
const QUESTS_DB = process.env.QUESTS_DB;

/* ---------------------------- */
/* Fetch active gate             */
/* ---------------------------- */
async function getActiveGate() {
  const res = await notion.databases.query({
    database_id: GATES_DB,
    filter: {
      property: "Active",
      checkbox: { equals: true }
    }
  });

  return res.results[0];
}

/* ---------------------------- */
/* Aggregate daily progress      */
/* ---------------------------- */
async function aggregateDailyProgress() {
  const res = await notion.databases.query({
    database_id: DAILY_QUESTS_DB,
    filter: {
      property: "Status",
      status: { equals: "Completed" }
    }
  });

  let totals = {
    weight: 0,
    reps: 0,
    muayThai: 0,
    dev: 0
  };

  for (const q of res.results) {
    const p = q.properties;
    totals.weight += p["Weight Lifted"]?.number ?? 0;
    totals.reps += p["Calisthenics Reps"]?.number ?? 0;
    totals.muayThai += p["Muay Thai Minutes"]?.number ?? 0;
    totals.dev += p["Dev Minutes"]?.number ?? 0;
  }

  return totals;
}

/* ---------------------------- */
/* Apply progress to gate        */
/* ---------------------------- */
function resolveProgress(gate, totals) {
  const stat = gate.properties["Required Stat"].select.name;

  if (stat === "Strength") return totals.weight;
  if (stat === "Agility") return totals.reps;
  if (stat === "Dexterity") return totals.muayThai;
  if (stat === "Intelligence") return totals.dev;

  return 0;
}

/* ---------------------------- */
/* MAIN ENGINE                   */
/* ---------------------------- */
export async function runProgressionEngine() {
  console.log("⚙️ Running Progression Engine...");

  const gate = await getActiveGate();
  if (!gate) {
    console.log("❌ No active gate found");
    return;
  }

  const totals = await aggregateDailyProgress();
  const gained = resolveProgress(gate, totals);

  const current = gate.properties.Progress?.number ?? 0;
  const required = gate.properties["Required Value"].number;
  const updated = current + gained;

  await notion.pages.update({
    page_id: gate.id,
    properties: {
      Progress: { number: updated }
    }
  });

  console.log(`📈 Gate ${gate.properties.Title.title[0].plain_text}: ${updated}/${required}`);

  /* ---------------------------- */
  /* Gate completion               */
  /* ---------------------------- */
  if (updated >= required) {
    console.log("🏁 Gate completed!");

    const nextRank = gate.properties["Unlocks Rank"].select?.name;

    await notion.pages.update({
      page_id: gate.id,
      properties: {
        Active: { checkbox: false },
        Completed: { checkbox: true }
      }
    });

    // Unlock next gate
    if (nextRank) {
      const nextGate = await notion.databases.query({
        database_id: GATES_DB,
        filter: {
          property: "Rank",
          select: { equals: nextRank }
        }
      });

      if (nextGate.results[0]) {
        await notion.pages.update({
          page_id: nextGate.results[0].id,
          properties: {
            Active: { checkbox: true }
          }
        });
      }
    }
  }

  console.log("✅ Progression cycle complete");
}

/* CLI */
if (process.argv[1].includes("progressionEngine.js")) {
  runProgressionEngine().catch(console.error);
}
