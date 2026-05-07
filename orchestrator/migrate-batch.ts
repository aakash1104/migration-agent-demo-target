import { Agent } from "@cursor/sdk";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { batchLabel } from "./batch-router";
import { formatDuration, logInfo, withHeartbeat } from "./run-telemetry";
import type { BatchRunResult, MigrationItem } from "./types";

const runsDir = path.resolve(process.cwd(), "artifacts", "runs");

interface BatchOptions {
  cloudMode: boolean;
  cloudRepoUrl?: string;
  cloudBaseRef: string;
}
type MigrationAgent = Awaited<ReturnType<typeof Agent.create>>;
type AgentRun = Awaited<ReturnType<MigrationAgent["send"]>>;

async function waitForRun(run: AgentRun, heartbeatLabel: string): Promise<Awaited<ReturnType<AgentRun["wait"]>>> {
  const { value: result, elapsedMs } = await withHeartbeat({
    label: heartbeatLabel,
    intervalMs: 12_000,
    work: () => run.wait()
  });
  const sdkMs = result.durationMs != null ? `${result.durationMs}ms` : "n/a";
  logInfo(`Agent run finished · wall-clock ${formatDuration(elapsedMs)} · SDK durationMs=${sdkMs}`);
  return result;
}

function buildPromptForSingle(item: MigrationItem, options: BatchOptions, branchName: string): string {
  const prTitle = `migrate(${item.complexity}): ${item.file} from moment to date-fns`;
  return [
    `Migrate \`${item.file}\` from moment to date-fns.`,
    "Follow the moment-to-datefns project rule exactly.",
    "Use subagent flow: migrator -> validator -> reviewer.",
    `Use branch name: \`${branchName}\`.`,
    `Use PR title: \`${prTitle}\`.`,
    `Base branch is \`${options.cloudBaseRef}\`.`,
    "Keep the change focused to this single module/file.",
    "If timezone or mutability semantics are ambiguous, return human-review and ask a concise question.",
    "When complete, output:",
    "1) status: pass|failed|human-review",
    "2) summary: one sentence",
    "3) branch: actual branch name",
    "4) pr: pull request URL if one was opened"
  ].join("\n");
}

function buildPromptForMulti(items: MigrationItem[], options: BatchOptions, branchName: string, tier: string): string {
  const fileList = items.map((i) => `- \`${i.file}\` (${i.complexity})`).join("\n");
  const prTitle =
    tier === "easy"
      ? `migrate(easy): moment to date-fns — ${items.length} modules`
      : tier === "hard"
        ? `migrate(hard): moment to date-fns — ${items.length} sensitive modules`
        : `migrate(batch): moment to date-fns — ${items.length} modules`;
  return [
    "Migrate ALL of the following files from moment to date-fns in ONE branch and ONE pull request.",
    "Process files in the order listed. Run tests for the whole affected surface (e.g. `npm test` in repo root).",
    "Follow the moment-to-datefns project rule exactly.",
    "Use subagent flow: migrator -> validator -> reviewer.",
    `Files:\n${fileList}`,
    `Use branch name: \`${branchName}\`.`,
    `Use PR title: \`${prTitle}\`.`,
    `Base branch is \`${options.cloudBaseRef}\`.`,
    "If any file needs human judgment (timezone, mutability, dynamic format), stop that file and still report overall batch status.",
    "When complete, output:",
    "1) status: pass|failed|human-review",
    "2) summary: one sentence covering all files",
    "3) branch: actual branch name",
    "4) pr: pull request URL if one was opened"
  ].join("\n");
}

function multiBranchName(items: MigrationItem[], tier: string): string {
  const slug = items
    .map((i) => path.basename(i.file, path.extname(i.file)))
    .sort()
    .join("-");
  return `migrate/batch-${tier}-${slug}`.slice(0, 120);
}

/**
 * Run migration for one or more files in a single agent send (when items.length > 1).
 * Returns one result row per file (same prUrl/summary when batched).
 */
export async function runMigrationWorkUnit(
  targetCwd: string,
  apiKey: string | null,
  items: MigrationItem[],
  options: BatchOptions,
  sharedAgent?: MigrationAgent
): Promise<BatchRunResult[]> {
  await mkdir(runsDir, { recursive: true });
  if (items.length === 0) return [];

  if (items.length === 1) {
    const one = await runBatchMigration(targetCwd, apiKey, items[0], options, sharedAgent);
    return [one];
  }

  const tier = batchLabel(items);
  const branchName = multiBranchName(items, tier);

  if (!apiKey) {
    const text =
      "status: human-review\nsummary: offline dry-run mode (set CURSOR_API_KEY for real agent execution)\n";
    const logPath = path.join(runsDir, `batch_${tier}_${Date.now()}.md`);
    await writeFile(logPath, text, "utf8");
    return items.map((item) => ({
      item,
      status: "human-review" as const,
      summary: "offline dry-run mode",
      branchName,
      logPath
    }));
  }

  const shouldCreateAgent = !sharedAgent;
  const agent =
    sharedAgent ??
    (options.cloudMode
      ? await Agent.create({
          apiKey,
          model: { id: "composer-2" },
          cloud: {
            repos: [{ url: options.cloudRepoUrl!, startingRef: options.cloudBaseRef }],
            autoCreatePR: true,
            skipReviewerRequest: true
          }
        })
      : await Agent.create({
          apiKey,
          model: { id: "composer-2" },
          local: { cwd: targetCwd, settingSources: ["project"] }
        }));

  try {
    const prompt = buildPromptForMulti(items, options, branchName, tier);
    logInfo(`Sending batch prompt (${items.length} files, tier=${tier})…`);
    const run = await agent.send(prompt);
    const result = await waitForRun(
      run,
      `${options.cloudMode ? "cloud" : "local"} batch · ${tier} · ${items.map((i) => path.basename(i.file)).join("+")}`
    );
    const text = result.result ?? "";
    const lower = text.toLowerCase();

    const status = lower.includes("human-review")
      ? "human-review"
      : lower.includes("failed")
        ? "failed"
        : "passed";

    const summary = text.split("\n").find((line) => line.trim()) ?? "No summary returned";
    const prUrl = result.git?.branches?.find((entry) => entry.prUrl)?.prUrl;
    const logPath = path.join(runsDir, `batch_${tier}_${Date.now()}.md`);
    await writeFile(logPath, text, "utf8");

    return items.map((item) => ({
      item,
      status,
      summary,
      branchName,
      prUrl,
      logPath
    }));
  } finally {
    if (shouldCreateAgent) {
      await agent[Symbol.asyncDispose]();
    }
  }
}

export async function runBatchMigration(
  targetCwd: string,
  apiKey: string | null,
  item: MigrationItem,
  options: BatchOptions,
  sharedAgent?: MigrationAgent
): Promise<BatchRunResult> {
  await mkdir(runsDir, { recursive: true });
  const branchName = `migrate/${item.file.replace(/[/.]/g, "-")}`;

  if (!apiKey) {
    const text =
      "status: human-review\nsummary: offline dry-run mode (set CURSOR_API_KEY for real agent execution)\n";
    const logPath = path.join(runsDir, `${item.file.replace(/[/.]/g, "_")}.md`);
    await writeFile(logPath, text, "utf8");
    return {
      item,
      status: "human-review",
      summary: "offline dry-run mode",
      branchName,
      logPath
    };
  }

  const shouldCreateAgent = !sharedAgent;
  const agent =
    sharedAgent ??
    (options.cloudMode
      ? await Agent.create({
          apiKey,
          model: { id: "composer-2" },
          cloud: {
            repos: [{ url: options.cloudRepoUrl!, startingRef: options.cloudBaseRef }],
            autoCreatePR: true,
            skipReviewerRequest: true
          }
        })
      : await Agent.create({
          apiKey,
          model: { id: "composer-2" },
          local: { cwd: targetCwd, settingSources: ["project"] }
        }));

  try {
    logInfo(`Sending migration prompt for ${item.file}…`);
    const run = await agent.send(buildPromptForSingle(item, options, branchName));
    const result = await waitForRun(
      run,
      `${options.cloudMode ? "cloud" : "local"} · ${path.basename(item.file)}`
    );
    const text = result.result ?? "";
    const lower = text.toLowerCase();

    const status = lower.includes("human-review")
      ? "human-review"
      : lower.includes("failed")
        ? "failed"
        : "passed";

    const summary = text.split("\n").find((line) => line.trim()) ?? "No summary returned";
    const prUrl = result.git?.branches?.find((entry) => entry.prUrl)?.prUrl;
    const logPath = path.join(runsDir, `${item.file.replace(/[/.]/g, "_")}.md`);
    await writeFile(logPath, text, "utf8");

    return {
      item,
      status,
      summary,
      branchName,
      prUrl,
      logPath
    };
  } finally {
    if (shouldCreateAgent) {
      await agent[Symbol.asyncDispose]();
    }
  }
}
