import { isBefore, isValid, isWithinInterval, parseISO } from "date-fns";
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

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}

function endOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

function addUtcDays(d: Date, amount: number): Date {
  const next = new Date(d.getTime());
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function subtractUtcDays(d: Date, amount: number): Date {
  return addUtcDays(d, -amount);
}

export function formatOrderDate(input: string): string {
  return formatInTimeZone(parseUtc(input), "UTC", "yyyy-MM-dd");
}

export function formatInvoiceDate(input: string): string {
  return formatInTimeZone(parseUtc(input), "UTC", "MMM dd, yyyy", {
    locale: enUS,
  });
}

export function formatLedgerDate(input: string): string {
  return formatInTimeZone(parseUtc(input), "UTC", "EEE, MMM d", {
    locale: enUS,
  });
}

export function startOfBusinessDay(input: string): string {
  const base = startOfUtcDay(parseUtc(input));
  const atNineUtc = new Date(
    Date.UTC(
      base.getUTCFullYear(),
      base.getUTCMonth(),
      base.getUTCDate(),
      9,
      0,
      0,
      0,
    ),
  );
  return formatInTimeZone(atNineUtc, "UTC", "yyyy-MM-dd HH:mm");
}

export function endOfBusinessDay(input: string): string {
  const end = endOfUtcDay(parseUtc(input));
  const adjusted = new Date(end.getTime() - 3 * 60 * 60 * 1000);
  return formatInTimeZone(adjusted, "UTC", "yyyy-MM-dd HH:mm");
}

export function addSettlementDays(input: string, days: number): string {
  return formatInTimeZone(
    addUtcDays(parseUtc(input), days),
    "UTC",
    "yyyy-MM-dd",
  );
}

export function subtractHoldDays(input: string, days: number): string {
  return formatInTimeZone(
    subtractUtcDays(parseUtc(input), days),
    "UTC",
    "yyyy-MM-dd",
  );
}

export function isPastDue(input: string): boolean {
  return isBefore(parseUtc(input), parseUtc("2026-05-01"));
}

export function isWithinWindow(input: string): boolean {
  return isWithinInterval(parseUtc(input), {
    start: parseUtc("2026-01-01"),
    end: parseUtc("2026-12-31"),
  });
}

export function formatMonthLabel(input: string): string {
  return formatInTimeZone(parseUtc(input), "UTC", "MMMM yyyy", {
    locale: enUS,
  });
}

export function formatDayLabel(input: string): string {
  return formatInTimeZone(parseUtc(input), "UTC", "EEEE", { locale: enUS });
}

export function formatTimeLabel(input: string): string {
  return formatInTimeZone(parseUtc(input), "UTC", "hh:mm a", { locale: enUS });
}

export function toIsoDateOnly(input: string): string {
  return formatInTimeZone(parseUtc(input), "UTC", "yyyy-MM-dd");
}

export function parseSimpleDate(input: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(input.trim());
  if (!m) {
    throw new RangeError(`Invalid simple date: ${input}`);
  }
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = Number(m[3]);
  const utcMidnight = new Date(Date.UTC(year, month - 1, day));
  if (
    !isValid(utcMidnight) ||
    utcMidnight.getUTCFullYear() !== year ||
    utcMidnight.getUTCMonth() + 1 !== month ||
    utcMidnight.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid calendar date: ${input}`);
  }
  return formatInTimeZone(utcMidnight, "UTC", "yyyy-MM-dd");
}

export function unixToDisplay(unixTs: number): string {
  const instant = new Date(unixTs * 1000);
  return formatInTimeZone(instant, "UTC", "yyyy-MM-dd HH:mm");
}
