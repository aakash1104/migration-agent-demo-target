import {
  addHours,
  fromUnixTime,
  isBefore,
  isValid,
  isWithinInterval,
  parse,
  parseISO,
  subHours,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

function parseUtcInput(input: string): Date {
  const trimmed = input.trim();
  const fromIso = parseISO(trimmed);
  if (isValid(fromIso)) {
    return fromIso;
  }
  return new Date(trimmed);
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

function addUtcCalendarDays(date: Date, days: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + days,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
}

function formatUtcOrInvalid(input: string, pattern: string): string {
  const d = parseUtcInput(input);
  if (!isValid(d)) {
    return "Invalid date";
  }
  return formatInTimeZone(d, "UTC", pattern);
}

export function formatOrderDate(input: string): string {
  return formatUtcOrInvalid(input, "yyyy-MM-dd");
}

export function formatInvoiceDate(input: string): string {
  return formatUtcOrInvalid(input, "MMM dd, yyyy");
}

export function formatLedgerDate(input: string): string {
  return formatUtcOrInvalid(input, "EEE, MMM d");
}

export function startOfBusinessDay(input: string): string {
  const d = parseUtcInput(input);
  if (!isValid(d)) {
    return "Invalid date";
  }
  const withHours = addHours(startOfUtcDay(d), 9);
  return formatInTimeZone(withHours, "UTC", "yyyy-MM-dd HH:mm");
}

export function endOfBusinessDay(input: string): string {
  const d = parseUtcInput(input);
  if (!isValid(d)) {
    return "Invalid date";
  }
  const withSubtract = subHours(endOfUtcDay(d), 3);
  return formatInTimeZone(withSubtract, "UTC", "yyyy-MM-dd HH:mm");
}

export function addSettlementDays(input: string, days: number): string {
  const d = parseUtcInput(input);
  if (!isValid(d)) {
    return "Invalid date";
  }
  return formatInTimeZone(addUtcCalendarDays(d, days), "UTC", "yyyy-MM-dd");
}

export function subtractHoldDays(input: string, days: number): string {
  const d = parseUtcInput(input);
  if (!isValid(d)) {
    return "Invalid date";
  }
  return formatInTimeZone(addUtcCalendarDays(d, -days), "UTC", "yyyy-MM-dd");
}

export function isPastDue(input: string): boolean {
  const d = parseUtcInput(input);
  const cutoff = new Date(Date.UTC(2026, 4, 1));
  return isValid(d) && isBefore(d, cutoff);
}

export function isWithinWindow(input: string): boolean {
  const d = parseUtcInput(input);
  if (!isValid(d)) {
    return false;
  }
  const start = new Date(Date.UTC(2026, 0, 1));
  const end = new Date(Date.UTC(2026, 11, 31));
  return isWithinInterval(d, { start, end });
}

export function formatMonthLabel(input: string): string {
  return formatUtcOrInvalid(input, "MMMM yyyy");
}

export function formatDayLabel(input: string): string {
  return formatUtcOrInvalid(input, "EEEE");
}

export function formatTimeLabel(input: string): string {
  return formatUtcOrInvalid(input, "hh:mm a");
}

export function toIsoDateOnly(input: string): string {
  return formatUtcOrInvalid(input, "yyyy-MM-dd");
}

export function parseSimpleDate(input: string): string {
  const parsed = parse(input.trim(), "MM/dd/yyyy", new Date(0));
  if (!isValid(parsed)) {
    return "Invalid date";
  }
  const utc = new Date(
    Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
  );
  return formatInTimeZone(utc, "UTC", "yyyy-MM-dd");
}

export function unixToDisplay(unixTs: number): string {
  return formatInTimeZone(fromUnixTime(unixTs), "UTC", "yyyy-MM-dd HH:mm");
}
