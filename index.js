// index.js
import "dotenv/config";
import { Client } from "@notionhq/client";
import chalk from "chalk";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const QUESTS_DB = process.env.QUESTS_DB;
const USERS_DB = process.env.USERS_DB;

// ---------------------------------------------
// Fetch quests where Status = "Completed"
// ---------------------------------------------
async function fetchCompletedQuests() {
  console.log(chalk.cyan("🔍 Fetching quests..."));

  const response = await notion.databases.query({
    database_id: QUESTS_DB,
    filter: {
      property: "Status",
      status: { equals: "Completed" },
    },
  });

  return response.results;
}

// ---------------------------------------------
// Process each completed quest
// ---------------------------------------------
async function processQuest(quest) {
  const props = quest.properties;

  const name = props["Name"]?.title?.[0]?.plain_text || "Unnamed Quest";
  const gold = props["Gold Reward"]?.number ?? 0;
  const stat = props["Stat Reward"]?.select?.name ?? null;
  const statAmount = props["Stat Amount"]?.number ?? 0;

  console.log(
    chalk.green(
      `➡️ Processing quest: ${name} (${gold} gold, ${stat} +${statAmount})`
    )
  );

  // TODO — Add your character update logic here.

  await notion.pages.update({
    page_id: quest.id,
    properties: {
      Status: { status: { name: "To Do" } },
    },
  });

  console.log(chalk.gray("   ✔ Quest reset to To Do"));
}

// ---------------------------------------------
// MAIN
// ---------------------------------------------
(async () => {
  try {
    const completed = await fetchCompletedQuests();
    console.log(chalk.magenta(`📌 Found ${completed.length} completed quests.`));

    for (const quest of completed) {
      await processQuest(quest);
    }

    console.log(chalk.green("🎉 All completed quests processed!"));
  } catch (err) {
    console.error(chalk.red("❌ Error running script:"), err.body ?? err);
  }
})();