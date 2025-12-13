// systems/lootTables.js
export const lootTables = {
  basic_encounter: [
    { id: 'gold_coin', chance: 60, qty: [1, 5] },
    { id: 'health_potion', chance: 25, qty: [1, 1] },
    { id: 'rusty_dagger', chance: 5, qty: [1, 1] }
  ],

  rare_encounter: [
    { id: 'gold_coin', chance: 100, qty: [10, 25] },
    { id: 'mana_potion', chance: 40, qty: [1, 2] },
    { id: 'enchanted_ring', chance: 10, qty: [1, 1] }
  ]
}
