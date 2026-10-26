---
domain: [shared]
question: "What are the current changing values — limits, capacities, and deploy tags?"
owner: platform-team
verification: verified
last_verified: 2026-01-01
type: reference
status: current
---

# Current Metrics

Single source of truth for values that change over time. Other notes link here
(`[[_metrics]]`) instead of repeating a number, so there is exactly one place to
update when a value changes.

Identifiers are written in `UPPER_SNAKE_CASE` so they are easy to search for and
cite. Keep each value on its own line with a short note on what it means and
where it comes from.

## Limits

- `MAX_SESSIONS` — 100. Maximum concurrent sessions a single server instance
  accepts before shedding load.
- `REQUEST_TIMEOUT_SECONDS` — 30. Upstream request timeout for API calls.

## Capacity

- `WORKER_POOL_SIZE` — 8. Number of worker processes per node.

## Deploy

- `CURRENT_DEPLOY_TAG` — `v0.0.0`. The deploy tag currently running in
  production. Update this on every release.
