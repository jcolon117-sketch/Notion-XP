// scheduler.js
import "dotenv/config";
import cron from "node-cron";
import chalk from "chalk";
import { runQuestBatch } from "./systems/questBatchProcessor.js";

// ---------------------------------------------
// ENV GUARD
// ---------------------------------------------
const ENABLED = process.env.SCHEDULER_ENABLED === "true";
const INTERVAL = process.env.SCHEDULER_CRON ?? "*/5 * * * *";

if (!ENABLED) {
  console.log(chalk.yellow("⏭️ Scheduler disabled (SCHEDULER_ENABLED != true)"));
  process.exit(0);
}

// ---------------------------------------------
// START
// ---------------------------------------------
console.log(chalk.cyan(`🕒 Scheduler started — cron: ${INTERVAL}`));

// ---------------------------------------------
// CRON TASK
// ---------------------------------------------
cron.schedule(INTERVAL, async () => {
  console.log(chalk.magenta("⚙️ Running scheduled quest batch..."));

  try {
    await runQuestBatch();
    console.log(chalk.green("✅ Scheduled batch complete"));
  } catch (err) {
    console.error(chalk.red("❌ Scheduled batch failed"), err);
  }
});