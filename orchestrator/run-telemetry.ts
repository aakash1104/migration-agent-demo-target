import chalk from "chalk";

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = ((ms % 60_000) / 1000).toFixed(0);
  return `${m}m ${s}s`;
}

function wallClock(): string {
  return new Date().toISOString().slice(11, 19);
}

export function logInfo(message: string): void {
  console.log(chalk.dim(`[${wallClock()}]`), message);
}

export function logPhaseStart(phase: string, detail?: string): void {
  const extra = detail ? chalk.gray(` ${detail}`) : "";
  console.log(chalk.dim(`[${wallClock()}]`), chalk.cyan(`▶ ${phase}`) + extra);
}

export function logPhaseEnd(phase: string, elapsedMs: number, extra?: Record<string, string | number>): void {
  const bits = extra
    ? " " +
      chalk.gray(
        Object.entries(extra)
          .map(([k, v]) => `${k}=${v}`)
          .join(" ")
      )
    : "";
  console.log(
    chalk.dim(`[${wallClock()}]`),
    chalk.green(`✓ ${phase}`),
    chalk.yellow(`(${formatDuration(elapsedMs)})`) + bits
  );
}

/**
 * Prints a line every `intervalMs` so long cloud/local waits do not look hung.
 */
export function startRunHeartbeat(opts: { label: string; intervalMs?: number }): () => void {
  const t0 = Date.now();
  const intervalMs = opts.intervalMs ?? 12_000;
  const id = setInterval(() => {
    const elapsed = Date.now() - t0;
    logInfo(chalk.blue(`… still running: ${opts.label} — ${formatDuration(elapsed)} elapsed`));
  }, intervalMs);
  return () => clearInterval(id);
}

/** Wraps a blocking agent wait with heartbeat lines on stderr-style console. */
export async function withHeartbeat<T>(opts: {
  label: string;
  intervalMs?: number;
  work: () => Promise<T>;
}): Promise<{ value: T; elapsedMs: number }> {
  const stop = startRunHeartbeat({ label: opts.label, intervalMs: opts.intervalMs });
  const t0 = Date.now();
  try {
    const value = await opts.work();
    return { value, elapsedMs: Date.now() - t0 };
  } finally {
    stop();
  }
}
