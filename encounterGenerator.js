// encounterGenerator.js
import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const ENCOUNTERS_DB = process.env.ENCOUNTERS_DB;

// Fetch active encounters
async function getActiveEncounters() {
  const response = await notion.databases.query({
    database_id: ENCOUNTERS_DB,
    filter: {
      property: "Active",
      checkbox: { equals: true }
    }
  });

  return response.results;
}

// Weighted roll
function weightedRandom(encounters) {
  const totalWeight = encounters.reduce(
    (sum, e) => sum + (e.properties["Weight"]?.number ?? 1),
    0
  );

  let roll = Math.random() * totalWeight;

  for (const enc of encounters) {
    const weight = enc.properties["Weight"]?.number ?? 1;
    if (roll < weight) return enc;
    roll -= weight;
  }
  return encounters[0];
}

export async function generateEncounter(characterLevel = 1) {
  const events = await getActiveEncounters();

  // Optional: filter by level
  const valid = events.filter(e => {
    const min = e.properties["Min Level"]?.number ?? 0;
    const max = e.properties["Max Level"]?.number ?? 999;
    return characterLevel >= min && characterLevel <= max;
  });

  if (valid.length === 0) return null;

  return weightedRandom(valid);
}