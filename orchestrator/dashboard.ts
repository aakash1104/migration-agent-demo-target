import chalk from "chalk";
import type { BatchRunResult, MigrationItem, Status } from "./types";

const statusColor: Record<Status, (value: string) => string> = {
  queued: chalk.gray,
  running: chalk.blue,
  passed: chalk.green,
  failed: chalk.red,
  "human-review": chalk.yellow
};

export function printHeader(title: string): void {
  console.log(chalk.bold.cyan(`\n== ${title} ==`));
}

export function printPlan(items: MigrationItem[]): void {
  printHeader("Discovery Summary");
  for (const item of items) {
    const complexity = chalk.magenta(item.complexity.padEnd(14));
    console.log(`- ${complexity} ${item.file} ${chalk.gray(`(${item.reason})`)}`);
  }
}

export function printRunUpdate(file: string, status: Status, details?: string): void {
  const color = statusColor[status];
  const prefix = color(`[${status.toUpperCase()}]`);
  console.log(`${prefix} ${file}${details ? ` :: ${details}` : ""}`);
}

export function printRunSummary(results: BatchRunResult[]): void {
  printHeader("Migration Run Summary");
  const totals = results.reduce<Record<Status, number>>(
    (acc, result) => {
      acc[result.status] += 1;
      return acc;
    },
    { queued: 0, running: 0, passed: 0, failed: 0, "human-review": 0 }
  );

  console.log(
    [
      `${chalk.green("passed")}: ${totals.passed}`,
      `${chalk.red("failed")}: ${totals.failed}`,
      `${chalk.yellow("human-review")}: ${totals["human-review"]}`
    ].join("  |  ")
  );

  for (const result of results) {
    printRunUpdate(result.item.file, result.status, result.summary);
  }
}
