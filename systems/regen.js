// systems/regen.js
export function regenResource(current, max, ratePerHour, lastRegen) {
  const now = Date.now();
  const last = new Date(lastRegen).getTime();
  const hoursPassed = (now - last) / (1000 * 60 * 60);

  const regenAmount = Math.floor(hoursPassed * ratePerHour);
  if (regenAmount <= 0) return { value: current, timestamp: lastRegen };

  return {
    value: Math.min(current + regenAmount, max),
    timestamp: new Date().toISOString()
  };
}
