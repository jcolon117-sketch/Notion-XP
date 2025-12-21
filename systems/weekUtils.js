// systems/weekUtils.js

const MS_PER_DAY = 86400000;

// ---------------------------
// ISO Week Calculation
// ---------------------------
export function getISOWeek(date = new Date()) {
  const d = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );

  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);

  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / MS_PER_DAY + 1) / 7);

  return {
    year: d.getUTCFullYear(),
    week,
  };
}

// ---------------------------
// Stable Week Key (for Notion)
// ---------------------------
export function getWeekKey(date = new Date()) {
  const { year, week } = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

// ---------------------------
// Week Start (Monday)
// ---------------------------
export function getWeekStart(date = new Date()) {
  const d = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );

  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  d.setUTCHours(0, 0, 0, 0);

  return d;
}

// ---------------------------
// Week End (Sunday)
// ---------------------------
export function getWeekEnd(date = new Date()) {
  const start = getWeekStart(date);
  const end = new Date(start.getTime() + 6 * MS_PER_DAY);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

// ---------------------------
// Date-in-Week Check
// ---------------------------
export function isDateInWeek(date, weekKey) {
  return getWeekKey(date) === weekKey;
}