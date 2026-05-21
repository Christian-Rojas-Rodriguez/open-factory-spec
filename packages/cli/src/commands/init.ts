import { access, cp, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { getTemplatesDir } from "../utils/paths.js";
import { c, confirm, errLine, line } from "../utils/term.js";

export interface InitOptions {
  targetDir: string;
  force: boolean;
  dryRun: boolean;
  skipClaudeMd: boolean;
  yes: boolean;
}

interface PlannedCopy {
  src: string;
  dst: string;
  kind: "directory" | "file";
  exists: boolean;
}

export async function runInit(opts: InitOptions): Promise<number> {
  const targetDir = resolve(process.cwd(), opts.targetDir);
  const templatesDir = getTemplatesDir();

  // Self-bootstrap guard: refuse to overwrite ourselves unless --force.
  // Detect by checking if target IS the workspace that contains templatesDir.
  if (isSameOrAncestor(targetDir, templatesDir) && !opts.force) {
    errLine(
      `${c.red("Refusing to scaffold into the open-factory-spec source tree itself.")}`,
    );
    errLine(`Use ${c.bold("--force")} if you really mean to overwrite the source.`);
    return 2;
  }

  // Verify the templates directory exists.
  if (!existsSync(templatesDir)) {
    errLine(`${c.red("Templates directory not found at:")} ${templatesDir}`);
    errLine(`Run ${c.bold("pnpm --filter @open-factory/cli sync")} first.`);
    return 2;
  }

  line(`${c.bold("open-factory init")} → ${c.cyan(targetDir)}`);
  line(`${c.dim("templates:")} ${c.dim(templatesDir)}`);
  line();

  await mkdir(targetDir, { recursive: true });

  const planned: PlannedCopy[] = [];
  const entries = await readdir(templatesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "CLAUDE.md" && opts.skipClaudeMd) continue;
    const src = join(templatesDir, entry.name);
    const dst = join(targetDir, entry.name);
    planned.push({
      src,
      dst,
      kind: entry.isDirectory() ? "directory" : "file",
      exists: existsSync(dst),
    });
  }

  // Print the plan.
  for (const p of planned) {
    const marker = p.exists
      ? p.kind === "directory"
        ? c.yellow("⚠ overwrite dir")
        : c.yellow("⚠ overwrite file")
      : p.kind === "directory"
        ? c.green("+ new dir")
        : c.green("+ new file");
    line(`  ${marker}  ${p.dst.replace(targetDir + "/", "")}`);
  }
  line();

  if (opts.dryRun) {
    line(c.dim("Dry run — no files were written."));
    return 0;
  }

  // Confirm overwrites if any exist and we don't have --force/--yes.
  const collisions = planned.filter((p) => p.exists);
  if (collisions.length > 0 && !opts.force && !opts.yes) {
    if (!process.stdin.isTTY) {
      errLine(
        `${c.red("Refusing to overwrite existing files in non-interactive mode.")} ` +
          `Pass ${c.bold("--force")} or ${c.bold("--yes")} to proceed.`,
      );
      return 2;
    }
    const ok = await confirm(
      `Overwrite ${collisions.length} existing item(s)?`,
      false,
    );
    if (!ok) {
      line(c.dim("Aborted by user."));
      return 1;
    }
  }

  // Apply.
  for (const p of planned) {
    await cp(p.src, p.dst, { recursive: true, force: true });
    line(`  ${c.green("✓")} ${p.dst.replace(targetDir + "/", "")}`);
  }

  line();
  line(c.bold("Done."));
  line(`Next steps:`);
  line(`  1. Review ${c.cyan(".claude/specs/SPEC.md")} and ${c.cyan(".claude/specs/constitution.md")}`);
  line(`  2. Choose your runtime:`);
  line(`     • Claude Code  → ${c.cyan("claude")}  (reads ${c.dim("CLAUDE.md")} + ${c.dim(".claude/agents/")})`);
  line(`     • Gemini CLI   → ${c.cyan("gemini")}  (reads ${c.dim("GEMINI.md")} + ${c.dim(".gemini/agents/")})`);
  line(`     • OpenCode     → ${c.cyan("opencode")} (reads ${c.dim(".opencode/agents/")})`);
  line(`  3. Once Hito A is materialized, run ${c.cyan("/factory-init")} to bootstrap your project`);
  return 0;
}

function isSameOrAncestor(target: string, candidate: string): boolean {
  const t = target.endsWith("/") ? target : target + "/";
  const c = candidate.endsWith("/") ? candidate : candidate + "/";
  return c.startsWith(t);
}

// Suppress unused warning for stat/access imports we may use later.
void stat;
void access;
