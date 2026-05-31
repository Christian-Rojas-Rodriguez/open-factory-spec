#!/usr/bin/env node
/**
 * sync-templates.mjs — Dogfooding: copy the workspace's `.claude/` and `CLAUDE.md`
 * into `packages/cli/templates/` so the published package ships them as scaffolding source.
 *
 * Single source of truth is the workspace root. After the main sync, generic
 * user-facing overrides from `packages/cli/template-overrides/` are applied on top,
 * replacing project-specific files with starter templates appropriate for new users.
 *
 * This script is idempotent and run during `prepack` (before publish) and `build`.
 */
import { mkdir, rm, readdir, readFile, writeFile, stat, chmod, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname, relative, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliRoot = resolve(__dirname, "..");
const workspaceRoot = resolve(cliRoot, "..", "..");
const templatesDir = resolve(cliRoot, "templates");
const overridesDir = resolve(cliRoot, "template-overrides");

/**
 * Allowlist of paths (relative to workspaceRoot) that get copied into templates/.
 * Keep this conservative: only the scaffolding source.
 */
const ALLOWLIST = [".claude", "CLAUDE.md", ".gemini", "GEMINI.md", ".opencode", "AGENTS.md", "opencode.json"];

/**
 * Glob prefixes: any file in workspaceRoot whose name starts with one of these
 * strings will also be included. Use for multi-file patterns like AGENTS.*.md.
 */
const GLOB_PREFIXES = ["AGENTS."];

/**
 * Within `.claude/`, exclude these dirs/files even though they match the allowlist.
 * These are project-specific or per-user artifacts that must not ship to new users.
 */
const EXCLUDES_INSIDE_CLAUDE = new Set([
  "agent-memory-local", // per-user, gitignored
]);

/**
 * Files to delete from templates/ after the main sync, relative to templatesDir.
 * These are project-specific opftr artifacts that get replaced by overrides or
 * should simply not exist in a fresh user scaffold.
 */
const POST_SYNC_DELETIONS = [
  ".claude/specs/prd.md",          // opftr's own approved PRD — user creates theirs via /factory-init
  ".claude/specs/rfc.md",          // opftr's own approved RFC — user creates theirs via /factory-init
  ".claude/specs/tasks/0005-researcher-agent.md", // opftr-specific task spec
];

async function main() {
  process.stdout.write(`Syncing templates from ${relative(cliRoot, workspaceRoot) || "."}\n`);
  process.stdout.write(`  cli root:  ${cliRoot}\n`);
  process.stdout.write(`  ws  root:  ${workspaceRoot}\n`);
  process.stdout.write(`  templates: ${templatesDir}\n`);

  // Fresh templates dir.
  await rm(templatesDir, { recursive: true, force: true });
  await mkdir(templatesDir, { recursive: true });

  let copied = 0;
  let skipped = 0;

  // Expand GLOB_PREFIXES: include any root file whose name starts with a prefix.
  const rootEntries = await readdir(workspaceRoot, { withFileTypes: true });
  const prefixMatches = rootEntries
    .filter((e) => e.isFile() && GLOB_PREFIXES.some((p) => e.name.startsWith(p)))
    .map((e) => e.name);
  const fullList = [...new Set([...ALLOWLIST, ...prefixMatches])];

  for (const entry of fullList) {
    const from = resolve(workspaceRoot, entry);
    const to = resolve(templatesDir, entry);
    if (!existsSync(from)) {
      process.stdout.write(`  ${dim("skip")}  ${entry} (not found)\n`);
      skipped += 1;
      continue;
    }
    await copyTree(from, to, entry);
    process.stdout.write(`  ${green("ok  ")}  ${entry}\n`);
    copied += 1;
  }

  process.stdout.write(`\nSynced ${copied}, skipped ${skipped}.\n`);

  // Remove project-specific files that must not ship to users.
  let deleted = 0;
  for (const rel of POST_SYNC_DELETIONS) {
    const target = resolve(templatesDir, rel);
    if (existsSync(target)) {
      await unlink(target);
      process.stdout.write(`  ${dim("del ")}  ${rel}\n`);
      deleted += 1;
    }
  }
  if (deleted > 0) {
    process.stdout.write(`Removed ${deleted} project-specific file(s).\n`);
  }

  // Apply generic user-facing overrides on top of the synced files.
  if (existsSync(overridesDir)) {
    process.stdout.write(`\nApplying overrides from template-overrides/\n`);
    let overridden = 0;
    await applyOverrides(overridesDir, templatesDir, overridesDir, overridden);
    // Count is tracked inside applyOverrides via side-effect logging; just signal done.
    process.stdout.write(`Overrides applied.\n`);
  }

  process.stdout.write(`\nDone.\n`);
}

/**
 * Copy everything from overridesDir into templatesDir, preserving relative paths.
 */
async function applyOverrides(from, toBase, overridesRoot, _count) {
  const s = await stat(from);
  if (s.isDirectory()) {
    await mkdir(resolve(toBase, relative(overridesRoot, from)), { recursive: true });
    const entries = await readdir(from, { withFileTypes: true });
    for (const e of entries) {
      await applyOverrides(join(from, e.name), toBase, overridesRoot, _count);
    }
  } else if (s.isFile()) {
    const relPath = relative(overridesRoot, from);
    const dest = resolve(toBase, relPath);
    await mkdir(resolve(dest, ".."), { recursive: true });
    const data = await readFile(from);
    await writeFile(dest, data);
    process.stdout.write(`  ${green("over")}  ${relPath}\n`);
  }
}

/**
 * Recursive copy that does NOT preserve extended attributes (avoids macOS EPERM
 * on `com.apple.provenance` xattrs set by editors). Preserves executable bit.
 */
async function copyTree(from, to, rootEntryName, depth = 0) {
  const s = await stat(from);
  if (s.isDirectory()) {
    await mkdir(to, { recursive: true });
    const entries = await readdir(from, { withFileTypes: true });
    for (const e of entries) {
      // Apply EXCLUDES_INSIDE_CLAUDE only at the top of the .claude/ tree.
      if (rootEntryName === ".claude" && depth === 0 && EXCLUDES_INSIDE_CLAUDE.has(e.name)) {
        continue;
      }
      await copyTree(join(from, e.name), join(to, e.name), rootEntryName, depth + 1);
    }
  } else if (s.isFile()) {
    const data = await readFile(from);
    await writeFile(to, data);
    // Preserve executable bit (matters for hook scripts).
    if ((s.mode & 0o111) !== 0) {
      await chmod(to, 0o755);
    }
  }
}

function dim(s) {
  return process.stdout.isTTY ? `\x1b[2m${s}\x1b[22m` : s;
}
function green(s) {
  return process.stdout.isTTY ? `\x1b[32m${s}\x1b[39m` : s;
}

main().catch((err) => {
  process.stderr.write(`sync-templates failed: ${err?.stack ?? err}\n`);
  process.exit(1);
});
