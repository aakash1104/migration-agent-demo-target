import { parseISO, isValid, isBefore, subHours } from "date-fns";
import { isWithinInterval } from "date-fns/isWithinInterval";
import { formatInTimeZone } from "date-fns-tz";

function parseUtc(input: string): Date {
  const d = parseISO(input.trim());
  if (!isValid(d)) {
    return new Date(NaN);
  }
  return d;
}

/** Calendar day arithmetic in UTC (equivalent to prior utc-mode day add/subtract). */
function utcAddCalendarDays(date: Date, amount: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + amount,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
}

/** Mirrors Moment formatting for invalid dates (`format` → `"Invalid date"`); avoids date-fns-tz throwing. */
function formatUtc(date: Date, pattern: string): string {
  if (!isValid(date)) return "Invalid date";
  return formatInTimeZone(date, "UTC", pattern);
}

export function formatOrderDate(input: string): string {
  return formatUtc(parseUtc(input), "yyyy-MM-dd");
}

export function formatInvoiceDate(input: string): string {
  return formatUtc(parseUtc(input), "MMM dd, yyyy");
}

export function formatLedgerDate(input: string): string {
  return formatUtc(parseUtc(input), "EEE, MMM d");
}

export function startOfBusinessDay(input: string): string {
  const d = parseUtc(input);
  const start = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 9, 0, 0, 0),
  );
  return formatUtc(start, "yyyy-MM-dd HH:mm");
}

export function endOfBusinessDay(input: string): string {
  const d = parseUtc(input);
  const endOfUtcDay = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999),
  );
  const shifted = subHours(endOfUtcDay, 3);
  return formatUtc(shifted, "yyyy-MM-dd HH:mm");
}

export function addSettlementDays(input: string, days: number): string {
  const d = utcAddCalendarDays(parseUtc(input), days);
  return formatUtc(d, "yyyy-MM-dd");
}

export function subtractHoldDays(input: string, days: number): string {
  const d = utcAddCalendarDays(parseUtc(input), -days);
  return formatUtc(d, "yyyy-MM-dd");
}

export function isPastDue(input: string): boolean {
  return isBefore(parseUtc(input), parseISO("2026-05-01"));
}

export function isWithinWindow(input: string): boolean {
  const d = parseUtc(input);
  const start = parseISO("2026-01-01");
  const end = parseISO("2026-12-31");
  return isWithinInterval(d, { start, end });
}

export function formatMonthLabel(input: string): string {
  return formatUtc(parseUtc(input), "MMMM yyyy");
}

export function formatDayLabel(input: string): string {
  return formatUtc(parseUtc(input), "EEEE");
}

export function formatTimeLabel(input: string): string {
  return formatUtc(parseUtc(input), "hh:mm a");
}

export function toIsoDateOnly(input: string): string {
  return formatUtc(parseUtc(input), "yyyy-MM-dd");
}

export function parseSimpleDate(input: string): string {
  const match = input.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    return "Invalid date";
  }
  const [, mm, dd, yyyy] = match;
  const utcMs = Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd));
  return formatUtc(new Date(utcMs), "yyyy-MM-dd");
}

export function unixToDisplay(unixTs: number): string {
  return formatUtc(new Date(unixTs * 1000), "yyyy-MM-dd HH:mm");
}
