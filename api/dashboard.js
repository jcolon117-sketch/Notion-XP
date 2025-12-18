import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export default async function handler(req, res) {
  const pageId = process.env.NOTION_USER_DB_ID;

  const page = await notion.pages.retrieve({ page_id: pageId });
  const p = page.properties;

  res.setHeader("Content-Type", "text/html");

  res.status(200).send(`
    <html>
      <body style="font-family: system-ui; padding: 20px">
        <h2>🎮 Player Dashboard</h2>

        <p><b>Level:</b> ${p["Current Level"].number}</p>
        <p><b>XP:</b> ${p["Current XP"].number} / ${p["Next Level XP"].number}</p>

        <p><b>Energy:</b> ${p["Current Energy"].number}</p>
        <p><b>Stamina:</b> ${p["Current Stamina"].number}</p>

        <hr/>
        <small>Live via Vercel</small>
      </body>
    </html>
  `);
}
