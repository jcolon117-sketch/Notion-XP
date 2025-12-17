// systems/penaltyDecay.js
export function decayPenalty(value, rate = 0.05) {
  if (value >= 1) return 1;
  return Math.min(1, +(value + rate).toFixed(2));
}
