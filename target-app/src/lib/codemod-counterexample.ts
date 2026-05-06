import { addMinutes, format } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";

export interface CounterExampleInput {
  sourceIso: string;
  userTimezone: string | null;
  formatString: string;
}

function getLocalIanaTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Maps dynamic Moment-format patterns to date-fns `format` tokens per migration policy.
 * Single-quoted runs are copied verbatim (Moment/date-fns literal escape).
 *
 * Assumptions: Only the listed Moment tokens are translated; other tokens are passed through
 * unchanged (many are identical in date-fns). Moment day-of-year (`DDD`/`DDDD`) and weekday
 * numeric tokens (`d`/`dd` lowercase) are not handled—`DD` before `D` can mangle `DDD` patterns.
 */
function translateMomentFormatToDateFns(momentPattern: string): string {
  let out = "";
  let i = 0;
  while (i < momentPattern.length) {
    const ch = momentPattern[i];
    if (ch === "'") {
      out += "'";
      i += 1;
      while (i < momentPattern.length) {
        if (momentPattern[i] === "'" && momentPattern[i + 1] === "'") {
          out += "''";
          i += 2;
          continue;
        }
        if (momentPattern[i] === "'") {
          out += "'";
          i += 1;
          break;
        }
        out += momentPattern[i];
        i += 1;
      }
      continue;
    }

    let run = "";
    while (i < momentPattern.length && momentPattern[i] !== "'") {
      run += momentPattern[i];
      i += 1;
    }
    out += replaceMomentTokensInRun(run);
  }
  return out;
}

function replaceMomentTokensInRun(run: string): string {
  const replacements: Array<[string, string]> = [
    ["YYYY", "yyyy"],
    ["YY", "yy"],
    ["dddd", "EEEE"],
    ["ddd", "EEE"],
    ["DD", "dd"],
    ["D", "d"],
    ["A", "a"],
  ];
  let s = run;
  for (const [from, to] of replacements) {
    s = s.split(from).join(to);
  }
  return s;
}

function parseSourceInstant(sourceIso: string, userTimezone: string | null): Date {
  if (userTimezone) {
    return toDate(sourceIso, { timeZone: userTimezone });
  }
  return toDate(sourceIso, { timeZone: getLocalIanaTimeZone() });
}

export function codemodCounterExample(input: CounterExampleInput): string {
  const base = parseSourceInstant(input.sourceIso, input.userTimezone);
  const shifted = addMinutes(base, 90);
  const pattern = translateMomentFormatToDateFns(input.formatString);

  if (input.userTimezone) {
    return formatInTimeZone(shifted, input.userTimezone, pattern);
  }
  return format(shifted, pattern);
}
