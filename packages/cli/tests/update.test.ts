import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Tests run against the COMPILED output in dist/. Run `pnpm -r build` first.
const INIT = "../dist/commands/init.js";
const UPDATE = "../dist/commands/update.js";

describe("update", () => {
  let tmp: string;
  const agent = () => join(tmp, ".claude", "agents", "researcher.md");

  before(async () => {
    tmp = await mkdtemp(join(tmpdir(), "opftr-update-"));
    const { runInit } = await import(INIT);
    await runInit({
      targetDir: tmp,
      force: true,
      dryRun: false,
      skipClaudeMd: false,
      yes: true,
    });
  });

  after(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it("re-adds a deleted factory file (new)", async () => {
    await rm(agent(), { force: true });
    const { runUpdate } = await import(UPDATE);
    const code = await runUpdate({ targetDir: tmp, force: true, dryRun: false });
    assert.equal(code, 0);
    await access(agent()); // restored
  });

  it("overwrites a locally-modified factory file (checksum → update)", async () => {
    await writeFile(agent(), "TAMPERED", "utf8");
    const { runUpdate } = await import(UPDATE);
    await runUpdate({ targetDir: tmp, force: true, dryRun: false });
    assert.notEqual(await readFile(agent(), "utf8"), "TAMPERED");
  });

  it("never overwrites the user's CLAUDE.md (protected)", async () => {
    const claude = join(tmp, "CLAUDE.md");
    await writeFile(claude, "MY PROJECT MEMORY", "utf8");
    const { runUpdate } = await import(UPDATE);
    await runUpdate({ targetDir: tmp, force: true, dryRun: false });
    assert.equal(await readFile(claude, "utf8"), "MY PROJECT MEMORY");
  });

  it("tolerates and preserves a legacy phases config while bumping version", async () => {
    const cfg = join(tmp, "opftr.config.json");
    await writeFile(
      cfg,
      JSON.stringify({ version: "0.0.1", phases: { spec: "anthropic" } }),
      "utf8",
    );
    // Ensure there is at least one file to apply so the version-bump path runs.
    await writeFile(agent(), "TAMPERED-AGAIN", "utf8");
    const { runUpdate } = await import(UPDATE);
    const code = await runUpdate({ targetDir: tmp, force: true, dryRun: false });
    assert.equal(code, 0);
    const parsed = JSON.parse(await readFile(cfg, "utf8"));
    assert.equal(parsed.phases?.spec, "anthropic", "legacy phases preserved");
    assert.notEqual(parsed.version, "0.0.1", "version was bumped");
  });

  it("requires an opftr.config.json", async () => {
    const empty = await mkdtemp(join(tmpdir(), "opftr-noconfig-"));
    try {
      const { runUpdate } = await import(UPDATE);
      const code = await runUpdate({ targetDir: empty, force: true, dryRun: false });
      assert.equal(code, 2);
    } finally {
      await rm(empty, { recursive: true, force: true });
    }
  });
});
