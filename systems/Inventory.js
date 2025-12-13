import 'dotenv/config'
import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_TOKEN
})

export default class Inventory {
  async addItem({
    characterId,
    itemId,
    quantity = 1,
    source = 'Loot'
  }) {
    return notion.pages.create({
      parent: { database_id: process.env.INV_DB },
      properties: {
        // ✅ MUST match Notion title property name EXACTLY
        "Item Name": {
          title: [
            {
              text: { content: 'Looted Item' }
            }
          ]
        },

        Owner: {
          relation: [{ id: characterId }]
        },

        Item: {
          relation: [{ id: itemId }]
        },

        Quantity: {
          number: quantity
        },

        "Acquired From": {
          select: { name: source }
        },

        "Acquired At": {
          date: { start: new Date().toISOString() }
        }
      }
    })
  }
}

