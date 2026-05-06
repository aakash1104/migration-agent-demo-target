import path from "node:path";
import { runDiscovery, runDiscoveryWithoutSdk } from "./discover";
import { printHeader, printPlan, printRunSummary, printRunUpdate } from "./dashboard";
import { readPlan, writePlan } from "./plan-store";
import { runBatchMigration } from "./migrate-batch";
import type { BatchRunResult, MigrationItem } from "./types";

const args = new Set(process.argv.slice(2));
const discoverOnly = args.has("--discover-only");
const cloudMode = args.has("--cloud");

function getApiKey(): string | null {
  return process.env.CURSOR_API_KEY ?? null;
}

function sortByComplexity(items: MigrationItem[]): MigrationItem[] {
  const order: Record<MigrationItem["complexity"], number> = {
    trivial: 0,
    "format-only": 1,
    "mutation-aware": 2,
    timezone: 3,
    "dynamic-format": 4
  };
  return [...items].sort((a, b) => order[a.complexity] - order[b.complexity]);
}

async function main(): Promise<void> {
  const root = process.cwd();
  const targetCwd = path.resolve(root, "target-app");
  const apiKey = getApiKey();
  const cloudRepoUrl = process.env.MIGRATION_DEMO_REPO_URL;
  const cloudBaseRef = process.env.MIGRATION_DEMO_BASE_REF ?? "main";

  printHeader(cloudMode ? "Migration Orchestrator (cloud flag enabled)" : "Migration Orchestrator (local)");
  if (cloudMode && !cloudRepoUrl) {
    throw new Error("Cloud mode requires MIGRATION_DEMO_REPO_URL to be set");
  }

  const discovered = apiKey
    ? await runDiscovery(targetCwd, apiKey)
    : await runDiscoveryWithoutSdk(targetCwd);
  const sorted = sortByComplexity(discovered.items);
  await writePlan({ ...discovered, items: sorted });
  printPlan(sorted);

  if (discoverOnly) {
    printHeader("Discover-only complete");
    return;
  }

  const plan = await readPlan();
  const results: BatchRunResult[] = [];
  for (const item of plan.items) {
    printRunUpdate(item.file, "running");
    const result = await runBatchMigration(targetCwd, apiKey, item, {
      cloudMode,
      cloudRepoUrl,
      cloudBaseRef
    });
    results.push(result);
    const detail = result.prUrl ? `${result.summary} | PR: ${result.prUrl}` : result.summary;
    printRunUpdate(item.file, result.status, detail);
  }

  printRunSummary(results);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
