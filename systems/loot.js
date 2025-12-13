// systems/loot.js
export function rollDrop(chance) {
  return Math.random() * 100 < chance;
}
