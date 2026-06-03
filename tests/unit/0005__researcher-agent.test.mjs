// Unit tests for Task 0005 — `researcher` agent.
// Spec: .claude/specs/tasks/0005-researcher-agent.md
// One test per acceptance criterion. Plain Node, zero deps.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const agentPath = resolve(repoRoot, ".claude/agents/researcher.md");

/**
 * Minimal frontmatter parser: extracts the YAML block between leading `---` fences
 * and returns it as an object. Only handles flat scalars and comma-separated lists
 * (which is all the researcher.md frontmatter uses).
 */
function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) {
    throw new Error("missing frontmatter opening fence");
  }
  const end = text.indexOf("\n---", 4);
  if (end === -1) {
    throw new Error("missing frontmatter closing fence");
  }
  const block = text.slice(4, end);
  const body = text.slice(end + 4).replace(/^\n/, "");
  const data = {};
  for (const rawLine of block.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const m = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    data[m[1]] = value;
  }
  return { data, body };
}

async function loadAgent() {
  await access(agentPath);
  const text = await readFile(agentPath, "utf8");
  return { text, ...parseFrontmatter(text) };
}

test("AC1: agent file exists and parses as YAML frontmatter + markdown body", async () => {
  const { data, body } = await loadAgent();
  assert.ok(data.name, "frontmatter must declare name");
  assert.ok(body.length > 0, "markdown body must be non-empty");
});

test("AC2: description includes 'Use proactively when' and a research verb", async () => {
  const { data } = await loadAgent();
  assert.ok(typeof data.description === "string", "description must be a string");
  assert.match(
    data.description,
    /Use proactively when/i,
    "description must contain 'Use proactively when'",
  );
  assert.match(
    data.description,
    /\b(research|investigate|analyze|explore)/i,
    "description must contain at least one research verb",
  );
});

test("AC3: tools allowlist is exactly Read, Grep, Glob, WebFetch", async () => {
  const { data } = await loadAgent();
  assert.ok(typeof data.tools === "string", "tools must be a comma-separated string");
  const got = data.tools
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .sort();
  const want = ["Glob", "Grep", "Read", "WebFetch"];
  assert.deepEqual(got, want, `tools mismatch: got ${got.join(",")} want ${want.join(",")}`);
});

test("AC4: model/effort/permissionMode/memory/color/maxTurns are pinned", async () => {
  const { data } = await loadAgent();
  assert.equal(data.model, "haiku", "model must be haiku");
  assert.equal(data.effort, "medium", "effort must be medium");
  assert.equal(data.permissionMode, "plan", "permissionMode must be plan");
  assert.equal(data.memory, "project", "memory must be project");
  assert.equal(data.color, "orange", "color must be orange");
  assert.equal(data.maxTurns, "20", "maxTurns must be 20");
});

test("AC5: body contains the required output-shape headings", async () => {
  const { body } = await loadAgent();
  assert.match(body, /^## Findings$/m, "body must contain '## Findings' heading");
  assert.match(body, /^## Open questions$/m, "body must contain '## Open questions' heading");
  assert.match(
    body,
    /^## Recommended next agent$/m,
    "body must contain '## Recommended next agent' heading",
  );
});

test("AC6: body references MEMORY.md", async () => {
  const { body } = await loadAgent();
  assert.match(body, /MEMORY\.md/, "body must reference MEMORY.md");
});

test("AC7: body does not mention write tools or package managers", async () => {
  const { body } = await loadAgent();
  const forbidden = ["Edit", "Write", "Bash", "npm", "pnpm"];
  for (const token of forbidden) {
    const re = new RegExp(`\\b${token}\\b`);
    assert.doesNotMatch(
      body,
      re,
      `body must not mention '${token}' (read-only agent should not reference write tools)`,
    );
  }
});
