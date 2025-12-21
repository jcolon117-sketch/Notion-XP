// index.js (PROJECT ROOT)

import "dotenv/config";
import chalk from "chalk";

import { runQuestBatch } from "./systems/questBatchProcessor.js";
import { generateDailyQuests } from "./systems/generateDailyQuests.js";
import { applyInactivityPenalties } from "./systems/dailyInactivityCheck.js";
import { generateGates } from "./systems/generateGates.js";
import { getWeekKey } from "./systems/weekUtils.js";

// ---------------------------------------------
// CONFIG
// ---------------------------------------------
const MODE = process.env.MODE || "manual";
const INTERVAL_MINUTES = Number(process.env.QUEST_SCAN_INTERVAL ?? 5);

// ---------------------------------------------
// UTIL
// ---------------------------------------------
async function safeRun(label, fn) {
  try {
    console.log(chalk.blue(`🔹 ${label}...`));
    await fn();
    console.log(chalk.green(`✔ ${label} complete`));
  } catch (err) {
    console.error(chalk.red(`❌ ${label} failed`), err);
  }
}

// ---------------------------------------------
// SINGLE TICK
// ---------------------------------------------
async function runOnce() {
  const now = new Date();
  const weekKey = getWeekKey(now);

  console.log(
    chalk.cyan(
      `\n🚀 Notion RPG Engine Tick\n📅 ${now.toISOString()}\n🗓 Week ${weekKey}\n`
    )
  );

  // 1️⃣ Inactivity penalties
  await safeRun("Inactivity penalty check", applyInactivityPenalties);

  // 2️⃣ Quest processing
  await safeRun("Quest batch processing", runQuestBatch);

  // 3️⃣ Gate generation (idempotent)
  await safeRun("Gate generation check", generateGates);

  // 4️⃣ Daily quest generation
  await safeRun("Daily quest generation", generateDailyQuests);

  console.log(chalk.green("\n✅ Engine tick complete\n"));
}

// ---------------------------------------------
// DAEMON MODE
// ---------------------------------------------
async function runDaemon() {
  console.log(
    chalk.magenta(
      `🕒 DAEMON mode — running every ${INTERVAL_MINUTES} minutes`
    )
  );

  while (true) {
    await runOnce();
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
    console.error(chalk.red("🔥 Engine crashed"), err);
    process.exit(1);
  }
})();