import 'dotenv/config'
import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_TOKEN
})

/**
 * Generates real-life encounters if the database is empty
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
      xp: 10
    },
    {
      name: 'You complete a small task you were avoiding.',
      xp: 8
    },
    {
      name: 'You go outside for a short walk.',
      xp: 6
    }
  ]

  for (const e of encounters) {
    await notion.pages.create({
      parent: {
        database_id: process.env.ENCOUNTERS_DB
      },
      properties: {
        /* REQUIRED TITLE PROPERTY */
        Name: {
          title: [{ text: { content: e.name } }]
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

        'XP Reward': {
          number: e.xp
        },

        'Energy Cost': {
          number: 0
        }
      }
    })
  }

  console.log(`✅ ${encounters.length} real-life encounters generated`)
}
