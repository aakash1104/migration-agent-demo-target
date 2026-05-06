# 30-Minute Live Demo Script

## Goal

Show a working Cursor-native migration harness that moves a Moment-heavy codebase toward date-fns with policy, orchestration, and enforcement.

## Stage setup (before joining call)

1. Open these files in tabs:
   - `README.md`
   - `.cursor/rules/moment-to-datefns.mdc`
   - `orchestrator/orchestrate.ts`
   - `target-app/src/lib/codemod-counterexample.ts`
2. In terminal, run:
   - `cd /Users/aakash/playground/migration-agent-demo`
   - `npm run analyze --prefix target-app`
3. Confirm `CURSOR_API_KEY` is set if doing live SDK run:
   - `node -e "console.log(Boolean(process.env.CURSOR_API_KEY))"`

## 0:00-3:00 — Problem framing

- “This is a small stand-in for a typical enterprise migration that never gets finished.”
- Show `target-app/src/lib/*` and call out:
  - trivial formatting usage
  - medium chained/duration usage
  - hard timezone + mutability + dynamic format usage
- Mention this exact pattern recurs for Enzyme->RTL, internal SDK v1->v2, etc.

## 3:00-7:00 — Policy layer

- Open `.cursor/rules/moment-to-datefns.mdc`.
- Highlight:
  - token conversion (`YYYY -> yyyy`, `DD -> dd`)
  - mutability warning
  - timezone fallback requirement
  - testing requirement and human-review fallback

Talk track: “This policy is the institutional memory that every agent run inherits.”

## 7:00-12:00 — Orchestrator and SDK

- Open `orchestrator/orchestrate.ts`.
- Explain:
  - discovery pass (`runDiscovery`)
  - batch migration (`runBatchMigration`)
  - status dashboard and artifacts
- Mention this is implemented with `@cursor/sdk` and works in local mode first.

## 12:00-20:00 — Live run

Run:

```bash
npm run migrate
```

If API key is present:
- show real agent run behavior
- show run logs in `artifacts/runs/`

If API key is absent:
- call out dry-run mode and that it still generates:
  - `artifacts/migration-plan.md`
  - `artifacts/migration-plan.json`
  - `artifacts/runs/*.md`

Then:

```bash
npm run scoreboard
```

Show `artifacts/summary.md`.

## 20:00-24:00 — Enforcement layer

- Open `.cursor/hooks.json` and `.cursor/hooks/block-moment-import.sh`.
- Explain the ratchet: new moment imports are blocked unless explicitly waived with `migration-allow-moment`.

## 24:00-28:00 — Why this beats a codemod

- Open `target-app/src/lib/codemod-counterexample.ts`.
- Say:
  - “Pure codemods struggle when mutability + nullable timezone + dynamic format strings combine.”
  - “Agent asks for human input where semantics are unclear.”

## 28:00-30:00 — Impact and close

- Velocity: repeatable migration harness instead of one-off sprint.
- Cognitive load: policy captures tribal knowledge once.
- Quality/safety: tests + reviewer subagent + hook ratchet.
- Closing line: “Each new migration is one rule file, not a new platform project.”

## Q&A anchors

- “Why not jscodeshift?” -> show `codemod-counterexample.ts`.
- “How safe is this?” -> tests required + human-review fallback.
- “How does this scale?” -> same harness, different rule file, optionally cloud/PR mode.
