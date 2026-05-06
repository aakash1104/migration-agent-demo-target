import moment from "moment-timezone";

export type UserTz = string | null | undefined;

export function timezoneFromUser(input: string, tz: UserTz): string {
  if (!tz) {
    return moment(input).local().format("YYYY-MM-DD HH:mm z");
  }
  return moment.tz(input, tz).format("YYYY-MM-DD HH:mm z");
}

export function mutableChainWorkflow(input: string): { first: string; second: string } {
  const checkpoint = moment.utc(input);
  const first = checkpoint.add(1, "day").format("YYYY-MM-DD");
  const second = checkpoint.add(2, "day").format("YYYY-MM-DD");
  return { first, second };
}

export function dynamicFormatFromConfig(input: string, formatString: string): string {
  return moment.utc(input).format(formatString);
}
