import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join, relative, dirname } from "node:path";
import { getTemplatesDir } from "../utils/paths.js";
import { c, confirm, line, errLine } from "../utils/term.js";

export interface UpdateOptions {
  targetDir: string;
  force: boolean;
  dryRun: boolean;
}

interface UpdateOp {
  src: string;
  dst: string;
  kind: "new" | "update" | "unchanged";
}

// Paths relative to targetDir that belong entirely to the user — never overwrite.
const NEVER_UPDATE_FILES = new Set([
  "CLAUDE.md",
  "opftr.config.json",
  // User-generated spec artifacts (created by /factory-init or hand-edited):
  ".claude/specs/constitution.md",
  ".claude/specs/workflow.md",
  ".claude/specs/SPEC.md",
  ".claude/specs/prd.md",
  ".claude/specs/rfc.md",
]);

// Relative path prefixes (with trailing slash) that are entirely user-owned.
const NEVER_UPDATE_PREFIXES = [
  ".claude/specs/tasks/",
  ".claude/specs/diagrams/",
  ".claude/specs/drafts/",
];

function isProtected(relPath: string): boolean {
  if (NEVER_UPDATE_FILES.has(relPath)) return true;
  return NEVER_UPDATE_PREFIXES.some((prefix) => relPath.startsWith(prefix));
}

async function fileChecksum(filePath: string): Promise<string> {
  const data = await readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

async function walkTemplates(
  tmplDir: string,
  targetDir: string,
  tmplRoot: string,
  ops: UpdateOp[],
): Promise<void> {
  const entries = await readdir(tmplDir, { withFileTypes: true });

  for (const entry of entries) {
    const tmplPath = join(tmplDir, entry.name);
    const relFromRoot = relative(tmplRoot, tmplPath);

    // Skip user-owned paths (CLAUDE.md, specs, tasks, drafts, …).
    if (isProtected(relFromRoot)) continue;

    const dstPath = join(targetDir, relFromRoot);

    if (entry.isDirectory()) {
      await walkTemplates(tmplPath, targetDir, tmplRoot, ops);
    } else {
      if (!existsSync(dstPath)) {
        ops.push({ src: tmplPath, dst: dstPath, kind: "new" });
      } else {
        const [srcSum, dstSum] = await Promise.all([
          fileChecksum(tmplPath),
          fileChecksum(dstPath),
        ]);
        ops.push({
          src: tmplPath,
          dst: dstPath,
          kind: srcSum === dstSum ? "unchanged" : "update",
        });
      }
    }
  }
}

export async function runUpdate(opts: UpdateOptions): Promise<number> {
  const targetDir = resolve(process.cwd(), opts.targetDir);
  const templatesDir = getTemplatesDir();

  if (!existsSync(templatesDir)) {
    errLine(`${c.red("Templates directory not found at:")} ${templatesDir}`);
    return 2;
  }

  // Require an opftr.config.json so we only update real opftr projects.
  const configPath = join(targetDir, "opftr.config.json");
  if (!existsSync(configPath)) {
    errLine(`${c.red("No opftr.config.json found in")} ${targetDir}`);
    errLine(`Run ${c.bold("opftr init")} first.`);
    return 2;
  }

  // Read the config for its version. Legacy fields (e.g. a `phases` map written
  // by older multi-provider releases) are tolerated and preserved untouched.
  let config: { version?: string; [k: string]: unknown };
  try {
    config = JSON.parse(await readFile(configPath, "utf8")) as typeof config;
  } catch {
    errLine(
      `${c.red("Could not parse opftr.config.json")} — run ${c.bold("opftr init --force")} to reset it.`,
    );
    return 2;
  }

  const pkgVersion = await getPkgVersion();

  line(`${c.bold("opftr update")} → ${c.cyan(targetDir)}  ${c.dim("[Claude Code]")}`);
  line(`${c.dim("templates:")} ${c.dim(templatesDir)}`);
  if (config.version && config.version !== pkgVersion) {
    line(`${c.dim("version:")} ${c.yellow(config.version)} → ${c.cyan(pkgVersion)}`);
  }
  line();

  // Walk templates and collect update operations.
  const ops: UpdateOp[] = [];
  await walkTemplates(templatesDir, targetDir, templatesDir, ops);

  const toApply = ops.filter((op) => op.kind !== "unchanged");
  const newCount = ops.filter((op) => op.kind === "new").length;
  const updateCount = ops.filter((op) => op.kind === "update").length;

  if (toApply.length === 0) {
    line(c.dim("Everything is up to date."));
    return 0;
  }

  // Print plan.
  for (const op of toApply) {
    const rel = relative(targetDir, op.dst);
    const marker =
      op.kind === "new" ? c.cyan("+ new file ") : c.yellow("~ update    ");
    line(`  ${marker}  ${c.dim(rel)}`);
  }
  line();
  line(
    `${c.dim(newCount + " new,  " + updateCount + " updated")}` +
      (opts.dryRun ? c.dim("  (dry run)") : ""),
  );
  line();

  if (opts.dryRun) {
    line(c.dim("Dry run — no files were written."));
    return 0;
  }

  if (!opts.force && toApply.some((op) => op.kind === "update")) {
    if (!process.stdin.isTTY) {
      errLine(
        `${c.red("Files would be overwritten in non-interactive mode.")} Pass ${c.bold("--force")} to proceed.`,
      );
      return 2;
    }
    const ok = await confirm(
      `Apply ${updateCount} update(s) and add ${newCount} new file(s)?`,
      true,
    );
    if (!ok) {
      line(c.dim("Aborted."));
      return 1;
    }
  }

  // Apply.
  for (const op of toApply) {
    await mkdir(dirname(op.dst), { recursive: true });
    await cp(op.src, op.dst, { force: true });
    const rel = relative(targetDir, op.dst);
    line(`  ${c.cyan("✓")} ${rel}`);
  }

  // Bump version in opftr.config.json (preserving any legacy fields).
  const updatedConfig = { ...config, version: pkgVersion };
  await writeFile(configPath, JSON.stringify(updatedConfig, null, 2) + "\n", "utf8");
  line(`  ${c.cyan("✓")} opftr.config.json ${c.dim("(version → " + pkgVersion + ")")}`);

  line();
  line(c.bold("Done."));
  return 0;
}

async function getPkgVersion(): Promise<string> {
  try {
    const { createRequire } = await import("node:module");
    const req = createRequire(import.meta.url);
    const pkg = req("../../package.json") as { version: string };
    return pkg.version;
  } catch {
    return "unknown";
  }
}
