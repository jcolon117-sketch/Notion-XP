// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import { Client } from "@notionhq/client";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// Required envs: CHAR_DB, INV_DB, ITEMS_DB, QUESTS_DB, ENCOUNTERS_DB, ENCOUNTER_LOG_DB
const CHAR_DB = process.env.CHAR_DB || "";
const INV_DB = process.env.INV_DB || "";
const ITEMS_DB = process.env.ITEMS_DB || "";
const QUESTS_DB = process.env.QUESTS_DB || "";
const ENCOUNTERS_DB = process.env.ENCOUNTERS_DB || "";
const ENCOUNTER_LOG_DB = process.env.ENCOUNTER_LOG_DB || "";

async function getCharacterPage(characterId) {
  return notion.pages.retrieve({ page_id: characterId });
}

app.get("/api/health", (req, res) => res.json({ ok: true, now: new Date().toISOString() }));

app.get("/api/character/:id/summary", async (req, res) => {
  try {
    const charId = req.params.id;
    const page = await getCharacterPage(charId);
    const p = page.properties;
    const summary = {
      id: charId,
      name: p.Name?.title?.[0]?.plain_text ?? "Unknown",
      level: p["Current Level"]?.number ?? 1,
      currentXP: p["Current XP"]?.number ?? 0,
      xpProgress: p["XP Progress"]?.number ?? 0,
      nextLevelXP: p["Next Level XP"]?.formula?.number ?? null,
      gold: p["Gold"]?.number ?? 0,
      energy: p["Current Energy"]?.number ?? 0,
      maxEnergy: p["Max Energy"]?.number ?? 100,
      stamina: p["Current Stamina"]?.number ?? 0,
      maxStamina: p["Max Stamina"]?.number ?? 100,
      carryWeight: p["Carry Weight"]?.number ?? 0,
      maxWeight: p["Max Weight"]?.number ?? 100,
      strength: p["Strength"]?.number ?? 0,
      agility: p["Agility"]?.number ?? 0,
      dexterity: p["Dexterity"]?.number ?? 0,
      constitution: p["Constitution"]?.number ?? 0,
      intelligence: p["Intelligence"]?.number ?? 0,
      wisdom: p["Wisdom"]?.number ?? 0
    };

    // Inventory query (names resolved)
    const invQuery = await notion.databases.query({
      database_id: INV_DB,
      filter: { property: "Character", relation: { contains: charId } },
      page_size: 100
    });

    summary.inventoryCount = invQuery.results.length;
    summary.inventory = [];

    for (const e of invQuery.results) {
      const itemRel = e.properties.Item?.relation?.[0];
      const itemId = itemRel?.id;
      let itemName = "Item";
      let rarity = "Common";
      if (itemId) {
        try {
          const itemPage = await notion.pages.retrieve({ page_id: itemId });
          itemName = itemPage.properties.Name?.title?.[0]?.plain_text ?? "Item";
          rarity = itemPage.properties.Rarity?.select?.name ?? "Common";
        } catch {}
      }
      summary.inventory.push({
        id: e.id,
        itemId,
        itemName,
        rarity,
        quantity: e.properties.Quantity?.number ?? 1,
        equipped: e.properties.Equipped?.checkbox ?? false
      });
    }

    res.json({ ok: true, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Server started"));
