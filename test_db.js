// test_db.js
import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function testDB(id, name) {
  console.log(`\nTesting ${name} DB...`);
  try {
    const res = await notion.databases.retrieve({ database_id: id });
    console.log("🟢 ACCESS OK:", res.title[0]?.plain_text);
  } catch (err) {
    console.error("❌ ACCESS ERROR:", err.body ?? err);
  }
}

await testDB(process.env.QUESTS_DB, "Quests");
await testDB(process.env.USERS_DB, "Users");