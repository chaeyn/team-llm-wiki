---
domain: [shared]
question: "Which frontmatter fields does a wiki note need and what do they mean?"
owner: platform-team
verification: verified
last_verified: 2026-01-01
type: reference
status: current
---

# Metadata Guide

This note documents the frontmatter conventions for every note in this wiki.
It is the canonical reference; when another note disagrees, follow this one.

## Frontmatter basics

Every note starts — on its **very first line** — with a YAML block fenced by
`---`. The server reads well-known fields from it and otherwise preserves any
extra fields you add. Keep the four contract fields first, in this order.

```yaml
---
domain: [server]
question: "What must be checked before restarting the worker, and how is it verified after?"
owner: platform-team
verification: verified
last_verified: 2026-01-01
---
```

## The four contract fields

| Field | Meaning | Value |
|---|---|---|
| `domain` | Which area(s) the note covers. A list, even for one value. | `[server]`, `[ai]`, `[client]`, `[product]`, `[shared]` — or several, e.g. `[server, ai]` |
| `question` | The one user question this note answers. Not a repeat of the title. | A single quoted question sentence ending in `?` |
| `owner` | The single team that maintains the canonical version. | e.g. `platform-team` |
| `verification` | Evidence level backing the body. | See the table below |

Notes:

- Use `[shared]` only for genuinely cross-cutting process notes, not as a
  shorthand for "several domains" — list the real domains instead.
- `domain` need not match the folder a note lives in.
- Keep exactly one `owner`. If ownership changes, edit the field rather than
  copying the note.

## `question` rules

`question` is the user question that should make a retriever pick this note —
not a label.

```yaml
# good
question: "How do I rotate the service credentials safely?"

# bad — a label, not a question
question: "Credentials note"

# bad — unrelated questions jammed together
question: "What are credentials, how are they rotated, and why did the outage happen?"
```

1. One complete question sentence, ending in `?`.
2. Always wrap it in double quotes (avoids YAML parsing surprises).
3. If a note needs two unrelated questions, split it into two notes instead.

## `verification` values

Pick the level your evidence actually supports; when unsure, choose a lower one.
For simplicity a starter wiki can use just `verified` / `unverified`, but the
full set the server accepts is:

| Value | When |
|---|---|
| `verified` | Backed by checked evidence (code, runtime, or a cited source) |
| `unverified` | No confirmed source or evidence yet |

Do not cite `unverified` notes as if they were canonical. Raise the level only
when real evidence appears; lower it to `unverified` (and say what is stale in
the body) when part of a note goes out of date.

## Dates

`last_verified` is `YYYY-MM-DD`. Set it to today only when the whole note has
been re-checked against current evidence; leave it unchanged for typo or link
fixes.

## Optional display fields

A note may override how it is presented to humans without changing what the
retriever indexes (retrieval always uses the canonical body):

- `DisplayTitle` — a human-friendly title (also accepted as `display_title`).
- `DisplayContent` — rendered prose shown instead of the raw body
  (also `display_content`).
- `DisplaySourceHash` — the body hash the display prose was generated from; when
  it no longer matches the body, the display is flagged stale
  (also `display_source_hash`).

Example:

```yaml
---
domain: [server]
question: "What is our session concurrency limit?"
owner: platform-team
verification: verified
last_verified: 2026-01-01
DisplayTitle: "Session limits"
DisplayContent: "The current session limit is tracked in the metrics note."
---
```

## Single source for changing values

Values that change — limits, capacities, deploy tags — belong only in the
metrics note (`[[_metrics]]`). Other notes link to it rather than repeating the
value. Do not use Obsidian embeds (`![[...]]`); the indexer does not expand them.
