// api/sync.js
import { syncProgress } from "../systems/syncProgress.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { charId, generateDailies, allowEncounters } = req.body;

    if (!charId) {
      return res.status(400).json({ error: "Missing charId" });
    }

    const result = await syncProgress(charId, {
      generateDailies,
      allowEncounters,
    });

    return res.status(200).json({
      success: true,
      result,
    });

  } catch (err) {
    console.error("❌ Sync failed:", err);
    return res.status(500).json({
      error: "Sync failed",
      details: err.message,
    });
  }
}