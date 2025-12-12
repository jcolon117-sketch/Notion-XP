// awardXP.js
import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const QUESTS_DB = process.env.QUESTS_DB;
const USERS_DB = process.env.USERS_DB;
const LOG_DB = process.env.LOG_DB;

// Recommended leveling curve
function nextLevelXP(level) {
  return Math.floor(50 * Math.pow(level, 1.5));
}

export async function processAllCompletedQuests() {
  console.log("🔍 Fetching completed quests...");

  // 1. Pull completed quests
  const response = await notion.databases.query({
    database_id: QUESTS_DB,
    filter: {
      property: "Status",
      status: { equals: "Completed" }
    }
  });

  const quests = response.results;
  console.log(`📌 Found ${quests.length} completed quests`);

  for (const quest of quests) {
    await processQuest(quest);
  }
}

// Process a single quest
async function processQuest(quest) {
  const props = quest.properties;
  const name = props.Name.title[0].plain_text;

  const xp = props["XP Reward"]?.number ?? 0;
  const gold = props["Gold Reward"]?.number ?? 0;

  const stat = props["Stat Reward"]?.select?.name ?? null;
  const statAmount = props["Stat Amount"]?.number ?? 0;

  const userRel = props["Assigned To"]?.relation?.[0]?.id;
  if (!userRel) {
    console.log("⚠ Quest has no assigned user:", name);
    return;
  }

  // 2. Load the character
  const character = await notion.pages.retrieve({ page_id: userRel });
  const cp = character.properties;

  const currentXP = cp["Current XP"]?.number ?? 0;
  const level = cp["Current Level"]?.number ?? 1;
  const currentGold = cp["Gold"]?.number ?? 0;
  const stamina = cp["Stamina"]?.number ?? 100;

  const maxStamina = cp["Max Stamina"]?.number ?? 100;
  const staminaCost = props["Stamina Cost"]?.number ?? 5;

  // 2.1 Stamina check
  if (stamina < staminaCost) {
    console.log("❌ Not enough stamina for quest:", name);
    return;
  }

  // ------------------------------
  // 3. Apply updates
  // ------------------------------
  let newXP = currentXP + xp;
  let newLevel = level;

  let threshold = nextLevelXP(level);

  const updates = {
    "Current XP": { number: newXP },
    Gold: { number: currentGold + gold },
    Stamina: { number: stamina - staminaCost }
  };

  // 3.1 Stat reward
  if (stat && cp[stat]) {
    const oldValue = cp[stat].number ?? 0;
    updates[stat] = { number: oldValue + statAmount };
  }

  // 3.2 Level up loop
  while (newXP >= threshold) {
    newXP -= threshold;
    newLevel++;
    threshold = nextLevelXP(newLevel);
  }

  updates["Current XP"] = { number: newXP };
  updates["Current Level"] = { number: newLevel };

  // 4. Push character update to Notion
  await notion.pages.update({
    page_id: userRel,
    properties: updates
  });

  // 5. Log in RPG Log DB
  await notion.pages.create({
    parent: { database_id: LOG_DB },
    properties: {
      Name: {
        title: [{ text: { content: `Quest Completed: ${name}` } }]
      },
      Type: { select: { name: "Quest" } },
      XP: { number: xp },
      Gold: { number: gold },
      Character: { relation: [{ id: userRel }] }
    }
  });

  // 6. Reset quest to To Do
  await notion.pages.update({
    page_id: quest.id,
    properties: {
      Status: { select: { name: "To Do" } }
    }
  });

  console.log("✔ Quest processed:", name);
}
