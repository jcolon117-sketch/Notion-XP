// useEnergy.js
import { Client } from "@notionhq/client";
import "dotenv/config";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function consumeEnergy(characterId, cost) {
  const page = await notion.pages.retrieve({ page_id: characterId });
  const props = page.properties;

  const currentEnergy = props["Current Energy"]?.number ?? 0;

  if (currentEnergy < cost) return false;

  await notion.pages.update({
    page_id: characterId,
    properties: {
      "Current Energy": { number: currentEnergy - cost }
    }
  });

  return true;
}