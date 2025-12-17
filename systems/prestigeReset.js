// systems/prestigeReset.js
import { Client } from "@notionhq/client";
import "dotenv/config";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function prestige(characterId, currentPrestige) {
  await notion.pages.update({
    page_id: characterId,
    properties: {
      "Current Level": { number: 1 },
      "Current XP": { number: 0 },
      "Prestige Rank": { number: currentPrestige + 1 },
      "Unspent Stat Points": { number: 0 }
    }
  });
}
