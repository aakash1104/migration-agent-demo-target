import { Agent } from "@cursor/sdk";

async function main(): Promise<void> {
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) {
    throw new Error("CURSOR_API_KEY is required");
  }

  await using agent = await Agent.create({
    apiKey,
    model: { id: "composer-2" },
    local: { cwd: process.cwd(), settingSources: ["project"] }
  });
  const run = await agent.send("Reply with exactly: smoke test passed");
  const result = await run.wait();
  console.log(result.result ?? "(empty response)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
