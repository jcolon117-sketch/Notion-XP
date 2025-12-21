// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

// Import route handlers
import healthHandler from "./routes/health.js";
import characterHandler from "./routes/character.js";
import syncHandler from "./routes/sync.js";
import dashboardHandler from "./routes/dashboard.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Needed for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files (dashboard.html, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Root endpoint
app.get("/", (req, res) => {
  res.json({ status: "Notion XP API live" });
});

// API routes
app.get("/api/health", healthHandler);
app.get("/api/character", characterHandler);
app.post("/api/sync", syncHandler);
app.get("/api/dashboard", dashboardHandler);

// Local dev listener (Vercel ignores this)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Notion XP API server running on port ${PORT}`);
  });
}

export default app;