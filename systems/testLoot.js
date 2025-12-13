import Inventory from './Inventory.js'

const inventory = new Inventory()

await inventory.addItem({
  characterId: process.env.TEST_CHARACTER_ID,
  itemId: process.env.TEST_ITEM_ID,
  quantity: 1,
  source: 'Loot'
})

console.log('✅ Loot test completed')
