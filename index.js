// index.js (PROJECT ROOT)
import "dotenv/config";
import chalk from "chalk";

import { runQuestBatch } from "./systems/questBatchProcessor.js";

// ---------------------------------------------
// CONFIG
// ---------------------------------------------
const MODE = process.env.MODE || "manual"; 
// manual → run once and exit
// daemon → loop every X minutes

const INTERVAL_MINUTES = Number(process.env.QUEST_SCAN_INTERVAL ?? 5);

// ---------------------------------------------
// MAIN RUNNER
// ---------------------------------------------
async function runOnce() {
  console.log(chalk.cyan("\n🚀 Notion RPG Engine Starting...\n"));

  await runQuestBatch();

  console.log(chalk.green("\n✅ Quest batch complete.\n"));
}

// ---------------------------------------------
// DAEMON MODE (optional)
// ---------------------------------------------
async function runDaemon() {
  console.log(
    chalk.magenta(
      `🕒 Running in DAEMON mode — scanning every ${INTERVAL_MINUTES} minutes`
    )
  );

  while (true) {
    try {
      await runOnce();
    } catch (err) {
      console.error(chalk.red("❌ Fatal error in batch loop"), err);
    }

    await new Promise((res) =>
      setTimeout(res, INTERVAL_MINUTES * 60 * 1000)
    );
  }
}

// ---------------------------------------------
// BOOTSTRAP
// ---------------------------------------------
(async () => {
  try {
    if (MODE === "daemon") {
      await runDaemon();
    } else {
      await runOnce();
    }
  } catch (err) {
    console.error(chalk.red("🔥 Engine crashed:"), err);
    process.exit(1);
  }
})();
