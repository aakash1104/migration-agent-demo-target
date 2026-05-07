import {
  addDays,
  addHours,
  fromUnixTime,
  isBefore,
  isWithinInterval,
  parseISO,
  subDays,
  subHours,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const UTC = "UTC";

function parseAsUtc(input: string): Date {
  return parseISO(input);
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function endOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

export function formatOrderDate(input: string): string {
  return formatInTimeZone(parseAsUtc(input), UTC, "yyyy-MM-dd");
}

export function formatInvoiceDate(input: string): string {
  return formatInTimeZone(parseAsUtc(input), UTC, "MMM dd, yyyy");
}

export function formatLedgerDate(input: string): string {
  return formatInTimeZone(parseAsUtc(input), UTC, "EEE, MMM d");
}

export function startOfBusinessDay(input: string): string {
  const dayStart = startOfUtcDay(parseAsUtc(input));
  const shifted = addHours(dayStart, 9);
  return formatInTimeZone(shifted, UTC, "yyyy-MM-dd HH:mm");
}

export function endOfBusinessDay(input: string): string {
  const dayEnd = endOfUtcDay(parseAsUtc(input));
  const shifted = subHours(dayEnd, 3);
  return formatInTimeZone(shifted, UTC, "yyyy-MM-dd HH:mm");
}

export function addSettlementDays(input: string, days: number): string {
  const next = addDays(parseAsUtc(input), days);
  return formatInTimeZone(next, UTC, "yyyy-MM-dd");
}

export function subtractHoldDays(input: string, days: number): string {
  const next = subDays(parseAsUtc(input), days);
  return formatInTimeZone(next, UTC, "yyyy-MM-dd");
}

export function isPastDue(input: string): boolean {
  return isBefore(parseAsUtc(input), parseAsUtc("2026-05-01"));
}

export function isWithinWindow(input: string): boolean {
  return isWithinInterval(parseAsUtc(input), {
    start: parseAsUtc("2026-01-01"),
    end: parseAsUtc("2026-12-31"),
  });
}

export function formatMonthLabel(input: string): string {
  return formatInTimeZone(parseAsUtc(input), UTC, "MMMM yyyy");
}

export function formatDayLabel(input: string): string {
  return formatInTimeZone(parseAsUtc(input), UTC, "EEEE");
}

export function formatTimeLabel(input: string): string {
  return formatInTimeZone(parseAsUtc(input), UTC, "hh:mm a");
}

export function toIsoDateOnly(input: string): string {
  return formatInTimeZone(parseAsUtc(input), UTC, "yyyy-MM-dd");
}

export function parseSimpleDate(input: string): string {
  const [monthStr, dayStr, yearStr] = input.split("/");
  const month = Number(monthStr) - 1;
  const day = Number(dayStr);
  const year = Number(yearStr);
  const utcCalendar = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  return formatInTimeZone(utcCalendar, UTC, "yyyy-MM-dd");
}

export function unixToDisplay(unixTs: number): string {
  return formatInTimeZone(fromUnixTime(unixTs), UTC, "yyyy-MM-dd HH:mm");
}
