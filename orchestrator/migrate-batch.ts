import { Agent } from "@cursor/sdk";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BatchRunResult, MigrationItem } from "./types";

const runsDir = path.resolve(process.cwd(), "artifacts", "runs");

interface BatchOptions {
  cloudMode: boolean;
  cloudRepoUrl?: string;
  cloudBaseRef: string;
}

function buildPrompt(item: MigrationItem, options: BatchOptions, branchName: string): string {
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

export async function runBatchMigration(
  targetCwd: string,
  apiKey: string | null,
  item: MigrationItem,
  options: BatchOptions
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

  const agent = options.cloudMode
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
      });
  await using _agent = agent;

  const run = await agent.send(buildPrompt(item, options, branchName));
  const result = await run.wait();
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
}
