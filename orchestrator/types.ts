export type Complexity = "trivial" | "format-only" | "mutation-aware" | "timezone" | "dynamic-format";

export type Status = "queued" | "running" | "passed" | "failed" | "human-review";

export interface MigrationItem {
  file: string;
  complexity: Complexity;
  reason: string;
}

export interface MigrationPlan {
  generatedAt: string;
  source: string;
  items: MigrationItem[];
}

export interface BatchRunResult {
  item: MigrationItem;
  status: Status;
  summary: string;
  branchName?: string;
  prUrl?: string;
  logPath?: string;
}
