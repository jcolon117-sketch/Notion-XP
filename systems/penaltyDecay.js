// systems/penaltyDecay.js
// Generic helper for slowly restoring a penalty value toward 1.0

export function decayPenalty(value, rate = 0.05) {
  const v = Number(value ?? 0);
  if (v >= 1) return 1;
  return Math.min(1, +(v + rate).toFixed(2));
}

