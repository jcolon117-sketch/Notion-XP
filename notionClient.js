// notionClient.js
import "dotenv/config";
import { Client } from "@notionhq/client";

export const notion = new Client({ auth: process.env.NOTION_TOKEN });

// utility to safely get a property by a list of candidate names
export function getProp(props, candidates = []) {
  for (const name of candidates) {
    if (props[name] !== undefined) return props[name];
  }
  // fallback: try exact keys
  for (const k of Object.keys(props)) {
    if (k.toLowerCase() === candidates[0]?.toLowerCase?.()) return props[k];
  }
  return undefined;
}