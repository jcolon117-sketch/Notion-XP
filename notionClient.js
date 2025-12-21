// notionClient.js
import "dotenv/config";
import { Client } from "@notionhq/client";

// ---------------------------------------------
// ENV VALIDATION
// ---------------------------------------------
if (!process.env.NOTION_API_KEY) {
  throw new Error("❌ NOTION_API_KEY is not set");
}

// ---------------------------------------------
// CLIENT
// ---------------------------------------------
export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// ---------------------------------------------
// INTERNAL HELPERS
// ---------------------------------------------
function normalizeKey(key) {
  return key.replace(/\s+/g, "").toLowerCase();
}

// ---------------------------------------------
// PROPERTY RESOLUTION
// ---------------------------------------------
export function getProp(props, candidates = []) {
  if (!props) return undefined;

  const normalizedMap = Object.entries(props).reduce((acc, [key, value]) => {
    acc[normalizeKey(key)] = value;
    return acc;
  }, {});

  for (const name of candidates) {
    const normalized = normalizeKey(name);
    if (normalizedMap[normalized] !== undefined) {
      return normalizedMap[normalized];
    }
  }

  return undefined;
}

// ---------------------------------------------
// TYPE-SAFE GETTERS
// ---------------------------------------------
export function getNumber(props, candidates = [], fallback = 0) {
  const p = getProp(props, candidates);
  return p?.number ?? fallback;
}

export function getCheckbox(props, candidates = [], fallback = false) {
  const p = getProp(props, candidates);
  return p?.checkbox ?? fallback;
}

export function getSelect(props, candidates = []) {
  const p = getProp(props, candidates);
  return p?.select?.name ?? null;
}

export function getStatus(props, candidates = []) {
  const p = getProp(props, candidates);
  return p?.status?.name ?? null;
}

export function getTitle(props, candidates = []) {
  const p = getProp(props, candidates);
  return p?.title?.[0]?.plain_text ?? null;
}

export function getRichText(props, candidates = []) {
  const p = getProp(props, candidates);
  return p?.rich_text?.map((t) => t.plain_text).join("") ?? null;
}

export function getDate(props, candidates = []) {
  const p = getProp(props, candidates);
  return p?.date?.start ? new Date(p.date.start) : null;
}

export function getRelationIds(props, candidates = []) {
  const p = getProp(props, candidates);
  return p?.relation?.map((r) => r.id) ?? [];
}

// ---------------------------------------------
// DEBUGGING UTILITY
// ---------------------------------------------
export function assertProp(props, candidates = [], label = "Property") {
  const p = getProp(props, candidates);
  if (!p) {
    throw new Error(`❌ Missing ${label}. Tried: ${candidates.join(", ")}`);
  }
  return p;
}