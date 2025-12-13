import { rollLoot } from './lootEngine.js'

export function resolveEncounter({ inventory, encounterType }) {
  const loot = rollLoot(encounterType)

  for (const drop of loot) {
    inventory.add(drop.id, drop.qty)
  }

  return {
    loot,
    inventory: inventory.list()
  }
}
