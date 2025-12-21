// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import { notion } from "./notionClient.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------------
// MIDDLEWARE
// ----------------------------
app.use(cors());
app.use(express.json());

// ----------------------------
// HEALTH CHECK
// ----------------------------
app.get("/", (req, res) => {
  res.json({ status: "Notion XP API live" });
});

// ----------------------------
// DASHBOARD ENDPOINT
// GET /api/dashboard?char=CHARACTER_PAGE_ID
// ----------------------------
app.get("/api/dashboard", async (req, res) => {
  try {
    const charId = req.query.char;

    if (!charId) {
      return res.status(400).json({
        error: "Missing char parameter (?char=NOTION_PAGE_ID)",
      });
    }

    // Fetch character page
    const page = await notion.pages.retrieve({
      page_id: charId,
    });

    const p = page.properties || {};

    const level = p.Level?.number ?? 0;
    const xp = p.XP?.number ?? 0;

    const energy = p.Energy?.number ?? 0;
    const maxEnergy = p["Max Energy"]?.number ?? 0;

    const stamina = p.Stamina?.number ?? 0;
    const maxStamina = p["Max Stamina"]?.number ?? 0;

    const xpBar = p["XP Bar"]?.formula?.string ?? "";
    const energyBar = p["Energy Bar"]?.formula?.string ?? "";
    const staminaBar = p["Stamina Bar"]?.formula?.string ?? "";

    res.json({
      Level: level,
      XP: xp,
      Energy: energy,
      MaxEnergy: maxEnergy,
      Stamina: stamina,
      MaxStamina: maxStamina,
      Bars: {
        XP: xpBar,
        Energy: energyBar,
        Stamina: staminaBar,
      },
      LastSync: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Dashboard fetch failed:", err);
    res.status(500).json({
      error: "Failed to fetch character data",
    });
  }
});

// ----------------------------
// LOCAL DEV LISTENER
// ----------------------------
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Notion XP API server running on port ${PORT}`);
  });
}

// ----------------------------
// VERCEL EXPORT
// ----------------------------
export default app;