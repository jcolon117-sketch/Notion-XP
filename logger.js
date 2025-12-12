// logger.js (ESM)
// Simple file logger that also writes to console.
// Creates ./logs/ if missing and writes to a daily log file.

import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function todayFilename(prefix = "awardXP") {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return path.join(LOG_DIR, `${prefix}-${yyyy}${mm}${dd}.log`);
}

function writeLine(level, msg, prefix = "awardXP") {
  try {
    const f = todayFilename(prefix);
    const ts = new Date().toISOString();
    const text = typeof msg === "string" ? msg : JSON.stringify(msg);
    const line = `[${ts}] [${level}] ${text}\n`;
    fs.appendFileSync(f, line, { encoding: "utf8" });
  } catch (err) {
    // Logging must not throw — fallback to console
    console.error("Logger write failed:", err);
  }
}

export function info(msg, opts = {}) {
  const prefix = opts.prefix ?? "awardXP";
  writeLine("INFO", msg, prefix);
  console.log(msg);
}

export function warn(msg, opts = {}) {
  const prefix = opts.prefix ?? "awardXP";
  writeLine("WARN", msg, prefix);
  console.warn(msg);
}

export function error(msg, opts = {}) {
  const prefix = opts.prefix ?? "awardXP";
  writeLine("ERROR", msg, prefix);
  console.error(msg);
}

export function json(obj, opts = {}) {
  const prefix = opts.prefix ?? "awardXP";
  writeLine("JSON", JSON.stringify(obj, null, 0), prefix);
}