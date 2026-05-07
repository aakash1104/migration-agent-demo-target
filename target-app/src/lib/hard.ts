import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export type UserTz = string | null | undefined;

const USER_DISPLAY_FORMAT = "yyyy-MM-dd HH:mm zzz";

/** System IANA zone, matching moment `.local()` when no tz is provided. */
function systemTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
}

/**
 * Parses `input` as an instant (ISO) and applies UTC calendar `days` deltas.
 * Mirrors mutable Moment `.add(days, 'day')` chaining by threading each result.
 */
function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Translate common Moment.js display tokens to date-fns; brackets and quotes follow Moment literals. */
function momentDisplayPatternToDateFns(momentPattern: string): string {
  const translations: [string, string][] = [
    ["YYYY", "yyyy"],
    ["dddd", "EEEE"],
    ["ddd", "EEE"],
    ["YY", "yy"],
    ["DD", "dd"],
    ["HH", "HH"],
    ["mm", "mm"],
    ["ss", "ss"],
    ["A", "a"],
    ["a", "aaa"],
    ["D", "d"],
    ["z", "zzz"],
  ];
  translations.sort((a, b) => b[0].length - a[0].length);

  const quoteLiteral = (s: string): string => `'${s.replace(/'/g, "''")}'`;

  let i = 0;
  const out: string[] = [];

  while (i < momentPattern.length) {
    const c = momentPattern[i];

    if (c === "[") {
      const end = momentPattern.indexOf("]", i + 1);
      if (end === -1) {
        out.push(quoteLiteral(c));
        i += 1;
        continue;
      }
      out.push(quoteLiteral(momentPattern.slice(i + 1, end)));
      i = end + 1;
      continue;
    }

    if (c === "'") {
      if (momentPattern[i + 1] === "'") {
        out.push("''");
        i += 2;
        continue;
      }
      let j = i + 1;
      let buf = "";
      while (j < momentPattern.length) {
        if (momentPattern[j] === "'") {
          if (momentPattern[j + 1] === "'") {
            buf += "'";
            j += 2;
            continue;
          }
          break;
        }
        buf += momentPattern[j]!;
        j += 1;
      }
      out.push(quoteLiteral(buf));
      i = j < momentPattern.length ? j + 1 : momentPattern.length;
      continue;
    }

    let matched = false;
    for (const [momentTok, dateFnsTok] of translations) {
      if (momentPattern.startsWith(momentTok, i)) {
        out.push(dateFnsTok);
        i += momentTok.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out.push(c!);
      i += 1;
    }
  }

  return out.join("");
}

export function timezoneFromUser(input: string, tz: UserTz): string {
  const date = parseISO(input);
  const zone = !tz || tz.trim() === "" ? systemTimeZone() : tz;
  return formatInTimeZone(date, zone, USER_DISPLAY_FORMAT);
}

export function mutableChainWorkflow(input: string): { first: string; second: string } {
  const start = parseISO(input);
  const afterOne = addUtcDays(start, 1);
  const afterThree = addUtcDays(afterOne, 2);
  return {
    first: formatInTimeZone(afterOne, "UTC", "yyyy-MM-dd"),
    second: formatInTimeZone(afterThree, "UTC", "yyyy-MM-dd"),
  };
}

export function dynamicFormatFromConfig(input: string, formatString: string): string {
  const translated = momentDisplayPatternToDateFns(formatString);
  return formatInTimeZone(parseISO(input), "UTC", translated);
}
