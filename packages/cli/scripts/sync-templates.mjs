#!/usr/bin/env node
/**
 * sync-templates.mjs — Dogfooding: copy the workspace's `.claude/` and `CLAUDE.md`
 * into `packages/cli/templates/` so the published package ships them as scaffolding source.
 *
 * Single source of truth is the workspace root. This script is idempotent and run
 * during `prepack` (before publish) and `build`. Committing the result is optional —
 * a CI check (later) can re-run this and fail if the working tree changes.
 */
import { mkdir, rm, readdir, readFile, writeFile, stat, chmod } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname, relative, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliRoot = resolve(__dirname, "..");
const workspaceRoot = resolve(cliRoot, "..", "..");
const templatesDir = resolve(cliRoot, "templates");

/**
 * Allowlist of paths (relative to workspaceRoot) that get copied into templates/.
 * Keep this conservative: only the scaffolding source.
 */
const ALLOWLIST = [".claude", "CLAUDE.md"];

/**
 * Within `.claude/`, exclude these dirs/files even though they match the allowlist.
 */
const EXCLUDES_INSIDE_CLAUDE = new Set([
  "agent-memory-local", // per-user, gitignored
]);

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

  for (const entry of ALLOWLIST) {
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
