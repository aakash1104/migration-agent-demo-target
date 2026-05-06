import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function main(): Promise<void> {
  const planPath = path.resolve(process.cwd(), "artifacts", "migration-plan.json");
  const summaryPath = path.resolve(process.cwd(), "artifacts", "summary.md");

  const planRaw = await readFile(planPath, "utf8");
  const plan = JSON.parse(planRaw) as { generatedAt: string; items: Array<{ file: string; complexity: string }> };

  const counts = plan.items.reduce<Record<string, number>>((acc, item) => {
    acc[item.complexity] = (acc[item.complexity] ?? 0) + 1;
    return acc;
  }, {});

  const lines = [
    "# Demo Scoreboard",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Plan generated at: ${plan.generatedAt}`,
    "",
    `Total files discovered: ${plan.items.length}`,
    "",
    "## Complexity buckets",
    ...Object.entries(counts).map(([k, v]) => `- ${k}: ${v}`)
  ];

  await writeFile(summaryPath, lines.join("\n"), "utf8");
  console.log(`Wrote ${summaryPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
