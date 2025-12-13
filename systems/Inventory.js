import { Client } from "@notionhq/client";
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const INVENTORY_DB = process.env.INVENTORY_DB;

export async function addItemToInventory({
  characterId,
  itemId,
  quantity = 1,
  questId
}) {
  await notion.pages.create({
    parent: { database_id: INVENTORY_DB },
    properties: {
      Character: { relation: [{ id: characterId }] },
      Item: { relation: [{ id: itemId }] },
      Quantity: { number: quantity },
      Equipped: { checkbox: false },
      "Acquired From": { relation: [{ id: questId }] },
      Timestamp: { date: { start: new Date().toISOString() } }
    }
  });
}
