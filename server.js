// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import { notion } from "./notionClient.js";

// Import route handlers
import healthHandler from "./routes/health.js";
import characterHandler from "./routes/character.js";
import syncHandler from "./routes/sync.js";
import dashboardHandler from "./routes/dashboard.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ----------------------------
// HEALTH CHECK
// ----------------------------
app.get("/", (req, res) => {
  res.json({ status: "Notion XP API live" });
});

app.get("/api/health", healthHandler);
app.get("/api/character", characterHandler);
app.post("/api/sync", syncHandler);
app.get("/api/dashboard", dashboardHandler);

// ----------------------------
// LOCAL DEV LISTENER
// ----------------------------
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Notion XP API server running on port ${PORT}`);
  });
}

export default app;