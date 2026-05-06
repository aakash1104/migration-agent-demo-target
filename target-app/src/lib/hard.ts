import { isValid, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export type UserTz = string | null | undefined;

/**
 * Moment-only format tokens → date-fns. Longest-match alternation (YYYY before YY, DD before D, etc.).
 * Identity tokens (MM, HH, mm, …) pass through unchanged.
 */
function translateMomentFormatToDateFns(momentPattern: string): string {
  return momentPattern.replace(
    // Longer before shorter (YYYY/YY, DD/D, z-series, ZZ/Z) so config tokens are not split.
    /YYYY|YY|dddd|ddd|DD|D|A|zzzz|zzz|zz|z|ZZ|Z/g,
    (token) => {
      switch (token) {
        case "YYYY":
          return "yyyy";
        case "YY":
          return "yy";
        case "dddd":
          return "EEEE";
        case "ddd":
          return "EEE";
        case "DD":
          return "dd";
        case "D":
          return "d";
        case "A":
          return "a";
        case "zzzz":
          return "zzzz";
        case "zzz":
        case "zz":
        case "z":
          return "zzz";
        case "ZZ":
          return "xxx";
        case "Z":
          return "xx";
        default:
          return token;
      }
    },
  );
}

function parseInstant(input: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  }
  const parsed = parseISO(input);
  if (!isValid(parsed)) {
    throw new RangeError(`Invalid date: ${input}`);
  }
  return parsed;
}

function getLocalIanaTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
}

/** UTC calendar days, mirroring `moment.utc(...).add(n, "day")` on the same reference. */
function addUtcDays(date: Date, amount: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

const USER_DISPLAY_MOMENT = "YYYY-MM-DD HH:mm z";

export function timezoneFromUser(input: string, tz: UserTz): string {
  const instant = parseInstant(input);
  const pattern = translateMomentFormatToDateFns(USER_DISPLAY_MOMENT);
  if (!tz) {
    return formatInTimeZone(instant, getLocalIanaTimeZone(), pattern);
  }
  return formatInTimeZone(instant, tz, pattern);
}

export function mutableChainWorkflow(input: string): { first: string; second: string } {
  let checkpoint = parseInstant(input);
  checkpoint = addUtcDays(checkpoint, 1);
  const first = formatInTimeZone(checkpoint, "UTC", "yyyy-MM-dd");
  checkpoint = addUtcDays(checkpoint, 2);
  const second = formatInTimeZone(checkpoint, "UTC", "yyyy-MM-dd");
  return { first, second };
}

export function dynamicFormatFromConfig(input: string, formatString: string): string {
  const instant = parseInstant(input);
  return formatInTimeZone(
    instant,
    "UTC",
    translateMomentFormatToDateFns(formatString),
  );
}
