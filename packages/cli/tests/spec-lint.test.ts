import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Tests run against the COMPILED output in dist/. Run `pnpm -r build` first.
const SUT = "../dist/commands/spec-lint.js";

const VALID = `---
task: "0001"
slug: example
granularity: component
version: 0.1.0
status: in-progress
declares:
  - type: agent
    name: example
scope:
  - .claude/agents/example.md
---

# Task 0001 — example

## What
A thing.

## Why
A reason.

## How
A method.

## Acceptance criteria
1. The file exists and parses.

## Out of scope
- Nothing.
`;

describe("spec-lint", () => {
  it("accepts a well-formed spec", async () => {
    const { lintSpecContent } = await import(SUT);
    const r = lintSpecContent(VALID, { workflowText: "task 0001 is declared" });
    assert.equal(r.ok, true, JSON.stringify(r.findings));
  });

  it("blocks when a required section is missing", async () => {
    const { lintSpecContent } = await import(SUT);
    const noWhy = VALID.replace("## What\nA thing.\n\n", "");
    const r = lintSpecContent(noWhy);
    assert.equal(r.ok, false);
    assert.ok(r.findings.some((f: { message: string }) => f.message.includes("## What")));
  });

  it("blocks a non-SemVer version", async () => {
    const { lintSpecContent } = await import(SUT);
    const r = lintSpecContent(VALID.replace("version: 0.1.0", "version: 1.0"));
    assert.equal(r.ok, false);
    assert.ok(r.findings.some((f: { message: string }) => f.message.includes("SemVer")));
  });

  it("blocks a missing frontmatter key", async () => {
    const { lintSpecContent } = await import(SUT);
    const r = lintSpecContent(VALID.replace("status: in-progress\n", ""));
    assert.equal(r.ok, false);
    assert.ok(r.findings.some((f: { message: string }) => f.message.includes("status")));
  });

  it("warns (but does not block) on an ambiguity token", async () => {
    const { lintSpecContent } = await import(SUT);
    const r = lintSpecContent(
      VALID.replace("1. The file exists and parses.", "1. The agent behaves correctly."),
    );
    assert.equal(r.ok, true);
    assert.ok(
      r.findings.some(
        (f: { severity: string; message: string }) =>
          f.severity === "warn" && f.message.includes("correctly"),
      ),
    );
  });

  it("blocks when there is no frontmatter at all", async () => {
    const { lintSpecContent } = await import(SUT);
    const r = lintSpecContent("# just a heading\n");
    assert.equal(r.ok, false);
  });

  it("blocks when the Task is not declared in the workflow", async () => {
    const { lintSpecContent } = await import(SUT);
    const r = lintSpecContent(VALID, { workflowText: "no mention of that task here" });
    assert.equal(r.ok, false);
    assert.ok(r.findings.some((f: { message: string }) => f.message.includes("workflow.md")));
  });
});
