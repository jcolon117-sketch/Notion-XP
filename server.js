// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { Client } from "@notionhq/client";

/* ───────────────────────────── */
/* Setup                          */
/* ───────────────────────────── */

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const CHAR_DB = process.env.CHARACTER_DB;

/* ───────────────────────────── */
/* Helpers                        */
/* ───────────────────────────── */

async function getCharacterPage(pageId) {
  const page = await notion.pages.retrieve({ page_id: pageId });
  const p = page.properties;

  return {
    level: p["Current Level"]?.number ?? 1,
    currentXP: p["Current XP"]?.number ?? 0,
    nextLevelXP: p["XP To Next Level"]?.number ?? 100,

    energy: p["Current Energy"]?.number ?? 0,
    maxEnergy: p["Max Energy"]?.number ?? 100,

    stamina: p["Current Stamina"]?.number ?? 0,
    maxStamina: p["Max Stamina"]?.number ?? 100,
  };
}

/* ───────────────────────────── */
/* Routes                         */
/* ───────────────────────────── */

app.get("/", (req, res) => {
  res.json({ status: "🟢 Notion RPG Server Online" });
});

/**
 * LIVE DASHBOARD ENDPOINT
 * Usage:
 * https://your-app.vercel.app/character?char=PAGE_ID
 */
app.get("/character", async (req, res) => {
  try {
    const { char } = req.query;

    if (!char) {
      return res.status(400).json({
        error: "Missing ?char=PAGE_ID",
      });
    }

    const data = await getCharacterPage(char);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to load character",
      details: err.message,
    });
  }
});

/* ───────────────────────────── */
/* Health Check                   */
/* ───────────────────────────── */

app.get("/health", (req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

/* ───────────────────────────── */
/* Start Server                   */
/* ───────────────────────────── */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
