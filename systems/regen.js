// systems/regen.js
// Generic resource regeneration helper (not wired into Character DB yet)

export function regenResource(current, max, ratePerHour, lastRegen) {
  if (!lastRegen) {
    return { value: current, timestamp: new Date().toISOString() };
  }

  const now = Date.now();
  const last = new Date(lastRegen).getTime();
  const hoursPassed = (now - last) / (1000 * 60 * 60);

  const regenAmount = Math.floor(hoursPassed * ratePerHour);
  if (regenAmount <= 0) {
    return { value: current, timestamp: lastRegen };
  }

  return {
    value: Math.min(current + regenAmount, max),
    timestamp: new Date().toISOString(),
  };
}