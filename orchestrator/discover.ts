import { Agent } from "@cursor/sdk";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { logPhaseEnd, logPhaseStart, withHeartbeat } from "./run-telemetry";
import type { MigrationItem, MigrationPlan } from "./types";

function inferComplexity(file: string): MigrationItem["complexity"] {
  if (file.includes("hard")) return "timezone";
  if (file.includes("medium")) return "mutation-aware";
  return "trivial";
}

export async function runDiscovery(targetCwd: string, apiKey: string): Promise<MigrationPlan> {
  logPhaseStart("Discovery", "local agent · list files under src/ using moment");

  await using agent = await Agent.create({
    apiKey,
    model: { id: "composer-2" },
    local: { cwd: targetCwd, settingSources: ["project"] }
  });

  const prompt = [
    "List all files under src/ importing moment or moment-timezone.",
    "Return one file path per line and include no extra commentary."
  ].join(" ");

  const run = await agent.send(prompt);
  const { value: result, elapsedMs } = await withHeartbeat({
    label: "discovery · waiting for agent",
    work: () => run.wait()
  });
  const lines = (result.result ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("src/"));

  const deduped = [...new Set(lines)];
  const items: MigrationItem[] = deduped.map((file) => ({
    file,
    complexity: inferComplexity(file),
    reason:
      file.includes("hard")
        ? "timezone/mutability-sensitive paths"
        : file.includes("medium")
          ? "chained/duration workflow likely to need care"
          : "simple formatting and date arithmetic usage"
  }));

  logPhaseEnd("Discovery", elapsedMs, {
    candidates: deduped.length,
    ...(result.durationMs != null ? { sdkRunMs: result.durationMs } : {})
  });

  return {
    generatedAt: new Date().toISOString(),
    source: targetCwd,
    items
  };
}

export async function runDiscoveryWithoutSdk(targetCwd: string): Promise<MigrationPlan> {
  logPhaseStart("Discovery", "offline scan (no CURSOR_API_KEY)");
  const t0 = Date.now();
  const candidates = ["src/lib/trivial.ts", "src/lib/medium.ts", "src/lib/hard.ts", "src/server.ts"];
  const items: MigrationItem[] = [];

  for (const rel of candidates) {
    const abs = path.join(targetCwd, rel);
    const text = await readFile(abs, "utf8");
    if (!/moment|moment-timezone/.test(text)) continue;
    items.push({
      file: rel,
      complexity: inferComplexity(rel),
      reason: "offline discovery fallback (no CURSOR_API_KEY)"
    });
  }

  logPhaseEnd("Discovery", Date.now() - t0, { candidates: items.length });

  return {
    generatedAt: new Date().toISOString(),
    source: targetCwd,
    items
  };
}
