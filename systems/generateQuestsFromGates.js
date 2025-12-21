// systems/generateQuestsFromGates.js
// Generates quests when a gate is unlocked

import { notion } from "../notionClient.js";

const QUESTS_DB = process.env.NOTION_QUESTS_DB_ID;

if (!QUESTS_DB) {
  throw new Error("❌ NOTION_QUESTS_DB_ID not set");
}

export async function generateQuestsFromGates(unlockedGates, charId) {
  console.log("📝 Generating quests from unlocked gates...");

  for (const gate of unlockedGates) {
    const p = gate.properties;

    const category = p.Category?.select?.name ?? "General";
    const gateName = p.Title?.title?.[0]?.plain_text ?? "Gate";

    const questTemplate =
      category === "Workout"
        ? {
            title: `Gate Training – ${gateName}`,
            type: "Training",
            xp: 50,
            stat: "Constitution",
            statAmount: 1,
          }
        : {
            title: `Gate Task – ${gateName}`,
            type: "Story",
            xp: 40,
            stat: "Intelligence",
            statAmount: 1,
          };

    await notion.pages.create({
      parent: { database_id: QUESTS_DB },
      properties: {
        Title: {
          title: [{ text: { content: questTemplate.title } }],
        },
        Type: { select: { name: questTemplate.type } },
        Status: { status: { name: "Not Started" } },
        "XP Reward": { number: questTemplate.xp },
        "Stat Reward": { select: { name: questTemplate.stat } },
        "Stat Amount": { number: questTemplate.statAmount },
        "Assigned To": { relation: [{ id: charId }] },
        "Generated From Gate": { relation: [{ id: gate.id }] },
      },
    });

    console.log(`✅ Created quest for ${gateName}`);
  }

  console.log("🎉 Gate quest generation complete");
}
