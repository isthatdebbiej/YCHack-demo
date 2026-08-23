# Intent Anchor demo checkout

A deliberately small TypeScript checkout service for the three-minute Intent
Anchor demo.

## Product constraint

When checkout is overloaded, return HTTP 429 immediately. Never queue, accept,
or silently defer an order because a delayed order can duplicate a customer's
retry.

## Demo shape

- `main` contains the correct reject-on-overload behavior.
- The demo PR changes the overload path to enqueue and return `202 Accepted`.
- Baseline Greptile sees only the code and must infer whether queueing is valid.
- Treatment Greptile receives the approved constraint through Intent Anchor.
- Intent Anchor independently reveals the change as badly drifted.

Opening a GitHub Issue runs the included workflow on the self-hosted
`intent-anchor` runner. It queries Claude-Mem by repository and issue number,
then captures and writes the approved intent only when no record exists.

## Verify

```bash
npm install
npm test
npm run typecheck
```

For a fresh laptop, GitHub Actions runner, Claude-Mem, secrets, Greptile, and
stage-day instructions, follow [SETUP.md](SETUP.md).
