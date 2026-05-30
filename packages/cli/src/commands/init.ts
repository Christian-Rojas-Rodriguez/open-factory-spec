import { access, cp, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { getTemplatesDir } from "../utils/paths.js";
import { c, confirm, errLine, line, selectOne } from "../utils/term.js";
import {
  DEFAULT_PROVIDER,
  findProvider,
  type Provider,
  type ProviderId,
  PROVIDERS,
} from "../utils/providers.js";
import {
  PHASES,
  singleProvider,
  usedProviders,
  type PhaseId,
  type PhaseMap,
} from "../utils/phases.js";

export interface InitOptions {
  targetDir: string;
  force: boolean;
  dryRun: boolean;
  skipClaudeMd: boolean;
  yes: boolean;
  /** Shorthand: same provider for all phases. */
  provider?: ProviderId;
  /** Per-phase overrides. Take precedence over `provider`. */
  specProvider?: ProviderId;
  codeProvider?: ProviderId;
  reviewProvider?: ProviderId;
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
    errLine(`Run ${c.bold("pnpm --filter @open-factory/cli sync")} first.`);
    return 2;
  }

  // ── Phase / provider resolution ───────────────────────────────────────────
  let phases: PhaseMap;

  const hasPerPhaseFlags =
    opts.specProvider || opts.codeProvider || opts.reviewProvider;

  if (hasPerPhaseFlags) {
    const base = opts.provider ?? DEFAULT_PROVIDER.id;
    phases = {
      spec: opts.specProvider ?? base,
      code: opts.codeProvider ?? base,
      review: opts.reviewProvider ?? base,
    };
  } else if (opts.provider) {
    phases = singleProvider(opts.provider);
  } else if (opts.yes || !process.stdin.isTTY) {
    phases = singleProvider(DEFAULT_PROVIDER.id);
  } else {
    line(`${c.bold("opftr init")} — ${c.dim("spec-as-source agent factory")}`);
    line();

    const multiPhase = !(await confirm(
      `${c.bold("?")} Same provider for all phases?`,
      true,
    ));
    line();

    if (multiPhase) {
      const phaseMap: Partial<PhaseMap> = {};
      for (const phase of PHASES) {
        const colorFn = c[phase.color];
        const chosen = await selectOne(
          `${c.bold("?")} ${colorFn(phase.label)}  ${c.dim(phase.hint)}`,
          PROVIDERS.map((p) => ({ label: p.label, value: p.id as ProviderId })),
          0,
        );
        phaseMap[phase.id as PhaseId] = chosen;
        line();
      }
      phases = phaseMap as PhaseMap;
    } else {
      const chosen = await selectOne(
        `${c.bold("?")} Select your AI provider:`,
        PROVIDERS.map((p) => ({ label: p.label, value: p.id as ProviderId })),
        0,
      );
      phases = singleProvider(chosen);
      line();
    }
  }

  // Validate all phase providers.
  for (const [phaseId, providerId] of Object.entries(phases)) {
    if (!findProvider(providerId)) {
      errLine(
        `${c.red("Unknown provider for")} ${phaseId} ${c.red("phase:")} ${providerId}`,
      );
      errLine(`Valid choices: ${PROVIDERS.map((p) => c.bold(p.id)).join(", ")}`);
      return 2;
    }
  }

  // Spec phase drives the primary memory file.
  const specProvider = findProvider(phases.spec) as Provider;
  const needed = usedProviders(phases);
  const allSame = needed.length === 1;

  // ── Header ────────────────────────────────────────────────────────────────
  line(
    `${c.bold("opftr init")} → ${c.cyan(targetDir)}  ${c.dim(allSame ? "[" + specProvider.label + "]" : "[multi-phase]")}`,
  );
  line(`${c.dim("templates:")} ${c.dim(templatesDir)}`);
  line();

  if (!allSame) {
    line(c.dim("Phase mapping:"));
    for (const phase of PHASES) {
      const p = findProvider(phases[phase.id as PhaseId]) as Provider;
      const colorFn = c[phase.color];
      line(`  ${colorFn(c.bold(phase.id.padEnd(8)))}${p.label}`);
    }
    line();
  }

  // ── Plan what to copy ─────────────────────────────────────────────────────
  await mkdir(targetDir, { recursive: true });

  const planned: PlannedCopy[] = [];
  const entries = await readdir(templatesDir, { withFileTypes: true });

  for (const entry of entries) {
    const src = join(templatesDir, entry.name);
    const isDir = entry.isDirectory();

    // Provider-specific agent dirs: only copy if that provider is used.
    const matchedProvider = PROVIDERS.find(
      (p) => p.templateDir !== "" && p.templateDir === entry.name,
    );
    if (matchedProvider && !needed.includes(matchedProvider.id)) continue;

    // Primary memory file: CLAUDE.md in template → spec provider's memoryFile.
    if (entry.name === "CLAUDE.md") {
      if (opts.skipClaudeMd) continue;
      const dst = join(targetDir, specProvider.memoryFile);
      planned.push({ src, dst, kind: "file", exists: existsSync(dst) });
      continue;
    }

    // Skip provider-specific flat files not needed.
    if (entry.name === "GEMINI.md" && !needed.includes("gemini")) continue;
    // AGENTS.md is the memory file for both openai and opencode.
    if (
      entry.name === "AGENTS.md" &&
      !needed.includes("openai") &&
      !needed.includes("opencode")
    )
      continue;
    // AGENTS.<agent>.md flat files are only for openai (Codex CLI flat format).
    if (
      entry.name.startsWith("AGENTS.") &&
      entry.name.endsWith(".md") &&
      entry.name !== "AGENTS.md" &&
      !needed.includes("openai")
    )
      continue;
    if (entry.name === "opencode.json" && !needed.includes("opencode"))
      continue;

    const dst = join(targetDir, entry.name);
    planned.push({
      src,
      dst,
      kind: isDir ? "directory" : "file",
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
  for (const p of planned) {
    if (p.src === "") {
      await writeFile(
        p.dst,
        JSON.stringify({ version: "0.1.3", phases }, null, 2) + "\n",
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
  line(`  1. Review ${c.cyan("opftr.config.json")} — your phase-to-provider mapping`);
  line(
    `  2. Review ${c.cyan(".claude/specs/SPEC.md")} and ${c.cyan(".claude/specs/constitution.md")}`,
  );
  line(`  3. Open your spec-phase tool:`);
  line(
    `     ${c.cyan(specProvider.toolCommand)}   (reads ${c.dim(specProvider.memoryFile)} + ${c.dim(specProvider.templateDir + "/agents/")})`,
  );
  if (!allSame) {
    const codeP = findProvider(phases.code) as Provider;
    line(
      `     ${c.cyan(codeP.toolCommand)}   (code phase — reads ${c.dim(codeP.templateDir + "/agents/")})`,
    );
  }
  line(
    `  4. Once Hito A is materialized, run ${c.cyan("/factory-init")} to bootstrap your project`,
  );
  return 0;
}

function isSameOrAncestor(target: string, candidate: string): boolean {
  const t = target.endsWith("/") ? target : target + "/";
  const c = candidate.endsWith("/") ? candidate : candidate + "/";
  return c.startsWith(t);
}

void stat;
void access;
