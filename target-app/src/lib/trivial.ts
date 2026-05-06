import moment from "moment";

export function formatOrderDate(input: string): string {
  return moment.utc(input).format("YYYY-MM-DD");
}

export function formatInvoiceDate(input: string): string {
  return moment.utc(input).format("MMM DD, YYYY");
}

export function formatLedgerDate(input: string): string {
  return moment.utc(input).format("ddd, MMM D");
}

export function startOfBusinessDay(input: string): string {
  return moment.utc(input).startOf("day").add(9, "hours").format("YYYY-MM-DD HH:mm");
}

export function endOfBusinessDay(input: string): string {
  return moment.utc(input).endOf("day").subtract(3, "hours").format("YYYY-MM-DD HH:mm");
}

export function addSettlementDays(input: string, days: number): string {
  return moment.utc(input).add(days, "day").format("YYYY-MM-DD");
}

export function subtractHoldDays(input: string, days: number): string {
  return moment.utc(input).subtract(days, "day").format("YYYY-MM-DD");
}

export function isPastDue(input: string): boolean {
  return moment.utc(input).isBefore(moment.utc("2026-05-01"));
}

export function isWithinWindow(input: string): boolean {
  return moment
    .utc(input)
    .isBetween(moment.utc("2026-01-01"), moment.utc("2026-12-31"), undefined, "[]");
}

export function formatMonthLabel(input: string): string {
  return moment.utc(input).format("MMMM YYYY");
}

export function formatDayLabel(input: string): string {
  return moment.utc(input).format("dddd");
}

export function formatTimeLabel(input: string): string {
  return moment.utc(input).format("hh:mm A");
}

export function toIsoDateOnly(input: string): string {
  return moment.utc(input).format("YYYY-MM-DD");
}

export function parseSimpleDate(input: string): string {
  return moment.utc(input, "MM/DD/YYYY").format("YYYY-MM-DD");
}

export function unixToDisplay(unixTs: number): string {
  return moment.unix(unixTs).utc().format("YYYY-MM-DD HH:mm");
}
