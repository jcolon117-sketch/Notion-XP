// config/gameConfig.js

/* ================================
   LEVELING CONFIG
================================ */

export const LEVEL_XP = {
  base: 100,
  growth: 1.5,
  maxLevel: 100,
  overflowEnabled: true,
};

/* ================================
   STAT LEVELING CONFIG
================================ */

export const STAT_XP = {
  base: 50,
  growth: 1.4,
  maxLevel: 50,
};

/* ================================
   ENERGY & STAMINA
================================ */

export const ENERGY = {
  maxDefault: 100,
  regenPerHour: 5,
  regenTickMinutes: 60,
};

export const STAMINA = {
  maxDefault: 100,
  regenPerHour: 3,
  regenTickMinutes: 60,
};

/* ================================
   FATIGUE & PENALTIES
================================ */

export const FATIGUE = {
  weeklyCap: 100,
  decayPerDay: 10,
  xpPenaltyPerFatigue: 0.01, // 1% per fatigue point
};

export const INACTIVITY = {
  graceDays: 1,
  penaltyPerDay: 5,
  maxPenalty: 50,
};

/* ================================
   QUEST CONFIG
================================ */

export const QUEST_DIFFICULTY_MULTIPLIER = {
  Easy: 1,
  Normal: 1.25,
  Hard: 1.5,
  Elite: 2,
  Legendary: 3,
};

export const QUEST_TYPES = {
  DAILY: "Daily",
  TRAINING: "Training",
  BOSS: "Boss",
  STORY: "Story",
  MILESTONE: "Milestone",
};

/* ================================
   GATE CONFIG
================================ */

export const GATE_RANKS = ["E", "D", "C", "B", "A", "S"];

export const GATE_UNLOCK_RULES = {
  E: { minLevel: 1 },
  D: { minLevel: 5 },
  C: { minLevel: 10 },
  B: { minLevel: 20 },
  A: { minLevel: 35 },
  S: { minLevel: 50 },
};

/* ================================
   ENCOUNTERS
================================ */

export const ENCOUNTER = {
  dailyLimit: 3,
  energyCostDefault: 10,
};

/* ================================
   PRESTIGE SYSTEM
================================ */

export const PRESTIGE = {
  maxRank: 10,
  xpBonusPerRank: 0.05, // +5% XP per prestige
  resetLevelTo: 1,
};

/* ================================
   LOG TYPES (USED EVERYWHERE)
================================ */

export const LOG_TYPES = {
  QUEST: "Quest",
  DAILY: "Daily Quest",
  LEVEL_UP: "Level Up",
  STAT_UP: "Stat Up",
  ENCOUNTER: "Encounter",
  ENERGY: "Energy",
  SYSTEM: "System",
  GATE: "Gate",
  PENALTY: "Penalty",
};