import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { getTemplatesDir } from "../utils/paths.js";
import { c, confirm, errLine, line } from "../utils/term.js";

/** The Claude Code project-memory file scaffolded at the target root. */
const MEMORY_FILE = "CLAUDE.md";

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
    errLine(`Run ${c.bold("pnpm --filter opftr sync")} first.`);
    return 2;
  }

  // ── Header ────────────────────────────────────────────────────────────────
  line(`${c.bold("opftr init")} → ${c.cyan(targetDir)}  ${c.dim("[Claude Code]")}`);
  line(`${c.dim("templates:")} ${c.dim(templatesDir)}`);
  line();

  // ── Plan what to copy ─────────────────────────────────────────────────────
  await mkdir(targetDir, { recursive: true });

  const planned: PlannedCopy[] = [];
  const entries = await readdir(templatesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === MEMORY_FILE && opts.skipClaudeMd) continue;
    const src = join(templatesDir, entry.name);
    const dst = join(targetDir, entry.name);
    planned.push({
      src,
      dst,
      kind: entry.isDirectory() ? "directory" : "file",
      exists: existsSync(dst),
    });
  }

  // opftr.config.json always written.
  const configDst = join(targetDir, "opftr.config.json");
  planned.push({ src: "", dst: configDst, kind: "file", exists: existsSync(configDst) });

  // ── Print plan ────────────────────────────────────────────────────────────
  for (const p of planned) {
    const marker = p.exists
      ? p.kind === "directory"
        ? c.yellow("~ overwrite dir ")
        : c.yellow("~ overwrite file")
      : p.kind === "directory"
        ? c.cyan("+ new dir ")
        : c.cyan("+ new file");
    line(`  ${marker}  ${c.dim(p.dst.replace(targetDir + "/", ""))}`);
  }
  line();

  if (opts.dryRun) {
    line(c.dim("Dry run — no files were written."));
    return 0;
  }

  // Confirm overwrites.
  const collisions = planned.filter((p) => p.exists);
  if (collisions.length > 0 && !opts.force && !opts.yes) {
    if (!process.stdin.isTTY) {
      errLine(
        `${c.red("Refusing to overwrite existing files in non-interactive mode.")} ` +
          `Pass ${c.bold("--force")} or ${c.bold("--yes")} to proceed.`,
      );
      return 2;
    }
    const ok = await confirm(`Overwrite ${collisions.length} existing item(s)?`, false);
    if (!ok) {
      line(c.dim("Aborted by user."));
      return 1;
    }
  }

  // ── Apply ─────────────────────────────────────────────────────────────────
  const pkgVersion = await getInitPkgVersion();
  for (const p of planned) {
    if (p.src === "") {
      await writeFile(
        p.dst,
        JSON.stringify({ version: pkgVersion }, null, 2) + "\n",
        "utf8",
      );
    } else {
      await cp(p.src, p.dst, { recursive: true, force: true });
    }
    line(`  ${c.cyan("✓")} ${p.dst.replace(targetDir + "/", "")}`);
  }

  line();
  line(c.bold("Done."));
  line("Next steps:");
  line(
    `  1. Review ${c.cyan(".claude/specs/SPEC.md")} and ${c.cyan(".claude/specs/constitution.md")}`,
  );
  line(
    `  2. Open ${c.cyan("claude")} in this directory ${c.dim("(reads CLAUDE.md + .claude/agents/)")}`,
  );
  line(
    `  3. Run ${c.cyan("/factory-init")} in Claude Code to bootstrap your project (PRD → RFC → Workflow)`,
  );
  return 0;
}

function isSameOrAncestor(target: string, candidate: string): boolean {
  const t = target.endsWith("/") ? target : target + "/";
  const candate = candidate.endsWith("/") ? candidate : candidate + "/";
  return candate.startsWith(t);
}

async function getInitPkgVersion(): Promise<string> {
  try {
    const { createRequire } = await import("node:module");
    const req = createRequire(import.meta.url);
    const pkg = req("../../package.json") as { version: string };
    return pkg.version;
  } catch {
    return "0.1.0";
  }
}
