#!/usr/bin/env python3
"""Validate and package a standalone wiki plugin without credentials.

The plugin directory name, MCP server name, and MCP endpoint are taken from CLI
arguments so any team can package its own plugin. No team-specific values here.
"""

import argparse
import json
from pathlib import Path
import re
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parent.parent
# Skip URLs and path/repository identifiers; a sentence-ending period is allowed.
SERVER_MENTION = re.compile(
    r"[A-Za-z][A-Za-z0-9+.-]*://[^\s<>`\"']+|"
    r"(?<![\w./\\-])(team-llm-wiki)(?![\w/\\-]|\.\w)"
)
SKILLS = {"wiki-answer", "wiki-metrics", "wiki-change"}
ALLOWED = {
    "plugin.json", "mcp.json", "README.md",
    "skills/wiki-answer/SKILL.md", "skills/wiki-answer/references/retrieval.md",
    "skills/wiki-metrics/SKILL.md", "skills/wiki-change/SKILL.md",
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def validate(source, server_name, endpoint):
    require(source.is_dir() and not source.is_symlink(), "Plugin source must be a real directory")
    files = {}
    for item in sorted(source.rglob("*")):
        require(not item.is_symlink(), f"Symlink is not allowed: {item.relative_to(source)}")
        if item.is_file():
            relative = item.relative_to(source).as_posix()
            require(relative in ALLOWED, f"Unexpected package file: {relative}")
            files[relative] = item.read_bytes()
    require(set(files) == ALLOWED, "The package must contain every expected manifest, skill, and asset")

    manifest = json.loads(files["plugin.json"])
    require(manifest.get("$schema") == "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json", "Invalid plugin schema")
    require(manifest.get("name") == source.name, "Plugin directory and manifest name must match")
    require(re.fullmatch(r"\d+\.\d+\.\d+", manifest.get("version", "")), "A semantic version is required")
    require(not {"skills", "apps", "mcpServers", "interface"} & manifest.keys(), "Use portable manifest fields")
    presentation = manifest["extensions"]["com.openai"]["interface"]
    require(isinstance(presentation["shortDescription"], str) and presentation["shortDescription"].strip(), "A nonempty subtitle is required")
    prompts = presentation["defaultPrompt"]
    require(isinstance(prompts, str) or (isinstance(prompts, list) and 1 <= len(prompts) <= 3 and all(isinstance(p, str) for p in prompts)), "Invalid default prompts")
    require(presentation["capabilities"] == ["Read"], "The connected MCP is read-only")
    require(re.fullmatch(r"[a-zA-Z0-9_-]+", server_name), "Invalid MCP server name")
    from urllib.parse import urlparse
    url = urlparse(endpoint)
    require(url.scheme == "https" and url.hostname and not url.username and not url.password and not url.query and not url.fragment, "Use an HTTPS endpoint without credentials")
    files["mcp.json"] = (json.dumps({
        "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
        "mcpServers": {server_name: {"type": "streamable-http", "url": endpoint}},
    }, indent=2) + "\n").encode()
    base = endpoint.removesuffix("/mcp")
    for name, data in list(files.items()):
        if name.endswith(".md"):
            content = data.decode().replace("https://wiki.example.com", base)
            files[name] = SERVER_MENTION.sub(lambda match: server_name if match[1] else match[0], content).encode()
    manifest["homepage"] = base + "/docs"
    presentation["websiteURL"] = base + "/docs"
    files["plugin.json"] = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode()

    for skill in SKILLS:
        content = files[f"skills/{skill}/SKILL.md"].decode("utf-8")
        frontmatter = re.match(r"\A---\n(.*?)\n---\n", content, re.S)
        require(frontmatter is not None, f"Missing frontmatter: {skill}")
        fields = dict(re.findall(r"^(name|description): (.+)$", frontmatter[1], re.M))
        require(fields.get("name") == skill and fields.get("description", "").strip(), f"Invalid skill metadata: {skill}")

    credential = re.compile(r"-----BEGIN .*PRIVATE KEY-----|(?:gh[pousr]_|github_pat_|sk-(?:proj-|svcacct-)?)[A-Za-z0-9_-]{20,}")
    for name, data in files.items():
        if not name.endswith((".png", ".jpg")):
            require(not credential.search(data.decode("utf-8")), f"Credential-like material found in {name}")
    return manifest, files


def package(output, source, server_name, endpoint):
    manifest, files = validate(source, server_name, endpoint)
    output = output.expanduser().resolve()
    require(not output.is_relative_to(source.resolve()), "Write the ZIP outside the plugin directory")
    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
        for name, data in files.items():
            entry = ZipInfo(f"{manifest['name']}/{name}", date_time=(2026, 1, 1, 0, 0, 0))
            entry.compress_type = ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, data)
    with ZipFile(output) as archive:
        require(archive.testzip() is None, "Archive integrity check failed")
    return {"archive": str(output), "name": manifest["name"], "version": manifest["version"], "files": len(files)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--name", default="team-llm-wiki", help="Plugin directory and manifest name (under plugins/).")
    parser.add_argument("--server-name", default="team-llm-wiki", help="MCP server name declared in mcp.json.")
    parser.add_argument("--endpoint", default="https://wiki.example.com/mcp", help="MCP streamable-http endpoint URL.")
    args = parser.parse_args()
    try:
        print(json.dumps(package(args.output, ROOT / "plugins" / args.name, args.server_name, args.endpoint), ensure_ascii=False))
    except (ValueError, KeyError) as error:
        parser.exit(1, f"Plugin package validation failed: {error}\n")
