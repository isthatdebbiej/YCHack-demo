# Teammate setup: Intent Anchor demo

This guide prepares one Windows laptop to run the complete GitHub Issue to
Claude-Mem to Greptile demo for `isthatdebbiej/YCHack-demo`.

## What you need

- Write access to `isthatdebbiej/YCHack-demo`.
- Git, GitHub CLI, Node.js 22, npm, and Bun.
- An OpenAI API key for Intent Anchor.
- A Claude-Mem provider configured during its installer. Gemini or OpenRouter
  is supported; an Anthropic API key is not required.
- Greptile access to `YCHack-demo` and a Greptile API key.
- A Windows laptop that stays awake while GitHub Actions jobs run.

Never paste API keys into an issue, PR, committed file, command argument, or
chat. The secret commands below prompt for values without adding them to shell
history.

## 1. Clone and verify the demo

```powershell
gh auth login -h github.com
git clone https://github.com/isthatdebbiej/YCHack-demo.git
Set-Location -LiteralPath YCHack-demo
npm ci
npm test
npm run typecheck
```

Expected: eight tests pass and TypeScript exits successfully.

## 2. Install and verify Claude-Mem

Use Claude-Mem's installer and select Gemini or OpenRouter when prompted:

```powershell
npx claude-mem install
claude-mem status
```

The worker must be reachable from the runner at port 37777. Verify it directly:

```powershell
Invoke-RestMethod http://127.0.0.1:37777/api/readiness
```

Expected: a response whose status is `ready`. The viewer should also open at
`http://localhost:37777`.

If the worker is not ready, run `claude-mem logs`. If the installed version uses
the source commands, run `bun run worker:status` or `bun run worker:start` from
the Claude-Mem checkout.

## 3. Add GitHub Actions secrets

Run each command and paste the requested value at the hidden prompt:

```powershell
gh secret set OPENAI_API_KEY --repo isthatdebbiej/YCHack-demo
gh secret set GREPTILE_API_KEY --repo isthatdebbiej/YCHack-demo
gh secret set CLAUDE_MEM_URL --repo isthatdebbiej/YCHack-demo
```

For `CLAUDE_MEM_URL`, enter `http://127.0.0.1:37777` because Actions will run on
this same laptop. Confirm names only:

```powershell
gh secret list --repo isthatdebbiej/YCHack-demo
```

Expected names: `OPENAI_API_KEY`, `GREPTILE_API_KEY`, and `CLAUDE_MEM_URL`.

## 4. Register the self-hosted runner

1. Open `YCHack-demo` on GitHub.
2. Go to **Settings → Actions → Runners → New self-hosted runner**.
3. Select Windows x64.
4. Run GitHub's generated download and configuration commands exactly. The
   generated registration token expires, so do not save or share it.
5. When configuration asks for additional labels, enter `intent-anchor`.
6. Start it with `./run.cmd` and leave that terminal open. Running it as a
   Windows service is optional for the hackathon.

Confirm GitHub displays the runner as **Idle** with labels `self-hosted`,
`Windows`, `X64`, and `intent-anchor`.

## 5. Verify Greptile

1. Confirm `isthatdebbiej/YCHack-demo` is connected and fully indexed.
2. Confirm Greptile can access pull requests and post review comments.
3. For the causal demo, capture the baseline review before approved custom
   context is created. Do not explain the hidden violation in the PR body.

## 6. Smoke-test issue capture

Create a temporary issue with an outcome, constraint, success criteria, and
non-goal. GitHub Actions should start **Capture issue intent** on the local
runner.

Expected result:

- the job completes successfully;
- the issue receives an `Approved intent` block;
- the Claude-Mem viewer contains `INTENT_ANCHOR_APPROVED` for that issue;
- reopening or rerunning does not create a duplicate record.

If the job stays queued, the runner is offline or missing the `intent-anchor`
label. If it fails at Claude-Mem, verify the readiness URL from the runner
account. If it fails at OpenAI, re-enter `OPENAI_API_KEY`.

## 7. Smoke-test the review path

Use a branch containing the issue number, for example
`issue-12-queue-overloaded-orders`, then open or update its PR. The review
workflow infers issue 12 from the branch, recalls its approved Claude-Mem
record, installs Greptile context, triggers review, and prints the Intent Anchor
drift snapshot in the Actions log.

Expected result for the deliberate demo PR:

- tests remain green;
- Claude-Mem is shown as `recalled`;
- Greptile is shown as `reviewing`;
- Intent Anchor reports `BADLY DRIFTED`;
- Greptile produces an intent-backed finding rather than an uncertain question.

## Stage-day checklist

- Runner is online and idle.
- Laptop sleep is disabled and network is stable.
- Claude-Mem readiness returns `ready`.
- GitHub Actions secrets exist.
- Greptile repository indexing is complete.
- Baseline and treatment reviews are captured.
- The three-minute flow has been rehearsed twice.
- A screen recording and real-run snapshot are available if an API is slow.

