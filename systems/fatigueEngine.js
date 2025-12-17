// systems/fatigueEngine.js

/**
 * Fatigue rules:
 * - +1 fatigue per quest
 * - Max fatigue = 10
 * - Each fatigue reduces rewards by 3%
 * - Max reduction = 30%
 */

export function calculateFatigueModifier(fatigue) {
  const reduction = Math.min(fatigue * 0.03, 0.3);
  return Number((1 - reduction).toFixed(2));
}

export function increaseFatigue(current) {
  return Math.min((current ?? 0) + 1, 10);
}
