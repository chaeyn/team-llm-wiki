# Wiki Starter

A tiny sample wiki you can copy as the seed of your own wiki repository.
Everything here is generic — replace the sample content with your team's notes.

## What this is

This directory is a **plain Markdown git repository**. The wiki server does not
own or edit it: it keeps a **read-only checkout** of this repo (typically updated
on every push to the default branch) and serves search, read, and context over
the notes. All retrieval runs against the raw Markdown — there is no database of
record other than the files themselves.

To use it: copy the contents of this folder into a fresh git repository, point
`wiki.repository` / `wiki.defaultBranch` in your `wiki.config.yaml` at it, and
start adding notes.

## How a note works

Each note is a single `.md` file.

- **Title** comes from the first level-1 heading (`# ...`) in the body. If there
  is no H1, the file name is used.
- **Frontmatter** is a YAML block fenced by `---` that must start on the very
  first line of the file. The server reads a few well-known fields from it
  (see below and `metadata-guide.md`).
- **Wiki-links** use `[[note-name]]` (optionally `[[note-name|display text]]`).
  They resolve by file name, path, or title. Prefer linking a value's single
  source of truth over repeating the value.
- Do **not** use Obsidian embeds (`![[...]]`). The retrieval indexer does not
  expand them.

### The four contract fields

Every note's frontmatter should begin with these four, in this order:

```yaml
domain: [server]
question: "Which user question does this note answer?"
owner: platform-team
verification: verified
```

- `domain` — one or more areas the note covers, as a list (e.g. `[server]`,
  `[server, ai]`).
- `question` — the one representative user question this note answers. Quote it.
- `owner` — the single team that maintains the canonical version.
- `verification` — the evidence level. The server filters on this, so keep it
  honest (see `metadata-guide.md` for the full set of values).

`last_verified: YYYY-MM-DD` and any other fields you keep (e.g. `type`,
`status`) go after the four contract fields.

## The metrics note

Values that change over time — limits, capacities, current deploy tags — live in
a **single "current metrics" note** so there is one source of truth. In this
starter that note is `_metrics.md`, which matches the default
`wiki.metricsNote: "_metrics.md"` in `wiki.config.yaml`.

When that config is set, the server registers a `get_current_metrics` tool and
gives this note priority for identifier-style queries (e.g. `MAX_SESSIONS`).
Other notes should **link** to `[[_metrics]]` rather than copy the numbers.

## The `history/` folder

Notes under the configured history folder (default `history/`, set via
`wiki.historyFolder`) are treated as historical. They are excluded from search
and context unless a caller explicitly asks to include history. Move superseded
notes there instead of deleting them.

## Files in this starter

- `metadata-guide.md` — the frontmatter conventions, with examples.
- `_metrics.md` — the sample single-source metrics note.
- `decisions/sample-decision.md` — one sample decision note showing the style.
