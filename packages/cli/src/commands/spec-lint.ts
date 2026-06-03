import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { parseFrontmatter, hasSection, sectionLines } from "../utils/frontmatter.js";
import { c, errLine, line } from "../utils/term.js";

export type Severity = "block" | "warn";
export interface Finding {
  severity: Severity;
  message: string;
}
export interface SpecLintResult {
  ok: boolean;
  findings: Finding[];
}

const REQUIRED_FRONTMATTER = [
  "task",
  "slug",
  "granularity",
  "version",
  "status",
  "declares",
  "scope",
];
const REQUIRED_SECTIONS = [
  "What",
  "Why",
  "How",
  "Acceptance criteria",
  "Out of scope",
];
const AMBIGUITY_TOKENS = [
  "properly",
  "correctly",
  "seamlessly",
  "appropriate",
  "etc.",
];

/**
 * Pure Spec linter. `workflowText`, when provided, enables the cross-link check
 * (the Task id must be declared in workflow.md).
 */
export function lintSpecContent(
  content: string,
  opts: { workflowText?: string } = {},
): SpecLintResult {
  const findings: Finding[] = [];
  const fm = parseFrontmatter(content);

  if (!fm) {
    return {
      ok: false,
      findings: [
        { severity: "block", message: "missing YAML frontmatter (--- … ---)" },
      ],
    };
  }

  for (const key of REQUIRED_FRONTMATTER) {
    if (!fm.has.has(key)) {
      findings.push({
        severity: "block",
        message: `frontmatter missing required key: ${key}`,
      });
    }
  }

  const version = fm.data["version"];
  if (version && !/^\d+\.\d+\.\d+$/.test(version)) {
    findings.push({
      severity: "block",
      message: `version is not SemVer (x.y.z): "${version}"`,
    });
  }

  for (const title of REQUIRED_SECTIONS) {
    if (!hasSection(fm.body, title)) {
      findings.push({
        severity: "block",
        message: `missing required section: ## ${title}`,
      });
    }
  }

  // Acceptance criteria must have at least one enumerated entry.
  const acItems = sectionLines(fm.body, "Acceptance criteria").filter((l) =>
    /^\s*(\d+\.|[-*])\s+/.test(l),
  );
  if (hasSection(fm.body, "Acceptance criteria") && acItems.length === 0) {
    findings.push({
      severity: "block",
      message: "## Acceptance criteria has no enumerated entries",
    });
  }
  for (const item of acItems) {
    const lower = item.toLowerCase();
    for (const token of AMBIGUITY_TOKENS) {
      if (lower.includes(token)) {
        findings.push({
          severity: "warn",
          message: `ambiguity token "${token}" in acceptance criterion: ${item.trim().slice(0, 70)}`,
        });
      }
    }
  }

  // Cross-link: the Task must be declared in the Workflow.
  const task = fm.data["task"];
  if (opts.workflowText && task && !opts.workflowText.includes(task)) {
    findings.push({
      severity: "block",
      message: `Task ${task} is not declared in workflow.md`,
    });
  }

  return { ok: !findings.some((f) => f.severity === "block"), findings };
}

export interface SpecLintOptions {
  file: string;
}

export async function runSpecLint(opts: SpecLintOptions): Promise<number> {
  const file = resolve(process.cwd(), opts.file);
  if (!existsSync(file)) {
    errLine(`${c.red("spec-lint:")} file not found: ${file}`);
    return 2;
  }
  const content = await readFile(file, "utf8");

  // workflow.md sits two levels up from a task spec: specs/tasks/x.md → specs/workflow.md
  const workflowPath = resolve(dirname(file), "..", "workflow.md");
  let workflowText: string | undefined;
  if (existsSync(workflowPath)) {
    workflowText = await readFile(workflowPath, "utf8");
  }

  const result = lintSpecContent(content, { workflowText });

  for (const f of result.findings) {
    const tag = f.severity === "block" ? c.red("block") : c.yellow("warn ");
    errLine(`  ${tag}  ${f.message}`);
  }

  if (result.ok) {
    line(`${c.cyan("✓")} spec-lint: ${opts.file} ${c.dim("(" + result.findings.length + " warning(s))")}`);
    return 0;
  }
  errLine(`${c.red("✗")} spec-lint: ${opts.file} has blocking issues.`);
  return 2;
}
