import importlib.util
import json
from pathlib import Path
import shutil
from tempfile import TemporaryDirectory
import unittest
from zipfile import ZipFile

spec = importlib.util.spec_from_file_location("package_plugin", Path(__file__).with_name("package-plugin.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

SOURCE = Path(__file__).resolve().parent.parent / "plugins" / "team-llm-wiki"
GITHUB_LINK = "https://github.com/chaeyn/team-llm-wiki/blob/main/docs/team-setup.md"
ENDPOINT = "https://docs.acme.test/mcp"


class PackagePluginTests(unittest.TestCase):
    def test_validate_preserves_readme_links_and_customizes_endpoint(self):
        manifest, files = module.validate(SOURCE, "acme-wiki", ENDPOINT)
        readme = files["README.md"].decode()
        self.assertIn(GITHUB_LINK, readme)
        self.assertEqual(json.loads(files["mcp.json"])["mcpServers"], {
            "acme-wiki": {"type": "streamable-http", "url": ENDPOINT},
        })
        self.assertEqual(manifest["homepage"], "https://docs.acme.test/docs")
        self.assertEqual(manifest["extensions"]["com.openai"]["interface"]["websiteURL"],
                         "https://docs.acme.test/docs")
        for name, data in files.items():
            if name.endswith(".md"):
                with self.subTest(file=name):
                    self.assertNotIn("https://wiki.example.com", data.decode())
        for path in ("/docs", "/chat", "/docs/bot-guide"):
            self.assertIn(f"(https://docs.acme.test{path})", readme)

    def test_validate_replaces_only_standalone_mentions(self):
        preserved = [
            "https://github.com/chaeyn/team-llm-wiki",
            "/tmp/team-llm-wiki-0.1.0.zip",
            "team-llm-wiki.git",
            "team-llm-wiki/docs",
            "team-llm-wiki-0.1.0",
            "chaeyn/team-llm-wiki",
            "prefix-team-llm-wiki",
            "team-llm-wiki_extra",
            "team-llm-wikiextra",
            "https://example.com/?repo=team-llm-wiki",
            "https://example.com/#team-llm-wiki",
            "https://team-llm-wiki.example.com",
            r"C:\plugins\team-llm-wiki",
            r"team-llm-wiki\docs",
        ]
        with TemporaryDirectory() as tmp:
            source = Path(tmp) / "team-llm-wiki"
            shutil.copytree(SOURCE, source)
            skill = source / "skills" / "wiki-answer" / "SKILL.md"
            with skill.open("a", encoding="utf-8") as stream:
                stream.write('\nMCP 서버 `team-llm-wiki` 도구를 사용한다. Connect team-llm-wiki.\n')
                stream.write("\n".join(preserved) + "\n")
            _, files = module.validate(source, "acme-wiki", ENDPOINT)
        content = files["skills/wiki-answer/SKILL.md"].decode()
        self.assertIn("MCP 서버 `acme-wiki` 도구를 사용한다. Connect acme-wiki.", content)
        for reference in preserved:
            with self.subTest(reference=reference):
                self.assertIn(reference, content.splitlines())

    def test_package_preserves_github_link_in_zip(self):
        with TemporaryDirectory() as tmp:
            output = Path(tmp) / "plugin.zip"
            module.package(output, SOURCE, "acme-wiki", ENDPOINT)
            with ZipFile(output) as archive:
                self.assertIn(GITHUB_LINK, archive.read("team-llm-wiki/README.md").decode())


if __name__ == "__main__":
    unittest.main()
