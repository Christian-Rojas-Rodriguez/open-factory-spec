// Factory-level test: every agent definition under .claude/agents/ must satisfy
// the POA frontmatter contract. Parametrized so it scales to each new agent.
// Reuses the CLI's compiled frontmatter parser (run `pnpm -r build` first).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { parseFrontmatter } from "../../packages/cli/dist/utils/frontmatter.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const agentsDir = resolve(__dirname, "..", "..", ".claude", "agents");
const VALID_COLORS = new Set([
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
  "pink",
  "cyan",
]);

// Per .claude/specs/workflow.md §2.1, every agent uses orange. Pinning each one
// prevents accidental drift back to mixed per-agent colors.
const EXPECTED_COLOR = {
  researcher: "orange",
  architect: "orange",
  planner: "orange",
  curator: "orange",
  specter: "orange",
  qa: "orange",
  coder: "orange",
  reviewer: "orange",
  tester: "orange",
  pr: "orange",
  auditor: "orange",
};

const files = (await readdir(agentsDir)).filter((f) => f.endsWith(".md"));

test("the factory declares at least one agent", () => {
  assert.ok(files.length > 0, "no agent files found");
});

for (const f of files) {
  test(`agent ${f} satisfies the frontmatter contract`, async () => {
    const fm = parseFrontmatter(await readFile(join(agentsDir, f), "utf8"));
    assert.ok(fm, `${f}: must have YAML frontmatter`);
    assert.ok(fm.data.name, `${f}: must declare name`);
    assert.ok(
      fm.data.name === f.replace(/\.md$/, ""),
      `${f}: name "${fm.data.name}" must match the filename`,
    );
    assert.ok(
      (fm.data.description ?? "").length > 20,
      `${f}: must declare a substantive description`,
    );
    assert.ok(fm.data.tools, `${f}: must declare a minimum-privilege tools allowlist`);
    assert.ok(fm.data.model, `${f}: must pin a model`);
    assert.ok(
      VALID_COLORS.has(fm.data.color),
      `${f}: color must be one of the palette, got "${fm.data.color}"`,
    );
    const expected = EXPECTED_COLOR[fm.data.name];
    if (expected) {
      assert.equal(
        fm.data.color,
        expected,
        `${f}: color must be "${expected}" per workflow.md §2.1, got "${fm.data.color}"`,
      );
    }
    assert.ok(fm.body.trim().length > 0, `${f}: system-prompt body must be non-empty`);
  });
}
