# Hermes bridge (optional LLM provider)

This is an **example** LLM provider for teams that answer chat through a Hermes
ChatGPT OAuth session instead of a standard OpenAI-compatible API. Most teams
should use `llm.provider: openai-compatible` instead and can ignore this folder.

It exposes a single `POST /v1/wiki/answer` endpoint with no tools, memory, or
persistence. The wiki server talks to it when `llm.provider: hermes-bridge`
(`LLM_BASE_URL` points at this service, `LLM_API_KEY` must equal `HERMES_WIKI_KEY`).

## Configuration (environment)

- `HERMES_WIKI_KEY` — shared secret (32+ chars). Must match the server's `LLM_API_KEY`.
- `HERMES_AGENT_PATH` — path to your local `hermes-agent` checkout (added to `sys.path`).
- `HERMES_WIKI_MODEL` — model name to request (required; choose the model your provider supports).
- `HERMES_WIKI_PORT` — listen port (default `8647`, loopback only).

## Run

```
python wiki_bridge.py            # foreground
# or install wiki-inference.service under systemd --user after editing the paths
```

Offline tests (no network, SDK mocked): `python test_wiki_bridge.py`.

- `HERMES_WIKI_SERVICE_TIER` — optional provider service tier (default `default`).
