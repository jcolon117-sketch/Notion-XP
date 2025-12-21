// systems/evaluateGates.js

import "dotenv/config";
import { notion } from "../notionClient.js";

const GATES_DB = process.env.NOTION_GATES_DB_ID;

if (!GATES_DB) {
  throw new Error("❌ NOTION_GATES_DB_ID not set");
}

/**
 * Evaluate gates for a given character:
 * - If Total Progress >= Required Value → mark as Cleared
 * - Deactivate cleared gate
 * - Activate next gate by Gate Index
 */
export async function evaluateGates(charId) {
  console.log("🚪 Evaluating Gates...");

  if (!charId) {
    throw new Error("❌ evaluateGates called without charId");
  }

  const unlockedGates = [];

  // 1️⃣ Fetch active gates for this character
  const gatesRes = await notion.databases.query({
    database_id: GATES_DB,
    filter: {
      and: [
        {
          property: "Active",
          checkbox: { equals: true },
        },
        {
          property: "User",
          relation: { contains: charId },
        },
      ],
    },
    sorts: [
      {
        property: "Gate Index",
        direction: "ascending",
      },
    ],
  });

  for (const gate of gatesRes.results) {
    const p = gate.properties;

    const name =
      p.Title?.title?.[0]?.plain_text ??
      p.Name?.title?.[0]?.plain_text ??
      "Gate";

    const state = p.State?.status?.name;
    const requiredValue = p["Required Value"]?.number ?? 0;

    // Total Progress is a formula based on Progress Value rollup
    const totalProgress = p["Total Progress"]?.formula?.number ?? 0;

    // ❌ Skip already cleared
    if (state === "Cleared") continue;

    // 🧮 Check completion
    if (requiredValue > 0 && totalProgress >= requiredValue) {
      console.log(`✅ Clearing Gate: ${name}`);

      // 2️⃣ Clear gate
      await notion.pages.update({
        page_id: gate.id,
        properties: {
          State: { status: { name: "Cleared" } },
          Active: { checkbox: false },
          Completed: { checkbox: true },
          "Cleared On": {
            date: { start: new Date().toISOString() },
          },
        },
      });

      unlockedGates.push(gate);

      // 3️⃣ Unlock next gate (by Gate Index)
      const gateIndex = p["Gate Index"]?.number ?? null;
      if (gateIndex !== null) {
        const nextGateRes = await notion.databases.query({
          database_id: GATES_DB,
          filter: {
            and: [
              {
                property: "Gate Index",
                number: { equals: gateIndex + 1 },
              },
              {
                property: "User",
                relation: { contains: charId },
              },
            ],
          },
        });

        if (nextGateRes.results.length > 0) {
          const nextGate = nextGateRes.results[0];

          const nextName =
            nextGate.properties.Title?.title?.[0]?.plain_text ??
            "Next Gate";

          await notion.pages.update({
            page_id: nextGate.id,
            properties: {
              Active: { checkbox: true },
              State: { status: { name: "Unlocking" } },
            },
          });

          console.log(`🔓 Unlocked next gate: ${nextName}`);
        }
      }
    }
  }

  console.log(`🎯 Gates cleared this tick: ${unlockedGates.length}`);
  return unlockedGates;
}