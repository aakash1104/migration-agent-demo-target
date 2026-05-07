import type { Complexity, MigrationItem } from "./types";

/** Low-risk: mechanical transforms, durations, comparisons. */
const EASY: Set<Complexity> = new Set(["trivial", "format-only", "mutation-aware"]);

/** High-risk: timezone semantics, dynamic formats, mutability edges. */
const HARD: Set<Complexity> = new Set(["timezone", "dynamic-format"]);

/**
 * Deterministic batching before agent runs — policy routing, not ML.
 * Fewer cloud round-trips; isolate risky files so one failure does not block easy wins.
 */
export function groupIntoBatches(items: MigrationItem[]): MigrationItem[][] {
  const easy = items.filter((i) => EASY.has(i.complexity));
  const hard = items.filter((i) => HARD.has(i.complexity));
  const unknown = items.filter((i) => !EASY.has(i.complexity) && !HARD.has(i.complexity));

  const batches: MigrationItem[][] = [];
  if (easy.length > 0) batches.push(easy);
  if (hard.length > 0) batches.push(hard);
  if (unknown.length > 0) batches.push(unknown);

  return batches.length > 0 ? batches : [];
}

export function batchLabel(items: MigrationItem[]): "easy" | "hard" | "mixed" {
  const tiers = new Set(items.map((i) => (EASY.has(i.complexity) ? "easy" : HARD.has(i.complexity) ? "hard" : "mixed")));
  if (tiers.size === 1) {
    const only = tiers.values().next().value;
    if (only === "easy") return "easy";
    if (only === "hard") return "hard";
  }
  return "mixed";
}
