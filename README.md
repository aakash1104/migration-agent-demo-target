# Migration Agent Demo — Moment.js to date-fns

A Cursor-based automation prototype for one of the most common stalled enterprise tech-debt projects: the half-finished library migration.

## Why this matters

Every enterprise codebase has at least one of these:

- Moment.js -> date-fns (Moment is in maintenance mode)
- Enzyme -> React Testing Library
- An internal SDK v1 -> v2
- Deprecated logger, deprecated HTTP client, deprecated date helper

These migrations stall because they're boring, risky, fan out across hundreds of files, and no PM funds a "tech debt sprint." Meanwhile they bloat bundles, attract security advisories, and confuse new hires.

## What this prototype does

Picks one concrete migration (Moment -> date-fns) and ships it end-to-end:

1. **Discovery** — a Cursor agent reads the target codebase and classifies every Moment usage into trivial / format-only / mutation-aware / timezone / dynamic-format buckets.
2. **Migration** — parallel Cursor agents (one per file) apply the migration, run tests, and create a per-file branch. The migrator subagent does the transformation; the validator subagent runs tests; the reviewer subagent checks the diff against the policy.
3. **Enforcement** — a project hook blocks any new `import 'moment'` from landing in the codebase post-migration. Debt cannot come back.

## How it composes the Cursor stack

| Surface | Role |
|---|---|
| `@cursor/sdk` | Programmatic agent orchestration (the orchestrator IS a TypeScript program calling `Agent.create()`) |
| `.cursor/rules/moment-to-datefns.mdc` | The migration policy — mapping table, gotchas, hard rules. Auto-attaches to matching files. |
| `.cursor/agents/{migrator,validator,reviewer}.md` | Subagents the parent dispatches via the `Agent` tool |
| `.cursor/hooks.json` | The ratchet — blocks new Moment imports forever |

This is the thesis: each piece is small. The composition is what makes it real.

## Getting started

See [SETUP.md](./SETUP.md) for prerequisites and one-time setup.
See [CLOUD_SETUP.md](./CLOUD_SETUP.md) for optional GitHub/cloud PR setup.

```bash
# After setup
npm install
npm run smoke      # verify the SDK is wired up correctly
npm run migrate    # the main event
```

## Repo layout

```
migration-agent-demo/
  SETUP.md                       Prerequisites
  README.md                      You are here
  package.json
  tsconfig.json
  .cursor/
    rules/moment-to-datefns.mdc  Migration policy (auto-attaches)
    agents/                       Subagent system prompts
    hooks.json                    Hook config
    hooks/                        Hook scripts
  orchestrator/                  The SDK-driven orchestrator
  target-app/                    The "before" — the repo we migrate
  artifacts/                     Generated at run time (plan, run logs, summary)
```

## Demo

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for the 30-minute live-demo arc.
