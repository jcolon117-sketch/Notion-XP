import express from "express";
import { Client } from "@notionhq/client";
import { runGameTick } from "./systems/gameEngine.js";
import { getPlayerStats } from "./systems/progressionEngine.js";

const app = express();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

/**
 * Dashboard (READ ONLY)
 */
app.get("/api/dashboard", async (req, res) => {
  const charId = req.query.char;
  if (!charId) return res.status(400).json({ error: "Missing char" });

  const stats = await getPlayerStats(notion, charId);
  res.json(stats);
});

/**
 * Process quest (MAIN AUTOMATION ENTRY)
 */
app.post("/api/completeQuest", async (req, res) => {
  const { char, quest } = req.query;

  if (!char || !quest) {
    return res.status(400).json({ error: "Missing char or quest" });
  }

  const result = await runGameTick(notion, char, quest);
  res.json({ success: true, result });
});

export default app;
