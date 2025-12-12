// printQuests.js
import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const QUESTS_DB = process.env.QUESTS_DB;

// ------------------------
// Fetch all quests (up to 500)
// ------------------------
async function getQuests() {
  const pages = [];
  let cursor = undefined;

  for (let i = 0; i < 5; i++) {
    const response = await notion.databases.query({
      database_id: QUESTS_DB,
      start_cursor: cursor,
      page_size: 100,
    });

    pages.push(...response.results);

    if (!response.has_more) break;
    cursor = response.next_cursor;
  }

  return pages;
}

// ------------------------
// MAIN
// ------------------------
async function main() {
  console.log("Listing first 5 pages in QUESTS DB...\n");

  const quests = await getQuests();

  quests.forEach((q) => {
    const name =
      q.properties["Name"]?.title?.[0]?.plain_text || "Untitled Quest";
    console.log(`• ${name}`);
  });
}

main().catch(console.error);