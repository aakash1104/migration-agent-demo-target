import {
  addDays,
  addHours,
  addMinutes,
  compareAsc,
  intervalToDuration,
  parseISO,
  subMonths,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const UTC = "UTC";

export function durationFromMinutes(minutes: number): string {
  const duration = intervalToDuration({ start: 0, end: minutes * 60 * 1000 });
  return `${duration.hours ?? 0}h ${duration.minutes ?? 0}m`;
}

export function durationFromSeconds(seconds: number): string {
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
  return `${duration.minutes ?? 0}m ${duration.seconds ?? 0}s`;
}

export function compareWindows(left: string, right: string): "before" | "after" | "same" {
  const cmp = compareAsc(parseISO(left), parseISO(right));
  if (cmp < 0) return "before";
  if (cmp > 0) return "after";
  return "same";
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/** Sunday-start week boundaries in UTC (Moment default locale). */
function startOfUtcWeek(d: Date): Date {
  const sod = startOfUtcDay(d);
  return addDays(sod, -sod.getUTCDay());
}

function endOfUtcWeek(d: Date): Date {
  const weekEndDay = addDays(startOfUtcWeek(d), 6);
  return new Date(
    Date.UTC(
      weekEndDay.getUTCFullYear(),
      weekEndDay.getUTCMonth(),
      weekEndDay.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

export function rollingRangeLabel(input: string): string {
  const d = parseISO(input);
  const start = startOfUtcWeek(d);
  const end = endOfUtcWeek(d);
  return `${formatInTimeZone(start, UTC, "MM/dd")} - ${formatInTimeZone(end, UTC, "MM/dd")}`;
}

export function scheduleOffset(input: string, hours: number, minutes: number): string {
  const shifted = addMinutes(addHours(parseISO(input), hours), minutes);
  return formatInTimeZone(shifted, UTC, "yyyy-MM-dd HH:mm");
}

export function quarterLabel(input: string): string {
  const d = parseISO(input);
  const monthUtc = d.getUTCMonth();
  const quarter = Math.floor(monthUtc / 3) + 1;
  return `Q${quarter} ${formatInTimeZone(d, UTC, "yyyy")}`;
}

function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

export function reportPeriodLabel(input: string): string {
  const d = parseISO(input);
  const base = startOfUtcMonth(d);
  const previous = subMonths(base, 1);
  return `${formatInTimeZone(previous, UTC, "MMM yyyy")} -> ${formatInTimeZone(base, UTC, "MMM yyyy")}`;
}
