// systems/logger.js
import { Client } from "@notionhq/client";
import "dotenv/config";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const LOG_DB = process.env.RPG_LOG_DB;

export async function logEvent({
  name,
  type,
  userId,
  questId = null,
  details = ""
}) {
  await notion.pages.create({
    parent: { database_id: LOG_DB },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      Type: { select: { name: type } },
      User: { relation: [{ id: userId }] },
      Quests: questId ? { relation: [{ id: questId }] } : undefined,
      Details: { rich_text: [{ text: { content: details } }] },
      Timestamp: { date: { start: new Date().toISOString() } }
    }
  });
}
