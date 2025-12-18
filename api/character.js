import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export default async function handler(req, res) {
  try {
    const { char } = req.query;

    if (!char) {
      return res.status(400).json({
        error: "Missing ?char=PAGE_ID",
      });
    }

    const page = await notion.pages.retrieve({
      page_id: char,
    });

    const p = page.properties;

    // 🔴 THESE NAMES MUST MATCH NOTION EXACTLY
    const data = {
      level: p["Current Level"]?.number ?? 0,
      currentXP: p["Current XP"]?.number ?? 0,
      nextLevelXP: p["Next Level XP"]?.number ?? 0,

      energy: p["Current Energy"]?.number ?? 0,
      maxEnergy: p["Max Energy"]?.number ?? 0,

      stamina: p["Current Stamina"]?.number ?? 0,
      maxStamina: p["Max Stamina"]?.number ?? 0,
    };

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch character",
      details: err.message,
    });
  }
}
