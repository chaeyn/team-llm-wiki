import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

// Load both consumers in a fresh process: configuration is immutable at startup.
test("one YAML drives server settings and only public branding enters the web bundle", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "wiki-config-test-"));
  try {
    const filename = path.join(directory, "wiki.yaml");
    await writeFile(filename, `branding:\n  wikiTitle: Example Docs\n  botName: Docs Bot\nlocale: fr\nupdates:\n  command: /record\nllm:\n  systemPrompt: Synthetic private instructions\nsources:\n  notion:\n    rootPageIds: [synthetic-root-placeholder]\n`);
    const output = execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", `
      import { config } from './src/config.ts';
      import web from './web/next.config.mjs';
      console.log(JSON.stringify({ config, public: web.env }));
    `], { cwd: process.cwd(), env: { ...process.env, WIKI_CONFIG: filename }, encoding: "utf8" });
    const result = JSON.parse(output);
    assert.equal(result.config.branding.wikiTitle, "Example Docs");
    assert.equal(result.public.NEXT_PUBLIC_WIKI_TITLE, "Example Docs");
    assert.equal(result.public.NEXT_PUBLIC_WIKI_LOCALE, "fr");
    assert.equal(result.public.NEXT_PUBLIC_UPDATE_COMMAND, "/record");
    assert.equal(result.public.NEXT_PUBLIC_BOT_NAME, "Docs Bot");
    assert.ok(!JSON.stringify(result.public).includes("Synthetic private instructions"));
    assert.ok(!JSON.stringify(result.public).includes("synthetic-root-placeholder"));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
