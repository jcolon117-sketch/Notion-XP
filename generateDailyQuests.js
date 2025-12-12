import "dotenv/config";
import { Client } from "@notionhq/client";
import chalk from "chalk";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const DAILY_DB = process.env.DAILY_QUESTS_DB;   // Daily Quests DB ID
const LOG_DB = process.env.LOG_DB;              // Log DB ID

// -------------------------------
// Fetch templates inside database
// -------------------------------
async function getTemplates() {
  const res = await notion.databases.retrieve({
    database_id: DAILY_DB,
  });

  return res.template_pages || [];
}

// -------------------------------
// Duplicate template into a real quest
// -------------------------------
async function createQuestFromTemplate(template) {
  const today = new Date().toISOString().split("T")[0];

  return await notion.pages.create({
    parent: { database_id: DAILY_DB },
    properties: {
      Name: template.properties.Name,
      Status: {
        status: { name: "To Do" }
      },
      Date: {
        date: { start: today }
      }
    },
    icon: template.icon,
    cover: template.cover
  });
}

// -------------------------------
// Log creation in Log DB
// -------------------------------
async function logEntry(text) {
  if (!LOG_DB) return;

  await notion.pages.create({
    parent: { database_id: LOG_DB },
    properties: {
      Name: {
        title: [{ text: { content: text } }]
      },
      Time: {
        date: { start: new Date().toISOString() }
      }
    }
  });
}

// -------------------------------
// MAIN FUNCTION
// -------------------------------
export async function generateDailyQuests() {
  console.log(chalk.cyan("🌅 Generating daily quests…"));

  const templates = await getTemplates();

  if (!templates.length) {
    console.log(chalk.red("❌ No templates found!"));
    return;
  }

  console.log(chalk.green(`📄 Found ${templates.length} templates.`));

  for (const template of templates) {
    const newQuest = await createQuestFromTemplate(template);
    console.log(chalk.yellow(`✨ Created: ${newQuest.properties.Name.title[0].plain_text}`));

    await logEntry(`Created daily quest: ${newQuest.properties.Name.title[0].plain_text}`);
  }

  console.log(chalk.green("🎉 Daily quests generated successfully."));
}