// api/dashboard.js
import "dotenv/config";
import { notion } from "../notionClient.js";

export default async function handler(req, res) {
  try {
    const { char } = req.query;

    if (!char) {
      return res.status(400).send("Missing ?char=PAGE_ID");
    }

    const page = await notion.pages.retrieve({ page_id: char });
    const p = page.properties;

    const level = p.Level?.number ?? 0;
    const xp = p.XP?.number ?? 0;
    const nextXP = p["Next Level XP"]?.formula?.number ?? 0;

    const energy = p.Energy?.number ?? 0;
    const stamina = p.Stamina?.number ?? 0;

    res.setHeader("Content-Type", "text/html");

    res.status(200).send(`
      <html>
        <body style="font-family: system-ui; padding: 20px">
          <h2>🎮 Player Dashboard</h2>

          <p><b>Level:</b> ${level}</p>
          <p><b>XP:</b> ${xp} / ${nextXP}</p>

          <p><b>Energy:</b> ${energy}</p>
          <p><b>Stamina:</b> ${stamina}</p>

          <hr/>
          <small>Live via Vercel</small>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("❌ Dashboard API error:", err);
    res.status(500).send("Failed to load dashboard");
  }
}