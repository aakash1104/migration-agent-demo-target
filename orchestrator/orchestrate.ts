import { Agent } from "@cursor/sdk";
import path from "node:path";
import { runDiscovery, runDiscoveryWithoutSdk } from "./discover";
import { printHeader, printPlan, printRunSummary, printRunUpdate } from "./dashboard";
import { readPlan, writePlan } from "./plan-store";
import { groupIntoBatches } from "./batch-router";
import { runMigrationWorkUnit } from "./migrate-batch";
import { formatDuration, logInfo, logPhaseEnd, logPhaseStart } from "./run-telemetry";
import type { BatchRunResult, MigrationItem } from "./types";

const args = new Set(process.argv.slice(2));
const discoverOnly = args.has("--discover-only");
const cloudMode = args.has("--cloud");
const batchMode = args.has("--batch");

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
  const orchestratorT0 = Date.now();
  const root = process.cwd();
  const targetCwd = path.resolve(root, "target-app");
  const apiKey = getApiKey();
  const cloudRepoUrl = process.env.MIGRATION_DEMO_REPO_URL;
  const cloudBaseRef = process.env.MIGRATION_DEMO_BASE_REF ?? "main";

  const modeLabel = [cloudMode ? "cloud" : "local", batchMode ? "batch-routing" : "per-file"].join(" · ");
  printHeader(`Migration Orchestrator (${modeLabel})`);
  logInfo(
    `target-app=${targetCwd} · apiKey=${apiKey ? "set" : "missing (dry-run)"} · repo=${cloudRepoUrl ?? "n/a"} · base=${cloudBaseRef}`
  );
  if (batchMode) {
    printHeader(
      "Policy routing: easy batch = trivial | format-only | mutation-aware; hard batch = timezone | dynamic-format"
    );
  }
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
  let sharedCloudAgent: Awaited<ReturnType<typeof Agent.create>> | undefined;
  if (cloudMode && apiKey) {
    logPhaseStart(
      "Shared cloud agent",
      "VM provision + clone (first migration after this may still take a while; heartbeats print during waits)"
    );
    const createT0 = Date.now();
    sharedCloudAgent = await Agent.create({
      apiKey,
      model: { id: "composer-2" },
      cloud: {
        repos: [{ url: cloudRepoUrl!, startingRef: cloudBaseRef }],
        autoCreatePR: true,
        skipReviewerRequest: true
      }
    });
    logPhaseEnd("Shared cloud agent ready", Date.now() - createT0, { agentId: sharedCloudAgent.agentId });
  }

  const workUnits: MigrationItem[][] = batchMode
    ? groupIntoBatches(plan.items)
    : plan.items.map((item) => [item]);

  logInfo(
    `Work queue: ${workUnits.length} agent send(s) for ${plan.items.length} file(s) · batching=${batchMode ? "on" : "off"}`
  );

  try {
    let unitIndex = 0;
    for (const batch of workUnits) {
      unitIndex += 1;
      const batchLabel = batch.map((i) => i.file).join(", ");
      printRunUpdate(batchLabel, "running", batch.length > 1 ? `batch (${batch.length} files)` : undefined);
      const unitT0 = Date.now();
      const batchResults = await runMigrationWorkUnit(
        targetCwd,
        apiKey,
        batch,
        {
          cloudMode,
          cloudRepoUrl,
          cloudBaseRef
        },
        sharedCloudAgent
      );
      logPhaseEnd(
        `Migration unit ${unitIndex}/${workUnits.length}`,
        Date.now() - unitT0,
        batchResults[0]?.prUrl ? { pr: "opened" } : {}
      );
      for (const result of batchResults) {
        results.push(result);
        const detail = result.prUrl ? `${result.summary} | PR: ${result.prUrl}` : result.summary;
        printRunUpdate(result.item.file, result.status, detail);
      }
    }
  } finally {
    if (sharedCloudAgent) {
      await sharedCloudAgent[Symbol.asyncDispose]();
    }
  }

  printRunSummary(results);
  logPhaseEnd("Total orchestrator run", Date.now() - orchestratorT0, {
    workUnits: workUnits.length,
    files: plan.items.length,
    passed: results.filter((r) => r.status === "passed").length
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
