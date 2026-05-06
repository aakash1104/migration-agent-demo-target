import moment from "moment-timezone";

export interface CounterExampleInput {
  sourceIso: string;
  userTimezone: string | null;
  formatString: string;
}

export function codemodCounterExample(input: CounterExampleInput): string {
  const base = input.userTimezone
    ? moment.tz(input.sourceIso, input.userTimezone)
    : moment(input.sourceIso).local();

  // Mutation + dynamic format + nullable timezone fallback make this unsafe for pure codemods.
  const shifted = base.add(90, "minutes");
  return shifted.format(input.formatString);
}
