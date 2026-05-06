# Setup

One-time prerequisites for running this prototype. Plan on ~10 minutes for the local-only path, +5 minutes for the optional GitHub leg.

## 1. Local toolchain

```bash
node -v   # need >= 20
npm -v
git --version
```

If Node is missing or older than 20: `brew install node`.

## 2. Cursor API key (required)

The `@cursor/sdk` is in public beta. You need an API key tied to a Cursor account.

1. Open [https://cursor.com/dashboard/integrations](https://cursor.com/dashboard/integrations) in a browser.
2. Click **Create API key**. A user key is fine for this demo.
3. Copy the key (looks like `key_...`).
4. Export it in your shell:

```bash
echo 'export CURSOR_API_KEY="key_..."' >> ~/.zshrc
source ~/.zshrc
```

5. Smoke-test:

```bash
node -e 'console.log(!!process.env.CURSOR_API_KEY)'
# -> true
```

> SDK runs draw from your team's Cursor request pool and show up in the usage dashboard tagged "SDK".

## 3. Install project dependencies

```bash
cd /Users/aakash/playground/migration-agent-demo
npm install
cd target-app && npm install && cd ..
```

## 4. Verify the SDK is wired up

```bash
npm run smoke
```

You should see a single Cursor agent run that prints "smoke test passed" and exits. If this fails, check `CURSOR_API_KEY`.

## 5. (Optional) GitHub CLI for the cloud/PR leg

Skip unless you want the closing "auto-PR" wow moment in the demo. The local-only path covers 95% of the story.

```bash
brew install gh
gh auth login          # GitHub.com -> HTTPS -> login with browser
gh auth status         # verify
```

Then connect GitHub to Cursor:

1. Open [https://cursor.com/dashboard](https://cursor.com/dashboard) -> Integrations -> GitHub.
2. Click **Connect GitHub** and authorize the Cursor app for either your user or an org you own.

Create a throwaway demo repo (run from this directory after the target-app has at least one commit):

```bash
cd target-app
git init && git add . && git commit -m "initial moment-using app"
gh repo create migration-agent-demo-target --public --source=. --remote=origin --push
cd ..
```

Then enable cloud mode:

```bash
npm run migrate:cloud
```

This runs the orchestrator with `cloud: { autoCreatePR: true }` instead of `local: { cwd }`. One representative file goes through the cloud path; the rest stay local for speed.

## 6. (Optional) Linear MCP

Not built in v1. Mentioned in Q&A as a future-roadmap item: "open a Linear ticket per human-review file."

## Troubleshooting

**`@cursor/sdk` install fails.** The package is in public beta — confirm version with `npm view @cursor/sdk versions` and update `package.json` accordingly.

**`AuthenticationError` on first run.** Re-check that `CURSOR_API_KEY` is exported in the same shell you're running `npm` from. Restart your terminal after editing `~/.zshrc`.

**Hook didn't fire.** Hooks load when a Cursor agent runs; they don't trigger from plain `git commit`. The block-moment-import hook fires on `afterFileEdit` during agent runs. To test the hook, run any Cursor chat that edits a file in `target-app/` and try to add `import moment from 'moment'`.

**Cloud agent says "GitHub not connected".** Confirm step 5: the connect step on cursor.com/dashboard is required even after `gh auth login`.
