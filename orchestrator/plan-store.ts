import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MigrationPlan } from "./types";

const artifactsDir = path.resolve(process.cwd(), "artifacts");
const planPath = path.join(artifactsDir, "migration-plan.md");
const jsonPath = path.join(artifactsDir, "migration-plan.json");

export async function writePlan(plan: MigrationPlan): Promise<void> {
  await mkdir(artifactsDir, { recursive: true });
  await writeFile(jsonPath, JSON.stringify(plan, null, 2), "utf8");

  const rows = plan.items
    .map((item) => `| \`${item.file}\` | \`${item.complexity}\` | ${item.reason} |`)
    .join("\n");
  const markdown = [
    "# Migration Plan",
    "",
    `Generated: ${plan.generatedAt}`,
    "",
    "| File | Complexity | Reason |",
    "|---|---|---|",
    rows || "| (none) | - | - |"
  ].join("\n");
  await writeFile(planPath, markdown, "utf8");
}

export async function readPlan(): Promise<MigrationPlan> {
  const raw = await readFile(jsonPath, "utf8");
  return JSON.parse(raw) as MigrationPlan;
}

export function getPlanPaths(): { markdown: string; json: string } {
  return { markdown: planPath, json: jsonPath };
}
