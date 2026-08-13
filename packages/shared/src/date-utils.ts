/**
 * Single source of truth for UTC -> user-local conversion. timeRisk, dayRisk,
 * quiet-hours checks and the pattern-learning histograms must all bucket
 * events using this exact function, or they will silently disagree with
 * each other about what "now" means for a given user.
 */
export function getLocalHour(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  });
  const hour = Number(formatter.format(date));
  return hour === 24 ? 0 : hour;
}

/** 0 = Sunday, matching JS Date.getDay() convention, but in the user's local timezone. */
export function getLocalDayOfWeek(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  });
  const parts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekday = formatter.format(date);
  return parts.indexOf(weekday);
}

export function minutesBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 60_000;
}

/** True if `hour` falls within a quiet-hours window that may wrap past midnight (e.g. 22 -> 8). */
export function isWithinQuietHours(hour: number, quietStart: number, quietEnd: number): boolean {
  if (quietStart === quietEnd) return false;
  if (quietStart < quietEnd) {
    return hour >= quietStart && hour < quietEnd;
  }
  return hour >= quietStart || hour < quietEnd;
}
