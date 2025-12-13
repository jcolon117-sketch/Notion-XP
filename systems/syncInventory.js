import 'dotenv/config'
import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_TOKEN
})

const INVENTORY_DB = process.env.INV_DB

if (!INVENTORY_DB) {
  throw new Error('INV_DB missing from .env')
}

/**
 * Sync loot into Notion Inventory
 * @param {string} characterId
 * @param {Array<{ itemId: string, qty: number, source: string }>} loot
 */
export async function syncInventory(characterId, loot = []) {
  for (const entry of loot) {
    const { itemId, qty, source } = entry

    // 1️⃣ Load item data
    const itemPage = await notion.pages.retrieve({ page_id: itemId })
    const itemProps = itemPage.properties

    const itemName =
      itemProps.Name?.title?.[0]?.plain_text ?? 'Unknown Item'

    const slot =
      itemProps.Slot?.select?.name ?? 'Accessory'

    const stackable =
      itemProps.Stackable?.checkbox ?? false

    const baseDurability =
      itemProps['Base Durability']?.number ?? null

    // 2️⃣ Check if character already has this item
    const existing = await notion.databases.query({
      database_id: INVENTORY_DB,
      filter: {
        and: [
          {
            property: 'Owner',
            relation: { contains: characterId }
          },
          {
            property: 'Item',
            relation: { contains: itemId }
          }
        ]
      }
    })

    // 3️⃣ Stack if possible
    if (stackable && existing.results.length > 0) {
      const row = existing.results[0]
      const currentQty =
        row.properties.Quantity?.number ?? 0

      await notion.pages.update({
        page_id: row.id,
        properties: {
          Quantity: {
            number: currentQty + qty
          }
        }
      })

      console.log(`➕ Stacked ${itemName} → ${currentQty + qty}`)
      continue
    }

    // 4️⃣ Otherwise create new inventory row
    await notion.pages.create({
      parent: { database_id: INVENTORY_DB },
      properties: {
        Name: {
          title: [{ text: { content: itemName } }]
        },
        Owner: {
          relation: [{ id: characterId }]
        },
        Item: {
          relation: [{ id: itemId }]
        },
        Quantity: {
          number: qty
        },
        'Equipped?': {
          checkbox: false
        },
        Slot: {
          select: { name: slot }
        },
        Durability: baseDurability
          ? { number: baseDurability }
          : undefined,
        'Acquired From': {
          select: { name: source }
        },
        'Acquired At': {
          date: { start: new Date().toISOString() }
        }
      }
    })

    console.log(`🆕 Added ${itemName} x${qty}`)
  }
}
