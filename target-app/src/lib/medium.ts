import moment from "moment";

export function durationFromMinutes(minutes: number): string {
  const duration = moment.duration(minutes, "minutes");
  return `${duration.hours()}h ${duration.minutes()}m`;
}

export function durationFromSeconds(seconds: number): string {
  const duration = moment.duration(seconds, "seconds");
  return `${duration.minutes()}m ${duration.seconds()}s`;
}

export function compareWindows(left: string, right: string): "before" | "after" | "same" {
  const leftMoment = moment.utc(left);
  const rightMoment = moment.utc(right);
  if (leftMoment.isBefore(rightMoment)) return "before";
  if (leftMoment.isAfter(rightMoment)) return "after";
  return "same";
}

export function rollingRangeLabel(input: string): string {
  const start = moment.utc(input).startOf("week");
  const end = moment.utc(input).endOf("week");
  return `${start.format("MM/DD")} - ${end.format("MM/DD")}`;
}

export function scheduleOffset(input: string, hours: number, minutes: number): string {
  return moment.utc(input).add(hours, "hours").add(minutes, "minutes").format("YYYY-MM-DD HH:mm");
}

export function quarterLabel(input: string): string {
  const month = moment.utc(input).month();
  const quarter = Math.floor(month / 3) + 1;
  return `Q${quarter} ${moment.utc(input).format("YYYY")}`;
}

export function reportPeriodLabel(input: string): string {
  const base = moment.utc(input).startOf("month");
  const previous = base.clone().subtract(1, "month");
  return `${previous.format("MMM YYYY")} -> ${base.format("MMM YYYY")}`;
}
