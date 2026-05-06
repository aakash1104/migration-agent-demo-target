import { isAfter, isBefore, isValid, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { enUS } from "date-fns/locale/en-US";

/**
 * Parses ISO-ish strings the way `moment.utc(input)` did for this module:
 * date-only `YYYY-MM-DD` is midnight UTC; full ISO uses `parseISO`.
 */
function parseUtc(isoOrFormatted: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoOrFormatted);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  }
  const parsed = parseISO(isoOrFormatted);
  if (!isValid(parsed)) {
    throw new RangeError(`Invalid date: ${isoOrFormatted}`);
  }
  return parsed;
}

function startOfUtcWeekSundayStart(d: Date): Date {
  const y = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();
  const weekday = d.getUTCDay();
  const utcMidnight = Date.UTC(y, month, day, 0, 0, 0, 0);
  return new Date(utcMidnight - weekday * 86400000);
}

function endOfUtcWeekSundayStart(d: Date): Date {
  const start = startOfUtcWeekSundayStart(d);
  return new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate() + 6,
      23,
      59,
      59,
      999,
    ),
  );
}

export function durationFromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function durationFromSeconds(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${min}m ${s}s`;
}

export function compareWindows(left: string, right: string): "before" | "after" | "same" {
  const leftDate = parseUtc(left);
  const rightDate = parseUtc(right);
  if (isBefore(leftDate, rightDate)) return "before";
  if (isAfter(leftDate, rightDate)) return "after";
  return "same";
}

export function rollingRangeLabel(input: string): string {
  const d = parseUtc(input);
  const start = startOfUtcWeekSundayStart(d);
  const end = endOfUtcWeekSundayStart(d);
  return `${formatInTimeZone(start, "UTC", "MM/dd")} - ${formatInTimeZone(end, "UTC", "MM/dd")}`;
}

export function scheduleOffset(input: string, hours: number, minutes: number): string {
  const base = parseUtc(input);
  const out = new Date(
    base.getTime() + hours * 60 * 60 * 1000 + minutes * 60 * 1000,
  );
  return formatInTimeZone(out, "UTC", "yyyy-MM-dd HH:mm");
}

export function quarterLabel(input: string): string {
  const d = parseUtc(input);
  const month = d.getUTCMonth();
  const quarter = Math.floor(month / 3) + 1;
  return `Q${quarter} ${formatInTimeZone(d, "UTC", "yyyy")}`;
}

export function reportPeriodLabel(input: string): string {
  const d = parseUtc(input);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const base = new Date(Date.UTC(y, m, 1));
  const previous = new Date(Date.UTC(y, m - 1, 1));
  return `${formatInTimeZone(previous, "UTC", "MMM yyyy", { locale: enUS })} -> ${formatInTimeZone(base, "UTC", "MMM yyyy", { locale: enUS })}`;
}
