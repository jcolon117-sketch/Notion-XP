// scheduler.js
import "dotenv/config";
import cron from "node-cron";
import { runQuestBatch } from "./systems/questBatchProcessor.js";

console.log("🕒 Quest scheduler started");

// Every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("⚙️ Running quest batch...");
  try {
    await runQuestBatch();
    console.log("✅ Quest batch finished");
  } catch (err) {
    console.error("❌ Quest batch error:", err);
  }
});
