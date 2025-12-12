// test.js
import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function test() {
  try {
    const res = await notion.search({ query: "" });
    console.log("Success:", res.object);
  } catch (err) {
    console.error("Error:", err.code, err.message);
  }
}

test();