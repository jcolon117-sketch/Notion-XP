// routes/character.js
import { notion } from "../notionClient.js";

export default async function handler(req, res) {
  try {
    const { char } = req.query;

    if (!char) {
      return res.status(400).json({ error: "Missing ?char=PAGE_ID" });
    }

    const page = await notion.pages.retrieve({ page_id: char });
    const p = page.properties;

    const data = {
      level: p.Level?.number ?? 0,
      currentXP: p.XP?.number ?? 0,
      nextLevelXP: p["Next Level XP"]?.formula?.number ?? 0,

      energy: p.Energy?.number ?? 0,
      maxEnergy: p["Max Energy"]?.number ?? 0,

      stamina: p.Stamina?.number ?? 0,
      maxStamina: p["Max Stamina"]?.number ?? 0,
    };

    res.status(200).json(data);
  } catch (err) {
    console.error("❌ Character API error:", err);
    res.status(500).json({
      error: "Failed to fetch character",
      details: err.message,
    });
  }
}