// routes/encounter.js
import { rollEncounter } from "../systems/encounterEngine.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { charId } = req.body;

    if (!charId) {
      return res.status(400).json({ error: "Missing charId" });
    }

    const result = await rollEncounter(charId);

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (err) {
    console.error("❌ Encounter API error:", err);
    return res.status(500).json({
      error: "Encounter failed",
      details: err.message,
    });
  }
}