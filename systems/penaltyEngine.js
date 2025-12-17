// systems/penaltyEngine.js
import "dotenv/config";
import { Client } from "@notionhq/client";

const notion = new Client;({ auth: process.env.NOTION_TOKEN });

export async function applyPenalty({
    characterId,
    type,
    source
}) {
    const severityMap = {
        Minor: 1,
        Major: 3,
        Fatigue: 2
    };

    const durationMap = {
        Minor: 1,
        Major: 3,
        Fatigue: 2
    };

    const severity = severityMap[type] ?? 1;
    const duration = durationMap[type] ?? 1;

    await notion.pages.create({
        parent: { database_id: process.env.PENALTIES_DB },
        properties: {
            Name: {title: [{ text: { content: `${type} Penalty` } }] },
            Type: { select: { name: type } },
            Source: { select: { name: source } },
            Severity: { number: severity },
            "Duration (Days)": { number: duration },
            "Applied On": { date: { start: new Date().toISOString() } },
            User: { relation: [{ id: characterId }] }
        }
    });

    console.log(`⚠️  ${type} penatly applied`);
} 
