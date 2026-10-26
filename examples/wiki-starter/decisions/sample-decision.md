---
domain: [server]
question: "Why did we cap concurrent sessions, and what is the current limit?"
owner: platform-team
verification: verified
last_verified: 2026-01-01
type: reference
status: current
---

# Cap Concurrent Sessions Per Instance

## Decision

We cap the number of concurrent sessions a single server instance will accept,
and shed additional load rather than let latency degrade for everyone. The
current limit is tracked as `MAX_SESSIONS` in [[_metrics]] — look there for the
live value, and link to it instead of repeating the number here.

## Context

Load tests showed that past the cap, tail latency rose sharply while throughput
stayed flat, so admitting more sessions only made the experience worse for all
connected users. Capping admission keeps latency predictable and makes capacity
planning a matter of adding instances.

## Consequences

- Clients may receive a "try again" response when an instance is at capacity;
  they should retry against another instance.
- Raising throughput is done by adding instances, not by raising the per-instance
  cap. If the cap itself changes, update only `MAX_SESSIONS` in [[_metrics]].

## Notes

This is a sample note showing the house style: start with the decision, keep
changing values in [[_metrics]], link rather than copy, and keep the four
contract frontmatter fields first and in order.
