// testToken.js
import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

(async () => {
  try {
    const me = await notion.users.me();
    console.log("🟢 Token OK! Connected as:", me.name);
  } catch (err) {
    console.error("❌ TOKEN ERROR:", err.body ?? err);
  }
})();