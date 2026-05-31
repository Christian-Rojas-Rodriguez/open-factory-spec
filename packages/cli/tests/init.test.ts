import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, access, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliRoot = resolve(__dirname, "..");

/**
 * Tests run against the COMPILED output in `dist/`. Run `pnpm -r build` first.
 * This both validates the published artifact and avoids `--experimental-strip-types`
 * issues with `.js` extensions in cross-file imports.
 */

const SUT_PATH = "../dist/commands/init.js";

describe("init", () => {
  let tmp: string;

  before(async () => {
    tmp = await mkdtemp(join(tmpdir(), "open-factory-test-"));
  });

  after(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it("scaffolds CLAUDE.md and .claude/ into an empty target", async () => {
    const { runInit } = await import(SUT_PATH);
    const code = await runInit({
      targetDir: tmp,
      force: false,
      dryRun: false,
      skipClaudeMd: false,
      yes: true,
    });
    assert.equal(code, 0);

    await access(join(tmp, "CLAUDE.md"));
    await access(join(tmp, ".claude", "specs", "constitution.md"));
    await access(join(tmp, ".claude", "specs", "SPEC.md"));
    await access(join(tmp, ".claude", "specs", "workflow.md"));
    await access(join(tmp, ".claude", "specs", "diagrams", "poa-class.md"));

    const claudeMd = await readFile(join(tmp, "CLAUDE.md"), "utf8");
    assert.ok(
      claudeMd.includes("Non-negotiable rules"),
      "CLAUDE.md should contain the non-negotiable rules section",
    );
    assert.ok(
      !claudeMd.includes("Tasks 0001-0029"),
      "CLAUDE.md must not contain opftr-specific task references",
    );
    assert.ok(
      !claudeMd.includes("Hito A"),
      "CLAUDE.md must not contain opftr-specific milestone references",
    );
  });

  it("dry-run does not write files", async () => {
    const tmp2 = await mkdtemp(join(tmpdir(), "open-factory-test-dry-"));
    try {
      const { runInit } = await import(SUT_PATH);
      const code = await runInit({
        targetDir: tmp2,
        force: false,
        dryRun: true,
        skipClaudeMd: false,
        yes: true,
      });
      assert.equal(code, 0);
      await assert.rejects(() => access(join(tmp2, "CLAUDE.md")));
      await assert.rejects(() => access(join(tmp2, ".claude")));
    } finally {
      await rm(tmp2, { recursive: true, force: true });
    }
  });

  it("skip-claude-md leaves CLAUDE.md untouched", async () => {
    const tmp3 = await mkdtemp(join(tmpdir(), "open-factory-test-skip-"));
    try {
      const { runInit } = await import(SUT_PATH);
      const code = await runInit({
        targetDir: tmp3,
        force: false,
        dryRun: false,
        skipClaudeMd: true,
        yes: true,
      });
      assert.equal(code, 0);
      await access(join(tmp3, ".claude"));
      await assert.rejects(() => access(join(tmp3, "CLAUDE.md")));
    } finally {
      await rm(tmp3, { recursive: true, force: true });
    }
  });

  it("refuses to overwrite ourselves (self-bootstrap guard)", async () => {
    const { runInit } = await import(SUT_PATH);
    // Resolve the workspace root that contains this package.
    const workspaceRoot = resolve(cliRoot, "..", "..");
    const code = await runInit({
      targetDir: workspaceRoot,
      force: false,
      dryRun: false,
      skipClaudeMd: false,
      yes: true,
    });
    assert.equal(code, 2, "should exit with code 2 when target is the source tree");
  });
});
