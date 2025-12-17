// logEntry.js
import { notion } from "./notionClient.js";
import "dotenv/config";
const NOTION_LOG_DB_ID = process.env.NOTION_LOG_DB_ID;

/**
 * Create a log entry in LOG_DB
 * type: "QuestReward" | "LevelUp" | etc
 * userPageId, questPageId optional
 */
export async function createLog({ type, userPageId, questPageId, details }) {
  if (!NOTION_LOG_DB_ID) {
    console.warn("LOG_DB not set — skipping log entry.");
    return;
  }

  await notion.pages.create({
    parent: { database_id: NOTION_LOG_DB_ID },
    properties: {
      Entry: {
        title: [{ text: { content: `${type} — ${new Date().toLocaleString()}` } }]
      },
      Type: { select: { name: type } },
      Details: { rich_text: [{ text: { content: details } }] },
      Timestamp: { date: { start: new Date().toISOString() } },
      ...(userPageId ? { User: { relation: [{ id: userPageId }] } } : {}),
      ...(questPageId ? { Quest: { relation: [{ id: questPageId }] } } : {}),
    },
  }).catch(err => {
    console.error("Failed to write log entry:", err?.body ?? err);
  });
}