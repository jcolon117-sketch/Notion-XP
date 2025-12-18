import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Notion XP API server running on port ${PORT}`);
});

app.use(cors());
app.use(express.json());

// ---------- HEALTH CHECK ----------
app.get("/", (req, res) => {
  res.json({ status: "Notion XP API live" });
});

// ---------- DASHBOARD ----------
app.get("/api/dashboard", async (req, res) => {
  const { char } = req.query;

  if (!char) {
    return res.status(400).json({
      error: "Missing char parameter (?char=NOTION_PAGE_ID)"
    });
  }

  // TODO: fetch from Notion
  res.json({
    Level: 1,
    XP: 0,
    Energy: 0,
    Stamina: 0
  });
});

// ---------- EXPORT FOR VERCEL ----------
export default app;
