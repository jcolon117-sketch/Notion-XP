// systems/lootEngine.js
import crypto from 'crypto'
import { lootTables } from './lootTables.js'

function roll(percent) {
  return crypto.randomInt(0, 100) < percent
}

function rollQty([min, max]) {
  return crypto.randomInt(min, max + 1)
}

export function rollLoot(tableName) {
  const table = lootTables[tableName]
  if (!table) throw new Error(`Loot table not found: ${tableName}`)

  const drops = []

  for (const item of table) {
    if (roll(item.chance)) {
      drops.push({
        id: item.id,
        qty: rollQty(item.qty)
      })
    }
  }

  return drops
}
