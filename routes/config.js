// routes/config.js

export default function handler(req, res) {
  const defaultCharId = process.env.NOTION_PLAYER_ID || null;

  return res.status(200).json({
    defaultCharId,
  });
}