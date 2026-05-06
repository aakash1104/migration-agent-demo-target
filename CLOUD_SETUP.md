# Cloud/PR Stretch Setup

This phase is optional. Do it only after local mode is stable.

## 1. Verify GitHub CLI

```bash
gh auth status
```

If not authenticated:

```bash
gh auth login
```

## 2. Connect GitHub to Cursor

1. Open https://cursor.com/dashboard
2. Go to Integrations -> GitHub
3. Authorize Cursor for your user/org

## 3. Create a demo remote from target-app

```bash
cd /Users/aakash/playground/migration-agent-demo/target-app
git init
git add .
git commit -m "initial moment-heavy target app"
gh repo create migration-agent-demo-target --public --source=. --remote=origin --push
cd ..
```

## 4. Run cloud flag

```bash
export MIGRATION_DEMO_REPO_URL="https://github.com/<you>/migration-agent-demo-target"
export MIGRATION_DEMO_BASE_REF="main"   # optional, defaults to main
npm run migrate:cloud
```

Current behavior:
- The flag uses `@cursor/sdk` cloud agents with `autoCreatePR: true`.
- It opens one PR per discovered module/file (`trivial`, `medium`, `hard`, etc.).
- Branch naming is deterministic: `migrate/<path-with-dashes>`.
- If `CURSOR_API_KEY` is missing, it falls back to local dry-run mode.
- If `MIGRATION_DEMO_REPO_URL` is missing, cloud mode errors immediately.

## 5. Demo guidance

For live demo reliability, you can still run one representative cloud migration.
If you want all PRs at once, keep as-is and let the orchestrator process each module sequentially.
