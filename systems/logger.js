// systems/logger.js
import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const LOGS_DB = process.env.NOTION_LOGS_DB_ID;

export async function logEvent({
  name,
  type,
  userId,
  questId,
  details
}) {
  if (!LOGS_DB) {
    console.warn("⚠️ LOGS_DB not set — skipping log event");
    return;
  }

  await notion.pages.create({
    parent: {
      database_id: NOTION_LOGS_DB_ID
    },
    properties: {
      Name: {
        title: [{ text: { content: name } }]
      },
      Type: {
        select: { name: type }
      },
      User: {
        relation: [{ id: userId }]
      },
      Quest: questId
        ? { relation: [{ id: questId }] }
        : undefined,
      Details: {
        rich_text: [{ text: { content: details ?? "" } }]
      },
      Timestamp: {
        date: { start: new Date().toISOString() }
      }
    }
  });
}
