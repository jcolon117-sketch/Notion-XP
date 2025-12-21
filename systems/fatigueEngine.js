// systems/fatigueEngine.js

/**
 * Fatigue rules (backend-version):
 * - +1 fatigue per quest
 * - Max fatigue = 10
 * - Each fatigue reduces rewards by 3%
 * - Max reduction = 30%
 *
 * NOTE:
 * Your Character DB currently uses its own "Fatigue Level" and "Fatigue Modifier"
 * formulas. This engine is an optional helper if you ever want to move more of
 * that logic into the backend instead of Notion formulas.
 */

export function calculateFatigueModifier(fatigue) {
  const f = fatigue ?? 0;
  const reduction = Math.min(f * 0.03, 0.3);
  return Number((1 - reduction).toFixed(2));
}

export function increaseFatigue(current) {
  return Math.min((current ?? 0) + 1, 10);
}