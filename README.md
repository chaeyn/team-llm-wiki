# team-llm-wiki

A self-hosted, single-tenant wiki for one team per installation. Keep Markdown
in Git, retrieve evidence through read-only MCP and hybrid search, and turn
reviewed chat proposals into GitHub Draft PRs.

Public project: [chaeyn/team-llm-wiki](https://github.com/chaeyn/team-llm-wiki).
Licensed under [MIT](LICENSE); see [NOTICE](NOTICE.md) for provenance.

## Architecture

```text
Markdown Git repo -> read-only server checkout -> Fastify API / read-only MCP
                                                  | keyword + Qdrant (RRF)
                                                  | local embeddings
                                                  | Next.js / Fumadocs web
                                                  | optional Notion source
Shared chat -> /update -> requester reviews -> GitHub App Draft PR
                                                -> human merge -> checkout sync
```

Search checks vector hits against current source hashes and falls back to keyword
search on vector failure. Bounded context and section reads keep evidence small.
Chat uses an OpenAI-compatible endpoint, an optional Hermes bridge, or can be
disabled. Wiki excerpts and chat context are sent to your selected LLM provider;
embeddings run locally. Web conversations are shared by all authenticated team
members and persist in SQLite.

## Quick start

Requires Docker Compose, a server with HTTPS, and a GitHub organization. Local
source development requires Node **24+** and Python 3 for helper scripts.

1. Create a **separate Markdown repository** from [examples/wiki-starter](examples/wiki-starter)
   and clone it onto your server using a read-only deploy credential.
2. Clone this project, then prepare the team configuration:
   ```sh
   git clone https://github.com/chaeyn/team-llm-wiki.git
   cd team-llm-wiki
   cp wiki.config.example.yaml wiki.config.yaml
   cp .env.example .env
   chmod 600 .env
   ```
   Edit YAML for branding, public URL/origin, organization, wiki repository and
   branch. Set `.env`'s `WIKI_HOST_PATH` to the absolute wiki checkout path.
3. Create a GitHub OAuth App with callback
   `https://wiki.example.com/auth/github/callback` (use your actual hostname).
   Put its client ID and secret in `.env`; generate a separate random
   `SESSION_SECRET` of at least 32 characters. Confirm organization access.
4. Run `docker compose up -d --build`, then put an HTTPS reverse proxy in front
   of `127.0.0.1:3100`; [deploy/Caddyfile.example](deploy/Caddyfile.example) is a template.
   Log into `/docs` and verify `/api/status` while authenticated.
5. Configure your LLM endpoint/model in YAML and `LLM_API_KEY` in `.env` for chat.
   To enable Draft PRs, install a GitHub App with Contents and Pull requests write
   access on the wiki repository and enable the key mount described in the
   [complete setup guide](docs/team-setup.md).

The setup guide also covers checkout synchronization, backups, optional Notion,
and acceptance checks. No external resources are created automatically.

## Configuration

`wiki.config.yaml` is the single team configuration (`WIKI_CONFIG` can select a
file). Missing files use neutral defaults for development/tests. Credentials stay
in environment variables. `.env` is loaded by Compose; local Node commands need
exported variables or Node's `--env-file` option.

| Keys | Purpose |
| --- | --- |
| `branding.*`, `locale` | Organization, title, description, logo URL, bot name, language hint |
| `server.publicBaseUrl`, `server.allowedOrigins` | Public OAuth URL and browser origins |
| `integrations.serviceIdentity` | Identity used for read-service measurements |
| `auth.provider`, `auth.github.org` | GitHub org gate; `disabled` for local development only |
| `wiki.repository`, `wiki.defaultBranch` | Separate canonical wiki and Draft PR target branch |
| `wiki.metricsNote`, `wiki.historyFolder` | Optional current metrics tool; history filtering |
| `mcp.serverName` | MCP name and cookie/patch-lock namespace |
| `updates.*` | Enable updates, command/aliases, App slug, optional tracking issue |
| `search.embedding.*`, `search.vector.*` | Model/revision/dimensions, Qdrant URL/alias |
| `llm.*` | Provider, endpoint, model, system prompt |
| `sources.notion.*` | Enable optional source and restrict root page IDs |

Web builds derive public branding from the same YAML; rebuild the web image after
changing it. Only those public fields are embedded. Credentials and wiki bodies
are never bundled. `NEXT_PUBLIC_*` remains an optional build override. The
embedding container reads the mounted YAML and verifies model dimensions.
Existing `PUBLIC_BASE_URL`, `GITHUB_ORG`, `WIKI_GITHUB_REPOSITORY`, `LLM_*`,
`QDRANT_URL` and related deployment overrides remain supported.

## Connect agents

Use your configured server name and public URL. Complete GitHub login with an
active member/admin of the configured organization.

```sh
codex mcp add team-llm-wiki --url https://wiki.example.com/mcp
codex mcp login team-llm-wiki
claude mcp add --transport http team-llm-wiki https://wiki.example.com/mcp
```

Install `agent-skills/wiki-reader` and `agent-skills/wiki-update` into your agent's
skills directory. The v0.9 update skill is maintained once in `agent-skills/`;
replace its team placeholders at installation. Read MCP cannot edit the wiki.
The update skill edits a separately authorized local Git checkout, validates hashes
and diff, and publishes a Draft PR only within the user's requested scope.

An optional plugin bundles MCP with answer, metrics and proposal skills:

```sh
python3 scripts/package-plugin.py --output /tmp/team-llm-wiki-plugin.zip \
  --server-name team-llm-wiki --endpoint https://wiki.example.com/mcp
```

## Writes and authentication

In web chat, `/update` (alias `/업데이트`) proposes source-backed changes. The
**requester** reviews the before/after and opens a Draft PR. Other team members can
read the shared conversation but cannot publish another person's proposal.
Publishing rechecks remote source hashes and reuses an existing matching PR on
retry. Human review/merge and checkout synchronization remain separate steps.
There is no session-end or product-PR automatic upload collector.

| Credential / resource | Allowed access |
| --- | --- |
| OAuth `/mcp`, `mcp:read` | Allowlisted read MCP methods/tools only |
| Legacy scope-less `/mcp` token | Same read MCP access; no web API access |
| OAuth `/api`, `api:read` | GET/HEAD APIs and POST `/api/sections` |
| OAuth `/api`, `api:write` | Chat, conversation creation, publishing, events and feedback writes |
| Web session | Team web/API access; writes require same origin; publishing still requires requester identity |
| `WIKI_SERVICE_KEY` | Allowlisted source reads and read MCP only |

OAuth authorization accepts only scopes belonging to the requested resource.
A token with the wrong audience cannot gain access by adding a scope. Missing or
insufficient API scopes return 403; invalid credentials return 401. Refresh never
promotes scopes or changes audience. See [auth policy](docs/auth-session-policy.md)
for expiry and the current delay in detecting organization departures.

## Development and validation

```sh
npm install
npm run check
npm test
npm run build
cd web
npm install
npm run check
npm run build
```

For a local API: `AUTH_MODE=disabled WIKI_ROOT=./examples/wiki-starter npm run dev`.
Start `web` separately with `npm run dev`. For production-like local routing, set
`WIKI_WEB_URL=http://127.0.0.1:3000` on the API. Keep disabled auth on loopback.

Root `test:ui` and `test:notion-ui` run Playwright smoke tests using synthetic
fixtures. They require a Chromium installation. Python checks cover the Notion
setup helper, optional bridge, and section patch helper. See [verification](docs/verification.md)
for results and release-tree scans.

## Layout

`src/`: API/auth/search/updates; `web/`: UI; `test/`: automated checks;
`agent-skills/`: reader and v0.9 updater; `plugins/team-llm-wiki/`: optional plugin;
`deploy/`: embeddings/proxy/optional bridge; `examples/`: seed wiki and sync workflow;
`docs/`: installation, behavior and operations.
