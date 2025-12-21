// systems/inactivityPenalty.js
// Backend helper (optional). Not used by default because Notion formulas handle penalties.

export function calculateInactivityPenalty(daysMissed) {
  if (daysMissed <= 0) {
    return {
      xpModifier: 1,
      energyModifier: 1,
      staminaModifier: 1,
      fatigue: 0,
      stacks: 0,
    };
  }

  const stacks = Math.min(daysMissed, 5);

  const xpPenalty = Math.min(stacks * 0.05, 0.3);
  const energyPenalty = Math.min(Math.max(0, stacks - 1) * 0.05, 0.25);
  const staminaPenalty = Math.min(Math.max(0, stacks - 3) * 0.05, 0.2);

  return {
    xpModifier: +(1 - xpPenalty).toFixed(2),
    energyModifier: +(1 - energyPenalty).toFixed(2),
    staminaModifier: +(1 - staminaPenalty).toFixed(2),
    fatigue: stacks * 10,
    stacks,
  };
}
