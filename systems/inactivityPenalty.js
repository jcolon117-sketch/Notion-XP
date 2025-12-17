// systems/inactivityPenalty.js

export function calculateInactivityPenalty(daysMissed) {
  if (daysMissed <= 0) return 1;

  const penalty = Math.min(0.1 * daysMissed, 0.3);
  return +(1 - penalty).toFixed(2);
}
