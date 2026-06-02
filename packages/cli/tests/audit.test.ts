import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Tests run against the COMPILED output in dist/. Run `pnpm -r build` first.
const SUT = "../dist/commands/audit.js";

interface SpecInfo {
  task: string;
  status: string;
  scope: string[];
  version: string;
  file: string;
}

function spec(partial: Partial<SpecInfo>): SpecInfo {
  return {
    task: "0001",
    status: "done",
    scope: [".claude/agents/known.md"],
    version: "0.1.0",
    file: ".claude/specs/tasks/0001-known.md",
    ...partial,
  };
}

describe("audit — governance", () => {
  it("isGoverned: POA components under .claude/ are governed; specs and others are not", async () => {
    const { isGoverned } = await import(SUT);
    assert.equal(isGoverned(".claude/agents/x.md"), true);
    assert.equal(isGoverned(".claude/hooks/x.sh"), true);
    assert.equal(isGoverned(".claude/specs/tasks/x.md"), false);
    assert.equal(isGoverned("packages/cli/src/index.ts"), false);
    assert.equal(isGoverned("README.md"), false);
  });

  it("matchesScope: exact paths and globs", async () => {
    const { matchesScope } = await import(SUT);
    assert.equal(matchesScope([".claude/agents/a.md"], ".claude/agents/a.md"), true);
    assert.equal(matchesScope([".claude/agents/*.md"], ".claude/agents/a.md"), true);
    assert.equal(matchesScope([".claude/skills/**"], ".claude/skills/x/SKILL.md"), true);
    assert.equal(matchesScope([".claude/agents/a.md"], ".claude/agents/b.md"), false);
  });

  it("patchBump increments the patch component", async () => {
    const { patchBump } = await import(SUT);
    assert.equal(patchBump("1.2.3"), "1.2.4");
    assert.equal(patchBump("0.1.0"), "0.1.1");
  });
});

describe("audit --check", () => {
  it("passes when changes are in scope and specs are covered", async () => {
    const { auditCheck } = await import(SUT);
    const r = auditCheck({
      changedFiles: [".claude/agents/known.md"],
      specs: [spec({})],
      testFiles: ["tests/unit/0001__known.test.mjs"],
    });
    assert.equal(r.ok, true, JSON.stringify(r.findings));
  });

  it("blocks a governed change outside every Spec's scope", async () => {
    const { auditCheck } = await import(SUT);
    const r = auditCheck({
      changedFiles: [".claude/agents/ghost.md"],
      specs: [spec({})],
      testFiles: ["tests/unit/0001__known.test.mjs"],
    });
    assert.equal(r.ok, false);
    assert.ok(r.findings.some((f: string) => f.includes("ghost.md")));
  });

  it("ignores non-governed changes (CLI source, docs)", async () => {
    const { auditCheck } = await import(SUT);
    const r = auditCheck({
      changedFiles: ["packages/cli/src/index.ts", "README.md"],
      specs: [spec({})],
      testFiles: ["tests/unit/0001__known.test.mjs"],
    });
    assert.equal(r.ok, true);
  });

  it("blocks when an active Spec has no test", async () => {
    const { auditCheck } = await import(SUT);
    const r = auditCheck({
      changedFiles: [],
      specs: [spec({ task: "0042", status: "in-progress" })],
      testFiles: [],
    });
    assert.equal(r.ok, false);
    assert.ok(r.findings.some((f: string) => f.includes("0042")));
  });

  it("does not require coverage for non-active specs", async () => {
    const { auditCheck } = await import(SUT);
    const r = auditCheck({
      changedFiles: [],
      specs: [spec({ task: "0099", status: "proposed" })],
      testFiles: [],
    });
    assert.equal(r.ok, true);
  });
});
