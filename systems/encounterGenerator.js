import 'dotenv/config'
import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_TOKEN
})

/**
 * Auto-generate real-life encounters if none exist
 * Called by encounterEngine.js
 */
export async function generateEncountersIfMissing() {
  const existing = await notion.databases.query({
    database_id: process.env.ENCOUNTERS_DB
  })

  if (existing.results.length > 0) {
    return
  }

  console.log('🧠 Generating real-life encounters...')

  const encounters = [
    {
      name: 'You unexpectedly talk to someone new today.',
      description: 'A spontaneous social interaction in real life.',
      xp: 10,
      type: 'Social'
    },
    {
      name: 'You complete a small task you were avoiding.',
      description: 'You push past resistance and get something done.',
      xp: 8,
      type: 'Discovery'
    },
    {
      name: 'You go outside for a short walk.',
      description: 'A simple physical activity that clears your mind.',
      xp: 6,
      type: 'Environment'
    }
  ]

  for (const e of encounters) {
    await notion.pages.create({
      parent: {
        database_id: process.env.ENCOUNTERS_DB
      },
      properties: {
        /* ───────── REQUIRED PROPERTIES ───────── */

        Name: {
          title: [{ text: { content: e.name } }]
        },

        Type: {
          select: { name: e.type }
        },

        Description: {
          rich_text: [{ text: { content: e.description } }]
        },

        Active: {
          checkbox: true
        },

        'Min Level': {
          number: 1
        },

        'Max Level': {
          number: 99
        },

        Weight: {
          number: 1
        },

        /* ───────── REWARDS (XP ONLY) ───────── */

        'XP Reward': {
          number: e.xp
        },

        'Energy Cost': {
          number: 0
        }

        /* ❌ NO ITEMS
           ❌ NO LOOT
           ❌ NO GOLD
           ❌ NO RELATIONS */
      }
    })
  }

  console.log(`✅ ${encounters.length} real-life encounters generated`)
}
