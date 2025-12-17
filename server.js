// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import { Client } from "@notionhq/client";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Required envs: NOTION_USER_DB_ID, NOTION_QUESTS_DB_ID, NOTION_ENCOUNTERS_DB_ID, NOTION_ENCOUNTER_LOG_DB_ID
const NOTION_USER_DB_ID = process.env.NOTION_USER_DB_ID || "";
const NOTION_QUESTS_DB_ID = process.env.NOTION_QUESTS_DB_ID || "";
const NOTION_ENCOUNTERS_DB_ID = process.env.NOTION_ENCOUNTERS_DB_ID || "";
const NOTION_ENCOUNTER_LOG_DB_ID = process.env.NOTION_ENCOUNTER_LOG_DB_ID || "";

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
      energy: p["Current Energy"]?.number ?? 0,
      maxEnergy: p["Max Energy"]?.number ?? 100,
      stamina: p["Current Stamina"]?.number ?? 0,
      maxStamina: p["Max Stamina"]?.number ?? 100,
      strength: p["Strength"]?.number ?? 0,
      agility: p["Agility"]?.number ?? 0,
      dexterity: p["Dexterity"]?.number ?? 0,
      constitution: p["Constitution"]?.number ?? 0,
      intelligence: p["Intelligence"]?.number ?? 0,
      wisdom: p["Wisdom"]?.number ?? 0
    };

    res.json({ ok: true, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Server started"));
